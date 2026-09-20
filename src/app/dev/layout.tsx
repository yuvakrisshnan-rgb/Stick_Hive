import { notFound } from "next/navigation";

import { isDevPreviewAllowed } from "../../../backend/products/dev-preview-guard";

// Single guard for everything under /dev - a real HTTP 404 (via
// notFound(), not a redirect, which would return a 307/302 first) on
// process.env.NODE_ENV === "production", the same convention already
// relied on in backend/security/rate-limit.ts and getClientIp(). This is
// dev-only tooling and must never be reachable on the live site.
//
// There's no Next.js/vinext mechanism to exclude a route from the
// production build entirely (checked next.config.ts, wrangler.jsonc,
// package.json - nothing there, and a build-time file-deletion hack
// would be fragile) - this runtime check is the real, honest protection.
// force-dynamic matters concretely: without it, this layout could be
// statically prerendered at build time with whatever NODE_ENV was
// present then, rather than re-checked on every request.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (!isDevPreviewAllowed()) {
    notFound();
  }

  return <>{children}</>;
}
