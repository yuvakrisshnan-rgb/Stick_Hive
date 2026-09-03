"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  HelpCircle,
  Sparkles,
} from "lucide-react";


const faqSections = [
  {
    title: "Orders",
    items: [
      {
        question: "How do I place an order?",
        answer:
          "Browse the StickHive collection, choose the stickers you want, add them to your cart and complete the checkout process.",
      },
      {
        question: "Can I change my order after placing it?",
        answer:
          "If you need to make a change, contact us as soon as possible with your order details. We'll do our best to help before the order is processed.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Cancellation requests should be made as soon as possible. Once an order has entered processing or has been shipped, cancellation may no longer be possible.",
      },
    ],
  },

  {
    title: "Stickers",
    items: [
      {
        question: "Where can I use StickHive stickers?",
        answer:
          "Our stickers are designed to add personality to everyday items such as laptops, notebooks, bottles, phone cases and other suitable smooth surfaces.",
      },
      {
        question: "Are the stickers waterproof?",
        answer:
          "Sticker durability and water resistance can vary depending on the specific product. Please check the individual product description for its material and care details.",
      },
      {
        question: "Will the stickers leave residue?",
        answer:
          "Sticker performance can depend on the surface and how long the sticker has been applied. For the best experience, apply stickers to clean, smooth surfaces.",
      },
    ],
  },

  {
    title: "Custom Stickers",
    items: [
      {
        question: "Can I create my own sticker?",
        answer:
          "Yes. StickHive is built around creativity, and our custom sticker experience lets you turn your own ideas and designs into stickers.",
      },
      {
        question: "Can I upload my own design?",
        answer:
          "Custom design requirements can vary depending on the product and customization option. Follow the instructions provided on the custom sticker page when placing your request.",
      },
      {
        question: "Can I use my own photos?",
        answer:
          "Yes, you can use your own photos for custom designs as long as you have the appropriate rights or permission to use the content.",
      },
    ],
  },

  {
    title: "Shipping & Returns",
    items: [
      {
        question: "How long does shipping take?",
        answer:
          "Delivery times can vary depending on your location and the type of order. We'll provide the applicable shipping information during the ordering process.",
      },
      {
        question: "How can I track my order?",
        answer:
          "If tracking is available for your order, the relevant tracking information will be shared with you once your order has been dispatched.",
      },
      {
        question: "What if my order arrives damaged?",
        answer:
          "Please contact us as soon as possible with your order details and photographs of the damaged package or products so we can review the issue.",
      },
    ],
  },
];


