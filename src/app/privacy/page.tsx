"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Cookie,
  Database,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";


const sections = [
  {
    number: "01",
    title: "Information we may collect",
    content: [
      "When you interact with StickHive, we may collect information that you voluntarily provide, such as your name, email address, contact details, delivery information and information associated with your orders.",
      "The exact information collected depends on how you use the website and which features you choose to use.",
    ],
  },

  {
    number: "02",
    title: "Information about your orders",
    content: [
      "When you place an order, information necessary to process and fulfill that order may be collected, such as order details, delivery information and relevant communication about the order.",
      "Payment information may be processed through the payment service or payment provider used during checkout. We do not intend to store complete payment card details on StickHive's own systems unless specifically stated otherwise.",
    ],
  },

  {
    number: "03",
    title: "Custom sticker content",
    content: [
      "If you use our custom sticker service, you may provide photographs, artwork, illustrations, logos or other content.",
      "We use submitted content for purposes connected with providing the requested custom service and handling your order.",
      "You should only submit content that you have the appropriate rights or permission to use.",
    ],
  },

  {
    number: "04",
    title: "How we use information",
    content: [
      "Information may be used to process and fulfill orders, communicate with you, provide customer support, improve our website and services, and maintain the security and functionality of the StickHive experience.",
      "Where you choose to receive marketing communications, your contact information may also be used to send relevant StickHive updates, offers or other communications.",
    ],
  },

  {
    number: "05",
    title: "Communication & support",
    content: [
      "If you contact us through email, a contact form or another available channel, we may retain the information you provide so that we can respond to your request and maintain an appropriate record of the communication.",
      "Please avoid sending sensitive personal information through general contact forms or email unless we specifically request it.",
    ],
  },

  {
    number: "06",
    title: "Cookies & similar technologies",
    content: [
      "The StickHive website may use cookies or similar technologies to support website functionality, remember preferences, understand how the website is used and improve the overall experience.",
      "The specific cookies and technologies used may change as the website develops.",
    ],
  },

  {
    number: "07",
    title: "Third-party services",
    content: [
      "StickHive may use third-party services to support functions such as payments, hosting, analytics, email communication, delivery or other website operations.",
      "Those providers may process information according to their own privacy policies and applicable requirements.",
    ],
  },

  {
    number: "08",
    title: "Information security",
    content: [
      "We take reasonable measures intended to protect information against unauthorized access, misuse, loss or disclosure.",
      "However, no website or online transmission can be guaranteed to be completely secure, so users should also take reasonable precautions when interacting with online services.",
    ],
  },

  {
    number: "09",
    title: "Information retention",
    content: [
      "We may retain information for as long as reasonably necessary for the purposes for which it was collected, including fulfilling orders, providing support, maintaining business records and meeting applicable legal or regulatory requirements.",
    ],
  },

  {
    number: "10",
    title: "Your choices",
    content: [
      "Depending on applicable law, you may have rights or choices relating to the personal information we hold about you.",
      "You may also be able to unsubscribe from marketing communications by using the relevant unsubscribe option or contacting us directly.",
    ],
  },

  {
    number: "11",
    title: "Children's privacy",
    content: [
      "StickHive is intended to be used by people who are legally able to make purchases and use online services under applicable law.",
      "We do not knowingly seek to collect personal information from children in circumstances where such collection is not permitted.",
    ],
  },

  {
    number: "12",
    title: "Changes to this policy",
    content: [
      "As StickHive grows, our website, services and data practices may change. We may therefore update this Privacy Policy from time to time.",
      "The latest version will be made available on this page together with an updated revision date.",
    ],
  },

  {
    number: "13",
    title: "Contact us",
    content: [
      "If you have questions about this Privacy Policy or how information is handled by StickHive, please contact us.",
    ],
  },
];


const privacyHighlights = [
  {
    icon: Database,
    title: "What we collect",
    description:
      "Only information relevant to providing and improving your StickHive experience.",
  },
  {
    icon: Lock,
    title: "How we protect it",
    description:
      "We take reasonable steps to protect information against unauthorized access and misuse.",
  },
  {
    icon: UserRound,
    title: "Your choices",
    description:
      "You may have rights and choices regarding your personal information depending on applicable law.",
  },
];


export default function PrivacyPage() {
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

            <ShieldCheck
              size={16}
              className="text-honey-orange"
            />

            Privacy & Data

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

            Your privacy

            <span
              className="
                block
                text-honey-orange
              "
            >
              matters to us.
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

            This page explains, in simple terms,
            what information StickHive may collect,
            why we use it and the choices you may have.

          </p>


          {/* Revision */}

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
          PRIVACY HIGHLIGHTS
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-14
          max-w-5xl
        "
      >

        <div
          className="
            grid
            gap-5
            md:grid-cols-3
          "
        >

          {privacyHighlights.map(
            (item, index) => {

              const Icon = item.icon;

              return (

                <motion.div
                  key={item.title}
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
                    delay: index * 0.08,
                  }}
                  className="
                    rounded-[1.75rem]
                    border
                    border-black/10
                    bg-white
                    p-7
                  "
                >

                  <div
                    className="
                      flex
                      size-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-cream
                    "
                  >

                    <Icon
                      size={20}
                      className="text-black"
                    />

                  </div>


                  <h2
                    className="
                      mt-5
                      text-xl
                      font-extrabold
                    "
                  >

                    {item.title}

                  </h2>


                  <p
                    className="
                      mt-3
                      text-sm
                      leading-7
                      text-black/50
                    "
                  >

                    {item.description}

                  </p>

                </motion.div>

              );

            },
          )}

        </div>

      </section>


      {/* =====================================================
          SHORT VERSION
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-10
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

                We collect information that helps us
                provide StickHive products and services,
                process orders, communicate with you and
                improve the website. We aim to handle that
                information responsibly and transparently.

              </p>

            </div>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          POLICY CONTENT
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

                  <div className="shrink-0">

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
          COOKIE NOTE
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-10
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
            flex
            flex-col
            gap-5
            rounded-[1.75rem]
            border
            border-black/10
            bg-white
            p-7
            md:flex-row
            md:items-start
            md:p-8
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
              bg-cream
            "
          >

            <Cookie
              size={20}
            />

          </div>


          <div>

            <h2
              className="
                text-xl
                font-extrabold
              "
            >

              About cookies

            </h2>


            <p
              className="
                mt-2
                text-sm
                leading-7
                text-black/50
              "
            >

              Cookies and similar technologies may be
              used to keep the website functioning,
              remember preferences and understand how
              visitors use StickHive. As the website
              develops, we may provide additional controls
              where required or appropriate.

            </p>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          CONTACT CTA
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-12
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

                <Mail size={16} />

                HAVE A QUESTION?

              </div>


              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  tracking-tight
                "
              >

                Want to know more?

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

                If you have a question about your
                information or this Privacy Policy,
                reach out to our team.

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
          LEGAL NOTE
      ====================================================== */}

      <div
        className="
          mx-auto
          mt-12
          flex
          max-w-3xl
          items-start
          justify-center
          gap-2
          text-center
          text-xs
          leading-6
          text-black/35
        "
      >

        <FileText
          size={13}
          className="
            mt-1
            shrink-0
          "
        />

        <p>

          This Privacy Policy is a general website
          privacy framework and should be reviewed
          and finalized according to StickHive's actual
          data practices, service providers and applicable
          privacy laws before being published as the
          business's final legal policy.

        </p>

      </div>

    </main>
  );
}