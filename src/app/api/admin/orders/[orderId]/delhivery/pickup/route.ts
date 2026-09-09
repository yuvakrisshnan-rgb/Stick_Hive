import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminOrder } from "../../../../../../../../backend/orders/service";
import { getCollection } from "../../../../../../../../backend/db/mongodb";
import type { OrderDocument } from "../../../../../../../../backend/orders/service";
import { scheduleDelhiveryPickup } from "../../../../../../../../backend/shipping/delhivery";

export const runtime = "nodejs";
const schema = z.object({
  pickupLocation: z.string().trim().min(1).max(120),
  pickupDate: z.string(),
  pickupTime: z.string(),
  expectedPackageCount: z.coerce.number().int().positive().max(1000),
});
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const body = schema.parse(await request.json());
    const order = await getAdminOrder(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (order.paymentStatus !== "paid") return NextResponse.json({ success: false, error: "Verify payment before requesting pickup." }, { status: 400 });
    if (order.shippingDetails?.courier !== "Delhivery" || !order.shippingDetails.trackingNumber) return NextResponse.json({ success: false, error: "Create the Delhivery shipment before requesting pickup." }, { status: 400 });
    const result = await scheduleDelhiveryPickup(body);
    const pickupId = String((result as Record<string, unknown>)?.pickup_id ?? (result as Record<string, unknown>)?.pickupId ?? (result as Record<string, unknown>)?.id ?? "").trim();
    if (pickupId) {
      const collection = await getCollection<OrderDocument>("orders");
      const raw = await collection.findOne({ orderId });
      if (raw?.shippingDetails) {
        await collection.updateOne({ _id: raw._id }, { $set: { "shippingDetails.delhivery.pickupId": pickupId, "shippingDetails.updatedAt": new Date(), updatedAt: new Date() } });
      }
    }
    return NextResponse.json({ success: true, pickup: result, pickupId: pickupId || undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to schedule Delhivery pickup.";
    return NextResponse.json({ success: false, error: message }, { status: /authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : 400 });
  }
}
