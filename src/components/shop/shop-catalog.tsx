"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  AnimatePresence,
  motion,
} from "motion/react"

import {
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react"

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"

import {
  PRODUCTS,
  type Category,
  type StickerSize,
} from "@/lib/product-data"

import {
  ProductCard,
} from "@/components/products/product-card"


// ============================================================================
// TYPES
// ============================================================================

type SortOption =
  | "newest"
  | "oldest"
  | "best-sellers"
  | "top-rated"
  | "price-asc"
  | "price-desc"


// ============================================================================
// FILTER DATA
// ============================================================================

const CATEGORIES: Category[] = [
  "Anime",
  "Marvel",
  "DC",
  "Gaming",
  "Nature",
  "Cute",
  "Aesthetic",
  "Memes",
  "Movies",
  "Series",
  "Technology",
  "Sports",
  "Custom",
]


const SIZES: StickerSize[] = [
  "Small",
  "Medium",
  "Large",
]


const SORT_OPTIONS: {
  value: SortOption
  label: string
}[] = [
  {
    value: "newest",
    label: "Newest arrivals",
  },
  {
    value: "oldest",
    label: "Oldest first",
  },
  {
    value: "best-sellers",
    label: "Best sellers",
  },
  {
    value: "top-rated",
    label: "Highest rated",
  },
  {
    value: "price-asc",
    label: "Price: Low to High",
  },
  {
    value: "price-desc",
    label: "Price: High to Low",
  },
]


// ============================================================================
// SHOP CATALOG
// ============================================================================

export default function ShopCatalog() {

  const router = useRouter()

  const pathname = usePathname()

  const searchParams = useSearchParams()


  // ==========================================================================
  // CATEGORY RAIL
  // ==========================================================================

  const categoryRailRef =
    useRef<HTMLDivElement>(null)


  // ==========================================================================
  // URL SEARCH
  // ==========================================================================

  const urlSearch =
    searchParams.get("search") ?? ""


  const [search, setSearch] =
    useState(urlSearch)


  // ==========================================================================
  // FILTER STATE
  // ==========================================================================

  const [category, setCategory] =
    useState<Category | "All">("All")


  const [size, setSize] =
    useState<StickerSize | "All">("All")


  const [sort, setSort] =
    useState<SortOption>("newest")


  const [premiumOnly, setPremiumOnly] =
    useState(false)


  const [offersOnly, setOffersOnly] =
    useState(false)


  const [filtersOpen, setFiltersOpen] =
    useState(false)


  // ==========================================================================
  // SYNCHRONIZE SEARCH WITH NAVBAR / URL
  // ==========================================================================

  useEffect(() => {

    setSearch(urlSearch)

  }, [urlSearch])


  // ==========================================================================
  // FILTER + SORT PRODUCTS
  // ==========================================================================

  const filteredProducts = useMemo(() => {

    const query =
      search
        .trim()
        .toLowerCase()


    let result =
      PRODUCTS.filter((product) => {

        // ----------------------------------------------------------------------
        // SEARCH
        // ----------------------------------------------------------------------

        if (query) {

          const searchableText = [

            product.name,

            product.category,

            product.collection ?? "",

            ...product.tags,

          ]
            .join(" ")
            .toLowerCase()


          if (
            !searchableText.includes(query)
          ) {

            return false

          }

        }


        // ----------------------------------------------------------------------
        // CATEGORY
        // ----------------------------------------------------------------------

        if (
          category !== "All" &&
          product.category !== category
        ) {

          return false

        }


        // ----------------------------------------------------------------------
        // SIZE
        // ----------------------------------------------------------------------

        if (
          size !== "All" &&
          !product.sizes.includes(size)
        ) {

          return false

        }


        // ----------------------------------------------------------------------
        // PREMIUM
        // ----------------------------------------------------------------------

        if (
          premiumOnly &&
          !product.isPremium
        ) {

          return false

        }


        // ----------------------------------------------------------------------
        // OFFERS
        // ----------------------------------------------------------------------

        if (
          offersOnly &&
          !product.offer
        ) {

          return false

        }


        return true

      })


    // ==========================================================================
    // SORT
    // ==========================================================================

    result = [
      ...result,
    ].sort((a, b) => {

      switch (sort) {

        case "newest":

          return (
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime()
          )


        case "oldest":

          return (
            new Date(
              a.createdAt,
            ).getTime() -
            new Date(
              b.createdAt,
            ).getTime()
          )


        case "best-sellers":

          return (
            b.salesCount -
            a.salesCount
          )


        case "top-rated":

          return (
            b.rating -
            a.rating
          )


        case "price-asc":

          return (
            getStartingPrice(a) -
            getStartingPrice(b)
          )


        case "price-desc":

          return (
            getStartingPrice(b) -
            getStartingPrice(a)
          )


        default:

          return 0

      }

    })


    return result

  }, [
    search,
    category,
    size,
    sort,
    premiumOnly,
    offersOnly,
  ])


  // ==========================================================================
  // ACTIVE FILTER COUNT
  // ==========================================================================

  const activeFilterCount =
    Number(category !== "All") +
    Number(size !== "All") +
    Number(premiumOnly) +
    Number(offersOnly)


  // ==========================================================================
  // CLEAR ALL FILTERS
  // ==========================================================================

  function clearFilters() {

    setSearch("")

    setCategory("All")

    setSize("All")

    setPremiumOnly(false)

    setOffersOnly(false)


    const params =
      new URLSearchParams(
        searchParams.toString(),
      )


    params.delete("search")


    const queryString =
      params.toString()


    const newUrl =
      queryString
        ? `${pathname}?${queryString}`
        : pathname


    router.replace(
      newUrl,
      {
        scroll: false,
      },
    )

  }


  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (

    <main
      className="
        min-h-screen
        bg-background
        pb-24
      "
    >

      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}

      <section
        className="
          relative
          overflow-hidden
          px-5
          pb-12
          pt-36
          sm:px-8
          lg:pb-16
          lg:pt-40
        "
      >

        {/* Decorative background */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-[500px]
            w-[700px]
            -translate-x-1/2
            rounded-full
            bg-hive-yellow/25
            blur-[100px]
          "
        />


        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-[-100px]
            top-[100px]
            size-[300px]
            rounded-full
            bg-mint/30
            blur-[80px]
          "
        />


        <div
          className="
            relative
            mx-auto
            max-w-6xl
          "
        >

          {/* ==============================================================
              HERO CONTENT
          ============================================================== */}

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
              max-w-3xl
            "
          >

            <span
              className="
                inline-flex
                rounded-full
                bg-ink
                px-4
                py-2
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-white
              "
            >
              The Sticker Shelf
            </span>


            <h1
              className="
                mt-6
                font-display
                text-5xl
                font-extrabold
                leading-[0.95]
                tracking-[-0.05em]
                text-ink
                sm:text-6xl
                lg:text-8xl
              "
            >

              Find something

              <br />

              worth sticking.

            </h1>


            <p
              className="
                mt-6
                max-w-xl
                text-base
                leading-relaxed
                text-black/55
                sm:text-lg
              "
            >
              Explore the StickHive collection — from
              tiny everyday favourites to premium
              limited-edition drops.
            </p>

          </motion.div>

        </div>

      </section>


      {/* ================================================================== */}
      {/* SHOP CONTROLS                                                      */}
      {/* ================================================================== */}

      <section
        className="
          sticky
          top-0
          z-30
          border-y
          border-black/8
          bg-[#fff8ed]/90
          backdrop-blur-xl
        "
      >

        <div
          className="
            mx-auto
            max-w-6xl
            px-5
            sm:px-8
          "
        >

          {/* ==============================================================
              CATEGORY RAIL
          ============================================================== */}

          <div
            ref={categoryRailRef}
            onWheel={(event) => {

              const rail =
                categoryRailRef.current

              if (!rail) return


              const delta =
                Math.abs(event.deltaX) >
                Math.abs(event.deltaY)
                  ? event.deltaX
                  : event.deltaY


              if (delta === 0) return


              event.preventDefault()


              rail.scrollLeft += delta

            }}
            className="
              flex
              w-full
              max-w-full
              gap-2
              overflow-x-auto
              overflow-y-hidden
              py-4
              overscroll-x-contain
              scroll-smooth
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >

            <CategoryButton
              active={
                category === "All"
              }
              onClick={() =>
                setCategory("All")
              }
            >
              All stickers
            </CategoryButton>


            {CATEGORIES.map(
              (item) => (

                <CategoryButton
                  key={item}
                  active={
                    category === item
                  }
                  onClick={() =>
                    setCategory(item)
                  }
                >
                  {item}
                </CategoryButton>

              ),
            )}

          </div>


          {/* ==============================================================
              LOWER CONTROLS
          ============================================================== */}

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              border-t
              border-black/6
              py-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <button
                type="button"
                onClick={() =>
                  setFiltersOpen(
                    !filtersOpen,
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  px-4
                  py-2
                  text-xs
                  font-bold
                  transition
                  hover:bg-hive-yellow
                "
              >

                <SlidersHorizontal
                  size={15}
                />

                Filters

                {activeFilterCount > 0 && (

                  <span
                    className="
                      flex
                      size-5
                      items-center
                      justify-center
                      rounded-full
                      bg-ink
                      text-[10px]
                      text-white
                    "
                  >
                    {activeFilterCount}
                  </span>

                )}

              </button>


              <span
                className="
                  hidden
                  text-xs
                  font-medium
                  text-black/40
                  sm:block
                "
              >

                {filteredProducts.length}{" "}

                {
                  filteredProducts.length === 1
                    ? "sticker"
                    : "stickers"
                }

              </span>

            </div>


            {/* ============================================================
                SORT
            ============================================================ */}

            <div
              className="
                relative
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  hidden
                  text-xs
                  font-medium
                  text-black/40
                  sm:block
                "
              >
                Sort
              </span>


              <div
                className="
                  relative
                "
              >

                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(
                      event.target.value as SortOption,
                    )
                  }}
                  className="
                    h-9
                    appearance-none
                    rounded-full
                    border
                    border-black/10
                    bg-white
                    py-0
                    pl-4
                    pr-9
                    text-xs
                    font-bold
                    outline-none
                    transition
                    hover:bg-hive-yellow
                  "
                >

                  {SORT_OPTIONS.map(
                    (option) => (

                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>

                    ),
                  )}

                </select>


                <ChevronDown
                  size={14}
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                  "
                />

              </div>

            </div>

          </div>


          {/* ==============================================================
              FILTER PANEL
          ============================================================== */}

          <AnimatePresence>

            {filtersOpen && (

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
                className="
                  overflow-hidden
                "
              >

                <div
                  className="
                    grid
                    gap-5
                    border-t
                    border-black/6
                    py-5
                    sm:grid-cols-3
                  "
                >

                  {/* ======================================================
                      SIZE
                  ====================================================== */}

                  <FilterGroup title="Size">

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-2
                      "
                    >

                      <FilterPill
                        active={
                          size === "All"
                        }
                        onClick={() =>
                          setSize("All")
                        }
                      >
                        Any size
                      </FilterPill>


                      {SIZES.map(
                        (item) => (

                          <FilterPill
                            key={item}
                            active={
                              size === item
                            }
                            onClick={() =>
                              setSize(item)
                            }
                          >
                            {item}
                          </FilterPill>

                        ),
                      )}

                    </div>

                  </FilterGroup>


                  {/* ======================================================
                      COLLECTION
                  ====================================================== */}

                  <FilterGroup title="Collection">

                    <div
                      className="
                        flex
                        flex-col
                        gap-2
                      "
                    >

                      <ToggleRow
                        checked={
                          premiumOnly
                        }
                        onChange={
                          setPremiumOnly
                        }
                        label="Premium stickers"
                      />


                      <ToggleRow
                        checked={
                          offersOnly
                        }
                        onChange={
                          setOffersOnly
                        }
                        label="On offer"
                      />

                    </div>

                  </FilterGroup>


                  {/* ======================================================
                      CLEAR
                  ====================================================== */}

                  <div
                    className="
                      flex
                      items-end
                    "
                  >

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        px-4
                        py-2
                        text-xs
                        font-bold
                        text-black/50
                        transition
                        hover:bg-black/5
                        hover:text-ink
                      "
                    >

                      <X size={14} />

                      Clear all filters

                    </button>

                  </div>

                </div>

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </section>


      {/* ================================================================== */}
      {/* PRODUCT GRID                                                        */}
      {/* ================================================================== */}

      <section
        className="
          mx-auto
          max-w-6xl
          px-5
          py-10
          sm:px-8
          lg:py-14
        "
      >

        {/* Mobile result count */}

        <div
          className="
            mb-5
            text-xs
            font-medium
            text-black/40
            sm:hidden
          "
        >

          {filteredProducts.length}{" "}

          {
            filteredProducts.length === 1
              ? "sticker"
              : "stickers"
          }

        </div>


        {filteredProducts.length > 0 ? (

          <motion.div
            layout
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >

            <AnimatePresence
              mode="popLayout"
            >

              {filteredProducts.map(
                (
                  product,
                  index,
                ) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />

                ),
              )}

            </AnimatePresence>

          </motion.div>

        ) : (

          <EmptyResults
            search={search}
            onClear={clearFilters}
          />

        )}

      </section>

    </main>

  )

}


// ============================================================================
// CATEGORY BUTTON
// ============================================================================

function CategoryButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0
        whitespace-nowrap
        rounded-full
        px-4
        py-2
        text-xs
        font-bold
        transition-all
        ${
          active
            ? "scale-105 bg-[#111111] text-white shadow-md"
            : "bg-white text-black/60 hover:bg-hive-yellow hover:text-ink"
        }
      `}
    >
      {children}
    </button>

  )

}


// ============================================================================
// FILTER GROUP
// ============================================================================

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {

  return (

    <div>

      <h3
        className="
          mb-3
          text-xs
          font-extrabold
          uppercase
          tracking-[0.15em]
          text-black/40
        "
      >
        {title}
      </h3>

      {children}

    </div>

  )

}


// ============================================================================
// FILTER PILL
// ============================================================================

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-bold
        transition
        ${
          active
            ? "border-ink bg-ink text-white"
            : "border-black/10 bg-white text-black/55 hover:border-hive-yellow hover:bg-hive-yellow hover:text-ink"
        }
      `}
    >
      {children}
    </button>

  )

}


