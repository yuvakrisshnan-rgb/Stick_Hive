"use client";

import { ReactNode } from "react";


interface MarqueeProps {

  children: ReactNode;

  reverse?: boolean;

}



export default function Marquee({

  children,

  reverse = false,

}: MarqueeProps) {


return (

<div
className="
relative
overflow-hidden
whitespace-nowrap
"
>


<div

className={`
flex
w-max
items-center
gap-10
${reverse 
? "animate-marquee-reverse"
: "animate-marquee"
}
`}

>


{children}

{children}


</div>


</div>

);


}