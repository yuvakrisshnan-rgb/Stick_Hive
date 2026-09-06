import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PRODUCTS } from "@/lib/product-data";

const cards = PRODUCTS.filter((product) => product.inStock).slice(0, 4);

export default function BentoCollection() {
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="grid grid-flow-dense auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[220px] md:grid-cols-4">
        {cards.map((product, index) => (
          <Link
            key={product.id}
            href={`/shop/${product.id}`}
            className={`group relative overflow-hidden rounded-[2rem] border border-black/10 p-6 transition-transform duration-700 ease-out hover:-translate-y-1 ${
              index === 0
                ? "col-span-2 row-span-2 bg-hive-yellow"
                : index === 1
                  ? "col-span-2 bg-mint"
                  : "bg-white"
            }`}
          >
            <div className="absolute -right-10 -top-10 size-36 rounded-full bg-white/30 blur-2xl transition-transform duration-700 group-hover:scale-125" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">{product.category}</span>
                <ArrowUpRight size={18} className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <div>
                <h3 className={`max-w-xl font-bold tracking-[-0.045em] ${index === 0 ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl"}`}>
                  {product.name}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-black/55">{product.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
