"use client";

import Link from "next/link";
import { ChevronLeft, Pencil, Redo2, ShoppingBag, Undo2, Check } from "lucide-react";
import { motion } from "motion/react";

import IconButton from "./icon-button";

// ============================================================================
// EDITOR TOP BAR (Task 1)
// ============================================================================
// Fixed ~72px header. The primary action button preserves the exact real
// "finalize" behavior audited in Task 0 (handleAddToCart / isEditMode) — the
// mockup's "Save draft" label was a placeholder, not a literal instruction
// to change what the button does, since there is only ever one real action
// today (confirmed: no separate checkout/buy-now path exists).
// ============================================================================

export default function EditorTopBar({
  isEditMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  unitPrice,
  imageReady,
  addedToCart,
  onPrimaryAction,
}: {
  isEditMode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  unitPrice: number;
  imageReady: boolean;
  addedToCart: boolean;
  onPrimaryAction: () => void;
}) {
  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        h-[72px]
        items-center
        gap-3
        border-b
        border-black/5
        bg-white/90
        px-4
        backdrop-blur
        sm:px-6
      "
    >
      <Link
        href="/shop"
        aria-label="Back to shop"
        className="
          flex
          size-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          text-black/60
          transition
          hover:bg-cream
          hover:text-black
        "
      >
        <ChevronLeft size={19} />
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-extrabold leading-tight sm:text-lg">
          Custom Sticker Maker
        </h1>
        <p className="truncate text-[11px] font-semibold text-black/45">
          {isEditMode ? "Editing · Saved design" : "New design"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
        <IconButton icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />
      </div>

      <motion.button
        type="button"
        disabled={!imageReady || addedToCart}
        onClick={onPrimaryAction}
        whileTap={imageReady && !addedToCart ? { scale: 0.97 } : undefined}
        className={`
          ml-1
          flex
          shrink-0
          items-center
          gap-2
          rounded-full
          px-4
          py-2.5
          text-xs
          font-bold
          text-white
          transition

          sm:px-5
          sm:text-sm

          ${
            addedToCart
              ? "bg-green-600"
              : imageReady
                ? "bg-black hover:scale-[1.02]"
                : "cursor-not-allowed bg-black/30"
          }
        `}
      >
        {addedToCart ? (
          <>
            <Check size={16} />
            <span className="hidden sm:inline">
              {isEditMode ? "Design Updated" : "Added To Cart"}
            </span>
          </>
        ) : (
          <>
            {isEditMode ? <Pencil size={16} /> : <ShoppingBag size={16} />}
            <span className="hidden sm:inline">
              {isEditMode ? "Update Design" : `Add to Cart · ₹${unitPrice}`}
            </span>
            <span className="sm:hidden">₹{unitPrice}</span>
          </>
        )}
      </motion.button>
    </header>
  );
}
