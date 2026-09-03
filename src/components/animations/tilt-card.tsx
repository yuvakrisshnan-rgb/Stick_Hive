"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import type { ReactNode } from "react";


interface TiltCardProps {

  children: ReactNode;

  className?: string;

}



export default function TiltCard({
  children,
  className = "",
}: TiltCardProps) {


  const x = useMotionValue(0);
  const y = useMotionValue(0);



  const rotateX = useSpring(

    useTransform(
      y,
      [-100, 100],
      [12, -12]
    ),

    {
      stiffness:200,
      damping:20
    }

  );



  const rotateY = useSpring(

    useTransform(
      x,
      [-100,100],
      [-12,12]
    ),

    {
      stiffness:200,
      damping:20
    }

  );




  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ){


    const rect =
      event.currentTarget.getBoundingClientRect();


    const mouseX =
      event.clientX - rect.left;


    const mouseY =
      event.clientY - rect.top;



    const centerX =
      rect.width / 2;


    const centerY =
      rect.height / 2;



    x.set(
      ((mouseX-centerX)/centerX)*100
    );


    y.set(
      ((mouseY-centerY)/centerY)*100
    );


  }





  function reset(){

    x.set(0);
    y.set(0);

  }





return (

<motion.div


style={{

rotateX,

rotateY,

transformPerspective:1000,

transformStyle:"preserve-3d"

}}


onMouseMove={handleMouseMove}

onMouseLeave={reset}


className={className}

>


{children}


</motion.div>

);


}