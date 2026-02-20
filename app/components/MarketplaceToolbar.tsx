"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, SortAscending } from "@phosphor-icons/react";
import { useCallback, useTransition } from "react";

const iconProps = { size: 16, weight: "regular" as const, className: "shrink-0" };

export default function MarketplaceToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "applied";

  const setParams = useCallback(
    (updates: { q?: string; sort?: string }) => {
      const next = new URLSearchParams(searchParams);
      if (updates.q !== undefined) {
        if (updates.q) next.set("q", updates.q);
        else next.delete("q");
      }
      if (updates.sort !== undefined) {
        if (updates.sort && updates.sort !== "applied") next.set("sort", updates.sort);
        else next.delete("sort");
      }
      startTransition(() => {
        router.push(`/marketplace?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.querySelector<HTMLInputElement>('input[name="q"]');
          setParams({ q: input?.value?.trim() ?? "" });
        }}
        className="flex items-center gap-2 flex-1 min-w-[140px]"
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            {...iconProps}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            key={q}
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search templates…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 pl-8 pr-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]"
        >
          Search
        </button>
      </form>
      <div className="flex items-center gap-2">
        <SortAscending {...iconProps} className="text-[var(--muted)]" />
        <select
          value={sort}
          onChange={(e) => setParams({ sort: e.target.value })}
          aria-label="Sort by"
          disabled={isPending}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-2 py-1.5 text-sm text-[var(--foreground)]"
        >
          <option value="applied">Most applied</option>
          <option value="recent">Newest</option>
        </select>
      </div>
    </div>
  );
}
