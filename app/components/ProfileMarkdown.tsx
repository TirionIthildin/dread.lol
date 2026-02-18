"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const baseClass = "profile-markdown";

const components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent)]/90"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ className, children, ...props }) => {
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
  pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--accent)]/50 pl-3 my-2 text-[var(--muted)]">{children}</blockquote>
  ),
  h1: ({ children }) => <h2 className="text-base font-semibold text-[var(--foreground)] mt-3 mb-1 first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="text-sm font-semibold text-[var(--foreground)] mt-2 mb-1">{children}</h3>,
  h3: ({ children }) => <h4 className="text-sm font-medium text-[var(--foreground)] mt-2 mb-1">{children}</h4>,
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
    ? { ...components, p: ({ children }) => <span className="inline">{children}</span> }
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
