// ============================================================================
// IMAGE LAYER FLIP
// ============================================================================
// Mirrors an image layer's actual pixel data horizontally, rather than
// applying a live Konva scaleX={-1} transform. The Transformer's own
// onTransformEnd handler (sticker-canvas.tsx) already normalizes
// scaleX/scaleY back to 1 after every resize, converting scale into
// width/height instead - a live negative-scale flip would fight that
// normalization (and would need to be threaded through drag/resize/rotate/
// snap math that doesn't currently know about it). Baking the flip into the
// bitmap itself, the same way background-removal.ts and mask-cleanup.ts
// already manipulate pixel data via an offscreen canvas, needs no changes
// to that existing, carefully-tuned transform pipeline at all.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image to flip"));
    img.src = src;
  });
}

/** Mirrors an image data URL horizontally, preserving transparency. */
export async function flipImageHorizontal(src: string): Promise<string> {
  const image = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL("image/png");
}
