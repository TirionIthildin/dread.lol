import Link from "next/link";
import DocsNav from "./DocsNav";

export default function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start">
      <DocsNav />
      <div className="flex-1 min-w-0 w-full">
        <p className="text-xs text-[var(--muted)] mb-4 font-mono">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Home
          </Link>
          <span className="mx-2 opacity-50">·</span>
          <Link href="/about" className="text-[var(--accent)] hover:underline">
            About
          </Link>
        </p>
        {children}
      </div>
    </div>
  );
}
