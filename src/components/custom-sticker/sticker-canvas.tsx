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
} from "react-konva";

import type {
  StickerImageLayer,
  StickerLayer,
  StickerTextLayer,
  CustomStickerShape,
} from "@/lib/cart/types";

import type { ContourPoint } from "@/lib/custom-sticker/contour";

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
      draggable
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

  return (
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
      fontStyle={layer.fontWeight === "bold" ? "bold" : "normal"}
      align={layer.align}
      draggable
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
}: StickerCanvasProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node>>({});
  const [dragGuides, setDragGuides] = useState<SnapLines | null>(null);
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
      selectedLayerId && showGuides
        ? nodeRefs.current[selectedLayerId]
        : null;

    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedLayerId, layers, showGuides]);

  // --------------------------------------------------------------------------
  // KEYBOARD NUDGE (arrow keys move selected layer, Shift = larger step)
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
  }, [selectedLayer, onUpdateLayer, onCommitHistory]);

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

  const targetImageLayer = layers.find(
    (layer): layer is StickerImageLayer => layer.type === "image",
  );

  const contourGuidePoints: ContourPoint[] | null =
    targetImageLayer?.contourPoints
      ? targetImageLayer.contourPoints.map((point) => ({
          x: targetImageLayer.x + point.x * targetImageLayer.width,
          y: targetImageLayer.y + point.y * targetImageLayer.height,
        }))
      : null;

  const whiteBackingPoints = contourGuidePoints
    ? offsetFromCentroid(
        contourGuidePoints,
        DIE_CUT_WHITE_BORDER_FACTOR,
      )
    : null;

  return (
    <div
      ref={wrapperRef}
      className="mx-auto overflow-auto rounded-[2.5rem] bg-[#e8e8e8]"
      style={{
        width: "100%",
        maxWidth: STAGE_SIZE,
        aspectRatio: "1 / 1",
      }}
    >
      <div
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
                BACKGROUND
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
                PRINT AREA (white working surface)
            ================================================================ */}

            <Rect
              x={CANVAS_MARGIN}
              y={CANVAS_MARGIN}
              width={PRINT_AREA_SIZE}
              height={PRINT_AREA_SIZE}
              fill="#ffffff"
              cornerRadius={16}
              shadowColor="#000000"
              shadowOpacity={0.06}
              shadowBlur={20}
              listening={false}
            />

            {/* ================================================================
                DIE-CUT WHITE BACKING (behind artwork)
            ================================================================ */}

            {shape === "Die-cut" && whiteBackingPoints && (
              <Line
                points={flattenPoints(whiteBackingPoints)}
                closed
                fill="#ffffff"
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
                CUT-LINE GUIDE (hidden during thumbnail export)
            ================================================================ */}

            {showGuides && shape === "Circle" && (
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

            {showGuides && shape === "Square" && (
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

            {showGuides && shape === "Rounded" && (
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

            {showGuides &&
              shape === "Die-cut" &&
              (contourGuidePoints ? (
                <Line
                  points={flattenPoints(whiteBackingPoints!)}
                  closed
                  stroke="#111111"
                  strokeWidth={2}
                  dash={[10, 8]}
                  listening={false}
                />
              ) : targetImageLayer ? (
                <Rect
                  x={targetImageLayer.x - 14}
                  y={targetImageLayer.y - 14}
                  width={targetImageLayer.width + 28}
                  height={targetImageLayer.height + 28}
                  cornerRadius={24}
                  stroke="#111111"
                  strokeWidth={2}
                  dash={[10, 8]}
                  listening={false}
                />
              ) : (
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
              ))}

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
      </div>
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