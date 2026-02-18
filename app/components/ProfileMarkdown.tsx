"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const baseClass = "profile-markdown";

const SAFE_LINK_PROTOCOLS = ["https:", "http:"];

function isSafeHref(href: string | undefined | null): boolean {
  if (!href || typeof href !== "string") return false;
  try {
    const protocol = new URL(href, "https://dread.lol").protocol.toLowerCase();
    return SAFE_LINK_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
}

const components = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const safe = isSafeHref(href);
    return (
      <a
        href={safe ? href : "#"}
        target={safe ? "_blank" : undefined}
        rel={safe ? "noopener noreferrer" : undefined}
        className="text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent)]/90"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em>{children}</em>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
  code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-[var(--bg)]/80 px-1 py-0.5 text-[var(--accent)] font-mono text-[0.9em]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="block rounded-lg bg-[var(--bg)]/80 p-3 overflow-x-auto text-sm font-mono text-[var(--foreground)]" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-2 border-[var(--accent)]/50 pl-3 my-2 text-[var(--muted)]">{children}</blockquote>
  ),
  h1: ({ children }: { children?: ReactNode }) => <h2 className="text-base font-semibold text-[var(--foreground)] mt-3 mb-1 first:mt-0">{children}</h2>,
  h2: ({ children }: { children?: ReactNode }) => <h3 className="text-sm font-semibold text-[var(--foreground)] mt-2 mb-1">{children}</h3>,
  h3: ({ children }: { children?: ReactNode }) => <h4 className="text-sm font-medium text-[var(--foreground)] mt-2 mb-1">{children}</h4>,
};

interface ProfileMarkdownProps {
  content: string;
  className?: string;
  /** When true, avoid block-level spacing (for single-line use like status/quote). */
  inline?: boolean;
}

export default function ProfileMarkdown({ content, className = "", inline = false }: ProfileMarkdownProps) {
  if (!content?.trim()) return null;

  const wrapClass = `${baseClass} ${className}`.trim();
  const resolvedComponents = inline
    ? { ...components, p: ({ children }: { children?: ReactNode }) => <span className="inline">{children}</span> }
    : components;

  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={inline ? `${wrapClass} inline` : wrapClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={resolvedComponents}>
        {content.trim()}
      </ReactMarkdown>
    </Wrapper>
  );
}
