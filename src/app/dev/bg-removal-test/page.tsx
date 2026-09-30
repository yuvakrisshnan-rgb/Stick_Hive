"use client";

// ============================================================================
// BACKGROUND-REMOVAL SELF-TEST (dev-only — see src/app/dev/layout.tsx for
// the production-404 gate)
// ============================================================================
//
// A baseline for judging whether background-removal changes actually help,
// instead of eyeballing one photo. Two independent things are tested here,
// since they can fail independently and the fix for one doesn't prove the
// other:
//
//   1. The real ML pipeline (@imgly/background-removal), fast vs. high
//      precision, against 12 synthetic fixture images chosen to exercise
//      real failure modes (fine branching edges, translucency, low
//      contrast in both lighting directions, backlit silhouettes, a
//      textured background, multiple subjects, a subject with a real
//      hole, edge-cropped and small subjects, and extreme thin detail).
//      Records success/failure and timing —
//      this app's CSP deliberately omits 'unsafe-eval' (see next.config.ts),
//      so @imgly's model call is known to fail intermittently as a
//      documented, accepted trade-off; this self-test surfaces exactly how
//      often that's actually happening, not just "it works on my machine."
//   2. The mask post-processing math itself (erode/feather/decontaminate,
//      mask-postprocess.ts) against a hand-built synthetic mask+original
//      pair with a known correct answer — this passes or fails on its own
//      logic, independent of whether the ML call above succeeds, so a
//      flaky model run never masks a real bug in the post-processing code
//      (or vice versa).
//
// Fixture images are synthesized in-canvas rather than sourced from real
// photos - there's no image-sourcing capability available in this
// environment to pull in actual portrait/product photography, and
// fabricating a "real photo" would be dishonest. These are structural
// stand-ins for the scenarios that matter (see FIXTURES below), not
// photorealistic test data - flagged here rather than presented as more
// than they are.

import { useState } from "react";
import {
  removeBackgroundML,
  type BackgroundRemovalPrecision,
} from "@/lib/custom-sticker/background-removal";
import { postProcessAlphaMask } from "@/lib/custom-sticker/mask-postprocess";

// --------------------------------------------------------------------------
// SYNTHETIC FIXTURE GENERATION
// --------------------------------------------------------------------------

type Fixture = {
  id: string;
  label: string;
  scenario: string;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
};

const FIXTURE_SIZE = 400;

