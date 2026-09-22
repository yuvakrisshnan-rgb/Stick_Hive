// ============================================================================
// ALPHA MASK POST-PROCESSING
// ============================================================================
//
// The ML model's raw alpha output commonly leaves two artifacts at
// high-contrast edges (hair, jewelry, glass rims):
//
//   1. A thin fringe of residual-background pixels the model classified as
//      "mostly foreground" but that are visibly still background-colored -
//      a "halo." Fixed with a small erosion pass (a min-filter on alpha).
//   2. A jagged, aliased-looking alpha edge that reads poorly once the
//      artwork is downscaled onto a small sticker. Fixed with a light
//      feather (box-blur, alpha channel only - RGB is untouched so this
//      never softens the actual artwork, only how it fades into
//      transparency).
//
// A third, optional pass removes background *color* bleed from the
// semi-transparent edge pixels themselves (not just cropping them away):
// real photo compositing means an edge pixel's stored color is a blend of
// foreground and background color, weighted by alpha
// (observed = alpha*fg + (1-alpha)*bg — the standard "over" operator). If
// that blended color is kept as-is, downscaling it onto a colored sticker
// background produces a visible fringe of the ORIGINAL photo's background
// color, even after the alpha itself is otherwise correct. This
// "decontaminates" the edge by estimating the local background color (a
// push-pull fill from confirmed-background pixels, i.e. normalized
// convolution - a standard matting technique) and solving the same "over"
// equation for the foreground color instead of trusting the stored blend.
// ============================================================================

const DEFAULT_ERODE_RADIUS = 1;
const DEFAULT_FEATHER_RADIUS = 1;
const DEFAULT_FEATHER_PASSES = 2; // 2 box-blur passes approximate a gaussian
const BACKGROUND_ESTIMATE_RADIUS = 20;
const DECONTAMINATE_MIN_ALPHA = 12; // below this, the pixel is effectively gone already
const DECONTAMINATE_MAX_ALPHA = 240; // above this, treat as fully opaque foreground
const DECONTAMINATE_ALPHA_FLOOR = 0.2; // avoids extreme color swings dividing by near-zero alpha

// --------------------------------------------------------------------------
// EROSION (min-filter on the alpha channel — separable for speed: a 2D
// min over a (2r+1)x(2r+1) box equals a min over rows, then a min over the
// row-mins down columns.)
// --------------------------------------------------------------------------

function erodeAlpha(alpha: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return alpha;

  const horizontal = new Uint8ClampedArray(alpha.length);

  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) {
      let min = 255;
      for (let dx = -radius; dx <= radius; dx++) {
        const sampleX = x + dx;
        // Out-of-bounds counts as background (0) — an image edge is a real
        // boundary, not an infinite canvas, so erosion should shrink into
        // it the same as it would shrink away from any other hard edge.
        const value = sampleX < 0 || sampleX >= width ? 0 : alpha[rowStart + sampleX];
        if (value < min) min = value;
      }
      horizontal[rowStart + x] = min;
    }
  }

  const result = new Uint8ClampedArray(alpha.length);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let min = 255;
      for (let dy = -radius; dy <= radius; dy++) {
        const sampleY = y + dy;
        const value = sampleY < 0 || sampleY >= height ? 0 : horizontal[sampleY * width + x];
        if (value < min) min = value;
      }
      result[y * width + x] = min;
    }
  }

  return result;
}

// --------------------------------------------------------------------------
// FEATHERING (separable box blur, alpha channel only)
// --------------------------------------------------------------------------

function boxBlurAlphaOnce(alpha: Uint8ClampedArray, width: number, height: number, radius: number): Float32Array {
  const horizontal = new Float32Array(alpha.length);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    let sum = 0;
    for (let dx = -radius; dx <= radius; dx++) {
      const sampleX = Math.min(width - 1, Math.max(0, dx));
      sum += alpha[rowStart + sampleX];
    }
    horizontal[rowStart] = sum / windowSize;

    for (let x = 1; x < width; x++) {
      const leaving = Math.min(width - 1, Math.max(0, x - 1 - radius));
      const entering = Math.min(width - 1, Math.max(0, x + radius));
      sum += alpha[rowStart + entering] - alpha[rowStart + leaving];
      horizontal[rowStart + x] = sum / windowSize;
    }
  }

  const result = new Float32Array(alpha.length);

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      const sampleY = Math.min(height - 1, Math.max(0, dy));
      sum += horizontal[sampleY * width + x];
    }
    result[x] = sum / windowSize;

    for (let y = 1; y < height; y++) {
      const leaving = Math.min(height - 1, Math.max(0, y - 1 - radius));
      const entering = Math.min(height - 1, Math.max(0, y + radius));
      sum += horizontal[entering * width + x] - horizontal[leaving * width + x];
      result[y * width + x] = sum / windowSize;
    }
  }

  return result;
}

