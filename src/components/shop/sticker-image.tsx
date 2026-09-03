"use client";

import { motion } from "motion/react";

import type { Product } from "@/lib/product-data";


export function StickerImage({
  product,
  className = "",
}:{
  product:Product;
  className?:string;
}) {


return (

<div

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

animate={{
y:[0,-8,0]
}}

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


<img

src={product.image}

alt={product.name}

className="
h-[75%]
w-[75%]
object-contain
drop-shadow-[0_15px_15px_rgba(0,0,0,0.2)]
"

draggable={false}

/>


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