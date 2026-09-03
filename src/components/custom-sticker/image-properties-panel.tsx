"use client";

import { ImageIcon, RefreshCw, RotateCcw } from "lucide-react";

import type { StickerImageLayer } from "@/lib/cart/types";

// ============================================================================
// PROPS
// ============================================================================

type ImagePropertiesPanelProps = {
  layer: StickerImageLayer;
  onReplaceClick: () => void;
  onChange: (updates: Partial<StickerImageLayer>) => void;
  onCommitHistory: () => void;
  isDetectingContour: boolean;
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
}: ImagePropertiesPanelProps) {
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
      </div>

      {isDetectingContour ? (
        <p className="mt-3 text-xs font-semibold text-black/40">
          Detecting die-cut outline…
        </p>
      ) : layer.contourPoints ? (
        <p className="mt-3 text-xs font-semibold text-green-600">
          ✓ Die-cut outline detected from this image
        </p>
      ) : (
        <p className="mt-3 text-xs font-semibold text-black/40">
          For a precise die-cut outline, upload a PNG with a transparent
          background.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-black/40">
        Drag on the canvas to move. Drag the corner handles to resize.
        Drag the top handle to rotate. Use arrow keys to nudge.
      </p>
    </section>
  );
}