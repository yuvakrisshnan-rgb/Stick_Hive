import { redirect } from "next/navigation";
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

  // Invalid/unknown admin URLs behave exactly like a normal missing page.
  if (!isValidAdminPathKey(accessKey)) {
    redirect("/404");
  }

  // Never reveal whether a requester is logged out or simply not an admin.
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    redirect("/404");
  }

  return <AdminClient />;
}
