"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  addShortLinkAction,
  deleteShortLinkAction,
} from "@/app/dashboard/actions";
import type { ProfileRow } from "@/lib/db/schema";
import type { ProfileShortLink } from "@/lib/member-profiles";

interface DashboardShortLinksProps {
  profile: ProfileRow;
  shortLinks: ProfileShortLink[];
}

export default function DashboardShortLinks({
  profile,
  shortLinks: initialShortLinks,
}: DashboardShortLinksProps) {
  const [shortLinks, setShortLinks] = useState<ProfileShortLink[]>(initialShortLinks);
  const [shortLinkSlug, setShortLinkSlug] = useState("");
  const [shortLinkUrl, setShortLinkUrl] = useState("");
  const [shortLinkAdding, setShortLinkAdding] = useState(false);
  const [shortLinkError, setShortLinkError] = useState<string | null>(null);
  const [shortLinkToDelete, setShortLinkToDelete] = useState<ProfileShortLink | null>(null);
  const [shortLinkDeleting, setShortLinkDeleting] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          <span className="text-[var(--terminal)]">$</span> Short links
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Create short redirect URLs like{" "}
          <code className="rounded bg-[var(--surface)] px-1">
            /{profile.slug}/twitch
          </code>{" "}
          → your Twitch. These appear on your{" "}
          <Link
            href={`/${profile.slug}`}
            className="text-[var(--accent)] hover:underline"
          >
            public profile
          </Link>
          .
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Short links
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[10px] text-[var(--muted)]">
            <code className="rounded bg-[var(--bg)]/80 px-1">
              /{profile.slug}/SLUG
            </code>{" "}
            will redirect to a URL you set (e.g.{" "}
            <code className="rounded bg-[var(--bg)]/80 px-1">twitch</code> → your
            Twitch).
          </p>
          {shortLinks.length > 0 && (
            <ul className="space-y-2">
              {shortLinks.map((link) => (
                <li
                  key={link.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 px-2 py-2"
                >
                  <code className="text-xs text-[var(--accent)]">
                    /{profile.slug}/{link.slug}
                  </code>
                  <span className="text-[10px] text-[var(--muted)]">→</span>
                  <span
                    className="text-xs text-[var(--muted)] truncate max-w-[180px]"
                    title={link.url}
                  >
                    {link.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShortLinkToDelete(link)}
                    className="ml-auto shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--warning)]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shortLinkError && (
            <p className="text-xs text-[var(--warning)]">{shortLinkError}</p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">
              Slug
              <input
                type="text"
                value={shortLinkSlug}
                onChange={(e) => {
                  setShortLinkSlug(e.target.value);
                  setShortLinkError(null);
                }}
                placeholder="twitch"
                className="mt-0.5 block w-24 rounded border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
              URL
              <input
                type="url"
                value={shortLinkUrl}
                onChange={(e) => {
                  setShortLinkUrl(e.target.value);
                  setShortLinkError(null);
                }}
                placeholder="https://…"
                className="mt-0.5 block w-full rounded border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={
                !shortLinkSlug.trim() || !shortLinkUrl.trim() || shortLinkAdding
              }
              onClick={async () => {
                setShortLinkError(null);
                setShortLinkAdding(true);
                const result = await addShortLinkAction(profile.id, {
                  slug: shortLinkSlug.trim(),
                  url: shortLinkUrl.trim(),
                });
                setShortLinkAdding(false);
                if (result.error) setShortLinkError(result.error);
                else if (
                  result.id != null &&
                  result.slug != null &&
                  result.url != null
                ) {
                  setShortLinks((prev) => [
                    ...prev,
                    {
                      id: result.id!,
                      slug: result.slug!,
                      url: result.url!,
                    },
                  ]);
                  setShortLinkSlug("");
                  setShortLinkUrl("");
                  toast.success("Short link added");
                }
              }}
              className="rounded border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              {shortLinkAdding ? "Adding…" : "Add short link"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={shortLinkToDelete != null}
        title="Remove short link?"
        message={
          shortLinkToDelete
            ? `/${profile.slug}/${shortLinkToDelete.slug} will no longer redirect.`
            : ""
        }
        confirmLabel="Remove"
        variant="danger"
        loading={shortLinkDeleting}
        onConfirm={async () => {
          if (!shortLinkToDelete) return;
          setShortLinkDeleting(true);
          const result = await deleteShortLinkAction(shortLinkToDelete.id);
          setShortLinkDeleting(false);
          if (result.error) {
            setShortLinkError(result.error);
            toast.error(result.error);
          } else {
            setShortLinks((prev) =>
              prev.filter((l) => l.id !== shortLinkToDelete.id)
            );
            setShortLinkToDelete(null);
            toast.success("Short link removed");
          }
        }}
        onCancel={() => setShortLinkToDelete(null)}
      />
    </div>
  );
}
