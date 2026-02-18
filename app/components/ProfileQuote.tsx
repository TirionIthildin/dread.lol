interface ProfileQuoteProps {
  quote: string;
}

export default function ProfileQuote({ quote }: ProfileQuoteProps) {
  return (
    <blockquote className="mt-4 border-l-2 border-[var(--accent)]/50 pl-4 text-sm italic text-[var(--muted)]">
      {quote}
    </blockquote>
  );
}
