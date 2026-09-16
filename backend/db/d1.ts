import { env } from "cloudflare:workers";

/**
 * Thin accessor around the D1 binding, mirroring backend/db/mongodb.ts's
 * getDb() shape so callers migrate with minimal churn. `env` from
 * "cloudflare:workers" is available in any server component, route
 * handler, or server action under vinext - no request-scoped plumbing
 * needed (confirmed in Task 1).
 */
export function getD1(): D1Database {
  const db = (env as { DB?: D1Database }).DB;
  if (!db) {
    throw new Error("D1 binding \"DB\" is not configured. Check wrangler.jsonc.");
  }
  return db;
}

/** ISO 8601 timestamp for the current moment - the convention every table uses for date columns. */
export function nowIso(): string {
  return new Date().toISOString();
}
