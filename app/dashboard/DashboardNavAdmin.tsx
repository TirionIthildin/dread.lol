"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPendingList, { type PendingUser } from "@/app/dashboard/AdminPendingList";
import AdminBadgesList from "@/app/dashboard/AdminBadgesList";

export type AdminUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  approved: boolean;
  verified: boolean;
  staff: boolean;
  createdAt: string;
};

type Props = { isAdmin: boolean };

export default function DashboardNavAdmin({ isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<PendingUser[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/pending");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load");
        setPending([]);
        return;
      }
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch {
      setError("Failed to load");
      setPending([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/admin/users");
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.users ?? []).map((u: { createdAt: Date | string }) => ({
        ...u,
        createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt?.toISOString?.() ?? "",
      }));
      setUsers(list);
    } catch {
      // ignore
    }
  }, []);

  function openModal() {
    setModalOpen(true);
    setPending(null);
    setUsers(null);
    setError(null);
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/admin/pending").then((r) => (r.ok ? r.json() : { pending: [] })),
      fetch("/api/dashboard/admin/users").then((r) => (r.ok ? r.json() : { users: [] })),
    ])
      .then(([pendingData, usersData]) => {
        setPending(pendingData.pending ?? []);
        setUsers(
          (usersData.users ?? []).map((u: AdminUser & { createdAt?: Date }) => ({
            ...u,
            createdAt: typeof u.createdAt === "string" ? u.createdAt : (u.createdAt as Date)?.toISOString?.() ?? "",
          }))
        );
        setError(null);
      })
      .catch(() => {
        setError("Failed to load");
        setPending([]);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }

  function closeModal() {
    setModalOpen(false);
    router.refresh();
  }

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      >
        <span aria-hidden>⚙</span>
        Admin
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
              <h2 id="admin-modal-title" className="text-lg font-semibold text-[var(--foreground)]">
                Admin
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label="Close"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loading && pending === null && users === null ? (
                <p className="text-sm text-[var(--muted)]">Loading…</p>
              ) : error ? (
                <p className="text-sm text-[var(--warning)]">{error}</p>
              ) : (
                <>
                  <section>
                    <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Pending approval</h3>
                    {pending && pending.length > 0 ? (
                      <AdminPendingList
                        pending={pending.map((u) => ({
                          ...u,
                          createdAt: typeof u.createdAt === "string" ? new Date(u.createdAt) : u.createdAt,
                        }))}
                        onApproved={() => {
                          fetchPending();
                          fetchUsers();
                        }}
                      />
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No pending accounts.</p>
                    )}
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Verified & Staff badges</h3>
                    {users && users.length > 0 ? (
                      <AdminBadgesList users={users} onUpdate={fetchUsers} />
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No users yet.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
