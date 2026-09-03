"use client";

import {
  ImagePlus,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";

import {
  motion,
} from "motion/react";


interface UploadSectionProps {

  imageUrl:string | null;

  fileName:string;

  error:string;

  uploading:boolean;

  onUpload:
  (
    event:React.ChangeEvent<HTMLInputElement>
  )=>void;


  onRemove:()=>void;


  inputRef:
  React.RefObject<HTMLInputElement | null>;

}



export default function UploadSection({

  imageUrl,

  fileName,

  error,

  uploading,

  onUpload,

  onRemove,

  inputRef,

}:UploadSectionProps){


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

<div

className="
flex
items-start
justify-between
"

>

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

Step 01

</p>


<h3

className="
mt-1
text-lg
font-extrabold
"

>

Upload Image

</h3>


<p

className="
mt-1
text-xs
text-black/45
"

>

PNG, JPG, WEBP • Max 5MB

</p>


</div>


<ImagePlus

size={22}

className="
text-black/30
"

/>


</div>





<input

ref={inputRef}

type="file"

accept="
image/png,
image/jpeg,
image/webp
"

onChange={onUpload}

className="
hidden
"

/>







{
imageUrl

?

(

<motion.div

initial={{
opacity:0,
scale:0.98
}}

animate={{
opacity:1,
scale:1
}}

className="
mt-4
rounded-2xl
bg-cream
p-3
"

>


<div

className="
flex
items-center
justify-between
gap-3
"

>


<div

className="
flex
min-w-0
items-center
gap-3
"

>


<div

className="
flex
size-10
shrink-0
items-center
justify-center
rounded-xl
bg-white
"

>

<CheckCircle2

size={18}

className="
text-green-600
"

/>

</div>



<div

className="
min-w-0
"

>

<p

className="
truncate
text-sm
font-bold
"

>

{fileName}

</p>


<p

className="
text-[11px]
text-black/40
"

>

Ready to customize

</p>


</div>


</div>





<button

type="button"

onClick={onRemove}

className="
flex
size-8
items-center
justify-center
rounded-full
bg-white
hover:bg-red-50
hover:text-red-500
"

>

<X size={15}/>

</button>



</div>





<button

type="button"

onClick={()=>inputRef.current?.click()}

className="
mt-3
flex
w-full
items-center
justify-center
gap-2
rounded-full
bg-black
py-2.5
text-xs
font-bold
text-white
transition
hover:scale-[1.01]
"

>

<Upload size={14}/>

Replace Image

</button>


</motion.div>

)


:


(

<button

type="button"

onClick={()=>inputRef.current?.click()}

className="
mt-4
flex
h-32
w-full
flex-col
items-center
justify-center
rounded-2xl
border
border-dashed
border-black/15
bg-cream/40
transition
hover:bg-cream
"

>


<div

className="
flex
size-10
items-center
justify-center
rounded-xl
bg-white
shadow-sm
"

>

{

uploading

?

<Upload

size={20}

className="
animate-pulse
"

/>

:

<ImagePlus

size={22}

className="
text-black/40
"

/>

}


</div>



<p

className="
mt-2
text-sm
font-bold
"

>

{

uploading

?

"Preparing..."

:

"Click to upload"

}


</p>


<p

className="
text-[11px]
text-black/40
"

>

Drag & drop coming soon

</p>


</button>

)

}





{

error && (

<motion.p

initial={{
opacity:0
}}

animate={{
opacity:1
}}

className="
mt-3
rounded-xl
bg-red-50
px-3
py-2
text-xs
font-semibold
text-red-600
"

>

{error}

</motion.p>

)

}



</section>

);

}