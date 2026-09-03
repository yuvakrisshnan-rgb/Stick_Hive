"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import FloatingSticker from "@/components/animations/floating-sticker";
import Counter from "@/components/animations/counter";
import BackgroundEffects from "@/components/animations/background-effects";

import { useMousePosition } from "@/hooks/use-mouse-position";

import PremiumButton from "@/components/ui/premium-button";

export default function Hero() {
  const mouse = useMousePosition();
  const shouldReduceMotion = useReducedMotion();

  /*
   * Mouse movement is intentionally subtle.
   * When reduced motion is enabled, everything stays still.
   */
  const moveX = shouldReduceMotion ? 0 : (mouse.x - 500) / 40;
  const moveY = shouldReduceMotion ? 0 : (mouse.y - 400) / 40;

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
              HEADING
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
            {/* =================================================
                PRIMARY CTA
            ================================================= */}

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

            {/* =================================================
                SECONDARY CTA
            ================================================= */}

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
            {/* =================================================
                STICKERS CREATED
            ================================================= */}

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

            {/* =================================================
                CUSTOM DESIGNS
            ================================================= */}

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
            RIGHT VISUAL
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
          {/* ==================================================
              VISUAL CARD
          ================================================== */}

          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    y: [-5, 5, -5],
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
                MAIN STICKER
            ================================================= */}

            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [-10, 10, -10],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.03,
                    }
              }
              className="
                relative
                z-10
                flex
                size-64
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
                text-center
                text-5xl
                font-black
                leading-none
                shadow-xl
              "
            >
              <span>
                STICK
                <br />
                HIVE
              </span>
            </motion.div>

            {/* =================================================
                FLOATING STICKER 1
            ================================================= */}

            <FloatingSticker
              delay={0}
              rotate={12}
              x={moveX * -1}
              y={moveY * -1}
              className="
                absolute
                left-10
                top-10
                rounded-2xl
                bg-white
                p-5
                text-3xl
                shadow-lg
              "
            >
              ✨
            </FloatingSticker>

            {/* =================================================
                FLOATING STICKER 2
            ================================================= */}

            <FloatingSticker
              delay={1}
              rotate={-12}
              x={moveX}
              y={moveY}
              className="
                absolute
                right-10
                top-20
                rounded-2xl
                bg-white
                p-5
                text-3xl
                shadow-lg
              "
            >
              🐝
            </FloatingSticker>

            {/* =================================================
                FLOATING STICKER 3
            ================================================= */}

            <FloatingSticker
              delay={0.5}
              rotate={8}
              x={moveX * 0.5}
              y={moveY * 0.5}
              className="
                absolute
                bottom-14
                left-20
                rounded-2xl
                bg-white
                p-5
                text-3xl
                shadow-lg
              "
            >
              ⭐
            </FloatingSticker>

            {/* =================================================
                SMALL DECORATIVE DOT
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
          </motion.div>
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