function featherAlpha(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  passes: number,
): Uint8ClampedArray {
  if (radius <= 0 || passes <= 0) return alpha;

  let working: Float32Array = Float32Array.from(alpha);

  for (let pass = 0; pass < passes; pass++) {
    working = boxBlurAlphaOnce(Uint8ClampedArray.from(working), width, height, radius);
  }

  return Uint8ClampedArray.from(working);
}

// --------------------------------------------------------------------------
// BACKGROUND COLOR ESTIMATE (push-pull / normalized convolution)
// --------------------------------------------------------------------------
// Seeds a color at every pixel the (eroded) mask is confident is pure
// background, then spreads those seed colors inward with a large box blur
// applied to both a color-sum buffer and a weight buffer — dividing one by
// the other at each pixel gives a weighted average of nearby seeds, i.e.
// exactly what an edge pixel's local background probably looked like,
// even though that pixel itself no longer has a "clean" background sample.

function estimateBackgroundColor(
  originalData: Uint8ClampedArray,
  erodedAlpha: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): { r: Float32Array; g: Float32Array; b: Float32Array } {
  const pixelCount = width * height;
  const weight = new Uint8ClampedArray(pixelCount);
  const seedR = new Float32Array(pixelCount);
  const seedG = new Float32Array(pixelCount);
  const seedB = new Float32Array(pixelCount);

  let globalSumR = 0;
  let globalSumG = 0;
  let globalSumB = 0;
  let globalCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    if (erodedAlpha[i] === 0) {
      weight[i] = 255;
      const index = i * 4;
      seedR[i] = originalData[index];
      seedG[i] = originalData[index + 1];
      seedB[i] = originalData[index + 2];
      globalSumR += originalData[index];
      globalSumG += originalData[index + 1];
      globalSumB += originalData[index + 2];
      globalCount++;
    }
  }

  const fallback = globalCount > 0
    ? { r: globalSumR / globalCount, g: globalSumG / globalCount, b: globalSumB / globalCount }
    : { r: 255, g: 255, b: 255 };

  const blurredWeight = boxBlurAlphaOnce(weight, width, height, radius);
  const blurredR = boxBlurFloatOnce(seedR, width, height, radius);
  const blurredG = boxBlurFloatOnce(seedG, width, height, radius);
  const blurredB = boxBlurFloatOnce(seedB, width, height, radius);

  const r = new Float32Array(pixelCount);
  const g = new Float32Array(pixelCount);
  const b = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    if (blurredWeight[i] < 1) {
      r[i] = fallback.r;
      g[i] = fallback.g;
      b[i] = fallback.b;
      continue;
    }
    // seed buffers were pre-weighted by 255 per seed (weight[i]=255), so
    // dividing the blurred color sum by the blurred weight (also 0-255
    // scaled) recovers a properly normalized average regardless of how
    // many/few seeds contributed within this pixel's blur radius.
    r[i] = blurredR[i] / (blurredWeight[i] / 255);
    g[i] = blurredG[i] / (blurredWeight[i] / 255);
    b[i] = blurredB[i] / (blurredWeight[i] / 255);
  }

  return { r, g, b };
}

// Same separable box-blur algorithm as boxBlurAlphaOnce, generalized to a
// plain Float32Array input/output instead of assuming a Uint8ClampedArray
// source (the seed color/weight buffers can exceed 0-255 mid-computation
// isn't true here, but keeping this generic avoids a second near-duplicate
// implementation).
function boxBlurFloatOnce(source: Float32Array, width: number, height: number, radius: number): Float32Array {
  const horizontal = new Float32Array(source.length);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    const rowStart = y * width;
    let sum = 0;
    for (let dx = -radius; dx <= radius; dx++) {
      const sampleX = Math.min(width - 1, Math.max(0, dx));
      sum += source[rowStart + sampleX];
    }
    horizontal[rowStart] = sum / windowSize;

    for (let x = 1; x < width; x++) {
      const leaving = Math.min(width - 1, Math.max(0, x - 1 - radius));
      const entering = Math.min(width - 1, Math.max(0, x + radius));
      sum += source[rowStart + entering] - source[rowStart + leaving];
      horizontal[rowStart + x] = sum / windowSize;
    }
  }

  const result = new Float32Array(source.length);

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      const sampleY = Math.min(height - 1, Math.max(0, dy));
      sum += horizontal[sampleY * width + x];
    }
    result[x] = sum / windowSize;

    for (let y = 1; y < height; y++) {
      const leaving = Math.min(height - 1, Math.max(0, y - 1 - radius));
      const entering = Math.min(height - 1, Math.max(0, y + radius));
      sum += horizontal[entering * width + x] - horizontal[leaving * width + x];
      result[y * width + x] = sum / windowSize;
    }
  }

  return result;
}

