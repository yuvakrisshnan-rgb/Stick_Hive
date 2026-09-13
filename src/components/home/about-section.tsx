"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Lightbulb,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";

const journey = [
  {
    number: "01",
    label: "THE SPARK",
    title: "It started in a classroom.",
    description:
      "It all began with a fun class activity where we were challenged to come up with a business idea. A few friends, a lot of brainstorming, and plenty of crazy ideas eventually led us to one simple concept — StickHive.",
    icon: Lightbulb,
    image: "/images/about/classroom.jpg",
    imageAlt: "The beginning of the StickHive journey",
    sticker: "Where it all began",
    side: "left",
  },
  {
    number: "02",
    label: "THE IDEA",
    title: "We wanted stickers to mean something.",
    description:
      "We started thinking beyond stickers as simple decorations. We wanted to create designs that could express emotions, personalities, interests and little moments of fun — something people could look at and instantly feel connected to.",
    icon: Sparkles,
    image: "/images/about/brainstorming.jpg",
    imageAlt: "Brainstorming the StickHive idea",
    sticker: "Think. Create. Stick.",
    side: "right",
  },
  {
    number: "03",
    label: "MAKING IT PERSONAL",
    title: "We put ourselves into the brand.",
    description:
      "As we developed StickHive, we started using our own ideas, creativity and even our own photos in the design process. It helped us create something that felt less like a product and more like a brand built by real people for real people.",
    icon: Palette,
    image: "/images/about/design-process.jpg",
    imageAlt: "Working on StickHive designs",
    sticker: "Made by us",
    side: "left",
  },
  {
    number: "04",
    label: "THE JOURNEY",
    title: "From a student project to something real.",
    description:
      "What began as a simple classroom exercise slowly became an idea we genuinely wanted to pursue. We're still students, still learning and still figuring things out — but we're taking the idea with us and seeing how far we can take it.",
    icon: Users,
    image: "/images/about/team.jpg",
    imageAlt: "The people behind StickHive",
    sticker: "Still building",
    side: "right",
  },
];

