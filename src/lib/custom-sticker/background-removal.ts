// ============================================================================
// BACKGROUND REMOVAL
// ============================================================================
//
// Two implementations live in this file:
//
//   - removeBackgroundML: real ML segmentation via @imgly/background-removal
//     (in-browser WebAssembly, no server round-trip). Used automatically
//     right after upload, before die-cut contour detection runs, so most
//     photos get a real silhouette instead of a rectangular fallback.
//
//   - removeSimpleBackground: the original dependency-free flood-fill
//     approach (removes background-colored pixels connected to the image
//     edges). Kept as-is for the manual per-layer "Remove Background"
//     button, which predates the ML integration.
// ============================================================================

import { DEFAULT_MAX_HOLE_AREA_FRACTION, closeSmallHolesInImageData } from "./mask-cleanup";
import { postProcessAlphaMask } from "./mask-postprocess";

// --------------------------------------------------------------------------
// ML BACKGROUND REMOVAL (@imgly/background-removal)
// --------------------------------------------------------------------------
//
// @imgly/background-removal ships the same isnet architecture in three
// weight-precision variants (checked node_modules/@imgly/background-
// removal/README.md and dist/src/schema.d.ts directly rather than
// assuming): "isnet_quint8" (~40MB, 8-bit quantized - the smallest/
// fastest, "sometimes shows some artifacts" per the library's own docs),
// "isnet_fp16" (~80MB, the library's own documented DEFAULT), and "isnet"
// (full fp32 precision, largest/slowest, no quantization rounding error).
//
// This file was overriding the library's own default down to the
// quantized "isnet_quint8" variant unconditionally - the fast/small
// option, not a neutral default - which is exactly the "leaving quality
// on the table" the precision toggle below addresses. Note there is no
// separate "higher output resolution" lever available: the isnet model's
// input layer is a fixed 1024x1024 (confirmed via the compiled bundle),
// identical across all three variants - the only quality lever this
// library exposes is weight precision, not spatial resolution.

export type BackgroundRemovalPrecision = "fast" | "high";

const MODEL_BY_PRECISION: Record<BackgroundRemovalPrecision, "isnet_quint8" | "isnet"> = {
  fast: "isnet_quint8",
  high: "isnet",
};

/**
 * Removes the background from an image using an in-browser ML segmentation
 * model (WebAssembly, runs entirely client-side — no upload to a server).
 *
 * @param source - a data URL, object URL, or remote URL for the image.
 * @param onProgress - optional callback, fraction 0-1, for a loading UI.
 *   Fires for both the (first-time) model download and inference.
 * @param options.precision - "fast" (default, isnet_quint8 - smaller
 *   download, quicker inference) or "high" (isnet, full precision - a
 *   larger one-time model download and a few extra seconds of inference,
 *   for cleaner edges on hard subjects like hair or reflective glass).
 *   The browser caches whichever model(s) get used, per device, not per
 *   upload.
 * @param options.postProcess - alpha-mask cleanup (erode, feather, edge
 *   color decontamination — see mask-postprocess.ts). Defaults to on;
 *   pass false to get the model's raw output for comparison/testing.
 * @returns a PNG data URL with the background made transparent.
 * @throws if the model fails to load or segmentation fails (e.g. no WASM
 *   support, blocked network request to the model CDN) — callers should
 *   catch this and fall back to using the original image unchanged, since
 *   this is a "nice to have" enhancement, not a required step.
 */
export async function removeBackgroundML(
  source: string,
  onProgress?: (fraction: number) => void,
  options?: {
    precision?: BackgroundRemovalPrecision;
    postProcess?: boolean;
  },
): Promise<string> {
  const precision = options?.precision ?? "fast";
  const shouldPostProcess = options?.postProcess ?? true;

  const { removeBackground } = await import("@imgly/background-removal");

  const resultBlob = await removeBackground(source, {
    model: MODEL_BY_PRECISION[precision],
    output: { format: "image/png" },
    progress: (_key, current, total) => {
      if (total > 0) onProgress?.(Math.min(1, current / total));
    },
  });

  const resultDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read background-removed image"));
    reader.readAsDataURL(resultBlob);
  });

  if (!shouldPostProcess) {
    return resultDataUrl;
  }

  try {
    return await postProcessAlphaMask(resultDataUrl, source);
  } catch (postProcessError) {
    // Mask cleanup is a refinement pass, not a required step - the raw
    // model output is still a usable cutout on its own.
    console.warn("Alpha mask post-processing failed, using raw model output:", postProcessError);
    return resultDataUrl;
  }
}

