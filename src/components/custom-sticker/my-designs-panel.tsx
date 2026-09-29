"use client";

import { useRouter } from "next/navigation";

import { useShop } from "@/components/shop/store-provider";

// ============================================================================
// MY DESIGNS PANEL
// ============================================================================
//
// "Load" used to be a confirmed stub against MOCK_SAVED_DESIGNS (a hardcoded
// array pointing at static demo SVGs, console.log-only on click). There is
// no account-level "saved design library" anywhere in this app - no table,
// no save action, no API - so a real fetch-backed version of the original
// mock (GET /api/custom-sticker/designs) would mean building that whole
// feature from scratch, not just wiring up a button.
//
// What DOES already exist, real and persisted (localStorage, via
// store-provider.tsx's customCartLines): every custom sticker the user has
// actually built and added to cart, each with the exact StickerLayer[] +
// shape + size payload the canvas needs to reload - the same payload
// existingSticker/editId already round-trips correctly for the cart
// drawer's "Edit" action. So "My Designs" here means "your custom stickers
// currently in the cart" - genuinely loadable today, honestly labeled,
// rather than a bigger feature nothing else in the app supports yet.
//
// Load navigates to /custom-sticker?edit=<id>, the same route the cart
// drawer's Edit button already uses. custom-sticker/page.tsx now keys
// <StickerBuilder> on editId specifically so this client-side navigation
// (no full page reload) correctly resets the canvas to the new design -
// without that key, StickerBuilder's useState initializers only run once
// per mount and would keep showing whatever was already on screen.

function shapeLabel(shape: string, size: string) {
  return `${shape} · ${size}`;
}

export default function MyDesignsPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { customCartLines } = useShop();

  function handleLoad(id: string) {
    onClose();
    router.push(`/custom-sticker?edit=${encodeURIComponent(id)}`);
  }

  return (
    <div className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
        My Designs
      </p>

      {customCartLines.length === 0 ? (
        <p className="mt-3 px-1 py-2 text-xs font-semibold text-black/45">
          Custom stickers you add to cart will show up here to reopen and edit.
        </p>
      ) : (
        <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {customCartLines.map((design) => (
            <div
              key={design.id}
              className="flex items-center gap-3 rounded-2xl border border-black/10 p-2"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail strip in a popover, not worth next/image config here */}
                <img
                  src={design.thumbnailUrl}
                  alt={shapeLabel(design.shape, design.size)}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">
                  {shapeLabel(design.shape, design.size)}
                </p>
                <p className="text-[10px] text-black/40">
                  Qty {design.quantity} &middot; &#8377;{design.lineTotal}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleLoad(design.id)}
                className="shrink-0 rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
