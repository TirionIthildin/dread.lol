"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { EditorSectionId } from "@/app/[locale]/dashboard/profile-editor/types";

type ProfileEditorSectionContextValue = {
  activeEditorSection: EditorSectionId;
  setActiveEditorSection: Dispatch<SetStateAction<EditorSectionId>>;
};

export const ProfileEditorSectionContext = createContext<ProfileEditorSectionContextValue | null>(null);

export function ProfileEditorSectionProvider({ children }: { children: ReactNode }) {
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>("basics");
  return (
    <ProfileEditorSectionContext.Provider value={{ activeEditorSection, setActiveEditorSection }}>
      {children}
    </ProfileEditorSectionContext.Provider>
  );
}

export function useProfileEditorSection(): ProfileEditorSectionContextValue {
  const ctx = useContext(ProfileEditorSectionContext);
  if (!ctx) {
    throw new Error("useProfileEditorSection must be used within ProfileEditorSectionProvider");
  }
  return ctx;
}
