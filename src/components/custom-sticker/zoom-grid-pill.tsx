"use client";

import { Grid3x3, Minus, Plus, Scan } from "lucide-react";

import IconButton from "./icon-button";
import { MIN_ZOOM, MAX_ZOOM } from "./sticker-canvas";

const ZOOM_STEP = 0.1;

export default function ZoomGridPill({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
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
        pointer-events-auto
        absolute
        bottom-4
        left-1/2
        z-20
        flex
        -translate-x-1/2
        items-center
        gap-0.5
        rounded-2xl
        border
        border-black/10
        bg-white
        p-1
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
      "
    >
      <IconButton icon={Minus} label="Zoom out" size="sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} />

      <span className="w-11 text-center text-xs font-bold tabular-nums">
        {Math.round(zoom * 100)}%
      </span>

      <IconButton icon={Plus} label="Zoom in" size="sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} />

      <div className="mx-0.5 h-6 w-px bg-black/10" />

      <IconButton
        icon={Grid3x3}
        label="Toggle cutline guide"
        size="sm"
        onClick={onToggleGrid}
        active={showGrid}
      />

      <IconButton icon={Scan} label="Fit to screen" size="sm" onClick={() => onZoomChange(1)} />
    </div>
  );
}
