"use client";

import { useState, useCallback } from "react";
import TerminalWindow from "@/app/components/TerminalWindow";
import PasteCreateForm from "@/app/components/PasteCreateForm";
import PasteHistory from "@/app/components/PasteHistory";

interface PasteSectionProps {
  isLoggedIn: boolean;
  /** When false, user cannot create pastes (Premium required). */
  canCreatePaste?: boolean;
}

export default function PasteSection({ isLoggedIn, canCreatePaste = false }: PasteSectionProps) {
  const [editing, setEditing] = useState<{
    slug: string;
    content: string;
    language: string;
  } | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleEdit = useCallback((slug: string, content: string, language: string) => {
    setEditing({ slug, content, language });
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditing(null);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditing(null);
    setHistoryRefresh((n) => n + 1);
  }, []);

  const handleCreated = useCallback(() => {
    setHistoryRefresh((n) => n + 1);
  }, []);

  return (
    <div className="space-y-6">
      <TerminalWindow
        title={editing ? "user@dread:~ — edit paste" : "user@dread:~ — new paste"}
        className="animate-fade-in"
      >
        <div className="space-y-4">
          <PasteCreateForm
            isLoggedIn={isLoggedIn}
            canCreatePaste={canCreatePaste}
            editing={editing}
            onEditCancel={handleEditCancel}
            onEditSuccess={handleEditSuccess}
            onCreated={handleCreated}
          />
        </div>
      </TerminalWindow>

      {isLoggedIn && (
        <TerminalWindow title="user@dread:~ — paste history" className="animate-fade-in">
          <PasteHistory
            isLoggedIn={isLoggedIn}
            onEdit={handleEdit}
            onRefresh={() => setHistoryRefresh((n) => n + 1)}
            refreshTrigger={historyRefresh}
          />
        </TerminalWindow>
      )}
    </div>
  );
}
