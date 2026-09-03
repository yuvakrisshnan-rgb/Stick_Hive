"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  Search,
  Star,
} from "lucide-react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  motion,
  AnimatePresence,
} from "motion/react";

import {
  searchProducts,
  getSuggestions,
} from "@/lib/search-utils";



export default function ExpandableSearch() {


  const router = useRouter();



  // --------------------------------------------------
  // Search State
  // --------------------------------------------------

  const [active, setActive] =
    useState(false);


  const [query, setQuery] =
    useState("");



  // --------------------------------------------------
  // Refs
  // --------------------------------------------------

  const inputRef =
    useRef<HTMLInputElement>(null);


  const closeTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );



  // --------------------------------------------------
  // Search Results
  // --------------------------------------------------

  const results =
    searchProducts(query);


  const suggestions =
    getSuggestions(query);



  // --------------------------------------------------
  // Open Search
  // --------------------------------------------------

  function openSearch() {

    if (closeTimer.current) {

      clearTimeout(
        closeTimer.current
      );

      closeTimer.current = null;

    }

    setActive(true);

  }



  // --------------------------------------------------
  // Close Search
  // --------------------------------------------------

  function closeSearch() {

    if (closeTimer.current) {

      clearTimeout(
        closeTimer.current
      );

    }



    closeTimer.current =
      setTimeout(() => {

        setActive(false);

      }, 120);

  }



  // --------------------------------------------------
  // Focus Input
  // --------------------------------------------------

  useEffect(() => {

    if (active) {

      inputRef.current?.focus();

    }

  }, [active]);



  // --------------------------------------------------
  // Cleanup Timer
  // --------------------------------------------------

  useEffect(() => {

    return () => {

      if (closeTimer.current) {

        clearTimeout(
          closeTimer.current
        );

      }

    };

  }, []);



  // --------------------------------------------------
  // Search Submit
  // --------------------------------------------------

  function handleSearch(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {


    if (

      event.key === "Enter" &&

      query.trim()

    ) {


      router.push(

        `/shop?search=${encodeURIComponent(
          query.trim()
        )}`

      );


      setActive(false);

      setQuery("");

    }

  }



  // --------------------------------------------------
  // Suggestion Click
  // --------------------------------------------------

  function handleSuggestionClick(
    item: string
  ) {

    setQuery(item);

    setActive(true);

  }



  // --------------------------------------------------
  // Product Click
  // --------------------------------------------------

  function handleProductClick() {

    setActive(false);

    setQuery("");

  }



  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (

    <div

      className="
        relative
      "

      /*
        IMPORTANT:

        The hover area is now the ENTIRE
        search component.

        This means:

        Search bar
             ↓
        Suggestions
             ↓
        Products

        are treated as one hover zone.
      */

      onMouseEnter={openSearch}

      onMouseLeave={closeSearch}

    >



      {/* ------------------------------------------ */}
      {/* Search Bar */}
      {/* ------------------------------------------ */}

      <motion.div

        animate={{

          width:
            active
              ? 260
              : 40,

        }}

        transition={{

          duration: 0.25,

          ease: "easeOut",

        }}

        className="
          flex
          h-10
          items-center
          overflow-hidden
          rounded-full
          border
          border-black/10
          bg-white/70
          backdrop-blur-xl
        "

      >



        {/* Search Button */}

        <button

          type="button"

          onClick={openSearch}

          aria-label="Search"

          className="
            flex
            size-10
            shrink-0
            items-center
            justify-center
            rounded-full
            transition
            hover:bg-hive-yellow
          "

        >

          <Search size={18} />

        </button>



        {/* Input */}

        <input

          ref={inputRef}

          value={query}

          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }

          onKeyDown={handleSearch}

          placeholder="Search stickers..."

          aria-label="Search stickers"

          className="
            w-full
            bg-transparent
            pr-4
            text-sm
            font-medium
            outline-none
          "

        />

      </motion.div>





      {/* ------------------------------------------ */}
      {/* Search Results */}
      {/* ------------------------------------------ */}

      <AnimatePresence>

        {active && query && (

          <motion.div

            initial={{

              opacity: 0,

              y: -10,

              scale: 0.98,

            }}

            animate={{

              opacity: 1,

              y: 0,

              scale: 1,

            }}

            exit={{

              opacity: 0,

              y: -10,

              scale: 0.98,

            }}

            transition={{

              duration: 0.18,

            }}

            onMouseEnter={openSearch}

            onMouseLeave={closeSearch}

            className="
              absolute
              right-0
              top-14
              z-[300]
              w-80
              rounded-3xl
              border
              border-black/10
              bg-white
              p-4
              shadow-xl
            "

          >



            {/* ------------------------------------ */}
            {/* Suggestions */}
            {/* ------------------------------------ */}

            {suggestions.length > 0 && (

              <div>

                <p

                  className="
                    mb-3
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-black/40
                  "

                >

                  Suggestions

                </p>



                <div

                  className="
                    space-y-2
                  "

                >

                  {suggestions.map(
                    (item) => (

                      <button

                        key={item}

                        type="button"

                        onClick={() =>
                          handleSuggestionClick(
                            item
                          )
                        }

                        className="
                          block
                          text-left
                          text-sm
                          font-semibold
                          transition
                          hover:text-black/60
                          hover:underline
                        "

                      >

                        {item}

                      </button>

                    )
                  )}

                </div>

              </div>

            )}





            {/* ------------------------------------ */}
            {/* Products */}
            {/* ------------------------------------ */}

            <div

              className="
                mt-5
              "

            >

              <p

                className="
                  mb-3
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-black/40
                "

              >

                Products

              </p>



              <div

                className="
                  max-h-64
                  space-y-2
                  overflow-y-auto
                  pr-1
                "

              >


                {results.length > 0 ? (

                  results
                    .slice(0, 5)
                    .map(
                      (product) => (

                        <Link

                          key={product.id}

                          href={`/shop/${product.id}`}

                          onClick={
                            handleProductClick
                          }

                          className="
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            p-2
                            transition
                            hover:bg-black/5
                          "

                        >


                          {/* Product Icon */}

                          <div

                            className="
                              flex
                              size-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              text-xl
                            "

                            style={{

                              backgroundColor:
                                product.color,

                            }}

                          >

                            {product.emoji}

                          </div>



                          {/* Product Info */}

                          <div>

                            <p

                              className="
                                text-sm
                                font-bold
                              "

                            >

                              {product.name}

                            </p>



                            <div

                              className="
                                flex
                                items-center
                                gap-1
                                text-xs
                                text-black/50
                              "

                            >

                              <Star

                                size={12}

                                className="
                                  fill-honey-orange
                                  text-honey-orange
                                "

                              />

                              {product.rating}

                            </div>

                          </div>


                        </Link>

                      )
                    )

                ) : (

                  <p

                    className="
                      py-6
                      text-center
                      text-sm
                      text-black/40
                    "

                  >

                    No stickers found

                  </p>

                )}

              </div>

            </div>


          </motion.div>

        )}

      </AnimatePresence>


    </div>

  );

}