"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";

import BuzzingBees from "@/components/about/buzzing-bees";


/* ============================================================
   JOURNEY CONTENT
============================================================ */

const journey = [
  {
    number: "01",
    title: "It started in a classroom",
    text:
      "It all started with a simple classroom activity. We were asked to come up with a business idea, and after plenty of brainstorming, discussions and a few wild ideas, StickHive was born.",
    tone: "bg-hive-yellow/18",
  },

  {
    number: "02",
    title: "An idea started to stick",
    text:
      "We wanted to create something that felt personal. Stickers became our way of turning emotions, interests and personalities into something people could carry with them every day.",
    tone: "bg-mint/25",
  },

  {
    number: "03",
    title: "Students building something real",
    text:
      "We didn't have everything figured out. We were students learning as we went — experimenting with designs, understanding customers, figuring out branding and discovering what it really takes to turn an idea into something real.",
    tone: "bg-honey-orange/12",
  },

  {
    number: "04",
    title: "From our idea to yours",
    text:
      "What started as a classroom project became something we wanted to take seriously. StickHive is our attempt to build a brand that feels young, creative and relatable — one sticker at a time.",
    tone: "bg-black/[0.04]",
  },
];


/* ============================================================
   ABOUT PAGE
============================================================ */

export default function AboutPage() {

  return (

    <main
      className="
        min-h-screen
        overflow-hidden
        bg-cream
        text-foreground
      "
    >


      {/* ======================================================
          HERO / OUR STORY
      ====================================================== */}

      <section
        id="story"
        className="
          relative
          overflow-hidden
          scroll-mt-24
          px-6
          pb-14
          pt-28
          md:pb-16
          md:pt-32
        "
      >

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            size-[520px]
            -translate-x-1/2
            rounded-full
            bg-hive-yellow/12
            blur-[100px]
          "
        />


        <div
          className="
            relative
            mx-auto
            max-w-4xl
            text-center
          "
        >

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
            className="
              mx-auto
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
              text-xs
              font-bold
              uppercase
              tracking-[0.18em]
              shadow-sm
            "
          >

            <Sparkles
              size={14}
              className="text-honey-orange"
            />

            The StickHive Story

          </motion.div>


          <motion.h1
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
            className="
              font-serif
              text-[2.75rem]
              font-medium
              italic
              leading-[1.08]
              tracking-tight
              text-foreground
              md:text-6xl
              lg:text-7xl
            "
          >

            From a classroom idea

            <span
              className="
                block
                not-italic
                text-honey-orange
              "
            >

              to something that sticks.

            </span>

          </motion.h1>


          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="
              mx-auto
              mt-7
              max-w-xl
              text-lg
              leading-relaxed
              text-black/55
              md:text-xl
            "
          >

            We didn't start with a factory, a big team
            or a perfect plan. We started with a classroom,
            a few ideas and the will to try.

          </motion.p>

        </div>

      </section>


      {/* ======================================================
          JOURNEY
      ====================================================== */}

      <section
        id="journey"
        className="
          relative
          scroll-mt-24
          px-6
          pb-14
          md:pb-16
        "
      >

        <div
          className="
            relative
            z-10
            mx-auto
            mb-14
            max-w-3xl
            text-center
            md:mb-20
          "
        >

          <span
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.22em]
              text-honey-orange
            "
          >

            Our Journey

          </span>


          <h2
            className="
              mt-3
              font-serif
              text-4xl
              font-medium
              italic
              tracking-tight
              text-foreground
              md:text-5xl
            "
          >

            One idea.
            <span className="text-honey-orange"> Many steps.</span>

          </h2>

        </div>


        {/* ====================================================
            TIMELINE — ambient buzzing bees wander the
            background, story cards sit above them
        ==================================================== */}

        <div
          className="
            relative
            mx-auto
            max-w-7xl
          "
        >

          <BuzzingBees />


          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-14
              md:gap-20
            "
          >

            {journey.map(
              (item, index) => {

                const isEven =
                  index % 2 === 0;


                return (

                  <motion.article
                    key={item.number}
                    initial={{
                      opacity: 0,
                      y: 35,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      margin: "-70px",
                    }}
                    transition={{
                      duration: 0.6,
                    }}
                    className={`
                      flex
                      w-full
                      ${
                        isEven
                          ? "lg:justify-start"
                          : "lg:justify-end"
                      }
                    `}
                  >

                    <div
                      className="
                        w-full
                        max-w-[500px]
                      "
                    >

                      <div
                        className={`
                          group
                          relative
                          mb-6
                          aspect-[16/10]
                          overflow-hidden
                          rounded-[1.75rem]
                          ${item.tone}
                          shadow-[0_25px_55px_-35px_rgba(0,0,0,0.3)]
                          transition-transform
                          duration-500
                          hover:-translate-y-1
                        `}
                      >

                        <div
                          className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                          "
                        >

                          <span
                            className="
                              font-serif
                              text-[7rem]
                              font-medium
                              italic
                              leading-none
                              text-black/[0.08]
                            "
                          >

                            {item.number}

                          </span>

                        </div>


                        <div
                          className="
                            absolute
                            left-7
                            top-6
                            text-xs
                            font-black
                            uppercase
                            tracking-[0.2em]
                            text-black/35
                          "
                        >

                          Chapter {item.number}

                        </div>

                      </div>


                      <h3
                        className="
                          text-3xl
                          font-extrabold
                          leading-tight
                          tracking-tight
                          text-foreground
                          md:text-4xl
                        "
                      >

                        {item.title}

                      </h3>


                      <p
                        className="
                          mt-4
                          max-w-lg
                          text-base
                          leading-7
                          text-black/60
                          md:text-lg
                          md:leading-8
                        "
                      >

                        {item.text}

                      </p>

                    </div>

                  </motion.article>

                );

              },
            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          WHY STICKHIVE
      ====================================================== */}

      <section
        id="why-stickhive"
        className="
          scroll-mt-24
          px-6
          pb-16
          pt-4
          md:pb-20
        "
      >

        <div
          className="
            relative
            mx-auto
            max-w-6xl
            overflow-hidden
            rounded-[2.5rem]
            bg-[#123F3A]
            px-7
            py-10
            text-white
            shadow-[0_30px_80px_-40px_rgba(0,0,0,0.4)]
            md:px-12
            md:py-14
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              size-56
              rounded-full
              bg-hive-yellow/10
              blur-2xl
            "
          />


          <div
            className="
              relative
              grid
              gap-10
              lg:grid-cols-[0.8fr_1.2fr]
              lg:items-center
            "
          >

            <motion.div
              initial={{
                opacity: 0,
                x: -25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                margin: "-80px",
              }}
              transition={{
                duration: 0.6,
              }}
            >

              <div
                className="
                  mb-6
                  flex
                  size-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-hive-yellow
                  text-3xl
                  shadow-lg
                "
              >

                🐝

              </div>


              <span
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.22em]
                  text-hive-yellow
                "
              >

                Why StickHive?

              </span>


              <h2
                className="
                  mt-3
                  font-serif
                  text-4xl
                  font-medium
                  italic
                  leading-tight
                  tracking-tight
                  md:text-5xl
                "
              >

                Small things can carry

                <span
                  className="
                    block
                    text-hive-yellow
                  "
                >
                  big personality.
                </span>

              </h2>

            </motion.div>


            <motion.div
              initial={{
                opacity: 0,
                x: 25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                margin: "-80px",
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
              className="
                max-w-2xl
              "
            >

              <p
                className="
                  text-lg
                  leading-8
                  text-white/75
                  md:text-xl
                "
              >

                A sticker can be a mood, a memory,
                an inside joke, a fandom, something
                you love or simply something that
                makes you smile.

              </p>


              <p
                className="
                  mt-5
                  text-lg
                  font-semibold
                  leading-8
                  text-white
                  md:text-xl
                "
              >

                That's what we want StickHive to be —
                a place where expressing yourself feels
                simple, creative and fun.

              </p>


              <div
                className="
                  mt-7
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    px-4
                    py-4
                  "
                >

                  <p
                    className="
                      text-sm
                      font-bold
                      text-hive-yellow
                    "
                  >
                    PERSONAL
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-white/50
                    "
                  >
                    Made to express who you are.
                  </p>

                </div>


                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    px-4
                    py-4
                  "
                >

                  <p
                    className="
                      text-sm
                      font-bold
                      text-hive-yellow
                    "
                  >
                    CREATIVE
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-white/50
                    "
                  >
                    Ideas turned into something real.
                  </p>

                </div>


                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    px-4
                    py-4
                  "
                >

                  <p
                    className="
                      text-sm
                      font-bold
                      text-hive-yellow
                    "
                  >
                    STUDENT-BUILT
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-white/50
                    "
                  >
                    Learning while building.
                  </p>

                </div>

              </div>

            </motion.div>

          </div>

        </div>

      </section>


      {/* ======================================================
          CLOSING
      ====================================================== */}

      <section
        className="
          px-6
          pb-16
          md:pb-20
        "
      >

        <motion.div
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
            margin: "-60px",
          }}
          transition={{
            duration: 0.6,
          }}
          className="
            relative
            mx-auto
            max-w-3xl
            overflow-hidden
            rounded-[2.25rem]
            bg-foreground
            px-7
            py-9
            text-center
            text-white
            shadow-[0_30px_70px_-35px_rgba(0,0,0,0.45)]
            md:px-12
            md:py-11
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              size-40
              rounded-full
              bg-hive-yellow/10
            "
          />


          <div
            className="
              relative
              mx-auto
              mb-5
              flex
              size-14
              items-center
              justify-center
              rounded-full
              bg-hive-yellow
              text-2xl
            "
          >

            🐝

          </div>


          <h2
            className="
              relative
              font-serif
              text-3xl
              font-medium
              italic
              leading-tight
              md:text-4xl
            "
          >

            We're still learning.

            <br />

            We're still building.

            <br />

            <span className="not-italic text-hive-yellow">
              And we're just getting started.
            </span>

          </h2>


          <p
            className="
              relative
              mx-auto
              mt-5
              max-w-xl
              text-base
              leading-7
              text-white/65
              md:text-lg
            "
          >

            StickHive is our little attempt
            to turn an idea from a classroom
            into something that brings more
            personality, creativity and fun
            into everyday life.

          </p>


          <div
            className="
              relative
              mt-7
              flex
              items-center
              justify-center
              gap-2
              text-sm
              font-bold
              text-hive-yellow
            "
          >

            Keep exploring

            <ArrowRight
              size={16}
            />

          </div>

        </motion.div>

      </section>

    </main>

  );
}