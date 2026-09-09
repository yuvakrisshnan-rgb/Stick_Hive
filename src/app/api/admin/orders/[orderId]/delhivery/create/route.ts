import { NextResponse } from "next/server";
import { z } from "zod";
import { createDelhiveryShipment } from "../../../../../../../../backend/shipping/delhivery";
import { getAdminOrder } from "../../../../../../../../backend/orders/service";
import { getCollection } from "../../../../../../../../backend/db/mongodb";
import type { OrderDocument } from "../../../../../../../../backend/orders/service";

export const runtime = "nodejs";

const schema = z.object({
  pickupLocation: z.string().trim().max(120).optional(),
  weightGrams: z.coerce.number().positive().max(500000),
  lengthCm: z.coerce.number().positive().max(300),
  widthCm: z.coerce.number().positive().max(300),
  heightCm: z.coerce.number().positive().max(300),
});

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const input = schema.parse(await request.json());
    const serialized = await getAdminOrder(orderId);
    if (!serialized) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (serialized.paymentStatus !== "paid") return NextResponse.json({ success: false, error: "Verify payment before creating a Delhivery shipment." }, { status: 400 });
    if (serialized.status === "cancelled") return NextResponse.json({ success: false, error: "Cancelled orders cannot be shipped." }, { status: 400 });
    if (serialized.shippingDetails?.trackingNumber) return NextResponse.json({ success: false, error: "This order already has a tracking number." }, { status: 400 });

    const collection = await getCollection<OrderDocument>("orders");
    const raw = await collection.findOne({ orderId });
    if (!raw) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });

    const created = await createDelhiveryShipment(raw, input);
    const shippingDetails = {
      ...(raw.shippingDetails ?? {}),
      method: "courier" as const,
      courier: "Delhivery",
      trackingNumber: created.waybill,
      trackingUrl: created.trackingUrl,
      delhivery: { waybill: created.waybill, pickupLocation: created.pickupLocation, createdAt: new Date(), environment: process.env.DELHIVERY_ENV === "staging" ? "staging" : "production" },
      updatedAt: new Date(),
    };
    await collection.updateOne({ _id: raw._id }, { $set: { shippingDetails, updatedAt: new Date(), status: raw.status === "placed" ? "packed" : raw.status } });
    const updated = await getAdminOrder(orderId);
    return NextResponse.json({ success: true, order: updated, delhivery: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Delhivery shipment.";
    const status = /authenticated|admin access/i.test(message) ? (/authenticated/i.test(message) ? 401 : 403) : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