// --------------------------------------------------------------------------
// DECONTAMINATION — unpremultiply each semi-transparent edge pixel against
// its estimated local background: observed = alpha*fg + (1-alpha)*bg, so
// fg = (observed - (1-alpha)*bg) / alpha.
// --------------------------------------------------------------------------

function decontaminateEdges(
  resultData: Uint8ClampedArray,
  originalData: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  background: { r: Float32Array; g: Float32Array; b: Float32Array },
  width: number,
  height: number,
): void {
  const pixelCount = width * height;

  for (let i = 0; i < pixelCount; i++) {
    const a = alpha[i];
    if (a <= DECONTAMINATE_MIN_ALPHA || a >= DECONTAMINATE_MAX_ALPHA) continue;

    const index = i * 4;
    const alphaFraction = Math.max(DECONTAMINATE_ALPHA_FLOOR, a / 255);
    const bgR = background.r[i];
    const bgG = background.g[i];
    const bgB = background.b[i];

    const originalR = originalData[index];
    const originalG = originalData[index + 1];
    const originalB = originalData[index + 2];

    resultData[index] = clamp8((originalR - (1 - alphaFraction) * bgR) / alphaFraction);
    resultData[index + 1] = clamp8((originalG - (1 - alphaFraction) * bgG) / alphaFraction);
    resultData[index + 2] = clamp8((originalB - (1 - alphaFraction) * bgB) / alphaFraction);
  }
}

function clamp8(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

// --------------------------------------------------------------------------
// ORCHESTRATION
// --------------------------------------------------------------------------

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image for mask post-processing"));
    image.src = source;
  });
}

function imageToCanvas(image: HTMLImageElement, width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create image canvas");
  context.drawImage(image, 0, 0, width, height);
  return context;
}

export type MaskPostProcessOptions = {
  erodeRadius?: number;
  featherRadius?: number;
  featherPasses?: number;
  decontaminate?: boolean;
};

/**
 * Cleans up a background-removal result's alpha mask: erodes residual
 * background fringe, optionally decontaminates background-color bleed from
 * the remaining semi-transparent edge pixels, then feathers the alpha edge
 * for a smoother look once the artwork is scaled down onto a sticker.
 *
 * @param resultSrc - the ML model's raw output (a data URL, RGBA with
 *   alpha already applied).
 * @param originalSrc - the pre-removal source image, same pixel content as
 *   what was fed to the model (used for the decontamination pass, which
 *   needs to see the original blended colors at each edge pixel).
 */
export async function postProcessAlphaMask(
  resultSrc: string,
  originalSrc: string,
  options?: MaskPostProcessOptions,
): Promise<string> {
  const erodeRadius = options?.erodeRadius ?? DEFAULT_ERODE_RADIUS;
  const featherRadius = options?.featherRadius ?? DEFAULT_FEATHER_RADIUS;
  const featherPasses = options?.featherPasses ?? DEFAULT_FEATHER_PASSES;
  const shouldDecontaminate = options?.decontaminate ?? true;

  const [resultImage, originalImage] = await Promise.all([loadImage(resultSrc), loadImage(originalSrc)]);

  const width = resultImage.naturalWidth;
  const height = resultImage.naturalHeight;

  const resultContext = imageToCanvas(resultImage, width, height);
  const resultImageData = resultContext.getImageData(0, 0, width, height);
  const { data } = resultImageData;

  const originalContext = imageToCanvas(originalImage, width, height);
  const originalData = originalContext.getImageData(0, 0, width, height).data;

  const pixelCount = width * height;
  const alpha = new Uint8ClampedArray(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    alpha[i] = data[i * 4 + 3];
  }

  const erodedAlpha = erodeAlpha(alpha, width, height, erodeRadius);

  if (shouldDecontaminate) {
    const background = estimateBackgroundColor(
      originalData,
      erodedAlpha,
      width,
      height,
      BACKGROUND_ESTIMATE_RADIUS,
    );
    decontaminateEdges(data, originalData, erodedAlpha, background, width, height);
  }

  const featheredAlpha = featherAlpha(erodedAlpha, width, height, featherRadius, featherPasses);

  for (let i = 0; i < pixelCount; i++) {
    data[i * 4 + 3] = featheredAlpha[i];
  }

  resultContext.putImageData(resultImageData, 0, 0);
  return resultContext.canvas.toDataURL("image/png");
}
