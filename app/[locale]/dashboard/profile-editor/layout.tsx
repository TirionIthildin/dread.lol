"use client";

import type { ReactNode } from "react";
import { ProfileEditorSectionProvider } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorSectionContext";
import { ProfileEditorSectionRail } from "@/app/[locale]/dashboard/profile-editor/ProfileEditorSectionRail";

export default function ProfileEditorRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileEditorSectionProvider>
      <div className="flex min-h-0 flex-1 flex-col md:h-full md:flex-row">
        <aside
          id="profile-editor-section-nav"
          tabIndex={-1}
          className="sticky top-0 z-40 hidden h-auto min-h-0 shrink-0 flex-col border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl font-mono outline-none md:flex md:w-56 md:border-b-0 md:border-r lg:w-64 md:max-h-[calc(100dvh-1rem)]"
        >
          <ProfileEditorSectionRail />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ProfileEditorSectionProvider>
  );
}
