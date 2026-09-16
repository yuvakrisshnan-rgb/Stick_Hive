"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Package, RefreshCw, TrendingUp } from "lucide-react";

// ============================================================================
// TYPES (mirror backend/orders/analytics.ts's OrderAnalytics)
// ============================================================================

type LocationBreakdown = {
  state: string;
  count: number;
  cities: { city: string; count: number }[];
};

type ProductBreakdown = {
  productId: string | null;
  name: string;
  totalQuantity: number;
  orderCount: number;
};

type CustomStickerBreakdown = {
  shape: string;
  finish: string;
  totalQuantity: number;
  orderCount: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
  orderCount: number;
};

type StatusCount = {
  status: string;
  count: number;
  percentage: number;
};

type OrderAnalytics = {
  totalOrders: number;
  ordersByLocation: LocationBreakdown[];
  topCatalogProducts: ProductBreakdown[];
  topCustomStickers: CustomStickerBreakdown[];
  revenueTrend: RevenuePoint[];
  orderStatusBreakdown: StatusCount[];
  paymentStatusBreakdown: StatusCount[];
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl bg-black/[0.025] p-6 text-center text-sm font-semibold text-black/40">
      {message}
    </div>
  );
}

// ============================================================================
// RANKED BAR LIST (shared by location + product panels)
// ============================================================================

function RankedBarList({
  rows,
}: {
  rows: { label: string; sublabel?: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-bold">
              {row.label}
              {row.sublabel && <span className="ml-2 font-medium text-black/40">{row.sublabel}</span>}
            </span>
            <span className="shrink-0 font-extrabold">{row.count}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-honey-orange"
              style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// REVENUE TREND (30-day CSS bar chart)
// ============================================================================

function RevenueTrendChart({ points }: { points: RevenuePoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = points.reduce((sum, point) => sum + point.orderCount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <p className="text-2xl font-extrabold">{money(totalRevenue)}</p>
          <p className="text-xs font-semibold text-black/40">Last 30 days, paid orders only</p>
        </div>
        <p className="text-sm font-bold text-black/50">{totalOrders} paid order{totalOrders === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-5 flex h-40 items-end gap-[3px]">
        {points.map((point) => (
          <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${point.date}: ${money(point.revenue)} · ${point.orderCount} order${point.orderCount === 1 ? "" : "s"}`}>
            <div
              className={`w-full rounded-t-sm transition-all ${point.revenue > 0 ? "bg-honey-orange group-hover:bg-black" : "bg-black/[0.06]"}`}
              style={{ height: `${Math.max(2, (point.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-black/35">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS BREAKDOWN LIST
// ============================================================================

function StatusBreakdownList({ rows }: { rows: StatusCount[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.status}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-bold capitalize">{statusLabel(row.status)}</span>
            <span className="font-extrabold">
              {row.count} <span className="font-semibold text-black/40">({row.percentage}%)</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-hive-yellow" style={{ width: `${Math.max(4, row.percentage)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PANEL SHELL
// ============================================================================

function Panel({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-cream">{icon}</div>
        <div>
          <h3 className="text-lg font-extrabold">{title}</h3>
          {subtitle && <p className="text-xs font-semibold text-black/40">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ============================================================================
// ANALYTICS PANEL (main export)
// ============================================================================

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const data = (await response.json()) as any;
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load analytics.");
      setAnalytics(data.analytics as OrderAnalytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analytics.");
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

  if (error) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <p className="font-bold">{error}</p>
        <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={15} /> Retry
        </button>
      </section>
    );
  }

  if (!analytics || analytics.totalOrders === 0) {
    return (
      <section className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
        <Package className="mx-auto" size={42} />
        <h2 className="mt-5 text-2xl font-extrabold">No orders yet</h2>
        <p className="mt-2 text-black/50">Analytics will populate automatically once orders start coming in.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-black/50">{analytics.totalOrders} total order{analytics.totalOrders === 1 ? "" : "s"}</p>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <Panel icon={<TrendingUp size={18} />} title="Revenue trend" subtitle="Daily total, paid orders only">
        <RevenueTrendChart points={analytics.revenueTrend} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={<MapPin size={18} />} title="Orders by location" subtitle="Top 10 states by order count">
          {analytics.ordersByLocation.length === 0 ? (
            <EmptyPanel message="No shipping addresses recorded yet." />
          ) : (
            <div className="space-y-5">
              {analytics.ordersByLocation.map((location) => (
                <div key={location.state}>
                  <RankedBarList rows={[{ label: location.state, count: location.count }]} />
                  {location.cities.length > 0 && (
                    <p className="mt-1.5 pl-1 text-xs text-black/40">
                      {location.cities.map((city) => `${city.city} (${city.count})`).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel icon={<Package size={18} />} title="Order & payment status" subtitle="Where the pipeline stands right now">
          {analytics.orderStatusBreakdown.length === 0 ? (
            <EmptyPanel message="No orders yet." />
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-black/40">Fulfillment status</p>
                <StatusBreakdownList rows={analytics.orderStatusBreakdown} />
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-black/40">Payment status</p>
                <StatusBreakdownList rows={analytics.paymentStatusBreakdown} />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={<Package size={18} />} title="Top-selling products" subtitle="Catalog items, ranked by quantity sold">
          {analytics.topCatalogProducts.length === 0 ? (
            <EmptyPanel message="No catalog product orders yet." />
          ) : (
            <RankedBarList
              rows={analytics.topCatalogProducts.map((product) => ({
                label: product.name,
                sublabel: `${product.orderCount} order${product.orderCount === 1 ? "" : "s"}`,
                count: product.totalQuantity,
              }))}
            />
          )}
        </Panel>

        <Panel icon={<Package size={18} />} title="Custom stickers" subtitle="By shape + finish — no per-design ID exists in the data yet">
          {analytics.topCustomStickers.length === 0 ? (
            <EmptyPanel message="No custom sticker orders yet." />
          ) : (
            <RankedBarList
              rows={analytics.topCustomStickers.map((sticker) => ({
                label: `${sticker.shape} · ${sticker.finish}`,
                sublabel: `${sticker.orderCount} order${sticker.orderCount === 1 ? "" : "s"}`,
                count: sticker.totalQuantity,
              }))}
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
