import { Suspense } from "react"
import ShopCatalog from "@/components/shop/shop-catalog"

export default function ShopPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <ShopCatalog />
      </Suspense>
    </main>
  )
}