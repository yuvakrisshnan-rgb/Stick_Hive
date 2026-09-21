"use client";

import { useState } from "react";
import { Eraser, ImageIcon, RefreshCw, RotateCcw, WandSparkles } from "lucide-react";

import type { StickerImageLayer } from "@/lib/cart/types";
import ImageEraserModal from "./image-eraser-modal";

// ============================================================================
// PROPS
// ============================================================================

type ImagePropertiesPanelProps = {
  layer: StickerImageLayer;
  onReplaceClick: () => void;
  onChange: (updates: Partial<StickerImageLayer>) => void;
  onCommitHistory: () => void;
  isDetectingContour: boolean;
  isRemovingBackground: boolean;
  onRemoveBackground: () => void;
  onRestoreOriginal: () => void;
  /** Manual free-hand/shape eraser (Task 5) - an alternative to the AI
   *  background remover above, not a replacement for it. */
  onManualErase: (newSrc: string) => void;
};

// ============================================================================
// IMAGE PROPERTIES PANEL
// ============================================================================

export default function ImagePropertiesPanel({
  layer,
  onReplaceClick,
  onChange,
  onCommitHistory,
  isDetectingContour,
  isRemovingBackground,
  onRemoveBackground,
  onRestoreOriginal,
  onManualErase,
}: ImagePropertiesPanelProps) {
  const [eraserOpen, setEraserOpen] = useState(false);

  return (
    <section
      className="
        rounded-3xl
        border
        border-black/5
        bg-white
        p-5
      "
    >
      <div className="flex items-center gap-2">
        <ImageIcon size={16} className="text-black/40" />

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.25em]
            text-black/40
          "
        >
          Image Settings
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-cream">
        <img
          src={layer.src}
          alt="Selected layer"
          className="h-32 w-full object-contain p-3"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onReplaceClick}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-black
            py-2.5
            text-xs
            font-bold
            text-white
            transition
            hover:scale-[1.01]
          "
        >
          <RefreshCw size={14} />
          Replace
        </button>

        <button
          type="button"
          onClick={() => {
            onChange({ rotation: 0 });
            onCommitHistory();
          }}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-cream
            py-2.5
            text-xs
            font-bold
            transition
            hover:bg-black/5
          "
        >
          <RotateCcw size={14} />
          Reset Rotation
        </button>

        <button
          type="button"
          onClick={() => setEraserOpen(true)}
          className="
            col-span-2
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-black/10
            bg-white
            py-2.5
            text-xs
            font-bold
            transition
            hover:bg-cream
          "
        >
          <Eraser size={14} />
          Manual Erase
        </button>
      </div>

      {eraserOpen && (
        <ImageEraserModal
          imageSrc={layer.src}
          onApply={(newSrc) => {
            onManualErase(newSrc);
            setEraserOpen(false);
          }}
          onClose={() => setEraserOpen(false)}
        />
      )}

      <div className="mt-4 rounded-2xl border border-black/5 bg-cream/60 p-4">
        {isDetectingContour ? (
          <p className="text-xs font-semibold text-black/45">
            Detecting the cutline…
          </p>
        ) : layer.contourPoints ? (
          <div>
            <p className="text-xs font-bold text-green-700">
              ✓ True die-cut outline ready
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-black/45">
              The cutline follows the visible artwork instead of the image rectangle.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold text-black/70">
              Die-cut needs a transparent edge
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-black/45">
              Use a transparent PNG, or try the local background remover for a simple flat background.
            </p>
            <button
              type="button"
              onClick={onRemoveBackground}
              disabled={isRemovingBackground}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <WandSparkles size={14} />
              {isRemovingBackground ? "Removing background…" : "Make Die-cut Ready"}
            </button>
          </div>
        )}

        {layer.backgroundRemoved && layer.originalSrc && (
          <button
            type="button"
            onClick={onRestoreOriginal}
            className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold text-black/65 transition hover:bg-black/5"
          >
            Restore original image
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-black/40">
        Drag on the canvas to move. Drag the corner handles to resize.
        Drag the top handle to rotate. Use arrow keys to nudge.
      </p>
    </section>
  );
}