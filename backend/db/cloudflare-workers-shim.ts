// Stand-in for the "cloudflare:workers" built-in module, used only when
// bundling under plain Next.js/Turbopack (`next build`/`next dev`), which
// has no Workers runtime and therefore no real "cloudflare:workers" module
// to resolve. Aliased in via next.config.ts's turbopack.resolveAlias.
//
// Under vinext (`vinext dev`/`vinext build`), Vite's own resolver finds the
// real module (provided by @cloudflare/vite-plugin running in workerd), so
// this file is never used there - this alias only exists to keep the
// parallel plain-Next.js build/dev path from crashing at module-eval time
// when it transitively imports backend/db/d1.ts. getD1() already throws a
// clear "D1 binding is not configured" error when env.DB is missing, so an
// empty env object here just routes into that existing error path.
export const env: Record<string, unknown> = {};
