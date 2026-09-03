"use client";

import { motion } from "motion/react";


const messages = [
  "FREE SHIPPING ABOVE ₹499",
  "PREMIUM WATERPROOF VINYL",
  "NEW STICKER DROPS EVERY WEEK",
  "DESIGN YOUR OWN STICKER",
  "MADE FOR LAPTOPS • BOTTLES • NOTEBOOKS",
];


export default function AnnouncementBar() {

  return (

    <div
      className="
        fixed
        left-0
        top-0
        z-[100]
        flex
        h-9
        w-full
        overflow-hidden
        bg-[#111111]
        text-white
      "
    >

      <motion.div

        animate={{
          x:["0%","-50%"]
        }}

        transition={{
          duration:28,
          repeat:Infinity,
          ease:"linear"
        }}

        className="
          flex
          w-max
          items-center
          gap-8
        "

      >

        {
          [...messages,...messages].map((message,index)=>(

            <div

              key={index}

              className="
                flex
                items-center
                gap-8
                whitespace-nowrap
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
              "

            >

              <span>
                {message}
              </span>


              <span
                className="
                  text-[#ffd43b]
                  text-base
                "
              >
                ✦
              </span>


            </div>

          ))
        }


      </motion.div>


    </div>

  );

}