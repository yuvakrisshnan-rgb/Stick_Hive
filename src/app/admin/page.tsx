import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /admin is intentionally not an entry point. Admins open the private hashed
// URL from the account dropdown, which avoids the client-navigation redirect
// issue previously seen with /admin.
export default function AdminEntryPage() {
  redirect("/404");
}
