import { redirect } from "next/navigation";

/** Pending users are now in Admin → User management → Pending tab. */
export default function AdminPendingPage() {
  redirect("/dashboard");
}