function PhotoPlaceholder({
  image,
  alt,
  sticker,
  index,
}: {
  image: string;
  alt: string;
  sticker: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
        rotate: index % 2 === 0 ? -2 : 2,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotate: index % 2 === 0 ? -2 : 2,
      }}
      whileHover={{
        rotate: 0,
        y: -6,
      }}
      viewport={{
        once: true,
        amount: 0.25,
      }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="
        group
        relative
        w-full
      "
    >
      {/* Photo frame */}

      <div
        className="
          relative
          aspect-[4/3]
          overflow-hidden
          rounded-[2rem]
          border
          border-black/10
          bg-white
          p-3
          shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)]
        "
      >
        <div
          className="
            relative
            h-full
            overflow-hidden
            rounded-[1.5rem]
            bg-[#f5eadb]
          "
        >
          <Image
            src={image}
            alt={alt}
            fill
            className="
              object-cover
              transition
              duration-700
              group-hover:scale-105
            "
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          {/* Photo overlay */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/20
              via-transparent
              to-white/10
            "
          />
        </div>
      </div>

      {/* Floating sticker label */}

      <div
        className="
          absolute
          -bottom-4
          left-6
          rounded-full
          border
          border-black/10
          bg-white
          px-4
          py-2
          text-xs
          font-bold
          shadow-lg
        "
      >
        {sticker}
      </div>
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section
      id="about"
      className="
        relative
        overflow-hidden
        bg-cream
        px-6
        py-24
        md:py-32
      "
    >
      {/* ============================================================ */}
      {/* BACKGROUND DECORATION                                        */}
      {/* ============================================================ */}

      <div
        className="
          pointer-events-none
          absolute
          -right-32
          top-32
          size-96
          rounded-full
          bg-hive-yellow/20
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          bottom-20
          size-96
          rounded-full
          bg-mint/30
          blur-3xl
        "
      />

      {/* ============================================================ */}
      {/* INTRO                                                          */}
      {/* ============================================================ */}

      <div className="relative mx-auto max-w-7xl">
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
            duration: 0.7,
          }}
          className="
            mx-auto
            max-w-4xl
            text-center
          "
        >
          {/* Label */}

          <div
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
              text-xs
              font-bold
              uppercase
              tracking-[0.18em]
              shadow-sm
            "
          >
            <Sparkles
              size={15}
              className="text-honey-orange"
            />

            About StickHive
          </div>

          {/* Heading */}

          <h2
            className="
              font-headline
              text-5xl
              font-extrabold
              leading-[0.95]
              tracking-tight
              md:text-6xl
              lg:text-7xl
            "
          >
            The story behind
            <span className="text-honey-orange">
              {" "}the hive.
            </span>
          </h2>

          {/* Intro */}

          <p
            className="
              mx-auto
              mt-7
              max-w-3xl
              text-lg
              leading-relaxed
              text-black/60
              md:text-xl
            "
          >
            What started as a fun classroom activity became an idea
            we didn't want to leave behind. StickHive is our attempt
            to turn creativity, personality and a little bit of fun
            into something people can make their own.
          </p>
        </motion.div>

        {/* ============================================================ */}
        {/* SMALL TRANSITION                                             */}
        {/* ============================================================ */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            delay: 0.3,
          }}
          className="
            mt-12
            flex
            flex-col
            items-center
            gap-3
          "
        >
          <span
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.2em]
              text-black/40
            "
          >
            Follow the journey
          </span>

          <ArrowDown
            size={18}
            className="text-honey-orange"
          />
        </motion.div>

        {/* ============================================================ */}
        {/* JOURNEY                                                       */}
        {/* ============================================================ */}

        <div className="relative mt-20 md:mt-28">
          {/* Desktop dotted path */}

          <div
            className="
              absolute
              bottom-0
              left-1/2
              top-0
              hidden
              w-px
              -translate-x-1/2
              border-l-2
              border-dashed
              border-black/15
              lg:block
            "
          />

          {/* Moving bee */}

          <motion.div
            animate={{
              y: [0, 12, 0],
              rotate: [-4, 4, -4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              absolute
              left-1/2
              top-0
              z-20
              hidden
              -translate-x-1/2
              lg:flex
            "
          >
            <div
              className="
                flex
                size-12
                items-center
                justify-center
                rounded-full
                border-4
                border-cream
                bg-hive-yellow
                text-xl
                shadow-lg
              "
            >
              🐝
            </div>
          </motion.div>

          {/* Journey Items */}

          <div className="space-y-24 md:space-y-32">
            {journey.map((item, index) => {
              const Icon = item.icon;
              const isLeft = item.side === "left";

              return (
                <div
                  key={item.number}
                  className="
                    relative
                    grid
                    items-center
                    gap-12
                    lg:grid-cols-2
                    lg:gap-24
                  "
                >
                  {/* ================================================= */}
                  {/* LEFT SIDE                                           */}
                  {/* ================================================= */}

                  <div
                    className={`
                      ${
                        isLeft
                          ? "lg:pr-8"
                          : "lg:order-2 lg:pl-8"
                      }
                    `}
                  >
                    <PhotoPlaceholder
                      image={item.image}
                      alt={item.imageAlt}
                      sticker={item.sticker}
                      index={index}
                    />
                  </div>

                  {/* ================================================= */}
                  {/* CENTER MARKER                                       */}
                  {/* ================================================= */}

                  <div
                    className="
                      absolute
                      left-0
                      top-0
                      hidden
                      lg:left-1/2
                      lg:flex
                      lg:-translate-x-1/2
                    "
                  >
                    <div
                      className="
                        flex
                        size-9
                        items-center
                        justify-center
                        rounded-full
                        border-4
                        border-cream
                        bg-black
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* ================================================= */}
                  {/* RIGHT / STORY SIDE                                  */}
                  {/* ================================================= */}

                  <motion.div
                    initial={{
                      opacity: 0,
                      x: isLeft ? 30 : -30,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.25,
                    }}
                    transition={{
                      duration: 0.7,
                    }}
                    className={`
                      ${
                        isLeft
                          ? "lg:pl-8"
                          : "lg:order-1 lg:pr-8"
                      }
                    `}
                  >
                    {/* Number + icon */}

                    <div
                      className="
                        mb-5
                        flex
                        items-center
                        gap-4
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-black
                          tracking-[0.2em]
                          text-honey-orange
                        "
                      >
                        {item.number}
                      </span>

                      <div
                        className="
                          flex
                          size-10
                          items-center
                          justify-center
                          rounded-xl
                          bg-white
                          shadow-sm
                        "
                      >
                        <Icon
                          size={18}
                          className="text-honey-orange"
                        />
                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          uppercase
                          tracking-[0.18em]
                          text-black/40
                        "
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Title */}

                    <h3
                      className="
                        max-w-xl
                        text-3xl
                        font-extrabold
                        leading-tight
                        tracking-tight
                        md:text-4xl
                      "
                    >
                      {item.title}
                    </h3>

                    {/* Description */}

                    <p
                      className="
                        mt-5
                        max-w-xl
                        text-base
                        leading-8
                        text-black/60
                        md:text-lg
                      "
                    >
                      {item.description}
                    </p>

                    {/* Tiny detail */}

                    <div
                      className="
                        mt-7
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-black/50
                      "
                    >
                      <span
                        className="
                          size-2
                          rounded-full
                          bg-hive-yellow
                        "
                      />

                      One step at a time.
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* FINAL STATEMENT                                               */}
        {/* ============================================================ */}

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
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
            duration: 0.8,
          }}
          className="
            relative
            mx-auto
            mt-28
            max-w-4xl
            overflow-hidden
            rounded-[2.5rem]
            bg-black
            px-8
            py-14
            text-center
            text-white
            shadow-[0_30px_80px_-35px_rgba(0,0,0,0.5)]
            md:px-16
            md:py-20
          "
        >
          {/* Decorative circles */}

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              size-40
              rounded-full
              bg-hive-yellow
              opacity-20
              blur-2xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-20
              -left-10
              size-48
              rounded-full
              bg-honey-orange
              opacity-20
              blur-3xl
            "
          />

          {/* Bee */}

          <motion.div
            animate={{
              y: [-5, 5, -5],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              relative
              mx-auto
              mb-7
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
          </motion.div>

          {/* Heading */}

          <h3
            className="
              relative
              font-headline
              text-4xl
              font-extrabold
              tracking-tight
              md:text-5xl
            "
          >
            We're still learning.
            <br />

            <span className="text-hive-yellow">
              We're still building.
            </span>
          </h3>

          {/* Copy */}

          <p
            className="
              relative
              mx-auto
              mt-6
              max-w-2xl
              text-base
              leading-7
              text-white/65
              md:text-lg
            "
          >
            We started with an idea in a classroom. Now we're
            giving that idea a chance to become something real.
            And we're excited to see where the journey takes us.
          </p>

          {/* Closing */}

          <div
            className="
              relative
              mt-9
              inline-flex
              items-center
              gap-3
              text-sm
              font-bold
              uppercase
              tracking-[0.18em]
              text-white
            "
          >
            Make it yours.

            <ArrowRight
              size={18}
              className="text-hive-yellow"
            />

            Make it stick.
          </div>
        </motion.div>
      </div>
    </section>
  );
}