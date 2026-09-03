"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  PenTool,
  Type,
} from "lucide-react";

import { STICKER_FONTS } from "@/lib/custom-sticker/fonts";
import type { StickerTextLayer } from "@/lib/cart/types";

// ============================================================================
// PROPS
// ============================================================================

type TextPropertiesPanelProps = {
  layer: StickerTextLayer;
  onChange: (updates: Partial<StickerTextLayer>) => void;
  onCommitHistory: () => void;
};

// ============================================================================
// COLOR SWATCHES
// ============================================================================

const FILL_SWATCHES = [
  "#111111",
  "#ffffff",
  "#ffd43b",
  "#ff8a00",
  "#e63946",
  "#2a9d8f",
  "#3a86ff",
  "#8338ec",
];

const STROKE_SWATCHES = ["#ffffff", "#111111", "#ffd43b"];

// ============================================================================
// COLOR SWATCH ROW (shared by fill + stroke)
// ============================================================================

function ColorSwatchRow({
  colors,
  activeColor,
  onSelect,
  allowCustom = true,
}: {
  colors: string[];
  activeColor: string;
  onSelect: (color: string) => void;
  allowCustom?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const isSelected = activeColor === color;

        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            style={{ backgroundColor: color }}
            className={`
              size-9
              rounded-full
              border-2
              transition

              ${
                isSelected
                  ? "border-black scale-110"
                  : "border-black/10 hover:scale-105"
              }
            `}
          />
        );
      })}

      {allowCustom && (
        <label
          className="
            relative
            flex
            size-9
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
            value={activeColor}
            onChange={(event) => onSelect(event.target.value)}
            className="
              absolute
              inset-0
              size-full
              cursor-pointer
              opacity-0
            "
          />
        </label>
      )}
    </div>
  );
}

// ============================================================================
// TEXT PROPERTIES PANEL
// ============================================================================

