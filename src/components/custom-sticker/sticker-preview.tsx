"use client";


import {
  motion,
} from "motion/react";


import {
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";


import type {
  StickerSize,
} from "@/lib/product-data";





export type PreviewShape =

| "Circle"

| "Square"

| "Rounded"

| "Die-cut";









interface StickerPreviewProps {



  imageUrl:string | null;



  imageScale:number;



  setImageScale:
  (
    value:number
  )=>void;




  size:StickerSize;



  shape:PreviewShape;



}









export default function StickerPreview({

  imageUrl,

  imageScale,

  setImageScale,

  size,

  shape,

}:StickerPreviewProps){








function getSizeClass(

selectedSize:StickerSize

){


switch(selectedSize){



case "Small":

return "size-56";




case "Medium":

return "size-72";




case "Large":

return "size-[28rem]";




default:

return "size-72";



}



}









function getShapeClass(

selectedShape:PreviewShape

){



switch(selectedShape){



case "Circle":

return "rounded-full";




case "Square":

return "rounded-none";




case "Rounded":

return "rounded-[2.5rem]";




case "Die-cut":

return "rounded-[1.8rem]";




default:

return "rounded-[2rem]";



}



}









function increaseZoom(){



setImageScale(

Math.min(

2,

Number(

(imageScale + 0.1)

.toFixed(1)

)

)

);



}









function decreaseZoom(){



setImageScale(

Math.max(

0.5,

Number(

(imageScale - 0.1)

.toFixed(1)

)

)

);



}









function resetZoom(){



setImageScale(1);



}









return (



<section

className="
rounded-[2.8rem]
bg-white
p-8
shadow-[0_25px_80px_rgba(0,0,0,0.08)]
"

>







{/* HEADER */}



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
tracking-[0.3em]
text-black/40
"

>

Preview

</p>





<h2

className="
mt-2
text-3xl
font-extrabold
"

>

Your Sticker

</h2>



</div>






<div

className="
rounded-full
bg-cream
px-5
py-2
text-xs
font-bold
text-black/60
"

>

Live Preview

</div>




</div>









{/* PREVIEW STAGE */}



<div

className="
relative
mt-8
flex
min-h-[560px]
items-center
justify-center
overflow-hidden
rounded-[2.5rem]
bg-[#f7f1e8]
"

>





<div

className="
absolute
left-10
top-10
size-52
rounded-full
bg-hive-yellow/30
blur-3xl
"

/>






<div

className="
absolute
bottom-10
right-10
size-60
rounded-full
bg-orange-200/30
blur-3xl
"

/>









{/* STICKER */}



<motion.div


animate={{

scale:1,

}}



transition={{

duration:0.3,

}}



className={`

relative

flex

items-center

justify-center

overflow-hidden

p-4

bg-white

shadow-[0_35px_90px_rgba(0,0,0,0.28)]

${getSizeClass(size)}

${getShapeClass(shape)}

`}



>









{

imageUrl

?

<motion.img


src={imageUrl}



alt="Sticker Preview"




animate={{

scale:imageScale,

}}




transition={{

duration:0.25,

}}



className={`

relative

z-10

h-full

w-full

object-contain

${getShapeClass(shape)}

`}



/>



:

<div

className="
flex
flex-col
items-center
text-black/30
"

>


<Sparkles size={45}/>



<p

className="
mt-3
font-bold
"

>

Upload Image

</p>



</div>



}









</motion.div>








</div>









{/* ZOOM CONTROL */}



<div

className="
mt-8
flex
items-center
justify-center
gap-5
"

>





<button

onClick={decreaseZoom}

className="
flex
size-12
items-center
justify-center
rounded-full
bg-cream
font-bold
hover:bg-hive-yellow
"

>

<Minus size={20}/>

</button>







<div

className="
text-center
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

Zoom

</p>





<p

className="
text-2xl
font-extrabold
"

>

{Math.round(imageScale*100)}%

</p>




</div>









<button

onClick={increaseZoom}

className="
flex
size-12
items-center
justify-center
rounded-full
bg-cream
font-bold
hover:bg-hive-yellow
"

>

<Plus size={20}/>

</button>







<button

onClick={resetZoom}

className="
rounded-full
bg-black/5
px-5
py-3
text-sm
font-bold
"

>

Reset

</button>






</div>








</section>



);


}