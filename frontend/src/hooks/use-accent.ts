"use client";

import { useState, useEffect, useCallback } from "react";

export const accentColors = [
  { name: "zinc", label: "石墨", hue: 0, chroma: 0 },
  { name: "rose", label: "玫瑰", hue: 12, chroma: 0.22 },
  { name: "orange", label: "橙", hue: 55, chroma: 0.22 },
  { name: "green", label: "翠绿", hue: 155, chroma: 0.18 },
  { name: "blue", label: "靛蓝", hue: 250, chroma: 0.2 },
  { name: "violet", label: "紫罗兰", hue: 290, chroma: 0.2 },
] as const;

export type AccentName = (typeof accentColors)[number]["name"];

const STORAGE_KEY = "blog_accent";

function applyAccent(name: AccentName) {
  const accent = accentColors.find((a) => a.name === name);
  if (!accent) return;

  const root = document.documentElement;

  if (accent.chroma === 0) {
    root.style.removeProperty("--accent-hue");
    root.style.removeProperty("--accent-chroma");
    root.classList.remove("themed");
  } else {
    root.style.setProperty("--accent-hue", String(accent.hue));
    root.style.setProperty("--accent-chroma", String(accent.chroma));
    root.classList.add("themed");
  }
}

export function useAccent() {
  const [accent, setAccentState] = useState<AccentName>("zinc");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AccentName | null;
    if (saved && accentColors.some((a) => a.name === saved)) {
      applyAccent(saved);
      requestAnimationFrame(() => setAccentState(saved));
    }
  }, []);

  const setAccent = useCallback((name: AccentName) => {
    setAccentState(name);
    localStorage.setItem(STORAGE_KEY, name);
    applyAccent(name);
  }, []);

  return { accent, setAccent, accentColors };
}
