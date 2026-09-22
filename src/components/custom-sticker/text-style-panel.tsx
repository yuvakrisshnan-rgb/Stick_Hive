"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  PenTool,
  Sparkles,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";

import { STICKER_FONTS } from "@/lib/custom-sticker/fonts";
import type { StickerTextLayer } from "@/lib/cart/types";

// ============================================================================
// TEXT STYLE PANEL (Task 3) — floating, top-right of the canvas when a text
// layer is selected. Upgrades the prior sprint's always-visible side-panel
// version: font is now a real dropdown (was a 2-col grid), adds Italic/
// Underline/Shadow (new fields — see cart/types.ts) and 3 one-tap presets.
// Outline/color/size/bold/align are the same working controls, just in
// floating chrome instead of a card in a side column.
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

type Preset = {
  label: string;
  apply: (fill: string) => Partial<StickerTextLayer>;
};

const PRESETS: Preset[] = [
  {
    label: "Bold Outline",
    apply: () => ({
      fill: "#ffffff",
      strokeColor: "#111111",
      strokeWidth: 6,
      fontWeight: "bold",
      backgroundColor: null,
      shadow: false,
    }),
  },
  {
    label: "Dark Pill",
    apply: () => ({
      fill: "#ffffff",
      backgroundColor: "#111111",
      strokeColor: null,
      strokeWidth: 0,
      fontWeight: "bold",
      shadow: false,
    }),
  },
  {
    label: "Accent Pill",
    apply: () => ({
      fill: "#111111",
      backgroundColor: "#ffd43b",
      strokeColor: null,
      strokeWidth: 0,
      fontWeight: "bold",
      shadow: false,
    }),
  },
];

