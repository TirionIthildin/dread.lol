"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { GearSix, X, Users, Shield, GridFour, Star, CaretRight, CreditCard } from "@phosphor-icons/react";
import AdminUserModal, { type AdminUser } from "@/app/dashboard/AdminUserModal";
import AdminBadgesPanel from "@/app/dashboard/AdminBadgesPanel";
import AdminTemplatesPanel from "@/app/dashboard/AdminTemplatesPanel";
import AdminBillingPanel from "@/app/dashboard/AdminBillingPanel";
import { approveUserAction } from "@/app/dashboard/actions";

type AdminPanel = "users" | "improvement" | "badges" | "templates" | "billing";

export type AdminPendingUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type Props = { isAdmin: boolean; variant?: "default" | "sidebar" };

function normalizeUser(u: AdminUser & { createdAt?: Date }): AdminUser {
  return {
    ...u,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : (u.createdAt as Date)?.toISOString?.() ?? "",
  };
}

export default function DashboardNavAdmin({ isAdmin, variant = "default" }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<AdminPanel>("users");
  const [usersListMode, setUsersListMode] = useState<"all" | "pending">("all");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [pendingUsers, setPendingUsers] = useState<AdminPendingUser[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isPendingApprove, startApproveTransition] = useTransition();
  const router = useRouter();

  function handleApprovePending(userId: string) {
    setApprovingId(userId);
    startApproveTransition(async () => {
      const result = await approveUserAction(userId);
      setApprovingId(null);
      if (!result.error) {
        fetchPending(searchQuery);
        setSelectedUser(null);
      }
    });
  }

  function pendingToAdminUser(u: AdminPendingUser): AdminUser {
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      approved: false,
      verified: false,
      staff: false,
      premiumGranted: false,
      createdAt: u.createdAt,
    };
  }

  const fetchUsers = useCallback(async (q?: string) => {
    try {
      const url = q?.trim() ? `/api/dashboard/admin/users?q=${encodeURIComponent(q.trim())}` : "/api/dashboard/admin/users";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.users ?? []).map((u: AdminUser & { createdAt?: Date }) => normalizeUser(u));
      setUsers(list);
      setError(null);
    } catch {
      setError("Failed to load");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async (q?: string) => {
    try {
      const url = q?.trim() ? `/api/dashboard/admin/pending?q=${encodeURIComponent(q.trim())}` : "/api/dashboard/admin/pending";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.pending ?? []).map((u: AdminPendingUser & { createdAt?: Date }) => ({
        ...u,
        createdAt: typeof u.createdAt === "string" ? u.createdAt : (u.createdAt as Date)?.toISOString?.() ?? "",
      }));
      setPendingUsers(list);
      setError(null);
    } catch {
      setError("Failed to load");
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    setLoading(true);
    if (usersListMode === "pending") fetchPending(searchQuery);
    else fetchUsers(searchQuery);
  }, [modalOpen, searchQuery, usersListMode, fetchUsers, fetchPending]);

  useEffect(() => {
    if (!modalOpen) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setLoading(true);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [modalOpen, searchInput]);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setActivePanel("users");
    setUsersListMode("all");
    setUsers(null);
    setPendingUsers(null);
    setSearchQuery("");
    setSearchInput("");
    setError(null);
    setSelectedUser(null);
    setLoading(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, closeModal]);

  if (!isAdmin) return null;

  const buttonClass =
    variant === "sidebar"
      ? "w-full inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all duration-200 hover:bg-[var(--warning)]/10 hover:text-[var(--warning)] hover:border-[var(--warning)]/30 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--warning)]/50 focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
      : "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={buttonClass}
      >
        <GearSix size={20} weight="regular" className="shrink-0" aria-hidden />
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
              className="relative z-10 w-full min-w-[min(28rem,100vw)] min-h-[32rem] max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden"
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
                <X size={20} weight="regular" className="shrink-0" aria-hidden />
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
                  <Users size={16} weight="regular" className="shrink-0" aria-hidden />
                  User management
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("badges")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePanel === "badges"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  <Shield size={16} weight="regular" className="shrink-0" aria-hidden />
                  Badges
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("templates")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePanel === "templates"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  <GridFour size={16} weight="regular" className="shrink-0" aria-hidden />
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("billing")}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePanel === "billing"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  <CreditCard size={16} weight="regular" className="shrink-0" aria-hidden />
                  Billing
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
                  <Star size={16} weight="regular" className="shrink-0" aria-hidden />
                  Improvement
                </button>
              </nav>

              {/* Main content */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {activePanel === "users" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="shrink-0 p-4 border-b border-[var(--border)] space-y-3">
                      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setUsersListMode("all")}
                          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            usersListMode === "all"
                              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                              : "text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          All users
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsersListMode("pending")}
                          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            usersListMode === "pending"
                              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                              : "text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          Pending
                        </button>
                      </div>
                      <label className="sr-only" htmlFor="admin-user-search">
                        Search users
                      </label>
                      <input
                        id="admin-user-search"
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={usersListMode === "pending" ? "Search pending…" : "Search by name, username, or ID…"}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {loading && (usersListMode === "all" ? users === null : pendingUsers === null) ? (
                        <p className="text-sm text-[var(--muted)]">Loading…</p>
                      ) : error ? (
                        <p className="text-sm text-[var(--warning)]">{error}</p>
                      ) : usersListMode === "pending" ? (
                        pendingUsers && pendingUsers.length > 0 ? (
                          <ul className="space-y-2">
                            {pendingUsers.map((u) => {
                              const displayName = u.displayName || u.username || `User ${u.id.slice(0, 8)}…`;
                              const busy = approvingId === u.id && isPendingApprove;
                              return (
                                <li
                                  key={u.id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUser(pendingToAdminUser(u))}
                                    className="flex flex-1 min-w-0 items-center gap-3 text-left hover:opacity-90"
                                  >
                                    {u.avatarUrl ? (
                                      <Image
                                        src={u.avatarUrl}
                                        alt=""
                                        className="h-9 w-9 rounded-full border border-[var(--border)] shrink-0"
                                        width={36}
                                        height={36}
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-center text-xs text-[var(--muted)]">
                                        ?
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium text-[var(--foreground)] truncate">
                                        {displayName}
                                      </span>
                                      <span className="block text-xs text-[var(--muted)] truncate">
                                        {u.username ? `@${u.username}` : u.id}
                                      </span>
                                    </div>
                                    <CaretRight size={16} weight="regular" className="shrink-0 text-[var(--muted)]" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePending(u.id)}
                                    disabled={busy}
                                    className="shrink-0 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                                  >
                                    {busy ? "Approving…" : "Approve"}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-[var(--muted)]">
                            {searchQuery ? "No pending users match your search." : "No pending users. New signups will appear here until you approve them."}
                          </p>
                        )
                      ) : users && users.length > 0 ? (
                        <ul className="space-y-1">
                          {users.map((u) => {
                            const displayName = u.displayName || u.username || `User ${u.id.slice(0, 8)}…`;
                            return (
                              <li key={u.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedUser(u)}
                                  className="w-full flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)] hover:border-[var(--border-bright)]"
                                >
                                  {u.avatarUrl ? (
                                    <Image
                                      src={u.avatarUrl}
                                      alt=""
                                      className="h-9 w-9 rounded-full border border-[var(--border)] shrink-0"
                                      width={36}
                                      height={36}
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-center text-xs text-[var(--muted)]">
                                      ?
                                    </div>
                                  )}
                                  <span className="flex-1 min-w-0 text-sm font-medium text-[var(--foreground)] truncate">
                                    {displayName}
                                  </span>
                                  {!u.approved && (
                                    <span className="text-xs text-[var(--muted)] shrink-0">Pending</span>
                                  )}
                                  <CaretRight size={16} weight="regular" className="shrink-0 text-[var(--muted)]" aria-hidden />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-[var(--muted)]">
                          {searchQuery ? "No users match your search." : "No users yet."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {activePanel === "badges" && <AdminBadgesPanel />}
                {activePanel === "templates" && <AdminTemplatesPanel />}
                {activePanel === "billing" && <AdminBillingPanel />}
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

      {selectedUser &&
        typeof document !== "undefined" &&
        createPortal(
          <AdminUserModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={(updated) => {
              setUsers((prev) => (prev ? prev.map((u) => (u.id === updated.id ? updated : u)) : null));
              setSelectedUser(updated);
              if (updated.approved && usersListMode === "pending") {
                fetchPending(searchQuery);
                setSelectedUser(null);
              }
            }}
          />,
          document.body
        )}
    </>
  );
}
