"use client";

import Link from "next/link";
import { Article, PencilSimple, Trash } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import type { BlogPostRow } from "@/lib/db";

const dashIcon = { size: 14, weight: "regular" as const, className: "shrink-0" };

type Props = {
  profileSlug: string;
  initialPosts: BlogPostRow[];
  blogPremiumOnly?: boolean;
  hasPremiumAccess?: boolean;
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export default function DashboardBlog({ profileSlug, initialPosts, blogPremiumOnly = true, hasPremiumAccess = false }: Props) {
  const canCreatePost = !blogPremiumOnly || hasPremiumAccess;
  const [posts, setPosts] = useState<BlogPostRow[]>(initialPosts);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [postToDelete, setPostToDelete] = useState<BlogPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handleCreate = async () => {
    const t = title.trim();
    const c = content.trim();
    if (!c) {
      setError("Content is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileSlug)}/blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t || "Untitled", content: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setPosts((prev) => [data, ...prev]);
      setTitle("");
      setContent("");
      toast.success("Post created");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const t = editTitle.trim();
    const c = editContent.trim();
    if (!c) {
      setError("Content is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileSlug)}/blog/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t || "Untitled", content: c }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setPosts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...data } : p))
      );
      setEditingId(null);
      setEditTitle("");
      setEditContent("");
      toast.success("Post updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/profiles/${encodeURIComponent(profileSlug)}/blog/${postToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="animate-dashboard-panel rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
      <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2 bg-[var(--bg)]/80">
        <span className="text-xs text-[var(--muted)] font-mono inline-flex items-center gap-2">
          <Article {...dashIcon} /> Blog
        </span>
        <Link
          href="/dashboard"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Back to profile
        </Link>
      </div>
      <div className="p-4 space-y-4">
        {/* New post form */}
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)]/40 p-4 space-y-4">
          {!canCreatePost ? (
            <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[var(--muted)]">
              Microblog requires Premium. <Link href="/dashboard/billing" className="text-[var(--accent)] hover:underline">Upgrade</Link> to create posts.
            </div>
          ) : (
          <>
          <p className="text-sm font-medium text-[var(--foreground)]">New post</p>
          {error && <p className="text-xs text-[var(--warning)]">{error}</p>}
          <label className="block text-xs font-medium text-[var(--muted)]">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              maxLength={200}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--muted)]">
            Content <span className="text-[var(--muted)]/80">(Markdown supported)</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write in markdown… **bold**, *italic*, [links](url), `code`, # headers"
              rows={6}
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono resize-y min-h-[120px] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            disabled={!content.trim() || submitting}
            onClick={handleCreate}
            className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
          </>
          )}
        </div>

        {/* Post list */}
        {posts.length > 0 ? (
          <ul className="space-y-3 list-none p-0 m-0">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 overflow-hidden"
              >
                {editingId === post.id ? (
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      maxLength={200}
                      className="block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Content (Markdown)"
                      rows={6}
                      className="block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono resize-y focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUpdate}
                        disabled={submitting || !editContent.trim()}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditTitle("");
                          setEditContent("");
                          setError(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${profileSlug}/blog/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {formatDate(post.createdAt)}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                        {post.content.slice(0, 120)}
                        {post.content.length > 120 ? "…" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(post.id);
                          setEditTitle(post.title);
                          setEditContent(post.content);
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                        aria-label="Edit post"
                      >
                        <PencilSimple size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostToDelete(post)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--warning)]"
                        aria-label="Delete post"
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">No posts yet. Publish your first one above.</p>
        )}
      </div>

      <ConfirmDialog
        open={postToDelete != null}
        title="Delete post?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPostToDelete(null)}
      />
    </section>
  );
}
