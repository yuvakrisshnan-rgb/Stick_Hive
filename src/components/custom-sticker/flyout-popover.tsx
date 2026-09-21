"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// FLYOUT POPOVER — shared anchored-popover chrome for every right-rail
// flyout (Emoji, Sticker Shape, Background, Layers, My Designs). Anchors to
// the LEFT of the trigger icon (the rail lives at the right edge of the
// screen) and dismisses on outside click or Escape — the same dismiss logic
// three separate components (EmojiPicker, BorderColorPicker, and their
// predecessors) each implemented independently before this pass.
// ============================================================================

export default function FlyoutPopover({
  label,
  onClose,
  children,
  widthClassName = "w-72",
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
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
      aria-label={label}
      className={`
        absolute
        right-full
        top-1/2
        z-30
        mr-3
        ${widthClassName}
        max-w-[calc(100vw-96px)]
        -translate-y-1/2
        rounded-2xl
        border
        border-black/10
        bg-white
        shadow-[0_20px_50px_rgba(0,0,0,0.18)]
      `}
    >
      {children}
    </div>
  );
}
