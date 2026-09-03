"use client";

import { motion } from "motion/react";


export default function BackgroundEffects() {


  return (

    <>

      {/* Main Yellow Glow */}

      <motion.div

        animate={{

          scale:[
            1,
            1.15,
            1
          ],

          opacity:[
            0.35,
            0.55,
            0.35
          ]

        }}

        transition={{

          duration:8,

          repeat:Infinity,

          ease:"easeInOut"

        }}

        className="
          absolute
          left-1/2
          top-40
          -z-10
          h-[520px]
          w-[520px]
          -translate-x-1/2
          rounded-full
          bg-hive-yellow/30
          blur-[140px]
        "

      />






      {/* Floating Particles */}



      <motion.div

        animate={{

          y:[
            0,
            -30,
            0
          ],

          rotate:[
            0,
            180,
            360
          ]

        }}

        transition={{

          duration:12,

          repeat:Infinity,

          ease:"linear"

        }}

        className="
          absolute
          left-[15%]
          top-[35%]
          text-3xl
          opacity-40
        "

      >

        ✦


      </motion.div>






      <motion.div

        animate={{

          y:[
            0,
            40,
            0
          ]

        }}

        transition={{

          duration:10,

          repeat:Infinity,

          ease:"easeInOut"

        }}

        className="
          absolute
          right-[20%]
          top-[25%]
          text-2xl
          opacity-30
        "

      >

        ✨


      </motion.div>






      <motion.div

        animate={{

          y:[
            0,
            -25,
            0
          ]

        }}

        transition={{

          duration:9,

          repeat:Infinity

        }}

        className="
          absolute
          bottom-[20%]
          left-[45%]
          text-xl
          opacity-30
        "

      >

        ⋆


      </motion.div>


    </>

  );

}