"use client";

// ============================================================================
// MOCK SAVED DESIGNS
// ============================================================================
//
// Sprint 2 integration point: replace this array with a real fetch (e.g.
// GET /api/custom-sticker/designs) returning { id, thumbnailUrl, name,
// createdAt }[] for the signed-in user. Nothing else in this component
// should need to change shape-wise.
//
// The "Load" action below is a confirmed stub (console.log only, restores
// nothing into the canvas) — flagged rather than silently left broken per
// the redesign brief. Actually wiring a saved-design payload into Konva
// layers is a separate, nontrivial task (out of scope for this pass), so
// the button is disabled with an honest "Coming soon" label instead of
// pretending to work.

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
  return (
    <div className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
        My Designs
      </p>

      {MOCK_SAVED_DESIGNS.length === 0 ? (
        <p className="mt-3 px-1 py-2 text-xs font-semibold text-black/45">
          You haven&apos;t saved any designs yet.
        </p>
      ) : (
        <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {MOCK_SAVED_DESIGNS.map((design) => (
            <div
              key={design.id}
              className="flex items-center gap-3 rounded-2xl border border-black/10 p-2"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element -- small mock thumbnail strip, not worth next/image config here */}
                <img
                  src={design.thumbnailUrl}
                  alt={design.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{design.name}</p>
                <p className="text-[10px] text-black/40">{formatDate(design.createdAt)}</p>
              </div>

              <button
                type="button"
                disabled
                title="Loading saved designs into the canvas isn't wired up yet"
                className="shrink-0 rounded-full bg-black/10 px-3 py-1.5 text-[11px] font-bold text-black/40"
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
