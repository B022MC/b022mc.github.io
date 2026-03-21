"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  ArrowLeft,
  Eye,
  Pencil,
  Loader2,
  X,
  Plus,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { api, isAuthError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { renderMarkdown } from "@/lib/markdown";
import { PageTransition } from "@/components/animation/page-transition";

interface EditorDraft {
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  tags: string[];
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeTags(values: string[]) {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeTag(value);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(normalized);
  }

  return deduped;
}

function buildDraft(input: EditorDraft): EditorDraft {
  return {
    title: input.title.trim(),
    summary: input.summary.trim(),
    content: input.content.trim(),
    coverImage: input.coverImage.trim(),
    tags: normalizeTags(input.tags),
  };
}

function serializeDraft(draft: EditorDraft) {
  return JSON.stringify(draft);
}

function getValidationErrors(draft: EditorDraft) {
  return {
    title: draft.title ? "" : "请输入文章标题",
    content: draft.content ? "" : "请输入文章内容",
  };
}

function EditorContent() {
  const { isLoggedIn, token, logout, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const nextTarget = editId ? `/admin/edit?id=${editId}` : "/admin/edit";
  const authHref = `/auth?next=${encodeURIComponent(nextTarget)}&reason=unauthorized`;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(!!editId);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    serializeDraft(
      buildDraft({
        title: "",
        summary: "",
        content: "",
        coverImage: "",
        tags: [],
      }),
    ),
  );

  const redirectToAuth = useCallback((reason: "unauthorized" | "expired") => {
    logout();
    router.replace(`/auth?next=${encodeURIComponent(nextTarget)}&reason=${reason}`);
  }, [logout, nextTarget, router]);

  const loadArticle = useCallback(async () => {
    if (!editId) return;
    try {
      const articles = await api.articles.list(1, 100);
      const article = articles.items.find((a) => a.id === Number(editId));
      if (article) {
        setTitle(article.title);
        setSummary(article.summary);
        setContent(article.content);
        setCoverImage(article.coverImage || "");
        setTags(normalizeTags(article.tags));
        setInitialSnapshot(
          serializeDraft(
            buildDraft({
              title: article.title,
              summary: article.summary,
              content: article.content,
              coverImage: article.coverImage || "",
              tags: article.tags,
            }),
          ),
        );
      }
    } finally {
      setLoadingArticle(false);
    }
  }, [editId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    if (!preview) {
      return;
    }

    const previewSource = content.trim();
    if (!previewSource) {
      setPreviewHtml("");
      return;
    }

    let cancelled = false;
    renderMarkdown(previewSource).then((html) => {
      if (!cancelled) {
        setPreviewHtml(html);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [preview, content]);

  const currentDraft = buildDraft({
    title,
    summary,
    content,
    coverImage,
    tags,
  });
  const validationErrors = getValidationErrors(currentDraft);
  const hasUnsavedChanges =
    serializeDraft(currentDraft) !== initialSnapshot || tagInput.trim().length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const confirmDiscardChanges = useCallback(() => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm("当前有未保存的内容，确定要离开编辑页吗？");
  }, [hasUnsavedChanges]);

  const handleAddTag = () => {
    const tag = normalizeTag(tagInput);
    if (!tag) {
      setTagError("标签不能为空");
      return;
    }

    if (tags.some((value) => value.toLowerCase() === tag.toLowerCase())) {
      setTagError(`标签“${tag}”已存在`);
      return;
    }

    setTags((prev) => [...prev, tag]);
    setTagInput("");
    setTagError(null);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    const draft = buildDraft({
      title,
      summary,
      content,
      coverImage,
      tags,
    });
    const nextValidationErrors = getValidationErrors(draft);

    setAttemptedSave(true);
    setSaveError(null);

    if (!token || nextValidationErrors.title || nextValidationErrors.content) {
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: draft.title,
        summary: draft.summary,
        content: draft.content,
        coverImage: draft.coverImage || undefined,
        tags: draft.tags,
      };
      if (editId) {
        await api.articles.update(Number(editId), data, token);
      } else {
        await api.articles.create(data, token);
      }
      setInitialSnapshot(serializeDraft(draft));
      router.push("/admin");
    } catch (error) {
      if (isAuthError(error)) {
        redirectToAuth("expired");
        return;
      }

      setSaveError("保存失败，请重试，当前输入内容已保留。");
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">需要登录</h1>
          <p className="mb-6 text-muted-foreground">请先登录以编辑文章</p>
          <Link
            href={authHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <LogIn size={16} />
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  if (loadingArticle) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              onClick={(event) => {
                if (!confirmDiscardChanges()) {
                  event.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              返回列表
            </Link>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold"
            >
              {editId ? "编辑文章" : "新建文章"}
            </motion.h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                preview
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {preview ? <Pencil size={14} /> : <Eye size={14} />}
              {preview ? "编辑" : "预览"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              保存
            </button>
          </div>
        </div>

        {(saveError || (attemptedSave && (validationErrors.title || validationErrors.content))) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {saveError || "请先修正标题和正文的必填项后再保存。"}
          </motion.div>
        )}

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {attemptedSave && validationErrors.title && (
              <p className="text-sm text-destructive">{validationErrors.title}</p>
            )}
          </div>

          {/* Summary */}
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="文章摘要（可选）"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          {/* Cover Image */}
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="封面图 URL（可选）"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          {/* Tags */}
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  if (tagError && e.target.value.trim()) {
                    setTagError(null);
                  }
                }}
                onKeyDown={handleTagKeyDown}
                placeholder="添加标签，按回车确认"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="rounded-lg border border-border px-3 py-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
            {tagError && <p className="mt-2 text-sm text-destructive">{tagError}</p>}
          </div>

          {/* Content / Preview */}
          {preview ? (
            <div className="min-h-[400px] rounded-lg border border-border bg-card p-6">
              {currentDraft.content ? (
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">预览内容为空，先输入正文再查看。</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="使用 Markdown 编写文章内容..."
                rows={20}
                className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {attemptedSave && validationErrors.content && (
                <p className="text-sm text-destructive">{validationErrors.content}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function EditArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
