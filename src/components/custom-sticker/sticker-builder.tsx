"use client";


import {
  useRef,
  useState,
} from "react";


import StickerPreview from "./sticker-preview";


import UploadSection from "./upload-section";


import ShapeSelector, {
  type StickerShape,
} from "./shape-selector";


import StickerPriceBar from "./sticker-price-bar";



import {
  useShop,
  type CustomStickerFinish,
} from "@/components/shop/store-provider";



import type {
  StickerSize,
} from "@/lib/product-data";









type StickerBuilderProps = {


  editId?: string;


};









export default function StickerBuilder({


  editId,


}: StickerBuilderProps){





const inputRef =

useRef<HTMLInputElement | null>(null);







const {


  addCustomStickerToCart,


  updateCustomStickerDesign,


  customCartLines,



} = useShop();











// --------------------------------------------------
// EDIT DATA
// --------------------------------------------------


const existingSticker =

editId

?

customCartLines.find(

(item)=>

item.id === editId

)

:

undefined;











// --------------------------------------------------
// STATES
// --------------------------------------------------



const [

imageUrl,

setImageUrl,

] =

useState<string | null>(


existingSticker?.imageUrl ?? null


);







const [

fileName,

setFileName,

] =

useState(


existingSticker?.fileName ?? ""


);







const [

error,

setError,

] =

useState("");







const [

uploading,

setUploading,

] =

useState(false);







const [

imageScale,

setImageScale,

] =

useState(


existingSticker?.imageScale ?? 1


);







const [

size,

setSize,

] =

useState<StickerSize>(


existingSticker?.size ?? "Medium"


);







const [

shape,

setShape,

] =

useState<StickerShape>(


existingSticker?.shape ?? "Circle"


);







const [

quantity,

setQuantity,

] =

useState(


existingSticker?.quantity ?? 1


);







const [

added,

setAdded,

] =

useState(false);









const isEditMode =

Boolean(editId);
// --------------------------------------------------
// IMAGE TO BASE64
// --------------------------------------------------


function convertToBase64(

file:File

):Promise<string>{



return new Promise(

(resolve,reject)=>{



const reader =

new FileReader();







reader.onload = ()=>{



resolve(

reader.result as string

);



};








reader.onerror = ()=>{



reject(

new Error(

"Image conversion failed"

)

);



};








reader.readAsDataURL(file);




}

);



}











// --------------------------------------------------
// IMAGE UPLOAD
// --------------------------------------------------


async function handleUpload(

event:React.ChangeEvent<HTMLInputElement>

){



const file =

event.target.files?.[0];







if(!file){

return;

}








setError("");









const allowedTypes = [


"image/png",


"image/jpeg",


"image/webp",


];









if(!allowedTypes.includes(file.type)){



setError(

"Please upload PNG, JPG or WEBP image"

);



return;



}









if(file.size > 5 * 1024 * 1024){



setError(

"Image must be smaller than 5MB"

);



return;



}









try{



setUploading(true);








const base64Image =

await convertToBase64(file);









setImageUrl(

base64Image

);









setFileName(

file.name

);









setImageScale(1);








}

catch(error){



setError(

"Unable to process image"

);



console.error(error);



}

finally{



setUploading(false);



}



}











// --------------------------------------------------
// REMOVE IMAGE
// --------------------------------------------------


function removeImage(){



setImageUrl(null);



setFileName("");



setImageScale(1);



}












// --------------------------------------------------
// PRICE
// --------------------------------------------------


const unitPrice =


size === "Small"

?

20

:


size === "Large"

?

30

:

25;
// --------------------------------------------------
// CART
// --------------------------------------------------


function addToCart(){



if(!imageUrl){

return;

}









const stickerData = {



imageUrl,



fileName,



size,



shape,






finish:

"Matte" as CustomStickerFinish,






quantity,



unitPrice,



imageScale,



};









if(editId){



updateCustomStickerDesign(



editId,



stickerData



);



}

else{



addCustomStickerToCart(



stickerData



);



}







setAdded(true);



}














// --------------------------------------------------
// UI
// --------------------------------------------------


return (



<main


className="
mx-auto
max-w-7xl
px-6
pb-10
"


>



<div


className="
grid
gap-8
lg:grid-cols-[1.15fr_0.85fr]
"


>









{/* LEFT - PREVIEW */}



<div


className="
sticky
top-32
h-fit
"


>







<StickerPreview




imageUrl={imageUrl}





imageScale={imageScale}





setImageScale={setImageScale}





size={size}





shape={shape}





/>








</div>









{/* RIGHT - CUSTOMIZATION */}



<div


className="
sticky
top-32
h-[calc(100vh-150px)]
overflow-y-auto
space-y-5
pr-2
pb-32
custom-scroll
"


>




<UploadSection



imageUrl={imageUrl}



fileName={fileName}



error={error}



uploading={uploading}



onUpload={handleUpload}



onRemove={removeImage}



inputRef={inputRef}



/>












<ShapeSelector



shape={shape}



setShape={setShape}



/>












<StickerPriceBar



unitPrice={unitPrice}



quantity={quantity}



imageReady={Boolean(imageUrl)}



addedToCart={added}



editMode={isEditMode}



onAddToCart={addToCart}



/>









</div>







</div>







</main>



);


}