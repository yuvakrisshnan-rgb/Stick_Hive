import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderFromCheckout, getMyOrders } from "../../../../backend/orders/service";
import { getCurrentUser } from "../../../../backend/auth/service";

export const runtime = "nodejs";

const addressSchema = z.object({
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/),
});

const itemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    productId: z.string().min(1).max(100),
    size: z.enum(["Small", "Medium", "Large"]),
    quantity: z.number().int().min(1).max(10),
  }),
  z.object({
    type: z.literal("custom"),
    cartLineId: z.string().min(1).max(100),
    size: z.enum(["Small", "Medium", "Large"]),
    shape: z.enum(["Circle", "Square", "Rounded", "Die-cut"]),
    finish: z.enum(["Glossy", "Matte", "Holographic", "Transparent"]),
    quantity: z.number().int().min(1).max(10),
    artworkObjectKey: z.string().min(1).max(500),
    artworkContentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  }),
]);

const createOrderSchema = z.object({
  paymentMethod: z.literal("upi"),
  customer: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^\d{10}$/),
    address: addressSchema,
  }),
  items: z.array(itemSchema).min(1).max(50),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    return NextResponse.json({ success: true, orders: await getMyOrders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load orders.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = createOrderSchema.parse(await request.json());
    const order = await createOrderFromCheckout(body);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid checkout data." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to create order.";
    const status = /not authenticated/i.test(message) ? 401 : /invalid|unavailable|quantity|size|artwork|address|email|phone|cart/i.test(message) ? 400 : 503;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
