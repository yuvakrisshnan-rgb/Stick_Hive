"use client";

import FlyoutPopover from "./flyout-popover";

// ============================================================================
// CANVAS BACKGROUND FLYOUT (right-rail "Background" icon)
// ============================================================================
// No prior feature existed for this — the canvas backdrop behind the print
// area was a hardcoded "#e8e8e8" fill in sticker-canvas.tsx. This makes it a
// real, saved-with-the-design choice (a handful of neutral swatches plus a
// custom picker), not a cosmetic-only change.

const BACKGROUND_SWATCHES = [
  { color: "#e8e8e8", label: "Grey" },
  { color: "#fff8ed", label: "Cream" },
  { color: "#ffffff", label: "White" },
  { color: "#111111", label: "Black" },
  { color: "#fde2e2", label: "Blush" },
  { color: "#e2f0fd", label: "Sky" },
  { color: "#e7f7e7", label: "Mint" },
  { color: "#fff3d6", label: "Sand" },
];

export default function BackgroundFlyout({
  color,
  onChange,
  onClose,
}: {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  return (
    <FlyoutPopover label="Canvas background" onClose={onClose} widthClassName="w-64">
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
          Canvas Background
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {BACKGROUND_SWATCHES.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              onClick={() => onChange(swatch.color)}
              title={swatch.label}
              style={{ backgroundColor: swatch.color }}
              className={`
                size-9
                rounded-full
                border-2
                transition

                ${
                  color === swatch.color
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
              value={color}
              onChange={(event) => onChange(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>
    </FlyoutPopover>
  );
}
