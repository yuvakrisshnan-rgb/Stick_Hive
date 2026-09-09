import { createHash } from "node:crypto";

/**
 * Derive a stable, non-guessable admin path from the server-only AUTH_SECRET.
 * The pathname is not the authorization mechanism: the page and every admin
 * API route still require an authenticated user whose email is admin-allowed.
 */
export function getAdminPath(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }

  const key = createHash("sha256")
    .update(`stickhive-admin-path:${secret}`)
    .digest("hex")
    .slice(0, 32);

  return `/admin/${key}`;
}

export function isValidAdminPathKey(key: string): boolean {
  if (!/^[a-f0-9]{32}$/.test(key)) return false;
  const expectedPath = getAdminPath();
  return expectedPath === `/admin/${key}`;
}
