"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CaretUp, CaretDown, FloppyDisk, ArrowLeft, ArrowSquareOut, SlidersHorizontal, PencilSimple, X, Trash, Cursor, ImageSquare, DotsSixVertical } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ProfileContent, { type SectionWrapperProps } from "@/app/components/ProfileContent";
import ProfileBackground from "@/app/components/ProfileBackground";
import ProfileCursorEffect from "@/app/components/ProfileCursorEffect";
import { updateProfileLayoutAction, updateProfileFieldsAction } from "@/app/dashboard/actions";
import {
  DEFAULT_SECTION_ORDER,
  PROFILE_SECTION_IDS,
  SECTION_DEFINITIONS,
  type ProfileSectionId,
} from "@/lib/profile-sections";
import type { Profile } from "@/lib/profiles";
import type { ProfileRow } from "@/lib/db/schema";
import { toast } from "sonner";
import { SectionEditPanel, type SectionEditPanelSectionId } from "@/app/dashboard/SectionEditPanels";
import ElementPicker, { SECTION_ICONS } from "@/app/dashboard/ElementPicker";

const ADD_ZONE_ID = "add-section-zone";
const emptyVouches = { slug: "preview", count: 0, vouchedBy: [], mutualVouchers: [], currentUserHasVouched: false, canVouch: false };

interface SortableSectionProps extends SectionWrapperProps {
  visibility: Record<string, boolean>;
  onEdit: (id: string) => void;
  selectedSectionId: string | null;
}

