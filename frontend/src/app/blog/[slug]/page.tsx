"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Eye, Tag, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchArticle, getApiErrorMessage } from "@/lib/api";
import type { Article } from "@/lib/api";
import { renderMarkdown, extractTOC } from "@/lib/markdown";
import { formatDate, estimateReadingTime } from "@/lib/utils";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { CommentSection } from "@/components/blog/comment-section";
import { PageTransition } from "@/components/animation/page-transition";
import { ErrorState } from "@/components/feedback/error-state";

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticle(slug);
      setArticle(data);
    } catch (error) {
      setArticle(null);
      setHtmlContent("");
      setError(getApiErrorMessage(error, "文章加载失败"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  const tocItems = useMemo(
    () => (article ? extractTOC(article.content) : []),
    [article],
  );

  useEffect(() => {
    if (article) {
      renderMarkdown(article.content).then(setHtmlContent);
    }
  }, [article]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center px-6">
          <ErrorState
            title="文章暂时不可用"
            message={error}
            onRetry={loadArticle}
          />
        </div>
      </PageTransition>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">文章不存在</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <ReadingProgress />

      <article className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </motion.div>

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(article.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {estimateReadingTime(article.content)} 分钟阅读
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {article.viewCount} 阅读
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <Tag size={10} />
                  {tag}
                </Link>
              ))}
            </div>
          </motion.header>
        </div>

        <div className="relative mx-auto flex max-w-6xl gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose prose-neutral dark:prose-invert mx-auto min-w-0 max-w-4xl flex-1"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <aside className="hidden w-56 shrink-0 xl:block">
            <TableOfContents items={tocItems} />
          </aside>
        </div>

        <CommentSection articleId={article.id} />
      </article>
    </PageTransition>
  );
}
