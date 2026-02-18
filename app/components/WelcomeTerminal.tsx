"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { PROFILES } from "@/lib/profiles";

const PROMPT = "$";

const DREADFETCH_INFO: Array<{ label: string; value: string }> = [
  { label: "Site", value: SITE_NAME },
  { label: "Tagline", value: SITE_DESCRIPTION },
  { label: "Profiles", value: PROFILES.map((p) => p.name).join(", ") },
  { label: "Theme", value: "terminal cyan" },
  { label: "Status", value: "Ready" },
];

const DREADFETCH_OUTPUT = (
  <div className="min-w-0 space-y-0.5 text-xs sm:text-sm">
    {DREADFETCH_INFO.map(({ label, value }) => (
      <div key={label} className="flex gap-2">
        <span className="shrink-0 text-[var(--accent)] w-20">{label}</span>
        <span className="text-[var(--muted)]">:</span>
        <span className="text-[var(--foreground)]">{value}</span>
      </div>
    ))}
  </div>
);

const INTRO_LINES: Array<{ type: "command" | "output"; content: ReactNode }> = [
  { type: "command", content: "dreadfetch" },
  { type: "output", content: null },
  { type: "output", content: DREADFETCH_OUTPUT },
  { type: "output", content: null },
];

const HELP_LINES = [
  "help — show this message",
  "dreadfetch — show site info",
  "cat intro.txt — show intro",
  ...PROFILES.map((p) => `open ${p.slug} — ${p.name}'s profile`),
  "whoami — current user",
  "ls — list files",
  "clear — clear screen",
];

const HELP_OUTPUT = (
  <span className="block space-y-1">
    <span className="text-[var(--muted)]">Available commands:</span>
    {HELP_LINES.map((line) => (
      <span key={line} className="block text-[var(--foreground)]">
        {line}
      </span>
    ))}
  </span>
);

const INTRO_OUTPUT = (
  <span className="block space-y-1">
    <span className="text-[var(--foreground)]">
      <span className="text-[var(--accent)]">TITLE</span>
      <span className="text-[var(--muted)]">:</span> {SITE_NAME}
    </span>
    <span className="text-[var(--foreground)]">
      <span className="text-[var(--accent)]">TAGLINE</span>
      <span className="text-[var(--muted)]">:</span> {SITE_DESCRIPTION}
    </span>
    <span className="text-[var(--foreground)]">
      <span className="text-[var(--accent)]">PROFILES</span>
      <span className="text-[var(--muted)]">:</span> {PROFILES.map((p) => p.name).join(", ")}
    </span>
  </span>
);

type LineEntry = { type: "command" | "output"; content: ReactNode };

function runCommand(cmd: string): { output: ReactNode; navigate?: string } | null {
  const c = cmd.trim().toLowerCase();
  if (c === "help" || c === "?") return { output: HELP_OUTPUT };
  if (c === "dreadfetch" || c === "fetch") return { output: DREADFETCH_OUTPUT };
  if (c === "cat intro.txt" || c === "cat intro") return { output: INTRO_OUTPUT };
  const profile = PROFILES.find((p) => c === `open ${p.slug}` || c === p.slug);
  if (profile) return { output: `Opening ${profile.name}...`, navigate: `/${profile.slug}` };
  if (c === "whoami") return { output: "guest" };
  if (c === "ls" || c === "ls -la" || c === "ls -l") {
    return {
      output: (
        <span className="text-[var(--foreground)]">
          {[...PROFILES.map((p) => p.slug), "intro.txt", "dreadfetch", "help"].join("  ")}
        </span>
      ),
    };
  }
  if (c === "clear" || c === "cls") return { output: "__clear__" };
  return null;
}

export default function WelcomeTerminal() {
  const router = useRouter();
  const [lines, setLines] = useState<LineEntry[]>(() => [...INTRO_LINES]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const submit = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;

      setHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setInput("");

      setLines((prev) => [...prev, { type: "command", content: cmd }]);

      const result = runCommand(cmd);
      if (result?.output === "__clear__") {
        setLines([]);
        return;
      }
      if (result) {
        setLines((prev) => [...prev, { type: "output", content: result.output }]);
        if (result.navigate) {
          setTimeout(() => router.push(result.navigate!), 400);
        }
        return;
      }

      setLines((prev) => [
        ...prev,
        {
          type: "output",
          content: (
            <span className="text-[var(--warning)]">
              Command not found: {cmd}. Type <span className="text-[var(--accent)]">help</span> for options.
            </span>
          ),
        },
      ]);
    },
    [router]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submit(input);
    },
    [input, submit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const next = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(next);
        setInput(history[next]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (history.length === 0) return;
        const next = historyIndex <= 0 ? -1 : historyIndex - 1;
        setHistoryIndex(next);
        setInput(next === -1 ? "" : history[next]);
      }
    },
    [history, historyIndex]
  );

  return (
    <div className="space-y-1 text-left" onClick={() => inputRef.current?.focus()}>
      <div
        ref={scrollRef}
        className="max-h-[50vh] min-h-[120px] overflow-y-auto overflow-x-hidden pr-2 scroll-smooth"
        tabIndex={-1}
        role="log"
        aria-label="Terminal output"
      >
        {lines.map((line, i) => (
          <div key={i} className="flex flex-col gap-0">
            {line.type === "command" ? (
              <p className="text-[var(--terminal)]">
                <span className="text-[var(--muted)]">{PROMPT}</span> {line.content}
              </p>
            ) : line.content === null ? (
              <div className="h-3" aria-hidden />
            ) : (
              <div className="text-[var(--foreground)]">{line.content}</div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-[var(--muted)] shrink-0">{PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-0 font-mono text-sm text-[var(--terminal)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0"
          placeholder="enter command..."
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span
          className="cursor-blink inline-block h-4 w-2 shrink-0 bg-[var(--terminal)] font-bold text-[var(--bg)]"
          aria-hidden
        >
          _
        </span>
      </form>
    </div>
  );
}
