import Stripe from "stripe";
import type { OrderDocument } from "../orders/service";

let stripeClient: Stripe | undefined;

function getStripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  if (!value) throw new Error("Stripe is not configured yet.");
  return value;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}

export async function createStripeCheckoutSession(params: {
  order: Pick<OrderDocument, "orderId" | "total" | "customer" | "items">;
  origin: string;
}) {
  const stripe = getStripe();
  const amount = Math.round(params.order.total * 100);
  if (amount <= 0) throw new Error("Order total must be greater than zero.");

  return stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: params.order.orderId,
    customer_email: params.order.customer.email,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Stick Hive Order ${params.order.orderId}`,
            description: `${params.order.items.length} item${params.order.items.length === 1 ? "" : "s"}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: params.order.orderId },
    success_url: `${params.origin}/order-success?orderId=${encodeURIComponent(params.order.orderId)}&payment=stripe`,
    cancel_url: `${params.origin}/checkout?payment=cancelled&orderId=${encodeURIComponent(params.order.orderId)}`,
  });
}

export function verifyStripeWebhook(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
