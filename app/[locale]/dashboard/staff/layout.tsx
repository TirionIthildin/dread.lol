import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import StaffLayoutNav from "@/app/[locale]/dashboard/staff/StaffLayoutNav";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <StaffLayoutNav />
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">{children}</div>
    </div>
  );
}
