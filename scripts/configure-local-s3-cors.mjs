import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const text = fs.readFileSync(fullPath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const endpoint = process.env.S3_ENDPOINT?.trim() || 'http://localhost:4566';
const region = process.env.AWS_REGION?.trim() || 'ap-south-1';
const bucket = process.env.S3_BUCKET_NAME?.trim() || 'stick-hive';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || 'test';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || 'test';

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const CORSRules = [
  {
    AllowedHeaders: ['*'],
    AllowedMethods: ['PUT', 'GET', 'HEAD'],
    AllowedOrigins: ['http://localhost:3000', 'https://stickhive.app'],
    ExposeHeaders: ['ETag'],
  },
];

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules },
    }),
  );
  console.log(`S3 CORS configured for ${bucket} at ${endpoint} (${region}).`);
} catch (error) {
  console.error('Failed to configure S3 CORS.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
