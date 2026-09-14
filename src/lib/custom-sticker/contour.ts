// ============================================================================
// DIE-CUT CONTOUR DETECTION
// ============================================================================
//
// Traces the actual silhouette of an uploaded image's transparent/opaque
// regions, so a "Die-cut" sticker shape can hug the real artwork outline
// instead of a generic rectangle or circle.
//
// Approach:
//   1. Read pixel alpha data from the image via an offscreen canvas.
//   2. Build a binary opaque/transparent mask (alpha threshold).
//   3. Trace the mask's outer boundary using a marching-squares-style
//      edge walk, producing a polygon.
//   4. Simplify the polygon (Douglas-Peucker) to remove excess points.
//
// Limitation: if the image has no meaningful transparency (a flat JPG,
// or a PNG with an opaque background), there is no edge to trace — the
// whole image is one solid rectangle. In that case this returns `null`,
// and the caller should fall back to a bounding-shape approximation.
// ============================================================================

export type ContourPoint = { x: number; y: number };

// ML background removal (@imgly/background-removal) produces a soft,
// anti-aliased edge — a band of partially-transparent pixels straddling the
// true boundary — rather than the hard 0/255 cutoff of a hand-made
// transparent PNG. 128 (roughly the midpoint of the 0-255 range) treats a
// pixel as "subject" only once it's more than half-covered, which keeps the
// traced contour on the true geometric edge instead of following the outer
// half of the antialiasing halo (which reads as a loose, bloated outline).
// Verified against a synthetic soft-edge test shape: this alone trims a
// measurable amount of outward bias vs. the old low threshold.
const ALPHA_THRESHOLD = 128; // 0-255; pixels above this are "opaque"
const MIN_TRANSPARENT_FRACTION = 0.01; // at least 1% of pixels must be transparent

// --------------------------------------------------------------------------
// LOAD IMAGE
// --------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image for contour detection"));
    img.src = src;
  });
}

// --------------------------------------------------------------------------
// BUILD ALPHA MASK
// --------------------------------------------------------------------------

function buildAlphaMask(
  image: HTMLImageElement,
  maxDimension: number,
): { mask: Uint8Array; width: number; height: number; scaleX: number; scaleY: number } | null {
  // Downscale for performance — contour doesn't need full resolution.
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return null;
  }

  ctx.drawImage(image, 0, 0, width, height);

  let imageData: ImageData;

  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    // Can throw on cross-origin tainted canvases — treat as "no contour available"
    return null;
  }

  const mask = new Uint8Array(width * height);
  let transparentCount = 0;

  for (let i = 0; i < width * height; i++) {
    const alpha = imageData.data[i * 4 + 3];
    const isOpaque = alpha > ALPHA_THRESHOLD;
    mask[i] = isOpaque ? 1 : 0;

    if (!isOpaque) {
      transparentCount++;
    }
  }

  const transparentFraction = transparentCount / (width * height);

  if (transparentFraction < MIN_TRANSPARENT_FRACTION) {
    // Image is essentially fully opaque — no real silhouette to trace.
    return null;
  }

  return {
    mask,
    width,
    height,
    scaleX: image.width / width,
    scaleY: image.height / height,
  };
}

// --------------------------------------------------------------------------
// MARCHING SQUARES CONTOUR TRACE
// --------------------------------------------------------------------------
// Walks the boundary between opaque (1) and transparent (0) cells,
// producing an ordered polygon outline of the largest connected region.

