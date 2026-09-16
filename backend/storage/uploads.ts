import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getS3BucketName, getS3Client } from "./s3";

export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type PresignedUpload = {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};

function safeExtension(contentType: string): string {
  switch (contentType) {
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    default: return "png";
  }
}

export function validateUpload(contentType: string, size: number): void {
  if (!ALLOWED_UPLOAD_TYPES.includes(contentType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    throw new Error("Unsupported image type. Use PNG, JPEG, or WebP.");
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new Error("Artwork must be between 1 byte and 5 MB.");
  }
}

// userId is a D1 users.id - a crypto.randomUUID() string (see
// backend/auth/service.ts, Task 2), not a Mongo ObjectId hex string.
export function createCustomArtworkObjectKey(userId: string, contentType: string): string {
  return `custom-art/temp/${userId}/${randomUUID()}.${safeExtension(contentType)}`;
}

export async function createCustomArtworkUpload(params: {
  contentType: string;
  size: number;
  userId: string;
}): Promise<PresignedUpload> {
  validateUpload(params.contentType, params.size);

  const objectKey = createCustomArtworkObjectKey(params.userId, params.contentType);
  const expiresIn = 300;
  const uploadUrl = await getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: objectKey,
      ContentType: params.contentType,
      Metadata: {
        purpose: "stickhive-custom-artwork",
        "user-id": params.userId,
      },
    }),
    { expiresIn },
  );

  return { uploadUrl, objectKey, expiresIn };
}

export async function uploadCustomArtwork(params: {
  body: Uint8Array;
  contentType: string;
  userId: string;
  size: number;
}): Promise<{ objectKey: string; size: number; contentType: string }> {
  validateUpload(params.contentType, params.size);
  if (params.body.byteLength !== params.size) {
    throw new Error("Uploaded file size does not match the declared size.");
  }

  const objectKey = createCustomArtworkObjectKey(params.userId, params.contentType);
  await getS3Client().send(new PutObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
    Body: params.body,
    ContentType: params.contentType,
    ContentLength: params.size,
    Metadata: {
      purpose: "stickhive-custom-artwork",
      "user-id": params.userId,
    },
  }));

  return { objectKey, size: params.size, contentType: params.contentType };
}