export default function TextPropertiesPanel({
  layer,
  onChange,
  onCommitHistory,
}: TextPropertiesPanelProps) {
  const hasStroke = Boolean(layer.strokeColor) && layer.strokeWidth > 0;

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
        <Type size={16} className="text-black/40" />

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.25em]
            text-black/40
          "
        >
          Text Settings
        </p>
      </div>

      {/* ==================================================================
          CONTENT
      ================================================================== */}

      <div className="mt-4">
        <label
          htmlFor="sticker-text-content"
          className="mb-1.5 block text-xs font-bold text-black/60"
        >
          Text
        </label>

        <input
          id="sticker-text-content"
          type="text"
          value={layer.text}
          onChange={(event) =>
            onChange({ text: event.target.value })
          }
          onBlur={onCommitHistory}
          placeholder="Enter your text"
          className="
            h-11
            w-full
            rounded-xl
            border
            border-black/15
            px-4
            text-sm
            outline-none
            transition
            focus:border-black
          "
        />
      </div>

      {/* ==================================================================
          FONT FAMILY — live preview rendered in each font
      ================================================================== */}

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-bold text-black/60">
          Font Style
        </label>

        <div className="grid grid-cols-2 gap-2">
          {STICKER_FONTS.map((font) => {
            const isSelected =
              layer.fontFamily === font.fontFamily;

            return (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  onChange({ fontFamily: font.fontFamily });
                  onCommitHistory();
                }}
                className={`
                  rounded-xl
                  border
                  px-3
                  py-2.5
                  text-left
                  transition

                  ${
                    isSelected
                      ? "border-hive-yellow bg-hive-yellow/15"
                      : "border-black/10 hover:bg-cream"
                  }
                `}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wide text-black/40">
                  {font.label}
                </span>
                <span
                  style={{
                    fontFamily: font.fontFamily,
                    fontWeight:
                      font.previewWeight === "bold" ? 700 : 400,
                  }}
                  className="block truncate text-lg leading-tight"
                >
                  {layer.text.trim() || "Sticker"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================
          SIZE + WEIGHT
      ================================================================== */}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="sticker-text-size"
            className="mb-1.5 block text-xs font-bold text-black/60"
          >
            Size ({layer.fontSize}px)
          </label>

          <input
            id="sticker-text-size"
            type="range"
            min={12}
            max={96}
            step={2}
            value={layer.fontSize}
            onChange={(event) =>
              onChange({
                fontSize: Number(event.target.value),
              })
            }
            onMouseUp={onCommitHistory}
            onTouchEnd={onCommitHistory}
            className="w-full accent-black"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-black/60">
            Weight
          </p>

          <button
            type="button"
            onClick={() => {
              onChange({
                fontWeight:
                  layer.fontWeight === "bold" ? "normal" : "bold",
              });
              onCommitHistory();
            }}
            className={`
              flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              text-sm
              font-bold
              transition

              ${
                layer.fontWeight === "bold"
                  ? "border-hive-yellow bg-hive-yellow/15"
                  : "border-black/10 hover:bg-cream"
              }
            `}
          >
            <Bold size={15} />
            Bold
          </button>
        </div>
      </div>

      {/* ==================================================================
          ALIGNMENT
      ================================================================== */}

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-bold text-black/60">
          Alignment
        </p>

        <div className="flex gap-2">
          {(
            [
              { value: "left" as const, icon: AlignLeft },
              { value: "center" as const, icon: AlignCenter },
              { value: "right" as const, icon: AlignRight },
            ]
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onChange({ align: value });
                onCommitHistory();
              }}
              className={`
                flex
                size-11
                items-center
                justify-center
                rounded-xl
                border
                transition

                ${
                  layer.align === value
                    ? "border-hive-yellow bg-hive-yellow/15"
                    : "border-black/10 hover:bg-cream"
                }
              `}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================
          COLOR
      ================================================================== */}

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-bold text-black/60">
          Color
        </p>

        <ColorSwatchRow
          colors={FILL_SWATCHES}
          activeColor={layer.fill}
          onSelect={(color) => {
            onChange({ fill: color });
            onCommitHistory();
          }}
        />
      </div>

      {/* ==================================================================
          OUTLINE / STROKE — the classic bold sticker-text outline
      ================================================================== */}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PenTool size={13} className="text-black/40" />
            <p className="text-xs font-bold text-black/60">
              Outline
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (hasStroke) {
                onChange({ strokeColor: null, strokeWidth: 0 });
              } else {
                onChange({
                  strokeColor: layer.fill === "#ffffff" ? "#111111" : "#ffffff",
                  strokeWidth: 6,
                });
              }
              onCommitHistory();
            }}
            className={`
              rounded-full
              px-3
              py-1
              text-[11px]
              font-bold
              transition

              ${
                hasStroke
                  ? "bg-black text-white"
                  : "bg-black/5 text-black/50 hover:bg-black/10"
              }
            `}
          >
            {hasStroke ? "On" : "Off"}
          </button>
        </div>

        {hasStroke && (
          <div className="mt-3 space-y-3">
            <div>
              <label
                htmlFor="sticker-text-stroke-width"
                className="mb-1.5 block text-[11px] font-semibold text-black/50"
              >
                Thickness ({layer.strokeWidth}px)
              </label>

              <input
                id="sticker-text-stroke-width"
                type="range"
                min={1}
                max={16}
                step={1}
                value={layer.strokeWidth}
                onChange={(event) =>
                  onChange({
                    strokeWidth: Number(event.target.value),
                  })
                }
                onMouseUp={onCommitHistory}
                onTouchEnd={onCommitHistory}
                className="w-full accent-black"
              />
            </div>

            <ColorSwatchRow
              colors={STROKE_SWATCHES}
              activeColor={layer.strokeColor ?? "#ffffff"}
              onSelect={(color) => {
                onChange({ strokeColor: color });
                onCommitHistory();
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}