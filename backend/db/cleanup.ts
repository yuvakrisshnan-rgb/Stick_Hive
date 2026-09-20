import { nowIso } from "./d1";

// D1/SQLite doesn't support DELETE ... LIMIT, so "batches" means: select a
// page of expired ids, delete exactly those, repeat. Capped per table per
// run so one cron tick can't run unbounded - if a table has more than
// MAX_BATCHES_PER_TABLE * BATCH_SIZE expired rows piled up, the remainder is
// picked up by tomorrow's run rather than blocking this one.
const BATCH_SIZE = 500;
const MAX_BATCHES_PER_TABLE = 20;

type CleanupTable = "otp_challenges" | "sessions";

// Table name is interpolated directly into the SQL text (D1 can't bind
// identifiers) - safe here because it only ever comes from the CleanupTable
// union below, never from request input.
async function deleteExpiredBatches(db: D1Database, table: CleanupTable, nowIsoValue: string): Promise<number> {
  let totalDeleted = 0;

  for (let batch = 0; batch < MAX_BATCHES_PER_TABLE; batch++) {
    const page = await db
      .prepare(`SELECT id FROM ${table} WHERE expires_at <= ? LIMIT ?`)
      .bind(nowIsoValue, BATCH_SIZE)
      .all<{ id: number }>();

    const ids = page.results ?? [];
    if (ids.length === 0) break;

    const placeholders = ids.map(() => "?").join(",");
    await db
      .prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`)
      .bind(...ids.map((row) => row.id))
      .run();

    totalDeleted += ids.length;
    if (ids.length < BATCH_SIZE) break;
  }

  return totalDeleted;
}

/**
 * Deletes expired rows from otp_challenges and sessions. Both tables store
 * expires_at as an ISO 8601 string (see migrations/0003_auth_tables.sql),
 * so a plain lexicographic `<= now` comparison is correct. Called from the
 * Worker's `scheduled` handler (see worker/index.ts) on the daily cron.
 */
export async function cleanupExpiredRows(db: D1Database): Promise<{ otpDeleted: number; sessionsDeleted: number }> {
  const now = nowIso();
  const otpDeleted = await deleteExpiredBatches(db, "otp_challenges", now);
  const sessionsDeleted = await deleteExpiredBatches(db, "sessions", now);
  return { otpDeleted, sessionsDeleted };
}
