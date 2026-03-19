"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, type ReactNode } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            animate={inView ? { y: 0 } : { y: "100%" }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.08,
              ease: [0.25, 0.4, 0.25, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

interface RotatingWordsProps {
  words: string[];
  className?: string;
  interval?: number;
}

export function RotatingWords({
  words,
  className,
  interval = 2500,
}: RotatingWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-primary"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({
  end,
  duration = 2,
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;
    const el = numRef.current;
    if (!el) return;
    const start = performance.now();
    const durationMs = duration * 1000;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className={className}>
      <span ref={numRef}>0</span>
      {suffix}
    </span>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span className={`gradient-text ${className ?? ""}`}>
      {children}
    </span>
  );
}