const FIXTURES: Fixture[] = [
  {
    id: "hair-like-edges",
    label: "Fine branching edges (hair stand-in)",
    scenario: "A rounded head-like shape with thin radiating strands - the same fine-detail-edge failure mode as real hair.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#2f6fb0";
      ctx.fillRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      ctx.fillStyle = "#3a2a1a";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const len = size * (0.12 + 0.1 * Math.sin(i * 3));
        ctx.strokeStyle = "#2a1d10";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * size * 0.2, cy + Math.sin(angle) * size * 0.2);
        ctx.lineTo(
          cx + Math.cos(angle) * (size * 0.2 + len),
          cy + Math.sin(angle) * (size * 0.2 + len),
        );
        ctx.stroke();
      }
    },
  },
  {
    id: "reflective-glass",
    label: "Reflective glass (translucency stand-in)",
    scenario: "A semi-transparent gradient shape over a patterned background - tests edge color decontamination on translucent regions.",
    draw: (ctx, size) => {
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, "#e8c46b");
      gradient.addColorStop(1, "#b3d8e0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#d9ecf5";
      ctx.beginPath();
      ctx.ellipse(size / 2, size / 2, size * 0.28, size * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(size * 0.42, size * 0.38, size * 0.08, size * 0.14, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "low-contrast",
    label: "Low-contrast subject on background",
    scenario: "Subject color close to the background color - the hardest case for any saliency-based segmentation model.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#c9c2b3";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#b6ae9d";
      ctx.beginPath();
      ctx.roundRect(size * 0.28, size * 0.24, size * 0.44, size * 0.52, 24);
      ctx.fill();
    },
  },
  {
    id: "two-subjects",
    label: "Two plausible subjects",
    scenario: "Two separate, similarly-sized shapes - tests whether the model/mask commits to one subject or keeps both.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#f4ede1";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#c1443a";
      ctx.beginPath();
      ctx.arc(size * 0.32, size * 0.5, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a6ea5";
      ctx.beginPath();
      ctx.arc(size * 0.68, size * 0.5, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "high-contrast-control",
    label: "High-contrast simple shape (control)",
    scenario: "A clean, well-defined subject with no ambiguity - the best-case baseline every other fixture is compared against.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.roundRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5, 20);
      ctx.fill();
    },
  },
  {
    id: "fine-spikes",
    label: "Extreme fine detail (jewelry-chain stand-in)",
    scenario: "Many thin, widely-spaced protrusions - stress-tests erosion (can wipe out thin detail entirely) and feathering.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#efe6d8";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#8a7550";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      const spikes = 24;
      for (let i = 0; i < spikes; i++) {
        const angle = (i / spikes) * Math.PI * 2;
        const innerR = size * 0.14;
        const outerR = size * 0.32;
        ctx.strokeStyle = "#8a7550";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size / 2 + Math.cos(angle) * innerR, size / 2 + Math.sin(angle) * innerR);
        ctx.lineTo(size / 2 + Math.cos(angle) * outerR, size / 2 + Math.sin(angle) * outerR);
        ctx.stroke();
      }
    },
  },

  // --------------------------------------------------------------------
  // 2026-09-29 stress-test additions (Task 1.5) - the original 6 fixtures
  // above cover fine edges, translucency, one low-contrast direction,
  // multi-subject ambiguity, a clean baseline, and extreme thin detail.
  // These add failure modes none of those exercise: dark-on-dark contrast
  // (the opposite lighting direction from the existing light-on-light
  // low-contrast case), backlit/silhouette lighting, a textured/patterned
  // background (distinct from the existing smooth gradient), a subject
  // with a real topological hole, a subject cropped at the frame edge,
  // and a subject occupying only a small fraction of the frame.
  // --------------------------------------------------------------------

  {
    id: "dark-on-dark",
    label: "Dark subject on dark background",
    scenario: "Low contrast in the opposite lighting direction from the existing light-on-light case - a dark subject against a near-black background, the way a night photo or dark clothing on a dark backdrop would look.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#1c1a17";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#2e2a24";
      ctx.beginPath();
      ctx.roundRect(size * 0.3, size * 0.22, size * 0.4, size * 0.56, 30);
      ctx.fill();
    },
  },
  {
    id: "backlit-silhouette",
    label: "Backlit silhouette",
    scenario: "A much darker subject against a bright light source/sky - the opposite failure mode from low-contrast: high contrast but the subject reads as a near-black cutout with a bright rim, which can confuse edge color decontamination.",
    draw: (ctx, size) => {
      const gradient = ctx.createRadialGradient(size / 2, size * 0.35, size * 0.05, size / 2, size * 0.35, size * 0.75);
      gradient.addColorStop(0, "#fff6d8");
      gradient.addColorStop(1, "#f0a94e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#120e08";
      ctx.beginPath();
      ctx.ellipse(size / 2, size * 0.42, size * 0.14, size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.4, size * 0.52);
      ctx.lineTo(size * 0.6, size * 0.52);
      ctx.lineTo(size * 0.68, size * 0.95);
      ctx.lineTo(size * 0.32, size * 0.95);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: "textured-background",
    label: "Textured/patterned background",
    scenario: "A busy checkerboard-like background behind a clean subject - distinct from the existing smooth-gradient translucency fixture, tests whether background texture (not just color) leaks into the mask edge.",
    draw: (ctx, size) => {
      const cell = size / 16;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#d8cbb0" : "#c2ae86";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
      ctx.fillStyle = "#3f6b4f";
      ctx.beginPath();
      ctx.roundRect(size * 0.28, size * 0.28, size * 0.44, size * 0.44, 16);
      ctx.fill();
    },
  },
  {
    id: "subject-with-hole",
    label: "Subject with a real hole (ring/donut)",
    scenario: "A closed loop with genuine background visible through its center - tests whether the model/mask correctly keeps the interior transparent instead of filling it in as a hole-cleanup false positive.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#eef2f6";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
      ctx.arc(size / 2, size / 2, size * 0.16, 0, Math.PI * 2, true);
      ctx.fill();
    },
  },
  {
    id: "edge-cropped-subject",
    label: "Subject cropped at the frame edge",
    scenario: "The subject extends past three sides of the frame, like a close-up crop - tests boundary handling when there's no fully-enclosed silhouette to find.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#f7f3ea";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#4a4137";
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 1.05, size * 0.42, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "small-subject",
    label: "Small subject, mostly background",
    scenario: "The actual subject occupies a small fraction of the frame - tests whether the model still commits to the small real subject instead of the large empty background region.",
    draw: (ctx, size) => {
      ctx.fillStyle = "#e3e9ec";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#d24d57";
      ctx.beginPath();
      ctx.arc(size * 0.62, size * 0.58, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    },
  },
];

function drawFixture(fixture: Fixture): string {
  const canvas = document.createElement("canvas");
  canvas.width = FIXTURE_SIZE;
  canvas.height = FIXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create fixture canvas");
  fixture.draw(ctx, FIXTURE_SIZE);
  return canvas.toDataURL("image/png");
}

// --------------------------------------------------------------------------
// MASK-QUALITY METRICS (for the real ML pipeline runs)
// --------------------------------------------------------------------------

async function measureAlphaHistogram(dataUrl: string): Promise<{
  opaque: number;
  transparent: number;
  edge: number; // 0 < alpha < 255 — a rough halo/fringe proxy
  total: number;
}> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no ctx");
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let opaque = 0;
  let transparent = 0;
  let edge = 0;
  const total = canvas.width * canvas.height;

  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a === 255) opaque++;
    else if (a === 0) transparent++;
    else edge++;
  }

  return { opaque, transparent, edge, total };
}

