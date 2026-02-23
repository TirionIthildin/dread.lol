"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { GearSix } from "@phosphor-icons/react";
import AdminUserModal, { type AdminUser } from "@/app/dashboard/AdminUserModal";

type Props = {
  isAdmin: boolean;
  profileOwnerUserId: string;
};

function normalizeUser(u: AdminUser & { createdAt?: Date; customBadgeVouchers?: number }): AdminUser {
  return {
    ...u,
    customBadgeVouchers: u.customBadgeVouchers ?? 0,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : (u.createdAt as Date)?.toISOString?.() ?? "",
  };
}

export default function ProfileAdminToolbar({ isAdmin, profileOwnerUserId }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  async function handleClick() {
    setModalOpen(true);
    setLoading(true);
    setUser(null);
    try {
      const res = await fetch(`/api/dashboard/admin/users/${encodeURIComponent(profileOwnerUserId)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(normalizeUser(data.user));
      }
    } catch {
      // Keep modal open but show nothing useful - user can close
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/95 shadow-lg hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        aria-label="Open user moderation"
      >
        <GearSix size={20} weight="regular" className="text-[var(--muted)]" />
      </button>

      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          user ? (
            <AdminUserModal
              user={user}
              onClose={() => {
                setModalOpen(false);
                setUser(null);
                router.refresh();
              }}
              onUpdate={(updated) => {
                setUser(updated);
                router.refresh();
              }}
            />
          ) : (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-toolbar-modal-title"
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setModalOpen(false)}
                aria-hidden
              />
              <div
                className="relative z-10 w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="admin-toolbar-modal-title" className="text-base font-semibold text-[var(--foreground)]">
                  User moderation
                </h3>
                {loading ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Loading…</p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--warning)]">
                    Could not load user. They may have been deleted.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          document.body
        )}
    </>
  );
}
