"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "motion/react";

import type { Product } from "@/lib/product-data";


export function StickerImage({
  product,
  className = "",
}:{
  product:Product;
  className?:string;
}) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { amount: 0.1 });


return (

<div

ref={containerRef}

className={`
flex
aspect-square
items-center
justify-center
rounded-[1.5rem]
overflow-hidden
${className}
`}

style={{
backgroundColor:product.color
}}

>


<motion.div

animate={
isInView
? {
y:[0,-8,0]
}
: undefined
}

transition={{
duration:3,
repeat:Infinity,
ease:"easeInOut"
}}

className="
flex
items-center
justify-center
h-full
w-full
"


>


{

product.image ?


<div

className="
relative
h-[75%]
w-[75%]
drop-shadow-[0_15px_15px_rgba(0,0,0,0.2)]
"

>

<Image

src={product.image}

alt={product.name}

fill

sizes="(max-width: 768px) 50vw, 300px"

className="
object-contain
"

draggable={false}

/>

</div>


:


<span

className="
text-7xl
"

>

{product.emoji}

</span>


}


</motion.div>


</div>

)

}
