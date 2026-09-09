import { NextResponse } from "next/server";

export function errorFromUnknown(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const lower = message.toLowerCase();

  if (lower.includes("not configured")) {
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
  if (lower.includes("wait a moment")) {
    return NextResponse.json({ success: false, error: message }, { status: 429 });
  }
  if (lower.includes("unable to send")) {
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}
