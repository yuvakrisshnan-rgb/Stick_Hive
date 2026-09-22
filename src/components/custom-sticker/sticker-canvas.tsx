"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Konva from "konva";

import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Line,
  Rect,
  Transformer,
  Group,
} from "react-konva";

import type {
  StickerImageLayer,
  StickerLayer,
  StickerTextLayer,
  CustomStickerShape,
} from "@/lib/cart/types";

import type { ContourPoint } from "@/lib/custom-sticker/contour";

import SelectionToolbar from "./selection-toolbar";
import TextStylePanel from "./text-style-panel";
import ImageStylePanel from "./image-style-panel";
import ShortcutsPopover from "./shortcuts-popover";
import ZoomGridPill from "./zoom-grid-pill";

// ============================================================================
// CANVAS CONSTANTS
// ============================================================================

export const STAGE_SIZE = 500;
export const CANVAS_MARGIN = 40;
export const PRINT_AREA_SIZE = STAGE_SIZE - CANVAS_MARGIN * 2;

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;

const DIE_CUT_WHITE_BORDER_FACTOR = 1.08;
const SNAP_THRESHOLD = 6; // px, distance within which a layer snaps to a guide
const NUDGE_STEP = 1; // px per arrow key press
const NUDGE_STEP_SHIFT = 10; // px per shift+arrow key press

// ============================================================================
// PROPS
// ============================================================================

type StickerCanvasProps = {
  layers: StickerLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (
    id: string,
    updates: Partial<StickerLayer>,
  ) => void;
  onCommitHistory: () => void;
  shape: CustomStickerShape;
  stageRef: React.RefObject<Konva.Stage | null>;
  showGuides: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Sticker-wide outline color around the overall die-cut shape (Task 4)
   *  - null means no border. Unlike the dashed cut-line guide below, this
   *  is NOT gated by showGuides: it's part of the actual sticker, so it
   *  must still render during thumbnail/print export. */
  borderColor: string | null;
  borderWidth: number;
  canvasBackgroundColor: string;
  /** Visibility of the dashed cut-line guide + "die-cut ready" hint only.
   *  Deliberately separate from showGuides, which also gates the
   *  Transformer/snap-guides and is toggled off during thumbnail export —
   *  a user-facing "grid" toggle must never disable the ability to
   *  transform the selected element. */
  showCutGuide: boolean;
  onToggleShowCutGuide: () => void;
  // Floating per-selection pill toolbar (Task 1/6) — action handlers own by
  // sticker-builder.tsx, rendered here since this component already owns
  // the node refs needed to position the pill next to the selected element.
  onDuplicateSelected: () => void;
  onFlipSelected: () => void;
  onDeleteSelected: () => void;
  onToggleLockSelected: () => void;
  onOpenEraser: () => void;
  // Floating Image Settings panel (top-right, image layers only — see
  // sticker-canvas.tsx's report note: not explicitly in the approved
  // mockup, added to avoid regressing Replace/Reset Rotation/Make Die-cut
  // Ready/Restore Original, which have no other home in the new layout).
  onReplaceClick: () => void;
  onRemoveBackground: () => void;
  onRestoreOriginal: () => void;
  isDetectingContour: boolean;
  isRemovingBackground: boolean;
};

// ============================================================================
// HTML IMAGE LOADER HOOK
// ============================================================================

function useHtmlImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new window.Image();

    img.onload = () => setImage(img);
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return image;
}

// ============================================================================
// POLYGON HELPERS
// ============================================================================

function flattenPoints(points: ContourPoint[]): number[] {
  return points.flatMap((point) => [point.x, point.y]);
}

function offsetFromCentroid(
  points: ContourPoint[],
  factor: number,
): ContourPoint[] {
  const centroid = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  );

  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * factor,
    y: centroid.y + (point.y - centroid.y) * factor,
  }));
}

