import { NextResponse } from "next/server";
import { applyDelhiveryTrackingEvent, extractTrackingEvent, webhookSecretMatches, delhiveryTrackingUrl } from "../../../../../backend/shipping/delhivery";
import { markOutForDeliveryEmailSent } from "../../../../../backend/orders/service";
import { sendOutForDeliveryEmail } from "../../../../../backend/shipping/notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!webhookSecretMatches(request)) return NextResponse.json({ success: false, error: "Unauthorized webhook." }, { status: 401 });
  try {
    const payload = (await request.json()) as Record<string, any>;
    const event = extractTrackingEvent(payload);
    if (!event.awb) return NextResponse.json({ success: true, ignored: true, reason: "Missing AWB" });
    const result = await applyDelhiveryTrackingEvent(event);
    if (result.matched && result.emailNeeded && result.email && result.shippingDetails?.trackingNumber) {
      try {
        await sendOutForDeliveryEmail({ to: result.email, customerName: result.customerName || "there", orderId: result.orderId || "", courier: "Delhivery", awb: result.shippingDetails.trackingNumber, trackingUrl: result.shippingDetails.trackingUrl || delhiveryTrackingUrl(result.shippingDetails.trackingNumber) });
        await markOutForDeliveryEmailSent(result.orderId || "");
      } catch (emailError) {
        console.error("Failed to send out-for-delivery email:", emailError);
      }
    }
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delhivery webhook error:", error);
    return NextResponse.json({ success: false, error: "Webhook received but could not be processed." }, { status: 400 });
  }
}
