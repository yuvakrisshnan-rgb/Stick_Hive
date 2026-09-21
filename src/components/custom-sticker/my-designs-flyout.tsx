"use client";

import FlyoutPopover from "./flyout-popover";
import MyDesignsPanel from "./my-designs-panel";

export default function MyDesignsFlyout({ onClose }: { onClose: () => void }) {
  return (
    <FlyoutPopover label="My designs" onClose={onClose} widthClassName="w-72">
      <MyDesignsPanel />
    </FlyoutPopover>
  );
}
