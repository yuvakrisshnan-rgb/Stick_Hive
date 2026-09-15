import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requestEmailOtp } from "../../../../../backend/auth/service";
import { errorFromUnknown } from "../../../../../backend/http/auth-response";
import { rateLimit, getClientIp } from "../../../../../backend/security/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().trim().email().max(254) });

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (ip && !(await rateLimit(`send-otp:${ip}`, 5, 10 * 60 * 1000))) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = schema.parse(await request.json());
    const result = await requestEmailOtp(body.email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    return errorFromUnknown(error);
  }
}
