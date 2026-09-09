"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";

type OrderItem = {
  productId?: string;
  productName: string;
  imageUrl?: string;
  type: "product" | "custom";
  quantity: number;
  artworkObjectKey?: string;
  artworkContentType?: string;
  size?: string;
  shape?: string;
  finish?: string;
};

type Order = {
  orderId: string;
  createdAt: string;
  status: "awaiting_payment" | "placed" | "processing" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: string;
  paymentStatus: "pending" | "pending_confirmation" | "paid" | "failed" | "cancelled" | "refunded";
  paymentClaimedAt?: string;
  paymentAttempt?: number;
  paymentExpiresAt?: string;
  paymentProof?: { objectKey: string; contentType: string; fileName: string; uploadedAt: string };
  shippingDetails?: {
    method: "courier" | "pickup" | "local_delivery";
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    pickupLocation?: string;
    pickupInstructions?: string;
    shippedAt?: string;
    deliveredAt?: string;
    lastCarrierStatus?: string;
    lastCarrierLocation?: string;
    lastCarrierStatusAt?: string;
    outForDeliveryEmailSentAt?: string;
    delhivery?: { waybill: string; pickupLocation: string; createdAt: string; environment: "staging" | "production"; pickupId?: string };
    updatedAt: string;
  };
  paymentVerification?: {
    transactionId: string;
    utr?: string;
    payerUpiId?: string;
    payerName?: string;
    paidAmount: number;
    paidAt: string;
    verifiedAt: string;
    verifiedBy: string;
    note?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      addressLine1: string;
      addressLine2?: string;
      landmark?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

const fulfillmentStatuses = ["placed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function paymentRemaining(expiresAt?: string) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} left`;
}

function imageHref(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
}

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [packBusy, setPackBusy] = useState<string | null>(null);
  const [verifyOrder, setVerifyOrder] = useState<Order | null>(null);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<{ method: "courier" | "pickup" | "local_delivery"; courier: string; trackingNumber: string; trackingUrl: string; pickupLocation: string; pickupInstructions: string; weightGrams: string; lengthCm: string; widthCm: string; heightCm: string; pickupDate: string; pickupTime: string; expectedPackageCount: string; }>({ method: "courier", courier: "", trackingNumber: "", trackingUrl: "", pickupLocation: "", pickupInstructions: "", weightGrams: "100", lengthCm: "20", widthCm: "15", heightCm: "4", pickupDate: "", pickupTime: "14:00:00", expectedPackageCount: "1" });
  const [verification, setVerification] = useState({
    transactionId: "",
    utr: "",
    payerUpiId: "",
    payerName: "",
    paidAmount: "",
    paidAt: "",
    note: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load admin orders.");
      setOrders(data.orders || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load admin orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(
    orderId: string,
    patch: {
      paymentStatus?: Order["paymentStatus"];
      status?: (typeof fulfillmentStatuses)[number];
      shippingDetails?: {
    method: "courier" | "pickup" | "local_delivery";
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    pickupLocation?: string;
    pickupInstructions?: string;
    shippedAt?: string;
    deliveredAt?: string;
    updatedAt: string;
  };
  paymentVerification?: {
        transactionId: string;
        utr?: string;
        payerUpiId?: string;
        payerName?: string;
        paidAmount: number;
        paidAt: string;
        note?: string;
      };
    },
  ) {
    setBusy(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((order) => (order.orderId === orderId ? data.order : order)));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to update order.");
    } finally {
      setBusy(null);
    }
  }


  function openShippingEditor(order: Order) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().slice(0, 10);
    setShipping({
      method: order.shippingDetails?.method ?? "courier",
      courier: order.shippingDetails?.courier ?? "",
      trackingNumber: order.shippingDetails?.trackingNumber ?? "",
      trackingUrl: order.shippingDetails?.trackingUrl ?? "",
      pickupLocation: order.shippingDetails?.pickupLocation ?? "",
      pickupInstructions: order.shippingDetails?.pickupInstructions ?? "",
      weightGrams: "100", lengthCm: "20", widthCm: "15", heightCm: "4", pickupDate: tomorrowDate, pickupTime: "14:00:00", expectedPackageCount: "1",
    });
    setShippingOrder(order);
  }

  function openPaymentVerification(order: Order) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setVerifyOrder(order);
    setVerification({
      transactionId: "",
      utr: "",
      payerUpiId: "",
      payerName: "",
      paidAmount: order.total.toFixed(2),
      paidAt: local,
      note: "",
    });
  }

  async function submitPaymentVerification() {
    if (!verifyOrder) return;
    if (!verification.transactionId.trim() || !verification.paidAmount || !verification.paidAt) {
      window.alert("Transaction ID, paid amount, and payment date/time are required.");
      return;
    }

    setBusy(verifyOrder.orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(verifyOrder.orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentVerification: {
            transactionId: verification.transactionId.trim(),
            ...(verification.utr.trim() ? { utr: verification.utr.trim() } : {}),
            ...(verification.payerUpiId.trim() ? { payerUpiId: verification.payerUpiId.trim() } : {}),
            ...(verification.payerName.trim() ? { payerName: verification.payerName.trim() } : {}),
            paidAmount: Number(verification.paidAmount),
            paidAt: new Date(verification.paidAt).toISOString(),
            ...(verification.note.trim() ? { note: verification.note.trim() } : {}),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to verify payment.");
      setOrders((current) => current.map((order) => (order.orderId === verifyOrder.orderId ? data.order : order)));
      setVerifyOrder(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to verify payment.");
    } finally {
      setBusy(null);
    }
  }

  async function createDelhiveryShipment() {
    if (!shippingOrder) return;
    if (shipping.courier.trim().toLowerCase() !== "delhivery") {
      window.alert("Set the courier to Delhivery first.");
      return;
    }
    setBusy(shippingOrder.orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(shippingOrder.orderId)}/delhivery/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightGrams: Number(shipping.weightGrams), lengthCm: Number(shipping.lengthCm), widthCm: Number(shipping.widthCm), heightCm: Number(shipping.heightCm),
          ...(shipping.pickupLocation.trim() ? { pickupLocation: shipping.pickupLocation.trim() } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to create Delhivery shipment.");
      setOrders((current) => current.map((order) => (order.orderId === shippingOrder.orderId ? data.order : order)));
      setShippingOrder(data.order);
      setShipping((v) => ({ ...v, courier: "Delhivery", trackingNumber: data.delhivery.waybill, trackingUrl: data.delhivery.trackingUrl, pickupLocation: data.delhivery.pickupLocation }));
      window.alert(`Delhivery shipment created. AWB: ${data.delhivery.waybill}`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to create Delhivery shipment.");
    } finally { setBusy(null); }
  }

  async function syncDelhivery(order: Order) {
    setBusy(order.orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}/delhivery/sync`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to sync Delhivery tracking.");
      await load();
      window.alert(data.tracking.status ? `Delhivery status: ${data.tracking.status}` : "Tracking synced.");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to sync Delhivery tracking.");
    } finally { setBusy(null); }
  }

  async function requestDelhiveryPickup(order: Order) {
    if (!order.shippingDetails?.delhivery?.pickupLocation) {
      window.alert("Create the Delhivery shipment first.");
      return;
    }
    setBusy(order.orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}/delhivery/pickup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupLocation: order.shippingDetails.delhivery.pickupLocation, pickupDate: shipping.pickupDate, pickupTime: shipping.pickupTime, expectedPackageCount: Number(shipping.expectedPackageCount) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to schedule pickup.");
      window.alert("Delhivery pickup request created.");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to schedule pickup.");
    } finally { setBusy(null); }
  }

  async function submitShippingDetails() {
    if (!shippingOrder) return;
    setBusy(shippingOrder.orderId);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(shippingOrder.orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingDetails: {
            method: shipping.method,
            ...(shipping.courier.trim() ? { courier: shipping.courier.trim() } : {}),
            ...(shipping.trackingNumber.trim() ? { trackingNumber: shipping.trackingNumber.trim() } : {}),
            ...(shipping.trackingUrl.trim() ? { trackingUrl: shipping.trackingUrl.trim() } : {}),
            ...(shipping.pickupLocation.trim() ? { pickupLocation: shipping.pickupLocation.trim() } : {}),
            ...(shipping.pickupInstructions.trim() ? { pickupInstructions: shipping.pickupInstructions.trim() } : {}),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to save delivery details.");
      setOrders((current) => current.map((order) => (order.orderId === shippingOrder.orderId ? data.order : order)));
      setShippingOrder(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Unable to save delivery details.");
    } finally {
      setBusy(null);
    }
  }

  function downloadPrintPack(orderId: string) {
    setPackBusy(orderId);
    window.location.assign(`/api/admin/orders/${encodeURIComponent(orderId)}/print-pack`);
    window.setTimeout(() => setPackBusy(null), 1500);
  }

  const pending = useMemo(() => orders.filter((o) => o.paymentStatus === "pending_confirmation"), [orders]);
  const customOrders = useMemo(() => orders.filter((o) => o.items.some((item) => Boolean(item.artworkObjectKey))), [orders]);

  return (
    <main className="min-h-screen bg-cream px-5 pb-20 pt-28 md:px-8 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/60 hover:text-black">
            <ArrowLeft size={16} /> Back to site
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">
              <RefreshCw size={15} /> Refresh orders
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace("/");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Stick Hive Admin</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Order desk</h1>
              <p className="mt-3 max-w-2xl text-black/50">Verify payments, inspect sticker artwork, download print packs, and move orders through fulfillment.</p>
            </div>
            <div className="flex gap-2 text-sm font-bold">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><span className="text-black/40">Orders</span><span className="ml-2">{orders.length}</span></div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><span className="text-black/40">Custom</span><span className="ml-2">{customOrders.length}</span></div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm"><span className="text-black/40">Pending</span><span className="ml-2">{pending.length}</span></div>
            </div>
          </div>
        </div>

        {error && (
          <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
            <p className="font-bold">{error}</p>
            <p className="mt-2 text-sm text-black/50">Make sure the logged-in email is listed in STICKHIVE_ADMIN_EMAILS.</p>
          </section>
        )}

        {loading && <div className="flex min-h-[35vh] items-center justify-center"><Loader2 className="animate-spin" size={30} /></div>}

        {!loading && orders.length === 0 && !error && (
          <section className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-xl">
            <Package className="mx-auto" size={42} />
            <h2 className="mt-5 text-2xl font-extrabold">No orders yet</h2>
            <p className="mt-2 text-black/50">New orders will appear here automatically when you refresh.</p>
          </section>
        )}

        {!loading && orders.length > 0 && (
          <>
            {pending.length > 0 && (
              <section className="mt-8 rounded-[2rem] border border-hive-yellow bg-hive-yellow/40 p-6">
                <div className="flex items-center gap-3"><CheckCircle2 size={22} /><div><p className="font-extrabold">{pending.length} payment{pending.length === 1 ? "" : "s"} waiting for verification</p><p className="text-sm text-black/60">Check your UPI app and confirm only after the amount and order reference match.</p></div></div>
              </section>
            )}

            <div className="mt-8 space-y-6">
              {orders.map((order) => {
                const customItems = order.items.map((item, index) => ({ item, index })).filter(({ item }) => Boolean(item.artworkObjectKey));
                return (
                  <section key={order.orderId} className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
                    <div className="border-b border-black/10 p-6 md:p-7">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-black/40">{order.orderId}</p>
                          <h2 className="mt-1 text-2xl font-extrabold">{order.customer.name}</h2>
                          <p className="mt-1 text-sm text-black/50">{order.customer.phone} · {order.customer.email}</p>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
                            {order.customer.address.addressLine1}{order.customer.address.addressLine2 ? `, ${order.customer.address.addressLine2}` : ""}{order.customer.address.landmark ? `, ${order.customer.address.landmark}` : ""}, {order.customer.address.city}, {order.customer.address.state} — {order.customer.address.pincode}
                          </p>
                        </div>
                        <div className="lg:text-right">
                          <p className="text-3xl font-extrabold">₹{order.total.toFixed(2)}</p>
                          <p className="mt-1 text-sm text-black/50">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                          <div className="mt-3 inline-flex rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-extrabold capitalize">{statusLabel(order.status)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
                      <div className="p-6 md:p-7">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3"><Package size={20} /><p className="font-extrabold">{order.items.reduce((n, item) => n + item.quantity, 0)} item{order.items.reduce((n, item) => n + item.quantity, 0) === 1 ? "" : "s"}</p></div>
                          {customItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => downloadPrintPack(order.orderId)}
                              disabled={packBusy === order.orderId}
                              className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                            >
                              {packBusy === order.orderId ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                              Download Print Pack
                            </button>
                          )}
                        </div>

                        <div className="mt-5 space-y-4">
                          {order.items.map((item, index) => (
                            <div key={`${order.orderId}-${index}`} className="rounded-3xl border border-black/10 p-4 md:p-5">
                              <div className="flex flex-col gap-4 md:flex-row">
                                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/[0.03]">
                                  {item.artworkObjectKey ? (
                                    <img
                                      src={`/api/admin/orders/${encodeURIComponent(order.orderId)}/artwork?item=${index}`}
                                      alt={item.productName}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : item.imageUrl ? (
                                    <img src={imageHref(item.imageUrl)} alt={item.productName} className="h-full w-full object-contain p-2" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-black/30"><ImageIcon size={28} /></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="font-extrabold">{item.productName}{item.type === "custom" ? " · Custom" : ""}</p>
                                      <p className="mt-1 text-sm text-black/50">{item.size ? `Size ${item.size}` : ""}{item.shape ? ` · ${item.shape}` : ""}{item.finish ? ` · ${item.finish}` : ""} · Qty {item.quantity}</p>
                                    </div>
                                    <p className="font-extrabold">₹{item.lineTotal?.toFixed(2) ?? "0.00"}</p>
                                  </div>
                                  {item.artworkObjectKey && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <a
                                        href={`/api/admin/orders/${encodeURIComponent(order.orderId)}/artwork?item=${index}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-extrabold hover:bg-black hover:text-white"
                                      >
                                        <Download size={14} /> Download artwork
                                      </a>
                                      <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-2 text-xs font-bold text-black/50"><ImageIcon size={13} /> Print artwork in S3</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <aside className="border-t border-black/10 bg-black/[0.02] p-6 md:p-7 lg:border-l lg:border-t-0">
                        <div className="rounded-3xl bg-white p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Payment</p>
                          <p className="mt-2 text-lg font-extrabold capitalize">{statusLabel(order.paymentStatus)}</p>
                          {order.paymentClaimedAt && <p className="mt-1 text-xs text-black/40">Claimed {new Date(order.paymentClaimedAt).toLocaleString("en-IN")}</p>}
                          {order.paymentExpiresAt && order.paymentStatus !== "paid" && <p className="mt-1 text-xs font-bold text-black/50">Payment window: {paymentRemaining(order.paymentExpiresAt) ?? "Expired"}</p>}
                          {order.paymentProof && <a href={`/api/admin/orders/${encodeURIComponent(order.orderId)}/payment-proof`} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]"><img src={`/api/admin/orders/${encodeURIComponent(order.orderId)}/payment-proof`} alt="Customer payment proof" className="max-h-56 w-full object-contain" /><span className="block border-t border-black/10 px-3 py-2 text-xs font-extrabold">Open payment proof</span></a>}
                          {order.paymentStatus === "pending_confirmation" && (
                            <button disabled={busy === order.orderId} onClick={() => openPaymentVerification(order)} className="mt-4 w-full rounded-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                              Confirm Payment
                            </button>
                          )}
                          {order.paymentStatus === "paid" && order.paymentVerification && (
                            <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.025] p-4 text-xs leading-5">
                              <p className="font-extrabold">Verified payment</p>
                              <p className="mt-1 text-black/60">Txn: {order.paymentVerification.transactionId}</p>
                              <p className="text-black/60">Amount: ₹{order.paymentVerification.paidAmount.toFixed(2)}</p>
                              {order.paymentVerification.utr && <p className="text-black/60">UTR: {order.paymentVerification.utr}</p>}
                              {order.paymentVerification.payerName && <p className="text-black/60">Payer: {order.paymentVerification.payerName}</p>}
                              <p className="text-black/60">Paid: {new Date(order.paymentVerification.paidAt).toLocaleString("en-IN")}</p>
                              {order.paymentVerification.payerUpiId && <p className="text-black/60">Payer UPI: {order.paymentVerification.payerUpiId}</p>}
                              <p className="text-black/40">Verified by {order.paymentVerification.verifiedBy}</p>
                            </div>
                          )}
                        </div>

                        <label className="mt-4 block rounded-3xl bg-white p-5 shadow-sm">
                          <span className="text-xs font-bold uppercase tracking-widest text-black/40">Fulfillment</span>
                          <select value={order.status === "awaiting_payment" ? "placed" : order.status} onChange={(e) => void update(order.orderId, { status: e.target.value as typeof fulfillmentStatuses[number] })} disabled={busy === order.orderId || (order.paymentMethod === "upi" && order.paymentStatus !== "paid")} className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="placed">Confirmed / Placed</option>
                            {fulfillmentStatuses.filter((status) => status !== "placed").map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                          </select>
                          {order.paymentMethod === "upi" && order.paymentStatus !== "paid" && <p className="mt-2 text-xs font-semibold text-black/45">Fulfillment is locked until UPI payment is verified.</p>}
                        </label>

                        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Truck size={18} /><p className="font-extrabold">Delivery & tracking</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => order.shippingDetails?.courier === "Delhivery" && order.shippingDetails.trackingNumber ? void syncDelhivery(order) : undefined} disabled={busy === order.orderId || order.shippingDetails?.courier !== "Delhivery" || !order.shippingDetails?.trackingNumber} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-extrabold disabled:opacity-40">Sync</button><button type="button" onClick={() => openShippingEditor(order)} disabled={busy === order.orderId} className="rounded-full bg-black px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">Edit</button></div></div>
                          {order.shippingDetails ? <div className="mt-3 space-y-1 text-sm text-black/60"><p className="font-extrabold text-black">{order.shippingDetails.method === "courier" ? `${order.shippingDetails.courier}${order.shippingDetails.trackingNumber ? ` · ${order.shippingDetails.trackingNumber}` : ""}` : order.shippingDetails.method === "pickup" ? `Pickup · ${order.shippingDetails.pickupLocation}` : "Local delivery"}</p>{order.shippingDetails.method === "pickup" && order.shippingDetails.pickupInstructions && <p>{order.shippingDetails.pickupInstructions}</p>}{order.shippingDetails.method === "local_delivery" && order.shippingDetails.pickupInstructions && <p>{order.shippingDetails.pickupInstructions}</p>}{order.shippingDetails.trackingUrl && <a href={order.shippingDetails.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline underline-offset-4">Open tracking <ExternalLink size={13} /></a>}</div> : <p className="mt-2 text-sm text-black/50">No delivery details saved yet.</p>}
                          <p className="mt-3 text-xs text-black/40">Save delivery details here, then move the order through Shipped / Out for Delivery / Delivered.</p>
                          {customItems.length > 0 && <a href={`/api/admin/orders/${encodeURIComponent(order.orderId)}/print-pack`} className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold underline underline-offset-4"><ExternalLink size={14} /> Open print pack download</a>}
                        </div>
                      </aside>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Delivery details</p>
            <h2 className="mt-2 text-2xl font-extrabold">{shippingOrder.orderId}</h2>
            <p className="mt-2 text-sm text-black/50">Choose how this order will reach the customer and save the tracking or pickup information.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {([['courier','Courier'],['local_delivery','Local delivery'],['pickup','Pickup']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setShipping((v) => ({ ...v, method: value }))} className={`rounded-2xl border px-4 py-4 text-left text-sm font-extrabold ${shipping.method === value ? 'border-black bg-black text-white' : 'border-black/10 bg-white'}`}>{label}</button>)}
            </div>
            {shipping.method === 'courier' ? <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Courier *</span><input value={shipping.courier} onChange={(e) => setShipping(v => ({...v,courier:e.target.value}))} placeholder="India Post, Delhivery…" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label>
              <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Tracking / AWB *</span><input value={shipping.trackingNumber} onChange={(e) => setShipping(v => ({...v,trackingNumber:e.target.value}))} placeholder="EX123456789IN" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Tracking URL</span><input value={shipping.trackingUrl} onChange={(e) => setShipping(v => ({...v,trackingUrl:e.target.value}))} placeholder="https://courier.example/track/..." className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label>
            </div> : shipping.method === 'pickup' ? <div className="mt-5 grid gap-4">
              <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Pickup location *</span><input value={shipping.pickupLocation} onChange={(e) => setShipping(v => ({...v,pickupLocation:e.target.value}))} placeholder="SCIT / SPROUT IT desk" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label>
              <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Pickup instructions</span><textarea value={shipping.pickupInstructions} onChange={(e) => setShipping(v => ({...v,pickupInstructions:e.target.value}))} rows={3} placeholder="Bring your order ID when collecting." className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label>
            </div> : <div className="mt-5"><label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Delivery note</span><textarea value={shipping.pickupInstructions} onChange={(e) => setShipping(v => ({...v,pickupInstructions:e.target.value}))} rows={3} placeholder="Hand-deliver at the event or local address." className="mt-2 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold outline-none" /></label></div>}
            {shipping.method === "courier" && shipping.courier.trim().toLowerCase() === "delhivery" && (
              <div className="mt-5 rounded-3xl bg-black/[0.03] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">Delhivery API shipment</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  {[['Weight (g)','weightGrams','100'],['Length (cm)','lengthCm','20'],['Width (cm)','widthCm','15'],['Height (cm)','heightCm','4']].map(([label,key,placeholder]) => <label key={key} className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">{label}</span><input type="number" min="1" value={shipping[key as keyof typeof shipping] as string} onChange={(e) => setShipping(v => ({ ...v, [key]: e.target.value }))} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none" /></label>)}
                </div>
                {shipping.trackingNumber ? <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4"><p className="text-sm font-extrabold">AWB: {shipping.trackingNumber}</p>{shipping.trackingUrl && <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold underline">Open Delhivery tracking <ExternalLink size={13}/></a>}<div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="block sm:col-span-2"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Pickup date</span><input type="date" value={shipping.pickupDate} onChange={(e) => setShipping(v=>({...v,pickupDate:e.target.value}))} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold" /></label><label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Pickup time</span><input type="time" step="1" value={shipping.pickupTime} onChange={(e) => setShipping(v=>({...v,pickupTime:e.target.value.length===5?`${e.target.value}:00`:e.target.value}))} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold" /></label><label className="block"><span className="text-xs font-bold uppercase tracking-widest text-black/40">Packages</span><input type="number" min="1" value={shipping.expectedPackageCount} onChange={(e) => setShipping(v=>({...v,expectedPackageCount:e.target.value}))} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold" /></label></div><button type="button" onClick={() => void requestDelhiveryPickup(shippingOrder)} disabled={busy===shippingOrder.orderId} className="mt-4 rounded-full border border-black/10 bg-black px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy===shippingOrder.orderId ? "Working…" : "Request Delhivery Pickup"}</button></div> : <button type="button" onClick={() => void createDelhiveryShipment()} disabled={busy===shippingOrder.orderId} className="mt-4 rounded-full bg-black px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy===shippingOrder.orderId ? "Creating…" : "Create Delhivery Shipment"}</button>}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShippingOrder(null)} className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold">Cancel</button><button type="button" onClick={() => void submitShippingDetails()} disabled={busy === shippingOrder.orderId} className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy === shippingOrder.orderId ? 'Saving…' : 'Save Delivery Details'}</button></div>
          </div>
        </div>
      )}

      {verifyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Payment verification</p>
                <h2 className="mt-2 text-2xl font-extrabold">Verify {verifyOrder.orderId}</h2>
                <p className="mt-2 text-sm text-black/50">Check the UPI transaction in your bank/GPay app, then record the details here before confirming the order.</p>
              </div>
              <button type="button" onClick={() => setVerifyOrder(null)} className="rounded-full border border-black/10 px-3 py-2 text-sm font-bold">Close</button>
            </div>

            <div className="mt-6 rounded-2xl bg-hive-yellow/50 p-4">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-widest text-black/40">Expected amount</p><p className="mt-1 text-2xl font-extrabold">₹{verifyOrder.total.toFixed(2)}</p></div>
                <div className="text-right"><p className="text-xs font-bold uppercase tracking-widest text-black/40">Order</p><p className="mt-1 font-extrabold">{verifyOrder.orderId}</p></div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Transaction ID *", "transactionId", "e.g. 423819273645", "text"],
                ["UTR / Bank Ref", "utr", "Optional", "text"],
                ["Payer UPI ID", "payerUpiId", "e.g. name@okaxis", "text"],
                ["Payer Name", "payerName", "Name shown in payment app", "text"],
                ["Paid Amount *", "paidAmount", "Must match order total", "number"],
              ].map(([label, key, placeholder, type]) => (
                <label key={key} className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/40">{label}</span>
                  <input
                    type={type}
                    step={key === "paidAmount" ? "0.01" : undefined}
                    value={verification[key as keyof typeof verification]}
                    onChange={(e) => setVerification((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-black/40">Payment date & time *</span>
                <input type="datetime-local" value={verification.paidAt} onChange={(e) => setVerification((v) => ({ ...v, paidAt: e.target.value }))} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-black" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-widest text-black/40">Verification note</span>
                <textarea value={verification.note} onChange={(e) => setVerification((v) => ({ ...v, note: e.target.value }))} placeholder="Optional: e.g. GPay receipt matched order reference and amount." rows={3} className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-black" />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.025] p-4 text-sm text-black/60">
              <p className="font-extrabold text-black">Admin confirmation responsibility</p>
              <p className="mt-1">Only submit this form after the transaction is visible in the receiving UPI/bank account. The server will reject the confirmation when the paid amount does not exactly match the order total.</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setVerifyOrder(null)} className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold">Cancel</button>
              <button type="button" onClick={() => void submitPaymentVerification()} disabled={busy === verifyOrder.orderId} className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50">
                {busy === verifyOrder.orderId ? "Saving verification…" : "Verify Payment & Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