function cross(o: ContourPoint, a: ContourPoint, b: ContourPoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull(points: ContourPoint[]): ContourPoint[] {
  const unique = Array.from(
    new Map(points.map((point) => [`${point.x.toFixed(3)}:${point.y.toFixed(3)}`, point])).values(),
  ).sort((a, b) => a.x - b.x || a.y - b.y);

  if (unique.length <= 2) return unique;

  const lower: ContourPoint[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: ContourPoint[] = [];
  for (let i = unique.length - 1; i >= 0; i -= 1) {
    const point = unique[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function getDieCutPoints(layers: StickerLayer[]): ContourPoint[] | null {
  const points: ContourPoint[] = [];

  for (const layer of layers) {
    if (layer.type === "image") {
      // An opaque image has no trustworthy silhouette. Do not pretend its
      // rectangular bounds are a die-cut outline. The Image Settings panel
      // lets the user create a transparent version first.
      if (!layer.contourPoints?.length) {
        return null;
      }

      for (const point of layer.contourPoints) {
        points.push({
          x: layer.x + point.x * layer.width,
          y: layer.y + point.y * layer.height,
        });
      }
      continue;
    }

    points.push(
      { x: layer.x, y: layer.y },
      { x: layer.x + layer.width, y: layer.y },
      { x: layer.x + layer.width, y: layer.y + layer.fontSize * 1.15 },
      { x: layer.x, y: layer.y + layer.fontSize * 1.15 },
    );
  }

  const hull = convexHull(points);
  return hull.length >= 3 ? hull : null;
}

// ============================================================================
// SNAP GUIDE HELPERS
// ============================================================================
// Computes horizontal/vertical guide lines (canvas center + other layer
// edges/centers) and returns the snapped position for a layer being dragged.

type SnapLines = { vertical: number[]; horizontal: number[] };

function getSnapCandidates(
  layers: StickerLayer[],
  excludeId: string,
  getBounds: (layer: StickerLayer) => {
    left: number;
    right: number;
    centerX: number;
    top: number;
    bottom: number;
    centerY: number;
  },
): SnapLines {
  const vertical = [
    CANVAS_MARGIN,
    CANVAS_MARGIN + PRINT_AREA_SIZE / 2,
    CANVAS_MARGIN + PRINT_AREA_SIZE,
  ];

  const horizontal = [
    CANVAS_MARGIN,
    CANVAS_MARGIN + PRINT_AREA_SIZE / 2,
    CANVAS_MARGIN + PRINT_AREA_SIZE,
  ];

  layers
    .filter((layer) => layer.id !== excludeId)
    .forEach((layer) => {
      const bounds = getBounds(layer);
      vertical.push(bounds.left, bounds.centerX, bounds.right);
      horizontal.push(bounds.top, bounds.centerY, bounds.bottom);
    });

  return { vertical, horizontal };
}

function snapValue(
  value: number,
  candidates: number[],
): { value: number; snapped: boolean; guideAt: number | null } {
  for (const candidate of candidates) {
    if (Math.abs(value - candidate) <= SNAP_THRESHOLD) {
      return { value: candidate, snapped: true, guideAt: candidate };
    }
  }

  return { value, snapped: false, guideAt: null };
}

// ============================================================================
// IMAGE LAYER NODE
// ============================================================================

function ImageLayerNode({
  layer,
  onSelect,
  onChange,
  onCommitHistory,
  registerRef,
  layers,
  onDragGuides,
}: {
  layer: StickerImageLayer;
  onSelect: () => void;
  onChange: (updates: Partial<StickerImageLayer>) => void;
  onCommitHistory: () => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
  layers: StickerLayer[];
  onDragGuides: (guides: SnapLines | null) => void;
}) {
  const image = useHtmlImage(layer.src);
  const shapeRef = useRef<Konva.Image | null>(null);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      ref={(node) => {
        shapeRef.current = node;
        registerRef(layer.id, node);
      }}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={(event) => {
        const node = event.target;

        const candidates = getSnapCandidates(
          layers,
          layer.id,
          (other) => {
            const w = other.type === "image" ? other.width : other.width;
            const h = other.type === "image" ? other.height : 0;
            return {
              left: other.x,
              right: other.x + w,
              centerX: other.x + w / 2,
              top: other.y,
              bottom: other.y + h,
              centerY: other.y + h / 2,
            };
          },
        );

        const left = node.x();
        const right = node.x() + layer.width;
        const centerX = node.x() + layer.width / 2;
        const top = node.y();
        const bottom = node.y() + layer.height;
        const centerY = node.y() + layer.height / 2;

        const snapLeft = snapValue(left, candidates.vertical);
        const snapCenterX = snapValue(centerX, candidates.vertical);
        const snapRight = snapValue(right, candidates.vertical);

        let newX = node.x();
        let vGuide: number | null = null;

        if (snapCenterX.snapped) {
          newX = snapCenterX.value - layer.width / 2;
          vGuide = snapCenterX.guideAt;
        } else if (snapLeft.snapped) {
          newX = snapLeft.value;
          vGuide = snapLeft.guideAt;
        } else if (snapRight.snapped) {
          newX = snapRight.value - layer.width;
          vGuide = snapRight.guideAt;
        }

        const snapTop = snapValue(top, candidates.horizontal);
        const snapCenterY = snapValue(centerY, candidates.horizontal);
        const snapBottom = snapValue(bottom, candidates.horizontal);

        let newY = node.y();
        let hGuide: number | null = null;

        if (snapCenterY.snapped) {
          newY = snapCenterY.value - layer.height / 2;
          hGuide = snapCenterY.guideAt;
        } else if (snapTop.snapped) {
          newY = snapTop.value;
          hGuide = snapTop.guideAt;
        } else if (snapBottom.snapped) {
          newY = snapBottom.value - layer.height;
          hGuide = snapBottom.guideAt;
        }

        node.x(newX);
        node.y(newY);

        onDragGuides({
          vertical: vGuide !== null ? [vGuide] : [],
          horizontal: hGuide !== null ? [hGuide] : [],
        });
      }}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x(),
          y: event.target.y(),
        });
        onDragGuides(null);
        onCommitHistory();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;

        if (!node) {
          return;
        }

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        });

        onCommitHistory();
      }}
    />
  );
}

