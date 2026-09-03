"use client";


import { motion } from "motion/react";
import { ReactNode } from "react";


export default function MagneticButton({
children,
className=""
}:{
children:ReactNode;
className?:string;
}) {


return (

<motion.button

whileHover={{
scale:1.08,
y:-4,
}}

whileTap={{
scale:0.95,
}}

transition={{
type:"spring",
stiffness:300,
}}

className={className}

>

{children}

</motion.button>

)

}