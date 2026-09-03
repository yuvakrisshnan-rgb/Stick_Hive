"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";


interface RevealTextProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}


export default function RevealText({
  children,
  delay = 0,
  className = "",
}: RevealTextProps) {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 40,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.8,
        delay,
        ease: "easeOut",
      }}

      className={className}

    >

      {children}

    </motion.div>

  );
}