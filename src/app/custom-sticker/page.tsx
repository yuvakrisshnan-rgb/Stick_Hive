"use client";


import {
  useSearchParams,
} from "next/navigation";


import dynamic from "next/dynamic";

const StickerBuilder = dynamic(
  () => import("@/components/custom-sticker/sticker-builder"),
  { ssr: false },
);





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