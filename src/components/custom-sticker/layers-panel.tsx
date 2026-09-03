"use client";

import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Trash2,
  Type,
} from "lucide-react";

import type { StickerLayer } from "@/lib/cart/types";

// ============================================================================
// PROPS
// ============================================================================

type LayersPanelProps = {
  layers: StickerLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
};

// ============================================================================
// LAYER LABEL
// ============================================================================

function layerLabel(layer: StickerLayer): string {
  if (layer.type === "text") {
    return layer.text.trim() || "Text Layer";
  }

  return "Image Layer";
}

// ============================================================================
// LAYERS PANEL
// ============================================================================

export default function LayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onMoveLayer,
}: LayersPanelProps) {
  // Render topmost layer first (matches visual stacking order).
  const orderedLayers = [...layers].reverse();

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
      <div>
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.25em]
            text-black/40
          "
        >
          Layers
        </p>

        <h3 className="mt-1 text-lg font-extrabold">
          Design Elements
        </h3>
      </div>

      {orderedLayers.length === 0 ? (
        <p className="mt-4 text-xs font-medium text-black/40">
          No layers yet. Add an image or text to get started.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {orderedLayers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            const isTopmost = index === 0;
            const isBottommost = index === orderedLayers.length - 1;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  px-3
                  py-2.5
                  transition

                  ${
                    isSelected
                      ? "border-hive-yellow bg-hive-yellow/15"
                      : "border-black/10 bg-white hover:bg-cream"
                  }
                `}
              >
                <div
                  className="
                    flex
                    size-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-cream
                  "
                >
                  {layer.type === "text" ? (
                    <Type size={16} />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                </div>

                <p className="min-w-0 flex-1 truncate text-sm font-bold">
                  {layerLabel(layer)}
                </p>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveLayer(layer.id, "up");
                    }}
                    disabled={isTopmost}
                    className="
                      flex
                      size-7
                      items-center
                      justify-center
                      rounded-lg
                      text-black/40
                      transition
                      hover:bg-white
                      hover:text-black
                      disabled:cursor-not-allowed
                      disabled:opacity-20
                    "
                  >
                    <ChevronUp size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveLayer(layer.id, "down");
                    }}
                    disabled={isBottommost}
                    className="
                      flex
                      size-7
                      items-center
                      justify-center
                      rounded-lg
                      text-black/40
                      transition
                      hover:bg-white
                      hover:text-black
                      disabled:cursor-not-allowed
                      disabled:opacity-20
                    "
                  >
                    <ChevronDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="
                      flex
                      size-7
                      items-center
                      justify-center
                      rounded-lg
                      text-black/40
                      transition
                      hover:bg-red-50
                      hover:text-red-500
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}