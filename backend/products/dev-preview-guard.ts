// Deliberately zero other imports (not even ../db/d1) - this needs to be
// importable from a plain `node --test` run for tests/unit/dev-preview-
// guard.test.ts. dev-preview-service.ts's other exports pull in getD1(),
// which imports the Workers-only "cloudflare:workers" built-in via an
// extension-less relative specifier - fine under Next.js/vinext's
// bundler resolution, but not resolvable by plain Node ESM at all. Kept
// separate so the one pure, testable piece of this route's gate isn't
// entangled with that.
export function isDevPreviewAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
