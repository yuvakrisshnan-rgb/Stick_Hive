"use client";

import { motion } from "motion/react";
import { ProductCard } from "./product-card";
import { PRODUCTS } from "@/lib/product-data";


export default function ProductGrid() {

  return (

    <motion.div

      initial={{
        opacity: 0,
      }}

      whileInView={{
        opacity: 1,
      }}

      viewport={{
        once: true,
      }}

      transition={{
        duration: 0.5,
      }}

      className="
        grid
        gap-6
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "

    >

      {PRODUCTS.map((product, index) => (

        <ProductCard

          key={product.id}

          product={product}

          index={index}

        />

      ))}


    </motion.div>

  );

}