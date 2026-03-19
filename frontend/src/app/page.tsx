"use client";

import { motion } from "framer-motion";
import { ArrowDown, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArticleCard } from "@/components/blog/article-card";
import { FadeIn } from "@/components/animation/fade-in";
import { FloatingParticles } from "@/components/animation/floating-particles";
import { Magnetic } from "@/components/animation/magnetic";
import { fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/api";

const typewriterText = "Code, Think, Share.";

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
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
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
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
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
          className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground"
        >
          记录技术成长的轨迹，分享编程中的思考与感悟
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
              className="w-full rounded-lg border border-border bg-background/80 py-2.5 pl-9 pr-4 text-sm backdrop-blur-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-16"
        >
          <Magnetic strength={0.5}>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="cursor-pointer"
            >
              <ArrowDown size={20} className="mx-auto text-muted-foreground" />
            </motion.div>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles(1, 10)
      .then((res) => setArticles(res.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroSection />

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <FadeIn>
          <h2 className="mb-8 text-2xl font-bold tracking-tight">最新文章</h2>
        </FadeIn>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">暂无文章</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="flex flex-col gap-4"
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
