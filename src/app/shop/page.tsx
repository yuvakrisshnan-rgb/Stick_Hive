import { Suspense } from "react"
import ShopCatalog from "@/components/shop/shop-catalog"
import { listShopProducts } from "../../../backend/products/catalog"

// D1 (when PRODUCTS_SOURCE=d1) is only reachable at request time in the
// real Workers runtime, never during `next build`'s static prerender - see
// backend/products/catalog.ts for the flag and fallback.
export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const products = await listShopProducts()

  return (
    <main>
      <Suspense fallback={null}>
        <ShopCatalog products={products} />
      </Suspense>
    </main>
  )
}