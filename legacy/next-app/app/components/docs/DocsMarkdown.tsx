import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const SAFE_PROTOCOLS = ["https:", "http:", "mailto:"];

function isInternal(href: string | undefined | null): boolean {
  if (!href) return false;
  return href.startsWith("/") && !href.startsWith("//");
}

function isSafeExternal(href: string): boolean {
  try {
    const u = new URL(href, "https://dread.lol");
    return SAFE_PROTOCOLS.includes(u.protocol);
  } catch {
    return false;
  }
}

const components = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-3 last:mb-0 text-sm leading-relaxed text-[var(--muted)]">{children}</p>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (isInternal(href)) {
      return (
        <Link href={href!} className="text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent-dim)]">
          {children}
        </Link>
      );
    }
    const safe = href && isSafeExternal(href);
    return (
      <a
        href={safe ? href : undefined}
        target={safe ? "_blank" : undefined}
        rel={safe ? "noopener noreferrer" : undefined}
        className="text-[var(--accent)] underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1.5 text-sm text-[var(--muted)]">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm text-[var(--muted)]">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
  code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
    const inline = !className;
    if (inline) {
      return (
        <code
          className="rounded bg-[var(--bg)]/90 px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--terminal)]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="block rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 p-3 text-xs font-mono text-[var(--foreground)] overflow-x-auto"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-2 border-[var(--accent)]/40 pl-4 my-3 text-sm text-[var(--muted)]">{children}</blockquote>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-lg font-semibold text-[var(--foreground)] mt-8 mb-3 first:mt-0 scroll-mt-24">{children}</h2>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-base font-semibold text-[var(--foreground)] mt-6 mb-2 scroll-mt-24">{children}</h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="text-sm font-semibold text-[var(--foreground)] mt-4 mb-2 scroll-mt-24">{children}</h4>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-left text-sm text-[var(--muted)]">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead className="bg-[var(--surface-hover)] text-[var(--foreground)]">{children}</thead>,
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border-b border-[var(--border)] px-3 py-2 font-medium">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => <td className="border-b border-[var(--border)] px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-6 border-[var(--border)]" />,
};

interface DocsMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders trusted documentation markdown (from the repo). Sanitized for safe HTML.
 */
export default function DocsMarkdown({ content, className = "" }: DocsMarkdownProps) {
  if (!content?.trim()) return null;
  return (
    <div className={`docs-markdown ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
