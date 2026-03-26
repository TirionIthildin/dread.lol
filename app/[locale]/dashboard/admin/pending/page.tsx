import { redirect } from "next/navigation";

/** Pending users are now in Admin → Users → Pending tab. */
export default function AdminPendingPage() {
  redirect("/dashboard/admin/users");
}
