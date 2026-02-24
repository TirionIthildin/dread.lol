"use client";

import { DotsSix } from "@phosphor-icons/react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import { DiscordSingleWidget } from "@/app/components/DiscordWidgetsDisplay";
import { RobloxSingleWidget } from "@/app/components/RobloxWidgetsDisplay";
import { parseDiscordWidgetOrder } from "@/app/components/DiscordWidgetsDisplay";

function parseRobloxOrder(raw: string | undefined): string[] {
  const ROBLOX_ORDER = ["accountAge", "profile"] as const;
  if (!raw?.trim()) return [...ROBLOX_ORDER];
  const map: Record<string, string> = {
    accountage: "accountAge",
    profile: "profile",
  };
  return raw
    .split(",")
    .map((s) => map[s.trim().toLowerCase()])
    .filter(Boolean);
}

function SortableWidget({
  id,
  prefix,
  children,
}: {
  id: string;
  prefix: string;
  children: React.ReactNode;
}) {
  const sortableId = `${prefix}-${id}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg ${isDragging ? "opacity-70 z-50 ring-2 ring-[var(--accent)]/50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 z-10 p-1.5 rounded cursor-grab active:cursor-grabbing touch-none text-[var(--muted)] hover:text-[var(--foreground)] opacity-50 hover:opacity-100 bg-[var(--surface)]/80 hover:bg-[var(--surface)] transition-colors"
        aria-label="Drag to reorder"
      >
        <DotsSix size={14} weight="bold" />
      </div>
      <div>{children}</div>
    </div>
  );
}

interface SortableDiscordWidgetsGridProps {
  data: import("@/lib/discord-widgets").DiscordWidgetData;
  matchAccent?: boolean;
  orderFromCsv?: string;
}

export function SortableDiscordWidgetsGrid({ data, matchAccent = false, orderFromCsv }: SortableDiscordWidgetsGridProps) {
  const order = orderFromCsv ? parseDiscordWidgetOrder(orderFromCsv) : ["accountAge", "joined", "serverCount", "serverInvite"];
  const orderedIds = order.filter((id) => {
    if (id === "accountAge") return !!data.accountAge;
    if (id === "joined") return !!data.joined;
    if (id === "serverCount") return data.serverCount != null;
    if (id === "serverInvite") return !!data.serverInvite;
    return false;
  });
  const sortableIds = orderedIds.map((id) => `dw-${id}`);

  return (
    <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}
        role="group"
        aria-label="Discord widgets (draggable)"
      >
        {orderedIds.map((id) => (
          <SortableWidget key={id} id={id} prefix="dw">
            <DiscordSingleWidget id={id} data={data} matchAccent={matchAccent} />
          </SortableWidget>
        ))}
      </div>
    </SortableContext>
  );
}

interface SortableRobloxWidgetsGridProps {
  data: import("@/lib/roblox-widgets").RobloxWidgetData;
  matchAccent?: boolean;
  orderFromCsv?: string;
}

export function SortableRobloxWidgetsGrid({ data, matchAccent = false, orderFromCsv }: SortableRobloxWidgetsGridProps) {
  const order = orderFromCsv ? parseRobloxOrder(orderFromCsv) : ["accountAge", "profile"];
  const orderedIds = order.filter((id) => {
    if (id === "accountAge") return !!data.accountAge;
    if (id === "profile") return !!data.profile;
    return false;
  });
  const sortableIds = orderedIds.map((id) => `rw-${id}`);

  return (
    <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))" }}
        role="group"
        aria-label="Roblox widgets (draggable)"
      >
        {orderedIds.map((id) => (
          <SortableWidget key={id} id={id} prefix="rw">
            <RobloxSingleWidget id={id} data={data} matchAccent={matchAccent} />
          </SortableWidget>
        ))}
      </div>
    </SortableContext>
  );
}
