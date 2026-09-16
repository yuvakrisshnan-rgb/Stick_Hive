import { getD1, nowIso } from "../db/d1";
import { getCurrentUser } from "../auth/service";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function getWishlist(): Promise<{ productIds: string[] }> {
  const user = await requireUser();
  const db = getD1();
  const row = await db
    .prepare("SELECT product_ids FROM wishlists WHERE user_id = ?")
    .bind(user.id)
    .first<{ product_ids: string }>();
  return { productIds: row ? (JSON.parse(row.product_ids) as string[]) : [] };
}

export async function replaceWishlist(productIds: string[]): Promise<{ productIds: string[] }> {
  const user = await requireUser();
  const unique = [...new Set(productIds)].filter((id) => typeof id === "string" && id.length <= 200);
  const db = getD1();
  const now = nowIso();

  // On conflict (existing wishlist row), only touch product_ids/updated_at -
  // user_id/created_at are excluded from the UPDATE SET, matching the
  // original Mongo upsert's $setOnInsert for those two fields.
  await db
    .prepare(
      `INSERT INTO wishlists (user_id, product_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         product_ids = excluded.product_ids,
         updated_at = excluded.updated_at`,
    )
    .bind(user.id, JSON.stringify(unique), now, now)
    .run();

  return { productIds: unique };
}
