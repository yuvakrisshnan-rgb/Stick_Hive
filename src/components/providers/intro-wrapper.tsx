"use client";

import { useState } from "react";
import BrandReveal from "@/components/animations/brand-reveal";


export default function IntroWrapper({
  children,
}: {
  children: React.ReactNode;
}) {

  const [introFinished, setIntroFinished] = useState(false);


  return (

    <>

      <BrandReveal
        onComplete={() => {
          setIntroFinished(true);
        }}
      />


      <div
        className={`
          transition-opacity
          duration-700
          ease-out

          ${
            introFinished
            ? "opacity-100"
            : "opacity-0"
          }

        `}
      >

        {children}

      </div>


    </>

  );

}