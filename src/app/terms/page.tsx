"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";


const sections = [
  {
    number: "01",
    title: "About StickHive",
    content: [
      "StickHive is a creative sticker business built around turning ideas, artwork and personal expression into physical stickers.",
      "By using our website, browsing our products or placing an order, you agree to use the website responsibly and in accordance with these terms.",
    ],
  },

  {
    number: "02",
    title: "Using our website",
    content: [
      "You may use the StickHive website for personal, legitimate shopping and browsing purposes.",
      "You agree not to misuse the website, attempt to interfere with its operation, gain unauthorized access to systems or use the website for unlawful purposes.",
    ],
  },

  {
    number: "03",
    title: "Products & availability",
    content: [
      "We aim to display our products, designs, descriptions and pricing as accurately as possible.",
      "Product availability may change from time to time. We may update, discontinue or modify products without prior notice.",
      "Colours and appearance may vary slightly depending on your screen, device and other display settings.",
    ],
  },

  {
    number: "04",
    title: "Orders",
    content: [
      "When you place an order, you are requesting to purchase the selected products at the applicable price and under the available delivery conditions.",
      "An order may be subject to review or cancellation where there is an issue with product availability, pricing, payment, incorrect information or other circumstances that prevent us from fulfilling the order.",
      "Please make sure your contact and delivery information is accurate before completing your purchase.",
    ],
  },

  {
    number: "05",
    title: "Pricing & payments",
    content: [
      "Product prices shown on the website are the prices applicable at the time of purchase unless otherwise stated.",
      "Payment must be successfully completed through the payment methods made available during checkout.",
      "We reserve the right to correct genuine pricing or listing errors and take appropriate action where necessary.",
    ],
  },

  {
    number: "06",
    title: "Custom stickers & customer content",
    content: [
      "When you submit photographs, artwork, illustrations, logos or other content for a custom sticker, you confirm that you have the necessary rights or permission to use that content.",
      "You are responsible for ensuring that content you submit does not infringe another person's intellectual property, privacy or other legal rights.",
      "We may decline a custom request where the submitted content is inappropriate, unlawful or otherwise unsuitable for production.",
    ],
  },

  {
    number: "07",
    title: "Intellectual property",
    content: [
      "StickHive's branding, website design, original artwork, graphics, text, illustrations and other original content belong to StickHive or the respective rights holder unless stated otherwise.",
      "You may not reproduce, redistribute, modify or commercially exploit StickHive content without appropriate permission.",
      "Submitting your own content for a custom order does not automatically transfer ownership of that content to StickHive.",
    ],
  },

  {
    number: "08",
    title: "Shipping & delivery",
    content: [
      "Shipping and delivery information may vary depending on the order, destination and available delivery options.",
      "Once an order has been dispatched, delivery may also be affected by circumstances outside our direct control.",
      "Please refer to our Shipping page for general information about the delivery process.",
    ],
  },

  {
    number: "09",
    title: "Returns & refunds",
    content: [
      "If there is a problem with your order, please contact us as soon as possible so we can review the situation.",
      "Return or refund eligibility may depend on the nature of the issue, the product involved and the circumstances of the order.",
      "Please review our Returns & Refunds page for more information.",
    ],
  },

  {
    number: "10",
    title: "Limitation of liability",
    content: [
      "We aim to provide a reliable and enjoyable shopping experience, but we cannot guarantee that the website will always be available, uninterrupted or completely free from errors.",
      "To the extent permitted by applicable law, StickHive will not be responsible for losses arising from circumstances outside our reasonable control.",
    ],
  },

  {
    number: "11",
    title: "Changes to these terms",
    content: [
      "We may update these Terms & Conditions from time to time as our website, products or business develops.",
      "Any updated version will be made available on this page. Your continued use of the website after an update means you acknowledge the revised terms.",
    ],
  },

  {
    number: "12",
    title: "Contact us",
    content: [
      "If you have a question about these terms, an order or anything related to StickHive, please contact our team.",
    ],
  },
];


