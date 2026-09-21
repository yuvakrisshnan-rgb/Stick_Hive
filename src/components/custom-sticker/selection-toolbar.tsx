"use client";

import {
  AlignCenter,
  Copy,
  Eraser,
  FlipHorizontal,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";

import IconButton from "./icon-button";

// ============================================================================
// SELECTION PILL TOOLBAR (floating, appears above the selected element)
// ============================================================================
// "Align" has no multi-select to align relative to (confirmed absent
// elsewhere in this codebase — see Task 0 audit), so it's scoped to what's
// actually buildable today: centering the single selected element on the
// canvas (both axes), not align-to-other-elements/distribute.
// ============================================================================

export default function SelectionToolbar({
  style,
  layerType,
  locked,
  onDuplicate,
  onFlip,
  onErase,
  onAlignCenter,
  onToggleLock,
  onDelete,
}: {
  style: React.CSSProperties;
  layerType: "image" | "text";
  locked: boolean;
  onDuplicate: () => void;
  onFlip: () => void;
  onErase: () => void;
  onAlignCenter: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={style}
      className="
        pointer-events-auto
        absolute
        z-20
        flex
        items-center
        gap-0.5
        rounded-2xl
        border
        border-black/5
        bg-white
        p-1
        shadow-[0_10px_30px_rgba(0,0,0,0.18)]
      "
    >
      <IconButton icon={Copy} label="Duplicate" size="sm" onClick={onDuplicate} />

      <IconButton
        icon={FlipHorizontal}
        label="Flip horizontal"
        size="sm"
        onClick={onFlip}
        disabled={layerType !== "image" || locked}
      />

      <IconButton
        icon={Eraser}
        label="Erase"
        size="sm"
        onClick={onErase}
        disabled={layerType !== "image" || locked}
      />

      <IconButton icon={AlignCenter} label="Center on canvas" size="sm" onClick={onAlignCenter} disabled={locked} />

      <IconButton
        icon={locked ? Lock : Unlock}
        label={locked ? "Unlock" : "Lock"}
        size="sm"
        onClick={onToggleLock}
        active={locked}
      />

      <div className="mx-0.5 h-6 w-px bg-black/10" />

      <IconButton
        icon={Trash2}
        label="Delete"
        size="sm"
        onClick={onDelete}
        disabled={locked}
        danger
      />
    </div>
  );
}
