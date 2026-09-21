import Hero from "@/components/home/hero";
import ProductSection from "@/components/sections/product-section";

import { listShopProducts } from "../../backend/products/catalog";

// Same data layer /shop and /shop/[id] already read from (static array or
// D1, gated by PRODUCTS_SOURCE - see backend/products/catalog.ts) - fetched
// once here and passed down, so the homepage and /shop can never disagree
// about which catalogue they're showing.
export const dynamic = "force-dynamic";

export default async function Home() {

  const products = await listShopProducts();

  return (

    <main className="min-h-screen overflow-hidden">

      {/* Hero Section */}
      <Hero products={products} />


      {/* Product Collection Section */}
      <ProductSection products={products} />

    </main>

  );

}