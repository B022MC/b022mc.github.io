"use client";

import { motion } from "framer-motion";

function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function FloatingParticles({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seeded(i * 7 + 1) * 100,
    y: seeded(i * 13 + 2) * 100,
    size: seeded(i * 17 + 3) * 3 + 1,
    duration: seeded(i * 23 + 4) * 20 + 15,
    delay: seeded(i * 31 + 5) * -20,
    drift: seeded(i * 37 + 6) * 20 - 10,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.drift, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
