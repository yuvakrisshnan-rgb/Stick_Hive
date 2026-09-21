"use client";

import { ImageIcon, RefreshCw, RotateCcw, WandSparkles } from "lucide-react";

import type { StickerImageLayer } from "@/lib/cart/types";

// ============================================================================
// IMAGE STYLE PANEL — floating, top-right of the canvas when an image layer
// is selected (mirrors text-style-panel.tsx's slot). Not explicitly named in
// the approved layout spec, which only describes a Text-style panel — but
// Replace/Reset Rotation/Make Die-cut Ready/Restore Original are real,
// working actions with no other home in the new layout, and dropping them
// would regress functionality the constraints explicitly protect. Manual
// erase moved out of this panel into the per-selection pill toolbar's
// "Erase" icon (Task 6), per the approved spec.
// ============================================================================

export default function ImageStylePanel({
  layer,
  onReplaceClick,
  onChange,
  onCommitHistory,
  isDetectingContour,
  isRemovingBackground,
  onRemoveBackground,
  onRestoreOriginal,
}: {
  layer: StickerImageLayer;
  onReplaceClick: () => void;
  onChange: (updates: Partial<StickerImageLayer>) => void;
  onCommitHistory: () => void;
  isDetectingContour: boolean;
  isRemovingBackground: boolean;
  onRemoveBackground: () => void;
  onRestoreOriginal: () => void;
}) {
  return (
    <div
      className="
        pointer-events-auto
        w-72
        max-w-[calc(100vw-32px)]
        rounded-2xl
        border
        border-black/10
        bg-white
        p-4
        shadow-[0_20px_50px_rgba(0,0,0,0.18)]
      "
    >
      <div className="flex items-center gap-2">
        <ImageIcon size={14} className="text-black/40" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
          Image Settings
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
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
          <RefreshCw size={13} />
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
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div className="mt-3 rounded-2xl border border-black/5 bg-cream/60 p-3">
        {isDetectingContour ? (
          <p className="text-[11px] font-semibold text-black/45">
            Detecting the cutline…
          </p>
        ) : layer.contourPoints ? (
          <p className="text-[11px] font-bold text-green-700">
            ✓ True die-cut outline ready
          </p>
        ) : (
          <div>
            <p className="text-[11px] font-bold text-black/70">
              Die-cut needs a transparent edge
            </p>
            <button
              type="button"
              onClick={onRemoveBackground}
              disabled={isRemovingBackground}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-2 text-[11px] font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <WandSparkles size={13} />
              {isRemovingBackground ? "Removing…" : "Make Die-cut Ready"}
            </button>
          </div>
        )}

        {layer.backgroundRemoved && layer.originalSrc && (
          <button
            type="button"
            onClick={onRestoreOriginal}
            className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-black/65 transition hover:bg-black/5"
          >
            Restore original image
          </button>
        )}
      </div>
    </div>
  );
}
