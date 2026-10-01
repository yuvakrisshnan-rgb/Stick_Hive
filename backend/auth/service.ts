import { Resend } from "resend";
import { cookies } from "next/headers";
import { getD1, nowIso } from "../db/d1";
import {
  AUTH_COOKIE_NAME,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  SESSION_MAX_AGE_SECONDS,
  authFromEmail,
  requireResendApiKey,
} from "./config";
import { createSessionToken, generateOtp, hashValue, normalizeEmail } from "./crypto";
import type { OtpChallengeRow, SessionRow, UserRow } from "./types";

function now(): Date {
  return new Date();
}

function assertValidEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new Error("Please enter a valid email address.");
  }
  return normalized;
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  // AUTH_DEBUG_OTP is an explicit opt-in debug switch - it now wins
  // outright, checked before RESEND_API_KEY/NODE_ENV at all. Previously
  // this only activated when no RESEND_API_KEY was configured AND
  // NODE_ENV !== "production", which meant it was silently unreachable
  // whenever a real key happened to be set (e.g. for testing real
  // delivery occasionally) - discovered concretely while wiring up Task
  // 4.2's signed-in e2e checkout test against Task 4.3's production-build
  // webServer: a real RESEND_API_KEY is set in .dev.vars, and Resend's
  // sandbox sender can't actually deliver to the arbitrary per-test email
  // addresses that flow generates, so the real send just failed outright.
  // Safe to key on AUTH_DEBUG_OTP alone: the real safety boundary was
  // never NODE_ENV, it's that AUTH_DEBUG_OTP is explicitly "false" in
  // wrangler.jsonc's own committed vars - the only thing that reaches the
  // actually-deployed Worker.
  if (process.env.AUTH_DEBUG_OTP === "true") {
    console.info(`[Stick Hive auth] OTP for ${email}: ${code}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    requireResendApiKey();
  }

  const resend = new Resend(apiKey!);
  const result = await resend.emails.send({
    from: authFromEmail(),
    to: email,
    subject: "Your Stick Hive verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2>Verify your email 🐝</h2>
        <p style="color:#555">Use the code below to verify your email address for Stick Hive.</p>
        <div style="background:#fff8ed;border-radius:16px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</span>
        </div>
        <p style="color:#999;font-size:13px">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `,
  });

  if (result.error) {
    // Diagnostic only - captures Resend's real error (name/message/status)
    // server-side so it's visible via `wrangler tail`, without changing the
    // generic message the caller still sees. Temporary instrumentation for
    // investigating a live "unable to send" report - not a behavior change.
    console.error(`[Stick Hive auth] Resend send failed for ${email}:`, JSON.stringify(result.error));
    throw new Error("Unable to send verification email.");
  }
}

export async function requestEmailOtp(emailInput: string): Promise<{ success: true; debugCode?: string }> {
  const email = assertValidEmail(emailInput);
  const db = getD1();

  // No expires_at filter here on purpose: the resend cooldown should apply
  // based on when a code was last sent, regardless of whether that code
  // itself has since expired - matches the original Mongo behavior exactly.
  const existing = await db.prepare("SELECT * FROM otp_challenges WHERE email = ?").bind(email).first<OtpChallengeRow>();
  const current = Date.now();

  if (existing && current - new Date(existing.last_sent_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new Error("Please wait a moment before requesting another code.");
  }

  const code = generateOtp();
  const createdAt = now();
  const expiresAt = new Date(current + OTP_EXPIRY_MS);

  await db
    .prepare(
      `INSERT INTO otp_challenges (email, code_hash, attempts, max_attempts, expires_at, last_sent_at, created_at)
       VALUES (?, ?, 0, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         code_hash = excluded.code_hash,
         attempts = 0,
         max_attempts = excluded.max_attempts,
         expires_at = excluded.expires_at,
         last_sent_at = excluded.last_sent_at,
         created_at = excluded.created_at`,
    )
    .bind(email, hashValue(code), OTP_MAX_ATTEMPTS, expiresAt.toISOString(), createdAt.toISOString(), createdAt.toISOString())
    .run();

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    await db.prepare("DELETE FROM otp_challenges WHERE email = ?").bind(email).run();
    throw error;
  }

  // Same AUTH_DEBUG_OTP-alone gate as sendOtpEmail above, for the same
  // reason - see its comment.
  return process.env.AUTH_DEBUG_OTP === "true"
    ? { success: true, debugCode: code }
    : { success: true };
}

