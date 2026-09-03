"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";


interface CounterProps {

  value:number;

  suffix?:string;

  duration?:number;

}



export default function Counter({

  value,

  suffix="",

  duration=1500,

}:CounterProps){


  const [count,setCount] = useState(0);



  useEffect(()=>{


    let start = 0;


    const increment = value / (duration / 16);



    const timer = setInterval(()=>{


      start += increment;


      if(start >= value){

        setCount(value);

        clearInterval(timer);

      }

      else{

        setCount(Math.floor(start));

      }


    },16);



    return ()=>clearInterval(timer);


  },[value,duration]);




  return (

    <motion.span

      initial={{
        opacity:0,
        y:10
      }}

      animate={{
        opacity:1,
        y:0
      }}

      transition={{
        duration:0.5
      }}

    >

      {count.toLocaleString()}

      {suffix}


    </motion.span>

  );

}