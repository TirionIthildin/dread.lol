"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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

type AdminPanel = "users" | "improvement";

type Props = { isAdmin: boolean };

export default function DashboardNavAdmin({ isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<AdminPanel>("users");
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
    setActivePanel("users");
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

      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
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
            <div
              className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 bg-[var(--bg)]/80">
              <h2 id="admin-modal-title" className="text-lg font-semibold text-[var(--foreground)]">
                Admin
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                aria-label="Close"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <nav
                className="shrink-0 w-48 border-r border-[var(--border)] bg-[var(--bg)]/50 p-2 flex flex-col gap-0.5"
                aria-label="Admin sections"
              >
                <button
                  type="button"
                  onClick={() => setActivePanel("users")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePanel === "users"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  User management
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("improvement")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePanel === "improvement"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Improvement
                </button>
              </nav>

              {/* Main content */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {activePanel === "users" && (
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
                )}
                {activePanel === "improvement" && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-6 text-center">
                      <p className="text-[var(--muted)] text-sm">
                        Improvement tools and suggestions will live here.
                      </p>
                      <p className="text-[var(--muted)] text-xs mt-2">
                        Coming soon.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
