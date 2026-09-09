"use client";


export type StickerShape =
  | "Circle"
  | "Square"
  | "Rounded"
  | "Die-cut";



interface ShapeSelectorProps {

  shape: StickerShape;

  setShape:
  (
    value: StickerShape
  ) => void;

}





export default function ShapeSelector({

  shape,

  setShape,

}:ShapeSelectorProps){



const shapes:StickerShape[] = [

  "Circle",

  "Square",

  "Rounded",

  "Die-cut",

];




const shapeData = {


Circle:{

  icon:"●",

  label:"Circle",

},


Square:{

  icon:"■",

  label:"Square",

},


Rounded:{

  icon:"▣",

  label:"Rounded",

},


"Die-cut":{

  icon:"✦",

  label:"Die-cut",

},


};





return (

<section

className="
rounded-3xl
border
border-black/5
bg-white
p-5
"

>


{/* Header */}


<div>


<p

className="
text-[10px]
font-bold
uppercase
tracking-[0.25em]
text-black/40
"

>

Step 03

</p>


<h3

className="
mt-1
text-lg
font-extrabold
"

>

Sticker Shape

</h3>


</div>





{/* Shape Chips */}



<div

className="
mt-4
grid
grid-cols-4
gap-2
"

>


{

shapes.map((option)=>{


const selected =
shape === option;



return (

<button

key={option}

type="button"

onClick={()=>setShape(option)}

className={`

flex

flex-col

items-center

justify-center

rounded-2xl

border

py-3

transition-all


${
selected

?

`
border-hive-yellow
bg-hive-yellow
shadow-md
scale-[1.04]
`

:

`
border-black/10
bg-white
hover:bg-cream
`

}

`}

>


<div

className="
flex
size-8
items-center
justify-center
rounded-full
bg-cream
text-lg
font-black
"

>

{shapeData[option].icon}

</div>



<p

className="
mt-2
text-[11px]
font-bold
"

>

{shapeData[option].label}

</p>


</button>


);


})


}



</div>

        {shape === "Die-cut" && (
          <div className="mt-4 rounded-2xl bg-cream px-3 py-3 text-xs font-semibold leading-relaxed text-black/55">
            Die-cut follows your artwork silhouette. Transparent PNGs work
            immediately; JPGs and other opaque images can use
            <span className="text-black"> Make Die-cut Ready</span> in Image Settings.
          </div>
        )}



</section>

);

}