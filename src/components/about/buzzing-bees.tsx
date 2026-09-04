"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "motion/react";

// ============================================================================
// TYPES
// ============================================================================

type TrailPoint = { x: number; y: number };

type BeeConfig = {
  id: string;
  xPercents: number[]; // positions as % of container width, many small hops
  yPercents: number[]; // positions as % of container height
  rotations: number[];
  duration: number;
  delay: number;
  size: number;
  opacity: number;
};

// ============================================================================
// RANDOM WAYPOINT GENERATOR
// ============================================================================
// Generates a long random-walk sequence across the FULL container (5%-95%
// of width/height), with each step being a moderate move from the last —
// not huge jumps, not tiny jitters — so the path reads as organic buzzing
// rather than geometric bouncing between a few far-apart points.

function buildWanderPath(pointCount: number): number[] {
  const points: number[] = [];
  let current = 10 + Math.random() * 80; // start somewhere in the middle area

  for (let i = 0; i < pointCount; i++) {
    points.push(current);

    const step = (Math.random() - 0.5) * 45; // moderate random step
    current = Math.min(92, Math.max(8, current + step));
  }

  points.push(points[0]); // loop back to start seamlessly

  return points;
}

function buildRotationPath(pointCount: number): number[] {
  const points: number[] = [];
  let current = 0;

  for (let i = 0; i < pointCount; i++) {
    points.push(current);
    current += (Math.random() - 0.5) * 30;
  }

  points.push(points[0]);

  return points;
}

// ============================================================================
// BEE CONFIGS
// ============================================================================

const BEE_COUNT = 5;
const WAYPOINT_COUNT = 9;

function useBeeConfigs(): BeeConfig[] {
  const [configs] = useState<BeeConfig[]>(() =>
    Array.from({ length: BEE_COUNT }, (_, index) => ({
      id: `bee-${index}`,
      xPercents: buildWanderPath(WAYPOINT_COUNT),
      yPercents: buildWanderPath(WAYPOINT_COUNT),
      rotations: buildRotationPath(WAYPOINT_COUNT),
      duration: 14 + Math.random() * 6, // 14-20s for the full wander loop
      delay: index * 0.7,
      size: 16 + Math.round(Math.random() * 7),
      opacity: 0.65 + Math.random() * 0.3,
    })),
  );

  return configs;
}

// ============================================================================
// SMOOTH CURVE BUILDER (Catmull-Rom → cubic bezier)
// ============================================================================
// Converts a series of straight-line trail points into a smooth curved SVG
// path, so turns look like gentle buzzing rather than sharp polygon corners.

function buildSmoothPath(points: TrailPoint[]): string {
  if (points.length < 2) {
    return "";
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

const TRAIL_SAMPLE_INTERVAL_MS = 110;
const TRAIL_MAX_POINTS = 16;

// ============================================================================
// SINGLE BEE + SMOOTH DASHED TRAIL
// ============================================================================

function Bee({
  config,
  containerRef,
}: {
  config: BeeConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const beeRef = useRef<HTMLDivElement | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const lastSampleRef = useRef(0);

  // Sample the bee's actual rendered position every frame (throttled),
  // relative to the container, so the trail matches exactly what's on
  // screen regardless of how the position is animated.
  useAnimationFrame(() => {
    const now = performance.now();

    if (now - lastSampleRef.current < TRAIL_SAMPLE_INTERVAL_MS) {
      return;
    }

    const bee = beeRef.current;
    const container = containerRef.current;

    if (!bee || !container) {
      return;
    }

    lastSampleRef.current = now;

    const beeRect = bee.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const x = beeRect.left + beeRect.width / 2 - containerRect.left;
    const y = beeRect.top + beeRect.height / 2 - containerRect.top;

    setTrail((previous) => {
      const next = [...previous, { x, y }];
      return next.slice(-TRAIL_MAX_POINTS);
    });
  });

  const pathData = buildSmoothPath(trail);

  return (
    <>
      {/* ====================================================================
          TRAIL — smooth curved dashed line, small dashes
      ==================================================================== */}

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {pathData && (
          <path
            d={pathData}
            fill="none"
            stroke="#111111"
            strokeOpacity={config.opacity * 0.5}
            strokeWidth={1.6}
            strokeDasharray="3 5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* ====================================================================
          BEE
      ==================================================================== */}

      <motion.div
        ref={beeRef}
        animate={{
          left: config.xPercents.map((p) => `${p}%`),
          top: config.yPercents.map((p) => `${p}%`),
          rotate: config.rotations,
        }}
        transition={{
          duration: config.duration,
          delay: config.delay,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        style={{
          fontSize: config.size,
          opacity: config.opacity,
        }}
        className="pointer-events-none absolute select-none"
      >
        🐝
      </motion.div>
    </>
  );
}

// ============================================================================
// BUZZING BEES — ambient background layer
// ============================================================================

export default function BuzzingBees() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const configs = useBeeConfigs();

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      {configs.map((config) => (
        <Bee key={config.id} config={config} containerRef={containerRef} />
      ))}
    </div>
  );
}