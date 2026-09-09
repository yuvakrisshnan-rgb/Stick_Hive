import { NextResponse } from "next/server";
import { getAdminOrder, markOutForDeliveryEmailSent } from "../../../../../../../../backend/orders/service";
import { extractTrackingEvent, trackDelhiveryShipment, applyDelhiveryTrackingEvent, delhiveryTrackingUrl } from "../../../../../../../../backend/shipping/delhivery";
import { sendOutForDeliveryEmail } from "../../../../../../../../backend/shipping/notifications";

export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    const awb = order.shippingDetails?.trackingNumber;
    if (!awb || order.shippingDetails?.courier !== "Delhivery") return NextResponse.json({ success: false, error: "No Delhivery AWB is linked to this order." }, { status: 400 });
    const raw = await trackDelhiveryShipment(awb);
    const event = extractTrackingEvent(raw);
    if (!event.awb) event.awb = awb;
    const result = await applyDelhiveryTrackingEvent(event);
    if (result.matched && result.emailNeeded && result.email && result.shippingDetails?.trackingNumber) {
      try {
        await sendOutForDeliveryEmail({ to: result.email, customerName: result.customerName || "there", orderId: result.orderId || orderId, courier: "Delhivery", awb: result.shippingDetails.trackingNumber, trackingUrl: result.shippingDetails.trackingUrl || delhiveryTrackingUrl(result.shippingDetails.trackingNumber) });
        await markOutForDeliveryEmailSent(result.orderId || orderId);
      } catch (emailError) {
        console.error("Failed to send out-for-delivery email:", emailError);
      }
    }
    return NextResponse.json({ success: true, tracking: event, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync Delhivery tracking.";
    return NextResponse.json({ success: false, error: message }, { status: /authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : 400 });
  }
}
