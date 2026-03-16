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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
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

// Mock data for development before backend is ready
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
