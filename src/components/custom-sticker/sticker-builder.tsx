"use client";

import dynamic from "next/dynamic";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import type Konva from "konva";

import CanvasToolbar from "./canvas-toolbar";
import LayersPanel from "./layers-panel";
import TextPropertiesPanel from "./text-properties-panel";
import ImagePropertiesPanel from "./image-properties-panel";
import ShapeSelector, { type StickerShape } from "./shape-selector";
import StickerPriceBar from "./sticker-price-bar";
import StickerEditorShell from "./sticker-editor-shell";

import {
  STAGE_SIZE,
  CANVAS_MARGIN,
  PRINT_AREA_SIZE,
} from "./sticker-canvas";

import { detectImageContour } from "@/lib/custom-sticker/contour";
import { removeSimpleBackground } from "@/lib/custom-sticker/background-removal";
import { DEFAULT_STICKER_FONT } from "@/lib/custom-sticker/fonts";

import {
  useShop,
  type CustomStickerFinish,
} from "@/components/shop/store-provider";

import type {
  StickerImageLayer,
  StickerLayer,
  StickerTextLayer,
} from "@/lib/cart/types";

import type { StickerSize } from "@/lib/product-data";

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

  const [shape, setShape] = useState<StickerShape>(
    (existingSticker?.shape as StickerShape) ?? "Circle",
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
  // ADD / REPLACE IMAGE LAYER
  // --------------------------------------------------------------------------

  const uploadModeRef = useRef<
    { type: "add" } | { type: "replace"; layerId: string }
  >({ type: "add" });

  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

      const base64Image = await fileToBase64(file);
      const dimensions = await loadImageDimensions(base64Image);

      const maxDisplaySize = 220;
      const scale = Math.min(
        1,
        maxDisplaySize / Math.max(dimensions.width, dimensions.height),
      );

      const displayWidth = Math.round(dimensions.width * scale);
      const displayHeight = Math.round(dimensions.height * scale);

      const mode = uploadModeRef.current;

      if (mode.type === "replace") {
        applyLayers(
          (previous) =>
            previous.map((layer) =>
              layer.id === mode.layerId && layer.type === "image"
                ? {
                    ...layer,
                    src: base64Image,
                    width: displayWidth,
                    height: displayHeight,
                    contourPoints: null,
                    originalSrc: undefined,
                    backgroundRemoved: false,
                  }
                : layer,
            ),
          true,
        );

        detectContourForLayer(mode.layerId, base64Image);
      } else {
        const newLayer: StickerImageLayer = {
          id: createId(),
          type: "image",
          src: base64Image,
          x: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - displayWidth / 2,
          y: CANVAS_MARGIN + PRINT_AREA_SIZE / 2 - displayHeight / 2,
          width: displayWidth,
          height: displayHeight,
          rotation: 0,
          contourPoints: null,
          originalSrc: undefined,
          backgroundRemoved: false,
        };

        applyLayers((previous) => [...previous, newLayer], true);
        setSelectedLayerId(newLayer.id);

        detectContourForLayer(newLayer.id, base64Image);
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
    if (selectedLayerId) {
      deleteLayer(selectedLayerId);
    }
  }

  function handleDuplicateSelected() {
    if (selectedLayerId) {
      duplicateLayer(selectedLayerId);
    }
  }

  // --------------------------------------------------------------------------
  // THUMBNAIL GENERATION (flattened snapshot for cart/receipt display)
  // --------------------------------------------------------------------------

  const [showGuides, setShowGuides] = useState(true);

  function generateThumbnail(): Promise<string> {
    return new Promise((resolve) => {
      setShowGuides(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const stage = stageRef.current;

          if (!stage) {
            setShowGuides(true);
            resolve("");
            return;
          }

          const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
          stage.scale({ x: 1, y: 1 });

          const dataUrl = stage.toDataURL({
            x: CANVAS_MARGIN,
            y: CANVAS_MARGIN,
            width: PRINT_AREA_SIZE,
            height: PRINT_AREA_SIZE,
            pixelRatio: 2,
          });

          stage.scale(previousScale);

          setShowGuides(true);
          resolve(dataUrl);
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

    const prepareData = await prepareResponse.json().catch(() => ({}));
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
      const thumbnailUrl = await generateThumbnail();
      if (!thumbnailUrl) {
        throw new Error("Unable to generate the sticker artwork.");
      }

      const artwork = await uploadArtworkToStorage(thumbnailUrl);

      const stickerData = {
        layers,
        size,
        shape,
        finish: "Matte" as CustomStickerFinish,
        quantity,
        unitPrice,
        thumbnailUrl,
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
  // PANEL CONTENT (shared between desktop side panel and mobile sheet)
  // --------------------------------------------------------------------------

  const panelContent = (
    <>
      {selectedLayer?.type === "text" && (
        <TextPropertiesPanel
          layer={selectedLayer}
          onChange={(updates) =>
            handleUpdateLayer(selectedLayer.id, updates)
          }
          onCommitHistory={commitCurrentHistory}
        />
      )}

      {selectedLayer?.type === "image" && (
        <ImagePropertiesPanel
          layer={selectedLayer}
          onReplaceClick={() =>
            triggerReplaceImage(selectedLayer.id)
          }
          onChange={(updates) =>
            handleUpdateLayer(selectedLayer.id, updates)
          }
          onCommitHistory={commitCurrentHistory}
          isDetectingContour={
            detectingContourLayerId === selectedLayer.id
          }
          isRemovingBackground={
            removingBackgroundLayerId === selectedLayer.id
          }
          onRemoveBackground={() =>
            handleRemoveBackground(selectedLayer.id)
          }
          onRestoreOriginal={() =>
            handleRestoreOriginal(selectedLayer.id)
          }
        />
      )}

      {!selectedLayer && layers.length === 0 && (
        <section className="rounded-3xl border border-dashed border-black/15 bg-white p-6 text-center">
          <p className="text-sm font-bold">Start designing</p>
          <p className="mt-1 text-xs text-black/45">
            Tap &ldquo;Add Image&rdquo; or &ldquo;Add Text&rdquo; above the
            canvas to add your first layer.
          </p>
        </section>
      )}

      <LayersPanel
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onDeleteLayer={deleteLayer}
        onMoveLayer={moveLayer}
      />

      <ShapeSelector shape={shape} setShape={setShape} />

      <StickerPriceBar
        unitPrice={unitPrice}
        quantity={quantity}
        imageReady={layers.length > 0}
        addedToCart={added}
        editMode={isEditMode}
        onAddToCart={handleAddToCart}
      />
    </>
  );

  const panelTitle = selectedLayer
    ? selectedLayer.type === "text"
      ? "Text Settings"
      : "Image Settings"
    : "Design Options";

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-7xl px-6 pb-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      <StickerEditorShell
        panelTitle={panelTitle}
        hasSelection={Boolean(selectedLayer)}
        onClearSelection={() => setSelectedLayerId(null)}
        toolbarArea={
          <CanvasToolbar
            onAddText={handleAddText}
            onAddImageClick={triggerAddImage}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onDeleteSelected={handleDeleteSelected}
            onDuplicateSelected={handleDuplicateSelected}
            hasSelectedLayer={Boolean(selectedLayer)}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        }
        canvasArea={
          <>
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
            />

            {layers.length === 0 && (
              <p className="mt-4 text-center text-sm font-medium text-black/40">
                Click &ldquo;Add Image&rdquo; or &ldquo;Add Text&rdquo; above
                to start designing.
              </p>
            )}

            {uploadError && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
                {uploadError}
              </p>
            )}

            {isUploading && (
              <p className="mt-4 text-center text-xs font-semibold text-black/40">
                Preparing image…
              </p>
            )}
          </>
        }
        panelArea={panelContent}
      />
    </main>
  );
}