// ============================================================================
// TEXT LAYER NODE
// ============================================================================

function TextLayerNode({
  layer,
  onSelect,
  onChange,
  onCommitHistory,
  registerRef,
  layers,
  onDragGuides,
}: {
  layer: StickerTextLayer;
  onSelect: () => void;
  onChange: (updates: Partial<StickerTextLayer>) => void;
  onCommitHistory: () => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
  layers: StickerLayer[];
  onDragGuides: (guides: SnapLines | null) => void;
}) {
  const shapeRef = useRef<Konva.Text | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(layer.fontSize * 1.2);

  useEffect(() => {
    const node = shapeRef.current;
    if (node) {
      setMeasuredHeight(node.height());
    }
  }, [layer.text, layer.width, layer.fontSize, layer.fontFamily]);

  const fontStyle = [
    layer.fontWeight === "bold" ? "bold" : "",
    layer.italic ? "italic" : "",
  ]
    .filter(Boolean)
    .join(" ") || "normal";

  return (
    <>
      {layer.backgroundColor && (
        <Rect
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={measuredHeight}
          rotation={layer.rotation}
          fill={layer.backgroundColor}
          cornerRadius={measuredHeight / 2}
          listening={false}
        />
      )}

      <KonvaText
      ref={(node) => {
        shapeRef.current = node;
        registerRef(layer.id, node);
      }}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      rotation={layer.rotation}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fill={layer.fill}
      stroke={layer.strokeColor ?? undefined}
      strokeWidth={layer.strokeWidth ?? 0}
      fillAfterStrokeEnabled
      fontStyle={fontStyle}
      // Fixed-width word-wrap ("word", Konva's default) collapses to zero
      // renderable lines when a single unbreakable "word" (an emoji is one
      // grapheme) measures wider than the box - there's no smaller
      // substring to fall back to, so Konva's wrap algorithm gives up and
      // produces nothing at all (confirmed: node.getHeight() === 0,
      // node.textArr === [] for an 87.9px-wide emoji glyph in an 80px box).
      // Text layers here are always single-line (plain <input>, no
      // multi-line editor), so word-wrap was never an intentional feature -
      // disabling it removes this failure mode without behavior loss.
      wrap="none"
      textDecoration={layer.underline ? "underline" : ""}
      shadowColor={layer.shadow ? "#000000" : undefined}
      shadowBlur={layer.shadow ? 8 : 0}
      shadowOffsetX={layer.shadow ? 2 : 0}
      shadowOffsetY={layer.shadow ? 3 : 0}
      shadowOpacity={layer.shadow ? 0.45 : 0}
      align={layer.align}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={(event) => {
        const node = event.target;
        const height = shapeRef.current?.height() ?? layer.fontSize * 1.2;

        const candidates = getSnapCandidates(
          layers,
          layer.id,
          (other) => {
            const w = other.type === "image" ? other.width : other.width;
            const h = other.type === "image" ? other.height : layer.fontSize * 1.2;
            return {
              left: other.x,
              right: other.x + w,
              centerX: other.x + w / 2,
              top: other.y,
              bottom: other.y + h,
              centerY: other.y + h / 2,
            };
          },
        );

        const left = node.x();
        const right = node.x() + layer.width;
        const centerX = node.x() + layer.width / 2;
        const top = node.y();
        const bottom = node.y() + height;
        const centerY = node.y() + height / 2;

        const snapLeft = snapValue(left, candidates.vertical);
        const snapCenterX = snapValue(centerX, candidates.vertical);
        const snapRight = snapValue(right, candidates.vertical);

        let newX = node.x();
        let vGuide: number | null = null;

        if (snapCenterX.snapped) {
          newX = snapCenterX.value - layer.width / 2;
          vGuide = snapCenterX.guideAt;
        } else if (snapLeft.snapped) {
          newX = snapLeft.value;
          vGuide = snapLeft.guideAt;
        } else if (snapRight.snapped) {
          newX = snapRight.value - layer.width;
          vGuide = snapRight.guideAt;
        }

        const snapTop = snapValue(top, candidates.horizontal);
        const snapCenterY = snapValue(centerY, candidates.horizontal);
        const snapBottom = snapValue(bottom, candidates.horizontal);

        let newY = node.y();
        let hGuide: number | null = null;

        if (snapCenterY.snapped) {
          newY = snapCenterY.value - height / 2;
          hGuide = snapCenterY.guideAt;
        } else if (snapTop.snapped) {
          newY = snapTop.value;
          hGuide = snapTop.guideAt;
        } else if (snapBottom.snapped) {
          newY = snapBottom.value - height;
          hGuide = snapBottom.guideAt;
        }

        node.x(newX);
        node.y(newY);

        onDragGuides({
          vertical: vGuide !== null ? [vGuide] : [],
          horizontal: hGuide !== null ? [hGuide] : [],
        });
      }}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x(),
          y: event.target.y(),
        });
        onDragGuides(null);
        onCommitHistory();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;

        if (!node) {
          return;
        }

        const scaleX = node.scaleX();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(30, node.width() * scaleX),
          rotation: node.rotation(),
        });

        onCommitHistory();
      }}
      />
    </>
  );
}

