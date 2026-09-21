"use client";

import { Ban } from "lucide-react";

import type { CustomStickerShape } from "@/lib/cart/types";
import FlyoutPopover from "./flyout-popover";

// ============================================================================
// STICKER SHAPE FLYOUT (Task 5 — right-rail flyout)
// ============================================================================
// Combines shape selection (Circle/Square/Rounded/Die-cut — Die-cut uses the
// real contour-detection output from contour.ts via sticker-canvas.tsx's
// whiteBackingPoints, not a separate cut path) with the whole-sticker border
// toggle + color + a NEW thickness control the prior sprint's border feature
// was missing. This replaces the old always-visible ShapeSelector card and
// the old primary-row BorderColorPicker popover with one flyout, since both
// configure the same physical "sticker outline" concept.

const SHAPES: { value: CustomStickerShape; icon: string; label: string }[] = [
  { value: "Circle", icon: "●", label: "Circle" },
  { value: "Square", icon: "■", label: "Square" },
  { value: "Rounded", icon: "▣", label: "Rounded" },
  { value: "Die-cut", icon: "✦", label: "Die-cut" },
];

const BORDER_SWATCHES = [
  "#ffffff",
  "#111111",
  "#ffd43b",
  "#ff8a00",
  "#e63946",
  "#2a9d8f",
  "#3a86ff",
  "#8338ec",
];

export default function ShapeFlyout({
  shape,
  onShapeChange,
  borderColor,
  onBorderColorChange,
  borderWidth,
  onBorderWidthChange,
  onClose,
}: {
  shape: CustomStickerShape;
  onShapeChange: (shape: CustomStickerShape) => void;
  borderColor: string | null;
  onBorderColorChange: (color: string | null) => void;
  borderWidth: number;
  onBorderWidthChange: (width: number) => void;
  onClose: () => void;
}) {
  return (
    <FlyoutPopover label="Sticker shape" onClose={onClose} widthClassName="w-72">
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
          Sticker Shape
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {SHAPES.map((option) => {
            const selected = shape === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onShapeChange(option.value)}
                className={`
                  flex
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  py-3
                  transition-all

                  ${
                    selected
                      ? "border-hive-yellow bg-hive-yellow shadow-md scale-[1.04]"
                      : "border-black/10 bg-white hover:bg-cream"
                  }
                `}
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-cream text-lg font-black">
                  {option.icon}
                </div>
                <p className="mt-2 text-[11px] font-bold">{option.label}</p>
              </button>
            );
          })}
        </div>

        {shape === "Die-cut" && (
          <div className="mt-3 rounded-2xl bg-cream px-3 py-3 text-[11px] font-semibold leading-relaxed text-black/55">
            Die-cut follows your artwork silhouette. Transparent PNGs work
            immediately; use <span className="text-black">Make Die-cut Ready</span>{" "}
            in Image Settings for opaque uploads.
          </div>
        )}

        <div className="mt-5 border-t border-black/5 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
              Sticker Outline
            </p>

            <button
              type="button"
              onClick={() =>
                onBorderColorChange(borderColor ? null : "#ffffff")
              }
              className={`
                rounded-full
                px-3
                py-1
                text-[11px]
                font-bold
                transition

                ${
                  borderColor
                    ? "bg-black text-white"
                    : "bg-black/5 text-black/50 hover:bg-black/10"
                }
              `}
            >
              {borderColor ? "On" : "Off"}
            </button>
          </div>

          {borderColor && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onBorderColorChange(null)}
                  title="No outline"
                  aria-label="No outline"
                  className="
                    flex
                    size-8
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-black/10
                    bg-white
                    text-black/40
                    transition
                    hover:scale-105
                  "
                >
                  <Ban size={14} />
                </button>

                {BORDER_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => onBorderColorChange(swatch)}
                    style={{ backgroundColor: swatch }}
                    title={swatch}
                    className={`
                      size-8
                      rounded-full
                      border-2
                      transition

                      ${
                        borderColor === swatch
                          ? "border-black scale-110"
                          : "border-black/10 hover:scale-105"
                      }
                    `}
                  />
                ))}

                <label
                  className="
                    relative
                    flex
                    size-8
                    cursor-pointer
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border-2
                    border-dashed
                    border-black/20
                    text-[10px]
                    font-bold
                    text-black/40
                  "
                >
                  +
                  <input
                    type="color"
                    value={borderColor ?? "#ffffff"}
                    onChange={(event) => onBorderColorChange(event.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              </div>

              <div>
                <label
                  htmlFor="sticker-border-width"
                  className="mb-1.5 block text-[11px] font-semibold text-black/50"
                >
                  Thickness ({borderWidth}px)
                </label>

                <input
                  id="sticker-border-width"
                  type="range"
                  min={4}
                  max={24}
                  step={1}
                  value={borderWidth}
                  onChange={(event) =>
                    onBorderWidthChange(Number(event.target.value))
                  }
                  className="w-full accent-black"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FlyoutPopover>
  );
}
