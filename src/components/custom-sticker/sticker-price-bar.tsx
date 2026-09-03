"use client";


import {
  ShoppingBag,
  Check,
  Pencil,
} from "lucide-react";


import {
  motion,
} from "motion/react";






interface StickerPriceBarProps {


  unitPrice:number;


  quantity:number;


  imageReady:boolean;


  addedToCart:boolean;


  editMode?:boolean;


  onAddToCart:()=>void;


}







export default function StickerPriceBar({


  unitPrice,


  quantity,


  imageReady,


  addedToCart,


  editMode=false,


  onAddToCart,


}:StickerPriceBarProps){






const totalPrice =

  unitPrice * quantity;






return (



<section


className="
rounded-[2rem]
border
border-black/5
bg-white
p-6
shadow-sm
"

>





{/* Price Summary */}



<div


className="
rounded-2xl
bg-cream/60
p-5
"

>



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
text-xs
font-bold
uppercase
tracking-widest
text-black/40
"

>

Unit Price

</p>



<p

className="
mt-1
text-lg
font-extrabold
"

>

₹{unitPrice}

</p>



</div>







<div


className="
text-right
"

>


<p

className="
text-xs
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
mt-1
text-lg
font-extrabold
"

>

{quantity}

</p>




</div>



</div>







<div


className="
my-4
h-px
bg-black/10
"

 />








<div


className="
flex
items-center
justify-between
"

>


<p

className="
text-sm
font-bold
text-black/50
"

>

Total

</p>






<motion.p


key={totalPrice}



initial={{

opacity:0,

scale:0.8,

}}



animate={{

opacity:1,

scale:1,

}}



className="
text-3xl
font-extrabold
"

>

₹{totalPrice}


</motion.p>




</div>



</div>









{/* ACTION BUTTON */}



<motion.button


type="button"



disabled={

!imageReady ||

addedToCart

}




onClick={onAddToCart}





whileTap={

imageReady && !addedToCart

?

{

scale:0.98

}

:

undefined

}





className={`


mt-5

flex

w-full

items-center

justify-center

gap-2

rounded-full

py-4

font-bold

text-white

transition



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

hover:scale-[1.01]

`



:

`

bg-black/40

cursor-not-allowed

`

}



`}



>




{

addedToCart


?

<>


<Check size={18}/>


{

editMode

?

"Design Updated"

:

"Added To Cart"

}



</>



:

<>



{

editMode

?

<Pencil size={18}/>

:

<ShoppingBag size={18}/>

}



{

editMode

?

"Update Design"

:

"Add Custom Sticker"

}



</>



}



</motion.button>









{

!imageReady && (


<p


className="
mt-3
text-center
text-xs
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