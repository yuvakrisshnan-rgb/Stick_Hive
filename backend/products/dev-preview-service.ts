import { getD1 } from "../db/d1";
import type { Category, Product } from "../../src/lib/product-data";

export { isDevPreviewAllowed } from "./dev-preview-guard";

// Backs the dev-only /dev/product-preview route (see src/app/dev/layout.tsx
// for the production-404 gate). This is deliberately NOT the shape a real
// D1-backed shop integration would take - it exists only to prove the
// products table + local image pipeline actually work end to end, by
// rendering through the same ProductCard/ProductDetails components the
// live (still static-array-backed) shop uses.

type ProductRow = {
  slug: string;
  name: string;
  category: string;
  tags: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
};

// Real fields map directly from the row. Everything else is a mock-catalog
// UI field the products table deliberately doesn't carry (see
// migrations/0006_products.sql) - filled with a fixed, honest placeholder
// rather than anything that pretends to be real data (0 rating/reviews,
// not-yet-live labels, etc). `category` is cast to the legacy `Category`
// union purely so this compiles against ProductCard/ProductDetails' prop
// types - real values like "Bollywood" aren't members of that union yet
// (see the not-yet-approved category-mapping proposal), but neither
// component ever type-narrows on `category`, only displays it, so the
// cast is safe in this one, isolated, dev-only call site.
function toPreviewProduct(row: ProductRow): Product {
  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    category: row.category as Category,
    tags: JSON.parse(row.tags) as string[],
    image: `/product-images-build/${row.slug}/main.webp`,
    images: [`/product-images-build/${row.slug}/main.webp`],
    color: "#FFF8ED",
    sizes: ["Small", "Medium", "Large"],
    rating: 0,
    reviews: 0,
    salesCount: 0,
    createdAt: row.created_at,
    labels: [],
    isPremium: false,
    inStock: true,
  };
}

export async function listDevPreviewProducts(limit = 3): Promise<Product[]> {
  const db = getD1();
  const { results } = await db
    .prepare("SELECT slug, name, category, tags, description, price, status, created_at FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<ProductRow>();
  return results.map(toPreviewProduct);
}

export async function getDevPreviewProductBySlug(slug: string): Promise<Product | null> {
  const db = getD1();
  const row = await db
    .prepare("SELECT slug, name, category, tags, description, price, status, created_at FROM products WHERE slug = ? AND status = 'active'")
    .bind(slug)
    .first<ProductRow>();
  return row ? toPreviewProduct(row) : null;
}
