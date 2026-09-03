"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  PackageCheck,
  RefreshCcw,
  Sparkles,
} from "lucide-react";


const returnSteps = [
  {
    number: "01",
    title: "Get in touch",
    description:
      "Contact the StickHive team as soon as you notice an issue with your order.",
  },
  {
    number: "02",
    title: "Share the details",
    description:
      "Tell us what happened and provide your order details and any relevant photos.",
  },
  {
    number: "03",
    title: "We review it",
    description:
      "Our team will review the situation and let you know what we can do to help.",
  },
  {
    number: "04",
    title: "Resolution",
    description:
      "Depending on the situation, we may arrange a replacement, refund or another suitable resolution.",
  },
];


const returnCards = [
  {
    icon: PackageCheck,
    title: "Damaged order",
    description:
      "If your stickers arrive damaged, please contact us promptly and include photographs of the affected products and packaging.",
  },
  {
    icon: RefreshCcw,
    title: "Wrong item",
    description:
      "If you received an item that doesn't match your order, get in touch with your order details so we can investigate.",
  },
  {
    icon: CircleAlert,
    title: "Something isn't right?",
    description:
      "If there's another issue with your order, don't worry. Reach out to us and we'll review the situation with you.",
  },
];


export default function ReturnsPage() {
  return (
    <main
      className="
        min-h-screen
        overflow-hidden
        bg-cream
        px-6
        pb-24
        pt-36
      "
    >

      {/* =====================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-40
          size-80
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
          top-[50%]
          size-80
          rounded-full
          bg-mint/15
          blur-3xl
        "
      />


      {/* =====================================================
          HEADER
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          max-w-6xl
        "
      >

        <Link
          href="/"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-black/60
            transition
            hover:text-black
          "
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>


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
          className="
            mt-10
            max-w-3xl
          "
        >

          {/* Badge */}

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
              text-sm
              font-bold
              shadow-sm
            "
          >

            <RefreshCcw
              size={16}
              className="text-honey-orange"
            />

            Returns & Refunds

          </div>


          {/* Heading */}

          <h1
            className="
              font-display
              text-5xl
              font-extrabold
              leading-[0.95]
              tracking-tight
              md:text-7xl
            "
          >

            Something not right?

            <span
              className="
                block
                text-honey-orange
              "
            >
              We'll make it right.
            </span>

          </h1>


          <p
            className="
              mt-7
              max-w-2xl
              text-lg
              leading-8
              text-black/60
              md:text-xl
            "
          >

            We want every StickHive order to
            arrive ready to make your day a
            little more fun. If something goes
            wrong, we're here to help.

          </p>

        </motion.div>

      </section>


      {/* =====================================================
          IMPORTANT NOTE
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-14
          max-w-6xl
        "
      >

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
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            flex
            flex-col
            gap-5
            rounded-[1.75rem]
            border
            border-honey-orange/20
            bg-white
            p-6
            md:flex-row
            md:items-start
            md:p-7
          "
        >

          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-honey-orange/10
              text-honey-orange
            "
          >

            <CircleAlert size={21} />

          </div>


          <div>

            <h2
              className="
                text-lg
                font-extrabold
              "
            >
              A quick note
            </h2>


            <p
              className="
                mt-2
                text-sm
                leading-7
                text-black/55
              "
            >

              Return and refund eligibility can depend
              on the product, order and circumstances.
              Please contact us before sending anything
              back so we can guide you through the
              appropriate process.

            </p>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          COMMON ISSUES
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-14
          max-w-6xl
        "
      >

        <div
          className="
            grid
            gap-5
            lg:grid-cols-3
          "
        >

          {returnCards.map(
            (card, index) => {

              const Icon = card.icon;

              return (

                <motion.div
                  key={card.title}
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
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  className="
                    group
                    rounded-[1.75rem]
                    border
                    border-black/10
                    bg-white
                    p-7
                    transition
                    hover:-translate-y-1
                    hover:shadow-[0_20px_50px_-35px_rgba(0,0,0,0.35)]
                  "
                >

                  <div
                    className="
                      flex
                      size-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-cream
                      transition
                      group-hover:bg-hive-yellow
                    "
                  >

                    <Icon
                      size={21}
                      className="text-black"
                    />

                  </div>


                  <h2
                    className="
                      mt-6
                      text-xl
                      font-extrabold
                    "
                  >

                    {card.title}

                  </h2>


                  <p
                    className="
                      mt-3
                      text-sm
                      leading-7
                      text-black/50
                    "
                  >

                    {card.description}

                  </p>

                </motion.div>

              );

            },
          )}

        </div>

      </section>


      {/* =====================================================
          RETURN PROCESS
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-16
          max-w-6xl
        "
      >

        <div
          className="
            mb-8
            max-w-2xl
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.2em]
              text-honey-orange
            "
          >

            <Sparkles size={14} />

            How it works

          </div>


          <h2
            className="
              mt-3
              text-3xl
              font-extrabold
              tracking-tight
              md:text-4xl
            "
          >

            A simple process.

          </h2>


          <p
            className="
              mt-3
              text-sm
              leading-7
              text-black/50
              md:text-base
            "
          >

            We'd rather solve a problem with you
            than make the process complicated.

          </p>

        </div>


        <div
          className="
            grid
            gap-5
            md:grid-cols-2
            lg:grid-cols-4
          "
        >

          {returnSteps.map(
            (step, index) => (

              <motion.div
                key={step.number}
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
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.07,
                }}
                className="
                  relative
                  rounded-[1.5rem]
                  border
                  border-black/10
                  bg-white
                  p-6
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      flex
                      size-10
                      items-center
                      justify-center
                      rounded-full
                      bg-hive-yellow
                      text-xs
                      font-black
                    "
                  >

                    {step.number}

                  </span>


                  {index <
                    returnSteps.length - 1 && (
                    <ArrowRight
                      size={17}
                      className="
                        hidden
                        text-black/15
                        lg:block
                      "
                    />
                  )}

                </div>


                <h3
                  className="
                    mt-6
                    text-lg
                    font-extrabold
                  "
                >

                  {step.title}

                </h3>


                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-black/50
                  "
                >

                  {step.description}

                </p>

              </motion.div>

            ),
          )}

        </div>

      </section>


      {/* =====================================================
          CUSTOM STICKERS NOTE
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-16
          max-w-6xl
        "
      >

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
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            rounded-[2rem]
            bg-[#123F3A]
            px-7
            py-10
            text-white
            md:px-10
            md:py-11
          "
        >

          <div
            className="
              flex
              flex-col
              gap-7
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div
              className="
                max-w-2xl
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-bold
                  text-hive-yellow
                "
              >

                🐝

                CUSTOM ORDERS

              </div>


              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  tracking-tight
                "
              >

                Have a custom sticker
                question?

              </h2>


              <p
                className="
                  mt-3
                  text-sm
                  leading-7
                  text-white/55
                  md:text-base
                "
              >

                Custom designs can have different
                requirements. If you're unsure about
                something, reach out before placing
                your order.

              </p>

            </div>


            <Link
              href="/contact"
              className="
                group
                flex
                w-fit
                shrink-0
                items-center
                gap-2
                rounded-full
                bg-hive-yellow
                px-7
                py-3.5
                text-sm
                font-black
                text-black
                transition
                hover:scale-[1.03]
              "
            >

              Contact Us

              <ArrowUpRight
                size={17}
                className="
                  transition
                  group-hover:translate-x-1
                  group-hover:-translate-y-1
                "
              />

            </Link>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          FOOTNOTE
      ====================================================== */}

      <div
        className="
          mx-auto
          mt-12
          max-w-3xl
          text-center
        "
      >

        <p
          className="
            text-xs
            leading-6
            text-black/35
          "
        >

          This page provides general information.
          Specific return and refund decisions may
          depend on the details of each order.

        </p>

      </div>

    </main>
  );
}