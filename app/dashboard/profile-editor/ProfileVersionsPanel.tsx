"use client";

import { useCallback, useState } from "react";
import { FloppyDisk, ArrowCounterClockwise, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  saveProfileVersionAction,
  restoreProfileVersionAction,
  deleteProfileVersionAction,
} from "@/app/dashboard/actions";
import type { ProfileVersionRow } from "@/lib/profile-versions";

export function ProfileVersionsPanel({
  profileId,
  versions,
  onSaved,
  onRestored,
  onDeleted,
}: {
  profileId: string;
  versions: ProfileVersionRow[];
  onSaved: () => void;
  onRestored: () => void;
  onDeleted: () => void;
}) {
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = useCallback(async () => {
    const name = saveName.trim();
    if (!name) {
      setSaveError("Enter a name for this version");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const result = await saveProfileVersionAction(profileId, name);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveName("");
        toast.success("Version saved");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }, [profileId, saveName, onSaved]);

  const handleRestore = useCallback(async () => {
    if (!restoreId) return;
    setRestoring(true);
    try {
      const result = await restoreProfileVersionAction(restoreId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile restored");
        setRestoreId(null);
        onRestored();
      }
    } finally {
      setRestoring(false);
    }
  }, [restoreId, onRestored]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const result = await deleteProfileVersionAction(deleteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Version deleted");
        setDeleteId(null);
        onDeleted();
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteId, onDeleted]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value.slice(0, 80))}
          placeholder="e.g. Summer 2025"
          maxLength={80}
          className="flex-1 min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <FloppyDisk size={16} weight="regular" />
          {saving ? "Saving…" : "Save current"}
        </button>
      </div>
      {saveError && <p className="text-xs text-[var(--warning)]">{saveError}</p>}
      {versions.length > 0 ? (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-[var(--foreground)] truncate block">{v.name}</span>
                <span className="text-[10px] text-[var(--muted)]">
                  {new Date(v.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setRestoreId(v.id)}
                  className="rounded p-2 text-[var(--muted)] hover:bg-[var(--accent)]/15 hover:text-[var(--accent)] transition-colors"
                  title="Restore"
                  aria-label={`Restore ${v.name}`}
                >
                  <ArrowCounterClockwise size={16} weight="regular" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(v.id)}
                  className="rounded p-2 text-[var(--muted)] hover:bg-[var(--warning)]/15 hover:text-[var(--warning)] transition-colors"
                  title="Delete"
                  aria-label={`Delete ${v.name}`}
                >
                  <Trash size={16} weight="regular" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--muted)]">No saved versions yet. Save your current profile above.</p>
      )}

      <ConfirmDialog
        open={restoreId !== null}
        title="Restore this version?"
        message="Your current profile will be replaced. Make sure to save any unsaved changes in the Editor first."
        confirmLabel="Restore"
        variant="default"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this version?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
