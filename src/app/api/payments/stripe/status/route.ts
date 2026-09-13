import { NextResponse } from "next/server";
import { isStripeConfigured } from "../../../../../../backend/payments/stripe";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ success: true, enabled: isStripeConfigured() });
}
