"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { motion, useInView } from "motion/react";
import { Plus } from "lucide-react";

import {
  PRODUCTS,
  priceFor,
  type Product,
} from "@/lib/product-data";

import { useShop } from "@/components/shop/store-provider";

import { StickerImage } from "@/components/shop/sticker-image";


/* ========================================================================= */
/* CONFIGURATION                                                             */
/* ========================================================================= */

const TRENDING_COUNT = 8;

/*
 * Automatic horizontal scrolling speed.
 *
 * Slightly faster than the previous version.
 */

const AUTO_SCROLL_SPEED = 0.75;


/* ========================================================================= */
/* GET TRENDING PRODUCTS                                                     */
/* ========================================================================= */

function getTrendingProducts(): Product[] {
  const trendingProducts = PRODUCTS.filter(
    (product) => {
      const labels = product.labels ?? [];

      return (
        product.inStock &&
        labels.some(
          (label) =>
            label.toLowerCase() === "trending",
        )
      );
    },
  );

  if (
    trendingProducts.length >=
    TRENDING_COUNT
  ) {
    return trendingProducts.slice(
      0,
      TRENDING_COUNT,
    );
  }

  return PRODUCTS
    .filter(
      (product) =>
        product.inStock,
    )
    .slice(
      0,
      TRENDING_COUNT,
    );
}


/* ========================================================================= */
/* MAIN COMPONENT                                                            */
/* ========================================================================= */

