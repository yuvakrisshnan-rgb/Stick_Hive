import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../backend/auth/service";
import { getMyOrder, attachStripeSession } from "../../../../../../backend/orders/service";
import { createStripeCheckoutSession } from "../../../../../../backend/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });

    const body = (await request.json()) as { orderId?: string };
    if (!body.orderId) return NextResponse.json({ success: false, error: "orderId is required." }, { status: 400 });

    const order = await getMyOrder(body.orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (order.paymentMethod !== "stripe" || order.paymentStatus !== "pending") {
      return NextResponse.json({ success: false, error: "This order is not available for Stripe payment." }, { status: 409 });
    }

    const origin = new URL(request.url).origin;
    const session = await createStripeCheckoutSession({ order: order as never, origin });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    await attachStripeSession(body.orderId, session.id);
    return NextResponse.json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Stripe checkout.";
    const status = /not authenticated/i.test(message) ? 401 : /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
