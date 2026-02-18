interface ProfileQuoteProps {
  quote: string;
}

export default function ProfileQuote({ quote }: ProfileQuoteProps) {
  return (
    <blockquote className="mt-2 rounded-r-md border-l-2 border-[var(--accent)] bg-[var(--bg)]/50 py-2 pl-3 pr-2 text-sm italic text-[var(--muted)] transition-colors hover:text-[var(--foreground)]/90">
      <span className="text-[var(--accent)]/60 select-none" aria-hidden>
        "
      </span>
      {quote}
      <span className="text-[var(--accent)]/60 select-none" aria-hidden>
        "
      </span>
    </blockquote>
  );
}
