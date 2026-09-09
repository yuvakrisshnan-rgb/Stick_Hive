import { NextResponse } from "next/server";
import { checkS3Bucket, getS3BucketName } from "../../../../../backend/storage/s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    await checkS3Bucket();
    return NextResponse.json({
      success: true,
      storage: "s3",
      bucket: getS3BucketName(),
      endpoint: process.env.S3_ENDPOINT || "aws",
      region: process.env.AWS_REGION || "ap-south-1",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "S3 is unavailable.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
