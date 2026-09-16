"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import QRCode from "qrcode";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";

import {
  useSearchParams,
} from "next/navigation";

import {
  CheckCircle2,
  Package,
  ArrowRight,
  Download,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  generateInvoice,
} from "@/lib/invoice-generator";

import type {
  StoredOrder,
  OrderStatus,
} from "@/types/order";


// ============================================================================
// TYPES
// ============================================================================
//
// StoredOrder is the locked, authoritative Order contract — see
// src/types/order.ts. This page used to carry its own hand-rolled copy of
// this shape, which had quietly drifted (missing shippingDetails, etc.).

type Address = StoredOrder["customer"]["address"];

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}


// ============================================================================
// STORAGE
// ============================================================================

const ORDERS_STORAGE_KEY =
  "stickhive:orders";


// ============================================================================
// LOAD STORED ORDER
// ============================================================================

function getStoredOrder(
  orderId: string | null,
): StoredOrder | null {

  if (!orderId) {
    return null;
  }

  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {

    const savedOrders =
      localStorage.getItem(
        ORDERS_STORAGE_KEY,
      );

    if (!savedOrders) {
      return null;
    }

    const parsed =
      JSON.parse(
        savedOrders,
      );

    if (!Array.isArray(parsed)) {
      return null;
    }

    const orders =
      parsed as StoredOrder[];

    const matchingOrder =
      orders.find(
        (storedOrder) =>
          storedOrder.orderId ===
          orderId,
      );

    return (
      matchingOrder ??
      null
    );

  } catch (error) {

    console.error(
      "Unable to load Stick Hive order:",
      error,
    );

    return null;
  }
}


// ============================================================================
// DATE FORMAT
// ============================================================================

