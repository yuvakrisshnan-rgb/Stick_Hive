import { getD1 } from "../db/d1";
import { requireAdmin } from "../orders/service";

// ============================================================================
// ADMIN INSIGHTS — automated alert conditions
// ============================================================================
//
// Three conditions, each computed straight from D1 with no new schema and
// no historical-snapshot table (none exists) — every number here is
// derivable from timestamps already stored on `orders`/`products` today.
// Deliberately NOT inventing a fourth condition that would need data this
// app doesn't track (e.g. a real page-view/traffic signal — see
// BACKLOG.md's Cloudflare Web Analytics note).
// ============================================================================

const STUCK_PAYMENT_HOURS = 24;

export type StuckPayment = {
  orderId: string;
  customerName: string;
  total: number;
  claimedAt: string;
  hoursStuck: number;
};

// --------------------------------------------------------------------------
// 1. STUCK UPI PAYMENT — claimed by the buyer, never verified by an admin,
//    past a threshold. Ties directly to claimUpiPayment()/payment_claimed_at
//    and the admin payment-verification flow (payment_verification) already
//    in backend/orders/service.ts — this is a real gap in that flow, not an
//    invented condition.
// --------------------------------------------------------------------------

async function getStuckUpiPayments(db: D1Database): Promise<StuckPayment[]> {
  const threshold = new Date(Date.now() - STUCK_PAYMENT_HOURS * 60 * 60 * 1000).toISOString();

  const { results } = await db
    .prepare(
      `SELECT order_id AS orderId, customer, total, payment_claimed_at AS claimedAt
       FROM orders
       WHERE payment_method = 'upi'
         AND payment_status = 'pending_confirmation'
         AND payment_claimed_at IS NOT NULL
         AND payment_claimed_at <= ?
         AND payment_verification IS NULL
       ORDER BY payment_claimed_at ASC`,
    )
    .bind(threshold)
    .all<{ orderId: string; customer: string; total: number; claimedAt: string }>();

  const now = Date.now();
  return results.map((row) => {
    let customerName = "Unknown";
    try {
      customerName = (JSON.parse(row.customer) as { name?: string }).name ?? "Unknown";
    } catch {
      // Malformed customer JSON shouldn't hide a real stuck-payment alert —
      // fall back to "Unknown" rather than dropping the row.
    }
    const hoursStuck = Math.round(((now - new Date(row.claimedAt).getTime()) / (60 * 60 * 1000)) * 10) / 10;
    return { orderId: row.orderId, customerName, total: row.total, claimedAt: row.claimedAt, hoursStuck };
  });
}

// --------------------------------------------------------------------------
// 2. REVIEW-QUEUE BACKLOG — current size + a real day-over-day comparison
//    (count of needs_review rows created in the last 24h vs. the 24h before
//    that), using products.created_at, which is already stored on every
//    row. No fabricated "growth rate" beyond what two real data points
//    support.
// --------------------------------------------------------------------------

export type ReviewQueueInsight = {
  currentBacklog: number;
  addedLast24h: number;
  addedPrior24h: number;
  oldestUnreviewedDays: number | null;
};

async function getReviewQueueInsight(db: D1Database): Promise<ReviewQueueInsight> {
  const now = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const prior48h = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const [backlogRow, last24hRow, prior24hRow, oldestRow] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM products WHERE needs_review = 1").first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM products WHERE needs_review = 1 AND created_at >= ?")
      .bind(last24h)
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM products WHERE needs_review = 1 AND created_at >= ? AND created_at < ?")
      .bind(prior48h, last24h)
      .first<{ count: number }>(),
    db.prepare("SELECT MIN(created_at) AS oldest FROM products WHERE needs_review = 1").first<{ oldest: string | null }>(),
  ]);

  const oldestUnreviewedDays = oldestRow?.oldest
    ? Math.round(((now - new Date(oldestRow.oldest).getTime()) / (24 * 60 * 60 * 1000)) * 10) / 10
    : null;

  return {
    currentBacklog: backlogRow?.count ?? 0,
    addedLast24h: last24hRow?.count ?? 0,
    addedPrior24h: prior24hRow?.count ?? 0,
    oldestUnreviewedDays,
  };
}

// --------------------------------------------------------------------------
// 3. ORDER-VOLUME SHIFT — last-24h order count vs. the average daily count
//    over the preceding 7 days, using orders.created_at. Explicitly reports
//    "insufficient data" below a minimum sample size rather than presenting
//    a percentage swing that a handful of orders can't actually support —
//    this catalogue's real order volume is still very small.
// --------------------------------------------------------------------------

const MIN_ORDERS_FOR_VOLUME_SIGNAL = 20;

export type OrderVolumeInsight = {
  ordersLast24h: number;
  avgDailyPriorWeek: number;
  totalOrders: number;
  sufficientData: boolean;
};

async function getOrderVolumeInsight(db: D1Database): Promise<OrderVolumeInsight> {
  const now = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const prior8Days = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();

  const [last24hRow, priorWeekRow, totalRow] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM orders WHERE created_at >= ?").bind(last24h).first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM orders WHERE created_at >= ? AND created_at < ?")
      .bind(prior8Days, last24h)
      .first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM orders").first<{ count: number }>(),
  ]);

  const totalOrders = totalRow?.count ?? 0;

  return {
    ordersLast24h: last24hRow?.count ?? 0,
    avgDailyPriorWeek: Math.round(((priorWeekRow?.count ?? 0) / 7) * 10) / 10,
    totalOrders,
    sufficientData: totalOrders >= MIN_ORDERS_FOR_VOLUME_SIGNAL,
  };
}

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

export type AdminInsights = {
  stuckPayments: StuckPayment[];
  reviewQueue: ReviewQueueInsight;
  orderVolume: OrderVolumeInsight;
};

export async function getAdminInsights(): Promise<AdminInsights> {
  await requireAdmin();
  const db = getD1();

  const [stuckPayments, reviewQueue, orderVolume] = await Promise.all([
    getStuckUpiPayments(db),
    getReviewQueueInsight(db),
    getOrderVolumeInsight(db),
  ]);

  return { stuckPayments, reviewQueue, orderVolume };
}
