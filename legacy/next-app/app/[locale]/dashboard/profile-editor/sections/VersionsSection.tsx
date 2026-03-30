"use client";

import { History } from "lucide-react";
import { ProfileVersionsPanel } from "../ProfileVersionsPanel";
import type { ProfileRow } from "@/lib/db/schema";
import type { ProfileVersionRow } from "@/lib/profile-versions";

export interface VersionsSectionProps {
  visible: boolean;
  profile: ProfileRow;
  versions: ProfileVersionRow[];
  onSaved: () => void;
  onRestored: () => void;
  onDeleted: () => void;
}

export function VersionsSection({ visible, profile, versions, onSaved, onRestored, onDeleted }: VersionsSectionProps) {
  return (
    <div className={visible ? "block space-y-4" : "hidden"}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
        <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center gap-2">
          <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
            <History size={18} strokeWidth={1.5} className="text-[var(--accent)]" aria-hidden />
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Save & restore</span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-[var(--muted)]">
            Save up to 5 snapshots of your profile (including gallery and short links). Each version keeps its own copy of uploaded files.
          </p>
          <ProfileVersionsPanel
            profileId={profile.id}
            versions={versions}
            onSaved={onSaved}
            onRestored={onRestored}
            onDeleted={onDeleted}
          />
        </div>
      </div>
    </div>
  );
}
