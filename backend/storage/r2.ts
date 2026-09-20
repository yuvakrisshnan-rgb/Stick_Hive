import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

// R2 exposes an S3-compatible API, so this mirrors backend/storage/s3.ts's
// shape exactly - but deliberately reads separate R2_* env vars rather
// than reusing AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/S3_BUCKET_NAME.
// That other client talks to an entirely different bucket (custom sticker
// artwork); sharing credential env var names between two unrelated
// buckets would be an easy way to accidentally point one at the other's
// bucket, or leak one bucket's credentials into a context meant only for
// the other.
//
// The Cloudflare-native R2Bucket Workers binding (env.PRODUCT_IMAGES,
// see wrangler.jsonc's r2_buckets) is NOT usable here - it only exists
// inside the deployed/dev Worker runtime, not in a plain `node
// scripts/*.mjs` process. This client is for scripts/
// upload-product-images-r2.mjs, which runs as a standalone Node script.

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

let client: S3Client | undefined;

export function getR2Client(): S3Client {
  if (client) return client;

  const accountId = required("R2_ACCOUNT_ID");
  const accessKeyId = required("R2_ACCESS_KEY_ID");
  const secretAccessKey = required("R2_SECRET_ACCESS_KEY");

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

export function getR2BucketName(): string {
  return required("R2_BUCKET_NAME");
}

export async function checkR2Bucket(): Promise<void> {
  await getR2Client().send(new HeadBucketCommand({ Bucket: getR2BucketName() }));
}
