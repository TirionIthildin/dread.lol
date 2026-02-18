import type { Metadata } from "next";
import Link from "next/link";
import { getPendingUsersList } from "@/lib/member-profiles";
import { requireAdmin } from "@/app/dashboard/actions";
import AdminPendingList from "@/app/dashboard/AdminPendingList";

export const metadata: Metadata = {
  title: "Admin – Approve accounts",
  description: "Approve or manage member accounts",
  robots: "noindex, nofollow",
};

export default async function AdminPage() {
  const err = await requireAdmin();
  if (err) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]" role="alert">
          {err === "Not signed in" ? (
            <p>
              <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
                Sign in
              </Link>{" "}
              to access the admin panel.
            </p>
          ) : (
            <p>{err}</p>
          )}
        </div>
      </div>
    );
  }

  const pending = await getPendingUsersList();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Approve accounts
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Users below have signed in but are not approved. Approve them to grant dashboard access.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          No pending accounts. New signups will appear here until you approve them.
        </div>
      ) : (
        <AdminPendingList pending={pending} />
      )}
    </div>
  );
}
