"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

import TrendingStickers from "@/components/sections/trending-stickers";
import CategoryShowcase from "@/components/sections/category-showcase";

export default function ProductSection() {
  return (
    <section
      id="products"
      className="
        relative
        overflow-hidden
      "
    >
      {/* ================================================================ */}
      {/* BACKGROUND DECORATION                                             */}
      {/* ================================================================ */}

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-20
          -z-10
          h-72
          w-72
          rounded-full
          bg-hive-yellow/30
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-10
          left-0
          -z-10
          h-60
          w-60
          rounded-full
          bg-mint/40
          blur-3xl
        "
      />

      {/* ================================================================ */}
      {/* SECTION INTRO                                                      */}
      {/* ================================================================ */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-6
          pb-8
          pt-24
          lg:px-8
        "
      >
        <motion.div
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
            amount: 0.3,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            mx-auto
            max-w-2xl
            text-center
          "
        >
          <div
            className="
              mx-auto
              mb-5
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-white
              px-5
              py-2
              text-sm
              font-bold
              shadow-sm
            "
          >
            <Sparkles
              size={16}
              className="text-honey-orange"
            />

            Trending Collection
          </div>

          <h2
            className="
              font-headline
              text-5xl
              font-extrabold
              tracking-tight
              text-ink
              md:text-6xl
            "
          >
            Stickers everyone{" "}
            <span className="text-honey-orange">
              loves.
            </span>
          </h2>

          <p
            className="
              mt-5
              text-lg
              leading-relaxed
              text-black/60
            "
          >
            Discover what&apos;s trending and explore
            sticker collections made for every kind
            of personality.
          </p>
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/* TRENDING STICKERS                                                  */}
      {/* ================================================================ */}

      <TrendingStickers />

      {/* ================================================================ */}
      {/* CATEGORY SHOWCASE                                                  */}
      {/* ================================================================ */}

      <CategoryShowcase />
    </section>
  );
}