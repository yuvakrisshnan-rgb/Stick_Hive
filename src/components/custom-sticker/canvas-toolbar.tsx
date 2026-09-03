"use client";

import {
  Copy,
  ImagePlus,
  Minus,
  Plus,
  Redo2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";

import { MIN_ZOOM, MAX_ZOOM } from "./sticker-canvas";

// ============================================================================
// PROPS
// ============================================================================

type CanvasToolbarProps = {
  onAddText: () => void;
  onAddImageClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  hasSelectedLayer: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="
        flex
        size-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        text-black/60
        transition
        hover:bg-cream
        hover:text-black
        disabled:cursor-not-allowed
        disabled:opacity-30
        disabled:hover:bg-transparent
      "
    >
      {icon}
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDeleteSelected,
  onDuplicateSelected,
  hasSelectedLayer,
  zoom,
  onZoomChange,
}: CanvasToolbarProps) {
  return (
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
      {/* ==================================================================
          ADD LAYER
      ================================================================== */}

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onAddText}
          className="
            flex
            shrink-0
            items-center
            gap-2
            rounded-xl
            bg-black
            px-4
            py-2.5
            text-xs
            font-bold
            text-white
            transition
            hover:scale-[1.02]
          "
        >
          <Type size={15} />
          Add Text
        </button>

        <button
          type="button"
          onClick={onAddImageClick}
          className="
            flex
            shrink-0
            items-center
            gap-2
            rounded-xl
            bg-cream
            px-4
            py-2.5
            text-xs
            font-bold
            transition
            hover:bg-hive-yellow
          "
        >
          <ImagePlus size={15} />
          Add Image
        </button>
      </div>

      <div className="h-6 w-px shrink-0 bg-black/10" />

      {/* ==================================================================
          HISTORY + LAYER ACTIONS
      ================================================================== */}

      <div className="flex shrink-0 items-center gap-0.5">
        <ToolbarButton
          icon={<Undo2 size={17} />}
          label="Undo"
          onClick={onUndo}
          disabled={!canUndo}
        />

        <ToolbarButton
          icon={<Redo2 size={17} />}
          label="Redo"
          onClick={onRedo}
          disabled={!canRedo}
        />

        <ToolbarButton
          icon={<Copy size={16} />}
          label="Duplicate Layer"
          onClick={onDuplicateSelected}
          disabled={!hasSelectedLayer}
        />

        <ToolbarButton
          icon={<Trash2 size={16} />}
          label="Delete Layer"
          onClick={onDeleteSelected}
          disabled={!hasSelectedLayer}
        />
      </div>

      <div className="h-6 w-px shrink-0 bg-black/10" />

      {/* ==================================================================
          ZOOM
      ================================================================== */}

      <ZoomControl zoom={zoom} onZoomChange={onZoomChange} />
    </div>
  );
}