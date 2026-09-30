"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, TrendingUp } from "lucide-react";

// ============================================================================
// TYPES (mirror backend/admin/insights.ts's AdminInsights)
// ============================================================================

type StuckPayment = {
  orderId: string;
  customerName: string;
  total: number;
  claimedAt: string;
  hoursStuck: number;
};

type ReviewQueueInsight = {
  currentBacklog: number;
  addedLast24h: number;
  addedPrior24h: number;
  oldestUnreviewedDays: number | null;
};

type OrderVolumeInsight = {
  ordersLast24h: number;
  avgDailyPriorWeek: number;
  totalOrders: number;
  sufficientData: boolean;
};

type AdminInsights = {
  stuckPayments: StuckPayment[];
  reviewQueue: ReviewQueueInsight;
  orderVolume: OrderVolumeInsight;
};

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ============================================================================
// ALERT CARD — same visual pattern as admin-client.tsx's existing "X
// payments waiting for verification" banner (rounded-[2rem], tinted border
// + background), amber when a real condition is triggered, a calm neutral
// card when it isn't.
// ============================================================================

function AlertCard({
  triggered,
  icon,
  title,
  subtitle,
  children,
}: {
  triggered: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 ${
        triggered ? "border-hive-yellow bg-hive-yellow/40" : "border-black/10 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${triggered ? "bg-white" : "bg-cream"}`}>
          {icon}
        </div>
        <div>
          <p className="font-extrabold">{title}</p>
          <p className="text-sm text-black/60">{subtitle}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

// ============================================================================
// INSIGHTS PANEL (main export)
// ============================================================================

export default function InsightsPanel() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/insights", { cache: "no-store" });
      const data = (await response.json()) as { success: boolean; error?: string; insights?: AdminInsights };
      if (!response.ok || !data.success || !data.insights) throw new Error(data.error || "Unable to load insights.");
      setInsights(data.insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[35vh] items-center justify-center">
        <Loader2 className="animate-spin" size={30} />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <p className="font-bold">{error || "Unable to load insights."}</p>
        <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={15} /> Retry
        </button>
      </section>
    );
  }

  const { stuckPayments, reviewQueue, orderVolume } = insights;

  const reviewQueueTriggered = reviewQueue.addedLast24h > reviewQueue.addedPrior24h && reviewQueue.addedLast24h >= 5;
  const volumeDelta = orderVolume.avgDailyPriorWeek > 0
    ? Math.round(((orderVolume.ordersLast24h - orderVolume.avgDailyPriorWeek) / orderVolume.avgDailyPriorWeek) * 100)
    : null;
  const volumeTriggered = orderVolume.sufficientData && volumeDelta !== null && Math.abs(volumeDelta) >= 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-black/50">3 automated conditions, checked live against D1</p>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ================================================================
          1. STUCK UPI PAYMENTS
      ================================================================ */}

      <AlertCard
        triggered={stuckPayments.length > 0}
        icon={stuckPayments.length > 0 ? <AlertTriangle size={18} className="text-amber-700" /> : <CheckCircle2 size={18} className="text-green-600" />}
        title={
          stuckPayments.length > 0
            ? `${stuckPayments.length} UPI payment${stuckPayments.length === 1 ? "" : "s"} claimed but not verified for 24h+`
            : "No stuck UPI payments"
        }
        subtitle={
          stuckPayments.length > 0
            ? "A buyer marked payment as sent, but no admin has verified it yet — check the Order desk tab."
            : "Every claimed UPI payment has been verified within 24 hours."
        }
      >
        {stuckPayments.length > 0 && (
          <div className="space-y-2">
            {stuckPayments.map((payment) => (
              <div key={payment.orderId} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold">{payment.orderId} &middot; {payment.customerName}</p>
                  <p className="text-xs text-black/50">Claimed {new Date(payment.claimedAt).toLocaleString("en-IN")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-extrabold">{money(payment.total)}</p>
                  <p className="text-xs font-semibold text-amber-700">{payment.hoursStuck}h stuck</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AlertCard>

      {/* ================================================================
          2. REVIEW-QUEUE BACKLOG
      ================================================================ */}

      <AlertCard
        triggered={reviewQueueTriggered}
        icon={reviewQueueTriggered ? <AlertTriangle size={18} className="text-amber-700" /> : <Clock size={18} className="text-black/50" />}
        title={`${reviewQueue.currentBacklog} product${reviewQueue.currentBacklog === 1 ? "" : "s"} pending review`}
        subtitle={
          reviewQueueTriggered
            ? `Growing: ${reviewQueue.addedLast24h} added in the last 24h vs. ${reviewQueue.addedPrior24h} the 24h before that.`
            : `${reviewQueue.addedLast24h} added in the last 24h vs. ${reviewQueue.addedPrior24h} the 24h before — not currently accelerating.`
        }
      >
        {reviewQueue.oldestUnreviewedDays !== null && (
          <p className="text-xs font-semibold text-black/50">
            Oldest unreviewed item has been waiting {reviewQueue.oldestUnreviewedDays} day{reviewQueue.oldestUnreviewedDays === 1 ? "" : "s"}.
          </p>
        )}
      </AlertCard>

      {/* ================================================================
          3. ORDER-VOLUME SHIFT
      ================================================================ */}

      <AlertCard
        triggered={volumeTriggered}
        icon={volumeTriggered ? <AlertTriangle size={18} className="text-amber-700" /> : <TrendingUp size={18} className="text-black/50" />}
        title={
          !orderVolume.sufficientData
            ? "Not enough order history yet for a volume signal"
            : volumeDelta !== null
              ? `Orders ${volumeDelta >= 0 ? "up" : "down"} ${Math.abs(volumeDelta)}% vs. the prior week's daily average`
              : "No prior-week order data yet"
        }
        subtitle={
          !orderVolume.sufficientData
            ? `Only ${orderVolume.totalOrders} orders exist total — this needs a real baseline (${20}+) before a volume swing means anything.`
            : `${orderVolume.ordersLast24h} order${orderVolume.ordersLast24h === 1 ? "" : "s"} in the last 24h vs. an average of ${orderVolume.avgDailyPriorWeek}/day over the prior week.`
        }
      />
    </div>
  );
}