export async function verifyEmailOtp(emailInput: string, codeInput: string): Promise<{
  success: true;
  user: { id: string; email: string };
}> {
  const email = assertValidEmail(emailInput);
  const code = codeInput.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter the 6-digit verification code.");
  }

  const db = getD1();

  // Read the row regardless of expiry (not `WHERE ... AND expires_at > ?`)
  // so the two failure cases below can give distinct error messages - "no
  // code found" vs "code expired" - matching the original behavior. The
  // expires_at check still happens, just in application code right after.
  const challenge = await db.prepare("SELECT * FROM otp_challenges WHERE email = ?").bind(email).first<OtpChallengeRow>();

  if (!challenge) {
    throw new Error("No verification code found. Please request a new one.");
  }
  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    await db.prepare("DELETE FROM otp_challenges WHERE id = ?").bind(challenge.id).run();
    throw new Error("This code has expired. Please request a new one.");
  }
  if (challenge.attempts >= challenge.max_attempts) {
    await db.prepare("DELETE FROM otp_challenges WHERE id = ?").bind(challenge.id).run();
    throw new Error("Too many attempts. Please request a new code.");
  }

  const expectedHash = challenge.code_hash;
  const providedHash = hashValue(code);

  if (providedHash !== expectedHash) {
    await db.prepare("UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?").bind(challenge.id).run();
    throw new Error("Incorrect code. Please try again.");
  }

  await db.prepare("DELETE FROM otp_challenges WHERE id = ?").bind(challenge.id).run();

  const user = await createOrUpdateVerifiedUser(db, email);
  await createSessionCookie(db, user.id);

  return { success: true, user: { id: user.id, email: user.email } };
}

// Shared by verifyEmailOtp above and mintTestSession (dev-only, see
// below) - both end in the exact same "this email is now a verified,
// logged-in user" state, just reached via a different verification step
// (a real OTP vs. an explicit env-gated test seam).

async function createOrUpdateVerifiedUser(db: D1Database, email: string): Promise<UserRow> {
  const verifiedAt = now();
  const userId = crypto.randomUUID();

  // On conflict (existing user), only touch the verification/login fields -
  // id/email/created_at are intentionally excluded from the UPDATE SET so
  // an existing user's identity and original signup date never change.
  await db
    .prepare(
      `INSERT INTO users (id, email, email_verified_at, created_at, updated_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         email_verified_at = excluded.email_verified_at,
         updated_at = excluded.updated_at,
         last_login_at = excluded.last_login_at`,
    )
    .bind(userId, email, verifiedAt.toISOString(), verifiedAt.toISOString(), verifiedAt.toISOString(), verifiedAt.toISOString())
    .run();

  const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user?.id) {
    throw new Error("Unable to create your account session.");
  }
  return user;
}

async function createSessionCookie(db: D1Database, userId: string): Promise<void> {
  const sessionToken = createSessionToken();
  const sessionNow = now();
  const sessionExpiresAt = new Date(sessionNow.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  await db
    .prepare("INSERT INTO sessions (user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(userId, hashValue(sessionToken), sessionNow.toISOString(), sessionExpiresAt.toISOString())
    .run();

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// ============================================================================
// DEV-ONLY TEST SEAM — mints a real signed session (same user upsert, same
// sessions-table row, same httpOnly cookie as verifyEmailOtp above) without
// the OTP round-trip, so e2e tests can drive a genuinely signed-in flow
// (cart, checkout, orders) without reimplementing this module's crypto or
// depending on a real inbox.
//
// Deliberately gated on AUTH_TEST_SESSION_SEAM=true ALONE, not also
// NODE_ENV !== "production" (unlike AUTH_DEBUG_OTP/the /dev/* pages) - a
// real, load-bearing difference discovered while wiring up Task 4.3's
// webServer, not an oversight. `vinext build` + `wrangler dev --config
// dist/server/wrangler.json` (the real production artifact, run locally
// for e2e testing) genuinely sets NODE_ENV=production - confirmed
// directly (the /dev/* pages correctly 404 there). A NODE_ENV check would
// make this seam permanently unusable in exactly the environment it
// exists for. The real safety boundary is that AUTH_TEST_SESSION_SEAM is
// never in wrangler.jsonc's committed `vars` (the only thing that reaches
// the actually-deployed Worker) and only ever set via the gitignored,
// local-only .dev.vars - its ABSENCE, not NODE_ENV, is what keeps this
// off the real live site. Still mints a fully valid session for an
// arbitrary email with zero verification, so the explicit opt-in still
// matters - just not paired with a check that would defeat its purpose.
// ============================================================================

export function isTestSessionSeamAllowed(): boolean {
  return process.env.AUTH_TEST_SESSION_SEAM === "true";
}

export async function mintTestSession(emailInput: string): Promise<{
  success: true;
  user: { id: string; email: string };
}> {
  if (!isTestSessionSeamAllowed()) {
    throw new Error("Test session seam is not enabled.");
  }

  const email = assertValidEmail(emailInput);
  const db = getD1();

  const user = await createOrUpdateVerifiedUser(db, email);
  await createSessionCookie(db, user.id);

  return { success: true, user: { id: user.id, email: user.email } };
}

export type CurrentUser = { id: string; email: string };

export function isAdminUser(user: CurrentUser): boolean {
  return getAdminEmails().includes(user.email.toLowerCase());
}

function getAdminEmails(): string[] {
  return (process.env.STICKHIVE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getD1();
  // expires_at filtered directly in the query, same as the original Mongo
  // $gt filter - no distinct error message is needed here, so pushing the
  // check into SQL (rather than a post-read check like verifyEmailOtp
  // above) is fine.
  const session = await db
    .prepare("SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(hashValue(token), nowIso())
    .first<SessionRow>();

  if (!session?.user_id) return null;

  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(session.user_id).first<UserRow>();
  if (!user) return null;

  return { id: user.id, email: user.email };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const db = getD1();
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hashValue(token)).run();
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}
