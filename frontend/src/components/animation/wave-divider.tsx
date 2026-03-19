"use client";

import { motion } from "framer-motion";

interface WaveDividerProps {
  className?: string;
  flip?: boolean;
}

export function WaveDivider({ className, flip }: WaveDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <motion.svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block h-[40px] w-full md:h-[60px]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.path
          d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z"
          className="fill-background"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}
