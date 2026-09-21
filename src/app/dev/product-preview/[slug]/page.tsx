import { notFound } from "next/navigation";

import { getDevPreviewProductBySlug, listDevPreviewProducts } from "../../../../../backend/products/dev-preview-service";
import ProductDetails from "@/components/shop/product-details";

// Dev-only. See src/app/dev/layout.tsx for the production-404 gate.
export default async function DevProductPreviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getDevPreviewProductBySlug(slug),
    listDevPreviewProducts(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} allProducts={allProducts} />;
}
