// ============================================================================
// LIGHTWEIGHT LOCAL BACKGROUND REMOVAL
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
