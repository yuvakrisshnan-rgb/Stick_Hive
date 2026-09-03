import { notFound } from "next/navigation";

import { PRODUCTS } from "@/lib/product-data";

import ProductDetails from "@/components/shop/product-details";


export default async function ProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {


  const { id } = await params;


  const product = PRODUCTS.find(
    (item) => item.id === id
  );


  if (!product) {
    notFound();
  }


  return (
    <ProductDetails
      product={product}
    />
  );

}