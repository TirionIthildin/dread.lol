"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export type SearchableSelectOption = { value: string; label: string };

export type SearchableSelectGroup = {
  label: string;
  options: SearchableSelectOption[];
};

type Props = {
  /** For form submission — renders a hidden input with this name */
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  /** Flat list of options (use when no groups) */
  options?: SearchableSelectOption[];
  /** Grouped options (overrides options when both provided) */
  groups?: SearchableSelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Minimum options to show search (default 6) */
  searchThreshold?: number;
  className?: string;
  /** Render option label differently (e.g. with icon) */
  renderOption?: (opt: SearchableSelectOption) => React.ReactNode;
  /** Optional label for sr-only / aria */
  ariaLabel?: string;
};

function flattenGroups(groups: SearchableSelectGroup[]): SearchableSelectOption[] {
  return groups.flatMap((g) => g.options);
}

function flattenWithGroupLabels(
  groups: SearchableSelectGroup[]
): { opt: SearchableSelectOption; groupLabel?: string }[] {
  return groups.flatMap((g) => g.options.map((opt) => ({ opt, groupLabel: g.label })));
}

export default function SearchableSelect({
  name,
  value: controlledValue,
  onChange,
  defaultValue = "",
  options: flatOptions = [],
  groups,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  searchThreshold = 6,
  className = "",
  renderOption,
  ariaLabel,
}: Props) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  const opts = groups ? flattenGroups(groups) : flatOptions;
  const withGroups = groups ? flattenWithGroupLabels(groups) : flatOptions.map((opt) => ({ opt, groupLabel: undefined }));
  const totalCount = opts.length;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const updateValue = useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v);
      onChange?.(v);
      setOpen(false);
      setQuery("");
      setHighlightIndex(0);
    },
    [isControlled, onChange]
  );

  const filtered = useCallback(() => {
    if (!query.trim()) return withGroups;
    const q = query.toLowerCase().trim();
    return withGroups.filter(
      ({ opt }) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [withGroups, query]);

  const filteredList = filtered();
  const showSearch = totalCount >= searchThreshold;

  useEffect(() => {
    if (!open) return;
    setHighlightIndex(0);
    if (showSearch) {
      inputRef.current?.focus();
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filteredList.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filteredList[highlightIndex]) {
        e.preventDefault();
        updateValue(filteredList[highlightIndex].opt.value);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, filteredList, highlightIndex, updateValue]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [open, highlightIndex, filteredList.length]);

  const selected = opts.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const baseInputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 text-left ${baseInputClass} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        id={name ? `${name}-trigger` : undefined}
      >
        <span className={selected ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {renderOption && selected ? renderOption(selected) : displayLabel}
        </span>
        <span
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)]/80 py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  aria-label="Filter options"
                />
              </div>
            </div>
          )}
          <ul
            ref={listRef}
            className="max-h-[220px] overflow-y-auto py-1"
            role="listbox"
          >
            {filteredList.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">No matches</li>
            ) : (
              filteredList.map(({ opt, groupLabel }, idx) => (
                <li key={opt.value}>
                  {groupLabel &&
                    idx > 0 &&
                    filteredList[idx - 1].groupLabel !== groupLabel && (
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] border-t border-[var(--border)] mt-1 pt-1">
                        {groupLabel}
                      </div>
                    )}
                  {groupLabel &&
                    idx === 0 && (
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        {groupLabel}
                      </div>
                    )}
                  <button
                    type="button"
                    onClick={() => updateValue(opt.value)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      opt.value === value
                        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                    } ${idx === highlightIndex ? "bg-[var(--surface-hover)]" : ""}`}
                    role="option"
                    aria-selected={opt.value === value}
                  >
                    {renderOption ? renderOption(opt) : opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
