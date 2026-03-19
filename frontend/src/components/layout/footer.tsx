"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Rss, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-1"
        >
          &copy; {new Date().getFullYear()} b022mc. Built with
          <Heart size={12} className="text-primary" />
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/feed.xml"
            className="transition-colors hover:text-primary"
            aria-label="RSS Feed"
          >
            <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
              <Rss size={18} />
            </motion.div>
          </Link>
          <Link
            href="https://github.com/b022mc"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
            aria-label="GitHub"
          >
            <motion.div whileHover={{ scale: 1.2, rotate: -10 }}>
              <Github size={18} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </footer>
  );
}
