import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

let client: S3Client | undefined;

export function getS3Client(): S3Client {
  if (client) return client;

  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const accessKeyId = required("AWS_ACCESS_KEY_ID");
  const secretAccessKey = required("AWS_SECRET_ACCESS_KEY");

  client = new S3Client({
    region: process.env.AWS_REGION?.trim() || "ap-south-1",
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

export function getS3BucketName(): string {
  return required("S3_BUCKET_NAME");
}

export async function checkS3Bucket(): Promise<void> {
  await getS3Client().send(new HeadBucketCommand({ Bucket: getS3BucketName() }));
}
