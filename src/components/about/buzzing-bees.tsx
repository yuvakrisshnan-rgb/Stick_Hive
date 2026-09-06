"use client";

import { motion, useReducedMotion } from "motion/react";

type BeeConfig = {
  id: string;
  xPercents: number[];
  yPercents: number[];
  rotations: number[];
  duration: number;
  delay: number;
  size: number;
  opacity: number;
};

// Deterministic paths avoid SSR/client hydration mismatches.
const BEE_PATHS: BeeConfig[] = [
  {
    id: "bee-0",
    xPercents: [14, 20, 28, 24, 34, 42, 37, 30, 18, 14],
    yPercents: [28, 22, 30, 38, 34, 26, 18, 24, 20, 28],
    rotations: [0, 8, -6, 10, -8, 5, -10, 7, -4, 0],
    duration: 18,
    delay: 0,
    size: 20,
    opacity: 0.58,
  },
  {
    id: "bee-1",
    xPercents: [68, 74, 82, 76, 86, 80, 72, 78, 70, 68],
    yPercents: [72, 64, 70, 78, 68, 58, 64, 74, 80, 72],
    rotations: [0, -7, 8, -4, 10, -8, 6, -10, 5, 0],
    duration: 20,
    delay: 1.2,
    size: 18,
    opacity: 0.54,
  },
  {
    id: "bee-2",
    xPercents: [44, 50, 58, 54, 62, 56, 48, 40, 46, 44],
    yPercents: [18, 25, 20, 31, 26, 19, 28, 34, 24, 18],
    rotations: [0, 6, -8, 9, -5, 8, -10, 4, -6, 0],
    duration: 16,
    delay: 2.1,
    size: 17,
    opacity: 0.5,
  },
];

export default function BuzzingBees({
  count = 3,
  variant = "default",
}: {
  count?: number;
  variant?: "default" | "light";
}) {
  const shouldReduceMotion = useReducedMotion();
  const configs = BEE_PATHS.slice(0, Math.max(0, Math.min(count, BEE_PATHS.length)));

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {configs.map((config) => {
        const fontSize = variant === "light" ? Math.max(14, config.size - 2) : config.size;
        const opacity = variant === "light" ? Math.min(config.opacity, 0.62) : config.opacity;
        const duration = variant === "light" ? config.duration + 4 : config.duration;

        if (shouldReduceMotion) {
          return (
            <span
              key={config.id}
              style={{
                left: `${config.xPercents[0]}%`,
                top: `${config.yPercents[0]}%`,
                fontSize,
                opacity,
              }}
              className="absolute select-none drop-shadow-[0_2px_4px_rgba(17,17,17,0.08)]"
            >
              🐝
            </span>
          );
        }

        return (
          <motion.span
            key={config.id}
            animate={{
              left: config.xPercents.map((p) => `${p}%`),
              top: config.yPercents.map((p) => `${p}%`),
              rotate: config.rotations,
              scale: [1, 1.06, 0.97, 1.04, 1],
            }}
            transition={{
              duration,
              delay: config.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
            style={{ fontSize, opacity }}
            className="absolute select-none drop-shadow-[0_2px_4px_rgba(17,17,17,0.08)]"
          >
            🐝
          </motion.span>
        );
      })}
    </div>
  );
}