export default function TermsPage() {

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

            <FileText
              size={16}
              className="text-honey-orange"
            />

            Website Terms

          </div>


          {/* Heading */}

          <h1
            className="
              max-w-4xl
              font-display
              text-5xl
              font-extrabold
              leading-[0.95]
              tracking-tight
              md:text-7xl
            "
          >

            Terms &

            <span
              className="
                text-honey-orange
              "
            >
              {" "}Conditions.
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

            A few simple rules that help us keep
            StickHive creative, fair and enjoyable
            for everyone.

          </p>


          {/* Last updated */}

          <div
            className="
              mt-6
              flex
              items-center
              gap-2
              text-xs
              font-semibold
              text-black/35
            "
          >

            <Sparkles
              size={13}
              className="text-honey-orange"
            />

            Last updated: August 2026

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          QUICK SUMMARY
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-14
          max-w-5xl
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
            p-7
            text-white
            md:p-9
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              md:flex-row
              md:items-start
            "
          >

            <div
              className="
                flex
                size-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-hive-yellow
                text-2xl
              "
            >
              🐝
            </div>


            <div>

              <h2
                className="
                  text-2xl
                  font-extrabold
                "
              >
                The short version.
              </h2>


              <p
                className="
                  mt-3
                  max-w-3xl
                  text-sm
                  leading-7
                  text-white/60
                  md:text-base
                "
              >

                Use StickHive responsibly, provide accurate
                information when ordering, only submit content
                you have the right to use, and contact us if
                something goes wrong with your order.

              </p>

            </div>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          TERMS
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-12
          max-w-5xl
        "
      >

        <div
          className="
            overflow-hidden
            rounded-[2rem]
            border
            border-black/10
            bg-white
          "
        >

          {sections.map(
            (section, index) => (

              <motion.article
                key={section.number}
                initial={{
                  opacity: 0,
                  y: 15,
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
                  delay: index * 0.025,
                }}
                className="
                  border-b
                  border-black/[0.07]
                  p-7
                  last:border-b-0
                  md:p-9
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-5
                    md:flex-row
                    md:gap-8
                  "
                >

                  {/* Number */}

                  <div
                    className="
                      shrink-0
                    "
                  >

                    <span
                      className="
                        flex
                        size-11
                        items-center
                        justify-center
                        rounded-full
                        bg-cream
                        text-xs
                        font-black
                        text-black
                      "
                    >

                      {section.number}

                    </span>

                  </div>


                  {/* Content */}

                  <div
                    className="
                      max-w-3xl
                    "
                  >

                    <h2
                      className="
                        text-xl
                        font-extrabold
                        tracking-tight
                        md:text-2xl
                      "
                    >

                      {section.title}

                    </h2>


                    <div
                      className="
                        mt-4
                        space-y-3
                      "
                    >

                      {section.content.map(
                        (paragraph) => (

                          <p
                            key={paragraph}
                            className="
                              text-sm
                              leading-7
                              text-black/55
                              md:text-base
                            "
                          >

                            {paragraph}

                          </p>

                        ),
                      )}

                    </div>

                  </div>

                </div>

              </motion.article>

            ),
          )}

        </div>

      </section>


      {/* =====================================================
          RELATED PAGES
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-12
          max-w-5xl
        "
      >

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >

          <Link
            href="/privacy"
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
                items-center
                justify-between
              "
            >

              <span
                className="
                  flex
                  size-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-cream
                "
              >

                🔒

              </span>


              <ArrowUpRight
                size={18}
                className="
                  transition
                  group-hover:translate-x-1
                  group-hover:-translate-y-1
                "
              />

            </div>


            <h3
              className="
                mt-6
                text-xl
                font-extrabold
              "
            >
              Privacy Policy
            </h3>


            <p
              className="
                mt-2
                text-sm
                leading-6
                text-black/50
              "
            >

              Learn how we handle information
              connected with your StickHive experience.

            </p>

          </Link>


          <Link
            href="/contact"
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
                items-center
                justify-between
              "
            >

              <span
                className="
                  flex
                  size-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-cream
                "
              >

                💬

              </span>


              <ArrowUpRight
                size={18}
                className="
                  transition
                  group-hover:translate-x-1
                  group-hover:-translate-y-1
                "
              />

            </div>


            <h3
              className="
                mt-6
                text-xl
                font-extrabold
              "
            >
              Questions?
            </h3>


            <p
              className="
                mt-2
                text-sm
                leading-6
                text-black/50
              "
            >

              If something isn't clear, our team
              is happy to help.

            </p>

          </Link>

        </div>

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

          These terms are intended to provide general
          information about using the StickHive website
          and purchasing our products. They should be
          reviewed and finalized for your specific business
          and applicable laws before being published as
          your final legal terms.

        </p>

      </div>

    </main>
  );
}