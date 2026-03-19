"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Search, Loader2 } from "lucide-react";
import { fetchArticles, fetchTags, searchArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { ArticleCard } from "@/components/blog/article-card";
import { PageTransition } from "@/components/animation/page-transition";

function TagsContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") || "";
  const initialQuery = searchParams.get("q") || "";

  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async (tag: string, query: string) => {
    setLoading(true);
    try {
      if (query.trim()) {
        const res = await searchArticles(query);
        setArticles(
          tag ? res.items.filter((a) => a.tags.includes(tag)) : res.items,
        );
      } else {
        const res = await fetchArticles(1, 100, tag || undefined);
        setArticles(res.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags().then(setAllTags);
  }, []);

  useEffect(() => {
    loadArticles(selectedTag, searchQuery);
  }, [selectedTag, searchQuery, loadArticles]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-3xl font-bold tracking-tight"
        >
          标签
        </motion.h1>

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
          }}
          className="mb-8 flex flex-wrap gap-2"
        >
          <motion.button
            variants={{
              hidden: { opacity: 0, scale: 0.8, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTag("")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !selectedTag
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            全部
          </motion.button>
          {allTags.map((tag) => (
            <motion.button
              key={tag}
              variants={{
                hidden: { opacity: 0, scale: 0.8, y: 10 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tag === selectedTag
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Tag size={10} />
              {tag}
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTag + searchQuery}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : articles.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                没有找到匹配的文章
              </p>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="flex flex-col gap-4"
              >
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default function TagsPage() {
  return (
    <Suspense>
      <TagsContent />
    </Suspense>
  );
}
