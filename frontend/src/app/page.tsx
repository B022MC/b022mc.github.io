"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArticleCard } from "@/components/blog/article-card";
import { FadeIn } from "@/components/animation/fade-in";
import { FloatingParticles } from "@/components/animation/floating-particles";
import { GradientText, RotatingWords, TextReveal } from "@/components/animation/text-reveal";
import { fetchArticles, getApiErrorMessage } from "@/lib/api";
import type { Article } from "@/lib/api";
import { ErrorState } from "@/components/feedback/error-state";

const typewriterText = "Code, Think, Share.";
const subtitleWords = ["技术", "编程", "架构", "开源", "云原生"];

function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tags?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-1/8 blur-[100px]"
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -40, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingParticles count={25} />
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            {typewriterText.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.05,
                  delay: 0.5 + i * 0.05,
                  ease: "easeOut",
                }}
              >
                {char}
              </motion.span>
            ))}
            <motion.span
              className="inline-block w-[3px] h-[1em] bg-primary ml-1 align-text-bottom"
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5 + typewriterText.length * 0.05,
              }}
            />
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mx-auto mb-10 max-w-lg text-lg text-muted-foreground"
        >
          记录关于{" "}
          <RotatingWords words={subtitleWords} className="font-medium" />{" "}
          的思考与感悟
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          onSubmit={handleSearch}
          className="mx-auto flex max-w-md items-center gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full rounded-xl border border-border bg-background/80 py-3 pl-10 pr-4 text-sm backdrop-blur-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:shadow-lg focus:shadow-primary/5"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            搜索
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}

function ArticleSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex gap-3">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-4 w-16 rounded" />
      </div>
      <div className="shimmer mb-3 h-6 w-3/4 rounded" />
      <div className="shimmer mb-2 h-4 w-full rounded" />
      <div className="shimmer mb-4 h-4 w-2/3 rounded" />
      <div className="flex gap-2">
        <div className="shimmer h-5 w-14 rounded-full" />
        <div className="shimmer h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchArticles(1, 10);
      setArticles(res.items);
    } catch (error) {
      setArticles([]);
      setError(getApiErrorMessage(error, "最新文章加载失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  return (
    <>
      <HeroSection />

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <FadeIn>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            <GradientText>最新文章</GradientText>
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            <TextReveal delay={0.2}>探索最新的技术分享与思考</TextReveal>
          </p>
        </FadeIn>

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ArticleSkeleton />
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="最新文章暂时不可用"
            message={error}
            onRetry={loadArticles}
          />
        ) : articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
          >
            <p className="text-muted-foreground">暂无文章</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12 },
              },
            }}
            className="flex flex-col gap-5"
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </motion.div>
        )}
      </section>
    </>
  );
}
