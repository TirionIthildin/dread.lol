import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaste } from "@/lib/paste";
import { SITE_URL } from "@/lib/site";
import PasteView from "@/app/components/PasteView";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const paste = await getPaste(id);
  if (!paste) return { title: "Not found" };
  const preview = paste.content.slice(0, 120).replace(/\n/g, " ");
  return {
    title: "Paste",
    description: preview ? `${preview}…` : "Shared paste",
    alternates: { canonical: `${SITE_URL}/p/${id}` },
    robots: { index: false, follow: true },
  };
}

export default async function PasteViewPage({ params }: Props) {
  const { id } = await params;
  const paste = await getPaste(id);
  if (!paste) notFound();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            <span className="text-[var(--terminal)]">$</span> cat p/{id}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {paste.authorSlug || paste.authorName ? (
              <>
                by{" "}
                {paste.authorSlug ? (
                  <Link
                    href={`/${paste.authorSlug}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {paste.authorName || paste.authorSlug}
                  </Link>
                ) : (
                  <span>{paste.authorName}</span>
                )}
                {" · "}
              </>
            ) : null}
            {paste.language && (
              <>
                <span className="text-[var(--accent)]">{paste.language}</span>
                {" · "}
              </>
            )}
            {paste.createdAt.toLocaleDateString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Link
          href="/dashboard/paste"
          className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <span className="text-[var(--terminal)]">$</span> new paste
        </Link>
      </div>

      <PasteView
        content={paste.content}
        language={paste.language}
        slug={id}
      />

      <footer className="text-center">
        <Link
          href="/dashboard/paste"
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <span className="text-[var(--terminal)]">$</span> new paste
        </Link>
      </footer>
    </div>
  );
}
