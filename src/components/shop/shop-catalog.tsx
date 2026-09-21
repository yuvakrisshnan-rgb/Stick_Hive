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
  Check,
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
  type Category,
  type Product,
  type StickerSize,
} from "@/lib/product-data"

import {
  ProductCard,
} from "@/components/products/product-card"

import ShopAmbientBackground from "@/components/shop/ambient-background"


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

// The live shop now reads from D1's products table (see
// backend/products/service.ts), so the 6 real sticker-intake categories
// (Bollywood, BTS, flower stickers, Meme stickers, Rick and Morty,
// Stickers with dialogues) have real products behind them and are
// included below - this filter list previously excluded them on purpose
// while the catalogue was still the static array.
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
  "Bollywood",
  "BTS",
  "flower stickers",
  "Meme stickers",
  "Rick and Morty",
  "Stickers with dialogues",
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

export default function ShopCatalog({
  products,
}: {
  products: Product[]
}) {

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
      products.filter((product) => {

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
    products,
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

      <ShopAmbientBackground />

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
                font-headline
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
                      bg-honey-orange
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


              <SortDropdown
                value={sort}
                onChange={setSort}
              />

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
            ? "scale-105 bg-honey-orange text-white shadow-md"
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
            ? "border-honey-orange bg-honey-orange text-white"
            : "border-black/10 bg-white text-black/55 hover:border-hive-yellow hover:bg-hive-yellow hover:text-ink"
        }
      `}
    >
      {children}
    </button>

  )

}


// ============================================================================
// SORT DROPDOWN
// ============================================================================
// A custom listbox replacing the native <select>, so its open panel can be
// styled to match the rest of the page. Follows the WAI-ARIA "listbox"
// pattern: the trigger is a button, the open panel itself receives focus
// and owns arrow-key navigation via aria-activedescendant, rather than
// moving focus between individual options.

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {

  const [isOpen, setIsOpen] = useState(false)

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      SORT_OPTIONS.findIndex((option) => option.value === value),
    ),
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listboxRef = useRef<HTMLDivElement | null>(null)

  const selectedOption =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]

  function openDropdown() {
    setActiveIndex(
      Math.max(
        0,
        SORT_OPTIONS.findIndex((option) => option.value === value),
      ),
    )
    setIsOpen(true)
  }

  function closeDropdown(refocusButton: boolean) {
    setIsOpen(false)
    if (refocusButton) {
      buttonRef.current?.focus()
    }
  }

  function selectOption(option: SortOption) {
    onChange(option)
    closeDropdown(true)
  }

  // Focus the listbox itself once it opens, so arrow keys work immediately
  // without an extra click/tab.
  useEffect(() => {
    if (isOpen) {
      listboxRef.current?.focus()
    }
  }, [isOpen])

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (

    <div
      ref={containerRef}
      className="
        relative
      "
    >

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() =>
          isOpen ? closeDropdown(false) : openDropdown()
        }
        className="
          flex
          h-9
          items-center
          gap-2
          rounded-full
          border
          border-black/10
          bg-white
          pl-4
          pr-3
          text-xs
          font-bold
          outline-none
          transition
          hover:bg-hive-yellow
        "
      >
        {selectedOption.label}

        <ChevronDown
          size={14}
          className={`
            transition-transform
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>


      <AnimatePresence>

        {isOpen && (

          <motion.div
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              `sort-option-${SORT_OPTIONS[activeIndex].value}`
            }
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowDown":
                  event.preventDefault()
                  setActiveIndex(
                    (current) => (current + 1) % SORT_OPTIONS.length,
                  )
                  break
                case "ArrowUp":
                  event.preventDefault()
                  setActiveIndex(
                    (current) =>
                      (current - 1 + SORT_OPTIONS.length) %
                      SORT_OPTIONS.length,
                  )
                  break
                case "Home":
                  event.preventDefault()
                  setActiveIndex(0)
                  break
                case "End":
                  event.preventDefault()
                  setActiveIndex(SORT_OPTIONS.length - 1)
                  break
                case "Enter":
                case " ":
                  event.preventDefault()
                  selectOption(SORT_OPTIONS[activeIndex].value)
                  break
                case "Escape":
                  event.preventDefault()
                  closeDropdown(true)
                  break
                case "Tab":
                  closeDropdown(false)
                  break
                default:
                  break
              }
            }}
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            transition={{
              duration: 0.15,
              ease: "easeOut",
            }}
            className="
              absolute
              right-0
              top-[calc(100%+8px)]
              z-40
              w-56
              overflow-hidden
              rounded-2xl
              border
              border-black/10
              bg-white
              p-1.5
              shadow-xl
              outline-none
            "
          >

            {SORT_OPTIONS.map((option, index) => {

              const isSelected = option.value === value
              const isActive = index === activeIndex

              return (

                <div
                  key={option.value}
                  id={`sort-option-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value)}
                  className={`
                    flex
                    cursor-pointer
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    transition
                    ${isActive ? "bg-black/5" : ""}
                    ${isSelected ? "text-ink" : "text-black/65"}
                  `}
                >
                  {option.label}

                  {isSelected && (
                    <Check
                      size={14}
                      className="
                        shrink-0
                        text-honey-orange
                      "
                    />
                  )}
                </div>

              )

            })}

          </motion.div>

        )}

      </AnimatePresence>

    </div>

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
              ? "bg-honey-orange"
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
  product: Product,
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