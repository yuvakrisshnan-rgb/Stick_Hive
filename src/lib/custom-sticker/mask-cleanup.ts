// ============================================================================
// SMALL HOLE CLEANUP (morphological closing, via enclosed-region fill)
// ============================================================================
//
// ML background removal can leave small transparent "holes" scattered
// inside the subject — a fleck in hair, a speck on a dark jacket — instead
// of only removing the true background. Left alone, these show up two
// ways: detectImageContour() (contour.ts) traces a spurious extra outline
// around each hole, and the actual artwork/thumbnail shows visible
// transparent gaps punched through the subject.
//
// This implements the effect of a morphological "closing" (dilate then
// erode) — fill small enclosed gaps, leave the true outer silhouette and
// any large legitimate transparent region untouched — but via connected-
// component hole detection rather than a fixed-radius structuring element.
// That gives an exact, tunable AREA threshold (as requested) and, just as
// importantly, can never nudge the true outer boundary even slightly,
// which a literal dilate+erode risks doing on fine detail (a concern
// already raised when tuning contour.ts's tracing precision).
//
// How a "hole" is defined: flood-fill inward from every border pixel that
// is transparent. Everything that flood fill reaches is the true exterior
// background — including a physically wide gap like the one between an
// arm and torso, or the open notch of a C-shaped object, since both stay
// connected to the border without ever crossing an opaque pixel. Any
// transparent pixel NOT reached this way is, by construction, fully
// enclosed by opaque pixels — a genuine interior hole. Only holes whose
// pixel area is at or below `maxHoleArea` get filled.
// ============================================================================

export type HoleComponent = {
  pixels: number[]; // flat (y * width + x) indices of this hole's pixels
  area: number;
};

/**
 * Finds every transparent region in `mask` that is fully enclosed by
 * opaque pixels (i.e. not connected to the mask's outer border through
 * other transparent pixels). Each returned component is one such hole.
 *
 * @param mask - binary mask, 1 = opaque, 0 = transparent. Not mutated.
 */
export function findEnclosedHoles(
  mask: Uint8Array,
  width: number,
  height: number,
): HoleComponent[] {
  const size = width * height;
  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  const enqueueExterior = (idx: number) => {
    if (visited[idx] || mask[idx] === 1) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  };

  // Seed with every transparent border pixel, then flood-fill inward.
  // Anything reached here is "true background," never a hole.
  for (let x = 0; x < width; x++) {
    enqueueExterior(x);
    enqueueExterior((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueueExterior(y * width);
    enqueueExterior(y * width + width - 1);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) enqueueExterior(idx - 1);
    if (x < width - 1) enqueueExterior(idx + 1);
    if (y > 0) enqueueExterior(idx - width);
    if (y < height - 1) enqueueExterior(idx + width);
  }

  // Any transparent pixel not reached above is part of an enclosed hole.
  // Group each such region into its own connected component.
  const holes: HoleComponent[] = [];
  const localQueue = new Int32Array(size);

  for (let start = 0; start < size; start++) {
    if (mask[start] === 1 || visited[start]) continue;

    let localHead = 0;
    let localTail = 0;
    localQueue[localTail++] = start;
    visited[start] = 1;
    const pixels: number[] = [];

    while (localHead < localTail) {
      const idx = localQueue[localHead++];
      pixels.push(idx);
      const x = idx % width;
      const y = (idx / width) | 0;

      const tryAdd = (n: number) => {
        if (mask[n] === 0 && !visited[n]) {
          visited[n] = 1;
          localQueue[localTail++] = n;
        }
      };

      if (x > 0) tryAdd(idx - 1);
      if (x < width - 1) tryAdd(idx + 1);
      if (y > 0) tryAdd(idx - width);
      if (y < height - 1) tryAdd(idx + width);
    }

    holes.push({ pixels, area: pixels.length });
  }

  return holes;
}

// A hole's max fillable size, expressed as a FRACTION of total mask area
// rather than an absolute pixel count, so the same tuning constant behaves
// consistently whether it's applied to contour.ts's downscaled tracing
// mask or a full-resolution photo. 0.05% of the frame is roughly a
// 20x20px blob at an 800px working size, or ~27x27px at 1200px — large
// enough to absorb typical ML matting flecks in hair/fabric, small enough
// to leave a real design gap (an arm-to-body gap, a shape with a deliberate
// hole) alone; those are almost always a much larger fraction of the frame.
export const DEFAULT_MAX_HOLE_AREA_FRACTION = 0.0005;

/**
 * Fills every enclosed hole in `mask` (see findEnclosedHoles) whose area is
 * at or below `maxHoleArea`, by setting those pixels to opaque (1).
 * Mutates and returns `mask`.
 */
export function fillSmallHoles(
  mask: Uint8Array,
  width: number,
  height: number,
  maxHoleArea: number,
): Uint8Array {
  const holes = findEnclosedHoles(mask, width, height);

  for (const hole of holes) {
    if (hole.area > maxHoleArea) continue;
    for (const idx of hole.pixels) {
      mask[idx] = 1;
    }
  }

  return mask;
}

// Structural type instead of the DOM `ImageData` — keeps this module free
// of DOM-only type dependencies (it does no canvas/DOM work itself), and a
// real ImageData already satisfies this shape.
export type ImageDataLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

/**
 * Same hole-fill as fillSmallHoles, but for real RGBA image data rather
 * than an abstract mask: qualifying holes are repainted fully opaque using
 * the average color of their immediately-surrounding opaque pixels (a
 * simple, cheap blend — adequate for the small flecks this targets, not a
 * general inpainting algorithm). Mutates `imageData.data` in place.
 */
export function closeSmallHolesInImageData(
  imageData: ImageDataLike,
  alphaThreshold: number,
  maxHoleArea: number,
): void {
  const { width, height, data } = imageData;
  const size = width * height;
  const mask = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    mask[i] = data[i * 4 + 3] > alphaThreshold ? 1 : 0;
  }

  const holes = findEnclosedHoles(mask, width, height);

  for (const hole of holes) {
    if (hole.area > maxHoleArea) continue;

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let rimCount = 0;

    for (const idx of hole.pixels) {
      const x = idx % width;
      const y = (idx / width) | 0;
      const neighbors = [];
      if (x > 0) neighbors.push(idx - 1);
      if (x < width - 1) neighbors.push(idx + 1);
      if (y > 0) neighbors.push(idx - width);
      if (y < height - 1) neighbors.push(idx + width);

      for (const n of neighbors) {
        if (mask[n] === 1) {
          sumR += data[n * 4];
          sumG += data[n * 4 + 1];
          sumB += data[n * 4 + 2];
          rimCount++;
        }
      }
    }

    if (rimCount === 0) continue; // shouldn't happen for a true enclosed hole

    const avgR = Math.round(sumR / rimCount);
    const avgG = Math.round(sumG / rimCount);
    const avgB = Math.round(sumB / rimCount);

    for (const idx of hole.pixels) {
      data[idx * 4] = avgR;
      data[idx * 4 + 1] = avgG;
      data[idx * 4 + 2] = avgB;
      data[idx * 4 + 3] = 255;
    }
  }
}
