"use client"

import Link from "next/link"

import {
  ArrowRight,
} from "lucide-react"

import {
  motion,
} from "motion/react"

import {
  PRODUCTS,
  type Product,
} from "@/lib/product-data"

import {
  ProductCard,
} from "@/components/products/product-card"


// ============================================================================
// RELATED PRODUCTS
// ============================================================================

export default function RelatedProducts({
  product,
}: {
  product: Product
}) {

  // ==========================================================================
  // FIND RELATED PRODUCTS
  // ==========================================================================

  const relatedProducts =
    PRODUCTS
      .filter(
        (candidate) =>
          candidate.id !== product.id,
      )
      .map(
        (candidate) => {

          let score = 0


          // ------------------------------------------------------------------
          // SAME CATEGORY
          // ------------------------------------------------------------------

          if (
            candidate.category ===
            product.category
          ) {

            score += 5

          }


          // ------------------------------------------------------------------
          // SAME COLLECTION
          // ------------------------------------------------------------------

          if (
            candidate.collection &&
            product.collection &&
            candidate.collection ===
              product.collection
          ) {

            score += 3

          }


          // ------------------------------------------------------------------
          // MATCHING TAGS
          // ------------------------------------------------------------------

          const matchingTags =
            candidate.tags.filter(
              (tag) =>
                product.tags.includes(
                  tag,
                ),
            )


          score +=
            matchingTags.length * 2


          // ------------------------------------------------------------------
          // PREMIUM MATCH
          // ------------------------------------------------------------------

          if (
            candidate.isPremium ===
            product.isPremium
          ) {

            score += 1

          }


          return {
            product: candidate,
            score,
          }

        },
      )
      .filter(
        (item) =>
          item.score > 0,
      )
      .sort(
        (a, b) => {

          // Higher relevance first

          if (
            b.score !== a.score
          ) {

            return (
              b.score -
              a.score
            )

          }


          // If relevance is equal,
          // use rating as a secondary signal.

          return (
            b.product.rating -
            a.product.rating
          )

        },
      )
      .slice(0, 4)
      .map(
        (item) =>
          item.product,
      )


  // ==========================================================================
  // NOTHING RELATED
  // ==========================================================================

  if (
    relatedProducts.length === 0
  ) {

    return null

  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (

    <section
      className="
        mx-auto
        mt-20
        max-w-6xl
        px-5
        pb-20
        sm:px-8
      "
    >

      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-50px",
        }}
        transition={{
          duration: 0.5,
        }}
        className="
          mb-8
          flex
          flex-wrap
          items-end
          justify-between
          gap-5
        "
      >

        <div>

          {/* Label */}

          <span
            className="
              inline-flex
              rounded-full
              bg-hive-yellow
              px-3
              py-1.5
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-ink
            "
          >
            Keep exploring
          </span>


          {/* Heading */}

          <h2
            className="
              mt-3
              font-headline
              text-3xl
              font-extrabold
              tracking-tight
              text-ink
              sm:text-4xl
            "
          >
            You might also like.
          </h2>


          {/* Description */}

          <p
            className="
              mt-2
              max-w-xl
              text-sm
              leading-relaxed
              text-black/45
            "
          >
            More stickers from the hive
            that might fit your collection.
          </p>

        </div>


        {/* View all */}

        <Link
          href="/shop"
          className="
            group
            inline-flex
            shrink-0
            items-center
            gap-2
            rounded-full
            border
            border-black/10
            bg-white
            px-4
            py-2.5
            text-xs
            font-bold
            text-ink
            transition-all
            hover:border-black/20
            hover:bg-hive-yellow
          "
        >

          View all stickers

          <ArrowRight
            size={14}
            className="
              transition-transform
              group-hover:translate-x-1
            "
          />

        </Link>

      </motion.div>


      {/* ================================================================== */}
      {/* RELATED PRODUCT GRID                                               */}
      {/* ================================================================== */}

      <div
        className="
          grid
          gap-5
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >

        {relatedProducts.map(
          (
            relatedProduct,
            index,
          ) => (

            <motion.div
              key={
                relatedProduct.id
              }
              initial={{
                opacity: 0,
                y: 25,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                margin: "-50px",
              }}
              transition={{
                duration: 0.4,
                delay:
                  index * 0.06,
              }}
            >

              <ProductCard
                product={
                  relatedProduct
                }
                index={
                  index
                }
              />

            </motion.div>

          ),
        )}

      </div>

    </section>

  )

}