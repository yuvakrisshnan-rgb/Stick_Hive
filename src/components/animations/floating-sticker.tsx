"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";


interface FloatingStickerProps {

  children: ReactNode;

  delay?: number;

  rotate?: number;

  duration?: number;

  hoverScale?: number;

  className?: string;

  x?: number;

  y?: number;

}



export default function FloatingSticker({

  children,

  delay = 0,

  rotate = 8,

  duration = 4,

  hoverScale = 1.12,

  className = "",

  x = 0,

  y = 0,

}: FloatingStickerProps) {


  return (

    <motion.div


      initial={{

        opacity:0,

        scale:0.8,

        y:0,

        rotate:0,

      }}


      animate={{

        opacity:1,

        scale:1,


        y:[

          -10,

          10,

          -10,

        ],


        rotate:[

          -rotate,

          rotate,

          -rotate,

        ],

      }}


      style={{

        x,

        y,

      }}


      whileHover={{

        scale:hoverScale,

        rotate:0,

      }}


      transition={{

        duration,

        repeat:Infinity,

        ease:"easeInOut",

        delay,

      }}


      className={`
        drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)]
        transition-transform
        ${className}
      `}

    >

      {children}

    </motion.div>

  );

}