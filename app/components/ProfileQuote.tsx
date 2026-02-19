import ProfileMarkdown from "@/app/components/ProfileMarkdown";

interface ProfileQuoteProps {
  quote: string;
}

export default function ProfileQuote({ quote }: ProfileQuoteProps) {
  return (
    <blockquote className="mt-3 rounded-r-lg border-l-2 border-[var(--accent)] bg-[var(--bg)]/40 py-2.5 pl-4 pr-3 text-sm italic text-[var(--muted)] transition-colors hover:text-[var(--foreground)]/90 hover:bg-[var(--bg)]/60">
      <span className="text-[var(--accent)]/70 select-none text-base leading-none" aria-hidden>
        &ldquo;
      </span>
      <ProfileMarkdown content={quote} inline />
      <span className="text-[var(--accent)]/70 select-none text-base leading-none" aria-hidden>
        &rdquo;
      </span>
    </blockquote>
  );
}
