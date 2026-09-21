"use client";

import { useEffect, useRef } from "react";
import { Ban } from "lucide-react";

// ============================================================================
// BORDER COLOR PICKER (Task 4)
// ============================================================================
// A colored outline around the sticker's overall die-cut shape, not a
// per-element property - the classic Sticker.ly "real sticker" finish.
// Rendering itself lives in sticker-canvas.tsx (reuses the exact boundary
// geometry the die-cut/shape guides already compute); this is just the
// primary-row popover that sets the color.

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

export default function BorderColorPicker({
  color,
  onChange,
  onClose,
}: {
  color: string | null;
  onChange: (color: string | null) => void;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Sticker border color"
      className="
        absolute
        left-0
        top-full
        z-30
        mt-2
        w-64
        rounded-2xl
        border
        border-black/10
        bg-white
        p-3
        shadow-[0_20px_50px_rgba(0,0,0,0.15)]
      "
    >
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
        Sticker outline
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          title="No outline"
          aria-label="No outline"
          className={`
            flex
            size-9
            items-center
            justify-center
            rounded-full
            border-2
            bg-white
            text-black/40
            transition

            ${
              color === null
                ? "border-black scale-110"
                : "border-black/10 hover:scale-105"
            }
          `}
        >
          <Ban size={16} />
        </button>

        {BORDER_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            style={{ backgroundColor: swatch }}
            title={swatch}
            className={`
              size-9
              rounded-full
              border-2
              transition

              ${
                color === swatch
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
            value={color ?? "#ffffff"}
            onChange={(event) => onChange(event.target.value)}
            className="
              absolute
              inset-0
              size-full
              cursor-pointer
              opacity-0
            "
          />
        </label>
      </div>
    </div>
  );
}
