"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FolderOpen } from "lucide-react";

// ============================================================================
// MOCK SAVED DESIGNS
// ============================================================================
//
// Sprint 2 integration point: replace this array with a real fetch (e.g.
// GET /api/custom-sticker/designs) returning { id, thumbnailUrl, name,
// createdAt }[] for the signed-in user. Nothing else in this component
// should need to change shape-wise.

type SavedDesign = {
  id: string;
  thumbnailUrl: string;
  name: string;
  createdAt: string;
};

const MOCK_SAVED_DESIGNS: SavedDesign[] = [
  {
    id: "design-1",
    thumbnailUrl: "/stickers/tiny-bot.svg",
    name: "Tiny Bot",
    createdAt: "2026-08-02T10:15:00.000Z",
  },
  {
    id: "design-2",
    thumbnailUrl: "/stickers/level-up.svg",
    name: "Level Up",
    createdAt: "2026-08-14T09:40:00.000Z",
  },
  {
    id: "design-3",
    thumbnailUrl: "/stickers/mini-anime-pack.svg",
    name: "Anime Pack",
    createdAt: "2026-09-01T18:05:00.000Z",
  },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ============================================================================
// MY DESIGNS PANEL
// ============================================================================

export default function MyDesignsPanel() {
  const [expanded, setExpanded] = useState(false);

  function handleLoad(design: SavedDesign) {
    // Sprint 2 integration point: this should call the same layer-setter
    // the canvas uses internally (setLayers in sticker-builder.tsx) with the
    // design's saved layer data, mirroring how editId already restores a
    // cart line's layers today. Stubbed for this sprint since wiring a full
    // saved-design payload into Konva layers is nontrivial and out of scope.
    console.log("Load design into canvas (Sprint 2):", design);
  }

  return (
    <section className="rounded-3xl border border-black/10 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4"
      >
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <FolderOpen size={16} />
          My Designs
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="border-t border-black/10 p-4">
          {MOCK_SAVED_DESIGNS.length === 0 ? (
            <p className="px-1 py-2 text-xs font-semibold text-black/45">
              You haven&apos;t saved any designs yet.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {MOCK_SAVED_DESIGNS.map((design) => (
                <div
                  key={design.id}
                  className="w-28 shrink-0 rounded-2xl border border-black/10 p-2 text-center"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-black/[0.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small mock thumbnail strip, not worth next/image config here */}
                    <img
                      src={design.thumbnailUrl}
                      alt={design.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <p className="mt-2 truncate text-xs font-bold">{design.name}</p>
                  <p className="text-[10px] text-black/40">{formatDate(design.createdAt)}</p>

                  <button
                    type="button"
                    onClick={() => handleLoad(design)}
                    className="mt-2 w-full rounded-full bg-black px-2 py-1.5 text-[11px] font-bold text-white transition hover:scale-[1.02]"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
