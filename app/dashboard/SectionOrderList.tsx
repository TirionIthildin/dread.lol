"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Eye, EyeSlash } from "@phosphor-icons/react";
import { SECTION_DEFINITIONS, type ProfileSectionId } from "@/lib/profile-sections";
import { SECTION_ICONS } from "@/app/dashboard/ElementPicker";

const ADD_ZONE_ID = "add-section-zone";

interface SortableLayoutItemProps {
  sectionId: ProfileSectionId;
  hidden: boolean;
  selected: boolean;
  onEdit: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

function SortableLayoutItem({ sectionId, hidden, selected, onEdit, onToggleVisibility }: SortableLayoutItemProps) {
  const def = SECTION_DEFINITIONS.find((d) => d.id === sectionId);
  const Icon = SECTION_ICONS[sectionId];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${
        isDragging ? "z-50 shadow-xl ring-2 ring-[var(--accent)]/50 bg-[var(--surface)] scale-[1.02]" : ""
      } ${selected ? "border-[var(--accent)] bg-[var(--accent)]/15 shadow-sm" : "border-[var(--border)]/50 hover:border-[var(--accent)]/30 hover:bg-[var(--surface-hover)]"} ${hidden ? "opacity-60" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 p-1 -ml-0.5 rounded cursor-grab active:cursor-grabbing touch-none text-[var(--muted)] hover:text-[var(--accent)]"
        aria-label={`Drag to reorder ${def?.label ?? sectionId}`}
        onClick={(e) => e.stopPropagation()}
      >
        <DotsSixVertical size={16} weight="bold" />
      </div>
      <button
        type="button"
        onClick={() => onEdit(sectionId)}
        className="flex-1 min-w-0 flex items-center gap-2 text-left font-medium truncate hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 rounded"
      >
        {Icon && <Icon size={18} weight="regular" className="shrink-0 text-current" />}
        <span className="truncate">{def?.label ?? sectionId}</span>
        <span className="shrink-0 text-[10px] text-[var(--muted)] font-normal ml-auto">Edit</span>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(sectionId); }}
        className="shrink-0 p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
        aria-label={hidden ? "Show section" : "Hide section"}
        title={hidden ? "Show section" : "Hide section"}
      >
        {hidden ? <EyeSlash size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

interface SectionOrderListProps {
  sectionOrder: ProfileSectionId[];
  sectionVisibility: Record<string, boolean>;
  onEdit: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  selectedSectionId: ProfileSectionId | null;
  activeDragId: string | null;
}

export { ADD_ZONE_ID };

export default function SectionOrderList({
  sectionOrder,
  sectionVisibility,
  onEdit,
  onToggleVisibility,
  selectedSectionId,
  activeDragId,
}: SectionOrderListProps) {
  const { setNodeRef, isOver } = useDroppable({ id: ADD_ZONE_ID });
  const draggingFromPicker = activeDragId?.startsWith("picker-");

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Sections</h4>
      <p className="text-[11px] text-[var(--muted)] -mt-1">Click to edit • Drag to reorder</p>
      <div className="space-y-1.5">
        {sectionOrder.map((sectionId) => (
          <SortableLayoutItem
            key={sectionId}
            sectionId={sectionId}
            hidden={!!sectionVisibility[sectionId]}
            selected={selectedSectionId === sectionId}
            onEdit={onEdit}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[52px] rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-[var(--muted)] transition-colors ${
          isOver ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)]/40"
        } ${!draggingFromPicker ? "opacity-60" : ""}`}
      >
        {isOver ? "Drop to add" : "Drop here to add"}
      </div>
    </div>
  );
}
