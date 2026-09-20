/** Cloudflare Worker entry point that delegates to vinext. */
import handler from "vinext/server/fetch-handler";
import { cleanupExpiredRows } from "../backend/db/cleanup";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },

  // Daily cron (see wrangler.jsonc's triggers.crons) - deletes expired
  // otp_challenges/sessions rows. See migrations/0003_auth_tables.sql's
  // comment: expired rows were always filtered out at read time rather
  // than relied on to be deleted, so this is pure housekeeping - it can
  // fail or run late without breaking auth.
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      cleanupExpiredRows(env.DB).then(
        ({ otpDeleted, sessionsDeleted }) => {
          console.log(`[cleanup] cron=${event.cron} deleted ${otpDeleted} expired otp_challenges, ${sessionsDeleted} expired sessions`);
        },
        (error) => {
          console.error("[cleanup] scheduled cleanup failed:", error instanceof Error ? error.message : error);
        },
      ),
    );
  },
};
