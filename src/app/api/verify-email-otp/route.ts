import { NextRequest, NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/email-otp";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json(
      { success: false, error: "Missing email or code." },
      { status: 400 },
    );
  }

  const result = verifyEmailOtp(email, code);

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}