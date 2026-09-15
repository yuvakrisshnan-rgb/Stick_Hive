import crypto from "crypto";
import type { OrderDocument } from "../orders/service";

// No official Razorpay SDK is installed — the REST API + webhook signature
// scheme are simple enough that a small native fetch/crypto client keeps
// this dependency-free, mirroring the rest of this codebase's preference
// for not adding a package where the platform API is this small.

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export function getRazorpayKeyId(): string {
  return required("RAZORPAY_KEY_ID");
}

function getRazorpayKeySecret(): string {
  return required("RAZORPAY_KEY_SECRET");
}

function authHeader(): string {
  const token = Buffer.from(`${getRazorpayKeyId()}:${getRazorpayKeySecret()}`).toString("base64");
  return `Basic ${token}`;
}

export async function createRazorpayOrder(params: {
  order: Pick<OrderDocument, "orderId" | "total">;
}) {
  const amountPaise = Math.round(params.order.total * 100);
  if (amountPaise <= 0) throw new Error("Order total must be greater than zero.");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: params.order.orderId,
      notes: { orderId: params.order.orderId },
    }),
    cache: "no-store",
  });

  const bodyText = await response.text();
  if (!response.ok) {
    let detail = bodyText;
    try {
      detail = JSON.parse(bodyText)?.error?.description || bodyText;
    } catch {
      // keep raw text
    }
    throw new Error(`Razorpay order creation failed: ${String(detail).slice(0, 300)}`);
  }

  const payload = JSON.parse(bodyText) as { id: string; amount: number; currency: string };
  return { razorpayOrderId: payload.id, amount: payload.amount, currency: payload.currency };
}

/**
 * Verifies a Razorpay webhook's HMAC-SHA256 signature against the raw
 * request body, using a timing-safe comparison. Returns false (never
 * throws on a bad signature) so callers can reject unsigned/invalid
 * requests outright without leaking whether the secret matched.
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader.trim(), "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Verifies the signature Razorpay Checkout returns to the client on a
 * successful payment (order_id|payment_id, HMAC'd with the key secret —
 * NOT the webhook secret). This is only used for an optimistic client-side
 * check; the webhook remains the authoritative source of truth for marking
 * an order paid.
 */
export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(params.signature.trim(), "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
