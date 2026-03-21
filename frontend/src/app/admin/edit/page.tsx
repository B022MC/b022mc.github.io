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
        setTags(article.tags);
      }
    } finally {
      setLoadingArticle(false);
    }
  }, [editId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    if (preview && content) {
      renderMarkdown(content).then(setPreviewHtml);
    }
  }, [preview, content]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!token || !title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || undefined,
        tags,
      };
      if (editId) {
        await api.articles.update(Number(editId), data, token);
      } else {
        await api.articles.create(data, token);
      }
      router.push("/admin");
    } catch (error) {
      if (isAuthError(error)) {
        redirectToAuth("expired");
        return;
      }
      alert("保存失败，请重试");
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
              disabled={saving || !title.trim() || !content.trim()}
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

        <div className="space-y-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

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
                onChange={(e) => setTagInput(e.target.value)}
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
          </div>

          {/* Content / Preview */}
          {preview ? (
            <div className="min-h-[400px] rounded-lg border border-border bg-card p-6">
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="使用 Markdown 编写文章内容..."
              rows={20}
              className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
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
