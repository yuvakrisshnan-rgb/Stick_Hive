"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Sparkles,
} from "lucide-react";


/* ============================================================
   TYPES
============================================================ */

type ScrollDirection = "up" | "down";

type BeeDirection = "left" | "right";


/* ============================================================
   JOURNEY CONTENT
============================================================ */

const journey = [
  {
    number: "01",
    title: "It started in a classroom",
    text:
      "It all started with a simple classroom activity. We were asked to come up with a business idea, and after plenty of brainstorming, discussions and a few wild ideas, StickHive was born.",
  },

  {
    number: "02",
    title: "An idea started to stick",
    text:
      "We wanted to create something that felt personal. Stickers became our way of turning emotions, interests and personalities into something people could carry with them every day.",
  },

  {
    number: "03",
    title: "Students building something real",
    text:
      "We didn't have everything figured out. We were students learning as we went — experimenting with designs, understanding customers, figuring out branding and discovering what it really takes to turn an idea into something real.",
  },

  {
    number: "04",
    title: "From our idea to yours",
    text:
      "What started as a classroom project became something we wanted to take seriously. StickHive is our attempt to build a brand that feels young, creative and relatable — one sticker at a time.",
  },
];


/* ============================================================
   ABOUT PAGE
============================================================ */

export default function AboutPage() {

  /* ==========================================================
     REFERENCES
  ========================================================== */

  const timelineRef =
    useRef<HTMLDivElement | null>(null);

  const pathRef =
    useRef<SVGPathElement | null>(null);

  const animationFrameRef =
    useRef<number | null>(null);

  const lastScrollY =
    useRef(0);

  const lastProgress =
    useRef(-1);

  const lastDirection =
    useRef<ScrollDirection>("down");


  /* ==========================================================
     BEE STATE
  ========================================================== */

  const [
    beePosition,
    setBeePosition,
  ] = useState({
    x: 100,
    y: 70,
  });


  const [
    beeDirection,
    setBeeDirection,
  ] = useState<BeeDirection>("right");


  /* ==========================================================
     SCROLL DIRECTION
  ========================================================== */

  useEffect(() => {

    lastScrollY.current =
      window.scrollY;


    const handleScroll = () => {

      const currentScrollY =
        window.scrollY;


      if (
        currentScrollY >
        lastScrollY.current
      ) {

        lastDirection.current =
          "down";

      } else if (
        currentScrollY <
        lastScrollY.current
      ) {

        lastDirection.current =
          "up";

      }


      lastScrollY.current =
        currentScrollY;

    };


    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );


    return () => {

      window.removeEventListener(
        "scroll",
        handleScroll,
      );

    };

  }, []);


  /* ==========================================================
     BEE SCROLL POSITION
  ========================================================== */

  useEffect(() => {

    const updateBee = () => {

      const timeline =
        timelineRef.current;

      const path =
        pathRef.current;


      if (
        !timeline ||
        !path
      ) {

        animationFrameRef.current =
          requestAnimationFrame(
            updateBee,
          );

        return;

      }


      /* ------------------------------------------------------
         TIMELINE POSITION
      ------------------------------------------------------ */

      const rect =
        timeline.getBoundingClientRect();


      const sectionTop =
        rect.top +
        window.scrollY;


      const sectionHeight =
        rect.height;


      /* ------------------------------------------------------
         VIEWPORT POSITION
      ------------------------------------------------------ */

      const viewportFocus =
        window.scrollY +
        window.innerHeight *
          0.42;


      const start =
        sectionTop -
        window.innerHeight *
          0.05;


      const end =
        sectionTop +
        sectionHeight -
        window.innerHeight *
          0.35;


      const distance =
        end - start;


      let progress = 0;


      if (distance > 0) {

        progress =
          (viewportFocus - start) /
          distance;

      }


      progress =
        Math.max(
          0,
          Math.min(
            1,
            progress,
          ),
        );


      /* ------------------------------------------------------
         BEE DIRECTION
      ------------------------------------------------------ */

      const direction =
        lastDirection.current;


      setBeeDirection(
        direction === "down"
          ? "right"
          : "left",
      );


      /* ------------------------------------------------------
         SMALL UPDATE THRESHOLD
      ------------------------------------------------------ */

      if (
        Math.abs(
          progress -
            lastProgress.current,
        ) < 0.0003
      ) {

        animationFrameRef.current =
          requestAnimationFrame(
            updateBee,
          );

        return;

      }


      lastProgress.current =
        progress;


      /* ------------------------------------------------------
         PATH POSITION
      ------------------------------------------------------ */

      const totalLength =
        path.getTotalLength();


      const point =
        path.getPointAtLength(
          totalLength *
            progress,
        );


      setBeePosition({
        x: point.x,
        y: point.y,
      });


      animationFrameRef.current =
        requestAnimationFrame(
          updateBee,
        );

    };


    animationFrameRef.current =
      requestAnimationFrame(
        updateBee,
      );


    return () => {

      if (
        animationFrameRef.current !==
        null
      ) {

        cancelAnimationFrame(
          animationFrameRef.current,
        );

      }

    };

  }, []);


  /* ==========================================================
     RENDER
  ========================================================== */

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
          pb-12
          pt-28
          md:pb-14
          md:pt-32
        "
      >

        {/* Background glow */}

        <div
          className="
            pointer-events-none
            absolute
            -left-40
            top-10
            size-[360px]
            rounded-full
            bg-hive-yellow/15
            blur-3xl
          "
        />


        <div
          className="
            pointer-events-none
            absolute
            -right-40
            top-20
            size-[360px]
            rounded-full
            bg-mint/20
            blur-3xl
          "
        />


        {/* Decorative dots */}

        <div
          className="
            pointer-events-none
            absolute
            left-[9%]
            top-28
            size-3
            rounded-full
            bg-hive-yellow
          "
        />


        <div
          className="
            pointer-events-none
            absolute
            right-[13%]
            top-44
            size-2
            rounded-full
            bg-honey-orange/40
          "
        />


        <div
          className="
            pointer-events-none
            absolute
            bottom-8
            left-[18%]
            size-2
            rounded-full
            bg-black/20
          "
        />


        {/* Hero content */}

        <div
          className="
            mx-auto
            max-w-4xl
            text-center
          "
        >

          {/* Badge */}

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
              mb-5
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
              font-bold
              shadow-sm
            "
          >

            <Sparkles
              size={16}
              className="
                text-honey-orange
              "
            />

            The StickHive Story

          </motion.div>


          {/* Heading */}

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
              font-display
              text-5xl
              font-extrabold
              leading-[1]
              tracking-tight
              md:text-6xl
              lg:text-7xl
            "
          >

            From a classroom idea

            <span
              className="
                block
                text-honey-orange
              "
            >

              to something that sticks.

            </span>

          </motion.h1>


          {/* Description */}

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
              mt-6
              max-w-2xl
              text-lg
              leading-relaxed
              text-black/60
              md:text-xl
            "
          >

            What started as a simple student
            business idea became a journey
            of creativity, experimentation
            and trying to build something
            of our own.

          </motion.p>


          {/* Small story statement */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.3,
            }}
            className="
              mx-auto
              mt-8
              max-w-2xl
              rounded-[1.5rem]
              border
              border-black/8
              bg-white/70
              px-6
              py-5
              text-left
              shadow-sm
              backdrop-blur-sm
              md:px-8
            "
          >

            <p
              className="
                text-base
                leading-7
                text-black/65
                md:text-lg
              "
            >

              We didn't start with a factory,
              a big team or a perfect business
              plan. We started with a classroom,
              a few ideas and the excitement of
              trying to create something of our own.

            </p>

          </motion.div>

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

        {/* ====================================================
            SECTION INTRO
        ==================================================== */}

        <div
          className="
            relative
            z-10
            mx-auto
            mb-8
            max-w-3xl
            text-center
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
              mt-2
              text-4xl
              font-extrabold
              tracking-tight
              md:text-5xl
            "
          >

            One idea.

            <span className="text-honey-orange">
              {" "}Many steps.
            </span>

          </h2>


          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-base
              leading-7
              text-black/55
              md:text-lg
            "
          >

            We are still students, still learning
            and still figuring things out. But
            every step has made the idea feel
            a little more real.

          </p>

        </div>


        {/* ====================================================
            BACKGROUND DECORATION
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -left-32
            top-[15%]
            size-[340px]
            rounded-full
            bg-hive-yellow/10
            blur-3xl
          "
        />


        <div
          className="
            pointer-events-none
            absolute
            -right-32
            top-[55%]
            size-[340px]
            rounded-full
            bg-mint/15
            blur-3xl
          "
        />


        {/* Subtle circles */}

        <div
          className="
            pointer-events-none
            absolute
            left-[4%]
            top-[30%]
            size-20
            rounded-full
            border
            border-black/[0.04]
          "
        />


        <div
          className="
            pointer-events-none
            absolute
            right-[5%]
            top-[67%]
            size-24
            rounded-full
            border
            border-black/[0.04]
          "
        />


        {/* ====================================================
            TIMELINE
        ==================================================== */}

        <div
          ref={timelineRef}
          className="
            relative
            mx-auto
            min-h-[1180px]
            max-w-7xl
            md:min-h-[1260px]
          "
        >


          {/* ==================================================
              BEE PATH
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              hidden
              lg:block
            "
          >

            <svg
              viewBox="0 0 1200 1260"
              preserveAspectRatio="none"
              className="
                absolute
                inset-0
                h-full
                w-full
                overflow-visible
              "
              aria-hidden="true"
            >

              {/* ==============================================
                  SIMPLE BUZZING PATH
              ============================================== */}

              <path
                ref={pathRef}
                d="
                  M 90 70

                  C 230 20,
                    410 20,
                    520 100

                  C 630 180,
                    560 280,
                    400 270

                  C 270 260,
                    220 170,
                    310 110

                  C 410 45,
                    590 95,
                    700 190

                  C 820 295,
                    980 290,
                    1070 205

                  C 1130 150,
                    1080 90,
                    990 110

                  C 900 130,
                    900 230,
                    970 290

                  C 1040 350,
                    980 430,
                    870 455

                  C 730 485,
                    600 430,
                    500 355

                  C 390 275,
                    270 325,
                    280 435

                  C 290 535,
                    420 575,
                    540 525

                  C 660 475,
                    770 415,
                    890 485

                  C 1000 550,
                    1020 640,
                    935 700

                  C 835 770,
                    700 710,
                    595 645

                  C 480 575,
                    355 625,
                    365 730

                  C 375 825,
                    510 865,
                    625 810

                  C 740 755,
                    845 700,
                    945 765

                  C 1040 830,
                    1030 915,
                    940 970

                  C 835 1035,
                    705 975,
                    605 915

                  C 500 850,
                    390 900,
                    405 1000

                  C 420 1100,
                    550 1140,
                    665 1075

                  C 780 1010,
                    885 985,
                    985 1045

                  C 1060 1090,
                    1035 1160,
                    945 1195
                "
                fill="none"
                stroke="rgba(17,17,17,0.17)"
                strokeWidth="3"
                strokeDasharray="7 15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />


              {/* ==============================================
                  BEE
              ============================================== */}

              <g
                transform={`
                  translate(
                    ${beePosition.x}
                    ${beePosition.y}
                  )
                  scale(
                    ${beeDirection === "right"
                      ? 1
                      : -1}
                    1
                  )
                `}
              >

                <motion.g
                  animate={{
                    y: [
                      -2,
                      2,
                      -2,
                    ],
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >

                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="22"
                  >

                    🐝

                  </text>

                </motion.g>

              </g>

            </svg>

          </div>


          {/* ==================================================
              MOBILE BEE
          ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              z-20
              -translate-x-1/2
              lg:hidden
            "
          >

            <motion.div
              animate={{
                y: [
                  -3,
                  3,
                  -3,
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                text-2xl
              "
            >

              🐝

            </motion.div>

          </div>


          {/* ==================================================
              STORY CARDS
          ================================================== */}

          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-12
              md:gap-16
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

                      {/* ====================================
                          PHOTO HOLDER
                      ==================================== */}

                      <div
                        className="
                          group
                          relative
                          mb-5
                          aspect-[16/9]
                          overflow-hidden
                          rounded-[1.75rem]
                          border
                          border-black/10
                          bg-white
                          shadow-[0_25px_55px_-35px_rgba(0,0,0,0.35)]
                          transition-transform
                          duration-500
                          hover:-translate-y-1
                        "
                      >

                        {/* Background */}

                        <div
                          className={`
                            absolute
                            inset-0
                            ${
                              index === 0
                                ? "bg-hive-yellow/25"
                                : index === 1
                                  ? "bg-mint/25"
                                  : index === 2
                                    ? "bg-honey-orange/10"
                                    : "bg-white"
                            }
                          `}
                        />


                        {/* Decorative circle */}

                        <div
                          className="
                            absolute
                            -right-12
                            -top-12
                            size-36
                            rounded-full
                            bg-hive-yellow/20
                            transition-transform
                            duration-700
                            group-hover:scale-110
                          "
                        />


                        <div
                          className="
                            absolute
                            -bottom-14
                            -left-14
                            size-40
                            rounded-full
                            bg-mint/20
                          "
                        />


                        {/* Photo frame */}

                        <div
                          className="
                            absolute
                            inset-5
                            overflow-hidden
                            rounded-[1.25rem]
                            border-2
                            border-dashed
                            border-black/10
                            bg-white/45
                          "
                        >

                          <div
                            className="
                              absolute
                              inset-0
                              flex
                              flex-col
                              items-center
                              justify-center
                              gap-3
                              text-center
                            "
                          >

                            <div
                              className="
                                flex
                                size-14
                                items-center
                                justify-center
                                rounded-2xl
                                bg-white
                                shadow-md
                              "
                            >

                              <Camera
                                size={23}
                                className="
                                  text-black/60
                                "
                              />

                            </div>


                            <p
                              className="
                                text-sm
                                font-bold
                                text-black/55
                                md:text-base
                              "
                            >

                              Our journey —
                              moment {item.number}

                            </p>


                            <span
                              className="
                                rounded-full
                                bg-white/70
                                px-3
                                py-1
                                text-[11px]
                                font-semibold
                                text-black/40
                              "
                            >

                              Photo coming soon

                            </span>

                          </div>

                        </div>


                        {/* Chapter marker */}

                        <div
                          className="
                            absolute
                            left-7
                            top-7
                            rounded-full
                            bg-black
                            px-3
                            py-1
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.15em]
                            text-white
                          "
                        >

                          {item.number}

                        </div>

                      </div>


                      {/* ====================================
                          TEXT
                      ==================================== */}

                      <span
                        className="
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.22em]
                          text-honey-orange
                        "
                      >

                        Chapter {item.number}

                      </span>


                      <h3
                        className="
                          mt-2
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

          {/* ==================================================
              BACKGROUND DECORATION
          ================================================== */}

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
              pointer-events-none
              absolute
              -bottom-24
              -left-20
              size-64
              rounded-full
              bg-mint/10
              blur-3xl
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              right-[20%]
              top-[22%]
              size-3
              rounded-full
              bg-hive-yellow
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              bottom-[22%]
              left-[18%]
              size-2
              rounded-full
              bg-white/20
            "
          />


          {/* ==================================================
              CONTENT
          ================================================== */}

          <div
            className="
              relative
              grid
              gap-10
              lg:grid-cols-[0.8fr_1.2fr]
              lg:items-center
            "
          >

            {/* Left */}

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

              {/* Bee */}

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
                  text-4xl
                  font-extrabold
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


            {/* Right */}

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
                  leading-8
                  text-white/75
                  md:text-xl
                "
              >

                That's what we want StickHive to be —
                a place where expressing yourself feels
                simple, creative and fun.

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

                And because we're students building
                this ourselves, we're learning,
                experimenting and improving along
                the way.

              </p>


              {/* Small points */}

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

          {/* Decoration */}

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
              pointer-events-none
              absolute
              -bottom-16
              -left-16
              size-40
              rounded-full
              bg-mint/10
            "
          />


          {/* Bee */}

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


          {/* Heading */}

          <h2
            className="
              relative
              font-display
              text-3xl
              font-extrabold
              leading-tight
              md:text-4xl
            "
          >

            We're still learning.

            <br />

            We're still building.

            <br />

            <span className="text-hive-yellow">
              And we're just getting started.
            </span>

          </h2>


          {/* Description */}

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


          {/* Bottom hint */}

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