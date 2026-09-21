"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Square, Undo2, X } from "lucide-react";

// ============================================================================
// MANUAL IMAGE ERASER (Task 5)
// ============================================================================
// The Smart Selection (automatic ML background removal, plus the simpler
// flood-fill "Make Die-cut Ready" button) is AI-only - there was no manual
// way to refine an upload, which the Sticker.ly/WhatsApp Sticker Maker
// reference apps offer as an alternative alongside their AI option
// (free-hand or round/square "cutter"), not instead of it. This is that
// alternative: a plain HTML5 canvas (not Konva - this only needs pointer-
// driven pixel erasing on one static image, not the shared drag/resize/
// rotate/snap machinery sticker-canvas.tsx already owns) with a brush the
// user drags across the image; erased pixels become transparent via
// globalCompositeOperation="destination-out", the same technique any
// raster image editor's eraser tool uses.

const MAX_DISPLAY_SIZE = 380;
const BRUSH_SIZES = [12, 24, 40];

type BrushShape = "round" | "square";

export default function ImageEraserModal({
  imageSrc,
  onApply,
  onClose,
}: {
  imageSrc: string;
  onApply: (newSrc: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [brushShape, setBrushShape] = useState<BrushShape>("round");
  const [hasErased, setHasErased] = useState(false);
  // historyRef itself is never read during render (a ref read there
  // wouldn't reliably trigger a re-render when it changes) - this count
  // mirrors its length purely so the Undo button's disabled state can
  // react to it.
  const [strokeCount, setStrokeCount] = useState(0);
  const historyRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // --------------------------------------------------------------------------
  // LOAD IMAGE ONTO CANVAS
  // --------------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const scale = Math.min(
        1,
        MAX_DISPLAY_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
      );

      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      setStrokeCount(1);
      setReady(true);
    };
    image.src = imageSrc;
  }, [imageSrc]);

  // --------------------------------------------------------------------------
  // ERASE STROKE
  // --------------------------------------------------------------------------

  function eraseAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";

    if (brushShape === "round") {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  }

  function eraseLine(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / (brushSize / 4)));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      eraseAt(ctx, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    }
  }

  function getCanvasPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!canvas || !ctx || !point) return;

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    eraseAt(ctx, point.x, point.y);
    setHasErased(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;

    const ctx = canvasRef.current?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!ctx || !point) return;

    if (lastPointRef.current) {
      eraseLine(ctx, lastPointRef.current, point);
    }
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    historyRef.current = [
      ...historyRef.current,
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    ];
    setStrokeCount(historyRef.current.length);
  }

  function handleUndoStroke() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || historyRef.current.length <= 1) return;

    historyRef.current = historyRef.current.slice(0, -1);
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
    setStrokeCount(historyRef.current.length);
    setHasErased(historyRef.current.length > 1);
  }

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    onApply(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Manual Erase</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close eraser"
            className="flex size-9 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-1 text-xs text-black/45">
          Drag over the image to erase — a manual alternative to the AI
          background remover, for touch-ups it misses.
        </p>

        <div
          className="mt-4 overflow-hidden rounded-2xl bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]"
          style={{ touchAction: "none" }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="mx-auto block cursor-crosshair"
            style={{ touchAction: "none", maxWidth: "100%" }}
          />
        </div>

        {!ready && (
          <p className="mt-4 text-center text-xs font-semibold text-black/40">
            Loading image…
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBrushShape("round")}
              aria-label="Round brush"
              title="Round brush"
              className={`flex size-9 items-center justify-center rounded-xl border transition ${
                brushShape === "round"
                  ? "border-hive-yellow bg-hive-yellow/15"
                  : "border-black/10 hover:bg-cream"
              }`}
            >
              <Circle size={15} />
            </button>

            <button
              type="button"
              onClick={() => setBrushShape("square")}
              aria-label="Square brush"
              title="Square brush"
              className={`flex size-9 items-center justify-center rounded-xl border transition ${
                brushShape === "square"
                  ? "border-hive-yellow bg-hive-yellow/15"
                  : "border-black/10 hover:bg-cream"
              }`}
            >
              <Square size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                aria-label={`Brush size ${size}`}
                className={`flex size-9 items-center justify-center rounded-xl border transition ${
                  brushSize === size
                    ? "border-hive-yellow bg-hive-yellow/15"
                    : "border-black/10 hover:bg-cream"
                }`}
              >
                <span
                  className="rounded-full bg-black/70"
                  style={{ width: size / 3.5, height: size / 3.5 }}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUndoStroke}
            disabled={strokeCount <= 1}
            aria-label="Undo last stroke"
            title="Undo last stroke"
            className="flex size-9 items-center justify-center rounded-xl border border-black/10 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 size={15} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-cream px-4 py-2.5 text-sm font-bold transition hover:bg-black/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!ready || !hasErased}
            className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
