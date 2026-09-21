"use client";

import type { StickerLayer } from "@/lib/cart/types";
import FlyoutPopover from "./flyout-popover";
import LayersPanel from "./layers-panel";

export default function LayersFlyout({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onMoveLayer,
  onClose,
}: {
  layers: StickerLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onClose: () => void;
}) {
  return (
    <FlyoutPopover label="Layers" onClose={onClose} widthClassName="w-72">
      <LayersPanel
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={(id) => {
          onSelectLayer(id);
          onClose();
        }}
        onDeleteLayer={onDeleteLayer}
        onMoveLayer={onMoveLayer}
      />
    </FlyoutPopover>
  );
}
