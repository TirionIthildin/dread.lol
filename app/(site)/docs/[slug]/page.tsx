import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DocsMarkdown from "@/app/components/docs/DocsMarkdown";
import { loadSiteDoc } from "@/lib/load-site-doc";
import { getSiteDocMeta, getSiteDocPageSlugs } from "@/lib/site-docs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getSiteDocPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = getSiteDocMeta(slug);
  if (!meta) return { title: "Documentation" };
  return {
    title: meta.title,
    description: meta.description,
    robots: "index, follow",
  };
}

export default async function SiteDocPage({ params }: Props) {
  const { slug } = await params;
  const raw = loadSiteDoc(slug);
  if (!raw) notFound();
  const meta = getSiteDocMeta(slug);

  return (
    <article>
      <header className="mb-6 pb-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">{meta?.title ?? slug}</h1>
        {meta?.description ? <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">{meta.description}</p> : null}
      </header>
      <DocsMarkdown content={raw} />
    </article>
  );
}