export default function TrendingStickers() {

  const {
    addToCart,
    openCart,
  } = useShop();


  /* ----------------------------------------------------------------------- */
  /* PRODUCTS                                                                */
  /* ----------------------------------------------------------------------- */

  const products = useMemo(
    () =>
      getTrendingProducts(),
    [],
  );


  /* ----------------------------------------------------------------------- */
  /* VIEWPORT                                                                */
  /* ----------------------------------------------------------------------- */

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  /* ----------------------------------------------------------------------- */
  /* VISIBILITY (pause the auto-scroll loop and card float animations while */
  /* this section is scrolled off-screen, instead of running them forever) */
  /* ----------------------------------------------------------------------- */

  const isSectionInView =
    useInView(
      viewportRef,
      { amount: 0.1 },
    );


  /* ----------------------------------------------------------------------- */
  /* DRAG STATE                                                              */
  /* ----------------------------------------------------------------------- */

  const isDraggingRef =
    useRef(false);


  const dragStartXRef =
    useRef(0);


  const dragStartScrollLeftRef =
    useRef(0);


  const [isDragging, setIsDragging] =
    useState(false);


  /* ----------------------------------------------------------------------- */
  /* HOVER STATE                                                             */
  /* ----------------------------------------------------------------------- */

  const [isHovered, setIsHovered] =
    useState(false);


  /* ========================================================================= */
  /* AUTOMATIC HORIZONTAL SCROLL                                              */
  /* ========================================================================= */

  useEffect(() => {

    const viewport =
      viewportRef.current;


    if (!viewport) {
      return;
    }


    /*
     * Don't even start the loop while the section is
     * scrolled off-screen — this was previously running
     * forever, mutating scrollLeft every frame, regardless
     * of whether the user could see it.
     */

    if (
      !isSectionInView
    ) {
      return;
    }


    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;


    if (
      prefersReducedMotion
    ) {
      return;
    }


    let animationFrame =
      0;


    let lastTime =
      performance.now();


    /*
     * scrollWidth forces a layout read — cache it instead
     * of reading it on every single frame. It only changes
     * if the window resizes (the track's own content is
     * static once mounted).
     */

    let halfWidth =
      viewport.scrollWidth / 2;


    const updateHalfWidth = () => {

      halfWidth =
        viewport.scrollWidth / 2;

    };


    window.addEventListener(
      "resize",
      updateHalfWidth,
    );


    const animate = (
      currentTime: number,
    ) => {

      const delta =
        currentTime -
        lastTime;


      lastTime =
        currentTime;


      /*
       * Pause automatic movement while
       * the user is interacting with the
       * carousel.
       */

      if (
        !isDraggingRef.current &&
        !isHovered
      ) {

        const movement =
          (delta / 16.67) *
          AUTO_SCROLL_SPEED;


        viewport.scrollLeft +=
          movement;


        /*
         * Two identical product groups
         * create the seamless loop.
         */

        if (
          viewport.scrollLeft >=
          halfWidth
        ) {

          viewport.scrollLeft -=
            halfWidth;

        }

      }


      animationFrame =
        requestAnimationFrame(
          animate,
        );

    };


    animationFrame =
      requestAnimationFrame(
        animate,
      );


    return () => {

      cancelAnimationFrame(
        animationFrame,
      );


      window.removeEventListener(
        "resize",
        updateHalfWidth,
      );

    };

  }, [
    isHovered,
    isSectionInView,
  ]);


  /* ========================================================================= */
  /* POINTER DRAG                                                             */
  /* ========================================================================= */

  const handlePointerDown =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {

        const viewport =
          viewportRef.current;


        if (!viewport) {
          return;
        }


        if (
          event.pointerType ===
            "mouse" &&
          event.button !== 0
        ) {
          return;
        }


        isDraggingRef.current =
          true;


        setIsDragging(
          true,
        );


        dragStartXRef.current =
          event.clientX;


        dragStartScrollLeftRef.current =
          viewport.scrollLeft;


        viewport.setPointerCapture(
          event.pointerId,
        );

      },
      [],
    );


  const handlePointerMove =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {

        if (
          !isDraggingRef.current
        ) {
          return;
        }


        const viewport =
          viewportRef.current;


        if (!viewport) {
          return;
        }


        const distance =
          event.clientX -
          dragStartXRef.current;


        viewport.scrollLeft =
          dragStartScrollLeftRef.current -
          distance;


        const halfWidth =
          viewport.scrollWidth / 2;


        if (
          viewport.scrollLeft >=
          halfWidth
        ) {

          viewport.scrollLeft -=
            halfWidth;


          dragStartScrollLeftRef.current =
            viewport.scrollLeft;

        }


        if (
          viewport.scrollLeft < 0
        ) {

          viewport.scrollLeft +=
            halfWidth;


          dragStartScrollLeftRef.current =
            viewport.scrollLeft;

        }

      },
      [],
    );


  const stopDragging =
    useCallback(
      (
        event?: React.PointerEvent<HTMLDivElement>,
      ) => {

        if (
          !isDraggingRef.current
        ) {
          return;
        }


        isDraggingRef.current =
          false;


        setIsDragging(
          false,
        );


        if (
          event &&
          viewportRef.current?.hasPointerCapture(
            event.pointerId,
          )
        ) {

          viewportRef.current.releasePointerCapture(
            event.pointerId,
          );

        }

      },
      [],
    );


  /* ========================================================================= */
  /* WHEEL                                                                     */
  /* ========================================================================= */

  const handleWheel =
    useCallback(
      (
        event: React.WheelEvent<HTMLDivElement>,
      ) => {

        const viewport =
          viewportRef.current;


        if (!viewport) {
          return;
        }


        /*
         * Let native horizontal trackpad
         * scrolling behave normally.
         */

        if (
          Math.abs(event.deltaX) >
          Math.abs(event.deltaY)
        ) {
          return;
        }


        /*
         * Convert normal mouse wheel
         * movement into horizontal movement.
         */

        if (
          Math.abs(event.deltaY) > 0
        ) {

          event.preventDefault();

          viewport.scrollLeft +=
            event.deltaY;

        }

      },
      [],
    );


  /* ========================================================================= */
  /* ADD TO CART                                                               */
  /* ========================================================================= */

  function handleAdd(
    product: Product,
  ) {

    if (
      !product.inStock ||
      !product.sizes[0]
    ) {
      return;
    }


    addToCart(
      product.id,
      product.sizes[0],
      1,
    );


    /*
     * Open the cart so the customer
     * immediately sees the item.
     */

    openCart();

  }


  /* ========================================================================= */
  /* EMPTY STATE                                                               */
  /* ========================================================================= */

  if (
    products.length === 0
  ) {
    return null;
  }


  /* ========================================================================= */
  /* RENDER                                                                    */
  /* ========================================================================= */

  return (

    <section
      id="trending"
      className="
        relative
        overflow-hidden
        py-4
        md:py-6
      "
    >

      {/* =================================================================== */}
      {/* TRENDING VIEWPORT                                                    */}
      {/* =================================================================== */}

      <div
        ref={viewportRef}
        className={`
          trending-viewport
          ${isDragging ? "is-dragging" : ""}
        `}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          stopDragging
        }
        onPointerCancel={
          stopDragging
        }
        onWheel={
          handleWheel
        }
        onMouseEnter={() =>
          setIsHovered(true)
        }
        onMouseLeave={() =>
          setIsHovered(false)
        }
      >

        <div
          className="
            trending-track
          "
        >

          {/* ============================================================= */}
          {/* GROUP ONE                                                       */}
          {/* ============================================================= */}

          <div
            className="
              trending-group
            "
          >

            {products.map(
              (
                product,
                index,
              ) => (

                <TrendingCard
                  key={
                    `group-one-${product.id}`
                  }
                  product={
                    product
                  }
                  index={
                    index
                  }
                  onAdd={
                    handleAdd
                  }
                  isInView={
                    isSectionInView
                  }
                />

              ),
            )}

          </div>


          {/* ============================================================= */}
          {/* GROUP TWO                                                       */}
          {/* ============================================================= */}

          <div
            className="
              trending-group
            "
            aria-hidden="true"
          >

            {products.map(
              (
                product,
                index,
              ) => (

                <TrendingCard
                  key={
                    `group-two-${product.id}`
                  }
                  product={
                    product
                  }
                  index={
                    index
                  }
                  onAdd={
                    handleAdd
                  }
                  isInView={
                    isSectionInView
                  }
                />

              ),
            )}

          </div>

        </div>

      </div>


      {/* =================================================================== */}
      {/* DIVIDER                                                              */}
      {/* =================================================================== */}

      <div
        className="
          mx-6
          mt-8
          h-[2px]
          bg-black
          lg:mx-auto
          lg:max-w-7xl
        "
      />

    </section>

  );
}


