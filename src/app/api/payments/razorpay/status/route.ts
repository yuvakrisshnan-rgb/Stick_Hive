import { NextResponse } from "next/server";
import { isRazorpayConfigured } from "../../../../../../backend/payments/razorpay";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ success: true, enabled: isRazorpayConfigured() });
}
