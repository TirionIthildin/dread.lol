"use client";

import { useState, useEffect } from "react";
import { Heart } from "@phosphor-icons/react";

interface Props {
  templateId: string;
  initialFavorited?: boolean;
  showCount?: boolean;
  favoriteCount?: number;
  className?: string;
}

export default function MarketplaceFavoriteButton({
  templateId,
  initialFavorited = false,
  showCount = false,
  favoriteCount: initialCount = 0,
  className = "",
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function toggle() {
    setLoading(true);
    try {
      if (favorited) {
        const res = await fetch("/api/marketplace/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        if (res.ok) {
          setFavorited(false);
          setCount((c) => Math.max(0, c - 1));
        }
      } else {
        const res = await fetch("/api/marketplace/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        if (res.ok) {
          setFavorited(true);
          setCount((c) => c + 1);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`inline-flex items-center gap-1.5 text-xs disabled:opacity-50 ${className}`}
    >
      <Heart
        size={16}
        weight={favorited ? "fill" : "regular"}
        className={favorited ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}
      />
      {showCount && count > 0 && <span className="text-[var(--muted)]">{count}</span>}
    </button>
  );
}
