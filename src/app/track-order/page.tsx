"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Package } from "lucide-react";
import { useSearchParams } from "next/navigation";
// StoredOrder is the locked, authoritative Order contract — see src/types/order.ts.
import type { StoredOrder as Order, OrderStatus as Status } from "@/types/order";

const steps: Array<{ id: Exclude<Status, "awaiting_payment" | "cancelled">; label: string; text: string }> = [
  { id: "placed", label: "Order Confirmed", text: "Your payment has been confirmed." },
  { id: "processing", label: "Processing", text: "We're preparing your stickers." },
  { id: "packed", label: "Packed", text: "Your order has been packed." },
  { id: "shipped", label: "Shipped", text: "Your order is on its way." },
  { id: "out_for_delivery", label: "Out for Delivery", text: "Your order is with the delivery agent." },
  { id: "delivered", label: "Delivered", text: "Your order has been delivered." },
];

function TrackOrderContent() {
  const search = useSearchParams();
  const orderId = search.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) { setError("No order ID was provided."); setLoading(false); return; }
    let active = true;
    void fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" }).then(async (r) => {
      const data = (await r.json().catch(() => null)) as any;
      if (!r.ok || !data?.success) throw new Error(data?.error || "Unable to load your order.");
      if (active) setOrder(data.order);
    }).catch((e) => active && setError(e instanceof Error ? e.message : "Unable to load your order.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [orderId]);

  return <main className="min-h-screen bg-cream px-5 pb-24 pt-28 md:px-8 md:pt-32"><div className="mx-auto max-w-4xl"><Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60"><ArrowLeft size={16}/> My Orders</Link>{loading ? <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={30} className="animate-spin"/></div> : error || !order ? <section className="mt-10 rounded-[2.5rem] bg-white p-10 text-center shadow-xl"><Package className="mx-auto" size={40}/><h1 className="mt-6 text-3xl font-extrabold">Order unavailable</h1><p className="mt-3 text-black/50">{error || "We couldn't find that order."}</p></section> : <><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Order {order.orderId}</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight">Track Order</h1><p className="mt-3 text-black/50">Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div><section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl md:p-8"><div className="rounded-2xl bg-black/[0.03] p-5"><p className="text-xs font-bold uppercase tracking-widest text-black/40">Payment</p><p className="mt-1 text-xl font-extrabold capitalize">{(order.paymentStatus || "pending").replaceAll("_", " ")}</p>{order.status === "awaiting_payment" && <p className="mt-2 text-sm text-black/50">Your order is waiting for payment verification. It will move to Order Confirmed after our team approves your payment.</p>}</div><div className="mt-8">{order.status === "awaiting_payment" ? <div className="rounded-2xl border border-black/10 p-5"><p className="font-extrabold">Waiting for payment confirmation</p><p className="mt-2 text-sm text-black/50">Once your UPI payment is verified, we'll confirm the order and start processing it.</p></div> : order.status === "cancelled" ? <div className="rounded-2xl border border-black/10 p-5"><p className="font-extrabold">Order cancelled</p><p className="mt-2 text-sm text-black/50">This order is no longer moving through fulfillment.</p></div> : <div className="space-y-6">{steps.map((step, index) => { const currentIndex = steps.findIndex((item) => item.id === order.status); const done = index <= currentIndex; return <div key={step.id} className="flex gap-4"><div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-hive-yellow" : "bg-black/[0.06]"}`}>{done ? <Check size={18}/> : <span className="text-sm font-bold">{index + 1}</span>}</div><div><p className="font-extrabold">{step.label}</p><p className="mt-1 text-sm text-black/50">{step.text}</p></div></div>; })}</div>}</div>{order.shippingDetails && order.paymentStatus === "paid" && <div className="mt-8 rounded-3xl border border-black/10 bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-black/40">Delivery details</p>{order.shippingDetails.method === "courier" && <><p className="mt-2 text-xl font-extrabold">{order.shippingDetails.courier}</p>{order.shippingDetails.trackingNumber && <p className="mt-1 text-sm font-semibold text-black/60">Tracking / AWB: {order.shippingDetails.trackingNumber}</p>}{order.shippingDetails.trackingUrl && <a href={order.shippingDetails.trackingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white">Track Package <ExternalLink size={15}/></a>}</>}{order.shippingDetails.method === "pickup" && <><p className="mt-2 text-xl font-extrabold">Ready for pickup</p><p className="mt-1 text-sm font-semibold text-black/60">{order.shippingDetails.pickupLocation}</p>{order.shippingDetails.pickupInstructions && <p className="mt-3 text-sm leading-6 text-black/60">{order.shippingDetails.pickupInstructions}</p>}</>}{order.shippingDetails.method === "local_delivery" && <><p className="mt-2 text-xl font-extrabold">Local delivery</p>{order.shippingDetails.pickupInstructions && <p className="mt-3 text-sm leading-6 text-black/60">{order.shippingDetails.pickupInstructions}</p>}</>}</div>}<div className="mt-8 border-t border-black/10 pt-6"><p className="text-sm text-black/50">{order.items.reduce((n, item) => n + item.quantity, 0)} items · ₹{order.total.toFixed(2)}</p><Link href="/orders" className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">Back to My Orders <ArrowRight size={16}/></Link></div></section></>}</div></main>;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
