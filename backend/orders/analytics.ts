import { getD1 } from "../db/d1";
import { requireAdmin } from "./service";

// ============================================================================
// TYPES
// ============================================================================

export type LocationBreakdown = {
  state: string;
  count: number;
  cities: { city: string; count: number }[];
};

export type ProductBreakdown = {
  productId: string | null;
  name: string;
  totalQuantity: number;
  orderCount: number;
};

export type CustomStickerBreakdown = {
  shape: string;
  finish: string;
  totalQuantity: number;
  orderCount: number;
};

export type RevenuePoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
  orderCount: number;
};

export type StatusCount = {
  status: string;
  count: number;
  percentage: number;
};

export type OrderAnalytics = {
  totalOrders: number;
  ordersByLocation: LocationBreakdown[];
  topCatalogProducts: ProductBreakdown[];
  topCustomStickers: CustomStickerBreakdown[];
  revenueTrend: RevenuePoint[];
  orderStatusBreakdown: StatusCount[];
  paymentStatusBreakdown: StatusCount[];
};

const REVENUE_TREND_DAYS = 30;
const TOP_LOCATIONS_LIMIT = 10;
const TOP_PRODUCTS_LIMIT = 10;
const CITIES_PER_STATE_LIMIT = 5;

// ============================================================================
// ORDERS BY LOCATION (state, with city drill-down)
// ============================================================================

