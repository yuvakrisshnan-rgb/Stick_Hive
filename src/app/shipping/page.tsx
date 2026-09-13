"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";


const shippingSteps = [
  {
    icon: Package,
    number: "01",
    title: "Order placed",
    description:
      "Your order is received and our team gets it ready for processing.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "We prepare it",
    description:
      "Your stickers are carefully checked and prepared for dispatch.",
  },
  {
    icon: Truck,
    number: "03",
    title: "It ships",
    description:
      "Once dispatched, your order begins its journey to you.",
  },
  {
    icon: CheckCircle2,
    number: "04",
    title: "Delivered",
    description:
      "Your StickHive package arrives ready to make something stick.",
  },
];


const shippingInfo = [
  {
    icon: Clock3,
    title: "Processing time",
    description:
      "Orders need some time to be prepared before they are dispatched. The applicable processing information will be provided during the ordering process.",
  },
  {
    icon: Truck,
    title: "Delivery",
    description:
      "Delivery times can vary depending on your location, shipping method and the type of order.",
  },
  {
    icon: MapPin,
    title: "Delivery address",
    description:
      "Please make sure your delivery details are accurate when placing your order to help avoid delays.",
  },
];


export default function ShippingPage() {

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
          BACKGROUND
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
          top-[55%]
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

            <Truck
              size={16}
              className="text-honey-orange"
            />

            Shipping Information

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

            From our hive

            <span
              className="
                block
                text-honey-orange
              "
            >
              to your doorstep.
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

            Here's what happens after you place
            your StickHive order and how your
            stickers make their way to you.

          </p>

        </motion.div>

      </section>


      {/* =====================================================
          SHIPPING JOURNEY
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
            grid
            gap-5
            md:grid-cols-2
            lg:grid-cols-4
          "
        >

          {shippingSteps.map(
            (step, index) => {

              const Icon = step.icon;

              return (

                <motion.div
                  key={step.number}
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
                    relative
                    rounded-[1.75rem]
                    border
                    border-black/10
                    bg-white
                    p-6
                    shadow-[0_20px_50px_-35px_rgba(0,0,0,0.3)]
                    transition
                    hover:-translate-y-1
                  "
                >

                  {/* Number */}

                  <span
                    className="
                      absolute
                      right-5
                      top-5
                      text-xs
                      font-black
                      text-black/15
                    "
                  >
                    {step.number}
                  </span>


                  {/* Icon */}

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
                    {step.title}
                  </h2>


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

              );

            },
          )}

        </div>

      </section>


      {/* =====================================================
          SHIPPING INFORMATION
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
            grid
            gap-5
            lg:grid-cols-3
          "
        >

          {shippingInfo.map(
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
                      bg-[#123F3A]
                      text-hive-yellow
                    "
                  >

                    <Icon size={20} />

                  </div>


                  <h3
                    className="
                      mt-5
                      text-xl
                      font-extrabold
                    "
                  >

                    {item.title}

                  </h3>


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
          TRACKING CARD
      ====================================================== */}

      <section
        className="
          relative
          mx-auto
          mt-10
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
            overflow-hidden
            rounded-[2rem]
            bg-[#123F3A]
            px-7
            py-9
            text-white
            md:px-10
            md:py-10
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

                <Package size={16} />

                ORDER TRACKING

              </div>


              <h2
                className="
                  mt-3
                  text-3xl
                  font-extrabold
                  tracking-tight
                "
              >

                Wondering where your
                stickers are?

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

                If tracking is available for your
                order, we'll share the relevant
                tracking information once your
                package has been dispatched.

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
                px-6
                py-3.5
                text-sm
                font-black
                text-black
                transition
                hover:scale-[1.03]
              "
            >

              Need help?

              <ArrowRight
                size={17}
                className="
                  transition
                  group-hover:translate-x-1
                "
              />

            </Link>

          </div>

        </motion.div>

      </section>


      {/* =====================================================
          NOTE
      ====================================================== */}

      <section
        className="
          mx-auto
          mt-12
          max-w-3xl
          text-center
        "
      >

        <div
          className="
            inline-flex
            items-start
            gap-2
            text-xs
            leading-6
            text-black/40
          "
        >

          <Sparkles
            size={14}
            className="
              mt-1
              shrink-0
              text-honey-orange
            "
          />

          Shipping details may vary depending
          on your location, order and available
          delivery options.

        </div>

      </section>

    </main>
  );
}