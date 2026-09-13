"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-36">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="mx-auto max-w-6xl">

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
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-10 max-w-3xl"
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
            <Sparkles
              size={16}
              className="text-honey-orange"
            />

            Let's talk
          </div>


          {/* Heading */}

          <h1
            className="
              font-headline
              text-5xl
              font-extrabold
              leading-[0.95]
              tracking-tight
              md:text-7xl
            "
          >
            Have a question?

            <span className="block text-honey-orange">
              We're here.
            </span>
          </h1>


          {/* Description */}

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
            Whether you have a question about an order,
            want to know more about our stickers, or simply
            want to say hello, we'd love to hear from you.
          </p>

        </motion.div>


        {/* =================================================
            CONTACT CONTENT
        ================================================== */}

        <div
          className="
            mt-16
            grid
            gap-8
            lg:grid-cols-[0.8fr_1.2fr]
          "
        >

          {/* =================================================
              LEFT INFO
          ================================================= */}

          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="
              rounded-[2rem]
              bg-[#123F3A]
              p-8
              text-white
              md:p-10
            "
          >

            {/* Bee */}

            <div
              className="
                flex
                size-14
                items-center
                justify-center
                rounded-2xl
                bg-hive-yellow
                text-2xl
              "
            >
              🐝
            </div>


            <h2
              className="
                mt-7
                text-3xl
                font-extrabold
                tracking-tight
              "
            >
              Let's connect.
            </h2>


            <p
              className="
                mt-4
                text-sm
                leading-7
                text-white/60
                md:text-base
              "
            >
              StickHive started as a simple student
              idea, and we're building it one sticker,
              one idea and one conversation at a time.
            </p>


            {/* Email */}

            <div
              className="
                mt-10
                rounded-2xl
                border
                border-white/10
                bg-white/[0.06]
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-full
                    bg-hive-yellow
                    text-black
                  "
                >
                  <Mail size={18} />
                </div>


                <div>

                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-white/40
                    "
                  >
                    Email
                  </p>

                  <a
                    href="mailto:hello@stickhive.com"
                    className="
                      mt-1
                      block
                      text-sm
                      font-semibold
                      transition
                      hover:text-hive-yellow
                    "
                  >
                    hello@stickhive.com
                  </a>

                </div>

              </div>

            </div>


            {/* Response */}

            <div
              className="
                mt-4
                flex
                items-start
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                p-5
              "
            >

              <MessageCircle
                size={20}
                className="mt-0.5 shrink-0 text-hive-yellow"
              />

              <p
                className="
                  text-sm
                  leading-6
                  text-white/50
                "
              >
                We're a growing team, so give us a
                little time to get back to you.
              </p>

            </div>

          </motion.div>


          {/* =================================================
              CONTACT FORM
          ================================================== */}

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="
              rounded-[2rem]
              border
              border-black/10
              bg-white
              p-8
              shadow-[0_20px_60px_rgba(0,0,0,0.06)]
              md:p-10
            "
          >

            <div>

              <p
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-honey-orange
                "
              >
                Send us a message
              </p>


              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  tracking-tight
                "
              >
                How can we help?
              </h2>

            </div>


            <form
              className="mt-8 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >

              {/* Name */}

              <div>

                <label
                  htmlFor="name"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  Your name
                </label>


                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  required
                  className="
                    h-13
                    w-full
                    rounded-2xl
                    border
                    border-black/10
                    bg-cream
                    px-5
                    text-sm
                    outline-none
                    transition
                    placeholder:text-black/35
                    focus:border-honey-orange
                    focus:ring-4
                    focus:ring-honey-orange/10
                  "
                />

              </div>


              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  Email address
                </label>


                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="
                    h-13
                    w-full
                    rounded-2xl
                    border
                    border-black/10
                    bg-cream
                    px-5
                    text-sm
                    outline-none
                    transition
                    placeholder:text-black/35
                    focus:border-honey-orange
                    focus:ring-4
                    focus:ring-honey-orange/10
                  "
                />

              </div>


              {/* Subject */}

              <div>

                <label
                  htmlFor="subject"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  What can we help with?
                </label>


                <select
                  id="subject"
                  name="subject"
                  required
                  defaultValue=""
                  className="
                    h-13
                    w-full
                    rounded-2xl
                    border
                    border-black/10
                    bg-cream
                    px-5
                    text-sm
                    outline-none
                    transition
                    focus:border-honey-orange
                    focus:ring-4
                    focus:ring-honey-orange/10
                  "
                >

                  <option
                    value=""
                    disabled
                  >
                    Select an option
                  </option>

                  <option value="order">
                    Order question
                  </option>

                  <option value="stickers">
                    Sticker question
                  </option>

                  <option value="custom">
                    Custom sticker
                  </option>

                  <option value="shipping">
                    Shipping
                  </option>

                  <option value="returns">
                    Returns & refunds
                  </option>

                  <option value="other">
                    Something else
                  </option>

                </select>

              </div>


              {/* Message */}

              <div>

                <label
                  htmlFor="message"
                  className="
                    mb-2
                    block
                    text-sm
                    font-bold
                  "
                >
                  Your message
                </label>


                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  required
                  className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-black/10
                    bg-cream
                    px-5
                    py-4
                    text-sm
                    outline-none
                    transition
                    placeholder:text-black/35
                    focus:border-honey-orange
                    focus:ring-4
                    focus:ring-honey-orange/10
                  "
                />

              </div>


              {/* Submit */}

              <button
                type="submit"
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-full
                  bg-[#111111]
                  px-7
                  py-4
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:scale-[1.01]
                  hover:bg-honey-orange
                "
              >

                Send Message

                <ArrowUpRight
                  size={18}
                  className="
                    transition
                    group-hover:translate-x-1
                    group-hover:-translate-y-1
                  "
                />

              </button>

            </form>

          </motion.div>

        </div>


        {/* =================================================
            BOTTOM NOTE
        ================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="
            mx-auto
            mt-14
            max-w-2xl
            text-center
          "
        >

          <p
            className="
              text-sm
              leading-6
              text-black/45
            "
          >
            Looking for quick answers? Check our{" "}

            <Link
              href="/faq"
              className="
                font-bold
                text-black
                underline
                decoration-honey-orange
                decoration-2
                underline-offset-4
              "
            >
              FAQ
            </Link>

            {" "}before sending us a message.
          </p>

        </motion.div>

      </section>

    </main>
  );
}