// ============================================================================
// STICKER CANVAS
// ============================================================================

export default function StickerCanvas({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onCommitHistory,
  shape,
  stageRef,
  showGuides,
  zoom,
  onZoomChange,
  borderColor,
  borderWidth,
  canvasBackgroundColor,
  showCutGuide,
  onToggleShowCutGuide,
  onDuplicateSelected,
  onFlipSelected,
  onDeleteSelected,
  onToggleLockSelected,
  onOpenEraser,
  onReplaceClick,
  onRemoveBackground,
  onRestoreOriginal,
  isDetectingContour,
  isRemovingBackground,
}: StickerCanvasProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node>>({});
  const [dragGuides, setDragGuides] = useState<SnapLines | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  function registerRef(id: string, node: Konva.Node | null) {
    if (node) {
      nodeRefs.current[id] = node;
    } else {
      delete nodeRefs.current[id];
    }
  }

  const selectedLayer =
    layers.find((layer) => layer.id === selectedLayerId) ?? null;

  // --------------------------------------------------------------------------
  // ATTACH TRANSFORMER TO SELECTED LAYER
  // --------------------------------------------------------------------------

  useEffect(() => {
    const transformer = transformerRef.current;

    if (!transformer) {
      return;
    }

    const node =
      selectedLayerId && showGuides && !selectedLayer?.locked
        ? nodeRefs.current[selectedLayerId]
        : null;

    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedLayerId, layers, showGuides, selectedLayer?.locked]);

  // --------------------------------------------------------------------------
  // SELECTION SCREEN RECT — positions the floating pill toolbar. Computed in
  // the Stage's own 0..STAGE_SIZE coordinate space (relativeTo the stage
  // cancels the stage's own scaleX/scaleY), then scaled by zoom below at
  // render time — this keeps it in sync with the same zoomed pixel box the
  // Stage itself renders into, no separate scroll-offset math needed.
  // --------------------------------------------------------------------------

  useEffect(() => {
    // Reading a Konva node's rendered bounding box is only possible after
    // it has committed to the canvas - there is no render-time equivalent,
    // same as the pre-existing useHtmlImage hook above this component
    // having to setState from within an effect to sync an <img> load event.
    if (!selectedLayerId || !showGuides) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectionRect(null);
      return;
    }

    const node = nodeRefs.current[selectedLayerId];
    const stage = stageRef.current;

    if (!node || !stage) {
      setSelectionRect(null);
      return;
    }

    const rect = node.getClientRect({ relativeTo: stage });
    setSelectionRect({
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, [selectedLayerId, layers, showGuides, stageRef]);

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS — arrow-key nudge, Delete/Backspace, Ctrl/Cmd+D
  // duplicate (advertised in shortcuts-popover.tsx, so must be real).
  // --------------------------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedLayer) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingInField =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (isTypingInField) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        onDuplicateSelected();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedLayer.locked) return;
        event.preventDefault();
        onDeleteSelected();
        return;
      }

      if (selectedLayer.locked) {
        return;
      }

      const step = event.shiftKey ? NUDGE_STEP_SHIFT : NUDGE_STEP;

      let dx = 0;
      let dy = 0;

      if (event.key === "ArrowLeft") dx = -step;
      else if (event.key === "ArrowRight") dx = step;
      else if (event.key === "ArrowUp") dy = -step;
      else if (event.key === "ArrowDown") dy = step;
      else return;

      event.preventDefault();

      onUpdateLayer(selectedLayer.id, {
        x: selectedLayer.x + dx,
        y: selectedLayer.y + dy,
      });
      onCommitHistory();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedLayer,
    onUpdateLayer,
    onCommitHistory,
    onDuplicateSelected,
    onDeleteSelected,
  ]);

  // --------------------------------------------------------------------------
  // ALIGN SELECTED TO CANVAS CENTER — no multi-select exists in this
  // codebase (confirmed absent), so "Align" in the pill toolbar is scoped to
  // what's real: centering the single selected element on the print area,
  // not aligning it relative to other elements.
  // --------------------------------------------------------------------------

  function handleAlignCenterSelected() {
    if (!selectedLayer || selectedLayer.locked) return;

    const centerX = CANVAS_MARGIN + PRINT_AREA_SIZE / 2;
    const centerY = CANVAS_MARGIN + PRINT_AREA_SIZE / 2;
    const height =
      selectedLayer.type === "image"
        ? selectedLayer.height
        : selectedLayer.fontSize * 1.2;

    onUpdateLayer(selectedLayer.id, {
      x: centerX - selectedLayer.width / 2,
      y: centerY - height / 2,
    });
    onCommitHistory();
  }

  // --------------------------------------------------------------------------
  // DESELECT ON EMPTY-AREA CLICK
  // --------------------------------------------------------------------------

  function handleStageMouseDown(
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) {
    if (event.target === event.target.getStage()) {
      onSelectLayer(null);
    }
  }

  // --------------------------------------------------------------------------
  // DIE-CUT GUIDE DATA
  // --------------------------------------------------------------------------

  const dieCutPoints = getDieCutPoints(layers);
  const whiteBackingPoints = dieCutPoints
    ? offsetFromCentroid(dieCutPoints, DIE_CUT_WHITE_BORDER_FACTOR)
    : null;

  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
    <div
      ref={wrapperRef}
      className="relative mx-auto overflow-auto rounded-[2.5rem] bg-[repeating-conic-gradient(#eeeeee_0%_25%,#f6f6f6_0%_50%)] bg-[length:24px_24px]"
      style={{
        width: "100%",
        maxWidth: STAGE_SIZE,
        aspectRatio: "1 / 1",
      }}
    >
      <div
        className="relative"
        style={{
          width: STAGE_SIZE * zoom,
          height: STAGE_SIZE * zoom,
        }}
      >
        <Stage
          ref={stageRef}
          width={STAGE_SIZE}
          height={STAGE_SIZE}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
        >
          <Layer>
            {/* ================================================================
                VIEWPORT BACKDROP — the editor chrome behind the print card,
                NOT the sticker's own background. Fixed, not user-editable:
                the "Background" rail control scopes to the print
                area/die-cut backing below, never this outer viewport (this
                was the actual bug - canvasBackgroundColor used to be wired
                here instead, painting the whole Stage rather than the
                artboard).
            ================================================================ */}

            <Rect
              x={0}
              y={0}
              width={STAGE_SIZE}
              height={STAGE_SIZE}
              fill="#e8e8e8"
              listening={false}
            />

            {/* ================================================================
                PRINT AREA (the sticker's own working surface/background -
                this is "the canvas" the Background control actually paints)
            ================================================================ */}

            <Rect
              x={CANVAS_MARGIN}
              y={CANVAS_MARGIN}
              width={PRINT_AREA_SIZE}
              height={PRINT_AREA_SIZE}
              fill={canvasBackgroundColor}
              cornerRadius={16}
              shadowColor="#000000"
              shadowOpacity={0.06}
              shadowBlur={20}
              listening={false}
            />

            {/* ================================================================
                DIE-CUT BACKING (behind artwork) — same scope as above, for
                the Die-cut shape's own boundary once that shape is active.
            ================================================================ */}

            {shape === "Die-cut" && whiteBackingPoints && (
              <Line
                points={flattenPoints(whiteBackingPoints)}
                closed
                fill={canvasBackgroundColor}
                listening={false}
              />
            )}

            {/* ================================================================
                LAYERS
            ================================================================ */}

            {layers.map((layer) =>
              layer.type === "image" ? (
                <ImageLayerNode
                  key={layer.id}
                  layer={layer}
                  layers={layers}
                  onSelect={() => onSelectLayer(layer.id)}
                  onChange={(updates) =>
                    onUpdateLayer(layer.id, updates)
                  }
                  onCommitHistory={onCommitHistory}
                  registerRef={registerRef}
                  onDragGuides={setDragGuides}
                />
              ) : (
                <TextLayerNode
                  key={layer.id}
                  layer={layer}
                  layers={layers}
                  onSelect={() => onSelectLayer(layer.id)}
                  onChange={(updates) =>
                    onUpdateLayer(layer.id, updates)
                  }
                  onCommitHistory={onCommitHistory}
                  registerRef={registerRef}
                  onDragGuides={setDragGuides}
                />
              ),
            )}

            {/* ================================================================
                SNAP GUIDES (shown while dragging)
            ================================================================ */}

            {showGuides &&
              dragGuides?.vertical.map((x, index) => (
                <Line
                  key={`v-${index}`}
                  points={[x, 0, x, STAGE_SIZE]}
                  stroke="#ff4d6d"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              ))}

            {showGuides &&
              dragGuides?.horizontal.map((y, index) => (
                <Line
                  key={`h-${index}`}
                  points={[0, y, STAGE_SIZE, y]}
                  stroke="#ff4d6d"
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              ))}

            {/* ================================================================
                STICKER OUTLINE / BORDER COLOR (Task 4) — always rendered
                (not gated by showGuides), since it's part of the actual
                sticker artwork, not an editing aid. Reuses the exact same
                boundary geometry as the dashed cut-line guide just below
                for each shape, just solid instead of dashed and drawn
                slightly outside the print area so it reads as the
                sticker's own edge rather than a line sitting on the
                artwork.
            ================================================================ */}

            {borderColor && shape === "Circle" && (
              <Line
                points={buildCirclePoints(
                  STAGE_SIZE / 2,
                  STAGE_SIZE / 2,
                  PRINT_AREA_SIZE / 2 - 10 + borderWidth / 2,
                )}
                closed
                stroke={borderColor}
                strokeWidth={borderWidth}
                listening={false}
              />
            )}

            {borderColor && (shape === "Square" || shape === "Rounded") && (
              <Rect
                x={CANVAS_MARGIN + 10 - borderWidth / 2}
                y={CANVAS_MARGIN + 10 - borderWidth / 2}
                width={PRINT_AREA_SIZE - 20 + borderWidth}
                height={PRINT_AREA_SIZE - 20 + borderWidth}
                cornerRadius={shape === "Rounded" ? 48 : 0}
                stroke={borderColor}
                strokeWidth={borderWidth}
                listening={false}
              />
            )}

            {borderColor && shape === "Die-cut" && whiteBackingPoints && (
              <Line
                points={flattenPoints(whiteBackingPoints)}
                closed
                stroke={borderColor}
                strokeWidth={borderWidth}
                listening={false}
              />
            )}

            {/* ================================================================
                CUT-LINE GUIDE (hidden during thumbnail export, and hideable
                via the zoom/grid pill's "grid" toggle — see showCutGuide's
                doc comment on why that's a separate flag from showGuides)
            ================================================================ */}

            {showGuides && showCutGuide && shape === "Circle" && (
              <Line
                points={buildCirclePoints(
                  STAGE_SIZE / 2,
                  STAGE_SIZE / 2,
                  PRINT_AREA_SIZE / 2 - 10,
                )}
                closed
                stroke="#111111"
                strokeWidth={2}
                dash={[10, 8]}
                listening={false}
              />
            )}

            {showGuides && showCutGuide && shape === "Square" && (
              <Rect
                x={CANVAS_MARGIN + 10}
                y={CANVAS_MARGIN + 10}
                width={PRINT_AREA_SIZE - 20}
                height={PRINT_AREA_SIZE - 20}
                stroke="#111111"
                strokeWidth={2}
                dash={[10, 8]}
                listening={false}
              />
            )}

            {showGuides && showCutGuide && shape === "Rounded" && (
              <Rect
                x={CANVAS_MARGIN + 10}
                y={CANVAS_MARGIN + 10}
                width={PRINT_AREA_SIZE - 20}
                height={PRINT_AREA_SIZE - 20}
                cornerRadius={48}
                stroke="#111111"
                strokeWidth={2}
                dash={[10, 8]}
                listening={false}
              />
            )}

            {showGuides && showCutGuide && shape === "Die-cut" && (
              whiteBackingPoints ? (
                <Line
                  points={flattenPoints(whiteBackingPoints)}
                  closed
                  stroke="#111111"
                  strokeWidth={2}
                  dash={[10, 8]}
                  listening={false}
                />
              ) : (
                <Group listening={false}>
                  <Rect
                    x={CANVAS_MARGIN + 12}
                    y={CANVAS_MARGIN + 12}
                    width={PRINT_AREA_SIZE - 24}
                    height={PRINT_AREA_SIZE - 24}
                    cornerRadius={18}
                    stroke="#111111"
                    strokeWidth={2}
                    dash={[8, 8]}
                    opacity={0.18}
                  />
                  <KonvaText
                    x={CANVAS_MARGIN + 28}
                    y={CANVAS_MARGIN + PRINT_AREA_SIZE - 48}
                    width={PRINT_AREA_SIZE - 56}
                    text="Die-cut ready when your artwork has a transparent edge"
                    fontSize={11}
                    fontStyle="bold"
                    fill="#111111"
                    opacity={0.5}
                    align="center"
                  />
                </Group>
              )
            )}

            {/* ================================================================
                TRANSFORMER (hidden during thumbnail export)
            ================================================================ */}

            {showGuides && (
              <Transformer
                ref={transformerRef}
                rotateEnabled
                keepRatio={selectedLayer?.type === "image"}
                enabledAnchors={
                  selectedLayer?.type === "text"
                    ? ["middle-left", "middle-right"]
                    : [
                        "top-left",
                        "top-right",
                        "bottom-left",
                        "bottom-right",
                      ]
                }
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>

        {/* ==================================================================
            SELECTION PILL TOOLBAR — lives inside the same zoomed/scrolled
            box as the Stage so it tracks the artwork exactly; positioned
            from selectionRect (Stage-space, scaled by zoom here).
        ================================================================== */}

        {selectedLayer && showGuides && selectionRect && (
          <SelectionToolbar
            style={{
              left: selectionRect.left * zoom + (selectionRect.width * zoom) / 2,
              top:
                selectionRect.top * zoom - 52 >= 0
                  ? selectionRect.top * zoom - 52
                  : selectionRect.top * zoom + selectionRect.height * zoom + 8,
              transform: "translateX(-50%)",
            }}
            layerType={selectedLayer.type}
            locked={Boolean(selectedLayer.locked)}
            onDuplicate={onDuplicateSelected}
            onFlip={onFlipSelected}
            onErase={onOpenEraser}
            onAlignCenter={handleAlignCenterSelected}
            onToggleLock={onToggleLockSelected}
            onDelete={onDeleteSelected}
          />
        )}
      </div>

      <ShortcutsPopover />

      <ZoomGridPill
        zoom={zoom}
        onZoomChange={onZoomChange}
        showGrid={showCutGuide}
        onToggleGrid={onToggleShowCutGuide}
      />
    </div>

      {/* ====================================================================
          TEXT/IMAGE STYLE PANEL — a normal flex sibling next to the canvas
          card (not an absolute overlay on top of it): on a fixed-size
          500px stage this is the only way to avoid it covering the
          selection pill toolbar, which tracks the actual selected element
          and is very often near the canvas center. Wraps below on narrow
          viewports instead of overflowing.
      ==================================================================== */}

      {showGuides && selectedLayer?.type === "text" && (
        <div className="shrink-0">
          <TextStylePanel
            layer={selectedLayer}
            onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            onCommitHistory={onCommitHistory}
            onClose={() => onSelectLayer(null)}
          />
        </div>
      )}

      {showGuides && selectedLayer?.type === "image" && (
        <div className="shrink-0">
          <ImageStylePanel
            layer={selectedLayer}
            onReplaceClick={onReplaceClick}
            onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            onCommitHistory={onCommitHistory}
            isDetectingContour={isDetectingContour}
            isRemovingBackground={isRemovingBackground}
            onRemoveBackground={onRemoveBackground}
            onRestoreOriginal={onRestoreOriginal}
            onClose={() => onSelectLayer(null)}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CIRCLE POINTS HELPER
// ============================================================================

function buildCirclePoints(
  centerX: number,
  centerY: number,
  radius: number,
  segments = 72,
): number[] {
  const points: number[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    );
  }

  return points;
}