async function getOrdersByLocation(db: D1Database): Promise<LocationBreakdown[]> {
  const { results } = await db
    .prepare(
      `SELECT
         json_extract(customer, '$.address.state') AS state,
         json_extract(customer, '$.address.city') AS city,
         COUNT(*) AS count
       FROM orders
       WHERE json_extract(customer, '$.address.state') IS NOT NULL
         AND json_extract(customer, '$.address.state') != ''
       GROUP BY state, city`,
    )
    .all<{ state: string; city: string; count: number }>();

  const byState = new Map<string, { count: number; cities: { city: string; count: number }[] }>();
  for (const row of results) {
    const entry = byState.get(row.state) ?? { count: 0, cities: [] };
    entry.count += row.count;
    entry.cities.push({ city: row.city, count: row.count });
    byState.set(row.state, entry);
  }

  // Sorting/slicing the small per-state city list in JS (rather than in
  // SQL) mirrors how the original Mongo aggregation did it too - simplest
  // for a list this small, and keeps the SQL portable.
  return [...byState.entries()]
    .map(([state, entry]) => ({
      state,
      count: entry.count,
      cities: [...entry.cities].sort((a, b) => b.count - a.count).slice(0, CITIES_PER_STATE_LIMIT),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_LOCATIONS_LIMIT);
}

// ============================================================================
// TOP-SELLING PRODUCTS
// ============================================================================
//
// Catalog products and custom stickers are structurally different (custom
// items have no productId and always share the generic productName "Custom
// Sticker" — see createOrderFromCheckout), so they're aggregated and
// reported separately rather than forced into one ranked list. Custom
// stickers have no per-design identifier in the schema, so instead of
// pretending to rank "top designs", this groups them by shape+finish —
// the only structured, meaningful distinction the data actually has.
// ============================================================================

async function getTopCatalogProducts(db: D1Database): Promise<ProductBreakdown[]> {
  const { results } = await db
    .prepare(
      `SELECT product_id AS productId, product_name AS name, SUM(quantity) AS totalQuantity, COUNT(*) AS orderCount
       FROM order_items
       WHERE type = 'product'
       GROUP BY product_id, product_name
       ORDER BY totalQuantity DESC
       LIMIT ?`,
    )
    .bind(TOP_PRODUCTS_LIMIT)
    .all<{ productId: string | null; name: string; totalQuantity: number; orderCount: number }>();

  return results.map((row) => ({
    productId: row.productId ?? null,
    name: row.name,
    totalQuantity: row.totalQuantity,
    orderCount: row.orderCount,
  }));
}

async function getTopCustomStickers(db: D1Database): Promise<CustomStickerBreakdown[]> {
  const { results } = await db
    .prepare(
      `SELECT
         COALESCE(shape, 'Unknown') AS shape,
         COALESCE(finish, 'Unknown') AS finish,
         SUM(quantity) AS totalQuantity,
         COUNT(*) AS orderCount
       FROM order_items
       WHERE type = 'custom'
       GROUP BY COALESCE(shape, 'Unknown'), COALESCE(finish, 'Unknown')
       ORDER BY totalQuantity DESC
       LIMIT ?`,
    )
    .bind(TOP_PRODUCTS_LIMIT)
    .all<{ shape: string; finish: string; totalQuantity: number; orderCount: number }>();

  return results.map((row) => ({
    shape: row.shape,
    finish: row.finish,
    totalQuantity: row.totalQuantity,
    orderCount: row.orderCount,
  }));
}

// ============================================================================
// REVENUE TREND (last 30 days, paid orders only)
// ============================================================================

async function getRevenueTrend(db: D1Database): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (REVENUE_TREND_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  // created_at is always an ISO 8601 UTC string (see nowIso()), so the
  // first 10 characters are always its YYYY-MM-DD date - a plain substr
  // does what $dateToString did in the Mongo version.
  const { results } = await db
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date, SUM(total) AS revenue, COUNT(*) AS orderCount
       FROM orders
       WHERE payment_status = 'paid' AND created_at >= ?
       GROUP BY date`,
    )
    .bind(since.toISOString())
    .all<{ date: string; revenue: number; orderCount: number }>();

  const byDate = new Map(results.map((row) => [row.date, row]));

  // Fill in every day in the window (including zero-revenue days) so the
  // chart has a continuous 30-day axis instead of gaps where nothing sold.
  const points: RevenuePoint[] = [];
  for (let i = 0; i < REVENUE_TREND_DAYS; i += 1) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const match = byDate.get(key);
    points.push({ date: key, revenue: match?.revenue ?? 0, orderCount: match?.orderCount ?? 0 });
  }
  return points;
}

// ============================================================================
// STATUS BREAKDOWN (orderStatus + paymentStatus, with percentages)
// ============================================================================

function toPercentageBreakdown(rows: { status: string; count: number }[], total: number): StatusCount[] {
  return rows
    .map((row) => ({
      status: row.status,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

async function getStatusBreakdowns(
  db: D1Database,
): Promise<{ total: number; byOrderStatus: StatusCount[]; byPaymentStatus: StatusCount[] }> {
  const [byOrderStatus, byPaymentStatus, totalRow] = await Promise.all([
    db.prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status").all<{ status: string; count: number }>(),
    db.prepare("SELECT payment_status AS status, COUNT(*) AS count FROM orders GROUP BY payment_status").all<{ status: string; count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM orders").first<{ count: number }>(),
  ]);

  const total = totalRow?.count ?? 0;
  return {
    total,
    byOrderStatus: toPercentageBreakdown(byOrderStatus.results, total),
    byPaymentStatus: toPercentageBreakdown(byPaymentStatus.results, total),
  };
}

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

export async function getOrderAnalytics(): Promise<OrderAnalytics> {
  await requireAdmin();
  const db = getD1();

  const [ordersByLocation, topCatalogProducts, topCustomStickers, revenueTrend, statusBreakdowns] = await Promise.all([
    getOrdersByLocation(db),
    getTopCatalogProducts(db),
    getTopCustomStickers(db),
    getRevenueTrend(db),
    getStatusBreakdowns(db),
  ]);

  return {
    totalOrders: statusBreakdowns.total,
    ordersByLocation,
    topCatalogProducts,
    topCustomStickers,
    revenueTrend,
    orderStatusBreakdown: statusBreakdowns.byOrderStatus,
    paymentStatusBreakdown: statusBreakdowns.byPaymentStatus,
  };
}
