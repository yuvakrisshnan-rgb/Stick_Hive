import { NextResponse } from "next/server";
import { openApiSpec } from "../../../../../backend/openapi/auth-spec";

export function GET() {
  return NextResponse.json(openApiSpec);
}