/* ========================================================================= */
/* TRENDING CARD                                                             */
/* ========================================================================= */

type TrendingCardProps = {

  product: Product;

  index: number;

  onAdd: (
    product: Product,
  ) => void;

  isInView: boolean;

};


function TrendingCard({
  product,
  index,
  onAdd,
  isInView,
}: TrendingCardProps) {

  const pricing =
    priceFor(
      product,
      product.sizes[0],
    );


  /*
   * Every card gets a slightly different
   * delay so they don't move together.
   */

  const floatDelay =
    index * 0.35;


  return (

    /*
     * IMPORTANT:
     *
     * The outer article handles hover.
     * The inner motion wrapper handles
     * the subtle floating animation.
     *
     * This prevents the two transforms
     * from fighting each other.
     */

    <article
      className="
        trending-card
        relative
        h-[390px]
        w-[270px]
        shrink-0
        rounded-[28px]
        bg-white
        p-3
        shadow-[0_25px_60px_-25px_rgba(0,0,0,0.35)]
        md:h-[430px]
        md:w-[300px]
      "
    >

      <motion.div
        animate={
          isInView
            ? {
                y: [
                  0,
                  -7,
                  0,
                  6,
                  0,
                ],
              }
            : undefined
        }
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelay,
        }}
        className="
          trending-card-motion
          h-full
          w-full
        "
      >

        {/* =============================================================== */}
        {/* CARD BODY                                                         */}
        {/* =============================================================== */}

        <div
          className="
            relative
            flex
            h-full
            flex-col
            overflow-hidden
            rounded-[22px]
            bg-cream
          "
        >

          {/* ============================================================= */}
          {/* INNER DASHED BORDER                                             */}
          {/* ============================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              inset-3
              z-20
              rounded-[18px]
              border
              border-dashed
              border-black/10
            "
          />


          {/* ============================================================= */}
          {/* IMAGE AREA                                                       */}
          {/* ============================================================= */}

          <Link
            href={`/shop/${product.id}`}
            draggable={false}
            className="
              relative
              flex
              flex-1
              items-center
              justify-center
              overflow-hidden
              p-8
            "
          >

            {/* ----------------------------------------------------------- */}
            {/* BACKGROUND GLOW                                               */}
            {/* ----------------------------------------------------------- */}

            <div
              className="
                pointer-events-none
                absolute
                size-56
                rounded-full
                bg-hive-yellow/30
                blur-3xl
              "
            />


            {/* ----------------------------------------------------------- */}
            {/* STICKER                                                       */}
            {/* ----------------------------------------------------------- */}

            <motion.div
              animate={{
                y: [
                  -2,
                  2,
                  -2,
                ],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay:
                  index * 0.15,
              }}
              className="
                relative
                z-10
                w-full
                max-w-[210px]
              "
            >

              <StickerImage
                product={
                  product
                }
              />

            </motion.div>

          </Link>


          {/* ============================================================= */}
          {/* PRODUCT INFORMATION                                              */}
          {/* ============================================================= */}

          <div
            className="
              relative
              z-20
              border-t
              border-black/10
              bg-white
              p-5
            "
          >

            <div
              className="
                flex
                items-end
                justify-between
                gap-4
              "
            >

              {/* ========================================================= */}
              {/* PRODUCT DETAILS                                              */}
              {/* ========================================================= */}

              <div
                className="
                  min-w-0
                "
              >

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-black/40
                  "
                >
                  {product.category}
                </p>


                <Link
                  href={`/shop/${product.id}`}
                  draggable={false}
                  className="
                    mt-1
                    block
                    truncate
                    text-lg
                    font-bold
                    text-ink
                    transition-opacity
                    hover:opacity-60
                  "
                >
                  {product.name}
                </Link>


                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-black/60
                  "
                >
                  ₹{pricing.price}
                </p>

              </div>


              {/* ========================================================= */}
              {/* ADD BUTTON                                                    */}
              {/* ========================================================= */}

              <button
                type="button"
                onClick={(event) => {

                  /*
                   * Stop the click from becoming
                   * a carousel drag.
                   */

                  event.stopPropagation();

                  onAdd(product);

                }}
                onPointerDown={(event) => {

                  /*
                   * Critical for reliable clicking
                   * while the carousel is draggable.
                   */

                  event.stopPropagation();

                }}
                aria-label={
                  `Add ${product.name} to cart`
                }
                className="
                  relative
                  z-[60]
                  flex
                  size-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-black
                  text-white
                  shadow-md
                  transition
                  duration-200
                  hover:scale-110
                  hover:bg-honey-orange
                  active:scale-95
                "
              >

                <Plus
                  size={19}
                  strokeWidth={2.25}
                />

              </button>

            </div>

          </div>

        </div>

      </motion.div>

    </article>

  );
}