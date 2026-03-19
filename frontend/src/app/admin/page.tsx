"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Loader2,
  LogIn,
  Search,
} from "lucide-react";
import Link from "next/link";
import { api, fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/animation/page-transition";

export default function AdminPage() {
  const { isLoggedIn, token } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchArticles(1, 100);
      setArticles(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm("确定要删除这篇文章吗？")) return;
    setDeleting(id);
    try {
      await api.articles.delete(id, token);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.slug.includes(search.toLowerCase()),
      )
    : articles;

  if (!isLoggedIn) {
    return (
      <PageTransition>
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">管理后台</h1>
            <p className="mb-6 text-muted-foreground">请先登录以访问管理功能</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <LogIn size={16} />
              前往登录
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            文章管理
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              href="/admin/edit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              新建文章
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-muted-foreground">
              {search ? "没有找到匹配的文章" : "暂无文章"}
            </p>
            {!search && (
              <Link
                href="/admin/edit"
                className="text-sm text-primary hover:underline"
              >
                创建第一篇文章
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-base font-semibold">
                        {article.title}
                      </h3>
                      <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(article.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {article.viewCount}
                        </span>
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="查看"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() =>
                          router.push(`/admin/edit?id=${article.id}`)
                        }
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="编辑"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        title="删除"
                      >
                        {deleting === article.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </PageTransition>
  );
}