// ============================================================================
// TOGGLE
// ============================================================================

function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {

  return (

    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-xl
        px-2
        py-1.5
        text-left
        transition
        hover:bg-black/[0.03]
      "
    >

      <span
        className="
          text-sm
          font-medium
          text-black/65
        "
      >
        {label}
      </span>


      <span
        className={`
          relative
          h-6
          w-11
          rounded-full
          transition
          ${
            checked
              ? "bg-ink"
              : "bg-black/10"
          }
        `}
      >

        <span
          className={`
            absolute
            left-1
            top-1
            size-4
            rounded-full
            bg-white
            shadow-sm
            transition-transform
            ${
              checked
                ? "translate-x-5"
                : ""
            }
          `}
        />

      </span>

    </button>

  )

}


// ============================================================================
// EMPTY RESULTS
// ============================================================================

function EmptyResults({
  search,
  onClear,
}: {
  search: string
  onClear: () => void
}) {

  return (

    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        flex
        min-h-[400px]
        flex-col
        items-center
        justify-center
        rounded-[2rem]
        border
        border-dashed
        border-black/10
        bg-white/50
        px-6
        text-center
      "
    >

      <div
        className="
          flex
          size-20
          items-center
          justify-center
          rounded-[1.5rem]
          bg-hive-yellow
          text-4xl
        "
      >
        🐝
      </div>


      <h2
        className="
          mt-5
          font-display
          text-2xl
          font-extrabold
          text-ink
        "
      >
        No stickers found.
      </h2>


      <p
        className="
          mt-2
          max-w-md
          text-sm
          leading-relaxed
          text-black/45
        "
      >

        {search.trim()
          ? `We couldn't find anything matching "${search.trim()}". Try another keyword or clear your filters.`
          : "Try changing your filters to discover more stickers."
        }

      </p>


      <button
        type="button"
        onClick={onClear}
        className="
          mt-5
          rounded-full
          bg-ink
          px-6
          py-3
          text-sm
          font-bold
          text-white
          transition
          hover:scale-105
        "
      >
        Show all stickers
      </button>

    </motion.div>

  )

}


// ============================================================================
// PRICE HELPER
// ============================================================================

function getStartingPrice(
  product: (typeof PRODUCTS)[number],
) {

  const prices =
    product.sizes.map(
      (size) => {

        const base =
          size === "Small"
            ? 20
            : size === "Medium"
              ? 25
              : 30


        const premium =
          product.isPremium
            ? 10
            : 0


        const beforeOffer =
          base + premium


        if (product.offer) {

          return Math.round(
            beforeOffer -
            (
              beforeOffer *
              product.offer
            ) /
              100,
          )

        }


        return beforeOffer

      },
    )


  return Math.min(...prices)

}