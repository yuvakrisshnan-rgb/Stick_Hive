"use client";


import {
  useEffect,
  useState,
} from "react";


import {
  AnimatePresence,
  motion,
} from "motion/react";





const colors = [

  "bg-hive-yellow",

  "bg-honey-orange",

  "bg-mint",

  "bg-blue-300",

  "bg-purple-300",

  "bg-hive-yellow",

  "bg-orange-400",

  "bg-green-300",

];









export default function PageLoader(){





const [show,setShow] = useState(()=>{



if(typeof window === "undefined"){


return true;


}






const visited =

sessionStorage.getItem(

"stickhive-loaded"

);






if(visited){


return false;


}







sessionStorage.setItem(

"stickhive-loaded",

"true"

);






return true;



});









useEffect(()=>{



if(!show){

return;

}







const timer =

setTimeout(()=>{



setShow(false);



},2200);









return ()=>{

clearTimeout(timer);

};



},[show]);









return (


<AnimatePresence>



{

show && (



<motion.div



exit={{


opacity:0,


}}



transition={{


duration:0.6,


}}



className="
fixed
inset-0
z-[200]
flex
items-center
justify-center
bg-[#fff8ed]
"



>








<div


className="
grid
grid-cols-4
gap-2
"


>



{

colors.map(

(color,index)=>(



<motion.div



key={index}




initial={{


scale:0,


rotate:-20,


}}




animate={{


scale:1,


rotate:0,


}}





transition={{


delay:index*0.08,


duration:0.4,


type:"spring",


}}





className={`

h-16

w-16

rounded-xl

${color}

`}



 />



)

)



}





</div>









<motion.div



initial={{


opacity:0,


y:20,


}}



animate={{


opacity:1,


y:0,


}}



transition={{


delay:0.8,


}}





className="
absolute
text-4xl
font-black
tracking-tight
"



>


StickHive 🐝



</motion.div>







</motion.div>



)

}



</AnimatePresence>


);


}