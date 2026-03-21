"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();

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
    if (!article) return;

    let cancelled = false;
    setHtmlContent("");

    void renderMarkdown(article.content).then((content) => {
      if (!cancelled) {
        setHtmlContent(content);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [article]);

  const shouldShowContent =
    !article || article.content.trim().length === 0 || htmlContent.length > 0;

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

      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
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
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
            className="mb-10 space-y-6 sm:mb-12"
          >
            {article.coverImage && (
              <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm">
                <div className="aspect-[16/10] w-full overflow-hidden bg-secondary sm:aspect-[2.4/1]">
                  {/* Keep arbitrary article cover URLs working without widening Next image host config. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>
            )}
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              {article.title}
            </h1>
            {article.summary && (
              <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {article.summary}
              </p>
            )}
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

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 xl:hidden">
            <TableOfContents items={tocItems} variant="mobile" />
          </div>

          {shouldShowContent ? (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: prefersReducedMotion ? 0 : 0.2,
              }}
              className="article-content prose prose-neutral dark:prose-invert mx-auto min-w-0 w-full max-w-4xl flex-1"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <div className="mx-auto w-full max-w-4xl flex-1 rounded-[2rem] border border-border/70 bg-card/60 p-6 shadow-sm">
              <div className="shimmer mb-4 h-6 w-1/3 rounded-full" />
              <div className="shimmer mb-3 h-4 w-full rounded-full" />
              <div className="shimmer mb-3 h-4 w-11/12 rounded-full" />
              <div className="shimmer h-40 w-full rounded-3xl" />
            </div>
          )}

          <aside className="hidden xl:absolute xl:top-0 xl:bottom-0 xl:left-[calc(100%+2rem)] xl:block xl:w-56">
            <TableOfContents items={tocItems} />
          </aside>
        </div>

        <CommentSection articleId={article.id} />
      </article>
    </PageTransition>
  );
}
