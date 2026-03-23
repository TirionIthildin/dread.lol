import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import TerminalWindow from "@/app/components/TerminalWindow";
import { SITE_NAME, SITE_URL } from "@/lib/site";

function statusUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_STATUS_URL?.trim();
  return u && u.startsWith("http") ? u : null;
}

export const metadata: Metadata = {
  title: `Status — ${SITE_NAME}`,
  description: `Service status for ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/status` },
};

export default function StatusPage() {
  const external = statusUrl();
  if (external) {
    redirect(external);
  }

  const note = process.env.NEXT_PUBLIC_STATUS_NOTE?.trim() || null;

  return (
    <div className="w-full max-w-lg px-2 py-4">
      <p className="mb-4 text-center text-[11px] text-[var(--muted)]">
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Home
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/changelog" className="text-[var(--accent)] hover:underline">
          Changelog
        </Link>
      </p>
      <TerminalWindow title="user@dread:~ — status" className="animate-fade-in">
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--accent)]">Operational</p>
          <p className="text-sm text-[var(--foreground)]">
            Core services are running normally. For detailed uptime, set{" "}
            <code className="text-[11px] text-[var(--muted)]">NEXT_PUBLIC_STATUS_URL</code> to your
            public status page (optional); that URL is used to redirect{" "}
            <span className="font-mono text-[11px]">/status</span>.
          </p>
          {note && <p className="text-xs text-[var(--muted)]">{note}</p>}
        </div>
      </TerminalWindow>
    </div>
  );
}
