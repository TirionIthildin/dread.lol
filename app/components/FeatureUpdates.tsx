"use client";

import TerminalWindow from "@/app/components/TerminalWindow";
import { FEATURE_UPDATES } from "@/lib/updates";

export default function FeatureUpdates() {
  return (
    <TerminalWindow title="user@dread:~ — updates" className="animate-fade-in">
      <div className="space-y-3">
        <p className="text-xs text-[var(--muted)] uppercase tracking-wider">
          Recent updates
        </p>
        <ul className="space-y-2.5">
          {FEATURE_UPDATES.map((update, i) => (
            <li key={i} className="border-l-2 border-[var(--accent)]/40 pl-3">
              <span className="text-[10px] font-mono text-[var(--muted)]">
                [{update.date}]
              </span>{" "}
              <span className="text-sm font-medium text-[var(--foreground)]">
                {update.title}
              </span>
              {update.description && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {update.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </TerminalWindow>
  );
}
