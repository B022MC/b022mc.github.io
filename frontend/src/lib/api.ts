export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

export interface Comment {
  id: number;
  articleId: number;
  parentId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  children?: Comment[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ApiErrorKind = "http" | "network" | "timeout" | "auth";

interface ApiErrorOptions {
  kind: ApiErrorKind;
  status: number | null;
  path: string;
  details?: unknown;
}

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number | null;
  path: string;
  details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.path = options.path;
    this.details = options.details;
  }
}

const SERVER_API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 10000;
const ENABLE_API_MOCKS =
  process.env.ENABLE_API_MOCKS === "1" ||
  process.env.NEXT_PUBLIC_ENABLE_API_MOCKS === "1";

function getApiBase() {
  // Browser requests should use the current origin so the site can sit
  // behind a single domain and let the ingress route `/api` to blog-api.
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }

  return SERVER_API_BASE;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: unknown) {
  return isApiError(error) && (error.kind === "auth" || error.status === 401 || error.status === 403);
}

function isMockDataEnabled() {
  return ENABLE_API_MOCKS;
}

async function parseResponseBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return res.text();
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildApiErrorMessage(status: number, statusText: string, body: unknown) {
  if (body && typeof body === "object") {
    const errorMessage = "error" in body && typeof body.error === "string"
      ? body.error
      : "message" in body && typeof body.message === "string"
        ? body.message
        : "";
    if (errorMessage) {
      return errorMessage;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  return `API error: ${status} ${statusText}`;
}

async function request<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${getApiBase()}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const body = await parseResponseBody(res);
    if (!res.ok) {
      throw new ApiError(buildApiErrorMessage(res.status, res.statusText, body), {
        kind: res.status === 401 || res.status === 403 ? "auth" : "http",
        status: res.status,
        path,
        details: body,
      });
    }

    return body as T;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, {
        kind: "timeout",
        status: null,
        path,
      });
    }

    throw new ApiError("Network request failed", {
      kind: "network",
      status: null,
      path,
      details: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  articles: {
    list: (page = 1, pageSize = 10, tag?: string) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (tag) params.set("tag", tag);
      return request<PaginatedResponse<Article>>(
        `/api/v1/articles?${params}`,
      );
    },
    get: (slug: string) =>
      request<Article>(`/api/v1/articles/${slug}`),
    search: (q: string, page = 1) =>
      request<PaginatedResponse<Article>>(
        `/api/v1/articles/search?q=${encodeURIComponent(q)}&page=${page}`,
      ),
    create: (data: { title: string; summary: string; content: string; coverImage?: string; tags: string[] }, token: string) =>
      request<Article>("/api/v1/articles", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { title: string; summary: string; content: string; coverImage?: string; tags: string[] }, token: string) =>
      request<Article>(`/api/v1/articles/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      }),
    delete: (id: number, token: string) =>
      request<{ message: string }>(`/api/v1/articles/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      }),
  },
  comments: {
    list: (articleId: number) =>
      request<Comment[]>(`/api/v1/articles/${articleId}/comments`),
    create: (articleId: number, content: string, parentId: number, token: string) =>
      request<Comment>(`/api/v1/articles/${articleId}/comments`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ content, parentId }),
      }),
  },
  auth: {
    login: (username: string, password: string) =>
      request<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, email: string, password: string) =>
      request<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      }),
  },
  tags: {
    list: () => request<string[]>("/api/v1/tags"),
  },
};

