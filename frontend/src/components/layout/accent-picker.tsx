"use client";

import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAccent, accentColors, type AccentName } from "@/hooks/use-accent";

const previewColors: Record<AccentName, string> = {
  zinc: "#71717a",
  rose: "#e11d48",
  orange: "#ea580c",
  green: "#16a34a",
  blue: "#2563eb",
  violet: "#7c3aed",
};

export function AccentPicker() {
  const { accent, setAccent } = useAccent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-accent"
        aria-label="Pick accent color"
      >
        <Palette size={16} style={{ color: previewColors[accent] }} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-11 z-50 rounded-xl border border-border bg-popover p-3 shadow-lg"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            主题色
          </p>
          <div className="flex gap-2">
            {accentColors.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setAccent(c.name);
                  setOpen(false);
                }}
                title={c.label}
                className="group relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: previewColors[c.name] }}
              >
                {accent === c.name && (
                  <motion.div
                    layoutId="accent-ring"
                    className="absolute inset-[-3px] rounded-full border-2"
                    style={{ borderColor: previewColors[c.name] }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                <span className="sr-only">{c.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
