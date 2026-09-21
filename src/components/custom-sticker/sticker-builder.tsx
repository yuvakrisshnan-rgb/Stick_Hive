"use client";

import dynamic from "next/dynamic";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import type Konva from "konva";

import EditorTopBar from "./editor-top-bar";
import RightRail from "./right-rail";
import ImageEraserModal from "./image-eraser-modal";

import {
  STAGE_SIZE,
  CANVAS_MARGIN,
  PRINT_AREA_SIZE,
} from "./sticker-canvas";

import { detectImageContour } from "@/lib/custom-sticker/contour";
import { removeSimpleBackground, removeBackgroundML, cleanupBackgroundHoles } from "@/lib/custom-sticker/background-removal";
import { flipImageHorizontal } from "@/lib/custom-sticker/image-transform";
import { DEFAULT_STICKER_FONT } from "@/lib/custom-sticker/fonts";

import {
  useShop,
  type CustomStickerFinish,
} from "@/components/shop/store-provider";

import type {
  CustomStickerShape,
  StickerImageLayer,
  StickerLayer,
  StickerTextLayer,
} from "@/lib/cart/types";

import type { StickerSize } from "@/lib/product-data";

const DEFAULT_CANVAS_BACKGROUND = "#e8e8e8";
const DEFAULT_BORDER_WIDTH = 10;

// ============================================================================
// CANVAS (client-only — Konva needs the browser)
// ============================================================================

const StickerCanvas = dynamic(
  () => import("./sticker-canvas"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ width: "100%", maxWidth: STAGE_SIZE, aspectRatio: "1 / 1" }}
        className="mx-auto flex items-center justify-center rounded-[2.5rem] bg-[#e8e8e8]"
      >
        <p className="text-sm font-bold text-black/30">Loading editor…</p>
      </div>
    ),
  },
);

// ============================================================================
// ID HELPER
// ============================================================================

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================================
// FILE → BASE64
// ============================================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Image conversion failed"));

    reader.readAsDataURL(file);
  });
}

// ============================================================================
// IMAGE DIMENSIONS
// ============================================================================

function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });

    img.onerror = () => reject(new Error("Unable to read image dimensions"));

    img.src = src;
  });
}

// ============================================================================
// PROPS
// ============================================================================

type StickerBuilderProps = {
  editId?: string;
};

// ============================================================================
// STICKER BUILDER
// ============================================================================