function formatDate(
  date: string,
) {

  try {

    return new Date(
      date,
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

  } catch {

    return date;
  }
}


// ============================================================================
// STATUS LABEL
// ============================================================================

function getStatusLabel(
  status: OrderStatus,
) {

  switch (status) {

    case "awaiting_payment":
      return "Payment Pending";

    case "placed":
      return "Order Confirmed";

    case "processing":
      return "Processing";

    case "packed":
      return "Packed";

    case "shipped":
      return "Shipped";

    case "delivered":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    default:
      return "Order Placed";
  }
}


// ============================================================================
// INVOICE ADDRESS
// ============================================================================

function getInvoiceAddress(
  address: Address,
): string {

  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(
      (value) =>
        Boolean(
          value &&
          value.trim(),
        ),
    )
    .join(", ");
}


// ============================================================================
// ORDER SUCCESS PAGE
// ============================================================================

function OrderSuccessContent() {

  const searchParams =
    useSearchParams();


  const orderId =
    searchParams.get(
      "orderId",
    );


  const [
    order,
    setOrder,
  ] = useState<StoredOrder | null>(
    null,
  );


  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false);


  const [
    qrDataUrl,
    setQrDataUrl,
  ] = useState("");

  const [
    isClaimingPayment,
    setIsClaimingPayment,
  ] = useState(false);

  const [
    paymentMessage,
    setPaymentMessage,
  ] = useState("");

  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState("");

  const [isRazorpayScriptReady, setIsRazorpayScriptReady] = useState(false);
  const [isStartingRazorpay, setIsStartingRazorpay] = useState(false);
  const [isConfirmingRazorpay, setIsConfirmingRazorpay] = useState(false);
  const [razorpayError, setRazorpayError] = useState("");


  // ==========================================================================
  // LOAD ORDER
  // ==========================================================================


  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function loadOrder() {
      if (!orderId) {
        if (active) {
          setOrder(null);
          setHasLoaded(true);
        }
        return;
      }

      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = (await response.json()) as any;
        if (response.ok && data?.success && data.order) {
          const nextOrder = data.order as StoredOrder;
          if (active) {
            setOrder(nextOrder);
            if (nextOrder.paymentStatus === "paid" && timer) {
              clearInterval(timer);
              timer = undefined;
            }
          }

          if (nextOrder.upiPayment?.uri) {
            try {
              const dataUrl = await QRCode.toDataURL(nextOrder.upiPayment.uri, {
                width: 360,
                margin: 2,
                errorCorrectionLevel: "M",
              });
              if (active) setQrDataUrl(dataUrl);
            } catch (qrError) {
              console.error("Unable to generate UPI QR:", qrError);
            }
          }

          if (active) setHasLoaded(true);
          if (active && nextOrder.paymentStatus === "pending_confirmation" && !timer) {
            timer = setInterval(() => { void loadOrder(); }, 5000);
          }
          return;
        }
      } catch (error) {
        console.error("Unable to load order from server:", error);
      }

      // Compatibility fallback for an order created by the previous localStorage-only checkout.
      const storedOrder = getStoredOrder(orderId);
      if (active) {
        setOrder(storedOrder);
        setHasLoaded(true);
      }
    }

    void loadOrder();
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [orderId]);


  useEffect(() => {
    if (!order || order.paymentMethod !== "upi" || order.paymentStatus === "paid" || order.paymentStatus === "cancelled") return;
    let stopped = false;
    const sync = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(order.orderId)}/payment-sync`, { method: "POST", cache: "no-store" });
        const data = (await response.json().catch(() => null)) as any;
        if (!stopped && response.ok && data?.success && data.order) setOrder(data.order as StoredOrder);
      } catch {
        // Payment may simply still be pending; do not interrupt the checkout screen.
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 10000);
    return () => { stopped = true; clearInterval(timer); };
  }, [order?.orderId, order?.paymentMethod, order?.paymentStatus]);

  useEffect(() => {
    const expiresAt = order?.paymentExpiresAt;
    if (!expiresAt || order?.paymentStatus === "paid" || order?.paymentStatus === "cancelled") {
      setPaymentCountdown("");
      return;
    }
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setPaymentCountdown("Payment window expired");
        return;
      }
      const seconds = Math.floor(ms / 1000);
      setPaymentCountdown(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} remaining`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [order?.paymentExpiresAt, order?.paymentStatus]);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (!hasLoaded) {

    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-cream
          px-6
          py-32
        "
      >

        <div
          className="
            size-10
            animate-spin
            rounded-full
            border-4
            border-black/10
            border-t-black
          "
        />

      </main>
    );
  }


  // ==========================================================================
  // ORDER NOT FOUND
  // ==========================================================================

  if (!order) {

    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-cream
          px-6
          py-32
        "
      >

        <section
          className="
            w-full
            max-w-xl
            rounded-[2.5rem]
            bg-white
            p-10
            text-center
            shadow-xl
            md:p-14
          "
        >

          <div
            className="
              mx-auto
              flex
              size-20
              items-center
              justify-center
              rounded-full
              bg-black/5
            "
          >

            <Package
              size={38}
            />

          </div>


          <h1
            className="
              mt-7
              text-3xl
              font-extrabold
            "
          >
            Order Not Found
          </h1>


          <p
            className="
              mx-auto
              mt-3
              max-w-md
              text-black/50
            "
          >
            We couldn&apos;t find the
            order you&apos;re looking
            for. Please check your
            order details or return to
            your orders.
          </p>


          <div
            className="
              mt-8
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >

            <Link
              href="/orders"
              className="
                flex
                flex-1
                items-center
                justify-center
                rounded-full
                bg-black
                py-4
                font-bold
                text-white
                transition
                hover:scale-[1.02]
              "
            >
              My Orders
            </Link>


            <Link
              href="/shop"
              className="
                flex
                flex-1
                items-center
                justify-center
                rounded-full
                border
                border-black/10
                py-4
                font-bold
                transition
                hover:bg-black/5
              "
            >
              Continue Shopping
            </Link>

          </div>

        </section>

      </main>
    );
  }


  // ==========================================================================
  // NON-NULL ORDER
  // ==========================================================================
  //
  // From this point onward TypeScript knows that currentOrder exists.
  //
  // This prevents:
  //
  // "'order' is possibly 'null'"
  //
  // ==========================================================================

  const currentOrder: StoredOrder =
    order;


  async function handleRetryPayment() {
    setPaymentMessage("");
    setIsRetryingPayment(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(currentOrder.orderId)}/payment-retry`, { method: "POST" });
      const data = (await response.json()) as any;
      if (!response.ok || !data?.success) throw new Error(data?.error ?? "Unable to restart payment.");
      setOrder(data.order as StoredOrder);
      setQrDataUrl("");
      setPaymentMessage("A fresh 20-minute payment window is ready. Pay again using the new QR.");
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Unable to restart payment.");
    } finally {
      setIsRetryingPayment(false);
    }
  }

  // ==========================================================================
  // CLAIM UPI PAYMENT
  // ==========================================================================

  async function handleClaimUpiPayment() {
    setPaymentMessage("");
    setIsClaimingPayment(true);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(currentOrder.orderId)}/payment-claim`,
        { method: "POST" },
      );
      const data = (await response.json()) as any;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "Unable to record your payment confirmation.");
      }

      setOrder(data.order as StoredOrder);
      setPaymentMessage("Payment submitted. We'll confirm your order after we verify the payment.");
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Unable to record your payment confirmation.");
    } finally {
      setIsClaimingPayment(false);
    }
  }

  // ==========================================================================
  // RAZORPAY
  // ==========================================================================
  //
  // The webhook (POST /api/payments/razorpay/webhook) is the sole
  // authoritative source that marks the order "paid" - this handler only
  // gives the customer immediate feedback and then polls the order until
  // that webhook-driven update lands.

  async function pollForRazorpayConfirmation() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(currentOrder.orderId)}`, { cache: "no-store" });
        const data = (await response.json()) as any;
        if (response.ok && data?.success && data.order) {
          setOrder(data.order as StoredOrder);
          if (data.order.paymentStatus === "paid") {
            setIsConfirmingRazorpay(false);
            return;
          }
        }
      } catch {
        // Keep trying - a transient network blip shouldn't abandon the poll.
      }
    }
    setIsConfirmingRazorpay(false);
    setRazorpayError("Payment is taking a little longer to confirm than usual. This page will update automatically once it's done — you can also refresh it in a minute.");
  }

  async function handlePayWithRazorpay() {
    setRazorpayError("");
    if (!isRazorpayScriptReady || !window.Razorpay) {
      setRazorpayError("Payment is still loading — please try again in a moment.");
      return;
    }

    setIsStartingRazorpay(true);
    try {
      const response = await fetch("/api/payments/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: currentOrder.orderId }),
      });
      const data = (await response.json()) as any;
      if (!response.ok || !data?.success) throw new Error(data?.error ?? "Unable to start payment.");

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Stick Hive",
        description: `Order ${currentOrder.orderId}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: currentOrder.customer.name,
          email: currentOrder.customer.email,
          contact: currentOrder.customer.phone,
        },
        theme: { color: "#111111" },
        handler: () => {
          setIsStartingRazorpay(false);
          setIsConfirmingRazorpay(true);
          void pollForRazorpayConfirmation();
        },
        modal: {
          ondismiss: () => {
            setIsStartingRazorpay(false);
          },
        },
      });
      razorpay.open();
    } catch (error) {
      setRazorpayError(error instanceof Error ? error.message : "Unable to start payment.");
      setIsStartingRazorpay(false);
    }
  }


  // ==========================================================================
  // DOWNLOAD INVOICE
  // ==========================================================================

  function handleDownloadInvoice() {

    /*
     * The order system stores the address
     * as a structured object.
     *
     * The existing invoice generator expects
     * address to be a string.
     *
     * Therefore we create a separate
     * invoice-compatible customer object.
     */

    const invoiceCustomer = {
      name:
        currentOrder.customer.name,

      email:
        currentOrder.customer.email,

      phone:
        currentOrder.customer.phone,

      address:
        getInvoiceAddress(
          currentOrder.customer.address,
        ),
    };


    const invoiceOrder = {

      orderId:
        currentOrder.orderId,

      createdAt:
        currentOrder.createdAt,

      status:
        currentOrder.status,

      customer:
        invoiceCustomer,

      paymentMethod:
        currentOrder.paymentMethod,

      paymentStatus:
        currentOrder.paymentStatus,

      paymentVerification:
        currentOrder.paymentVerification,

      items:
        currentOrder.items,

      subtotal:
        currentOrder.subtotal,

      shipping:
        currentOrder.shipping,

      total:
        currentOrder.total,

    };


    generateInvoice(
      invoiceOrder,
    );
  }


  // ==========================================================================
  // MAIN PAGE
  // ==========================================================================

  return (
    <main
      className="
        min-h-screen
        bg-cream
        px-6
        pb-20
        pt-32
      "
    >

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayScriptReady(true)}
      />

      <div
        className="
          mx-auto
          max-w-3xl
        "
      >

        {/* ================================================================== */}
        {/* SUCCESS HEADER                                                     */}
        {/* ================================================================== */}

        <section
          className="
            rounded-[2.5rem]
            bg-white
            p-8
            text-center
            shadow-xl
            md:p-12
          "
        >

          <div
            className="
              mx-auto
              flex
              size-20
              items-center
              justify-center
              rounded-full
              bg-hive-yellow
            "
          >

            <CheckCircle2
              size={42}
              strokeWidth={2.5}
            />

          </div>


          <h1
            className="
              mt-7
              text-4xl
              font-extrabold
              tracking-tight
              md:text-5xl
            "
          >
            {currentOrder.paymentStatus === "paid" ? "Order Confirmed!" : "Order Received"}
          </h1>


          <p
            className="
              mx-auto
              mt-4
              max-w-lg
              text-black/50
            "
          >
            {currentOrder.paymentStatus === "pending_confirmation"
              ? "Your payment is awaiting verification. We&apos;ll update the order once it is confirmed."
              : currentOrder.paymentStatus === "paid"
                ? "Thank you for shopping with Stick Hive. Your stickers are now being prepared."
                : "Your order is created. Complete the UPI payment below to finish checkout."}
          </p>


          <div
            className="
              mx-auto
              mt-8
              max-w-md
              rounded-2xl
              bg-cream
              p-5
            "
          >

            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-widest
                text-black/40
              "
            >
              Order ID
            </p>


            <p
              className="
                mt-2
                text-xl
                font-extrabold
              "
            >
              {currentOrder.orderId}
            </p>


            <p
              className="
                mt-2
                text-sm
                text-black/40
              "
            >
              Placed on{" "}
              {formatDate(
                currentOrder.createdAt,
              )}
            </p>

          </div>

        </section>


        {/* ================================================================== */}
        {/* UPI PAYMENT                                                        */}
        {/* ================================================================== */}

        {currentOrder.paymentMethod === "upi" && currentOrder.paymentStatus === "cancelled" && (
          <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
            <div className="rounded-3xl bg-black/[0.03] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">Payment window expired</p>
              <h2 className="mt-2 text-2xl font-extrabold">Need to pay again?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">This order was kept as a record, but its payment window has closed. Start a new payment window instead of creating a duplicate order.</p>
              <button type="button" onClick={() => void handleRetryPayment()} disabled={isRetryingPayment} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 font-bold text-white disabled:opacity-50">
                {isRetryingPayment ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {isRetryingPayment ? "Starting…" : "Pay Again"}
              </button>
            </div>
            {paymentMessage && <p className="mt-3 text-sm font-semibold text-black/60">{paymentMessage}</p>}
          </section>
        )}

        {currentOrder.paymentMethod === "upi" && currentOrder.paymentStatus !== "paid" && currentOrder.paymentStatus !== "cancelled" && currentOrder.upiPayment && (
          <section
            className="
              mt-6
              rounded-[2rem]
              bg-white
              p-6
              shadow-xl
              md:p-8
            "
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                Complete Payment
              </p>
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">
                Pay ₹{currentOrder.upiPayment.amount.toFixed(2)} via UPI
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-black/50">
                Scan the QR with any UPI app. The amount is already filled in.
              </p>

              {qrDataUrl ? (
                <div className="mx-auto mt-6 flex w-fit items-center justify-center rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                  <Image
                    src={qrDataUrl}
                    alt={`UPI payment QR for ₹${currentOrder.upiPayment.amount.toFixed(2)}`}
                    width={288}
                    height={288}
                    className="size-64 rounded-xl md:size-72"
                  />
                </div>
              ) : (
                <div className="mx-auto mt-6 flex size-72 items-center justify-center rounded-3xl bg-black/[0.03] text-sm text-black/40">
                  Generating QR…
                </div>
              )}

              {paymentCountdown && <div className="mx-auto mt-4 inline-flex rounded-full bg-black/[0.05] px-4 py-2 text-xs font-extrabold">{paymentCountdown}</div>}

              {/* Tappable deep link — same upi:// URI as the QR, but lets a
                  phone open its UPI app directly instead of needing a second
                  device to scan. */}
              <a
                href={currentOrder.upiPayment.uri}
                className="mx-auto mt-5 flex w-fit items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold transition hover:bg-black/5"
              >
                Open in UPI App
              </a>

              <div className="mx-auto mt-5 max-w-md rounded-2xl bg-cream p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-black/50">UPI ID</span>
                  <span className="font-bold break-all">{currentOrder.upiPayment.upiId}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-black/50">Order reference</span>
                  <span className="font-bold">{currentOrder.orderId}</span>
                </div>
              </div>

              
              <button
                type="button"
                onClick={handleClaimUpiPayment}
                disabled={isClaimingPayment || currentOrder.paymentStatus === "pending_confirmation"}
                className="mt-5 w-full rounded-full bg-black px-6 py-4 font-bold text-white transition hover:scale-[1.01] hover:bg-honey-orange disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-black"
              >
                {isClaimingPayment
                  ? "Checking payment…"
                  : currentOrder.paymentStatus === "pending_confirmation"
                    ? "Payment verification in progress"
                    : "I've Paid — Check Payment"}
              </button>

              {paymentMessage && (
                <p className="mt-3 text-sm font-semibold text-black/60">{paymentMessage}</p>
              )}
            </div>
          </section>
        )}


        {/* ================================================================== */}
        {/* RAZORPAY PAYMENT                                                   */}
        {/* ================================================================== */}

        {currentOrder.paymentMethod === "razorpay" && currentOrder.paymentStatus !== "paid" && currentOrder.paymentStatus !== "cancelled" && (
          <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                Complete Payment
              </p>
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">
                Pay ₹{currentOrder.total.toFixed(2)}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-black/50">
                Cards, UPI apps, netbanking and more via Razorpay. Confirmation is instant once your bank approves it.
              </p>

              <button
                type="button"
                onClick={() => void handlePayWithRazorpay()}
                disabled={isStartingRazorpay || isConfirmingRazorpay}
                className="mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-black px-6 py-4 font-bold text-white transition hover:scale-[1.01] hover:bg-honey-orange disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-black"
              >
                {isConfirmingRazorpay ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Confirming payment…
                  </>
                ) : isStartingRazorpay ? (
                  "Opening payment…"
                ) : (
                  "Pay Now"
                )}
              </button>

              {razorpayError && (
                <p className="mt-3 text-sm font-semibold text-red-600">{razorpayError}</p>
              )}
            </div>
          </section>
        )}


        {/* ================================================================== */}
        {/* DELIVERY                                                           */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-black
            p-6
            text-white
            md:p-8
          "
        >

          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            <div
              className="
                flex
                size-12
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/10
              "
            >

              <Package
                size={24}
              />

            </div>


            <div>

              <p
                className="
                  text-sm
                  text-white/50
                "
              >
                Estimated Delivery
              </p>


              <p
                className="
                  mt-1
                  text-xl
                  font-extrabold
                "
              >
                3–5 business days
              </p>

            </div>

          </div>

        </section>


        {/* ================================================================== */}
        {/* DELIVERY ADDRESS                                                   */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-white
            p-6
            shadow-xl
            md:p-8
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-full
                bg-cream
              "
            >

              <MapPin
                size={19}
              />

            </div>


            <h2
              className="
                text-xl
                font-extrabold
              "
            >
              Delivery Address
            </h2>

          </div>


          <div
            className="
              mt-5
              rounded-2xl
              bg-cream
              p-5
            "
          >

            <p
              className="
                font-bold
              "
            >
              {currentOrder.customer.name}
            </p>


            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-black/60
              "
            >
              {
                currentOrder.customer
                  .address.addressLine1
              }
            </p>


            {currentOrder.customer.address.addressLine2 && (

              <p
                className="
                  text-sm
                  leading-relaxed
                  text-black/60
                "
              >
                {
                  currentOrder.customer
                    .address.addressLine2
                }
              </p>

            )}


            {currentOrder.customer.address.landmark && (

              <p
                className="
                  text-sm
                  leading-relaxed
                  text-black/60
                "
              >
                {
                  currentOrder.customer
                    .address.landmark
                }
              </p>

            )}


            <p
              className="
                text-sm
                leading-relaxed
                text-black/60
              "
            >
              {
                currentOrder.customer
                  .address.city
              }
              {", "}
              {
                currentOrder.customer
                  .address.state
              }
              {" - "}
              {
                currentOrder.customer
                  .address.pincode
              }
            </p>


            <div
              className="
                mt-4
                flex
                flex-col
                gap-2
                border-t
                border-black/10
                pt-4
                text-sm
                text-black/50
                sm:flex-row
                sm:gap-5
              "
            >

              <span
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Phone
                  size={14}
                />

                {
                  currentOrder.customer
                    .phone
                }

              </span>


              <span
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Mail
                  size={14}
                />

                {
                  currentOrder.customer
                    .email
                }

              </span>

            </div>

          </div>

        </section>


        {/* ================================================================== */}
        {/* ORDER SUMMARY                                                      */}
        {/* ================================================================== */}

        <section
          className="
            mt-6
            rounded-[2rem]
            bg-white
            p-6
            shadow-xl
            md:p-8
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <h2
              className="
                text-2xl
                font-extrabold
              "
            >
              Order Summary
            </h2>


            <span
              className="
                rounded-full
                bg-hive-yellow
                px-3
                py-1
                text-xs
                font-bold
                uppercase
              "
            >
              {
                getStatusLabel(
                  currentOrder.status,
                )
              }
            </span>

          </div>


          {/* ================================================================= */}
          {/* ITEMS                                                             */}
          {/* ================================================================= */}

          <div
            className="
              mt-6
              space-y-4
            "
          >

            {currentOrder.items.map(
              (
                item,
                index,
              ) => (

                <div
                  key={`${item.productName}-${index}`}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-2xl
                    bg-cream
                    p-4
                  "
                >

                  <div
                    className="
                      min-w-0
                    "
                  >

                    <p
                      className="
                        font-bold
                      "
                    >
                      {item.productName}
                    </p>


                    <p
                      className="
                        mt-1
                        text-sm
                        text-black/50
                      "
                    >
                      {item.size}
                      {" × "}
                      {item.quantity}
                    </p>


                    {item.finish && (

                      <p
                        className="
                          mt-1
                          text-xs
                          font-semibold
                          text-black/40
                        "
                      >

                        {item.shape}
                        {" • "}
                        {item.finish}

                      </p>

                    )}

                  </div>


                  <p
                    className="
                      whitespace-nowrap
                      font-bold
                    "
                  >
                    ₹{item.lineTotal}
                  </p>

                </div>

              ),
            )}

          </div>


          {/* ================================================================= */}
          {/* PRICING                                                           */}
          {/* ================================================================= */}

          <div
            className="
              mt-6
              border-t
              border-black/10
              pt-6
            "
          >

            <div
              className="
                flex
                justify-between
                text-sm
              "
            >

              <span>
                Subtotal
              </span>

              <span>
                ₹{currentOrder.subtotal}
              </span>

            </div>


            <div
              className="
                mt-3
                flex
                justify-between
                text-sm
              "
            >

              <span>
                Shipping
              </span>

              <span>
                {
                  currentOrder.shipping === 0
                    ? "FREE"
                    : `₹${currentOrder.shipping}`
                }
              </span>

            </div>


            {Boolean(currentOrder.platformFee) && (
              <div
                className="
                  mt-3
                  flex
                  justify-between
                  text-sm
                "
              >

                <span>
                  Platform fee (2.36%)
                </span>

                <span>
                  ₹{currentOrder.platformFee!.toFixed(2)}
                </span>

              </div>
            )}


            <div
              className="
                mt-4
                flex
                justify-between
                text-xl
                font-extrabold
              "
            >

              <span>
                Total
              </span>

              <span>
                ₹{currentOrder.total}
              </span>

            </div>

          </div>


          {/* ================================================================= */}
          {/* PAYMENT METHOD                                                    */}
          {/* ================================================================= */}

          <div
            className="
              mt-6
              rounded-2xl
              bg-black/[0.03]
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                text-sm
              "
            >

              <span
                className="
                  text-black/50
                "
              >
                Payment Method
              </span>


              <span
                className="
                  font-bold
                  capitalize
                "
              >
                {currentOrder.paymentMethod === "razorpay" ? "Razorpay" : currentOrder.paymentMethod === "stripe" ? "Stripe" : "UPI"}
              </span>

            </div>

          </div>

        </section>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-black/50">Payment Status</span>
            <span className="font-bold capitalize">
              {(currentOrder.paymentStatus ?? "paid").replaceAll("_", " ")}
            </span>
          </div>
        </div>


        {/* ================================================================== */}
        {/* ACTIONS                                                            */}
        {/* ================================================================== */}

        <div
          className="
            mt-6
            grid
            gap-3
            sm:grid-cols-3
          "
        >

          {/* ================================================================= */}
          {/* TRACK ORDER                                                       */}
          {/* ================================================================= */}

          <Link
            href={`/track-order?orderId=${encodeURIComponent(
              currentOrder.orderId,
            )}`}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-black
              py-4
              font-bold
              text-white
              transition
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >

            Track Your Order

            <ArrowRight
              size={18}
            />

          </Link>


          {/* ================================================================= */}
          {/* DOWNLOAD INVOICE                                                  */}
          {/* ================================================================= */}

          <button
            type="button"
            onClick={
              handleDownloadInvoice
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-hive-yellow
              py-4
              font-bold
              transition
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >

            Download Invoice

            <Download
              size={18}
            />

          </button>


          {/* ================================================================= */}
          {/* CONTINUE SHOPPING                                                 */}
          {/* ================================================================= */}

          <Link
            href="/shop"
            className="
              flex
              items-center
              justify-center
              rounded-full
              border
              border-black/10
              bg-white
              py-4
              font-bold
              transition
              hover:bg-black/5
            "
          >

            Continue Shopping

          </Link>

        </div>

      </div>

    </main>
  );
}


export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}