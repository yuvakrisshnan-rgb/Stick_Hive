import { NextResponse } from "next/server";
import { listShopProducts } from "../../../../backend/products/catalog";

export const runtime = "nodejs";

// Public, read-only - same catalog /shop itself renders (static array or
// D1, gated by PRODUCTS_SOURCE - see backend/products/catalog.ts). Exists
// so client components (store-provider.tsx's cart/wishlist, which can't
// call getD1() directly) can resolve a product by id without re-shipping
// the whole catalog as a server-to-client prop on every page.
export async function GET() {
  try {
    const products = await listShopProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load products.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
