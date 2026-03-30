import type { ReactNode } from "react";

/**
 * Root layout: required by Next.js. All UI (including `<html>`) lives under `app/[locale]/layout.tsx`
 * so the document `lang` matches the active locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
