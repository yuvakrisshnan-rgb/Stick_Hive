import Stripe from "stripe";
import { NextResponse } from "next/server";
import { verifyStripeWebhook } from "../../../../../../backend/payments/stripe";
import { setStripePaymentState } from "../../../../../../backend/orders/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing Stripe signature.", { status: 400 });

  try {
    const payload = await request.text();
    const event = verifyStripeWebhook(payload, signature);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await setStripePaymentState({
          sessionId: session.id,
          paymentStatus: session.payment_status === "paid" ? "paid" : "pending",
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        });
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await setStripePaymentState({ sessionId: session.id, paymentStatus: "failed" });
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await setStripePaymentState({ sessionId: session.id, paymentStatus: "cancelled" });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    return new NextResponse("Webhook error.", { status: 400 });
  }
}
