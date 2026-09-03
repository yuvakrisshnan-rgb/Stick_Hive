"use client";


import {
  useState,
} from "react";


import Link from "next/link";


import {
  AnimatePresence,
  motion,
} from "motion/react";


import {
  Menu,
  ShoppingBag,
  UserRound,
  Package,
  Heart,
  Settings,
  X,
} from "lucide-react";


import {
  useShop,
} from "@/components/shop/store-provider";


import ExpandableSearch from "@/components/search/expandable-search";






export default function Navbar() {



  const [open,setOpen] =

    useState(false);





  const [accountOpen,setAccountOpen] =

    useState(false);






  // ----------------------------------------
  // Hydration Fix
  // ----------------------------------------


  const mounted =

  typeof window !== "undefined";


  const {

    cartCount,

    openCart,

  } = useShop();









  const links = [


    {

      name:"Shop",

      href:"/shop",

    },




    {

      name:"Custom Stickers",

      href:"/custom-sticker",

    },




    {

      name:"About",

      href:"/about",

    },


  ];


  return (

    <header

      className="
        fixed
        top-12
        z-50
        w-full
        px-4
      "

    >

      <nav

        className="
          mx-auto
          flex
          max-w-6xl
          items-center
          justify-between
          rounded-full
          border
          border-white/40
          bg-white/80
          px-5
          py-3
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          backdrop-blur-xl
        "

      >


        {/* ---------------------------------------- */}
        {/* Logo */}
        {/* ---------------------------------------- */}


        <motion.div

          whileHover={{
            scale:1.05,
          }}

          className="
            flex
            items-center
            gap-2
          "

        >


          <Link

            href="/"

            className="
              flex
              items-center
              gap-2
            "

          >


            <div

              className="
                flex
                size-9
                items-center
                justify-center
                rounded-full
                bg-hive-yellow
                text-lg
              "

            >

              🐝


            </div>



            <span

              className="
                font-display
                text-xl
                font-extrabold
                tracking-tight
                text-ink
              "

            >

              StickHive


            </span>



          </Link>


        </motion.div>









        {/* ---------------------------------------- */}
        {/* Desktop Navigation */}
        {/* ---------------------------------------- */}


        <div

          className="
            hidden
            items-center
            gap-2
            md:flex
          "

        >



          {links.map((link)=>(


            <Link

              key={link.name}

              href={link.href}

              className="
                group
                relative
                rounded-full
                px-4
                py-2
                text-sm
                font-semibold
                text-black/70
                transition
              "

            >



              <span

                className="
                  absolute
                  inset-0
                  -z-10
                  scale-75
                  rounded-full
                  bg-hive-yellow
                  opacity-0
                  transition-all
                  duration-300
                  group-hover:scale-100
                  group-hover:opacity-100
                "

              />



              {link.name}



            </Link>


          ))}



        </div>









        {/* ---------------------------------------- */}
        {/* Actions */}
        {/* ---------------------------------------- */}


        <div

          className="
            flex
            items-center
            gap-2
          "

        >



          {/* Search */}


          <div

            className="
              hidden
              md:block
            "

          >

            <ExpandableSearch />

          </div>









          {/* CART */}


          <button

            onClick={openCart}

            aria-label="Open cart"

            className="
              relative
              flex
              size-10
              items-center
              justify-center
              rounded-full
              transition
              hover:bg-hive-yellow
            "

          >


            <ShoppingBag size={19}/>





            {/* Cart Count */}


            {

              mounted && cartCount > 0 && (


                <AnimatePresence

                  mode="popLayout"

                >



                  <motion.span


                    key={cartCount}


                    initial={{

                      scale:0.4,

                      opacity:0,

                    }}



                    animate={{

                      scale:1,

                      opacity:1,

                    }}



                    exit={{

                      scale:0.4,

                      opacity:0,

                    }}



                    transition={{

                      type:"spring",

                      stiffness:500,

                      damping:18,

                    }}



                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      size-5
                      items-center
                      justify-center
                      rounded-full
                      bg-honey-orange
                      text-[11px]
                      font-bold
                      text-white
                    "

                  >


                    {cartCount}



                  </motion.span>



                </AnimatePresence>


              )

            }



          </button>
                    {/* -------------------------------------- */}
          {/* ACCOUNT */}
          {/* -------------------------------------- */}


          <div

            className="
              relative
              hidden
              md:block
            "

            onMouseEnter={() =>
              setAccountOpen(true)
            }

            onMouseLeave={() =>
              setAccountOpen(false)
            }

          >


            <button

              type="button"

              aria-label="Account"

              aria-expanded={accountOpen}

              onClick={() =>
                setAccountOpen(
                  (value)=>!value
                )
              }

              className="
                flex
                size-9
                items-center
                justify-center
                rounded-full
                transition
                hover:bg-hive-yellow
              "

            >


              <UserRound size={18}/>


            </button>







            <AnimatePresence>


              {

                accountOpen && (



                  <motion.div


                    initial={{

                      opacity:0,

                      y:-8,

                      scale:0.95,

                    }}



                    animate={{

                      opacity:1,

                      y:0,

                      scale:1,

                    }}



                    exit={{

                      opacity:0,

                      y:-8,

                      scale:0.95,

                    }}



                    transition={{

                      duration:0.18,

                    }}



                    className="
                      absolute
                      right-0
                      top-12
                      w-60
                      rounded-3xl
                      border
                      border-black/10
                      bg-white/95
                      p-2
                      shadow-[0_15px_50px_rgba(0,0,0,0.12)]
                      backdrop-blur-xl
                    "


                  >



                    <div

                      className="
                        px-4
                        pb-3
                        pt-3
                      "

                    >


                      <p

                        className="
                          text-sm
                          font-extrabold
                        "

                      >

                        My Account


                      </p>


                      <p

                        className="
                          mt-1
                          text-xs
                          text-black/40
                        "

                      >

                        Manage your StickHive account


                      </p>


                    </div>





                    <div

                      className="
                        h-px
                        bg-black/5
                      "

                    />







                    <Link

                      href="/orders"

                      onClick={()=>
                        setAccountOpen(false)
                      }

                      className="
                        mt-2
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        px-3
                        py-3
                        transition
                        hover:bg-hive-yellow
                      "

                    >


                      <Package size={17}/>


                      <div>


                        <p className="text-sm font-bold">

                          My Orders

                        </p>


                        <p className="text-xs text-black/40">

                          View your orders

                        </p>


                      </div>



                    </Link>







                    <Link

                      href="/wishlist"

                      onClick={()=>
                        setAccountOpen(false)
                      }

                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        px-3
                        py-3
                        transition
                        hover:bg-hive-yellow
                      "

                    >


                      <Heart size={17}/>


                      <div>


                        <p className="text-sm font-bold">

                          My Wishlist

                        </p>


                        <p className="text-xs text-black/40">

                          Saved stickers

                        </p>


                      </div>



                    </Link>







                    <Link

                      href="/account/settings"

                      onClick={()=>
                        setAccountOpen(false)
                      }

                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        px-3
                        py-3
                        transition
                        hover:bg-hive-yellow
                      "

                    >


                      <Settings size={17}/>


                      <div>


                        <p className="text-sm font-bold">

                          Account Settings

                        </p>


                        <p className="text-xs text-black/40">

                          Coming soon

                        </p>


                      </div>



                    </Link>




                  </motion.div>


                )


              }


            </AnimatePresence>



          </div>









          {/* MOBILE MENU BUTTON */}


          <button


            onClick={()=>
              setOpen(!open)
            }


            aria-label="Toggle menu"


            className="
              flex
              size-9
              items-center
              justify-center
              rounded-full
              hover:bg-hive-yellow
              md:hidden
            "


          >



            {

              open

              ?

              <X size={20}/>

              :

              <Menu size={20}/>


            }



          </button>





        </div>



      </nav>









      {/* ---------------------------------------- */}
      {/* MOBILE MENU */}
      {/* ---------------------------------------- */}



      <AnimatePresence>


        {

          open && (



            <motion.div



              initial={{

                opacity:0,

                y:-10,

                scale:0.95,

              }}



              animate={{

                opacity:1,

                y:0,

                scale:1,

              }}



              exit={{

                opacity:0,

                y:-10,

                scale:0.95,

              }}



              className="
                mx-4
                mt-3
                rounded-3xl
                border
                border-white/40
                bg-white/90
                p-4
                shadow-xl
                backdrop-blur-xl
                md:hidden
              "



            >



              <div

                className="
                  flex
                  flex-col
                  gap-2
                "

              >




                {links.map((link)=>(



                  <Link


                    key={link.name}


                    href={link.href}


                    onClick={()=>
                      setOpen(false)
                    }


                    className="
                      rounded-xl
                      px-4
                      py-3
                      font-semibold
                      transition
                      hover:bg-hive-yellow
                    "


                  >



                    {link.name}



                  </Link>



                ))}





                <div

                  className="
                    my-2
                    h-px
                    bg-black/10
                  "

                />





                <Link

                  href="/orders"

                  onClick={()=>
                    setOpen(false)
                  }


                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    transition
                    hover:bg-hive-yellow
                  "

                >

                  <Package size={18}/>

                  My Orders


                </Link>







                <Link

                  href="/wishlist"

                  onClick={()=>
                    setOpen(false)
                  }


                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    transition
                    hover:bg-hive-yellow
                  "

                >

                  <Heart size={18}/>

                  My Wishlist


                </Link>







                <Link

                  href="/account/settings"

                  onClick={()=>
                    setOpen(false)
                  }


                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    transition
                    hover:bg-hive-yellow
                  "

                >

                  <Settings size={18}/>

                  Account Settings


                </Link>



              </div>



            </motion.div>


          )


        }


      </AnimatePresence>



    </header>


  );


}