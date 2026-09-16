import { NextResponse } from "next/server";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "../../../../../../backend/auth/service";
import { getMyOrderForPaymentProof, setPaymentProof } from "../../../../../../backend/orders/service";
import { getS3BucketName, getS3Client } from "../../../../../../backend/storage/s3";
import { rateLimit, getClientIp } from "../../../../../../backend/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ip = getClientIp(request);
    if (ip && !(await rateLimit(`payment-proof:${ip}`, 10, 10 * 60 * 1000))) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
    const { orderId } = await params;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "Choose a payment screenshot." }, { status: 400 });
    const ext = ALLOWED.get(file.type);
    if (!ext) return NextResponse.json({ success: false, error: "Upload a PNG, JPEG, or WebP screenshot." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ success: false, error: "Payment proof must be 5 MB or smaller." }, { status: 400 });

    const active = await getMyOrderForPaymentProof(orderId);
    if (!active) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    if (active.paymentStatus === "cancelled") return NextResponse.json({ success: false, error: "This payment window has expired. Start payment again." }, { status: 409 });
    if (active.paymentStatus === "paid") return NextResponse.json({ success: false, error: "Payment is already verified." }, { status: 409 });

    const key = `payments/proof/${user.id}/${orderId}/${crypto.randomUUID()}.${ext}`;
    await getS3Client().send(new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
      ContentLength: file.size,
      Metadata: { purpose: "stickhive-payment-proof", "order-id": orderId, "user-id": user.id },
    }));

    if (active.paymentProof?.objectKey) {
      await getS3Client().send(new DeleteObjectCommand({ Bucket: getS3BucketName(), Key: active.paymentProof.objectKey }));
    }

    const paymentProof = { objectKey: key, contentType: file.type, fileName: file.name.slice(0, 120), uploadedAt: new Date() };
    await setPaymentProof(orderId, paymentProof);
    return NextResponse.json({ success: true, proof: { ...paymentProof, uploadedAt: paymentProof.uploadedAt.toISOString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload payment proof.";
    return NextResponse.json({ success: false, error: message }, { status: /not authenticated/i.test(message) ? 401 : 400 });
  }
}
