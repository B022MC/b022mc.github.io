"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Loader2 } from "lucide-react";
import { fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/animation/page-transition";

export default function ArchivePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles(1, 200)
      .then((res) => setArticles(res.items))
      .finally(() => setLoading(false));
  }, []);

  const grouped = articles.reduce<Record<string, Article[]>>((acc, article) => {
    const year = new Date(article.createdAt).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(article);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-3xl font-bold tracking-tight"
        >
          归档
        </motion.h1>

        {articles.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">暂无文章</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-[7px] top-0 w-px bg-border"
            />

            {years.map((year, yearIdx) => (
              <div key={year} className="mb-12">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: yearIdx * 0.1 }}
                  className="mb-6 flex items-center gap-4"
                >
                  <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background" />
                  <h2 className="text-xl font-bold">{year}</h2>
                  <span className="text-sm text-muted-foreground">
                    {grouped[year].length} 篇文章
                  </span>
                </motion.div>

                <div className="ml-8 space-y-3">
                  {grouped[year].map((article, idx) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <Link
                        href={`/blog/${article.slug}`}
                        className="group flex items-baseline gap-4 rounded-lg p-2 -ml-2 transition-colors hover:bg-accent/50"
                      >
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          {formatDate(article.createdAt)}
                        </span>
                        <span className="text-sm font-medium transition-colors group-hover:text-primary">
                          {article.title}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
