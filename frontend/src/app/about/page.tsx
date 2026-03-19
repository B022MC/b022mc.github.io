"use client";

import { motion } from "framer-motion";
import { Github, Mail, MapPin, Code2, Terminal, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/animation/fade-in";
import { FloatingParticles } from "@/components/animation/floating-particles";
import { PageTransition } from "@/components/animation/page-transition";

const techStack = [
  { category: "Frontend", icon: "🎨", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { category: "Backend", icon: "⚙️", items: ["Go", "Kratos", "gRPC", "MySQL"] },
  { category: "DevOps", icon: "🚀", items: ["Docker", "Kubernetes", "GitHub Actions", "K3s"] },
  { category: "Tools", icon: "🛠️", items: ["Git", "VS Code", "Cursor", "Figma"] },
];

const timeline = [
  { year: "2026", event: "搭建个人博客，探索全栈开发" },
  { year: "2025", event: "深入云原生技术，学习 Kubernetes" },
  { year: "2024", event: "开始学习 Go 和微服务架构" },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="relative mb-16 overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
          <div className="absolute inset-0 -z-10">
            <FloatingParticles count={15} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center md:flex-row md:text-left md:gap-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="mb-6 flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 md:mb-0"
            >
              <Code2 size={48} className="text-primary" />
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-2 text-3xl font-bold"
              >
                b022mc
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4 flex items-center justify-center gap-2 text-sm text-primary md:justify-start"
              >
                <Terminal size={14} />
                Full-stack Developer
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="leading-relaxed text-muted-foreground"
              >
                一名热爱编程的开发者，专注于全栈开发和云原生技术。
                喜欢探索新技术，分享学习过程中的心得体会。
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> China
                </span>
                <a
                  href="https://github.com/b022mc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Github size={14} /> GitHub
                </a>
                <span className="flex items-center gap-1.5">
                  <Mail size={14} /> b022mc@example.com
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Tech Stack */}
        <FadeIn>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <Sparkles size={20} className="text-primary" />
            技术栈
          </h2>
        </FadeIn>

        <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {techStack.map((group, i) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span>{group.icon}</span>
                {group.category}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, j) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + j * 0.05 }}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <FadeIn>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <Terminal size={20} className="text-primary" />
            成长轨迹
          </h2>
        </FadeIn>

        <div className="mb-16 relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="mb-6 flex items-start gap-4"
            >
              <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background" />
              <div>
                <span className="text-sm font-bold text-primary">
                  {item.year}
                </span>
                <p className="text-sm text-muted-foreground">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Blog info */}
        <FadeIn>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold">关于这个博客</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              使用 Next.js 16 + Tailwind CSS 4 构建前端，
              Go Kratos 构建后端微服务，部署在 K3s 集群上。
              通过 GitHub Actions 实现 CI/CD 自动化。
            </p>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
