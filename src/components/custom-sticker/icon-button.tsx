"use client";

// ============================================================================
// ICON BUTTON — the ONE shared control used everywhere in the top bar, rail,
// and every floating toolbar/panel. Previously each toolbar picked its own
// icon size and button footprint independently (14-17px icons, size-8 to
// size-11 buttons) — that inconsistency, not spacing, was the real cause of
// the "misaligned" complaint (see DECISIONS.md Task 0 diagnosis). One scale,
// used everywhere, fixes it structurally instead of per-instance.
// ============================================================================

const SIZE_CLASSES = {
  sm: "size-9",
  md: "size-10",
  lg: "size-11",
} as const;

const ICON_PX = {
  sm: 15,
  md: 17,
  lg: 19,
} as const;

export type IconButtonSize = keyof typeof SIZE_CLASSES;

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  size = "md",
  danger,
  className = "",
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: IconButtonSize;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`
        flex
        ${SIZE_CLASSES[size]}
        shrink-0
        items-center
        justify-center
        rounded-xl
        transition
        disabled:cursor-not-allowed
        disabled:opacity-30
        disabled:hover:bg-transparent

        ${
          active
            ? "bg-hive-yellow/25 text-black hover:bg-hive-yellow/35"
            : danger
              ? "text-black/60 hover:bg-red-50 hover:text-red-500"
              : "text-black/60 hover:bg-cream hover:text-black"
        }

        ${className}
      `}
    >
      <Icon size={ICON_PX[size]} />
    </button>
  );
}
