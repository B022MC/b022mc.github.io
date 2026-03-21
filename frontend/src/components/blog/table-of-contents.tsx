"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TOCItem } from "@/lib/markdown";

interface TableOfContentsProps {
  items: TOCItem[];
  variant?: "desktop" | "mobile";
  title?: string;
}

export function TableOfContents({
  items,
  variant = "desktop",
  title = "文章目录",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (
      items.length === 0 ||
      typeof window === "undefined" ||
      typeof window.IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0% -75% 0%" },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <ul className="space-y-1 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={cn(
              "relative block rounded-xl py-2 pr-3 transition-colors duration-200",
              item.level === 1 && "pl-3",
              item.level === 2 && "pl-6",
              item.level === 3 && "pl-9",
              activeId === item.id
                ? "bg-primary/8 font-medium text-primary"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
          >
            {activeId === item.id && (
              <motion.span
                layoutId={`toc-indicator-${variant}`}
                className="absolute bottom-2 left-1 top-2 w-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="block text-pretty">{item.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "mobile") {
    return (
      <details className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
          <span>{title}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {items.length} 节
          </span>
        </summary>
        <div className="mt-4 border-t border-border/70 pt-4">
          {list}
        </div>
      </details>
    );
  }

  return (
    <motion.nav
      aria-label={title}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="sticky top-24 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm"
    >
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {list}
    </motion.nav>
  );
}
