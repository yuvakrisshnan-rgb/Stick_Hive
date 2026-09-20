import Link from "next/link";

import { listDevPreviewProducts } from "../../../../backend/products/dev-preview-service";
import { ProductCard } from "@/components/products/product-card";

// Dev-only. See src/app/dev/layout.tsx for the production-404 gate.
// Renders real D1 rows through the same ProductCard the live shop uses -
// proof the seed script + image pipeline work end to end, without
// touching the live shop's static-array data source at all.
export default async function DevProductPreviewPage() {
  const products = await listDevPreviewProducts(3);

  return (
    <main className="min-h-screen bg-cream px-6 pb-20 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-extrabold">Dev product preview</h1>
        <p className="mt-2 text-sm text-black/50">
          Dev-only. Renders directly from the local D1 products table via ProductCard - not the live shop&apos;s data source.
        </p>

        {products.length === 0 ? (
          <p className="mt-8 text-black/60">
            No active products in local D1 yet. Run <code>npm run products:seed</code> first.
          </p>
        ) : (
          // ProductCard already wraps itself in a Link to /shop/<id> (the
          // live shop route - this product isn't there, so that link
          // 404s, harmlessly, since this data is deliberately kept out of
          // the live shop). Not wrapping it in another Link here (that'd
          // be invalid nested <a> tags); instead a separate, explicit
          // link below each card points at this route's own detail page.
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <div key={product.id}>
                <ProductCard product={product} index={index} />
                <Link href={`/dev/product-preview/${product.id}`} className="mt-2 inline-block text-sm font-semibold text-honey-orange underline">
                  View in dev preview &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
