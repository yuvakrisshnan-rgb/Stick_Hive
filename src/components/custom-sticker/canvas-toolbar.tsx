"use client";

import { useState } from "react";

import {
  Copy,
  FlipHorizontal,
  ImagePlus,
  Lock,
  Minus,
  Palette,
  Plus,
  Redo2,
  SmilePlus,
  Trash2,
  Type,
  Undo2,
  Unlock,
} from "lucide-react";

import { MIN_ZOOM, MAX_ZOOM } from "./sticker-canvas";
import EmojiPicker from "./emoji-picker";
import BorderColorPicker from "./border-color-picker";

// ============================================================================
// PROPS
// ============================================================================
// Sticker.ly-style layout, not one long unlabeled icon strip (see
// DECISIONS.md's Task 0 diagnosis): a primary row of clearly labeled
// actions (icon + text), then a secondary row of icon-only tools that all
// share one consistent icon size and button size - the mismatched sizes
// across this row (14-17px icons, size-8 to size-11 buttons) were the
// actual, specific cause of the "misaligned" complaint, not a layout bug.

type CanvasToolbarProps = {
  onAddText: () => void;
  onAddImageClick: () => void;
  onAddEmoji: (emoji: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onFlipSelected: () => void;
  onToggleLockSelected: () => void;
  hasSelectedLayer: boolean;
  selectedLayerType: "image" | "text" | null;
  selectedLayerLocked: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  borderColor: string | null;
  onBorderColorChange: (color: string | null) => void;
};

// ============================================================================
// SHARED ICON-BUTTON SIZE TOKENS
// ============================================================================
// One scale for every icon-only control in this toolbar, instead of each
// button picking its own icon size independently.

const ICON_BUTTON_SIZE = "size-10";
const ICON_SIZE = 17;

// ============================================================================
// TOOLBAR BUTTON (icon-only, secondary row)
// ============================================================================

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
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
        ${ICON_BUTTON_SIZE}
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
            : "text-black/60 hover:bg-cream hover:text-black"
        }
      `}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// PRIMARY ACTION BUTTON (labeled, icon + text)
// ============================================================================

function PrimaryButton({
  icon,
  label,
  onClick,
  variant = "light",
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "dark" | "light";
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        shrink-0
        flex-col
        items-center
        gap-1
        rounded-2xl
        px-4
        py-2.5
        text-[11px]
        font-bold
        transition

        ${
          variant === "dark"
            ? "bg-black text-white hover:scale-[1.02]"
            : active
              ? "bg-hive-yellow text-black"
              : "bg-cream text-black hover:bg-hive-yellow"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================================
// ZOOM CONTROL
// ============================================================================

const ZOOM_STEP = 0.1;

function ZoomControl({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  function zoomOut() {
    onZoomChange(Math.max(MIN_ZOOM, Number((zoom - ZOOM_STEP).toFixed(2))));
  }

  function zoomIn() {
    onZoomChange(Math.min(MAX_ZOOM, Number((zoom + ZOOM_STEP).toFixed(2))));
  }

  return (
    <div
      className="
        flex
        shrink-0
        items-center
        gap-1
        rounded-xl
        bg-cream
        px-1
        py-1
      "
    >
      <button
        type="button"
        onClick={zoomOut}
        disabled={zoom <= MIN_ZOOM}
        aria-label="Zoom out"
        className="
          flex
          size-8
          items-center
          justify-center
          rounded-lg
          transition
          hover:bg-white
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Minus size={14} />
      </button>

      <span className="w-11 text-center text-xs font-bold tabular-nums">
        {Math.round(zoom * 100)}%
      </span>

      <button
        type="button"
        onClick={zoomIn}
        disabled={zoom >= MAX_ZOOM}
        aria-label="Zoom in"
        className="
          flex
          size-8
          items-center
          justify-center
          rounded-lg
          transition
          hover:bg-white
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// CANVAS TOOLBAR
// ============================================================================

export default function CanvasToolbar({
  onAddText,
  onAddImageClick,
  onAddEmoji,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDeleteSelected,
  onDuplicateSelected,
  onFlipSelected,
  onToggleLockSelected,
  hasSelectedLayer,
  selectedLayerType,
  selectedLayerLocked,
  zoom,
  onZoomChange,
  borderColor,
  onBorderColorChange,
}: CanvasToolbarProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* ==================================================================
          PRIMARY ACTIONS — labeled, Sticker.ly-style: what you'd reach for
          first, not buried in an icon strip.
      ================================================================== */}

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton
          icon={<Type size={18} />}
          label="Add Text"
          onClick={onAddText}
          variant="dark"
        />

        <PrimaryButton
          icon={<ImagePlus size={18} />}
          label="Add Image"
          onClick={onAddImageClick}
        />

        <div className="relative shrink-0">
          <PrimaryButton
            icon={<SmilePlus size={18} />}
            label="Add Emoji"
            onClick={() => {
              setColorPickerOpen(false);
              setEmojiPickerOpen((open) => !open);
            }}
            active={emojiPickerOpen}
          />

          {emojiPickerOpen && (
            <EmojiPicker
              onSelect={(emoji) => {
                onAddEmoji(emoji);
                setEmojiPickerOpen(false);
              }}
              onClose={() => setEmojiPickerOpen(false)}
            />
          )}
        </div>

        <div className="relative shrink-0">
          <PrimaryButton
            icon={<Palette size={18} />}
            label="Colors"
            onClick={() => {
              setEmojiPickerOpen(false);
              setColorPickerOpen((open) => !open);
            }}
            active={colorPickerOpen}
          />

          {colorPickerOpen && (
            <BorderColorPicker
              color={borderColor}
              onChange={onBorderColorChange}
              onClose={() => setColorPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* ==================================================================
          SECONDARY TOOLS — act on the current selection/history. Icon-only
          with tooltips (title + aria-label) is fine here since these apply
          to an already-selected element, but every button shares the exact
          same icon size and button footprint (ICON_SIZE / ICON_BUTTON_SIZE
          above) rather than each picking its own - that inconsistency was
          the real cause of the alignment complaint, not this row's
          existence.
      ================================================================== */}

      <div
        className="
          flex
          items-center
          gap-2
          overflow-x-auto
          rounded-2xl
          border
          border-black/5
          bg-white
          px-3
          py-2
        "
      >
        <div className="flex shrink-0 items-center gap-0.5">
          <ToolbarButton
            icon={<Undo2 size={ICON_SIZE} />}
            label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
          />

          <ToolbarButton
            icon={<Redo2 size={ICON_SIZE} />}
            label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
          />
        </div>

        <div className="h-6 w-px shrink-0 bg-black/10" />

        <div className="flex shrink-0 items-center gap-0.5">
          <ToolbarButton
            icon={<Copy size={ICON_SIZE} />}
            label="Duplicate"
            onClick={onDuplicateSelected}
            disabled={!hasSelectedLayer}
          />

          <ToolbarButton
            icon={<FlipHorizontal size={ICON_SIZE} />}
            label="Flip horizontal"
            onClick={onFlipSelected}
            disabled={!hasSelectedLayer || selectedLayerType !== "image"}
          />

          <ToolbarButton
            icon={
              selectedLayerLocked ? (
                <Lock size={ICON_SIZE} />
              ) : (
                <Unlock size={ICON_SIZE} />
              )
            }
            label={selectedLayerLocked ? "Unlock" : "Lock"}
            onClick={onToggleLockSelected}
            disabled={!hasSelectedLayer}
            active={selectedLayerLocked}
          />

          <ToolbarButton
            icon={<Trash2 size={ICON_SIZE} />}
            label="Delete"
            onClick={onDeleteSelected}
            disabled={!hasSelectedLayer || selectedLayerLocked}
          />
        </div>

        <div className="h-6 w-px shrink-0 bg-black/10" />

        <ZoomControl zoom={zoom} onZoomChange={onZoomChange} />
      </div>
    </div>
  );
}