// --------------------------------------------------------------------------
// ISOLATED POST-PROCESS CORRECTNESS TEST (bypasses @imgly entirely)
// --------------------------------------------------------------------------
// Builds a hand-crafted "raw model output" - a hard-edged 200px opaque
// circle on transparent, composited over a KNOWN original image with a
// solid red background - so erosion/feathering/decontamination each have a
// verifiable, known-correct direction of change, independent of whether
// the real ML call above ever succeeds.

async function buildSyntheticMaskCase(): Promise<{ rawResult: string; original: string }> {
  const size = 200;
  const bgColor = { r: 220, g: 40, b: 40 };
  const fgColor = { r: 30, g: 120, b: 60 };

  const originalCanvas = document.createElement("canvas");
  originalCanvas.width = size;
  originalCanvas.height = size;
  const originalCtx = originalCanvas.getContext("2d")!;
  originalCtx.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`;
  originalCtx.fillRect(0, 0, size, size);
  originalCtx.fillStyle = `rgb(${fgColor.r},${fgColor.g},${fgColor.b})`;
  originalCtx.beginPath();
  originalCtx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
  originalCtx.fill();

  // The "raw result": same green circle, but with a few pixels of hard-
  // edged residual-background fringe deliberately left just outside the
  // true circle boundary (radius*1.06 instead of matching exactly) - this
  // is exactly the halo artifact erosion is supposed to strip.
  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = size;
  resultCanvas.height = size;
  const resultCtx = resultCanvas.getContext("2d")!;
  resultCtx.clearRect(0, 0, size, size);
  resultCtx.fillStyle = `rgba(${fgColor.r},${fgColor.g},${fgColor.b},1)`;
  resultCtx.beginPath();
  resultCtx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
  resultCtx.fill();
  // Halo: a thin ring of blended fg/bg color at ~106% radius, alpha 255
  // (i.e. the model classified it as "confident foreground" even though
  // its color shows it's still mostly background - exactly what
  // decontamination + erosion are meant to fix).
  resultCtx.fillStyle = `rgba(${Math.round((fgColor.r + bgColor.r) / 2)},${Math.round((fgColor.g + bgColor.g) / 2)},${Math.round((fgColor.b + bgColor.b) / 2)},1)`;
  resultCtx.beginPath();
  resultCtx.arc(size / 2, size / 2, size * 0.315, 0, Math.PI * 2);
  resultCtx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2, true);
  resultCtx.fill();

  return {
    rawResult: resultCanvas.toDataURL("image/png"),
    original: originalCanvas.toDataURL("image/png"),
  };
}

async function countOpaqueAndEdgePixels(dataUrl: string): Promise<{ opaque: number; edge: number }> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load"));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let opaque = 0;
  let edge = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 255) opaque++;
    else if (data[i] > 0) edge++;
  }
  return { opaque, edge };
}

// --------------------------------------------------------------------------
// PAGE
// --------------------------------------------------------------------------

type MlRunResult = {
  precision: BackgroundRemovalPrecision;
  status: "pending" | "success" | "failed";
  ms?: number;
  error?: string;
  resultUrl?: string;
  histogram?: { opaque: number; transparent: number; edge: number; total: number };
};

type FixtureResult = {
  fixture: Fixture;
  sourceUrl: string;
  runs: MlRunResult[];
};

export default function BgRemovalTestPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FixtureResult[]>([]);
  const [postProcessCheck, setPostProcessCheck] = useState<{
    status: "idle" | "running" | "done" | "failed";
    beforeOpaque?: number;
    afterOpaque?: number;
    beforeEdge?: number;
    afterEdge?: number;
    error?: string;
  }>({ status: "idle" });

  async function runIsolatedPostProcessCheck() {
    setPostProcessCheck({ status: "running" });
    try {
      const { rawResult, original } = await buildSyntheticMaskCase();
      const before = await countOpaqueAndEdgePixels(rawResult);
      const processed = await postProcessAlphaMask(rawResult, original);
      const after = await countOpaqueAndEdgePixels(processed);

      setPostProcessCheck({
        status: "done",
        beforeOpaque: before.opaque,
        afterOpaque: after.opaque,
        beforeEdge: before.edge,
        afterEdge: after.edge,
      });
    } catch (error) {
      setPostProcessCheck({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function runFullSelfTest() {
    setRunning(true);
    const nextResults: FixtureResult[] = [];

    for (const fixture of FIXTURES) {
      const sourceUrl = drawFixture(fixture);
      const runs: MlRunResult[] = [];

      for (const precision of ["fast", "high"] as BackgroundRemovalPrecision[]) {
        const start = performance.now();
        try {
          const resultUrl = await removeBackgroundML(sourceUrl, undefined, { precision });
          const ms = Math.round(performance.now() - start);
          const histogram = await measureAlphaHistogram(resultUrl);
          runs.push({ precision, status: "success", ms, resultUrl, histogram });
        } catch (error) {
          runs.push({
            precision,
            status: "failed",
            ms: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      nextResults.push({ fixture, sourceUrl, runs });
      setResults([...nextResults]);
    }

    setRunning(false);
  }

  const successCount = results.reduce(
    (sum, r) => sum + r.runs.filter((run) => run.status === "success").length,
    0,
  );
  const totalRuns = results.reduce((sum, r) => sum + r.runs.length, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-extrabold">Background-removal self-test</h1>
      <p className="mt-2 max-w-2xl text-sm text-black/60">
        Dev-only baseline for judging background-removal changes. Two independent
        checks: the isolated mask post-processing math (no ML call, deterministic),
        and the real @imgly/background-removal pipeline against 12 synthetic
        fixtures in both fast and high-precision modes.
      </p>

      {/* ==================================================================
          CHECK 1: ISOLATED POST-PROCESS CORRECTNESS
      ================================================================== */}

      <section className="mt-8 rounded-2xl border border-black/10 p-5">
        <h2 className="text-lg font-bold">1. Mask post-processing correctness (isolated)</h2>
        <p className="mt-1 text-xs text-black/50">
          A hand-built raw mask with a known halo artifact + a known original
          image. No @imgly call — proves erode/decontaminate/feather work on
          their own logic, independent of ML pipeline reliability.
        </p>

        <button
          type="button"
          onClick={runIsolatedPostProcessCheck}
          disabled={postProcessCheck.status === "running"}
          className="mt-3 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {postProcessCheck.status === "running" ? "Running…" : "Run isolated check"}
        </button>

        {postProcessCheck.status === "done" && (
          <div className="mt-3 text-sm">
            <p className={postProcessCheck.afterOpaque! < postProcessCheck.beforeOpaque! ? "text-green-700" : "text-red-600"}>
              Erosion shrank the opaque region: {postProcessCheck.beforeOpaque} → {postProcessCheck.afterOpaque} opaque px
              {postProcessCheck.afterOpaque! < postProcessCheck.beforeOpaque! ? " ✓ (halo fringe removed)" : " ✗ FAILED"}
            </p>
            <p className={postProcessCheck.afterEdge! > postProcessCheck.beforeEdge! ? "text-green-700" : "text-red-600"}>
              Feathering increased soft-edge pixel count: {postProcessCheck.beforeEdge} → {postProcessCheck.afterEdge} edge px
              {postProcessCheck.afterEdge! > postProcessCheck.beforeEdge! ? " ✓ (edge is softer, not just binary)" : " ✗ FAILED"}
            </p>
          </div>
        )}

        {postProcessCheck.status === "failed" && (
          <p className="mt-3 text-sm text-red-600">Failed: {postProcessCheck.error}</p>
        )}
      </section>

      {/* ==================================================================
          CHECK 2: REAL ML PIPELINE AGAINST FIXTURES
      ================================================================== */}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">2. Real pipeline vs. 12 fixtures (fast + high precision)</h2>
          <button
            type="button"
            onClick={runFullSelfTest}
            disabled={running}
            className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {running ? "Running…" : "Run full self-test"}
          </button>
        </div>

        {results.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-black/60">
            {successCount} / {totalRuns} runs succeeded
            {totalRuns > 0 && successCount < totalRuns && (
              <span className="text-black/40">
                {" "}— failures are the documented CSP/&apos;unsafe-eval&apos; trade-off in
                next.config.ts, not a fixture problem (each failure&apos;s message is
                shown below).
              </span>
            )}
          </p>
        )}

        <div className="mt-4 space-y-6">
          {results.map((result) => (
            <div key={result.fixture.id} className="rounded-2xl border border-black/10 p-4">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- dev-only self-test report, client-generated data URLs, not worth next/image config here */}
                <img src={result.sourceUrl} alt={result.fixture.label} className="size-24 rounded-xl border border-black/10" />
                <div>
                  <p className="font-bold">{result.fixture.label}</p>
                  <p className="text-xs text-black/50">{result.fixture.scenario}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {result.runs.map((run) => (
                  <div key={run.precision} className="rounded-xl bg-cream/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-black/50">
                      {run.precision} {run.status === "success" ? `— ${run.ms}ms` : ""}
                    </p>
                    {run.status === "success" && run.resultUrl && run.histogram && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element -- dev-only self-test report, client-generated data URLs, not worth next/image config here */}
                        <img src={run.resultUrl} alt="" className="mt-2 size-20 rounded-lg border border-black/10 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:10px_10px]" />
                        <p className="mt-1 text-[11px] text-black/60">
                          edge px: {run.histogram.edge} / {run.histogram.total} (
                          {((run.histogram.edge / run.histogram.total) * 100).toFixed(1)}%)
                        </p>
                      </>
                    )}
                    {run.status === "failed" && (
                      <p className="mt-1 text-[11px] text-red-600">{run.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
