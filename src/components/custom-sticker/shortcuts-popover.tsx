"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

const SHORTCUTS: [string, string][] = [
  ["Delete / Backspace", "Delete selected element"],
  ["Ctrl/Cmd + D", "Duplicate selected element"],
  ["Arrow keys", "Nudge selected element (1px)"],
  ["Shift + Arrow keys", "Nudge selected element (10px)"],
  ["Escape", "Close open panel"],
];

export default function ShortcutsPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="pointer-events-auto absolute bottom-4 left-4 z-20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        className="
          flex
          size-9
          items-center
          justify-center
          rounded-full
          border
          border-black/10
          bg-white
          text-black/50
          shadow-[0_10px_25px_rgba(0,0,0,0.12)]
          transition
          hover:text-black
        "
      >
        <HelpCircle size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Keyboard shortcuts"
          className="
            absolute
            bottom-full
            left-0
            mb-2
            w-64
            rounded-2xl
            border
            border-black/10
            bg-white
            p-3
            shadow-[0_20px_50px_rgba(0,0,0,0.18)]
          "
        >
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
            Keyboard Shortcuts
          </p>
          <dl className="space-y-1.5">
            {SHORTCUTS.map(([key, description]) => (
              <div key={key} className="flex items-center justify-between gap-3 px-1">
                <dt className="rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-bold text-black/60">
                  {key}
                </dt>
                <dd className="text-right text-[11px] text-black/50">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
