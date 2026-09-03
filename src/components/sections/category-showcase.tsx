"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";

import {
  PRODUCTS,
  priceFor,
  type Product,
} from "@/lib/product-data";

import { StickerImage } from "@/components/shop/sticker-image";


// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG = [
  {
    id: "anime",
    name: "Anime",
    description:
      "Characters, energy and worlds that never stop inspiring.",
    color: "bg-sky-300",
    accent: "text-sky-700",
    slug: "anime",
  },
  {
    id: "gaming",
    name: "Gaming",
    description:
      "Level up your setup with stickers made for gamers.",
    color: "bg-honey-orange",
    accent: "text-orange-700",
    slug: "gaming",
  },
  {
    id: "marvel-dc",
    name: "Marvel & DC",
    description:
      "Superheroes, legends and iconic moments.",
    color: "bg-emerald-200",
    accent: "text-emerald-700",
    slug: "marvel-dc",
  },
  {
    id: "technology",
    name: "Technology",
    description:
      "For builders, developers, innovators and tech lovers.",
    color: "bg-violet-300",
    accent: "text-violet-700",
    slug: "technology",
  },
];


// ============================================================================
// HELPERS
// ============================================================================

function normalizeCategory(
  value: string | undefined,
) {
  return (
    value
      ?.toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ?? ""
  );
}


function getCategoryProducts(
  categoryName: string,
) {
  const normalizedTarget =
    normalizeCategory(categoryName);

  return PRODUCTS.filter(
    (product) =>
      normalizeCategory(
        product.category,
      ) === normalizedTarget,
  );
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CategoryShowcase() {

  const sectionRef =
    useRef<HTMLElement | null>(null);

  const [
    activeCategory,
    setActiveCategory,
  ] = useState(0);


  /*
   * Keep the active category synced with
   * the section currently visible on screen.
   *
   * There are NO navigation dots.
   */

  useEffect(() => {

    const section =
      sectionRef.current;

    if (!section) {
      return;
    }


    const cards =
      Array.from(
        section.querySelectorAll(
          "[data-category-card]",
        ),
      );


    if (!cards.length) {
      return;
    }


    const observer =
      new IntersectionObserver(
        (entries) => {

          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting,
              )
              .sort(
                (a, b) =>
                  b.intersectionRatio -
                  a.intersectionRatio,
              );


          if (!visible.length) {
            return;
          }


          const index =
            Number(
              (
                visible[0].target as HTMLElement
              ).dataset.categoryIndex,
            );


          if (
            Number.isFinite(index)
          ) {
            setActiveCategory(
              index,
            );
          }

        },
        {
          threshold: [
            0.25,
            0.5,
            0.75,
          ],
          rootMargin:
            "-10% 0px -10% 0px",
        },
      );


    cards.forEach((card) =>
      observer.observe(card),
    );


    return () => {
      observer.disconnect();
    };

  }, []);


  return (

    <section
      ref={sectionRef}
      id="categories"
      className="
        relative
        overflow-hidden
        bg-cream
        px-0
      "
    >

      {/* ================================================================== */}
      {/* SECTION HEADER                                                     */}
      {/* ================================================================== */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-6
          pb-16
          pt-24
          lg:px-8
        "
      >

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
            amount: 0.2,
          }}
          transition={{
            duration: 0.6,
          }}
          className="
            flex
            flex-col
            gap-8
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >

          <div>

            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.2em]
                text-honey-orange
              "
            >
              Explore by personality
            </p>


            <h2
              className="
                mt-3
                max-w-3xl
                font-display
                text-5xl
                font-extrabold
                leading-[0.95]
                tracking-tight
                text-ink
                md:text-6xl
              "
            >
              Find your
              <span className="text-honey-orange">
                {" "}sticker world.
              </span>
            </h2>

          </div>


          <p
            className="
              max-w-md
              text-base
              leading-relaxed
              text-black/55
              md:text-lg
            "
          >
            From anime and gaming to superheroes
            and technology, discover a collection
            that matches your personality.
          </p>

        </motion.div>

      </div>


      {/* ================================================================== */}
      {/* CATEGORY CARDS                                                     */}
      {/* ================================================================== */}

      <div
        className="
          relative
        "
      >

        {CATEGORY_CONFIG.map(
          (
            category,
            index,
          ) => (

            <CategoryScene
              key={
                category.id
              }
              category={
                category
              }
              index={
                index
              }
              active={
                activeCategory ===
                index
              }
            />

          ),
        )}

      </div>

    </section>

  );
}