function ColorSwatchRow({
  colors,
  activeColor,
  onSelect,
}: {
  colors: string[];
  activeColor: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          style={{ backgroundColor: color }}
          className={`
            size-7
            rounded-full
            border-2
            transition

            ${
              activeColor === color
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
          size-7
          cursor-pointer
          items-center
          justify-center
          overflow-hidden
          rounded-full
          border-2
          border-dashed
          border-black/20
          text-[9px]
          font-bold
          text-black/40
        "
      >
        +
        <input
          type="color"
          value={activeColor}
          onChange={(event) => onSelect(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function ToggleButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`
        flex
        size-9
        items-center
        justify-center
        rounded-xl
        border
        transition

        ${
          active
            ? "border-hive-yellow bg-hive-yellow/15"
            : "border-black/10 hover:bg-cream"
        }
      `}
    >
      <Icon size={15} />
    </button>
  );
}

export default function TextStylePanel({
  layer,
  onChange,
  onCommitHistory,
  onClose,
}: {
  layer: StickerTextLayer;
  onChange: (updates: Partial<StickerTextLayer>) => void;
  onCommitHistory: () => void;
  /** Hides the panel only - deselecting, same as clicking empty canvas or
   *  the pill toolbar disappearing. Never deletes/resets the layer. */
  onClose: () => void;
}) {
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const hasStroke = Boolean(layer.strokeColor) && layer.strokeWidth > 0;
  const activeFont =
    STICKER_FONTS.find((font) => font.fontFamily === layer.fontFamily) ??
    STICKER_FONTS[0];

  // Escape dismiss only - NOT a generic outside-click listener. The pill
  // toolbar (this panel's own audited precedent) has no such listener
  // either; it closes purely by deselecting, via the Konva stage's own
  // empty-area click check (handleStageMouseDown in sticker-canvas.tsx),
  // which already correctly distinguishes "clicked empty canvas" from
  // "clicked/dragged a shape" or "clicked the pill toolbar/Transformer
  // handles" using Konva's real hit-testing. A naive DOM-wide pointerdown
  // listener can't replicate that distinction and would fire on the same
  // pointerdown that starts dragging the selected shape or pressing a
  // Transformer handle or a pill-toolbar button (all physically outside
  // this panel's own DOM node), deselecting mid-gesture and breaking
  // drag/resize/duplicate for anything selected while this panel is open.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function apply(updates: Partial<StickerTextLayer>) {
    onChange(updates);
    onCommitHistory();
  }

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
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
          Text Style
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          title="Close panel"
          className="
            flex
            size-6
            items-center
            justify-center
            rounded-full
            text-black/40
            transition
            hover:bg-black/5
            hover:text-black
          "
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="mt-2">
        <label
          htmlFor="sticker-text-content"
          className="mb-1 block text-[11px] font-bold text-black/50"
        >
          Text
        </label>
        <input
          id="sticker-text-content"
          type="text"
          value={layer.text}
          onChange={(event) => onChange({ text: event.target.value })}
          onBlur={onCommitHistory}
          placeholder="Enter your text"
          className="
            h-10
            w-full
            rounded-xl
            border
            border-black/15
            px-3
            text-sm
            outline-none
            transition
            focus:border-black
          "
        />
      </div>

      {/* Quick presets */}
      <div className="mt-3 flex items-center gap-2">
        <Sparkles size={13} className="shrink-0 text-black/30" />
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => apply(preset.apply(layer.fill))}
              className="
                shrink-0
                rounded-full
                bg-cream
                px-3
                py-1.5
                text-[11px]
                font-bold
                transition
                hover:bg-hive-yellow
              "
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font dropdown */}
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setFontMenuOpen((value) => !value)}
          className="
            flex
            h-10
            w-full
            items-center
            justify-between
            rounded-xl
            border
            border-black/15
            px-3
            text-sm
            font-semibold
            transition
            hover:bg-cream
          "
        >
          <span style={{ fontFamily: activeFont.fontFamily }}>
            {activeFont.label}
          </span>
          <ChevronDown size={14} className="text-black/40" />
        </button>

        {fontMenuOpen && (
          <div
            className="
              absolute
              left-0
              right-0
              top-full
              z-10
              mt-1
              max-h-52
              overflow-y-auto
              rounded-xl
              border
              border-black/10
              bg-white
              p-1
              shadow-[0_15px_40px_rgba(0,0,0,0.15)]
            "
          >
            {STICKER_FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  apply({ fontFamily: font.fontFamily });
                  setFontMenuOpen(false);
                }}
                style={{ fontFamily: font.fontFamily }}
                className={`
                  flex
                  w-full
                  items-center
                  rounded-lg
                  px-3
                  py-2
                  text-left
                  text-sm
                  transition
                  hover:bg-cream

                  ${
                    font.fontFamily === layer.fontFamily
                      ? "bg-hive-yellow/15"
                      : ""
                  }
                `}
              >
                {font.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Size stepper */}
      <div className="mt-3">
        <label
          htmlFor="text-style-size"
          className="mb-1 block text-[11px] font-bold text-black/50"
        >
          Size ({layer.fontSize}px)
        </label>
        <input
          id="text-style-size"
          type="range"
          min={12}
          max={96}
          step={2}
          value={layer.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
          onMouseUp={onCommitHistory}
          onTouchEnd={onCommitHistory}
          className="w-full accent-black"
        />
      </div>

      {/* Style toggles: Bold / Italic / Underline + alignment */}
      <div className="mt-3 flex items-center gap-1.5">
        <ToggleButton
          icon={Bold}
          label="Bold"
          active={layer.fontWeight === "bold"}
          onClick={() =>
            apply({ fontWeight: layer.fontWeight === "bold" ? "normal" : "bold" })
          }
        />
        <ToggleButton
          icon={Italic}
          label="Italic"
          active={Boolean(layer.italic)}
          onClick={() => apply({ italic: !layer.italic })}
        />
        <ToggleButton
          icon={UnderlineIcon}
          label="Underline"
          active={Boolean(layer.underline)}
          onClick={() => apply({ underline: !layer.underline })}
        />

        <div className="mx-0.5 h-6 w-px bg-black/10" />

        {(
          [
            { value: "left" as const, icon: AlignLeft },
            { value: "center" as const, icon: AlignCenter },
            { value: "right" as const, icon: AlignRight },
          ]
        ).map(({ value, icon }) => (
          <ToggleButton
            key={value}
            icon={icon}
            label={`Align ${value}`}
            active={layer.align === value}
            onClick={() => apply({ align: value })}
          />
        ))}
      </div>

      {/* Color */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-bold text-black/50">Color</p>
        <ColorSwatchRow
          colors={FILL_SWATCHES}
          activeColor={layer.fill}
          onSelect={(color) => apply({ fill: color })}
        />
      </div>

      {/* Outline */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PenTool size={13} className="text-black/40" />
          <p className="text-[11px] font-bold text-black/50">Outline</p>
        </div>
        <button
          type="button"
          onClick={() =>
            apply(
              hasStroke
                ? { strokeColor: null, strokeWidth: 0 }
                : {
                    strokeColor: layer.fill === "#ffffff" ? "#111111" : "#ffffff",
                    strokeWidth: 6,
                  },
            )
          }
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
        <div className="mt-2">
          <ColorSwatchRow
            colors={STROKE_SWATCHES}
            activeColor={layer.strokeColor ?? "#ffffff"}
            onSelect={(color) => apply({ strokeColor: color })}
          />
        </div>
      )}

      {/* Shadow */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] font-bold text-black/50">Shadow</p>
        <button
          type="button"
          onClick={() => apply({ shadow: !layer.shadow })}
          className={`
            rounded-full
            px-3
            py-1
            text-[11px]
            font-bold
            transition

            ${
              layer.shadow
                ? "bg-black text-white"
                : "bg-black/5 text-black/50 hover:bg-black/10"
            }
          `}
        >
          {layer.shadow ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
