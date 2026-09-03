"use client";


import {
  useSearchParams,
} from "next/navigation";


import StickerBuilder from "@/components/custom-sticker/sticker-builder";





export default function CustomStickerPage(){



  const searchParams =

    useSearchParams();




  const editId =

    searchParams.get("edit");






  return (


    <main

      className="
        min-h-screen
        bg-cream
        pt-36
      "

    >



      <StickerBuilder

        editId={editId ?? undefined}

      />



    </main>


  );


}