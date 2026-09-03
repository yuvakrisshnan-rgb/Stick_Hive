"use client"

import { motion } from "motion/react"


// ============================================================================
// PRODUCT CARD SKELETON
// ============================================================================

export function ProductCardSkeleton({
  index = 0,
}: {
  index?: number
}) {

  return (

    <motion.article
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
      }}
      className="
        relative
        overflow-hidden
        rounded-[2rem]
        border
        border-black/5
        bg-white
        p-5
        shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)]
      "
    >

      {/* ================================================================
          SHIMMER
      ================================================================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-10
          -translate-x-full
          animate-[skeleton-shimmer_1.8s_infinite]
          bg-gradient-to-r
          from-transparent
          via-white/70
          to-transparent
        "
      />


      {/* ================================================================
          IMAGE PLACEHOLDER
      ================================================================= */}

      <div
        className="
          flex
          aspect-square
          w-full
          items-center
          justify-center
          overflow-hidden
          rounded-[1.5rem]
          bg-black/[0.055]
        "
      >

        <div
          className="
            size-36
            rounded-full
            bg-black/[0.07]
            sm:size-40
          "
        />

      </div>


      {/* ================================================================
          CATEGORY PLACEHOLDER
      ================================================================= */}

      <div
        className="
          mt-5
          h-6
          w-20
          rounded-full
          bg-black/[0.06]
        "
      />


      {/* ================================================================
          PRODUCT NAME
      ================================================================= */}

      <div
        className="
          mt-3
          space-y-2
        "
      >

        <div
          className="
            h-6
            w-4/5
            rounded-lg
            bg-black/[0.07]
          "
        />

        <div
          className="
            h-6
            w-3/5
            rounded-lg
            bg-black/[0.055]
          "
        />

      </div>


      {/* ================================================================
          RATING
      ================================================================= */}

      <div
        className="
          mt-3
          flex
          items-center
          gap-2
        "
      >

        <div
          className="
            size-4
            rounded-full
            bg-black/[0.07]
          "
        />

        <div
          className="
            h-4
            w-8
            rounded
            bg-black/[0.055]
          "
        />

      </div>


      {/* ================================================================
          PRICE
      ================================================================= */}

      <div
        className="
          mt-5
        "
      >

        <div
          className="
            h-3
            w-24
            rounded
            bg-black/[0.05]
          "
        />

        <div
          className="
            mt-2
            h-8
            w-20
            rounded-lg
            bg-black/[0.08]
          "
        />

      </div>


      {/* ================================================================
          QUICK ADD PLACEHOLDER
      ================================================================= */}

      <div
        className="
          absolute
          bottom-5
          right-5
          size-11
          rounded-full
          bg-black/[0.07]
        "
      />

    </motion.article>

  )

}