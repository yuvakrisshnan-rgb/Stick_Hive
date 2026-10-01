import { notFound } from "next/navigation";
import AdminClient from "../admin-client";
import { getCurrentUser, isAdminUser } from "../../../../backend/auth/service";
import { isValidAdminPathKey } from "../../../../backend/auth/admin-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SecureAdminPage({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;

  // Invalid/unknown admin URLs behave exactly like a normal missing page -
  // notFound() (a real HTTP 404), not redirect("/404") (a 307 to a page
  // that itself renders with a 200 status - confirmed directly: a bad
  // admin key returned 200 after the redirect resolved, failing
  // api-security.spec.ts's "does not leak order data without auth" check
  // once that test ran against a genuine production build instead of
  // `next dev`, Task 4.3). Same fix already applied via this exact
  // reasoning in src/app/dev/layout.tsx's own guard.
  if (!isValidAdminPathKey(accessKey)) {
    notFound();
  }

  // Never reveal whether a requester is logged out or simply not an admin.
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    notFound();
  }

  return <AdminClient />;
}
