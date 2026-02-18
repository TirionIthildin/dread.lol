import type { Metadata } from "next";
import Link from "next/link";
import { getPendingUsersListPaginated } from "@/lib/member-profiles";
import { requireAdmin } from "@/app/dashboard/actions";
import AdminPendingListWithRefresh from "./AdminPendingListWithRefresh";
import PendingSearchForm from "./PendingSearchForm";

export const metadata: Metadata = {
  title: "Admin – Pending approval",
  description: "Approve or search pending member accounts",
  robots: "noindex, nofollow",
};

const PER_PAGE = 20;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminPendingPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Number(params.page) || 1;

  const err = await requireAdmin();
  if (err) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
          role="alert"
        >
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

  const { items, total, page: currentPage, limit, totalPages } = await getPendingUsersListPaginated({
    search: q || undefined,
    page,
    limit: PER_PAGE,
  });

  const pending = items.map((u) => ({
    ...u,
    createdAt: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Pending approval</h1>
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

      <PendingSearchForm defaultValue={q} />

      {pending.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          {q
            ? "No pending accounts match your search."
            : "No pending accounts. New signups will appear here until you approve them."}
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">
            Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} of {total}
          </p>
          <AdminPendingListWithRefresh pending={pending} />
          {totalPages > 1 && (
            <nav
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
              aria-label="Pagination"
            >
              {currentPage > 1 && (
                <Link
                  href={
                    q
                      ? `/dashboard/admin/pending?q=${encodeURIComponent(q)}&page=${currentPage - 1}`
                      : `/dashboard/admin/pending?page=${currentPage - 1}`
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-[var(--muted)]">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={
                    q
                      ? `/dashboard/admin/pending?q=${encodeURIComponent(q)}&page=${currentPage + 1}`
                      : `/dashboard/admin/pending?page=${currentPage + 1}`
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
