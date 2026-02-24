"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Eye,
  FloppyDisk,
  ArrowLeft,
  PencilSimple,
  SlidersHorizontal,
  X,
  ArrowsClockwise,
  ArrowSquareOut,
  SquaresFour,
} from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { updateProfileLayoutAction } from "@/app/dashboard/actions";
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
import SectionOrderList, { ADD_ZONE_ID } from "@/app/dashboard/SectionOrderList";

const PREVIEW_STORAGE_KEY = "dread-preview-profile";
const PREVIEW_MESSAGE_TYPE = "dread-preview-update";

interface DashboardLayoutEditorProps {
  profileId: string;
  baseProfile: Profile;
  profileRow: ProfileRow;
  hasPremiumAccess?: boolean;
  profileSlug?: string;
}

export default function DashboardLayoutEditor({ profileId, baseProfile, profileRow, hasPremiumAccess = false, profileSlug }: DashboardLayoutEditorProps) {
  const [profile, setProfile] = useState<Profile>(() => ({
    ...baseProfile,
    sectionOrder: baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER],
    sectionVisibility: baseProfile.sectionVisibility ?? {},
  }));
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() => baseProfile.sectionVisibility ?? {});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<SectionEditPanelSectionId | null>("hero");
  const [elementPickerOpen, setElementPickerOpen] = useState(true);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const orderedIds = sectionOrder.length ? sectionOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId)) : [...DEFAULT_SECTION_ORDER];
  const fullOrder = [...orderedIds, ...PROFILE_SECTION_IDS.filter((id) => !orderedIds.includes(id))];
  const effectiveProfile: Profile = { ...profile, sectionOrder: fullOrder, sectionVisibility };
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!effectiveProfile || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(effectiveProfile));
      previewIframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE_TYPE }, window.location.origin);
    } catch {
      /* ignore */
    }
  }, [effectiveProfile]);

  useEffect(() => {
    const initialOrder = baseProfile.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
    const initialVisibility = baseProfile.sectionVisibility ?? {};
    setHasChanges(
      JSON.stringify(sectionOrder) !== JSON.stringify(initialOrder) ||
      JSON.stringify(sectionVisibility) !== JSON.stringify(initialVisibility)
    );
  }, [sectionOrder, sectionVisibility, baseProfile.sectionOrder, baseProfile.sectionVisibility]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    const isPickerDrag = String(active.id).startsWith("picker-");
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
  }, [sectionOrder]);

  const handleToggleVisibility = useCallback((id: string) => {
    setSectionVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await updateProfileLayoutAction(profileId, sectionOrder, sectionVisibility);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Layout saved");
        setProfile((p) => ({ ...p, sectionOrder, sectionVisibility }));
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  }, [profileId, sectionOrder, sectionVisibility]);

  const handleEdit = useCallback((id: string) => setSelectedSectionId(id as SectionEditPanelSectionId), []);

  const handleAddSection = useCallback((sectionId: ProfileSectionId, insertIndex?: number) => {
    const oldOrder = sectionOrder.length ? sectionOrder : [...DEFAULT_SECTION_ORDER];
    const validOrder = oldOrder.filter((id): id is ProfileSectionId => PROFILE_SECTION_IDS.includes(id as ProfileSectionId));
    if (validOrder.includes(sectionId) && insertIndex == null) return;
    let next: ProfileSectionId[];
    if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= validOrder.length) {
      if (validOrder.includes(sectionId)) {
        const from = validOrder.indexOf(sectionId);
        next = arrayMove(validOrder, from, insertIndex >= from ? insertIndex - 1 : insertIndex);
      } else {
        next = [...validOrder.slice(0, insertIndex), sectionId, ...validOrder.slice(insertIndex)];
      }
    } else {
      if (validOrder.includes(sectionId)) return;
      next = [...validOrder, sectionId];
    }
    setSectionOrder(next);
    setSectionVisibility((prev) => {
      const nextVis = { ...prev };
      delete nextVis[sectionId];
      return nextVis;
    });
    setSelectedSectionId(sectionId);
  }, [sectionOrder]);

  const handleResetLayout = useCallback(() => {
    setSectionOrder([...DEFAULT_SECTION_ORDER]);
    setSectionVisibility({});
    toast.success("Layout reset to default");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSectionId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasChanges) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasChanges, handleSave]);

  return (
    <div className="flex flex-col h-[min(800px,calc(100vh-5rem))] min-h-[500px] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-lg">
      <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg)]/50">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
          >
            <ArrowLeft size={18} weight="regular" />
            Back
          </Link>
          {profileSlug && (
            <a
              href={`/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors shrink-0"
              title="View profile in new tab"
            >
              <ArrowSquareOut size={18} weight="regular" />
              View live
            </a>
          )}
          <button
            type="button"
            onClick={() => setSelectedSectionId("style")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            <SlidersHorizontal size={18} weight="regular" />
            Style
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
          >
            <PencilSimple size={18} weight="regular" />
            Full editor
          </Link>
          <button
            type="button"
            onClick={() => (window.innerWidth >= 768 ? setElementPickerOpen((p) => !p) : setMobilePickerOpen(true))}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${elementPickerOpen ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            title={elementPickerOpen ? "Hide element picker" : "Show element picker"}
          >
            <SquaresFour size={18} weight="regular" />
            Elements
          </button>
          {hasChanges && (
            <button
              type="button"
              onClick={handleResetLayout}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--warning)] transition-colors"
              title="Reset layout to default order and visibility"
            >
              <ArrowsClockwise size={18} weight="regular" />
              Reset layout
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">
            Click ✎ to edit • Drag to reorder • ⌘Enter to save
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] disabled:opacity-50 disabled:pointer-events-none"
          >
            <FloppyDisk size={18} weight="regular" />
            {saving ? "Saving…" : "Save layout"}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 flex overflow-hidden">
        {elementPickerOpen && (
          <aside
            className="hidden md:flex w-[220px] lg:w-[240px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg)]/30 overflow-hidden"
            aria-label="Editor sidebar"
          >
            <div className="flex-1 min-h-0 overflow-auto p-3 space-y-6">
              <SortableContext items={fullOrder} strategy={verticalListSortingStrategy}>
                <SectionOrderList
                  sectionOrder={orderedIds}
                  sectionVisibility={sectionVisibility}
                  onEdit={handleEdit}
                  onToggleVisibility={handleToggleVisibility}
                  selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
                  activeDragId={activeDragId}
                />
              </SortableContext>
              <ElementPicker
                sectionOrder={orderedIds}
                onAddSection={handleAddSection}
                onSelectSection={(id) => setSelectedSectionId(id)}
                selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
              />
            </div>
          </aside>
        )}
        {mobilePickerOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobilePickerOpen(false)}
              aria-hidden
            />
            <aside
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(18rem,85vw)] flex flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden"
              aria-label="Element picker"
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold">Add elements</h3>
                <button
                  type="button"
                  onClick={() => setMobilePickerOpen(false)}
                  className="p-2 rounded-md hover:bg-[var(--surface-hover)]"
                  aria-label="Close"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-4 space-y-6">
                <SortableContext items={fullOrder} strategy={verticalListSortingStrategy}>
                  <SectionOrderList
                    sectionOrder={orderedIds}
                    sectionVisibility={sectionVisibility}
                    onEdit={(id) => { handleEdit(id); setMobilePickerOpen(false); }}
                    onToggleVisibility={handleToggleVisibility}
                    selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
                    activeDragId={activeDragId}
                  />
                </SortableContext>
                <ElementPicker
                  sectionOrder={orderedIds}
                  onAddSection={(id) => {
                    handleAddSection(id);
                    setMobilePickerOpen(false);
                  }}
                  onSelectSection={(id) => {
                    setSelectedSectionId(id);
                    setMobilePickerOpen(false);
                  }}
                  selectedSectionId={selectedSectionId && selectedSectionId !== "style" ? selectedSectionId : null}
                />
              </div>
            </aside>
          </>
        )}
        <section
          className="flex-1 min-w-0 flex flex-col min-h-0 border-r border-[var(--border)] bg-[var(--bg)] overflow-hidden"
          aria-label="Profile preview"
        >
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2 bg-[var(--bg)]/80 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={18} weight="regular" className="text-[var(--terminal)]" aria-hidden />
              <span className="text-sm font-medium text-[var(--foreground)]">Live preview</span>
              <span className="text-xs text-[var(--muted)] hidden sm:inline">— updates as you edit</span>
            </div>
            {profileSlug && (
              <a
                href={`/${profileSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Open in tab
              </a>
            )}
          </div>
          <div className="flex-1 min-h-0 relative bg-[var(--bg)]">
            <iframe
              ref={previewIframeRef}
              src="/live-preview?embed=1"
              title="Live profile preview"
              className="absolute inset-0 w-full h-full rounded-b-xl border-0"
            />
          </div>
        </section>
        <aside
          className="hidden md:flex w-[320px] xl:w-[360px] shrink-0 flex-col min-h-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden"
          aria-label="Edit panel"
        >
          {selectedSectionId ? (
            <>
              <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {selectedSectionId === "style" ? "Style & appearance" : SECTION_DEFINITIONS.find((d) => d.id === selectedSectionId)?.label ?? selectedSectionId}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedSectionId(null)}
                  className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] shrink-0"
                  aria-label="Close panel"
                >
                  <X size={18} weight="bold" />
                </button>
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
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Select a section to edit</p>
              <p className="text-xs text-[var(--muted)] mb-4">Click any section in the layout list or use the buttons below.</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                {["hero", "description", "links", "style"].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSectionId(id as SectionEditPanelSectionId)}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 text-sm font-medium transition-colors"
                  >
                    {id === "style" ? "Style" : SECTION_DEFINITIONS.find((d) => d.id === id)?.label ?? id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
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
        {selectedSectionId && (
          <div
            className="md:hidden fixed inset-0 z-50 flex flex-col bg-[var(--surface)]"
            aria-label="Edit section"
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">
                {selectedSectionId === "style" ? "Style" : SECTION_DEFINITIONS.find((d) => d.id === selectedSectionId)?.label ?? selectedSectionId}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSectionId(null)}
                className="p-2 rounded-md hover:bg-[var(--surface-hover)]"
                aria-label="Close"
              >
                <X size={20} weight="bold" />
              </button>
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
          </div>
        )}
      </div>
      </DndContext>
    </div>
  );
}
