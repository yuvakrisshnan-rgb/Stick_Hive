"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
// StoredOrder is the locked, authoritative Order contract — see src/types/order.ts.
import type { StoredOrder } from "@/types/order";

function formatStatus(order: StoredOrder): string {
  if (order.paymentStatus === "pending_confirmation") return "Payment Verification Pending";
  if (order.paymentStatus === "cancelled" && order.paymentMethod === "upi") return "Payment Window Expired";
  if (order.paymentStatus !== "paid") return "Payment Pending";
  switch (order.status) {
    case "placed": return "Order Confirmed";
    case "processing": return "Processing";
    case "packed": return "Packed";
    case "shipped": return "Shipped";
    case "out_for_delivery": return "Out for Delivery";
    case "delivered": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return "Order Confirmed";
  }
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    void fetch("/api/orders", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { success?: boolean; orders?: StoredOrder[]; error?: string } | null;
        if (!response.ok || !payload?.success) throw new Error(payload?.error || "Unable to load your orders.");
        if (!cancelled) setOrders(Array.isArray(payload.orders) ? payload.orders : []);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load your orders."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, user]);

  if (authLoading || loading) return <main className="min-h-screen bg-cream px-6 pb-20 pt-32"><div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center"><Loader2 size={30} className="animate-spin" /></div></main>;

  if (!user) return <main className="min-h-screen bg-cream px-6 pb-20 pt-32"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black"><ArrowLeft size={16}/> Back to Home</Link><section className="mt-10 rounded-[2.5rem] bg-white p-10 text-center shadow-xl md:p-14"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-hive-yellow"><Package size={36}/></div><h1 className="mt-7 text-3xl font-extrabold">Sign in to see your orders</h1><p className="mx-auto mt-3 max-w-md text-black/50">Your Stick Hive orders are tied to your account so only you can see them.</p><p className="mt-4 text-sm font-semibold text-black/45">Use the account icon in the navigation to continue with email OTP.</p></section></div></main>;

  if (error) return <main className="min-h-screen bg-cream px-6 pb-20 pt-32"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black"><ArrowLeft size={16}/> Back to Home</Link><section className="mt-10 rounded-[2.5rem] bg-white p-10 text-center shadow-xl md:p-14"><h1 className="text-2xl font-extrabold">We couldn't load your orders</h1><p className="mt-3 text-sm text-black/50">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-7 inline-flex rounded-full bg-black px-7 py-3 text-sm font-bold text-white">Retry</button></section></div></main>;

  if (orders.length === 0) return <main className="min-h-screen bg-cream px-6 pb-20 pt-32"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black"><ArrowLeft size={16}/> Back to Home</Link><section className="mt-10 rounded-[2.5rem] bg-white p-10 text-center shadow-xl md:p-14"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-hive-yellow"><ShoppingBag size={36}/></div><h1 className="mt-7 text-3xl font-extrabold">No Orders Yet</h1><p className="mx-auto mt-3 max-w-md text-black/50">You haven't placed any Stick Hive orders yet.</p><Link href="/shop" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-4 font-bold text-white">Start Shopping <ArrowRight size={18}/></Link></section></div></main>;

  return <main className="min-h-screen bg-cream px-5 pb-24 pt-28 md:px-8 md:pt-32"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black"><ArrowLeft size={16}/> Back to Home</Link><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Stick Hive</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">My Orders</h1><p className="mt-3 text-black/50">Your orders, payment status and details in one place.</p></div><div className="mt-8 space-y-5">{orders.map((order) => { const itemCount = order.items.reduce((n, item) => n + item.quantity, 0); const status = formatStatus(order); const paymentPending = order.paymentStatus !== "paid"; return <section key={order.orderId} className="overflow-hidden rounded-[2rem] bg-white shadow-xl"><div className="flex flex-col gap-4 border-b border-black/10 p-6 md:flex-row md:items-center md:justify-between md:p-7"><div><p className="text-xs font-bold uppercase tracking-widest text-black/40">Order ID</p><h2 className="mt-1 text-xl font-extrabold">{order.orderId}</h2><p className="mt-1 text-sm text-black/50">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div><div className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-bold"><span className="mr-2 inline-block size-2 rounded-full bg-black" />{status}</div></div><div className="p-6 md:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><p className="font-extrabold">{itemCount} {itemCount === 1 ? "item" : "items"}</p><p className="mt-1 text-sm text-black/50">{order.items.map((item) => item.productName).slice(0, 3).join(", ")}{order.items.length > 3 ? " + more" : ""}</p></div><div className="md:text-right"><p className="text-sm text-black/50">Total</p><p className="mt-1 text-2xl font-extrabold">₹{order.total.toFixed(2)}</p></div></div><div className="mt-6 grid gap-3 border-t border-black/5 pt-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-black/40">Payment</p><p className="mt-1 text-sm font-bold">{paymentPending ? (order.paymentStatus === "pending_confirmation" ? "Payment submitted — awaiting verification" : "Payment not confirmed") : "Paid — order confirmed"}</p>{order.shippingDetails && order.paymentStatus === "paid" && <p className="mt-2 text-xs font-semibold text-black/45">{order.shippingDetails.method === "courier" ? `Shipping: ${order.shippingDetails.courier || "Courier"}${order.shippingDetails.trackingNumber ? ` · ${order.shippingDetails.trackingNumber}` : ""}` : order.shippingDetails.method === "pickup" ? `Pickup: ${order.shippingDetails.pickupLocation || "Pickup point"}` : "Local delivery"}</p>}</div><Link href={`/orders/${encodeURIComponent(order.orderId)}`} className="flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.01]">View Order <ArrowRight size={16}/></Link></div></div></section>; })}</div><div className="mt-8 text-center"><Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-bold hover:bg-black hover:text-white">Continue Shopping <ArrowRight size={16}/></Link></div></div></main>;
}
