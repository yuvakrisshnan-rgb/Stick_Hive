import { NextRequest, NextResponse } from "next/server";
import { sendEmailOtp } from "@/lib/email-otp";
import { isLikelyValidEmail } from "@/lib/address-validation";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !isLikelyValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const result = await sendEmailOtp(email);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}