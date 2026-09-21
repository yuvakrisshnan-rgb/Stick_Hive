import { getD1 } from "../db/d1";
import type { Category, Product } from "../../src/lib/product-data";

// Real, D1-backed shop catalogue. Unlike dev-preview-service.ts (a
// throwaway proof-of-concept for the intake pipeline, explicitly not meant
// to be the shape a real integration takes), this is what /shop and
// /shop/[id] actually read from.

type ProductRow = {
  slug: string;
  name: string;
  category: string;
  tags: string;
  description: string;
  status: string;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

const PRODUCT_COLUMNS = "slug, name, category, tags, description, status, image_url, thumbnail_url, created_at";

// The products table carries none of these - they're mock-catalogue UI
// embellishments product-data.ts's Product type has but intake never
// produced real values for (see migrations/0006_products.sql). Same fixed,
// honest-placeholder convention dev-preview-service.ts already uses, for
// consistency between the two D1-backed call sites.
const PLACEHOLDER_COLOR = "#FFF8ED";
const PLACEHOLDER_EMOJI = "🏷️";
const PLACEHOLDER_SIZES: Product["sizes"] = ["Small", "Medium", "Large"];

function toProduct(row: ProductRow): Product {
  // image_url/thumbnail_url are NULL until the (not-yet-run) R2 upload step
  // sets them - leaving `image`/`images` undefined here, rather than
  // pointing at a path that doesn't exist, is what lets StickerImage fall
  // back to rendering `emoji` instead of a broken image icon.
  const image = row.image_url ?? row.thumbnail_url ?? undefined;

  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    category: row.category as Category,
    tags: JSON.parse(row.tags) as string[],
    image,
    images: image ? [image] : undefined,
    emoji: PLACEHOLDER_EMOJI,
    color: PLACEHOLDER_COLOR,
    sizes: PLACEHOLDER_SIZES,
    rating: 0,
    reviews: 0,
    salesCount: 0,
    createdAt: row.created_at,
    labels: [],
    isPremium: false,
    inStock: true,
  };
}

/** Every status='active' product, for /shop's browse/search/filter/sort UI. */
export async function listActiveProducts(): Promise<Product[]> {
  const db = getD1();
  const { results } = await db
    .prepare(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE status = 'active' ORDER BY created_at DESC`)
    .all<ProductRow>();
  return results.map(toProduct);
}

/** A single active product by slug, for /shop/[id]. Returns null (not a draft row) if not found or not active. */
export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const db = getD1();
  const row = await db
    .prepare(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = ? AND status = 'active'`)
    .bind(slug)
    .first<ProductRow>();
  return row ? toProduct(row) : null;
}
