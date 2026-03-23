import type { FeatureUpdate } from "@/lib/updates";

export function FeatureUpdateList({ updates }: { updates: readonly FeatureUpdate[] }) {
  return (
    <ul className="space-y-2.5 list-none p-0 m-0">
      {updates.map((update, i) => (
        <li key={i} className="border-l-2 border-[var(--accent)]/40 pl-3">
          <span className="text-[10px] font-mono text-[var(--muted)]">[{update.date}]</span>{" "}
          <span className="text-sm font-medium text-[var(--foreground)]">{update.title}</span>
          {update.description && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{update.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
