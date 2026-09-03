"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowUpRight,
  Mail,
} from "lucide-react";

import {
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";


export default function Footer() {

  const currentYear =
    new Date().getFullYear();


  // ==========================================================================
  // NEWSLETTER
  // ==========================================================================

  const [
    email,
    setEmail,
  ] = useState("");


  const [
    subscribed,
    setSubscribed,
  ] = useState(false);


  const handleSubscribe = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {

    event.preventDefault();


    const trimmedEmail =
      email.trim();


    if (!trimmedEmail) {
      return;
    }


    // Frontend-only success state
    setSubscribed(true);


    // Clear email field
    setEmail("");

  };


  // ==========================================================================
  // RESET NEWSLETTER STATE
  // ==========================================================================

  useEffect(() => {

    if (!subscribed) {
      return;
    }


    const timeout =
      window.setTimeout(() => {

        setSubscribed(false);

      }, 2500);


    return () => {
      window.clearTimeout(timeout);
    };

  }, [
    subscribed,
  ]);


  return (

    <footer
      className="
        relative
        mt-20
        overflow-hidden
        bg-[#123F3A]
        text-white
      "
    >

      {/* ================================================================
          CURVED TOP
      ================================================================= */}

      <div
        className="
          absolute
          left-[-5%]
          right-[-5%]
          top-[-65px]
          h-[110px]
          rounded-[50%]
          bg-cream
        "
      />


      {/* ================================================================
          BACKGROUND DECORATION
      ================================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          top-28
          size-72
          rounded-full
          bg-hive-yellow/10
          blur-3xl
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          -left-24
          bottom-10
          size-64
          rounded-full
          bg-mint/10
          blur-3xl
        "
      />


      {/* Decorative dots */}

      <div
        className="
          pointer-events-none
          absolute
          right-[12%]
          top-32
          size-3
          rounded-full
          bg-hive-yellow
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          bottom-28
          left-[8%]
          size-2
          rounded-full
          bg-white/30
        "
      />


      {/* ================================================================
          MAIN CONTENT
      ================================================================= */}

      <div
        className="
          relative
          mx-auto
          max-w-7xl
          px-6
          pb-10
          pt-24
          md:px-8
          lg:px-10
        "
      >

        {/* ==============================================================
            TOP GRID
        ============================================================== */}

        <div
          className="
            grid
            gap-12
            md:grid-cols-2
            lg:grid-cols-4
            lg:gap-10
          "
        >

          {/* ============================================================
              BRAND
          ============================================================ */}

          <div
            className="
              lg:col-span-1
            "
          >

            {/* Bee */}

            <div
              className="
                mb-5
                flex
                size-12
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
                text-2xl
                shadow-sm
              "
            >
              🐝
            </div>


            {/* Brand */}

            <h2
              className="
                font-display
                text-3xl
                font-extrabold
                tracking-tight
              "
            >
              StickHive
            </h2>


            {/* Heading */}

            <h3
              className="
                mt-5
                text-2xl
                font-extrabold
                leading-tight
                tracking-tight
                md:text-4xl
              "
            >

              Make your

              <span
                className="
                  block
                  text-hive-yellow
                "
              >
                ideas stick.
              </span>

            </h3>


            {/* Description */}

            <p
              className="
                mt-5
                max-w-sm
                text-sm
                leading-6
                text-white/60
                md:text-base
              "
            >
              What started as a simple classroom
              business idea became our way of
              turning creativity, personality and
              fun into something people can
              actually stick with.
            </p>

          </div>


          {/* ============================================================
              SHOP
          ============================================================ */}

          <div>

            <h3
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.2em]
                text-hive-yellow
              "
            >
              Shop
            </h3>


            <div
              className="
                mt-5
                flex
                flex-col
                gap-3
              "
            >

              <FooterLink
                href="/shop"
                label="All Stickers"
              />


              {/* IMPORTANT:
                  Trending is on the HOME PAGE */}

              <FooterLink
                href="/#trending"
                label="Trending"
              />


              <FooterLink
                href="/shop#categories"
                label="Categories"
              />


              <FooterLink
                href="/custom-sticker"
                label="Custom Stickers"
              />


              <FooterLink
                href="/shop#new"
                label="New Drops"
              />

            </div>

          </div>


          {/* ============================================================
              HELP
          ============================================================ */}

          <div>

            <h3
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.2em]
                text-hive-yellow
              "
            >
              Help
            </h3>


            <div
              className="
                mt-5
                flex
                flex-col
                gap-3
              "
            >

              <FooterLink
                href="/contact"
                label="Contact Us"
              />


              <FooterLink
                href="/faq"
                label="FAQ"
              />


              <FooterLink
                href="/shipping"
                label="Shipping"
              />


              <FooterLink
                href="/returns"
                label="Returns & Refunds"
              />

            </div>

          </div>


          {/* ============================================================
              ABOUT
          ============================================================ */}

          <div>

            <h3
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.2em]
                text-hive-yellow
              "
            >
              About
            </h3>


            <div
              className="
                mt-5
                flex
                flex-col
                gap-3
              "
            >

              <FooterLink
                href="/about#story"
                label="Our Story"
              />


              <FooterLink
                href="/about#journey"
                label="Our Journey"
              />


              <FooterLink
                href="/about#why-stickhive"
                label="Why StickHive"
              />

            </div>

          </div>

        </div>


        {/* ================================================================
            NEWSLETTER
        ================================================================= */}

        <div
          className="
            mt-14
            rounded-[2rem]
            border
            border-white/10
            bg-white/[0.06]
            p-6
            md:p-7
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

            {/* ============================================================
                NEWSLETTER COPY
            ============================================================ */}

            <div>

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

                <Mail
                  size={16}
                />

                JOIN THE HIVE

              </div>


              <h3
                className="
                  mt-2
                  text-2xl
                  font-extrabold
                "
              >
                Get 10% off your first order.
              </h3>


              <p
                className="
                  mt-1
                  text-sm
                  text-white/50
                "
              >
                New sticker drops, creative
                inspiration and a little bee business.
              </p>

            </div>


            {/* ============================================================
                NEWSLETTER FORM
            ============================================================ */}

            <div
              className="
                w-full
                max-w-xl
              "
            >

              <form
                onSubmit={
                  handleSubscribe
                }
                className="
                  flex
                  w-full
                  flex-col
                  gap-3
                  sm:flex-row
                "
              >

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {

                    setEmail(
                      event.target.value,
                    );


                    if (
                      subscribed
                    ) {
                      setSubscribed(
                        false,
                      );
                    }

                  }}
                  placeholder="Your email address"
                  aria-label="Email address"
                  required
                  className="
                    h-12
                    min-w-0
                    flex-1
                    rounded-full
                    border
                    border-white/10
                    bg-white
                    px-5
                    text-sm
                    text-black
                    outline-none
                    placeholder:text-black/40
                    focus:border-hive-yellow
                    focus:ring-2
                    focus:ring-hive-yellow/20
                  "
                />


                <button
                  type="submit"
                  className="
                    flex
                    h-12
                    shrink-0
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-hive-yellow
                    px-6
                    text-sm
                    font-black
                    text-black
                    transition
                    duration-200
                    hover:scale-[1.03]
                    hover:bg-[#FFE06A]
                    active:scale-[0.98]
                  "
                >

                  {subscribed
                    ? "You're in!"
                    : "Subscribe"}


                  <ArrowUpRight
                    size={16}
                  />

                </button>

              </form>


              {/* ==========================================================
                  SUCCESS MESSAGE
              ========================================================== */}

              <div
                className={`
                  overflow-hidden
                  transition-all
                  duration-300

                  ${
                    subscribed
                      ? "mt-3 max-h-10 opacity-100"
                      : "mt-0 max-h-0 opacity-0"
                  }
                `}
              >

                <p
                  className="
                    px-2
                    text-sm
                    font-semibold
                    text-hive-yellow
                  "
                >
                  Welcome to the Hive! 🐝
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================================
            BOTTOM BAR
        ================================================================= */}

        <div
          className="
            mt-8
            flex
            flex-col
            gap-6
            border-t
            border-white/10
            pt-7
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          {/* ============================================================
              COPYRIGHT
          ============================================================ */}

          <p
            className="
              text-xs
              text-white/40
            "
          >
            © {currentYear} StickHive.
            All rights reserved.
          </p>


          {/* ============================================================
              SOCIAL LINKS
          ============================================================ */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {/* Instagram */}

            <SocialLink
              href="https://www.instagram.com/YOUR_STICKHIVE_USERNAME"
              label="Instagram"
            >
              <FaInstagram
                size={17}
              />
            </SocialLink>


            {/* LinkedIn */}

            <SocialLink
              href="https://www.linkedin.com/company/YOUR_STICKHIVE_PAGE"
              label="LinkedIn"
            >
              <FaLinkedinIn
                size={17}
              />
            </SocialLink>


            {/* Email */}

            <SocialLink
              href="mailto:hello@stickhive.com"
              label="Email"
            >
              <Mail
                size={17}
              />
            </SocialLink>

          </div>


          {/* ============================================================
              LEGAL LINKS
          ============================================================ */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-5
              text-xs
              text-white/40
            "
          >

            <Link
              href="/terms"
              className="
                transition
                hover:text-white
              "
            >
              Terms & Conditions
            </Link>


            <Link
              href="/privacy"
              className="
                transition
                hover:text-white
              "
            >
              Privacy Policy
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}


/* ============================================================================
   FOOTER LINK
============================================================================ */

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {

  return (

    <Link
      href={href}
      className="
        group
        flex
        w-fit
        items-center
        gap-1
        text-sm
        text-white/55
        transition
        hover:text-white
      "
    >

      {label}

      <ArrowUpRight
        size={12}
        className="
          opacity-0
          transition
          group-hover:translate-x-0.5
          group-hover:opacity-100
        "
      />

    </Link>

  );
}


/* ============================================================================
   SOCIAL LINK
============================================================================ */

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {

  const isExternal =
    href.startsWith("http");


  return (

    <a
      href={href}
      aria-label={label}
      target={
        isExternal
          ? "_blank"
          : undefined
      }
      rel={
        isExternal
          ? "noopener noreferrer"
          : undefined
      }
      className="
        flex
        size-10
        items-center
        justify-center
        rounded-full
        border
        border-white/10
        bg-white/[0.05]
        text-white/70
        transition
        duration-200
        hover:scale-105
        hover:bg-hive-yellow
        hover:text-black
      "
    >

      {children}

    </a>

  );
}