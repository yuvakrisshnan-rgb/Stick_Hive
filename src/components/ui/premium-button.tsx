"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";


interface PremiumButtonProps {

  children: ReactNode;

  variant?: "primary" | "secondary";

  showArrow?: boolean;

  className?: string;

}



export default function PremiumButton({

  children,

  variant = "primary",

  showArrow = false,

  className = "",

}: PremiumButtonProps) {


  return (

    <motion.button

      whileHover={{
        scale:1.05,
      }}

      whileTap={{
        scale:0.96,
      }}

      className={`
        group
        flex
        items-center
        justify-center
        gap-2
        rounded-full
        px-8
        py-4
        font-bold
        transition-all
        duration-300

        ${
          variant==="primary"

          ?

          `
          bg-[#111111]
text-white
shadow-lg
hover:bg-[#222222]
hover:shadow-xl
hover:shadow-black/20
          `

          :

          `
          border
          border-black/10
          bg-white
          text-black
          hover:bg-hive-yellow
          `
        }

        ${className}

      `}

    >


      {children}



      {
        showArrow && (

          <motion.span

            animate={{
              x:[0,4,0]
            }}

            transition={{
              duration:1.2,
              repeat:Infinity,
            }}

          >

            <ArrowRight size={18}/>


          </motion.span>

        )
      }



    </motion.button>

  );

}