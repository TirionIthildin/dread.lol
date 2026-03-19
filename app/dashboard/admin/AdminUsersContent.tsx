"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CaretRight } from "@phosphor-icons/react";
import AdminUserModal, { type AdminUser } from "@/app/dashboard/AdminUserModal";

function normalizeUser(u: AdminUser & { createdAt?: Date; customBadgeVouchers?: number }): AdminUser {
  return {
    ...u,
    verifiedCreator: u.verifiedCreator ?? false,
    customBadgeVouchers: u.customBadgeVouchers ?? 0,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : (u.createdAt as Date)?.toISOString?.() ?? "",
  };
}

export default function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q?: string) => {
    try {
      const url = q?.trim()
        ? `/api/dashboard/admin/users?q=${encodeURIComponent(q.trim())}`
        : "/api/dashboard/admin/users";
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

  useEffect(() => {
    setLoading(true);
    fetchUsers(searchQuery);
  }, [searchQuery, fetchUsers]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setLoading(true);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="shrink-0 p-4 border-b border-[var(--border)] space-y-3">
          <label className="sr-only" htmlFor="admin-user-search">
            Search users
          </label>
          <input
            id="admin-user-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, username, or ID…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && users === null ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : error ? (
            <p className="text-sm text-[var(--warning)]">{error}</p>
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
                      <CaretRight
                        size={16}
                        weight="regular"
                        className="shrink-0 text-[var(--muted)]"
                        aria-hidden
                      />
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

      {selectedUser &&
        typeof document !== "undefined" &&
        createPortal(
          <AdminUserModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={(updated) => {
              setUsers((prev) =>
                prev ? prev.map((u) => (u.id === updated.id ? updated : u)) : null
              );
              setSelectedUser(updated);
            }}
          />,
          document.body
        )}
    </>
  );
}
