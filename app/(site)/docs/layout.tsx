import DocsShell from "@/app/components/docs/DocsShell";

export default function DocsSectionLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
