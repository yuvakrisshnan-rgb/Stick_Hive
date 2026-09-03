"use client"

import Link from "next/link"
import { useState } from "react"

import {
  motion,
} from "motion/react"

import {
  Heart,
  ShoppingBag,
  Check,
  Star,
} from "lucide-react"

import {
  StickerImage,
} from "@/components/shop/sticker-image"

import {
  useShop,
} from "@/components/shop/store-provider"

import {
  useWishlist,
} from "@/components/wishlist/wishlist-provider"

import type {
  Product,
} from "@/lib/product-data"

import {
  priceFor,
} from "@/lib/product-data"


// ============================================================================
// PRODUCT CARD
// ============================================================================

export function ProductCard({
  product,
  index,
}: {
  product: Product
  index: number
}) {

  const [added, setAdded] =
    useState(false)


  const {
    addToCart,
  } = useShop()


  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist()


  const wishlisted =
    isWishlisted(product.id)


  const {
    price,
  } = priceFor(
    product,
    product.sizes[0],
  )


  // ==========================================================================
  // ADD TO CART
  // ==========================================================================

  function handleAdd() {

    addToCart(
      product.id,
      product.sizes[0],
      1,
    )


    setAdded(true)


    setTimeout(() => {

      setAdded(false)

    }, 1200)

  }


  // ==========================================================================
  // TOGGLE WISHLIST
  // ==========================================================================

  function handleWishlist() {

    toggleWishlist(
      product.id,
    )

  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (

    <motion.article
      initial={{
        opacity: 0,
        y: 30,
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
        delay: index * 0.04,
      }}
      whileHover={{
        y: -8,
      }}
      className="
        group
        relative
        rounded-[2rem]
        border
        border-black/10
        bg-white
        p-5
        shadow-[0_20px_40px_-25px_rgba(0,0,0,0.35)]
        transition
      "
    >

      {/* ================================================================== */}
      {/* PREMIUM BADGE                                                       */}
      {/* ================================================================== */}

      {product.isPremium && (

        <span
          className="
            absolute
            left-5
            top-5
            z-20
            rounded-full
            bg-black
            px-3
            py-1
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-white
          "
        >
          Premium
        </span>

      )}


      {/* ================================================================== */}
      {/* OFFER BADGE                                                         */}
      {/* ================================================================== */}

      {product.offer && (

        <span
          className="
            absolute
            right-5
            top-5
            z-20
            rounded-full
            bg-honey-orange
            px-3
            py-1
            text-xs
            font-bold
            text-white
          "
        >
          -{product.offer}%
        </span>

      )}


      {/* ================================================================== */}
      {/* WISHLIST                                                            */}
      {/* ================================================================== */}

      <motion.button
        type="button"
        onClick={
          handleWishlist
        }
        whileTap={{
          scale: 0.85,
        }}
        aria-label={
          wishlisted
            ? `Remove ${product.name} from wishlist`
            : `Add ${product.name} to wishlist`
        }
        aria-pressed={
          wishlisted
        }
        className="
          absolute
          right-5
          top-14
          z-30
          flex
          size-10
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-md
          transition
          hover:scale-110
        "
      >

        <Heart
          size={18}
          className={
            wishlisted
              ? "fill-honey-orange text-honey-orange"
              : "text-black/60"
          }
        />

      </motion.button>


      {/* ================================================================== */}
      {/* PRODUCT                                                             */}
      {/* ================================================================== */}

      <Link
        href={`/shop/${product.id}`}
        className="block"
      >

        {/* Image */}

        <motion.div
          whileHover={{
            scale: 1.05,
            rotate: -4,
          }}
          transition={{
            type: "spring",
            stiffness: 250,
          }}
        >

          <StickerImage
            product={product}
          />

        </motion.div>


        {/* Details */}

        <div className="mt-5">

          {/* Category */}

          <span
            className="
              inline-flex
              rounded-full
              bg-hive-yellow
              px-3
              py-1
              text-xs
              font-bold
            "
          >
            {product.category}
          </span>


          {/* Name */}

          <h3
            className="
              mt-3
              text-xl
              font-bold
              text-ink
            "
          >
            {product.name}
          </h3>


          {/* Rating */}

          <div
            className="
              mt-3
              flex
              items-center
              gap-1
            "
          >

            <Star
              size={15}
              className="
                fill-honey-orange
                text-honey-orange
              "
            />

            <span
              className="
                text-sm
                font-semibold
              "
            >
              {product.rating}
            </span>

          </div>


          {/* Price */}

          <div className="mt-5">

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-black/40
              "
            >
              Starting from
            </p>


            <p
              className="
                text-2xl
                font-extrabold
              "
            >
              ₹{price}
            </p>

          </div>

        </div>

      </Link>


      {/* ================================================================== */}
      {/* QUICK ADD                                                           */}
      {/* ================================================================== */}

      <motion.button
        type="button"
        onClick={
          handleAdd
        }
        whileTap={{
          scale: 0.9,
        }}
        aria-label={
          added
            ? `Added ${product.name} to cart`
            : `Add ${product.name} to cart`
        }
        className={`
          absolute
          bottom-5
          right-5
          flex
          size-11
          items-center
          justify-center
          rounded-full
          transition

          ${
            added
              ? "bg-mint text-black"
              : "bg-black text-white"
          }
        `}
      >

        {added ? (

          <Check
            size={18}
          />

        ) : (

          <ShoppingBag
            size={18}
          />

        )}

      </motion.button>

    </motion.article>

  )

}