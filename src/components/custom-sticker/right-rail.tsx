"use client";

import { useState } from "react";
import {
  FolderOpen,
  ImagePlus,
  Layers as LayersIcon,
  Paintbrush,
  Shapes,
  SmilePlus,
  Type,
} from "lucide-react";

import type { CustomStickerShape, StickerLayer } from "@/lib/cart/types";
import IconButton from "./icon-button";
import EmojiPicker from "./emoji-picker";
import ShapeFlyout from "./shape-flyout";
import BackgroundFlyout from "./background-flyout";
import LayersFlyout from "./layers-flyout";
import MyDesignsFlyout from "./my-designs-flyout";

// ============================================================================
// RIGHT RAIL (Task 1/2)
// ============================================================================
// Fixed 64px icon-only rail — final width, no expand/collapse. Each icon
// either fires an instant action (Add Text, Add Image) or opens its panel
// as a flyout anchored to that icon (Add Emoji, Sticker Shape, Background,
// Layers, My Designs). Only one flyout is open at a time by construction:
// they all share this single `openFlyout` state instead of each owning its
// own open/closed boolean.
// ============================================================================

type FlyoutKey = "emoji" | "shape" | "background" | "layers" | "myDesigns";

export default function RightRail({
  onAddText,
  onAddImageClick,
  onAddEmoji,
  shape,
  onShapeChange,
  borderColor,
  onBorderColorChange,
  borderWidth,
  onBorderWidthChange,
  canvasBackgroundColor,
  onCanvasBackgroundColorChange,
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onMoveLayer,
}: {
  onAddText: () => void;
  onAddImageClick: () => void;
  onAddEmoji: (emoji: string) => void;
  shape: CustomStickerShape;
  onShapeChange: (shape: CustomStickerShape) => void;
  borderColor: string | null;
  onBorderColorChange: (color: string | null) => void;
  borderWidth: number;
  onBorderWidthChange: (width: number) => void;
  canvasBackgroundColor: string;
  onCanvasBackgroundColorChange: (color: string) => void;
  layers: StickerLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
}) {
  const [openFlyout, setOpenFlyout] = useState<FlyoutKey | null>(null);

  function toggle(key: FlyoutKey) {
    setOpenFlyout((current) => (current === key ? null : key));
  }

  return (
    <div
      className="
        sticky
        top-24
        flex
        w-16
        shrink-0
        flex-col
        items-center
        gap-1
        rounded-[2rem]
        border
        border-black/5
        bg-white
        py-4
        shadow-[0_15px_50px_rgba(0,0,0,0.06)]
      "
    >
      <IconButton icon={Type} label="Add Text" onClick={onAddText} />
      <IconButton icon={ImagePlus} label="Add Image" onClick={onAddImageClick} />

      <div className="relative">
        <IconButton
          icon={SmilePlus}
          label="Add Emoji"
          onClick={() => toggle("emoji")}
          active={openFlyout === "emoji"}
        />
        {openFlyout === "emoji" && (
          <EmojiPicker
            onSelect={(emoji) => {
              onAddEmoji(emoji);
              setOpenFlyout(null);
            }}
            onClose={() => setOpenFlyout(null)}
          />
        )}
      </div>

      <div className="my-1 h-px w-8 bg-black/10" />

      <div className="relative">
        <IconButton
          icon={Shapes}
          label="Sticker Shape"
          onClick={() => toggle("shape")}
          active={openFlyout === "shape"}
        />
        {openFlyout === "shape" && (
          <ShapeFlyout
            shape={shape}
            onShapeChange={onShapeChange}
            borderColor={borderColor}
            onBorderColorChange={onBorderColorChange}
            borderWidth={borderWidth}
            onBorderWidthChange={onBorderWidthChange}
            onClose={() => setOpenFlyout(null)}
          />
        )}
      </div>

      <div className="relative">
        <IconButton
          icon={Paintbrush}
          label="Background"
          onClick={() => toggle("background")}
          active={openFlyout === "background"}
        />
        {openFlyout === "background" && (
          <BackgroundFlyout
            color={canvasBackgroundColor}
            onChange={onCanvasBackgroundColorChange}
            onClose={() => setOpenFlyout(null)}
          />
        )}
      </div>

      <div className="my-1 h-px w-8 bg-black/10" />

      <div className="relative">
        <IconButton
          icon={LayersIcon}
          label="Layers"
          onClick={() => toggle("layers")}
          active={openFlyout === "layers"}
        />
        {openFlyout === "layers" && (
          <LayersFlyout
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onDeleteLayer={onDeleteLayer}
            onMoveLayer={onMoveLayer}
            onClose={() => setOpenFlyout(null)}
          />
        )}
      </div>

      <div className="relative">
        <IconButton
          icon={FolderOpen}
          label="My Designs"
          onClick={() => toggle("myDesigns")}
          active={openFlyout === "myDesigns"}
        />
        {openFlyout === "myDesigns" && (
          <MyDesignsFlyout onClose={() => setOpenFlyout(null)} />
        )}
      </div>
    </div>
  );
}
