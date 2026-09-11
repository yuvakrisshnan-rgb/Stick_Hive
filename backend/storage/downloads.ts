import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3BucketName, getS3Client } from "./s3";

export async function createArtworkDownloadUrl(objectKey: string, filename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"` } : {}),
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 300 });
}

export async function getArtworkObject(objectKey: string) {
  return getS3Client().send(new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
  }));
}

