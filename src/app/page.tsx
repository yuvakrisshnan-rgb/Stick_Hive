import Hero from "@/components/home/hero";
import ProductSection from "@/components/sections/product-section";


export default function Home() {

  return (

    <main className="min-h-screen overflow-hidden">

      {/* Hero Section */}
      <Hero />


      {/* Product Collection Section */}
      <ProductSection />

    </main>

  );

}