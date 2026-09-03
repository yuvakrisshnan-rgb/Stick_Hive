"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import Image from "next/image";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";



/* -------------------------------------------------------------------------- */
/* ASSET SYSTEM                                                               */
/* -------------------------------------------------------------------------- */


type StickerAsset =

  | {
      kind: "emoji";
      value: string;
    }

  | {
      kind: "image";
      src: string;
      alt: string;
    }

  | {
      kind: "node";
      render: () => ReactNode;
    };





interface StickerSpec {

  id: string;

  asset: StickerAsset;

  color: string;

  x: number;

  y: number;

  size: number;

  rotate: number;

  depth: number;

  delay: number;

}





function AssetView({

  asset,

  size,

}: {

  asset: StickerAsset;

  size: number;

}) {



  if (asset.kind === "emoji") {

    return (

      <span

        aria-hidden="true"

        className="select-none"

        style={{

          fontSize: size * 0.52,

          lineHeight: 1,

        }}

      >

        {asset.value}

      </span>

    );

  }





  if (asset.kind === "image") {

    return (

      <Image

        src={asset.src || "/placeholder.svg"}

        alt={asset.alt}

        width={size}

        height={size}

        className="h-3/4 w-3/4 object-contain"

      />

    );

  }





  return <>{asset.render()}</>;

}





/* -------------------------------------------------------------------------- */
/* STICKER CAST                                                               */
/* -------------------------------------------------------------------------- */


const STICKERS: StickerSpec[] = [


  {

    id: "bee",

    asset: {
      kind: "emoji",
      value: "🐝",
    },

    color: "var(--honey)",

    x: 8,

    y: -196,

    size: 92,

    rotate: -10,

    depth: 42,

    delay: 0.15,

  },




  {

    id: "star",

    asset: {
      kind: "emoji",
      value: "⭐️",
    },

    color: "var(--sticker-lime)",

    x: 188,

    y: -118,

    size: 74,

    rotate: 14,

    depth: 30,

    delay: 0.28,

  },




  {

    id: "sparkle",

    asset: {
      kind: "emoji",
      value: "✨",
    },

    color: "var(--sticker-cyan)",

    x: 232,

    y: 34,

    size: 66,

    rotate: -8,

    depth: 54,

    delay: 0.42,

  },




  {

    id: "heart",

    asset: {
      kind: "emoji",
      value: "💛",
    },

    color: "var(--sticker-pink)",

    x: 162,

    y: 168,

    size: 80,

    rotate: 12,

    depth: 24,

    delay: 0.34,

  },




  {

    id: "rocket",

    asset: {
      kind: "emoji",
      value: "🚀",
    },

    color: "var(--sticker-violet)",

    x: -6,

    y: 212,

    size: 88,

    rotate: -14,

    depth: 46,

    delay: 0.2,

  },




  {

    id: "rainbow",

    asset: {
      kind: "emoji",
      value: "🌈",
    },

    color: "var(--sticker-lime)",

    x: -178,

    y: 150,

    size: 72,

    rotate: 10,

    depth: 32,

    delay: 0.38,

  },




  {

    id: "bolt",

    asset: {
      kind: "emoji",
      value: "⚡️",
    },

    color: "var(--honey)",

    x: -236,

    y: -4,

    size: 64,

    rotate: -12,

    depth: 58,

    delay: 0.48,

  },




  {

    id: "flower",

    asset: {
      kind: "emoji",
      value: "🌸",
    },

    color: "var(--sticker-pink)",

    x: -176,

    y: -128,

    size: 78,

    rotate: 16,

    depth: 28,

    delay: 0.24,

  },




  {

    id: "eye",

    asset: {
      kind: "emoji",
      value: "👁️",
    },

    color: "var(--sticker-cyan)",

    x: 96,

    y: -212,

    size: 58,

    rotate: 18,

    depth: 66,

    delay: 0.55,

  },


];





const WORDMARK = "StickHive";





type Stage =

  | "hive"

  | "brand"

  | "exit"

  | "done";







/* -------------------------------------------------------------------------- */
/* SINGLE STICKER ANIMATION                                                   */
/* -------------------------------------------------------------------------- */


