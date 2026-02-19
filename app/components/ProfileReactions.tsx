"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = ["👍", "🔥", "❤️", "😂", "🤝"] as const;

interface ProfileReactionsProps {
  slug: string;
  reactions: { emoji: string; count: number }[];
  userReaction: string | null;
  canReact: boolean;
}

export default function ProfileReactions({
  slug,
  reactions: initialReactions,
  userReaction: initialUserReaction,
  canReact,
}: ProfileReactionsProps) {
  const router = useRouter();
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState<string | null>(initialUserReaction);
  const [loading, setLoading] = useState(false);

  const toggleReaction = async (emoji: string) => {
    if (!canReact || loading) return;
    setLoading(true);
    try {
      if (userReaction === emoji) {
        const res = await fetch(`/api/profiles/${encodeURIComponent(slug)}/react`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          setReactions(data.reactions ?? []);
          setUserReaction(null);
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/profiles/${encodeURIComponent(slug)}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        const data = await res.json();
        if (res.ok) {
          setReactions(data.reactions ?? []);
          setUserReaction(data.userReaction ?? null);
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const reactionMap = new Map(reactions.map((r) => [r.emoji, r.count]));
  const hasAny = reactions.length > 0;

  if (!hasAny && !canReact) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {EMOJIS.map((emoji) => {
        const count = reactionMap.get(emoji) ?? 0;
        const isActive = userReaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggleReaction(emoji)}
            disabled={!canReact || loading}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors ${
              isActive
                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                : "bg-[var(--bg)]/50 border border-[var(--border)]/50 text-[var(--foreground)]/80 hover:border-[var(--accent)]/30"
            } ${!canReact ? "cursor-default" : ""}`}
            title={canReact ? (isActive ? "Remove reaction" : `React with ${emoji}`) : undefined}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