function SortableSection({ sectionId, children, visibility, onEdit, selectedSectionId }: SortableSectionProps) {
  const hidden = visibility[sectionId];
  const isSelected = selectedSectionId === sectionId;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-lg transition-all duration-200 flex gap-2 ${isDragging ? "z-50 shadow-2xl ring-2 ring-[var(--accent)]/50 bg-[var(--surface)]/95 scale-[1.02]" : ""} ${isSelected ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""}`}
      data-section-id={sectionId}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 self-start mt-0.5 p-1.5 -ml-0.5 rounded cursor-grab active:cursor-grabbing touch-none text-[var(--muted)] hover:text-[var(--foreground)] opacity-60 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <DotsSixVertical size={18} weight="bold" />
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button, [role=button], input, [contenteditable], [data-no-edit]")) return;
          onEdit(sectionId);
        }}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onEdit(sectionId))}
        className={`flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 rounded ${hidden ? "py-3 px-2 rounded-lg bg-[var(--surface)]/60 border border-dashed border-[var(--border)]/60" : ""}`}
      >
        {hidden ? (
          <span className="text-sm text-[var(--muted)]">{SECTION_DEFINITIONS.find((d) => d.id === sectionId)?.label ?? sectionId} (hidden)</span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function SectionControls({
  sectionId,
  onEdit,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  sectionId: string;
  onEdit: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const def = SECTION_DEFINITIONS.find((d) => d.id === sectionId);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2">
      <button type="button" onClick={() => onMoveUp(sectionId)} className="p-2 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)]" aria-label="Move up" title="Move up">
        <CaretUp size={16} weight="bold" />
      </button>
      <button type="button" onClick={() => onMoveDown(sectionId)} className="p-2 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)]" aria-label="Move down" title="Move down">
        <CaretDown size={16} weight="bold" />
      </button>
      <button type="button" onClick={() => onEdit(sectionId)} className="p-2 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)]" aria-label="Edit" title="Edit">
        <PencilSimple size={16} weight="regular" />
      </button>
      <button type="button" onClick={() => onRemove(sectionId)} className="p-2 rounded-md hover:bg-red-500/10 text-[var(--foreground)] hover:text-red-500" aria-label="Remove" title="Remove">
        <Trash size={16} weight="regular" />
      </button>
      <span className="ml-1 text-xs text-[var(--muted)] truncate max-w-[100px]">{def?.label ?? sectionId}</span>
    </div>
  );
}

interface ProfilePageEditorProps {
  profileId: string;
  baseProfile: Profile;
  profileRow: ProfileRow;
  hasPremiumAccess?: boolean;
  profileSlug?: string;
}

export default function ProfilePageEditor({ profileId, baseProfile, profileRow, hasPremiumAccess = false, profileSlug }: ProfilePageEditorProps) {
  const [profile, setProfile] = useState<Profile>(() => ({
    ...baseProfile,
    sectionOrder: baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER],
    sectionVisibility: baseProfile.sectionVisibility ?? {},
  }));
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() => baseProfile.sectionVisibility ?? {});
  const [removedSectionIds, setRemovedSectionIds] = useState<Set<string>>(() => new Set(baseProfile.removedSectionIds ?? []));
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<SectionEditPanelSectionId | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showCustomCursor, setShowCustomCursor] = useState(true);
  const [showAnimatedBackground, setShowAnimatedBackground] = useState(false);

  const orderedIds = sectionOrder.length ? sectionOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId)) : [...DEFAULT_SECTION_ORDER];
  const fullOrder = [...orderedIds, ...PROFILE_SECTION_IDS.filter((id) => !orderedIds.includes(id) && !removedSectionIds.has(id))];
  const effectiveProfile: Profile = { ...profile, sectionOrder: fullOrder, sectionVisibility, removedSectionIds: Array.from(removedSectionIds) };
  const displayProfile: Profile = { ...profile, sectionOrder: fullOrder, sectionVisibility: {}, removedSectionIds: Array.from(removedSectionIds) };

  useEffect(() => {
    const initialOrder = baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
    const initialVisibility = baseProfile.sectionVisibility ?? {};
    const initialRemoved = new Set(baseProfile.removedSectionIds ?? []);
    setHasChanges(
      JSON.stringify(sectionOrder) !== JSON.stringify(initialOrder) ||
      JSON.stringify(sectionVisibility) !== JSON.stringify(initialVisibility) ||
      (removedSectionIds.size !== initialRemoved.size || [...removedSectionIds].some((id) => !initialRemoved.has(id)))
    );
  }, [sectionOrder, sectionVisibility, removedSectionIds, baseProfile.sectionOrder, baseProfile.sectionVisibility, baseProfile.removedSectionIds]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDiscordWidgetOrderChange = useCallback(
    async (newOrder: string[]) => {
      const csv = newOrder.join(",");
      setProfile((p) => ({ ...p, showDiscordWidgets: csv }));
      const result = await updateProfileFieldsAction(profileId, { showDiscordWidgets: csv });
      if (result?.error) toast.error(result.error);
    },
    [profileId]
  );

  const handleRobloxWidgetOrderChange = useCallback(
    async (newOrder: string[]) => {
      const csv = newOrder.join(",");
      setProfile((p) => ({ ...p, showRobloxWidgets: csv }));
      const result = await updateProfileFieldsAction(profileId, { showRobloxWidgets: csv });
      if (result?.error) toast.error(result.error);
    },
    [profileId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      const activeStr = String(active.id);

      if (activeStr.startsWith("dw-") && over) {
        const overStr = String(over.id);
        if (!overStr.startsWith("dw-")) return;
        const currentOrder = (profile.showDiscordWidgets ?? "accountAge,joined,serverCount,serverInvite")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const map: Record<string, string> = {
          accountage: "accountAge",
          joined: "joined",
          servercount: "serverCount",
          serverinvite: "serverInvite",
        };
        const orderedIds = currentOrder
          .map((s) => map[s] ?? s)
          .filter((id) =>
            profile.discordWidgets &&
            ((id === "accountAge" && profile.discordWidgets.accountAge) ||
              (id === "joined" && profile.discordWidgets.joined) ||
              (id === "serverCount" && profile.discordWidgets.serverCount != null) ||
              (id === "serverInvite" && profile.discordWidgets.serverInvite))
          );
        const oldIndex = orderedIds.indexOf(activeStr.replace("dw-", ""));
        const newIndex = orderedIds.indexOf(overStr.replace("dw-", ""));
        if (oldIndex !== -1 && newIndex !== -1) {
          const next = arrayMove(orderedIds, oldIndex, newIndex);
          handleDiscordWidgetOrderChange(next);
        }
        return;
      }
      if (activeStr.startsWith("rw-") && over) {
        const overStr = String(over.id);
        if (!overStr.startsWith("rw-")) return;
        const currentOrder = (profile.showRobloxWidgets ?? "accountAge,profile")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const map: Record<string, string> = {
          accountage: "accountAge",
          profile: "profile",
        };
        const orderedIds = currentOrder
          .map((s) => map[s] ?? s)
          .filter((id) =>
            profile.robloxWidgets &&
            ((id === "accountAge" && profile.robloxWidgets.accountAge) || (id === "profile" && profile.robloxWidgets.profile))
          );
        const oldIndex = orderedIds.indexOf(activeStr.replace("rw-", ""));
        const newIndex = orderedIds.indexOf(overStr.replace("rw-", ""));
        if (oldIndex !== -1 && newIndex !== -1) {
          const next = arrayMove(orderedIds, oldIndex, newIndex);
          handleRobloxWidgetOrderChange(next);
        }
        return;
      }

      const isPickerDrag = activeStr.startsWith("picker-");
      const pickerData = active.data?.current as { type?: string; sectionId?: string } | undefined;
      const sectionIdFromPicker = isPickerDrag && pickerData?.type === "element-picker" ? pickerData.sectionId : null;

      if (isPickerDrag && sectionIdFromPicker && PROFILE_SECTION_IDS.includes(sectionIdFromPicker as ProfileSectionId)) {
        const oldOrder = sectionOrder.length ? sectionOrder : [...DEFAULT_SECTION_ORDER];
        const validOrder = oldOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId));
        const insertSectionId = sectionIdFromPicker as ProfileSectionId;
        let next: ProfileSectionId[];

        if (over && over.id === ADD_ZONE_ID) {
          if (validOrder.includes(insertSectionId)) return;
          next = [...validOrder, insertSectionId];
        } else if (over && PROFILE_SECTION_IDS.includes(over.id as ProfileSectionId)) {
          const insertIndex = validOrder.indexOf(over.id as ProfileSectionId);
          const existsAt = validOrder.indexOf(insertSectionId);
          if (existsAt >= 0) {
            next = arrayMove(validOrder, existsAt, insertIndex >= existsAt ? insertIndex - 1 : insertIndex);
          } else {
            next = [...validOrder.slice(0, insertIndex), insertSectionId, ...validOrder.slice(insertIndex)];
          }
        } else {
          if (validOrder.includes(insertSectionId)) return;
          next = [...validOrder, insertSectionId];
        }
        setSectionOrder(next);
        setRemovedSectionIds((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(insertSectionId);
          return nextSet;
        });
        setSectionVisibility((prev) => {
          const nextVis = { ...prev };
          delete nextVis[insertSectionId];
          return nextVis;
        });
        setSelectedSectionId(insertSectionId);
        return;
      }

      if (!over || active.id === over.id) return;
      const oldOrder = sectionOrder.length ? sectionOrder : [...DEFAULT_SECTION_ORDER];
      const validOrder = oldOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId));
      const oldIndex = validOrder.indexOf(active.id as ProfileSectionId);
      const newIndex = validOrder.indexOf(over.id as ProfileSectionId);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(validOrder, oldIndex, newIndex);
      setSectionOrder(next);
    },
    [sectionOrder, profile, handleDiscordWidgetOrderChange, handleRobloxWidgetOrderChange]
  );

  const handleRemoveSection = useCallback((id: string) => {
    setRemovedSectionIds((prev) => new Set([...prev, id]));
    setSectionOrder((prev) => prev.filter((s) => s !== id));
    setSectionVisibility((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedSectionId === id) setSelectedSectionId(null);
  }, [selectedSectionId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await updateProfileLayoutAction(profileId, sectionOrder, sectionVisibility, Array.from(removedSectionIds));
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Layout saved");
        setProfile((p) => ({ ...p, sectionOrder, sectionVisibility, removedSectionIds: Array.from(removedSectionIds) }));
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  }, [profileId, sectionOrder, sectionVisibility, removedSectionIds]);

  const handleEdit = useCallback((id: string) => setSelectedSectionId(id as SectionEditPanelSectionId), []);

  const handleMoveUp = useCallback((id: string) => {
    const idx = fullOrder.indexOf(id as ProfileSectionId);
    if (idx <= 0) return;
    const next = arrayMove(fullOrder, idx, idx - 1);
    setSectionOrder(next.filter((sectionId): sectionId is ProfileSectionId => PROFILE_SECTION_IDS.includes(sectionId as ProfileSectionId)));
  }, [fullOrder]);

  const handleMoveDown = useCallback((id: string) => {
    const idx = fullOrder.indexOf(id as ProfileSectionId);
    if (idx < 0 || idx >= fullOrder.length - 1) return;
    const next = arrayMove(fullOrder, idx, idx + 1);
    setSectionOrder(next.filter((sectionId): sectionId is ProfileSectionId => PROFILE_SECTION_IDS.includes(sectionId as ProfileSectionId)));
  }, [fullOrder]);

  const handleAddSection = useCallback((sectionId: ProfileSectionId) => {
    setRemovedSectionIds((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
    const oldOrder = sectionOrder.length ? sectionOrder : [...DEFAULT_SECTION_ORDER];
    const validOrder = oldOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId));
    if (validOrder.includes(sectionId)) return;
    setSectionOrder([...validOrder, sectionId]);
    setSectionVisibility((prev) => {
      const nextVis = { ...prev };
      delete nextVis[sectionId];
      return nextVis;
    });
    setSelectedSectionId(sectionId);
  }, [sectionOrder]);

  const SectionWrapper = useCallback(
    (props: SectionWrapperProps) => (
      <SortableSection
        {...props}
        visibility={sectionVisibility}
        onEdit={handleEdit}
        selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
      />
    ),
    [sectionVisibility, handleEdit, selectedSectionId]
  );

  const controlsColumn = (
    <>
      {fullOrder.map((sectionId) => (
        <SectionControls
          key={sectionId}
          sectionId={sectionId}
          onEdit={handleEdit}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onRemove={handleRemoveSection}
        />
      ))}
    </>
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSectionId(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasChanges) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasChanges, handleSave]);

  const needsCursorEffect = showCustomCursor && (profile.cursorStyle === "glow" || profile.cursorStyle === "trail");

  function AddZone() {
    const { setNodeRef, isOver } = useDroppable({ id: ADD_ZONE_ID });
    const draggingFromPicker = activeDragId?.startsWith("picker-");
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[56px] rounded-lg border-2 border-dashed flex items-center justify-center text-sm text-[var(--muted)] transition-colors ${
          isOver ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)]/40"
        } ${!draggingFromPicker ? "opacity-60" : ""}`}
      >
        {isOver ? "Drop to add" : "Drop here to add elements"}
      </div>
    );
  }

  const content = (
    <div className="relative">
      <ProfileContent
        profile={displayProfile}
        vouches={emptyVouches}
        similarProfiles={[]}
        mutualGuilds={[]}
        canReport={false}
        canSubmitReport={false}
        SectionWrapper={SectionWrapper}
        controlsColumn={controlsColumn}
        sortableWidgets
      />
      <AddZone />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft size={18} />
            Dashboard
          </Link>
          {profileSlug && (
            <a href={`/${profileSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
              <ArrowSquareOut size={18} />
              View live
            </a>
          )}
          <button type="button" onClick={() => setSelectedSectionId("style")} className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
            <SlidersHorizontal size={18} className="inline mr-1" />
            Style
          </button>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80">
            <PencilSimple size={18} className="inline mr-1" />
            Full editor
          </Link>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={showCustomCursor}
              onChange={(e) => setShowCustomCursor(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <Cursor size={18} className="inline" />
            Custom cursor
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={showAnimatedBackground}
              onChange={(e) => setShowAnimatedBackground(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <ImageSquare size={18} className="inline" />
            Animated bg
          </label>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-4 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FloppyDisk size={18} />
          {saving ? "Saving…" : "Save layout"}
        </button>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <aside className="w-72 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden" aria-label="Elements">
            <div className="p-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">Elements</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">Drag or click to add</p>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-3">
              <ElementPicker
                sectionOrder={orderedIds}
                onAddSection={handleAddSection}
                onSelectSection={(id) => setSelectedSectionId(id)}
                selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
              />
            </div>
          </aside>

          <div className="flex-1 min-h-0 overflow-auto flex flex-col min-w-0 bg-[var(--bg)]">
            <SortableContext items={fullOrder} strategy={verticalListSortingStrategy}>
              <div className="flex-1 min-h-0 flex flex-col items-center p-8">
                <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col">
                  <ProfileBackground
                    profile={effectiveProfile}
                    defaultUnlocked
                    testOverlayVisible={false}
                    scoped
                    staticFrame={!showAnimatedBackground}
                    disableCustomCursor={!showCustomCursor}
                    muteBackgroundAudio
                  >
                    {needsCursorEffect ? (
                      <ProfileCursorEffect cursorStyle={profile.cursorStyle} accentColor={profile.accentColor} scoped>
                        {content}
                      </ProfileCursorEffect>
                    ) : (
                      content
                    )}
                  </ProfileBackground>
                </div>
              </div>
            </SortableContext>
          </div>

          {selectedSectionId && (
            <aside className="w-96 shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden" aria-label="Properties">
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold truncate min-w-0">
                  {selectedSectionId === "style" ? "Style" : SECTION_DEFINITIONS.find((d) => d.id === selectedSectionId)?.label ?? selectedSectionId}
                </h2>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedSectionId !== "style" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveSection(selectedSectionId);
                        setSelectedSectionId(null);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500"
                      aria-label={`Remove ${SECTION_DEFINITIONS.find((d) => d.id === selectedSectionId)?.label ?? selectedSectionId}`}
                      title="Remove"
                    >
                      <Trash size={18} weight="regular" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(null)}
                    className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    aria-label="Close"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4">
                <SectionEditPanel
                  sectionId={selectedSectionId}
                  profile={effectiveProfile}
                  profileId={profileId}
                  profileRow={profileRow}
                  onProfileChange={(p) => setProfile((prev) => ({ ...prev, ...p }))}
                  hasPremium={hasPremiumAccess}
                />
              </div>
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragId ? (
            (() => {
              const sectionId = (activeDragId.startsWith("picker-") ? activeDragId.replace(/^picker-/, "") : activeDragId) as ProfileSectionId;
              if (!PROFILE_SECTION_IDS.includes(sectionId)) return null;
              const def = SECTION_DEFINITIONS.find((d) => d.id === sectionId);
              const Icon = SECTION_ICONS[sectionId];
              if (!def) return null;
              return (
                <div className="flex items-center gap-2.5 rounded-lg border-2 border-[var(--accent)] bg-[var(--surface)] shadow-xl px-3 py-2.5 cursor-grabbing opacity-95">
                  {Icon && <Icon size={18} weight="regular" className="shrink-0 text-[var(--accent)]" />}
                  <span className="font-medium text-sm">{def.label}</span>
                </div>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
