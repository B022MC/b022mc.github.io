"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Eye, Tag } from "lucide-react";
import { formatDate, estimateReadingTime } from "@/lib/utils";
import type { Article } from "@/lib/api";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Link href={`/blog/${article.slug}`} className="block">
        <div className="rounded-xl border border-border bg-card p-6 transition-colors duration-300 group-hover:border-foreground/20 group-hover:bg-accent/50">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(article.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {article.viewCount} 阅读
            </span>
            <span>{estimateReadingTime(article.content)} 分钟阅读</span>
          </div>

          <h2 className="mb-2 text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
            {article.title}
          </h2>

          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
