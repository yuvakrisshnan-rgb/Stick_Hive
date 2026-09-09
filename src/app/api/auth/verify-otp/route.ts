import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { verifyEmailOtp } from "../../../../../backend/auth/service";
import { errorFromUnknown } from "../../../../../backend/http/auth-response";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const result = await verifyEmailOtp(body.email, body.code);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Invalid email or 6-digit verification code." }, { status: 400 });
    }
    return errorFromUnknown(error);
  }
}
