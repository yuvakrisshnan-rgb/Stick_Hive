"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

// ============================================================================
// PROPS
// ============================================================================

type StickerEditorShellProps = {
  canvasArea: React.ReactNode;
  toolbarArea: React.ReactNode;
  panelArea: React.ReactNode;
  panelTitle: string;
  hasSelection: boolean;
  onClearSelection: () => void;
};

// ============================================================================
// RESPONSIVE HOOK
// ============================================================================

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    function update() {
      setIsDesktop(query.matches);
    }

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

// ============================================================================
// STICKER EDITOR SHELL
// ============================================================================

export default function StickerEditorShell({
  canvasArea,
  toolbarArea,
  panelArea,
  panelTitle,
  hasSelection,
  onClearSelection,
}: StickerEditorShellProps) {
  const isDesktop = useIsDesktop();
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Auto-expand the mobile sheet whenever a layer becomes selected.
  useEffect(() => {
    if (!isDesktop && hasSelection) {
      setSheetExpanded(true);
    }
  }, [hasSelection, isDesktop]);

  // --------------------------------------------------------------------------
  // DESKTOP LAYOUT
  // --------------------------------------------------------------------------

  if (isDesktop) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="sticky top-32 h-fit space-y-4">
          <section className="rounded-[2.8rem] bg-white p-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-black/40">
                  Design
                </p>
                <h2 className="mt-2 text-3xl font-extrabold">
                  Your Sticker
                </h2>
              </div>

              <div className="rounded-full bg-cream px-5 py-2 text-xs font-bold text-black/60">
                Live Preview
              </div>
            </div>

            <div className="mt-6">{toolbarArea}</div>

            <div className="mt-6">{canvasArea}</div>
          </section>
        </div>

        <div className="sticky top-32 h-[calc(100vh-150px)] space-y-5 overflow-y-auto pb-32 pr-2 custom-scroll">
          {panelArea}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MOBILE LAYOUT — canvas full-width, toolbar below it, panel as a
  // bottom sheet that expands when a layer is selected or manually opened.
  // --------------------------------------------------------------------------

  return (
    <div className="pb-24">
      <section className="rounded-[2rem] bg-white p-4 shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">
            Design
          </p>
          <h2 className="mt-1 text-xl font-extrabold">Your Sticker</h2>
        </div>

        <div className="mb-4">{toolbarArea}</div>

        <div>{canvasArea}</div>
      </section>

      {/* ==================================================================
          BOTTOM SHEET TOGGLE (collapsed state)
      ================================================================== */}

      {!sheetExpanded && (
        <button
          type="button"
          onClick={() => setSheetExpanded(true)}
          className="
            fixed
            bottom-4
            left-4
            right-4
            z-40
            flex
            items-center
            justify-between
            rounded-2xl
            bg-black
            px-5
            py-4
            text-sm
            font-bold
            text-white
            shadow-2xl
          "
        >
          {panelTitle}
          <ChevronUp size={18} />
        </button>
      )}

      {/* ==================================================================
          BOTTOM SHEET (expanded state)
      ================================================================== */}

      <AnimatePresence>
        {sheetExpanded && (
          <>
            <motion.button
              type="button"
              aria-label="Close panel"
              onClick={() => {
                setSheetExpanded(false);
                onClearSelection();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="
                fixed
                inset-x-0
                bottom-0
                z-50
                max-h-[80vh]
                overflow-y-auto
                rounded-t-[2rem]
                bg-[#fff8ed]
                p-5
                pb-10
                shadow-[0_-20px_60px_rgba(0,0,0,0.2)]
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">{panelTitle}</h3>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSheetExpanded(false)}
                    className="flex size-9 items-center justify-center rounded-full bg-black/5"
                  >
                    <ChevronDown size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetExpanded(false);
                      onClearSelection();
                    }}
                    className="flex size-9 items-center justify-center rounded-full bg-black/5"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-5">{panelArea}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}