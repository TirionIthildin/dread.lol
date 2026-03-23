"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  createProfileAliasAction,
  deleteProfileAliasAction,
} from "@/app/dashboard/actions";
import type { ProfileRow } from "@/lib/db/schema";
import type { ProfileAlias } from "@/lib/member-profiles";
import {
  PROFILE_ALIAS_MAX_FREE,
  PROFILE_ALIAS_MAX_PREMIUM,
} from "@/lib/premium-features";

interface DashboardProfileAliasesProps {
  profile: ProfileRow;
  aliases: ProfileAlias[];
  maxAliases: number;
  hasPremiumAccess: boolean;
}

export default function DashboardProfileAliases({
  profile,
  aliases: initialAliases,
  maxAliases,
  hasPremiumAccess,
}: DashboardProfileAliasesProps) {
  const [aliases, setAliases] = useState<ProfileAlias[]>(initialAliases);
  const [rawSlug, setRawSlug] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ProfileAlias | null>(null);
  const [deleting, setDeleting] = useState(false);

  const atLimit = aliases.length >= maxAliases;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          <span className="text-[var(--terminal)]">$</span> Profile aliases
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Extra URLs like{" "}
          <code className="rounded bg-[var(--surface)] px-1">/{`{alias}`}</code> that show the same
          profile as{" "}
          <code className="rounded bg-[var(--surface)] px-1">/{profile.slug}</code>. Different from{" "}
          <Link href="/dashboard/short" className="text-[var(--accent)] hover:underline">
            short links
          </Link>{" "}
          (those redirect to external sites).
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {hasPremiumAccess ? (
            <>
              Premium: up to {PROFILE_ALIAS_MAX_PREMIUM} aliases ({aliases.length}/{maxAliases} used).
            </>
          ) : (
            <>
              Free: {PROFILE_ALIAS_MAX_FREE} alias ({aliases.length}/{maxAliases} used). Upgrade to
              Premium for {PROFILE_ALIAS_MAX_PREMIUM} slots on the{" "}
              <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
                Premium
              </Link>{" "}
              page.
            </>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--foreground)]">Your aliases</span>
        </div>
        <div className="p-4 space-y-3">
          {aliases.length > 0 && (
            <ul className="space-y-2">
              {aliases.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 px-2 py-2"
                >
                  <Link
                    href={`/${a.slug}`}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    /{a.slug}
                  </Link>
                  <span className="text-[10px] text-[var(--muted)]">→ same as /{profile.slug}</span>
                  <button
                    type="button"
                    onClick={() => setToDelete(a)}
                    className="ml-auto shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--warning)]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-[var(--warning)]">{error}</p>}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">
              New alias slug
              <input
                type="text"
                value={rawSlug}
                onChange={(e) => {
                  setRawSlug(e.target.value);
                  setError(null);
                }}
                placeholder="my-alt-name"
                disabled={atLimit}
                className="mt-0.5 block w-40 rounded border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm disabled:opacity-50"
              />
            </label>
            <button
              type="button"
              disabled={!rawSlug.trim() || adding || atLimit}
              onClick={async () => {
                setError(null);
                setAdding(true);
                const result = await createProfileAliasAction(profile.id, rawSlug.trim());
                setAdding(false);
                if (result.error) {
                  setError(result.error);
                  toast.error(result.error);
                } else if (result.id != null && result.slug != null) {
                  setAliases((prev) => [
                    ...prev,
                    {
                      id: result.id!,
                      slug: result.slug!,
                      createdAt: new Date(),
                    },
                  ]);
                  setRawSlug("");
                  toast.success("Alias added");
                }
              }}
              className="rounded border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add alias"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={toDelete != null}
        title="Remove alias?"
        message={
          toDelete ? `/${toDelete.slug} will no longer open your profile.` : ""
        }
        confirmLabel="Remove"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          if (!toDelete) return;
          setDeleting(true);
          const result = await deleteProfileAliasAction(toDelete.id);
          setDeleting(false);
          if (result.error) {
            setError(result.error);
            toast.error(result.error);
          } else {
            setAliases((prev) => prev.filter((a) => a.id !== toDelete.id));
            setToDelete(null);
            toast.success("Alias removed");
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