export default function FAQPage() {

  const [openItem, setOpenItem] = useState<string | null>(
    null,
  );


  const toggleItem = (id: string) => {

    setOpenItem(
      openItem === id
        ? null
        : id,
    );

  };


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
          top-32
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
          top-[45%]
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
          max-w-5xl
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
            text-center
          "
        >

          {/* Badge */}

          <div
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
              text-sm
              font-bold
              shadow-sm
            "
          >

            <HelpCircle
              size={16}
              className="
                text-honey-orange
              "
            />

            Frequently Asked Questions

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

            Questions?

            <span
              className="
                block
                text-honey-orange
              "
            >

              We've got you.

            </span>

          </h1>


          {/* Description */}

          <p
            className="
              mx-auto
              mt-6
              max-w-2xl
              text-lg
              leading-8
              text-black/60
              md:text-xl
            "
          >

            Everything you need to know about
            StickHive, your stickers, orders and
            creating something of your own.

          </p>

        </motion.div>

      </section>


      {/* =====================================================
          FAQ CONTENT
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-16
          max-w-4xl
        "
      >

        <div
          className="
            space-y-10
          "
        >

          {faqSections.map(
            (section, sectionIndex) => (

              <motion.div
                key={section.title}
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
                  duration: 0.5,
                  delay: sectionIndex * 0.05,
                }}
              >

                {/* Section heading */}

                <div
                  className="
                    mb-4
                    flex
                    items-center
                    gap-3
                  "
                >

                  <span
                    className="
                      flex
                      size-9
                      items-center
                      justify-center
                      rounded-full
                      bg-hive-yellow
                      text-xs
                      font-black
                    "
                  >

                    {String(
                      sectionIndex + 1,
                    ).padStart(2, "0")}

                  </span>


                  <h2
                    className="
                      text-2xl
                      font-extrabold
                      tracking-tight
                    "
                  >

                    {section.title}

                  </h2>

                </div>


                {/* Questions */}

                <div
                  className="
                    overflow-hidden
                    rounded-[1.5rem]
                    border
                    border-black/10
                    bg-white
                    shadow-[0_20px_50px_-35px_rgba(0,0,0,0.3)]
                  "
                >

                  {section.items.map(
                    (item, itemIndex) => {

                      const itemId =
                        `${sectionIndex}-${itemIndex}`;

                      const isOpen =
                        openItem === itemId;


                      return (

                        <div
                          key={itemId}
                          className="
                            border-b
                            border-black/[0.07]
                            last:border-b-0
                          "
                        >

                          <button
                            type="button"
                            onClick={() =>
                              toggleItem(itemId)
                            }
                            aria-expanded={
                              isOpen
                            }
                            className="
                              flex
                              w-full
                              items-center
                              justify-between
                              gap-6
                              px-6
                              py-5
                              text-left
                              transition
                              hover:bg-cream/70
                              md:px-7
                            "
                          >

                            <span
                              className="
                                text-base
                                font-bold
                                text-black
                                md:text-lg
                              "
                            >

                              {item.question}

                            </span>


                            <span
                              className={`
                                flex
                                size-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                transition
                                ${
                                  isOpen
                                    ? "bg-honey-orange text-white"
                                    : "bg-cream text-black"
                                }
                              `}
                            >

                              <ChevronDown
                                size={18}
                                className={`
                                  transition-transform
                                  duration-300
                                  ${
                                    isOpen
                                      ? "rotate-180"
                                      : ""
                                  }
                                `}
                              />

                            </span>

                          </button>


                          {/* Answer */}

                          <AnimatePresence
                            initial={false}
                          >

                            {isOpen && (

                              <motion.div
                                initial={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                transition={{
                                  duration: 0.25,
                                  ease: "easeOut",
                                }}
                                className="
                                  overflow-hidden
                                "
                              >

                                <div
                                  className="
                                    px-6
                                    pb-6
                                    pr-14
                                    md:px-7
                                    md:pr-16
                                  "
                                >

                                  <p
                                    className="
                                      text-sm
                                      leading-7
                                      text-black/55
                                      md:text-base
                                    "
                                  >

                                    {item.answer}

                                  </p>

                                </div>

                              </motion.div>

                            )}

                          </AnimatePresence>

                        </div>

                      );

                    },
                  )}

                </div>

              </motion.div>

            ),
          )}

        </div>

      </section>


      {/* =====================================================
          STILL NEED HELP
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-16
          max-w-4xl
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
            relative
            overflow-hidden
            rounded-[2rem]
            bg-[#123F3A]
            px-7
            py-10
            text-center
            text-white
            md:px-12
            md:py-12
          "
        >

          {/* Decoration */}

          <div
            className="
              pointer-events-none
              absolute
              -right-12
              -top-12
              size-32
              rounded-full
              bg-hive-yellow/10
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              -bottom-16
              -left-10
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
              mt-5
              text-3xl
              font-extrabold
              tracking-tight
              md:text-4xl
            "
          >

            Still have a question?

          </h2>


          <p
            className="
              relative
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-7
              text-white/55
              md:text-base
            "
          >

            No worries. Send us a message and
            we'll do our best to help.

          </p>


          <Link
            href="/contact"
            className="
              group
              relative
              mx-auto
              mt-7
              flex
              w-fit
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

        </motion.div>

      </section>


      {/* =====================================================
          SMALL BRAND NOTE
      ====================================================== */}

      <div
        className="
          mx-auto
          mt-12
          flex
          max-w-xl
          items-center
          justify-center
          gap-2
          text-center
          text-xs
          font-semibold
          text-black/35
        "
      >

        <Sparkles
          size={13}
          className="text-honey-orange"
        />

        Made with creativity by StickHive.

      </div>

    </main>
  );
}