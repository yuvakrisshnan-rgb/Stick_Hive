"use client"

import Link from "next/link"

import {
  Heart,
  ArrowRight,
  Trash2,
} from "lucide-react"

import {
  motion,
} from "motion/react"

import {
  PRODUCTS,
} from "@/lib/product-data"

import {
  ProductCard,
} from "@/components/products/product-card"

import {
  useWishlist,
} from "@/components/wishlist/wishlist-provider"


// ============================================================================
// WISHLIST PAGE
// ============================================================================

export default function WishlistPage() {

  const {
    wishlist,
    clearWishlist,
  } = useWishlist()


  const wishlistProducts =
    PRODUCTS.filter(
      (product) =>
        wishlist.includes(
          product.id,
        ),
    )


  return (

    <main
      className="
        min-h-screen
        bg-background
        pb-24
      "
    >

      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}

      <section
        className="
          relative
          overflow-hidden
          px-5
          pb-12
          pt-36
          sm:px-8
          lg:pb-16
          lg:pt-40
        "
      >

        {/* Background decoration */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-[-120px]
            top-20
            size-[360px]
            rounded-full
            bg-hive-yellow/25
            blur-[100px]
          "
        />


        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-[-100px]
            top-0
            size-[320px]
            rounded-full
            bg-mint/30
            blur-[100px]
          "
        />


        <div
          className="
            relative
            mx-auto
            max-w-6xl
          "
        >

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
          >

            {/* Label */}

            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-ink
                px-4
                py-2
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-white
              "
            >

              <Heart
                size={13}
                className="
                  fill-honey-orange
                  text-honey-orange
                "
              />

              Your Hive

            </span>


            {/* Heading */}

            <h1
              className="
                mt-6
                font-display
                text-5xl
                font-extrabold
                leading-[0.95]
                tracking-[-0.05em]
                text-ink
                sm:text-6xl
                lg:text-8xl
              "
            >

              Stickers you love.

            </h1>


            <p
              className="
                mt-6
                max-w-xl
                text-base
                leading-relaxed
                text-black/55
                sm:text-lg
              "
            >

              Keep your favourite StickHive
              stickers close until you're ready
              to make them yours.

            </p>

          </motion.div>

        </div>

      </section>


      {/* ================================================================== */}
      {/* CONTENT                                                            */}
      {/* ================================================================== */}

      <section
        className="
          mx-auto
          max-w-6xl
          px-5
          sm:px-8
        "
      >

        {wishlistProducts.length > 0 ? (

          <>

            {/* ============================================================
                HEADER
            ============================================================ */}

            <div
              className="
                mb-7
                flex
                flex-wrap
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-black/45
                  "
                >

                  {wishlistProducts.length}{" "}

                  {
                    wishlistProducts.length === 1
                      ? "sticker"
                      : "stickers"
                  }{" "}

                  saved

                </p>

              </div>


              <button
                type="button"
                onClick={
                  clearWishlist
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  px-4
                  py-2
                  text-xs
                  font-bold
                  text-black/55
                  transition
                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-red-500
                "
              >

                <Trash2
                  size={14}
                />

                Clear wishlist

              </button>

            </div>


            {/* ============================================================
                PRODUCT GRID
            ============================================================ */}

            <motion.div
              layout
              className="
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >

              {wishlistProducts.map(
                (
                  product,
                  index,
                ) => (

                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    index={
                      index
                    }
                  />

                ),
              )}

            </motion.div>


            {/* ============================================================
                CONTINUE SHOPPING
            ============================================================ */}

            <div
              className="
                mt-12
                flex
                justify-center
              "
            >

              <Link
                href="/shop"
                className="
                  group
                  inline-flex
                  items-center
                  gap-3
                  rounded-full
                  bg-ink
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:scale-105
                "
              >

                Continue shopping

                <ArrowRight
                  size={17}
                  className="
                    transition-transform
                    group-hover:translate-x-1
                  "
                />

              </Link>

            </div>

          </>

        ) : (

          <EmptyWishlist />

        )}

      </section>

    </main>

  )

}


// ============================================================================
// EMPTY WISHLIST
// ============================================================================

function EmptyWishlist() {

  return (

    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        flex
        min-h-[420px]
        flex-col
        items-center
        justify-center
        rounded-[2rem]
        border
        border-dashed
        border-black/10
        bg-white/60
        px-6
        text-center
      "
    >

      {/* Heart */}

      <div
        className="
          flex
          size-20
          items-center
          justify-center
          rounded-[1.5rem]
          bg-hive-yellow
        "
      >

        <Heart
          size={34}
          className="
            fill-white
            text-white
          "
        />

      </div>


      <h2
        className="
          mt-6
          font-display
          text-2xl
          font-extrabold
          text-ink
          sm:text-3xl
        "
      >
        Your hive is empty.
      </h2>


      <p
        className="
          mt-3
          max-w-md
          text-sm
          leading-relaxed
          text-black/45
        "
      >
        You haven't saved any stickers yet.
        Find something you love and tap the
        heart to keep it here.
      </p>


      <Link
        href="/shop"
        className="
          group
          mt-6
          inline-flex
          items-center
          gap-3
          rounded-full
          bg-ink
          px-6
          py-3
          text-sm
          font-bold
          text-white
          transition
          hover:scale-105
        "
      >

        Explore stickers

        <ArrowRight
          size={17}
          className="
            transition-transform
            group-hover:translate-x-1
          "
        />

      </Link>

    </motion.div>

  )

}