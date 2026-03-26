"use client";

import type { ProfileRow } from "@/lib/db/schema";

export interface TerminalSectionProps {
  visible: boolean;
  profile: ProfileRow;
  terminalCommandEntries: { command: string; output: string }[];
  setTerminalCommandEntries: React.Dispatch<
    React.SetStateAction<{ command: string; output: string }[]>
  >;
}

export function TerminalSection({
  visible,
  profile,
  terminalCommandEntries,
  setTerminalCommandEntries,
}: TerminalSectionProps) {
  return (
    <div className={visible ? "block space-y-3" : "hidden"}>
      <p className="text-xs font-medium text-[var(--muted)] mb-1">
        Show your profile as a terminal with custom commands (like the homepage)
      </p>
      <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          name="useTerminalLayout"
          defaultChecked={profile.useTerminalLayout ?? false}
          className="rounded border-[var(--border)]"
        />
        Enable terminal commands
      </label>
      <label className="block text-xs font-medium text-[var(--muted)]">
        Window title
        <input
          type="text"
          name="terminalTitle"
          defaultValue={profile.terminalTitle ?? ""}
          placeholder="user@slug:~"
          maxLength={80}
          className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
        />
      </label>
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--muted)]">Custom commands (command → output). Output supports Markdown.</p>
        {terminalCommandEntries.map((entry, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--bg)]/60 p-2">
            <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
              Command
              <input
                type="text"
                value={entry.command}
                onChange={(e) =>
                  setTerminalCommandEntries((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, command: e.target.value } : p))
                  )
                }
                placeholder="cat intro.txt"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm font-mono focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
              Output
              <input
                type="text"
                value={entry.output}
                onChange={(e) =>
                  setTerminalCommandEntries((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, output: e.target.value } : p))
                  )
                }
                placeholder="Hello, I'm …"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </label>
            <button
              type="button"
              onClick={() => setTerminalCommandEntries((prev) => prev.filter((_, i) => i !== index))}
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--warning)]"
              aria-label="Remove command"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTerminalCommandEntries((prev) => [...prev, { command: "", output: "" }])}
          className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          + Add command
        </button>
      </div>
    </div>
  );
}
