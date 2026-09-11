import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAdminOrder } from "../../../../../../backend/orders/service";

export const runtime = "nodejs";

const paymentVerificationSchema = z.object({
  transactionId: z.string().trim().min(4).max(120),
  utr: z.string().trim().max(120).optional(),
  payerUpiId: z.string().trim().max(120).optional(),
  payerName: z.string().trim().max(120).optional(),
  paidAmount: z.coerce.number().positive(),
  paidAt: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
});

const shippingDetailsSchema = z.object({
  method: z.enum(["courier", "pickup", "local_delivery"]),
  courier: z.string().trim().max(120).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  trackingUrl: z.string().trim().max(500).optional(),
  pickupLocation: z.string().trim().max(200).optional(),
  pickupInstructions: z.string().trim().max(500).optional(),
});

const schema = z.object({
  paymentStatus: z.enum(["pending_confirmation", "paid", "failed", "cancelled", "refunded"]).optional(),
  status: z.enum(["placed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]).optional(),
  paymentVerification: paymentVerificationSchema.optional(),
  shippingDetails: shippingDetailsSchema.optional(),
}).refine((value) => value.paymentStatus || value.status || value.paymentVerification, "At least one update is required.");

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const body = schema.parse(await request.json());
    const order = await updateAdminOrder({ orderId, ...body });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: "Invalid status update." }, { status: 400 });
    const message = error instanceof Error ? error.message : "Unable to update order.";
    const status = /not authenticated/i.test(message) ? 401 : /admin access/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
