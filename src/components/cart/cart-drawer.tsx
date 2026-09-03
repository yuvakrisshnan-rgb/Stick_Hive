"use client";

import Link from "next/link";



import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";

import { useEffect } from "react";


import {
  useShop,
  MAX_CART_QUANTITY,
  FREE_SHIPPING_THRESHOLD,
} from "@/components/shop/store-provider";

import type {
  CartLineDetailed,
  CustomStickerCartLine,
} from "@/components/shop/store-provider";


// ============================================================================
// CART DRAWER
// ============================================================================

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,

    cartLines,

    cartSubtotal,
    cartDiscount,
    shippingCost,
    cartTotal,
    hasFreeShipping,

    updateQuantity,
    removeFromCart,

    customCartLines,
    updateCustomStickerQuantity,
    removeCustomStickerFromCart,

    clearAllCart,
  } = useShop();


  // ==========================================================================
  // HAS ITEMS
  // ==========================================================================

  const hasItems =
    cartLines.length > 0 ||
    customCartLines.length > 0;


  // ==========================================================================
  // CLOSE WITH ESCAPE
  // ==========================================================================

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isCartOpen,
    closeCart,
  ]);


  // ==========================================================================
  // PREVENT BACKGROUND SCROLL
  // ==========================================================================

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isCartOpen,
  ]);


  // ==========================================================================
  // CLEAR CART
  // ==========================================================================

  function handleClearCart() {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear your cart?",
      );

    if (!confirmed) {
      return;
    }

    clearAllCart();
  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* ================================================================
              BACKDROP
          ================================================================ */}

          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="
              fixed
              inset-0
              z-[190]
              cursor-default
              bg-black/35
              backdrop-blur-[3px]
            "
          />


          {/* ================================================================
              DRAWER
          ================================================================ */}

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="
              fixed
              right-0
              top-0
              z-[200]
              flex
              h-[100dvh]
              w-full
              max-w-md
              flex-col
              overflow-hidden
              border-l
              border-black/10
              bg-[#fff8ed]
              pb-[env(safe-area-inset-bottom)]
              shadow-[-20px_0_60px_rgba(0,0,0,0.18)]
            "
          >

            {/* ============================================================
                HEADER
            ============================================================ */}

            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                border-b
                border-black/10
                px-6
                py-5
              "
            >

              <div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      flex
                      size-9
                      items-center
                      justify-center
                      rounded-full
                      bg-hive-yellow
                      text-lg
                    "
                  >
                    🐝
                  </div>

                  <h2
                    className="
                      font-display
                      text-xl
                      font-extrabold
                      tracking-tight
                      text-ink
                    "
                  >
                    Your Hive
                  </h2>

                </div>


                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    text-black/45
                  "
                >
                  Your sticker collection
                </p>

              </div>


              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  shadow-sm
                  transition
                  hover:scale-105
                  hover:bg-hive-yellow
                "
              >
                <X size={19} />
              </button>

            </div>


            {/* ============================================================
                EMPTY CART
            ============================================================ */}

            {!hasItems ? (

              <EmptyCart />

            ) : (

              <>

                {/* ========================================================
                    CART ITEMS
                ======================================================== */}

                <div
                  className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    px-5
                    py-5
                  "
                >

                  {/* ======================================================
                      ITEM COUNT + CLEAR
                  ====================================================== */}

                  <div
                    className="
                      mb-4
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-black/45
                      "
                    >
                      {cartLines.length +
                        customCartLines.length}{" "}
                      item
                      {cartLines.length +
                        customCartLines.length !==
                      1
                        ? "s"
                        : ""}
                    </p>


                    <button
                      type="button"
                      onClick={
                        handleClearCart
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        px-2
                        py-1.5
                        text-xs
                        font-bold
                        text-black/45
                        transition
                        hover:bg-white
                        hover:text-black
                      "
                    >

                      <RotateCcw
                        size={14}
                      />

                      Clear cart

                    </button>

                  </div>


                  {/* ======================================================
                      PRODUCTS
                  ====================================================== */}

                  <div
                    className="
                      flex
                      flex-col
                      gap-4
                    "
                  >

                    {/* ==================================================
                        NORMAL PRODUCTS
                    ================================================== */}

                    <AnimatePresence
                      initial={false}
                    >

                      {cartLines.map(
                        (line) => (
                          <CartItem
                            key={`${line.productId}-${line.size}`}
                            line={line}
                            onIncrease={() =>
                              updateQuantity(
                                line.productId,
                                line.size,
                                Math.min(
                                  MAX_CART_QUANTITY,
                                  line.quantity + 1,
                                ),
                              )
                            }
                            onDecrease={() =>
                              updateQuantity(
                                line.productId,
                                line.size,
                                line.quantity - 1,
                              )
                            }
                            onRemove={() =>
                              removeFromCart(
                                line.productId,
                                line.size,
                              )
                            }
                          />
                        ),
                      )}

                    </AnimatePresence>


                    {/* ==================================================
                        CUSTOM STICKERS
                    ================================================== */}

                    <AnimatePresence
                      initial={false}
                    >

                      {customCartLines.map(
                        (line) => (
                          <CustomCartItem
                            key={line.id}
                            line={line}
                            onIncrease={() =>
                              updateCustomStickerQuantity(
                                line.id,
                                Math.min(
                                  MAX_CART_QUANTITY,
                                  line.quantity + 1,
                                ),
                              )
                            }
                            onDecrease={() =>
                              updateCustomStickerQuantity(
                                line.id,
                                line.quantity - 1,
                              )
                            }
                            onRemove={() =>
                              removeCustomStickerFromCart(
                                line.id,
                              )
                            }
                            onEdit={() => {
                              closeCart();

                              window.location.href =
                                `/custom-sticker?edit=${encodeURIComponent(line.id)}`;
                            }}
                          />
                        ),
                      )}

                    </AnimatePresence>

                  </div>

                </div>


                {/* ========================================================
                    FOOTER
                ======================================================== */}

                <CartFooter
                  subtotal={
                    cartSubtotal
                  }
                  discount={
                    cartDiscount
                  }
                  shipping={
                    shippingCost
                  }
                  total={
                    cartTotal
                  }
                  hasFreeShipping={
                    hasFreeShipping
                  }
                  onCheckout={() => {
                    closeCart();
                  }}
                />

              </>

            )}

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}


// ============================================================================
// NORMAL CART ITEM
// ============================================================================

function CartItem({
  line,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  line: CartLineDetailed;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {

  const canIncrease =
    line.quantity 
    MAX_CART_QUANTITY;


  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className="
        rounded-3xl
        border
        border-black/10
        bg-white
        p-4
        shadow-sm
      "
    >

      {/* ================================================================
          PRODUCT
      ================================================================ */}

      <div
        className="
          flex
          gap-4
        "
      >

        {/* IMAGE */}

        <div
          className="
            size-24
            shrink-0
            overflow-hidden
            rounded-2xl
            bg-cream
          "
        >

          <img
            src={
              line.product.image ??
              "/placeholder-sticker.png"
            }
            alt={line.product.name}
            className="
              h-full
              w-full
              object-cover
            "
          />

        </div>


        {/* DETAILS */}

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
          "
        >

          <h3
            className="
              truncate
              text-sm
              font-extrabold
            "
          >
            {line.product.name}
          </h3>


          <p
            className="
              mt-1
              text-xs
              font-semibold
              text-black/40
            "
          >
            Size: {line.size}
          </p>


          <div
            className="
              mt-2
              flex
              items-center
              gap-2
            "
          >

            <p
              className="
                text-lg
                font-extrabold
              "
            >
              ₹{line.lineTotal}
            </p>


            {line.lineDiscount > 0 && (
              <span
                className="
                  text-xs
                  font-semibold
                  text-black/30
                  line-through
                "
              >
                ₹
                {line.originalUnitPrice
                  ? line.originalUnitPrice *
                    line.quantity
                  : line.lineTotal}
              </span>
            )}

          </div>

        </div>


        {/* REMOVE */}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${line.product.name} from cart`}
          className="
            flex
            size-8
            shrink-0
            items-center
            justify-center
            rounded-full
            text-black/30
            transition
            hover:bg-red-50
            hover:text-red-500
          "
        >
          <Trash2 size={16} />
        </button>

      </div>


      {/* ================================================================
          QUANTITY
      ================================================================ */}

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            rounded-full
            bg-cream
            px-3
            py-1.5
          "
        >

          <button
            type="button"
            onClick={onDecrease}
            aria-label={`Decrease quantity of ${line.product.name}`}
            className="
              flex
              size-7
              items-center
              justify-center
              rounded-full
              bg-white
              transition
              hover:scale-105
              hover:bg-black
              hover:text-white
            "
          >
            <Minus size={14} />
          </button>


          <span
            className="
              min-w-5
              text-center
              text-sm
              font-bold
            "
          >
            {line.quantity}
          </span>


          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            aria-label={`Increase quantity of ${line.product.name}`}
            className="
              flex
              size-7
              items-center
              justify-center
              rounded-full
              bg-white
              transition
              hover:scale-105
              hover:bg-black
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <Plus size={14} />
          </button>

        </div>


        {line.quantity >=
          MAX_CART_QUANTITY && (
          <p
            className="
              text-[10px]
              font-semibold
              text-black/30
            "
          >
            Max {MAX_CART_QUANTITY}
          </p>
        )}

      </div>

    </motion.div>
  );
}


// ============================================================================
// CUSTOM STICKER ITEM
// ============================================================================

function CustomCartItem({
  line,
  onIncrease,
  onDecrease,
  onRemove,
  onEdit,
}: {
  line: CustomStickerCartLine;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {

  const canIncrease =
    line.quantity 
    MAX_CART_QUANTITY;


  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className="
        rounded-3xl
        border
        border-black/10
        bg-white
        p-4
        shadow-sm
      "
    >

      {/* CUSTOM LABEL */}

      <div
        className="
          mb-3
          inline-flex
          rounded-full
          bg-hive-yellow
          px-3
          py-1
          text-[10px]
          font-black
          uppercase
          tracking-wider
        "
      >
        CUSTOM DESIGN 🐝
      </div>


      {/* ================================================================
          PRODUCT
      ================================================================ */}

      <div
        className="
          flex
          gap-4
        "
      >

        {/* IMAGE — flattened thumbnail generated from the canvas */}

        <div
          className={`
            relative
            size-24
            shrink-0
            overflow-hidden
            bg-[#fff8ed]

            ${
              line.shape ===
              "Circle"
                ? "rounded-full"
                : line.shape ===
                    "Rounded"
                  ? "rounded-3xl"
                  : line.shape ===
                      "Square"
                    ? "rounded-none"
                    : "rounded-xl"
            }
          `}
        >

          <img
            src={line.thumbnailUrl}
            alt="Custom sticker"
            className="
              h-full
              w-full
              object-contain
            "
          />

        </div>


        {/* DETAILS */}

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
          "
        >

          <h3
            className="
              text-sm
              font-extrabold
            "
          >
            Custom Sticker
          </h3>


          <p
            className="
              mt-1
              text-xs
              font-semibold
              text-black/40
            "
          >
            Your custom creation
          </p>


          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-1.5
            "
          >

            <span
              className="
                rounded-full
                bg-cream
                px-2.5
                py-1
                text-[10px]
                font-bold
              "
            >
              {line.size}
            </span>


            <span
              className="
                rounded-full
                bg-cream
                px-2.5
                py-1
                text-[10px]
                font-bold
              "
            >
              {line.shape}
            </span>


            <span
              className="
                rounded-full
                bg-cream
                px-2.5
                py-1
                text-[10px]
                font-bold
              "
            >
              {line.finish ??
                "Matte"}
            </span>

          </div>

        </div>


        {/* REMOVE */}

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove custom sticker from cart"
          className="
            flex
            size-8
            shrink-0
            items-center
            justify-center
            rounded-full
            text-black/30
            transition
            hover:bg-red-50
            hover:text-red-500
          "
        >
          <Trash2 size={16} />
        </button>

      </div>


      {/* ================================================================
          BOTTOM
      ================================================================ */}

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
        "
      >

        {/* QUANTITY */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-full
            bg-cream
            px-3
            py-1.5
          "
        >

          <button
            type="button"
            onClick={onDecrease}
            aria-label="Decrease custom sticker quantity"
            className="
              flex
              size-7
              items-center
              justify-center
              rounded-full
              bg-white
              transition
              hover:scale-105
              hover:bg-black
              hover:text-white
            "
          >
            <Minus size={14} />
          </button>


          <span
            className="
              min-w-5
              text-center
              text-sm
              font-bold
            "
          >
            {line.quantity}
          </span>


          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            aria-label="Increase custom sticker quantity"
            className="
              flex
              size-7
              items-center
              justify-center
              rounded-full
              bg-white
              transition
              hover:scale-105
              hover:bg-black
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <Plus size={14} />
          </button>

        </div>


        {/* PRICE */}

        <p
          className="
            text-lg
            font-extrabold
          "
        >
          ₹{line.lineTotal}
        </p>

      </div>


      {/* EDIT */}

      <button
        type="button"
        onClick={onEdit}
        className="
          mt-3
          w-full
          rounded-full
          border
          border-black/10
          bg-cream
          py-2.5
          text-xs
          font-bold
          transition
          hover:bg-hive-yellow
        "
      >
        Edit Design
      </button>

    </motion.div>
  );
}


// ============================================================================
// EMPTY CART
// ============================================================================

function EmptyCart() {

  return (
    <div
      className="
        flex
        flex-1
        flex-col
        items-center
        justify-center
        px-8
        text-center
      "
    >

      <div
        className="
          flex
          size-20
          items-center
          justify-center
          rounded-full
          bg-hive-yellow
        "
      >
        <ShoppingBag size={34} />
      </div>


      <h3
        className="
          mt-6
          text-2xl
          font-extrabold
        "
      >
        Your hive needs stickers 🐝
      </h3>


      <p
        className="
          mt-2
          max-w-xs
          text-sm
          font-medium
          text-black/45
        "
      >
        Start creating stickers and
        add them to your collection.
      </p>


      <Link
        href="/shop"
        className="
          mt-6
          inline-flex
          items-center
          justify-center
          rounded-full
          bg-black
          px-8
          py-3
          text-sm
          font-bold
          text-white
          transition
          hover:scale-[1.02]
        "
      >
        Explore Stickers
      </Link>

    </div>
  );
}


// ============================================================================
// CART FOOTER
// ============================================================================

function CartFooter({
  subtotal,
  discount,
  shipping,
  total,
  hasFreeShipping,
  onCheckout,
}: {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  hasFreeShipping: boolean;
  onCheckout: () => void;
}) {

  return (
    <div
      className="
        shrink-0
        border-t
        border-black/10
        bg-[#fff8ed]
        px-5
        pb-5
        pt-4
      "
    >

      {/* ================================================================
          PRICE SUMMARY
      ================================================================ */}

      <div
        className="
          space-y-2.5
        "
      >

        {/* SUBTOTAL */}

        <div
          className="
            flex
            items-center
            justify-between
            text-sm
          "
        >

          <span
            className="
              font-semibold
              text-black/50
            "
          >
            Subtotal
          </span>


          <span
            className="
              font-bold
            "
          >
            ₹{subtotal}
          </span>

        </div>


        {/* DISCOUNT */}

        {discount > 0 && (
          <div
            className="
              flex
              items-center
              justify-between
              text-sm
            "
          >

            <span
              className="
                font-semibold
                text-black/50
            "
            >
              You save
            </span>


            <span
              className="
                font-bold
                text-green-600
              "
            >
              -₹{discount}
            </span>

          </div>
        )}


        {/* SHIPPING */}

        <div
          className="
            flex
            items-center
            justify-between
            text-sm
          "
        >

          <span
            className="
              font-semibold
              text-black/50
            "
          >
            Shipping
          </span>


          {hasFreeShipping ? (

            <span
              className="
                font-bold
                text-green-600
              "
            >
              FREE
            </span>

          ) : (

            <span
              className="
                font-bold
              "
            >
              ₹{shipping}
            </span>

          )}

        </div>


        {/* DIVIDER */}

        <div
          className="
            border-t
            border-black/10
            pt-3
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <span
              className="
                text-sm
                font-bold
                text-black/50
              "
            >
              Total
            </span>


            <span
              className="
                text-2xl
                font-extrabold
              "
            >
              ₹{total}
            </span>

          </div>

        </div>

      </div>


      {/* ================================================================
          CHECKOUT
      ================================================================ */}

      <Link
        href="/checkout"
        onClick={onCheckout}
        className="
          mt-4
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-full
          bg-black
          py-3.5
          text-sm
          font-bold
          text-white
          transition
          hover:scale-[1.01]
          hover:bg-black/90
          active:scale-[0.99]
        "
      >
        <ShoppingBag
          size={17}
        />

        Checkout
      </Link>


      {/* ================================================================
          SHIPPING NOTE
      ================================================================ */}

      <p
        className="
          mt-2.5
          text-center
          text-[11px]
          font-semibold
          text-black/35
        "
      >
        {hasFreeShipping
          ? "🎉 Free shipping unlocked"
          : `Free shipping on orders ₹${FREE_SHIPPING_THRESHOLD}+`}
      </p>

    </div>
  );
}