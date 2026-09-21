import { notFound } from "next/navigation";

import { getShopProductBySlug, listShopProducts } from "../../../../backend/products/catalog";

import ProductDetails from "@/components/shop/product-details";

// See src/app/shop/page.tsx - same reasoning for force-dynamic.
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {


  const { id } = await params;


  const [product, allProducts] = await Promise.all([
    getShopProductBySlug(id),
    listShopProducts(),
  ]);


  if (!product) {
    notFound();
  }


  return (
    <ProductDetails
      product={product}
      allProducts={allProducts}
    />
  );

}