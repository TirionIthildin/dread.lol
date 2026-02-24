"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Icon } from "@phosphor-icons/react";
import {
  TextT,
  User,
  FileText,
  Tag,
  Wrench,
  Quotes,
  LinkSimple,
  DiscordLogo,
  GameController,
  Images,
  MusicNotes,
  UsersThree,
  HandHeart,
} from "@phosphor-icons/react";
import {
  SECTION_DEFINITIONS,
  SECTION_CATEGORIES,
  type ProfileSectionId,
  type SectionDefinition,
} from "@/lib/profile-sections";

export const SECTION_ICONS: Record<ProfileSectionId, Icon> = {
  banner: TextT,
  hero: User,
  description: FileText,
  tags: Tag,
  skills: Wrench,
  quote: Quotes,
  links: LinkSimple,
  "discord-widgets": DiscordLogo,
  "roblox-widgets": GameController,
  "gallery-blog": Images,
  audio: MusicNotes,
  similar: UsersThree,
  vouches: HandHeart,
};

interface ElementPickerProps {
  sectionOrder: string[];
  onAddSection: (sectionId: ProfileSectionId, insertIndex?: number) => void;
  onSelectSection: (sectionId: ProfileSectionId) => void;
  selectedSectionId: ProfileSectionId | null;
}

function DraggableElement({
  def,
  isInLayout,
  onAdd,
  onSelect,
  isSelected,
}: {
  def: SectionDefinition;
  isInLayout: boolean;
  onAdd: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const Icon = SECTION_ICONS[def.id as ProfileSectionId] ?? TextT;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `picker-${def.id}`,
    data: { type: "element-picker", sectionId: def.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (isInLayout) {
          onSelect();
        } else {
          onAdd();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isInLayout) onSelect();
          else onAdd();
        }
      }}
      className={`
        flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50 scale-95" : ""}
        ${isSelected ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]" : "border-[var(--border)]/60 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"}
        ${isInLayout ? "opacity-90" : ""}
      `}
      title={def.description ?? def.label}
      aria-label={`${def.label}${isInLayout ? " (in layout)" : " (add to layout)"}`}
    >
      <Icon size={18} weight="regular" className="shrink-0 text-current" />
      <div className="min-w-0 flex-1">
        <span className="font-medium">{def.label}</span>
        {def.description && (
          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{def.description}</p>
        )}
      </div>
      {isInLayout && (
        <span className="shrink-0 text-xs text-[var(--muted)]" aria-hidden>✓</span>
      )}
    </div>
  );
}

export default function ElementPicker({
  sectionOrder,
  onAddSection,
  onSelectSection,
  selectedSectionId,
}: ElementPickerProps) {
  const sectionsByCategory = SECTION_CATEGORIES.map((cat) => ({
    ...cat,
    sections: SECTION_DEFINITIONS.filter((d) => (d.category ?? "content") === cat.id),
  }));

  return (
    <div className="flex flex-col">
      <h4 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Add elements</h4>
      <p className="text-[11px] text-[var(--muted)] -mt-1 mb-3">Drag or click to add to layout</p>
      <div className="space-y-4">
        {sectionsByCategory.map(
          ({ id, label, sections }) =>
            sections.length > 0 && (
              <div key={id}>
                <h4 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">{label}</h4>
                <div className="space-y-1.5">
                  {sections.map((def) => {
                    const isInLayout = sectionOrder.includes(def.id);
                    return (
                      <DraggableElement
                        key={def.id}
                        def={def}
                        isInLayout={isInLayout}
                        onAdd={() => onAddSection(def.id as ProfileSectionId)}
                        onSelect={() => onSelectSection(def.id as ProfileSectionId)}
                        isSelected={selectedSectionId === def.id}
                      />
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
