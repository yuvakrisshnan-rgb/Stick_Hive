"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// EMOJI PICKER
// ============================================================================
// A quick-add element type distinct from the image-upload flow (Task 3) -
// checked package.json first: no emoji-picker library is already installed
// (emoji-picker-react, emoji-mart, etc. - none present). Rather than add a
// new dependency for what's fundamentally a static lookup grid, this
// renders real Unicode emoji characters directly - every modern OS/browser
// already renders these natively via its system emoji font, so there's no
// asset to ship or bundle-size cost at all. Selecting one hands the caller
// a plain string; sticker-builder.tsx adds it as an ordinary text layer
// (large font size, no special-cased "emoji layer" type needed - it's just
// text that happens to be an emoji, so it gets drag/resize/rotate/flip/lock
// for free from the exact same code path every text layer already uses).

const CURATED_EMOJI = [
  "😀", "😂", "🥹", "😍", "😎", "🥳", "😭", "😡",
  "🤔", "🙄", "😴", "🤯", "🥺", "😇", "🤩", "😱",
  "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "💯",
  "🔥", "✨", "⭐", "🌈", "☀️", "🌙", "⚡", "💧",
  "👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "👀",
  "🐝", "🐶", "🐱", "🦄", "🐼", "🦋", "🌸", "🍀",
  "🍕", "🍔", "🍩", "🍦", "☕", "🎂", "🍓", "🥑",
  "🎉", "🎈", "🎁", "🏆", "💰", "📌", "💡", "🚀",
];

export default function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
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
      aria-label="Add emoji"
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
        Tap to add
      </p>

      <div className="grid grid-cols-8 gap-1">
        {CURATED_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="
              flex
              size-7
              items-center
              justify-center
              rounded-lg
              text-lg
              leading-none
              transition
              hover:scale-110
              hover:bg-cream
            "
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
