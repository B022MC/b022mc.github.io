"use client";

import { motion } from "framer-motion";
import { Github, Mail, MapPin, Code2 } from "lucide-react";
import { FadeIn } from "@/components/animation/fade-in";
import { PageTransition } from "@/components/animation/page-transition";

const techStack = [
  { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { category: "Backend", items: ["Go", "Kratos", "gRPC", "MySQL"] },
  { category: "DevOps", items: ["Docker", "Kubernetes", "GitHub Actions", "K3s"] },
  { category: "Tools", items: ["Git", "VS Code", "Cursor", "Figma"] },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-3xl font-bold tracking-tight"
        >
          关于我
        </motion.h1>

        <div className="grid gap-12 md:grid-cols-[1fr,1.5fr]">
          <FadeIn direction="left">
            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="overflow-hidden rounded-2xl border border-border bg-card p-8"
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Code2 size={40} className="text-primary" />
                </div>
                <h2 className="mb-2 text-xl font-bold">b022mc</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Full-stack Developer
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin size={14} /> China
                  </p>
                  <a
                    href="https://github.com/b022mc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-colors hover:text-foreground"
                  >
                    <Github size={14} /> github.com/b022mc
                  </a>
                  <p className="flex items-center gap-2">
                    <Mail size={14} /> b022mc@example.com
                  </p>
                </div>
              </motion.div>
            </div>
          </FadeIn>

          <div className="space-y-8">
            <FadeIn direction="right" delay={0.1}>
              <div>
                <h3 className="mb-3 text-lg font-semibold">简介</h3>
                <p className="leading-relaxed text-muted-foreground">
                  一名热爱编程的开发者，专注于全栈开发和云原生技术。
                  喜欢探索新技术，分享学习过程中的心得体会。
                  这个博客是我记录技术成长和思考的地方。
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div>
                <h3 className="mb-4 text-lg font-semibold">技术栈</h3>
                <div className="grid grid-cols-2 gap-4">
                  {techStack.map((group, i) => (
                    <motion.div
                      key={group.category}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <h4 className="mb-2 text-sm font-semibold text-primary">
                        {group.category}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.3}>
              <div>
                <h3 className="mb-3 text-lg font-semibold">关于这个博客</h3>
                <p className="leading-relaxed text-muted-foreground">
                  使用 Next.js 16 + Tailwind CSS 4 构建前端，
                  Go Kratos 构建后端微服务，部署在 K3s 集群上。
                  通过 GitHub Actions 实现 CI/CD 自动化。
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