// Matches contour.ts's ALPHA_THRESHOLD — both need to agree on what counts
// as "opaque" so a pixel isn't treated as inside a hole for the visible
// artwork but outside one for the traced outline, or vice versa.
const HOLE_CLEANUP_ALPHA_THRESHOLD = 128;

/**
 * Fills small ML-matting artifact holes (flecks in hair, specks on fabric)
 * directly in the actual image data — not just the abstract tracing mask
 * contour.ts uses. Without this, the die-cut outline could look clean while
 * the visible sticker artwork/thumbnail still shows the holes, since that's
 * rendered from this image, not from the traced polygon.
 *
 * Processes at the source image's native resolution (no downscaling) so
 * this doesn't reduce the final artwork's print quality — a plain flood
 * fill is cheap enough that this stays fast even at several megapixels.
 *
 * @param source - a data URL for the (already background-removed) image.
 * @returns a PNG data URL with small enclosed holes repainted opaque.
 * @throws if the image can't be loaded/read — callers should fall back to
 *   the uncleaned image rather than blocking the upload on this step.
 */
export async function cleanupBackgroundHoles(source: string): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image for hole cleanup"));
    img.src = source;
  });

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create image canvas");

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);

  const maxHoleArea = Math.round(width * height * DEFAULT_MAX_HOLE_AREA_FRACTION);
  closeSmallHolesInImageData(imageData, HOLE_CLEANUP_ALPHA_THRESHOLD, maxHoleArea);

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// ============================================================================
// LIGHTWEIGHT LOCAL BACKGROUND REMOVAL (fallback / manual button)
// ============================================================================
//
// This is intentionally dependency-free and browser-only. It removes an
// edge-connected background that is close in colour to the image corners.
// It is designed for sticker artwork / flat or simple backgrounds, not as a
// replacement for a full AI segmentation model.
// ============================================================================

type RGB = { r: number; g: number; b: number };

const MAX_DIMENSION = 1200;
const DEFAULT_TOLERANCE = 52;
const ALPHA_THRESHOLD = 12;

function colourDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCorner(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
): RGB {
  const radius = Math.max(2, Math.round(Math.min(width, height) * 0.025));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < radius; y += 1) {
    for (let x = 0; x < radius; x += 1) {
      const px = Math.max(0, Math.min(width - 1, startX + x));
      const py = Math.max(0, Math.min(height - 1, startY + y));
      const index = (py * width + px) * 4;
      const alpha = data[index + 3];
      if (alpha <= ALPHA_THRESHOLD) continue;
      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
      count += 1;
    }
  }

  if (!count) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

function getBackgroundPalette(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): RGB[] {
  return [
    sampleCorner(data, width, height, 0, 0),
    sampleCorner(data, width, height, Math.max(0, width - 8), 0),
    sampleCorner(data, width, height, 0, Math.max(0, height - 8)),
    sampleCorner(
      data,
      width,
      height,
      Math.max(0, width - 8),
      Math.max(0, height - 8),
    ),
  ];
}

function isBackgroundLike(
  data: Uint8ClampedArray,
  index: number,
  palette: RGB[],
  tolerance: number,
): boolean {
  const alpha = data[index + 3];
  if (alpha <= ALPHA_THRESHOLD) return true;

  const pixel = {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
  };

  return palette.some((corner) => colourDistance(pixel, corner) <= tolerance);
}

/**
 * Removes a simple background by flood-filling background-like pixels from
 * the canvas edges. Returns a PNG data URL and the scale used for processing.
 */
export async function removeSimpleBackground(
  source: string,
  tolerance = DEFAULT_TOLERANCE,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image"));
    img.src = source;
  });

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );

  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create image canvas");

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const palette = getBackgroundPalette(data, width, height);

  // The selected region is deliberately a little stricter than the public
  // tolerance so edges don't eat into lightly coloured artwork too easily.
  const threshold = Math.max(12, tolerance);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const position = y * width + x;
    if (visited[position]) return;
    const index = position * 4;
    if (!isBackgroundLike(data, index, palette, threshold)) return;
    visited[position] = 1;
    queue[tail++] = position;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  const neighbours = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  while (head < tail) {
    const position = queue[head++];
    const x = position % width;
    const y = Math.floor(position / width);
    const index = position * 4;

    data[index + 3] = 0;

    for (const [dx, dy] of neighbours) {
      enqueue(x + dx, y + dy);
    }
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}
