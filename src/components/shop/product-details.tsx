"use client";

import { useMemo, useState } from "react";

import {
  Heart,
  ShoppingBag,
  Star,
  Check,
} from "lucide-react";

import {
  priceFor,
  type Product,
  type StickerSize,
} from "@/lib/product-data";

import { StickerImage } from "@/components/shop/sticker-image";

import { useShop } from "@/components/shop/store-provider";

import RelatedProducts from "@/components/shop/related-products";


export default function ProductDetails({
  product,
}: {
  product: Product;
}) {

  // ==========================================
  // SHOP CONTEXT
  // ==========================================

  const {
    addToCart,
    openCart,
    isWishlisted,
    toggleWishlist,
  } = useShop();


  // ==========================================
  // SIZE
  // ==========================================

  const [size, setSize] = useState<StickerSize>(
    product.sizes[0]
  );


  // ==========================================
  // ADD TO CART FEEDBACK
  // ==========================================

  const [added, setAdded] = useState(false);


  // ==========================================
  // WISHLIST
  // ==========================================

  const wishlisted = isWishlisted(
    product.id
  );


  // ==========================================
  // PRODUCT GALLERY
  // ==========================================

  /*
   * The gallery supports both:
   *
   * 1. New products with `images[]`
   * 2. Existing products with only `image`
   *
   * This means your current catalogue keeps
   * working without modification.
   *
   * Later, Supabase can simply provide:
   *
   * images: [
   *   "image-1-url",
   *   "image-2-url",
   *   "image-3-url"
   * ]
   */

  const galleryImages = useMemo(() => {

    if (
      product.images &&
      product.images.length > 0
    ) {

      return product.images;

    }

    if (product.image) {

      return [product.image];

    }

    return [];

  }, [
    product.images,
    product.image,
  ]);


  const [
    selectedImage,
    setSelectedImage,
  ] = useState(
    galleryImages[0] ?? null
  );


  /*
   * If the product changes while navigating
   * between products, make sure the selected
   * image always belongs to the current product.
   */

  const activeImage =
    galleryImages.includes(
      selectedImage ?? ""
    )
      ? selectedImage
      : galleryImages[0] ?? null;


  // ==========================================
  // PRICE
  // ==========================================

  const {
    price,
    original,
  } = priceFor(
    product,
    size
  );


  // ==========================================
  // ADD TO CART
  // ==========================================

  function handleAddToCart() {

    if (!product.inStock) {
      return;
    }


    addToCart(
      product.id,
      size,
      1
    );


    setAdded(true);


    // Open the existing cart drawer

    openCart();


    setTimeout(() => {
      setAdded(false);
    }, 1200);

  }


  // ==========================================
  // WISHLIST
  // ==========================================

  function handleWishlist() {

    toggleWishlist(
      product.id
    );

  }


  return (

    <main
      className="
        min-h-screen
        bg-cream
        px-5
        pb-24
        pt-32
        sm:px-8
      "
    >

      {/* ======================================
          MAIN PRODUCT AREA
      ====================================== */}

      <div
        className="
          mx-auto
          grid
          max-w-6xl
          items-start
          gap-8
          lg:grid-cols-2
          lg:gap-12
        "
      >

        {/* ====================================
            LEFT — PRODUCT GALLERY
        ==================================== */}

        <div
          className="
            relative
          "
        >

          {/* ==================================
              MAIN IMAGE CARD
          ================================== */}

          <div
            className="
              relative
              flex
              min-h-[420px]
              items-center
              justify-center
              overflow-hidden
              rounded-[2rem]
              bg-white
              p-6
              shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)]
              sm:min-h-[520px]
            "
          >

            {/* Premium Badge */}

            {product.isPremium && (

              <span
                className="
                  absolute
                  left-6
                  top-6
                  z-20
                  rounded-full
                  bg-black
                  px-4
                  py-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-white
                "
              >
                Premium Vinyl
              </span>

            )}


            {/* Offer Badge */}

            {product.offer && (

              <span
                className="
                  absolute
                  right-6
                  top-6
                  z-20
                  rounded-full
                  bg-honey-orange
                  px-4
                  py-2
                  text-xs
                  font-bold
                  text-white
                "
              >
                -{product.offer}%
              </span>

            )}


            {/* =================================
                ACTIVE PRODUCT IMAGE
            ================================= */}

            <div
              className="
                flex
                w-full
                items-center
                justify-center
              "
            >

              {activeImage ? (

                <StickerImage
                  product={{
                    ...product,
                    image: activeImage,
                  }}
                />

              ) : (

                <div
                  className="
                    flex
                    size-64
                    items-center
                    justify-center
                    rounded-full
                    bg-hive-yellow
                    text-7xl
                  "
                >
                  {product.emoji ?? "🐝"}
                </div>

              )}

            </div>

          </div>


          {/* ==================================
              IMAGE THUMBNAILS
          ================================== */}

          {galleryImages.length > 1 && (

            <div
              className="
                mt-4
                flex
                gap-3
                overflow-x-auto
                pb-2
              "
            >

              {galleryImages.map(
                (
                  image,
                  index
                ) => {

                  const active =
                    image ===
                    activeImage;


                  return (

                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                      aria-label={`View product image ${index + 1}`}
                      aria-pressed={active}
                      className={`
                        relative
                        flex
                        size-20
                        shrink-0
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-2xl
                        bg-white
                        p-2
                        transition-all
                        sm:size-24

                        ${
                          active
                            ? "border-2 border-black shadow-md"
                            : "border border-black/10 hover:border-black/30"
                        }
                      `}
                    >

                      <StickerImage
                        product={{
                          ...product,
                          image,
                        }}
                      />

                    </button>

                  );

                }
              )}

            </div>

          )}

        </div>



        {/* ====================================
            RIGHT — PRODUCT DETAILS
        ==================================== */}

        <div
          className="
            overflow-visible
            rounded-[2rem]
            bg-white
            p-6
            shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)]
            sm:p-8
          "
        >

          {/* ==================================
              TOP ROW
          ================================== */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            <div>

              {product.isPremium && (

                <span
                  className="
                    inline-flex
                    rounded-full
                    bg-black
                    px-3
                    py-1
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  Premium Vinyl
                </span>

              )}

            </div>


            {/* Wishlist */}

            <button
              type="button"
              onClick={handleWishlist}
              aria-label={
                wishlisted
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
              aria-pressed={wishlisted}
              className="
                flex
                size-11
                items-center
                justify-center
                rounded-full
                border
                border-black/10
                bg-white
                transition
                hover:scale-105
                hover:bg-black/5
              "
            >

              <Heart
                size={20}
                className={
                  wishlisted
                    ? "fill-honey-orange text-honey-orange"
                    : "text-black/70"
                }
              />

            </button>

          </div>



          {/* ==================================
              PRODUCT NAME
          ================================== */}

          <h1
            className="
              mt-6
              text-3xl
              font-extrabold
              leading-tight
              text-ink
              sm:text-4xl
            "
          >
            {product.name}
          </h1>



          {/* ==================================
              CATEGORY + COLLECTION
          ================================== */}

          <p
            className="
              mt-2
              text-sm
              font-medium
              text-black/50
            "
          >
            {product.category}

            {product.collection
              ? ` • ${product.collection}`
              : ""}
          </p>



          {/* ==================================
              RATING
          ================================== */}

          <div
            className="
              mt-5
              flex
              items-center
              gap-2
            "
          >

            <Star
              size={18}
              className="
                fill-honey-orange
                text-honey-orange
              "
            />

            <span
              className="
                font-bold
                text-black
              "
            >
              {product.rating}
            </span>

            <span
              className="
                text-sm
                text-black/40
              "
            >
              ({product.reviews} reviews)
            </span>

          </div>



          {/* ==================================
              DESCRIPTION
          ================================== */}

          <p
            className="
              mt-6
              max-w-xl
              text-[15px]
              leading-7
              text-black/60
            "
          >
            {product.description}
          </p>



          {/* ==================================
              PRODUCT BENEFITS
          ================================== */}

          <div
            className="
              mt-6
              grid
              grid-cols-2
              gap-3
            "
          >

            <div
              className="
                rounded-2xl
                bg-cream
                px-4
                py-3
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                "
              >
                ✓ Water Resistant
              </p>

            </div>


            <div
              className="
                rounded-2xl
                bg-cream
                px-4
                py-3
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                "
              >
                ✓ Premium Finish
              </p>

            </div>

          </div>



          {/* ==================================
              SIZE SELECTOR
          ================================== */}

          <div
            className="
              mt-8
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <h3
                className="
                  font-bold
                  text-black
                "
              >
                Choose Size
              </h3>

              <span
                className="
                  text-right
                  text-sm
                  text-black/40
                "
              >
                Selected: {size}
              </span>

            </div>


            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-2
              "
            >

              {product.sizes.map(
                (item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setSize(item)
                    }
                    aria-pressed={
                      size === item
                    }
                    className={`
                      rounded-full
                      px-5
                      py-2.5
                      text-sm
                      font-bold
                      transition

                      ${
                        size === item
                          ? "bg-black text-white shadow-md"
                          : "bg-black/5 text-black/60 hover:bg-hive-yellow hover:text-black"
                      }
                    `}
                  >
                    {item}
                  </button>

                )
              )}

            </div>

          </div>



          {/* ==================================
              PRICE
          ================================== */}

          <div
            className="
              mt-8
              border-t
              border-black/10
              pt-6
            "
          >

            <div
              className="
                flex
                items-end
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-black/40
                  "
                >
                  Price
                </p>


                <div
                  className="
                    mt-1
                    flex
                    items-baseline
                    gap-3
                  "
                >

                  <span
                    className="
                      text-4xl
                      font-extrabold
                      tracking-tight
                      text-ink
                    "
                  >
                    ₹{price}
                  </span>


                  {original && (

                    <span
                      className="
                        text-base
                        font-medium
                        text-black/35
                        line-through
                      "
                    >
                      ₹{original}
                    </span>

                  )}

                </div>

              </div>


              {product.offer && (

                <span
                  className="
                    rounded-full
                    bg-honey-orange/10
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-honey-orange
                  "
                >
                  Save {product.offer}%
                </span>

              )}

            </div>

          </div>



          {/* ==================================
              ADD TO CART
          ================================== */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`
              mt-7
              flex
              min-h-[56px]
              w-full
              items-center
              justify-center
              gap-3
              rounded-full
              px-6
              py-4
              text-base
              font-bold
              text-white
              shadow-lg
              transition

              ${
                product.inStock
                  ? added
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-black hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                  : "cursor-not-allowed bg-black/30"
              }
            `}
          >

            {added ? (

              <>
                <Check
                  size={20}
                />

                Added To Cart

              </>

            ) : (

              <>
                <ShoppingBag
                  size={20}
                />

                {product.inStock
                  ? "Add To Cart"
                  : "Out of Stock"}

              </>

            )}

          </button>



          {/* ==================================
              STOCK STATUS
          ================================== */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-center
              gap-2
              text-sm
              text-black/50
            "
          >

            <span
              className={`
                size-2
                rounded-full

                ${
                  product.inStock
                    ? "bg-green-500"
                    : "bg-red-500"
                }
              `}
            />

            {product.inStock
              ? "In stock • Ready to ship"
              : "Currently unavailable"}

          </div>


        </div>

      </div>


      {/* ======================================
          RELATED PRODUCTS
      ====================================== */}

      <RelatedProducts
        product={product}
      />

    </main>

  );
}