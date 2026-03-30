"use client";

import { useState, useRef, useEffect } from "react";
import ProfileMarkdown from "@/app/components/ProfileMarkdown";

type CommandLine = { command: string; output: string };

interface ProfileCommandBarProps {
  prompt: string;
  commands: { command: string; output: string }[];
  className?: string;
}

export default function ProfileCommandBar({ prompt, commands, className = "" }: ProfileCommandBarProps) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<CommandLine[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    if (cmd === "help") {
      const helpOutput =
        commands.length > 0
          ? "Available commands:\n" + commands.map((c) => `  ${c.command}`).join("\n") + "\n\nhelp — list commands\nclear — clear output"
          : "No custom commands configured.\n\nhelp — list commands\nclear — clear output";
      setLines((prev) => [...prev, { command: cmd, output: helpOutput }]);
      setInput("");
      return;
    }

    const match = commands.find((c) => c.command.trim().toLowerCase() === cmd.toLowerCase());
    const output = match ? match.output : `Command not found: ${cmd}. Type \`help\` for available commands.`;
    setLines((prev) => [...prev, { command: cmd, output }]);
    setInput("");
  };

  useEffect(() => {
    if (lines.length && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input);
    }
  };

  return (
    <div className={`border-t border-[var(--border)] bg-[var(--bg)]/90 ${className}`}>
      {lines.length > 0 && (
        <div
          ref={scrollRef}
          className="max-h-48 overflow-y-auto px-3 py-2 font-mono text-sm space-y-1 border-b border-[var(--border)]/50"
        >
          {lines.map((line, i) => (
            <div key={i} className="flex flex-col gap-0">
              <p className="text-[var(--terminal)]">
                <span className="text-[var(--muted)]">{prompt}</span> {line.command}
              </p>
              <div className="text-[var(--foreground)] text-sm pl-0">
                <ProfileMarkdown content={line.output} />
              </div>
            </div>
          ))}
        </div>
      )}
      <label className="flex items-center gap-1.5 px-3 py-2.5 font-mono text-sm">
        <span className="text-[var(--muted)] shrink-0">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="run a command..."
          className="flex-1 min-w-0 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/70 focus:outline-none"
          spellCheck={false}
          autoComplete="off"
          aria-label="Command input"
        />
      </label>
    </div>
  );
}