export const mockArticles: Article[] = [
  {
    id: 1,
    slug: "hello-world",
    title: "Hello World - 我的第一篇博客",
    summary: "欢迎来到我的个人博客，这是我的第一篇文章。在这里我会分享关于技术、编程和生活的思考。",
    content: "# Hello World\n\n欢迎来到我的个人博客！\n\n## 关于这个博客\n\n这个博客使用 Next.js 16 + Tailwind CSS 4 + Kratos 构建。\n\n## 技术栈\n\n- **前端**: Next.js, React, Tailwind CSS, Framer Motion\n- **后端**: Go, Kratos, gRPC\n- **数据库**: MySQL, Redis\n\n感谢阅读！",
    tags: ["博客", "Next.js", "Go"],
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-03-15T10:00:00Z",
    viewCount: 42,
  },
  {
    id: 2,
    slug: "building-with-kratos",
    title: "使用 Kratos 构建微服务后端",
    summary: "Kratos 是 B 站开源的 Go 微服务框架，本文介绍如何用它构建一个博客后端系统。",
    content: "# 使用 Kratos 构建微服务后端\n\nKratos 是一个轻量级的 Go 微服务框架...",
    tags: ["Go", "Kratos", "微服务"],
    createdAt: "2026-03-14T08:00:00Z",
    updatedAt: "2026-03-14T08:00:00Z",
    viewCount: 128,
  },
  {
    id: 3,
    slug: "framer-motion-animations",
    title: "用 Framer Motion 打造流畅的 Web 动画",
    summary: "探索如何使用 Framer Motion 为 React 应用添加优雅的动画效果，提升用户体验。",
    content: "# Framer Motion 动画指南\n\nFramer Motion 是 React 生态中最流行的动画库...",
    tags: ["React", "动画", "Framer Motion"],
    createdAt: "2026-03-13T14:30:00Z",
    updatedAt: "2026-03-13T14:30:00Z",
    viewCount: 96,
  },
  {
    id: 4,
    slug: "kubernetes-deployment",
    title: "K3s 轻量级 Kubernetes 部署实战",
    summary: "从零开始搭建 K3s 集群，部署你的全栈应用，包含 CI/CD 和自动化部署。",
    content: "# K3s 部署实战\n\nK3s 是轻量级的 Kubernetes 发行版...",
    tags: ["Kubernetes", "DevOps", "K3s"],
    createdAt: "2026-03-12T09:15:00Z",
    updatedAt: "2026-03-12T09:15:00Z",
    viewCount: 210,
  },
  {
    id: 5,
    slug: "tailwind-css-v4",
    title: "Tailwind CSS v4 新特性全解析",
    summary: "Tailwind CSS v4 带来了全新的引擎和诸多改进，让我们一起来看看有哪些变化。",
    content: "# Tailwind CSS v4\n\nTailwind CSS v4 是一个重大更新...",
    tags: ["CSS", "Tailwind", "前端"],
    createdAt: "2026-03-11T16:00:00Z",
    updatedAt: "2026-03-11T16:00:00Z",
    viewCount: 175,
  },
];

/**
 * Fetches articles from the real API. Mock data is only allowed when
 * ENABLE_API_MOCKS or NEXT_PUBLIC_ENABLE_API_MOCKS is explicitly enabled.
 */
export async function fetchArticles(
  page = 1,
  pageSize = 10,
  tag?: string,
): Promise<PaginatedResponse<Article>> {
  try {
    return await api.articles.list(page, pageSize, tag);
  } catch (error) {
    if (!isMockDataEnabled()) {
      throw error;
    }

    const filtered = tag
      ? mockArticles.filter((a) => a.tags.includes(tag))
      : mockArticles;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    return await api.articles.get(slug);
  } catch (error) {
    if (!isMockDataEnabled()) {
      throw error;
    }

    return mockArticles.find((a) => a.slug === slug) ?? null;
  }
}

export async function searchArticles(
  q: string,
  page = 1,
): Promise<PaginatedResponse<Article>> {
  try {
    return await api.articles.search(q, page);
  } catch (error) {
    if (!isMockDataEnabled()) {
      throw error;
    }

    const lower = q.toLowerCase();
    const filtered = mockArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.summary.toLowerCase().includes(lower),
    );
    return {
      items: filtered.slice((page - 1) * 10, page * 10),
      total: filtered.length,
      page,
      pageSize: 10,
    };
  }
}

export async function fetchTags(): Promise<string[]> {
  try {
    return await api.tags.list();
  } catch (error) {
    if (!isMockDataEnabled()) {
      throw error;
    }

    const tagSet = new Set<string>();
    mockArticles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }
}
