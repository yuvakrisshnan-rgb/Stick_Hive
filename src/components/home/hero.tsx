"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import Counter from "@/components/animations/counter";
import BackgroundEffects from "@/components/animations/background-effects";

import { useMousePosition } from "@/hooks/use-mouse-position";

import PremiumButton from "@/components/ui/premium-button";

import { PRODUCTS } from "@/lib/product-data";

import { StickerImage } from "@/components/shop/sticker-image";


// ============================================================================
// COLLAGE PRODUCTS — pick 4 real products to feature, scattered like
// stickers on a desk rather than a single generic placeholder shape
// ============================================================================

const COLLAGE_PRODUCTS = PRODUCTS.filter(
  (product) => product.inStock,
).slice(0, 4);


export default function Hero() {
  const mouse = useMousePosition();
  const shouldReduceMotion = useReducedMotion();

  const moveX = shouldReduceMotion ? 0 : (mouse.x - 500) / 40;
  const moveY = shouldReduceMotion ? 0 : (mouse.y - 400) / 40;

  const collagePositions = [
    { top: "6%", left: "8%", rotate: -10, size: "size-32 md:size-40" },
    { top: "10%", right: "10%", rotate: 8, size: "size-40 md:size-52" },
    { bottom: "16%", left: "4%", rotate: 6, size: "size-36 md:size-44" },
    { bottom: "6%", right: "6%", rotate: -6, size: "size-28 md:size-36" },
  ];

  return (
    <section
      className="
        relative
        min-h-screen
        overflow-hidden
        px-6
        pb-20
        pt-44
      "
    >
      {/* ======================================================
          ANIMATED BACKGROUND
      ====================================================== */}

      <BackgroundEffects />

      {/* ======================================================
          MAIN HERO CONTAINER
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          max-w-7xl
          items-center
          gap-16
          lg:grid-cols-2
        "
      >
        {/* ====================================================
            LEFT CONTENT
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            ease: "easeOut",
          }}
        >
          {/* ==================================================
              BADGE
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.55,
              delay: shouldReduceMotion ? 0 : 0.1,
              ease: "easeOut",
            }}
            className="
              mb-6
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-black/10
              bg-white
              px-5
              py-2
              text-sm
              font-semibold
              shadow-sm
              transition-transform
              duration-300
              hover:-translate-y-0.5
            "
          >
            <Sparkles
              size={18}
              className="text-honey-orange"
            />

            Premium Custom Stickers
          </motion.div>

          {/* ==================================================
              HEADING — serif italic accent on the emphasis line,
              matching the About page's editorial treatment
          ================================================== */}

          <motion.h1
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.65,
              delay: shouldReduceMotion ? 0 : 0.2,
              ease: "easeOut",
            }}
            className="
              font-display
              text-6xl
              font-extrabold
              leading-[1]
              tracking-tight
              md:text-7xl
              lg:text-[84px]
            "
          >
            Make your

            <span
              className="
                block
                font-serif
                font-medium
                italic
                text-honey-orange
              "
            >
              ideas stick.
            </span>
          </motion.h1>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <motion.p
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : 0.3,
              ease: "easeOut",
            }}
            className="
              mt-7
              max-w-xl
              text-lg
              leading-relaxed
              text-gray-600
            "
          >
            Create premium custom stickers that bring your
            personality, brands and ideas to life.

            Designed for creators, businesses and dreamers.
          </motion.p>

          {/* ==================================================
              CTA BUTTONS
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : 0.4,
              ease: "easeOut",
            }}
            className="
              mt-9
              flex
              flex-wrap
              gap-4
            "
          >
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.98,
                    }
              }
              transition={{
                duration: 0.2,
              }}
            >
              <Link href="/custom-sticker">
                <PremiumButton showArrow>
                  Create Your Sticker
                </PremiumButton>
              </Link>
            </motion.div>

            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.98,
                    }
              }
              transition={{
                duration: 0.2,
              }}
            >
              <Link
                href="/shop"
                className="group inline-flex"
              >
                <PremiumButton variant="secondary">
                  <span className="flex items-center gap-2">
                    Explore Collection

                    <ArrowRight
                      size={17}
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </span>
                </PremiumButton>
              </Link>
            </motion.div>
          </motion.div>

          {/* ==================================================
              STATS
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : 0.5,
              ease: "easeOut",
            }}
            className="
              mt-12
              flex
              gap-12
            "
          >
            <div>
              <h3
                className="
                  text-3xl
                  font-bold
                "
              >
                <Counter
                  value={10000}
                  suffix="+"
                />
              </h3>

              <p className="text-gray-500">
                Stickers Created
              </p>
            </div>

            <div>
              <h3
                className="
                  text-3xl
                  font-bold
                "
              >
                <Counter
                  value={100}
                  suffix="%"
                />
              </h3>

              <p className="text-gray-500">
                Custom Designs
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ====================================================
            RIGHT VISUAL — real sticker collage, scattered like
            stickers on a desk, instead of a text-in-circle
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.95,
            x: shouldReduceMotion ? 0 : 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.8,
            delay: shouldReduceMotion ? 0 : 0.15,
            ease: "easeOut",
          }}
          className="
            relative
            flex
            justify-center
          "
        >
          <div
            className="
              relative
              flex
              h-[520px]
              w-full
              max-w-lg
              items-center
              justify-center
              overflow-hidden
              rounded-[40px]
              bg-white
              shadow-[0_30px_80px_rgba(0,0,0,0.12)]
            "
          >
            {/* =================================================
                SOFT BACKGROUND DECORATION
            ================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                -left-20
                -top-20
                size-52
                rounded-full
                bg-hive-yellow/15
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-20
                -right-20
                size-56
                rounded-full
                bg-mint/20
                blur-3xl
              "
            />

            {/* =================================================
                CENTER BEE — small, brand touchpoint, not the
                whole visual anymore
            ================================================= */}

            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [-6, 6, -6],
                      rotate: [-4, 4, -4],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              className="
                relative
                z-10
                flex
                size-16
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
                text-3xl
                shadow-lg
              "
            >
              🐝
            </motion.div>

            {/* =================================================
                STICKER COLLAGE — real product images, scattered
                and rotated like stickers on a desk
            ================================================= */}

            {COLLAGE_PRODUCTS.map((product, index) => {
              const position = collagePositions[index];

              return (
                <motion.div
                  key={product.id}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: [-8, 8, -8],
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : {
                          duration: 4 + index * 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.4,
                        }
                  }
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : { scale: 1.08, rotate: 0 }
                  }
                  style={{
                    top: position.top,
                    left: position.left,
                    right: position.right,
                    bottom: position.bottom,
                    rotate: position.rotate,
                  }}
                  className={`
                    absolute
                    ${position.size}
                    overflow-hidden
                    rounded-[20px]
                    border-4
                    border-white
                    bg-white
                    shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)]
                  `}
                >
                  <StickerImage product={product} />
                </motion.div>
              );
            })}

            {/* =================================================
                SMALL DECORATIVE DOTS
            ================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                bottom-16
                right-16
                size-3
                rounded-full
                bg-honey-orange
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                left-24
                top-28
                size-2
                rounded-full
                bg-mint
              "
            />
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          SCROLL HINT
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.6,
          delay: shouldReduceMotion ? 0 : 1.1,
          ease: "easeOut",
        }}
        className="
          absolute
          bottom-6
          left-1/2
          hidden
          -translate-x-1/2
          flex-col
          items-center
          gap-1
          text-black/35
          md:flex
        "
      >
        <span
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.2em]
          "
        >
          Scroll
        </span>

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, 4, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <ArrowRight
            size={14}
            className="rotate-90"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}