export default function StickerBuilder({ editId }: StickerBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  const {
    addCustomStickerToCart,
    updateCustomStickerDesign,
    customCartLines,
  } = useShop();

  // --------------------------------------------------------------------------
  // EDIT DATA
  // --------------------------------------------------------------------------

  const existingSticker = editId
    ? customCartLines.find((item) => item.id === editId)
    : undefined;

  const isEditMode = Boolean(editId);

  // --------------------------------------------------------------------------
  // LAYER STATE
  // --------------------------------------------------------------------------

  const [layers, setLayersState] = useState<StickerLayer[]>(
    existingSticker?.layers ?? [],
  );

  const layersRef = useRef<StickerLayer[]>(layers);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    null,
  );

  // --------------------------------------------------------------------------
  // ZOOM
  // --------------------------------------------------------------------------

  const [zoom, setZoom] = useState(1);

  // --------------------------------------------------------------------------
  // HISTORY (undo/redo)
  // --------------------------------------------------------------------------

  const historyRef = useRef<StickerLayer[][]>([layers]);
  const historyIndexRef = useRef(0);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function refreshHistoryFlags() {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(
      historyIndexRef.current < historyRef.current.length - 1,
    );
  }

  function pushHistory(nextLayers: StickerLayer[]) {
    const truncated = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );

    historyRef.current = [...truncated, nextLayers];
    historyIndexRef.current = historyRef.current.length - 1;

    refreshHistoryFlags();
  }

  function applyLayers(
    updater: (previous: StickerLayer[]) => StickerLayer[],
    commit: boolean,
  ) {
    const next = updater(layersRef.current);

    layersRef.current = next;
    setLayersState(next);

    if (commit) {
      pushHistory(next);
    }
  }

  function commitCurrentHistory() {
    pushHistory(layersRef.current);
  }

  function undo() {
    if (historyIndexRef.current <= 0) {
      return;
    }

    historyIndexRef.current -= 1;

    const snapshot = historyRef.current[historyIndexRef.current];

    layersRef.current = snapshot;
    setLayersState(snapshot);

    refreshHistoryFlags();
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    historyIndexRef.current += 1;

    const snapshot = historyRef.current[historyIndexRef.current];

    layersRef.current = snapshot;
    setLayersState(snapshot);

    refreshHistoryFlags();
  }

  // --------------------------------------------------------------------------
  // SHAPE / SIZE / QUANTITY
  // --------------------------------------------------------------------------

  const [shape, setShape] = useState<CustomStickerShape>(
    existingSticker?.shape ?? "Circle",
  );

  const [size] = useState<StickerSize>(
    existingSticker?.size ?? "Medium",
  );

  const [quantity] = useState(existingSticker?.quantity ?? 1);

  const [added, setAdded] = useState(false);

  const unitPrice =
    size === "Small" ? 20 : size === "Large" ? 30 : 25;

  // --------------------------------------------------------------------------
  // ADD TEXT LAYER
  // --------------------------------------------------------------------------

  function handleAddText() {
    const newLayer: StickerTextLayer = {
      id: createId(),
      type: "text",
      text: "Your Text",
      x: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - 80,
      y: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - 16,
      width: 160,
      rotation: 0,
      fontFamily: DEFAULT_STICKER_FONT.fontFamily,
      fontSize: 32,
      fill: "#111111",
      fontWeight: "bold",
      align: "center",
      strokeColor: null,
      strokeWidth: 0,
    };

    applyLayers((previous) => [...previous, newLayer], true);
    setSelectedLayerId(newLayer.id);
  }

  // --------------------------------------------------------------------------
  // ADD EMOJI LAYER (Task 3)
  // --------------------------------------------------------------------------
  // Reuses the text-layer type rather than inventing a separate "emoji"
  // layer kind - an emoji is just a string Konva's Text node already
  // renders (every OS ships an emoji font), so this gets drag/resize/
  // rotate/flip*/lock/duplicate for free from the same code every text
  // layer already goes through instead of a second, parallel element type.
  // (*flip only actually applies to image layers - see selection-toolbar.tsx.)

  function handleAddEmoji(emoji: string) {
    const newLayer: StickerTextLayer = {
      id: createId(),
      type: "text",
      text: emoji,
      x: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - 40,
      y: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - 40,
      width: 80,
      rotation: 0,
      fontFamily: DEFAULT_STICKER_FONT.fontFamily,
      fontSize: 64,
      fill: "#111111",
      fontWeight: "normal",
      align: "center",
      strokeColor: null,
      strokeWidth: 0,
    };

    applyLayers((previous) => [...previous, newLayer], true);
    setSelectedLayerId(newLayer.id);
  }

  // --------------------------------------------------------------------------
  // ADD / REPLACE IMAGE LAYER
  // --------------------------------------------------------------------------

  const uploadModeRef = useRef<
    { type: "add" } | { type: "replace"; layerId: string }
  >({ type: "add" });

  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState(
    "Preparing image…",
  );
  const [detectingContourLayerId, setDetectingContourLayerId] = useState<
    string | null
  >(null);
  const [removingBackgroundLayerId, setRemovingBackgroundLayerId] = useState<
    string | null
  >(null);

  function triggerAddImage() {
    uploadModeRef.current = { type: "add" };
    fileInputRef.current?.click();
  }

  function triggerReplaceImage(layerId: string) {
    uploadModeRef.current = { type: "replace", layerId };
    fileInputRef.current?.click();
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.target.value = "";

    setUploadError("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatusMessage("Preparing image…");

      const base64Image = await fileToBase64(file);
      const dimensions = await loadImageDimensions(base64Image);

      const maxDisplaySize = 220;
      const scale = Math.min(
        1,
        maxDisplaySize / Math.max(dimensions.width, dimensions.height),
      );

      const displayWidth = Math.round(dimensions.width * scale);
      const displayHeight = Math.round(dimensions.height * scale);

      // Automatically remove the background so the die-cut contour tracer
      // (detectImageContour) gets a real silhouette to trace instead of a
      // rectangular fallback. This is a "nice to have" step — if the model
      // fails to load or segmentation errors out, fall back to the
      // original upload untouched rather than blocking the user.
      let processedImage = base64Image;
      let autoBackgroundRemoved = false;

      try {
        setUploadStatusMessage("Removing background…");

        processedImage = await removeBackgroundML(base64Image, (fraction) => {
          setUploadStatusMessage(
            `Removing background… ${Math.round(fraction * 100)}%`,
          );
        });

        autoBackgroundRemoved = true;

        // ML matting can leave small transparent flecks inside the subject
        // (hair, fabric) rather than only around it — clean those up in the
        // actual artwork, not just the tracing mask, so the visible sticker
        // doesn't show the holes even if this step fails and we fall back.
        try {
          processedImage = await cleanupBackgroundHoles(processedImage);
        } catch (holeCleanupError) {
          console.warn(
            "Background hole cleanup failed, using uncleaned result:",
            holeCleanupError,
          );
        }
      } catch (backgroundRemovalError) {
        console.warn(
          "Automatic background removal failed, using original image:",
          backgroundRemovalError,
        );
      }

      setUploadStatusMessage("Detecting outline…");

      const mode = uploadModeRef.current;

      if (mode.type === "replace") {
        applyLayers(
          (previous) =>
            previous.map((layer) =>
              layer.id === mode.layerId && layer.type === "image"
                ? {
                    ...layer,
                    src: processedImage,
                    width: displayWidth,
                    height: displayHeight,
                    contourPoints: null,
                    originalSrc: autoBackgroundRemoved ? base64Image : undefined,
                    backgroundRemoved: autoBackgroundRemoved,
                  }
                : layer,
            ),
          true,
        );

        detectContourForLayer(mode.layerId, processedImage);
      } else {
        const newLayer: StickerImageLayer = {
          id: createId(),
          type: "image",
          src: processedImage,
          x: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - displayWidth / 2,
          y: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - displayHeight / 2,
          width: displayWidth,
          height: displayHeight,
          rotation: 0,
          contourPoints: null,
          originalSrc: autoBackgroundRemoved ? base64Image : undefined,
          backgroundRemoved: autoBackgroundRemoved,
        };

        applyLayers((previous) => [...previous, newLayer], true);
        setSelectedLayerId(newLayer.id);

        detectContourForLayer(newLayer.id, processedImage);
      }
    } catch (error) {
      setUploadError("Unable to process image.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function detectContourForLayer(layerId: string, src: string) {
    setDetectingContourLayerId(layerId);

    try {
      const contourPoints = await detectImageContour(src);

      applyLayers(
        (previous) =>
          previous.map((layer) =>
            layer.id === layerId && layer.type === "image"
              ? { ...layer, contourPoints }
              : layer,
          ),
        true,
      );
    } finally {
      setDetectingContourLayerId((current) =>
        current === layerId ? null : current,
      );
    }
  }

  // --------------------------------------------------------------------------
  // DIE-CUT BACKGROUND REMOVAL
  // --------------------------------------------------------------------------

  async function handleRemoveBackground(layerId: string) {
    const layer = layersRef.current.find(
      (candidate): candidate is StickerImageLayer =>
        candidate.id === layerId && candidate.type === "image",
    );

    if (!layer) return;

    setUploadError("");
    setRemovingBackgroundLayerId(layerId);

    try {
      const originalSrc = layer.originalSrc ?? layer.src;
      const processedSrc = await removeSimpleBackground(originalSrc);
      const contourPoints = await detectImageContour(processedSrc);

      if (!contourPoints) {
        throw new Error(
          "The background could not be separated cleanly. Try a transparent PNG or a simpler background.",
        );
      }

      applyLayers(
        (previous) =>
          previous.map((candidate) =>
            candidate.id === layerId && candidate.type === "image"
              ? {
                  ...candidate,
                  src: processedSrc,
                  originalSrc,
                  contourPoints,
                  backgroundRemoved: true,
                }
              : candidate,
          ),
        true,
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to remove the background.",
      );
      console.error(error);
    } finally {
      setRemovingBackgroundLayerId((current) =>
        current === layerId ? null : current,
      );
    }
  }

  // --------------------------------------------------------------------------
  // MANUAL ERASE (Task 5) — the free-hand/shape eraser in
  // image-eraser-modal.tsx hands back a new data URL for the already-
  // displayed image; this just applies it the same way handleFileSelected's
  // "replace" mode does (update src, clear the stale contour, re-detect a
  // new one against the newly-erased silhouette).
  // --------------------------------------------------------------------------

  function handleManualErase(layerId: string, newSrc: string) {
    applyLayers(
      (previous) =>
        previous.map((candidate) =>
          candidate.id === layerId && candidate.type === "image"
            ? { ...candidate, src: newSrc, contourPoints: null }
            : candidate,
        ),
      true,
    );

    detectContourForLayer(layerId, newSrc);
  }

  function handleRestoreOriginal(layerId: string) {
    const layer = layersRef.current.find(
      (candidate): candidate is StickerImageLayer =>
        candidate.id === layerId && candidate.type === "image",
    );

    if (!layer?.originalSrc) return;

    applyLayers(
      (previous) =>
        previous.map((candidate) =>
          candidate.id === layerId && candidate.type === "image"
            ? {
                ...candidate,
                src: layer.originalSrc!,
                originalSrc: undefined,
                backgroundRemoved: false,
                contourPoints: null,
              }
            : candidate,
        ),
      true,
    );

    detectContourForLayer(layerId, layer.originalSrc);
  }

  // --------------------------------------------------------------------------
  // LAYER UPDATE (live, from canvas drag/resize or panel edits)
  // --------------------------------------------------------------------------

  const handleUpdateLayer = useCallback(
    (id: string, updates: Partial<StickerLayer>) => {
      applyLayers(
        (previous) =>
          previous.map((layer) =>
            layer.id === id
              ? ({ ...layer, ...updates } as StickerLayer)
              : layer,
          ),
        false,
      );
    },
    [],
  );

  // --------------------------------------------------------------------------
  // DELETE / DUPLICATE / REORDER
  // --------------------------------------------------------------------------

  function deleteLayer(id: string) {
    applyLayers(
      (previous) => previous.filter((layer) => layer.id !== id),
      true,
    );

    setSelectedLayerId((current) => (current === id ? null : current));
  }

  function duplicateLayer(id: string) {
    const source = layersRef.current.find((layer) => layer.id === id);

    if (!source) {
      return;
    }

    const duplicate: StickerLayer = {
      ...source,
      id: createId(),
      x: source.x + 16,
      y: source.y + 16,
    };

    applyLayers((previous) => [...previous, duplicate], true);
    setSelectedLayerId(duplicate.id);
  }

  function moveLayer(id: string, direction: "up" | "down") {
    applyLayers((previous) => {
      const index = previous.findIndex((layer) => layer.id === id);

      if (index === -1) {
        return previous;
      }

      const targetIndex = direction === "up" ? index + 1 : index - 1;

      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const updated = [...previous];
      const [item] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, item);

      return updated;
    }, true);
  }

  function handleDeleteSelected() {
    const layer = layersRef.current.find((l) => l.id === selectedLayerId);
    if (selectedLayerId && !layer?.locked) {
      deleteLayer(selectedLayerId);
    }
  }

  function handleDuplicateSelected() {
    if (selectedLayerId) {
      duplicateLayer(selectedLayerId);
    }
  }

  // --------------------------------------------------------------------------
  // FLIP (image layers only — see lib/custom-sticker/image-transform.ts for
  // why this bakes the mirror into the bitmap rather than a live Konva
  // scaleX transform)
  // --------------------------------------------------------------------------

  async function handleFlipSelected() {
    const layer = layersRef.current.find(
      (candidate): candidate is StickerImageLayer =>
        candidate.id === selectedLayerId && candidate.type === "image",
    );

    if (!layer || layer.locked) {
      return;
    }

    const flippedSrc = await flipImageHorizontal(layer.src);
    const flippedOriginalSrc = layer.originalSrc
      ? await flipImageHorizontal(layer.originalSrc)
      : undefined;

    // The silhouette mirrors too, but the image's own width/height don't
    // change — reflecting each traced point around the vertical center is
    // exact and free, versus re-running full contour detection again.
    const flippedContour = layer.contourPoints
      ? layer.contourPoints.map((point) => ({
          x: layer.width - point.x,
          y: point.y,
        }))
      : null;

    applyLayers(
      (previous) =>
        previous.map((candidate) =>
          candidate.id === layer.id && candidate.type === "image"
            ? {
                ...candidate,
                src: flippedSrc,
                originalSrc: flippedOriginalSrc,
                contourPoints: flippedContour,
              }
            : candidate,
        ),
      true,
    );
  }

  // --------------------------------------------------------------------------
  // LOCK / UNLOCK
  // --------------------------------------------------------------------------

  function handleToggleLockSelected() {
    if (!selectedLayerId) {
      return;
    }

    applyLayers(
      (previous) =>
        previous.map((candidate) =>
          candidate.id === selectedLayerId
            ? { ...candidate, locked: !candidate.locked }
            : candidate,
        ),
      true,
    );
  }

  // --------------------------------------------------------------------------
  // STICKER OUTLINE / BORDER COLOR (Task 4)
  // --------------------------------------------------------------------------

  const [borderColor, setBorderColor] = useState<string | null>(null);
  const [borderWidth, setBorderWidth] = useState(DEFAULT_BORDER_WIDTH);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(
    DEFAULT_CANVAS_BACKGROUND,
  );

  // --------------------------------------------------------------------------
  // CUT-LINE GUIDE VISIBILITY (zoom/grid pill's "grid" toggle) — deliberately
  // separate from showGuides below, which also gates the Transformer and
  // must stay on so the user can keep resizing/rotating.
  // --------------------------------------------------------------------------

  const [showCutGuide, setShowCutGuide] = useState(true);

  // --------------------------------------------------------------------------
  // MANUAL ERASER MODAL — lifted up from image-style-panel.tsx so the
  // floating per-selection pill toolbar's "Erase" icon can open it directly.
  // --------------------------------------------------------------------------

  const [eraserOpen, setEraserOpen] = useState(false);

  // --------------------------------------------------------------------------
  // THUMBNAIL GENERATION
  // --------------------------------------------------------------------------
  // Generates two separate exports from the same canvas snapshot:
  //   - printUrl: full resolution (pixelRatio 2, ~840x840 at the current
  //     420px print area), uploaded to storage as the actual production
  //     artwork via uploadArtworkToStorage(). Print quality depends on this
  //     staying high-res — never lower it for a UI concern.
  //   - previewUrl: a much smaller export (pixelRatio 0.5, ~210x210), used
  //     only for on-screen display (cart drawer thumbnail, ~96px box).
  //     Previously the SAME 840x840 image was reused for both purposes,
  //     meaning the cart thumbnail decoded ~76x more pixels than its
  //     96x96 display size ever needed.

  const [showGuides, setShowGuides] = useState(true);

  const THUMBNAIL_PRINT_PIXEL_RATIO = 2;
  const THUMBNAIL_PREVIEW_PIXEL_RATIO = 0.5;

  function generateThumbnails(): Promise<{ printUrl: string; previewUrl: string }> {
    return new Promise((resolve) => {
      setShowGuides(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const stage = stageRef.current;

          if (!stage) {
            setShowGuides(true);
            resolve({ printUrl: "", previewUrl: "" });
            return;
          }

          const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
          stage.scale({ x: 1, y: 1 });

          const snapshotArea = {
            x: CANVAS_MARGIN,
            y: CANVAS_MARGIN,
            width: PRINT_AREA_SIZE,
            height: PRINT_AREA_SIZE,
          };

          const printUrl = stage.toDataURL({
            ...snapshotArea,
            pixelRatio: THUMBNAIL_PRINT_PIXEL_RATIO,
          });

          const previewUrl = stage.toDataURL({
            ...snapshotArea,
            pixelRatio: THUMBNAIL_PREVIEW_PIXEL_RATIO,
          });

          stage.scale(previousScale);

          setShowGuides(true);
          resolve({ printUrl, previewUrl });
        });
      });
    });
  }

  // --------------------------------------------------------------------------
  // ADD TO CART
  // --------------------------------------------------------------------------

  async function uploadArtworkToStorage(dataUrl: string): Promise<{ objectKey: string; contentType: string }> {
    const blob = await fetch(dataUrl).then((response) => response.blob());
    const contentType = blob.type || "image/png";

    const prepareResponse = await fetch("/api/storage/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType,
        size: blob.size,
      }),
    });

    const prepareData = (await prepareResponse.json().catch(() => ({}))) as any;
    if (!prepareResponse.ok || !prepareData.success) {
      throw new Error(prepareData.error ?? "Unable to prepare artwork upload.");
    }

    const putResponse = await fetch(prepareData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!putResponse.ok) {
      throw new Error(`Artwork upload failed (${putResponse.status}).`);
    }

    return {
      objectKey: prepareData.objectKey as string,
      contentType,
    };
  }

  async function handleAddToCart() {
    if (layers.length === 0 || isUploading) {
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const { printUrl, previewUrl } = await generateThumbnails();
      if (!printUrl || !previewUrl) {
        throw new Error("Unable to generate the sticker artwork.");
      }

      const artwork = await uploadArtworkToStorage(printUrl);

      const stickerData = {
        layers,
        size,
        shape,
        finish: "Matte" as CustomStickerFinish,
        quantity,
        unitPrice,
        thumbnailUrl: previewUrl,
        artworkObjectKey: artwork.objectKey,
        artworkContentType: artwork.contentType,
      };

      if (editId) {
        updateCustomStickerDesign(editId, stickerData);
      } else {
        addCustomStickerToCart(stickerData);
      }

      setAdded(true);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to save the custom sticker artwork.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  // --------------------------------------------------------------------------
  // SELECTED LAYER
  // --------------------------------------------------------------------------

  const selectedLayer =
    layers.find((layer) => layer.id === selectedLayerId) ?? null;

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------
  // Top bar + two-zone main row (center canvas, 64px right rail) — no left
  // sidebar, no tab navigation. Layers/My Designs/Shape/Background are now
  // rail flyouts (right-rail.tsx); Text/Image settings are floating panels
  // rendered by sticker-canvas.tsx itself, positioned near the selection.
  // Retired sticker-editor-shell.tsx's mobile bottom-sheet: that sheet only
  // ever held this same "always-visible panel" content, which no longer
  // exists as a persistent panel at any viewport size — flyouts work
  // identically on mobile and desktop, so there's nothing left to sheet.

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-6 sm:px-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      <EditorTopBar
        isEditMode={isEditMode}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        unitPrice={unitPrice}
        imageReady={layers.length > 0}
        addedToCart={added}
        onPrimaryAction={handleAddToCart}
      />

      <div className="flex flex-1 items-start gap-4 py-4 sm:gap-6 sm:py-6">
        <div className="min-w-0 flex-1">
          <StickerCanvas
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
            onCommitHistory={commitCurrentHistory}
            shape={shape}
            stageRef={stageRef}
            showGuides={showGuides}
            zoom={zoom}
            onZoomChange={setZoom}
            borderColor={borderColor}
            borderWidth={borderWidth}
            canvasBackgroundColor={canvasBackgroundColor}
            showCutGuide={showCutGuide}
            onToggleShowCutGuide={() => setShowCutGuide((value) => !value)}
            onDuplicateSelected={handleDuplicateSelected}
            onFlipSelected={handleFlipSelected}
            onDeleteSelected={handleDeleteSelected}
            onToggleLockSelected={handleToggleLockSelected}
            onOpenEraser={() => setEraserOpen(true)}
            onReplaceClick={() =>
              selectedLayer && triggerReplaceImage(selectedLayer.id)
            }
            onRemoveBackground={() =>
              selectedLayer && handleRemoveBackground(selectedLayer.id)
            }
            onRestoreOriginal={() =>
              selectedLayer && handleRestoreOriginal(selectedLayer.id)
            }
            isDetectingContour={detectingContourLayerId === selectedLayerId}
            isRemovingBackground={removingBackgroundLayerId === selectedLayerId}
          />

          {layers.length === 0 && (
            <p className="mt-4 text-center text-sm font-medium text-black/40">
              Tap &ldquo;Add Image&rdquo; or &ldquo;Add Text&rdquo; on the
              right to start designing.
            </p>
          )}

          {uploadError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
              {uploadError}
            </p>
          )}

          {isUploading && (
            <p className="mt-4 text-center text-xs font-semibold text-black/40">
              {uploadStatusMessage}
            </p>
          )}
        </div>

        <RightRail
          onAddText={handleAddText}
          onAddImageClick={triggerAddImage}
          onAddEmoji={handleAddEmoji}
          shape={shape}
          onShapeChange={setShape}
          borderColor={borderColor}
          onBorderColorChange={setBorderColor}
          borderWidth={borderWidth}
          onBorderWidthChange={setBorderWidth}
          canvasBackgroundColor={canvasBackgroundColor}
          onCanvasBackgroundColorChange={setCanvasBackgroundColor}
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onDeleteLayer={deleteLayer}
          onMoveLayer={moveLayer}
        />
      </div>

      {eraserOpen && selectedLayer?.type === "image" && (
        <ImageEraserModal
          imageSrc={selectedLayer.src}
          onApply={(newSrc) => {
            handleManualErase(selectedLayer.id, newSrc);
            setEraserOpen(false);
          }}
          onClose={() => setEraserOpen(false)}
        />
      )}
    </main>
  );
}