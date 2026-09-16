import { getCollection } from "../db/mongodb";
import { requireAdmin } from "./service";
import type { OrderDocument } from "./service";

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

async function getOrdersByLocation(collection: Awaited<ReturnType<typeof getCollection<OrderDocument>>>): Promise<LocationBreakdown[]> {
  const rows = await collection
    .aggregate<{ _id: string; count: number; cities: { city: string; count: number }[] }>([
      { $match: { "customer.address.state": { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: { state: "$customer.address.state", city: "$customer.address.city" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.state",
          count: { $sum: "$count" },
          cities: { $push: { city: "$_id.city", count: "$count" } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: TOP_LOCATIONS_LIMIT },
    ])
    .toArray();

  // Sorting/slicing the small per-state city list in JS rather than via
  // $sortArray (MongoDB 5.2+) keeps this aggregation portable across
  // whatever MongoDB version the deployment target actually runs.
  return rows.map((row) => ({
    state: row._id,
    count: row.count,
    cities: [...row.cities].sort((a, b) => b.count - a.count).slice(0, CITIES_PER_STATE_LIMIT),
  }));
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

async function getTopCatalogProducts(collection: Awaited<ReturnType<typeof getCollection<OrderDocument>>>): Promise<ProductBreakdown[]> {
  const rows = await collection
    .aggregate<{ _id: { productId: string; name: string }; totalQuantity: number; orderCount: number }>([
      { $unwind: "$items" },
      { $match: { "items.type": "product" } },
      {
        $group: {
          _id: { productId: "$items.productId", name: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: TOP_PRODUCTS_LIMIT },
    ])
    .toArray();

  return rows.map((row) => ({
    productId: row._id.productId ?? null,
    name: row._id.name,
    totalQuantity: row.totalQuantity,
    orderCount: row.orderCount,
  }));
}

async function getTopCustomStickers(collection: Awaited<ReturnType<typeof getCollection<OrderDocument>>>): Promise<CustomStickerBreakdown[]> {
  const rows = await collection
    .aggregate<{ _id: { shape: string; finish: string }; totalQuantity: number; orderCount: number }>([
      { $unwind: "$items" },
      { $match: { "items.type": "custom" } },
      {
        $group: {
          _id: { shape: { $ifNull: ["$items.shape", "Unknown"] }, finish: { $ifNull: ["$items.finish", "Unknown"] } },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: TOP_PRODUCTS_LIMIT },
    ])
    .toArray();

  return rows.map((row) => ({
    shape: row._id.shape,
    finish: row._id.finish,
    totalQuantity: row.totalQuantity,
    orderCount: row.orderCount,
  }));
}

// ============================================================================
// REVENUE TREND (last 30 days, paid orders only)
// ============================================================================

async function getRevenueTrend(collection: Awaited<ReturnType<typeof getCollection<OrderDocument>>>): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (REVENUE_TREND_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await collection
    .aggregate<{ _id: string; revenue: number; orderCount: number }>([
      { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const byDate = new Map(rows.map((row) => [row._id, row]));

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

function toPercentageBreakdown(rows: { _id: string; count: number }[], total: number): StatusCount[] {
  return rows
    .map((row) => ({
      status: row._id,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

async function getStatusBreakdowns(
  collection: Awaited<ReturnType<typeof getCollection<OrderDocument>>>,
): Promise<{ total: number; byOrderStatus: StatusCount[]; byPaymentStatus: StatusCount[] }> {
  const [result] = await collection
    .aggregate<{
      byOrderStatus: { _id: string; count: number }[];
      byPaymentStatus: { _id: string; count: number }[];
      total: { count: number }[];
    }>([
      {
        $facet: {
          byOrderStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byPaymentStatus: [{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }],
          total: [{ $count: "count" }],
        },
      },
    ])
    .toArray();

  const total = result?.total[0]?.count ?? 0;
  return {
    total,
    byOrderStatus: toPercentageBreakdown(result?.byOrderStatus ?? [], total),
    byPaymentStatus: toPercentageBreakdown(result?.byPaymentStatus ?? [], total),
  };
}

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

export async function getOrderAnalytics(): Promise<OrderAnalytics> {
  await requireAdmin();
  const collection = await getCollection<OrderDocument>("orders");

  const [ordersByLocation, topCatalogProducts, topCustomStickers, revenueTrend, statusBreakdowns] = await Promise.all([
    getOrdersByLocation(collection),
    getTopCatalogProducts(collection),
    getTopCustomStickers(collection),
    getRevenueTrend(collection),
    getStatusBreakdowns(collection),
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
