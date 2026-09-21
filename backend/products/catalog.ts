import { PRODUCTS, type Product } from "../../src/lib/product-data";
import { getActiveProductBySlug, listActiveProducts } from "./service";

// The switch between the static PRODUCTS array and the real D1-backed
// catalogue (backend/products/service.ts). Defaults to the static array:
// the products table only exists in *local* D1 so far (migrations/0006
// applied and seeded locally, see DECISIONS.md) - the remote D1 migration,
// the real seed, and the R2 image upload are all still unexecuted per the
// standing "stop before remote D1 writes / real R2 changes" rule, so
// production has no D1 product data to serve yet. Flip PRODUCTS_SOURCE=d1
// (see DEPLOY_CHECKLIST.md) only after all three of those have actually
// run against the real deployment and been verified.
//
// Even with the flag on, a D1 read failure (binding not configured - e.g.
// plain `next dev`, which has no real Workers runtime and only a no-op
// `cloudflare:workers` shim - or a genuine outage) falls back to the
// static array rather than 500ing the whole shop. This is also why /shop
// and /shop/[id] must run under `dev:vinext`, not plain `dev`, to actually
// exercise the D1 path locally.
const USE_D1 = process.env.PRODUCTS_SOURCE === "d1";

export async function listShopProducts(): Promise<Product[]> {
  if (!USE_D1) {
    return PRODUCTS;
  }

  try {
    return await listActiveProducts();
  } catch (error) {
    console.error("[catalog] D1 listActiveProducts() failed, falling back to the static PRODUCTS array:", error);
    return PRODUCTS;
  }
}

export async function getShopProductBySlug(slug: string): Promise<Product | null> {
  if (!USE_D1) {
    return PRODUCTS.find((product) => product.id === slug) ?? null;
  }

  try {
    return await getActiveProductBySlug(slug);
  } catch (error) {
    console.error("[catalog] D1 getActiveProductBySlug() failed, falling back to the static PRODUCTS array:", error);
    return PRODUCTS.find((product) => product.id === slug) ?? null;
  }
}
