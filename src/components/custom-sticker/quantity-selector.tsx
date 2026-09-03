"use client";


import {
  ShoppingBag,
  Check,
} from "lucide-react";


import {
  motion,
} from "motion/react";



interface StickerPriceBarProps {


  unitPrice:number;


  quantity:number;


  imageReady:boolean;


  addedToCart:boolean;


  onAddToCart:()=>void;


}





export default function StickerPriceBar({

  unitPrice,

  quantity,

  imageReady,

  addedToCart,

  onAddToCart,

}:StickerPriceBarProps){



const totalPrice =
unitPrice * quantity;





return (

<section

className="
sticky
bottom-0
z-20
rounded-3xl
border
border-black/10
bg-white/95
p-4
shadow-[0_-10px_30px_rgba(0,0,0,0.08)]
backdrop-blur
"

>


{/* Price Row */}



<div

className="
flex
items-center
justify-between
"

>


<div>


<p

className="
text-[10px]
font-bold
uppercase
tracking-widest
text-black/40
"

>

Total

</p>



<motion.p

key={totalPrice}

initial={{
opacity:0,
y:5
}}

animate={{
opacity:1,
y:0
}}

className="
text-2xl
font-extrabold
"

>

₹{totalPrice}

</motion.p>


</div>





<div

className="
text-right
"

>


<p

className="
text-[10px]
font-bold
uppercase
tracking-widest
text-black/40
"

>

Quantity

</p>


<p

className="
text-lg
font-extrabold
"

>

{quantity}

</p>


</div>



</div>







{/* Button */}



<motion.button


type="button"


onClick={onAddToCart}



disabled={
!imageReady ||
addedToCart
}




whileTap={
imageReady && !addedToCart
?
{
scale:0.97
}
:
undefined
}



className={`

mt-4

flex

w-full

items-center

justify-center

gap-2

rounded-full

py-3.5

text-sm

font-bold

text-white

transition-all


${
addedToCart

?

`
bg-green-600
`

:

imageReady

?

`
bg-black
hover:scale-[1.02]
`

:

`
cursor-not-allowed
bg-black/30
`

}

`}


>


{

addedToCart

?

<>

<Check size={17}/>

Added To Cart

</>


:

<>

<ShoppingBag size={17}/>

Add Custom Sticker

</>


}



</motion.button>






{

!imageReady && (

<p

className="
mt-2
text-center
text-[11px]
font-semibold
text-black/40
"

>

Upload an image to continue

</p>

)

}



</section>

);

}