// ============================================================================
// CATEGORY SCENE
// ============================================================================

type CategorySceneProps = {
  category: (typeof CATEGORY_CONFIG)[number];
  index: number;
  active: boolean;
};


function CategoryScene({
  category,
  index,
  active,
}: CategorySceneProps) {

  const products =
    useMemo(
      () =>
        getCategoryProducts(
          category.name,
        ).slice(0, 3),
      [category.name],
    );


  /*
   * If the exact category doesn't exist in
   * product-data, use products from the
   * complete catalogue as a visual fallback.
   */

  const fallbackProducts =
    useMemo(
      () =>
        PRODUCTS.slice(
          index * 3,
          index * 3 + 3,
        ),
      [index],
    );


  const displayProducts =
    products.length > 0
      ? products
      : fallbackProducts;


  return (

    <section
      data-category-card
      data-category-index={
        index
      }
      id={`category-${category.id}`}
      className="
        relative
        min-h-[78vh]
        overflow-hidden
        px-6
        py-10
        lg:px-8
      "
    >

      <div
        className="
          mx-auto
          flex
          min-h-[68vh]
          max-w-[1500px]
          items-center
        "
      >

        <motion.div
          initial={{
            opacity: 0,
            y: 70,
            scale: 0.96,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: false,
            amount: 0.35,
          }}
          transition={{
            duration: 0.7,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className={`
            relative
            w-full
            overflow-hidden
            rounded-[38px]
            ${category.color}
            p-6
            md:p-8
            lg:p-10
          `}
        >

          {/* ============================================================ */}
          {/* DECORATIVE INNER BORDER                                      */}
          {/* ============================================================ */}

          <div
            className="
              pointer-events-none
              absolute
              inset-4
              rounded-[30px]
              border
              border-dashed
              border-black/15
            "
          />


          {/* ============================================================ */}
          {/* BACKGROUND NUMBER                                            */}
          {/* ============================================================ */}

          <div
            className="
              pointer-events-none
              absolute
              -right-5
              -top-20
              select-none
              font-display
              text-[220px]
              font-black
              leading-none
              text-black/5
              md:text-[300px]
            "
          >
            {String(
              index + 1,
            ).padStart(2, "0")}
          </div>


          {/* ============================================================ */}
          {/* CONTENT                                                       */}
          {/* ============================================================ */}

          <div
            className="
              relative
              z-10
              grid
              items-center
              gap-10
              lg:grid-cols-[0.8fr_1.2fr]
              lg:gap-16
            "
          >

            {/* ======================================================== */}
            {/* LEFT                                                       */}
            {/* ======================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                x: -40,
              }}
              animate={
                active
                  ? {
                      opacity: 1,
                      x: 0,
                    }
                  : {
                      opacity: 0.75,
                      x: 0,
                    }
              }
              transition={{
                duration: 0.5,
              }}
              className="
                relative
                z-20
              "
            >

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-black/55
                "
              >
                Collection
              </p>


              <h3
                className="
                  mt-4
                  font-display
                  text-5xl
                  font-extrabold
                  leading-[0.9]
                  tracking-tight
                  text-ink
                  md:text-7xl
                "
              >
                {category.name}
              </h3>


              <p
                className="
                  mt-6
                  max-w-md
                  text-base
                  leading-relaxed
                  text-black/65
                  md:text-lg
                "
              >
                {category.description}
              </p>


              <Link
                href={`/shop?category=${encodeURIComponent(
                  category.name,
                )}`}
                className="
                  group
                  mt-8
                  inline-flex
                  items-center
                  gap-3
                  rounded-full
                  bg-black
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:scale-105
                "
              >

                Explore {category.name}

                <ArrowUpRight
                  size={17}
                  className="
                    transition-transform
                    group-hover:translate-x-0.5
                    group-hover:-translate-y-0.5
                  "
                />

              </Link>

            </motion.div>


            {/* ======================================================== */}
            {/* RIGHT PRODUCT STACK                                       */}
            {/* ======================================================== */}

            <div
              className="
                relative
                min-h-[430px]
              "
            >

              {displayProducts.map(
                (
                  product,
                  productIndex,
                ) => (

                  <CategoryProduct
                    key={
                      `${product.id}-${productIndex}`
                    }
                    product={
                      product
                    }
                    index={
                      productIndex
                    }
                    active={
                      active
                    }
                  />

                ),
              )}

            </div>

          </div>

        </motion.div>

      </div>

    </section>

  );
}


// ============================================================================
// CATEGORY PRODUCT
// ============================================================================

type CategoryProductProps = {
  product: Product;
  index: number;
  active: boolean;
};


function CategoryProduct({
  product,
  index,
  active,
}: CategoryProductProps) {

  const pricing =
    priceFor(
      product,
      product.sizes[0],
    );


  const positions = [
    {
      top: "5%",
      left: "3%",
      rotate: -8,
      size: "size-24 md:size-32",
    },
    {
      top: "23%",
      left: "32%",
      rotate: 4,
      size: "size-40 md:size-52",
    },
    {
      bottom: "3%",
      right: "5%",
      rotate: -5,
      size: "size-32 md:size-44",
    },
  ];


  const position =
    positions[
      index %
      positions.length
    ];


  return (

    <motion.div
      initial={{
        opacity: 0,
        scale: 0.7,
        rotate:
          position.rotate - 8,
      }}
      animate={{
        opacity: active
          ? 1
          : 0.75,
        scale: active
          ? 1
          : 0.92,
        rotate:
          position.rotate,
      }}
      transition={{
        duration: 0.7,
        delay:
          index * 0.12,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="
        absolute
        z-10
      "
      style={{
        top:
          position.top,
        left:
          position.left,
        right:
          position.right,
        bottom:
          position.bottom,
      }}
    >

      <Link
        href={`/shop/${product.id}`}
        className="
          group
          block
        "
      >

        {/* ============================================================ */}
        {/* PRODUCT IMAGE                                                  */}
        {/* ============================================================ */}

        <div
          className={`
            relative
            overflow-hidden
            rounded-[24px]
            border-[6px]
            border-white
            bg-white
            shadow-[0_25px_50px_-15px_rgba(0,0,0,0.3)]
            transition-transform
            duration-500
            group-hover:scale-105
            ${position.size}
          `}
        >

          <StickerImage
            product={
              product
            }
          />

        </div>


        {/* ============================================================ */}
        {/* PRODUCT INFO CARD                                              */}
        {/* ============================================================ */}

        <div
          className="
            mt-3
            hidden
            min-w-[190px]
            rounded-2xl
            bg-black
            p-4
            text-white
            shadow-xl
            md:block
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <div>

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-white/50
                "
              >
                {product.category}
              </p>


              <h4
                className="
                  mt-1
                  text-sm
                  font-bold
                "
              >
                {product.name}
              </h4>

            </div>


            <span
              className="
                font-mono
                text-xs
                text-white/80
              "
            >
              ₹{pricing.price}
            </span>

          </div>

        </div>

      </Link>


      {/* ============================================================ */}
      {/* QUICK ADD                                                       */}
      {/* ============================================================ */}

      <Link
        href={`/shop/${product.id}`}
        aria-label={
          `View ${product.name}`
        }
        className="
          absolute
          -bottom-2
          -right-2
          flex
          size-10
          items-center
          justify-center
          rounded-full
          bg-white
          text-black
          shadow-lg
          transition
          hover:scale-110
        "
      >

        <Plus
          size={18}
        />

      </Link>

    </motion.div>

  );
}