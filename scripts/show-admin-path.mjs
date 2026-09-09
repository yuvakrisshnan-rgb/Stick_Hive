import { createHash } from 'node:crypto';

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32) {
  console.error('Set AUTH_SECRET to at least 32 characters first.');
  process.exit(1);
}

const key = createHash('sha256')
  .update(`stickhive-admin-path:${secret}`)
  .digest('hex')
  .slice(0, 32);

console.log(`/admin/${key}`);