function Sticker({

  spec,

  stage,

  px,

  py,

  reduced,

}: {

  spec: StickerSpec;

  stage: Stage;

  px: MotionValue<number>;

  py: MotionValue<number>;

  reduced: boolean;

}) {



  const tx = useTransform(

    px,

    (v) => v * spec.depth

  );



  const ty = useTransform(

    py,

    (v) => v * spec.depth

  );




  const exiting = stage === "exit";




  return (

    <motion.div

      className="absolute left-1/2 top-1/2"

      style={{

        x: tx,

        y: ty,

      }}

    >


      <motion.div


        initial={{

          x: spec.x * 2.4,

          y: spec.y * 2.4,

          scale: 0,

          rotate: spec.rotate - 60,

          opacity: 0,

        }}



        animate={{


          x: exiting ? spec.x * 2 : spec.x,


          y: exiting ? spec.y * 2 : spec.y,


          scale: exiting ? 0 : 1,


          rotate: spec.rotate,


          opacity: exiting ? 0 : 1,


        }}



        transition={{


          type: "spring",


          stiffness: 140,


          damping: 14,


          delay: spec.delay,


        }}


      >



        <motion.div


          animate={

            reduced

            ? undefined

            : {

                y: [0, -10, 0],

                rotate: [0, 3, 0],

              }

          }



          transition={{


            duration: 4,


            repeat: Infinity,


            ease: "easeInOut",


          }}



          className="

            grid

            place-items-center

            rounded-[30%]

            border-[3px]

            border-white/90

          "



          style={{


            width: spec.size,


            height: spec.size,


            marginLeft: -spec.size / 2,


            marginTop: -spec.size / 2,


            backgroundColor: spec.color,


            boxShadow:

              "0 18px 40px -12px rgba(0,0,0,.25)",


          }}



        >



          <AssetView

            asset={spec.asset}

            size={spec.size}

          />



        </motion.div>



      </motion.div>


    </motion.div>

  );

}
/* -------------------------------------------------------------------------- */
/* BRAND REVEAL                                                               */
/* -------------------------------------------------------------------------- */