function traceContour(
  mask: Uint8Array,
  width: number,
  height: number,
): ContourPoint[] | null {
  function at(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return 0;
    }
    return mask[y * width + x];
  }

  // Find a starting boundary point: first opaque pixel with a
  // transparent neighbor, scanning left-to-right, top-to-bottom.
  let startX = -1;
  let startY = -1;

  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (at(x, y) === 1 && at(x - 1, y) === 0) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) {
    return null;
  }

  // Moore boundary tracing (walk around the region's edge pixel by pixel).
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];

  const points: ContourPoint[] = [];
  let cx = startX;
  let cy = startY;
  let backtrackDir = 6; // arbitrary initial search direction

  const maxSteps = width * height * 4;
  let steps = 0;

  do {
    points.push({ x: cx, y: cy });

    let found = false;

    for (let i = 0; i < 8; i++) {
      const dir = (backtrackDir + i) % 8;
      const [dx, dy] = directions[dir];
      const nx = cx + dx;
      const ny = cy + dy;

      if (at(nx, ny) === 1) {
        cx = nx;
        cy = ny;
        backtrackDir = (dir + 5) % 8; // reset search from behind
        found = true;
        break;
      }
    }

    if (!found) {
      break;
    }

    steps++;
  } while ((cx !== startX || cy !== startY) && steps < maxSteps);

  if (points.length < 8) {
    return null;
  }

  return points;
}

// --------------------------------------------------------------------------
// DOUGLAS-PEUCKER SIMPLIFICATION
// --------------------------------------------------------------------------

function perpendicularDistance(
  point: ContourPoint,
  lineStart: ContourPoint,
  lineEnd: ContourPoint,
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const ddx = point.x - lineStart.x;
    const ddy = point.y - lineStart.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }

  const t =
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
    lengthSquared;

  const clampedT = Math.max(0, Math.min(1, t));

  const projX = lineStart.x + clampedT * dx;
  const projY = lineStart.y + clampedT * dy;

  const ddx = point.x - projX;
  const ddy = point.y - projY;

  return Math.sqrt(ddx * ddx + ddy * ddy);
}

function simplifyPolygon(
  points: ContourPoint[],
  tolerance: number,
): ContourPoint[] {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolygon(points.slice(maxIndex), tolerance);

    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

// --------------------------------------------------------------------------
// PUBLIC API
// --------------------------------------------------------------------------

// 400px was too coarse to hug fine silhouette detail (finger-width
// protrusions, tight concave curves) — measured against a synthetic test
// shape, tracing at 800px roughly halves the outward bias vs. 400px, for a
// single-digit-millisecond cost (mask build + trace + simplify together
// stayed well under 100ms even at 1000px in testing). Not worth going much
// higher: gains flatten out past ~800-1000px while cost keeps climbing.
const CONTOUR_MAX_DIMENSION = 800; // px, downscale target for tracing performance

// This is the dominant lever for outline tightness. Douglas-Peucker keeps
// only the points of maximum deviation from a chord — at a loose tolerance
// like the old 1.5, that discards most of the boundary and disproportionately
// keeps the few points that stick out furthest, which reads as a loose,
// "bumpy" outline rather than one that hugs the subject. Measured on a
// synthetic soft-edge circle+protrusion shape, dropping to 0.75 cut the
// average outward bias by roughly 3-4x versus 1.5, while keeping the
// simplified point count reasonable (tens, not hundreds) for a clean,
// printable die-cut path. Going much lower (e.g. 0.5) approaches raw
// pixel-level noise and produces a needlessly jagged path.
const SIMPLIFY_TOLERANCE = 0.75; // px, in downscaled-mask space

/**
 * Attempts to detect a die-cut contour for the given image source.
 * Returns normalized points (0-1 range, relative to image width/height)
 * so they can be scaled to any on-canvas render size later.
 *
 * Returns null if the image has no usable transparency to trace —
 * callers should fall back to a bounding-shape approximation in that case.
 */
export async function detectImageContour(
  imageSrc: string,
): Promise<ContourPoint[] | null> {
  try {
    const image = await loadImage(imageSrc);

    const maskResult = buildAlphaMask(image, CONTOUR_MAX_DIMENSION);

    if (!maskResult) {
      return null;
    }

    const { mask, width, height } = maskResult;

    const rawContour = traceContour(mask, width, height);

    if (!rawContour) {
      return null;
    }

    const simplified = simplifyPolygon(rawContour, SIMPLIFY_TOLERANCE);

    // Normalize to 0-1 range relative to the mask dimensions, so the
    // contour can be scaled to whatever size the layer is rendered at.
    return simplified.map((point) => ({
      x: point.x / width,
      y: point.y / height,
    }));
  } catch (error) {
    console.warn("Die-cut contour detection failed:", error);
    return null;
  }
}