export function BrandReveal({

  onComplete,

}: {

  onComplete?: () => void;

}) {



  const reduced = useReducedMotion() ?? false;



  const [visible, setVisible] = useState(true);



  const [stage, setStage] = useState<Stage>("hive");


const onCompleteRef = useRef(onComplete);


useEffect(()=>{

  onCompleteRef.current = onComplete;

},[onComplete]);




  // pointer movement

  const rawX = useMotionValue(0);

  const rawY = useMotionValue(0);



  const px = useSpring(rawX, {

    stiffness: 60,

    damping: 18,

    mass: 0.6,

  });



  const py = useSpring(rawY, {

    stiffness: 60,

    damping: 18,

    mass: 0.6,

  });





  const glowX = useTransform(

    px,

    (v) => v * -14

  );



  const glowY = useTransform(

    py,

    (v) => v * -14

  );







  const handlePointer = useCallback(

    (e: React.PointerEvent) => {


      if (reduced) return;



      rawX.set(

        (e.clientX / window.innerWidth - 0.5) * 2

      );



      rawY.set(

        (e.clientY / window.innerHeight - 0.5) * 2

      );


    },


    [

      rawX,

      rawY,

      reduced,

    ]

  );









  useEffect(() => {


    document.body.style.overflow = "hidden";



    const timers = [



      // stickers arrive

      setTimeout(() => {

        setStage("brand");

      }, 2400),




      // exit animation

      setTimeout(() => {

        setStage("exit");

      }, 4700),




      // finish

      setTimeout(() => {



        setStage("done");



        setVisible(false);



        // IMPORTANT:
        // unlock scrolling

        document.body.style.overflow = "";



        // reveal homepage

        onCompleteRef.current?.();



      }, 5600),



    ];





    return () => {


      timers.forEach(clearTimeout);



      document.body.style.overflow = "";


    };



  }, []);









  return (


    <AnimatePresence>



      {visible && (


        <motion.div


          key="stickhive-brand-reveal"



          className="

            fixed

            inset-0

            z-[999]

            flex

            items-center

            justify-center

            overflow-hidden

          "



          onPointerMove={handlePointer}




          style={{


            background: "#fff8ed",


          }}




          initial={{

            opacity: 1,

          }}




          exit={{


            opacity: 0,


            scale: 1.06,


          }}




          transition={{


            duration: 0.8,


            ease: [0.6, 0, 0.2, 1],


          }}



        >





          {/* -------------------------------------------------------------- */}
          {/* COLOURFUL BACKGROUND                                           */}
          {/* -------------------------------------------------------------- */}



          <motion.div


            aria-hidden="true"



            className="

              pointer-events-none

              absolute

              inset-0

            "



            style={{


              x: glowX,

              y: glowY,



              background:



              `

              radial-gradient(

                circle at 50% 40%,

                rgba(255,210,70,0.65),

                transparent 35%

              ),



              radial-gradient(

                circle at 20% 80%,

                rgba(255,150,80,0.35),

                transparent 40%

              ),



              radial-gradient(

                circle at 80% 20%,

                rgba(120,200,255,0.35),

                transparent 40%

              )

              `


            }}



            animate={{


              scale:[1,1.12,1],


            }}



            transition={{


              duration:5,


              repeat:Infinity,


              ease:"easeInOut",


            }}



          />







          {/* soft floating blobs */}



          <motion.div


            className="

              absolute

              left-[10%]

              top-[20%]

              h-40

              w-40

              rounded-full

              bg-pink-300/30

              blur-3xl

            "



            animate={{


              y:[0,30,0],

              x:[0,20,0],


            }}



            transition={{


              duration:6,

              repeat:Infinity,


            }}



          />






          <motion.div


            className="

              absolute

              right-[10%]

              bottom-[20%]

              h-52

              w-52

              rounded-full

              bg-yellow-300/40

              blur-3xl

            "



            animate={{


              y:[0,-30,0],

            }}



            transition={{


              duration:5,

              repeat:Infinity,


            }}



          />









          {/* -------------------------------------------------------------- */}
          {/* STICKERS                                                       */}
          {/* -------------------------------------------------------------- */}



          <div className="relative scale-[0.65] sm:scale-90 md:scale-100">


            {STICKERS.map((sticker) => (


              <Sticker


                key={sticker.id}


                spec={sticker}


                stage={stage}


                px={px}


                py={py}


                reduced={reduced}


              />


            ))}








            {/* ------------------------------------------------------------ */}
            {/* LOGO REVEAL                                                  */}
            {/* ------------------------------------------------------------ */}




            <div


              className="

                absolute

                left-1/2

                top-1/2

                -translate-x-1/2

                -translate-y-1/2

                flex

                flex-col

                items-center

              "



            >




              <div className="flex">


                {WORDMARK.split("").map((char,index)=>(



                  <motion.span


                    key={`${char}-${index}`}



                    className="

                      font-display

                      text-6xl

                      font-bold

                      tracking-tight

                    "




                    style={{


                      color:

                      index < 5

                      ? "#17151d"

                      : "var(--honey)",


                    }}




                    initial={{


                      opacity:0,


                      y:40,


                      scale:0,


                      rotate:-8,


                    }}




                    animate={


                      stage !== "hive"


                      ? {


                        opacity:1,


                        y:0,


                        scale:1,


                        rotate:0,


                      }


                      : {


                        opacity:0,


                        y:40,


                      }



                    }




                    transition={{


                      type:"spring",


                      stiffness:320,


                      damping:18,


                      delay:index*0.06,


                    }}



                  >


                    {char}


                  </motion.span>



                ))}



              </div>






              <motion.p



                className="

                  mt-3

                  text-sm

                  font-medium

                  uppercase

                  tracking-[0.5em]

                  text-black/50

                "



                initial={{


                  opacity:0,

                  y:10,


                }}




                animate={


                  stage !== "hive"


                  ? {


                    opacity:1,

                    y:0,


                  }


                  : {


                    opacity:0,


                  }


                }




                transition={{


                  delay:0.7,


                }}



              >


                Make Ideas Stick


              </motion.p>




            </div>



          </div>





        </motion.div>


      )}



    </AnimatePresence>


  );

}





export default BrandReveal;