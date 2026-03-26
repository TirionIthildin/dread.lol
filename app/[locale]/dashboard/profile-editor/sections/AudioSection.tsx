"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { GripVertical, Music, Pencil, Trash, Upload } from "lucide-react";

export interface AudioSectionProps {
  visible: boolean;
  showAudioPlayerValue: boolean;
  setShowAudioPlayerValue: (v: boolean) => void;
  audioVisualizerStyleValue: string;
  setAudioVisualizerStyleValue: (v: string) => void;
  audioTracksValue: { url: string; title?: string }[];
  setAudioTracksValue: Dispatch<SetStateAction<{ url: string; title?: string }[]>>;
  audioTrackUploading: boolean;
  audioTrackUploadError: string | null;
  audioTrackFileRef: RefObject<HTMLInputElement | null>;
  audioTracksDragOver: boolean;
  setAudioTracksDragOver: (v: boolean) => void;
  editingTrackIndex: number | null;
  setEditingTrackIndex: (v: number | null) => void;
  editingTrackTitle: string;
  setEditingTrackTitle: (v: string) => void;
  draggedTrackIndex: number | null;
  setDraggedTrackIndex: (v: number | null) => void;
  handleAudioTrackUpload: (file: File) => Promise<void>;
  moveTrack: (from: number, to: number) => void;
}

export function AudioSection(props: AudioSectionProps) {
  const {
    visible,
    showAudioPlayerValue,
    setShowAudioPlayerValue,
    audioVisualizerStyleValue,
    setAudioVisualizerStyleValue,
    audioTracksValue,
    setAudioTracksValue,
    audioTrackUploading,
    audioTrackUploadError,
    audioTrackFileRef,
    audioTracksDragOver,
    setAudioTracksDragOver,
    editingTrackIndex,
    setEditingTrackIndex,
    editingTrackTitle,
    setEditingTrackTitle,
    draggedTrackIndex,
    setDraggedTrackIndex,
    handleAudioTrackUpload,
    moveTrack,
  } = props;
  return (
    <div className={visible ? "block space-y-4" : "hidden"}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
        <div className="px-4 py-3 border-b border-[var(--border)]/50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
              <Music size={18} strokeWidth={1.5} className="text-[var(--accent)]" aria-hidden />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">Audio Player</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <span className="text-xs text-[var(--muted)]">Show player on profile</span>
              <span className={`relative w-10 h-6 rounded-full transition-colors ${showAudioPlayerValue ? "bg-[var(--accent)]/30" : "bg-[var(--border)]"}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[var(--foreground)] transition-transform ${showAudioPlayerValue ? "translate-x-5" : "translate-x-0"}`} />
              </span>
              <input
                type="checkbox"
                name="showAudioPlayer"
                checked={showAudioPlayerValue}
                onChange={(e) => setShowAudioPlayerValue(e.target.checked)}
                className="sr-only"
              />
            </label>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--muted)] mb-4">
            Visitors can play your tracks directly on your profile. Add tracks below and enable the player.
          </p>
          {showAudioPlayerValue && (
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <p className="text-xs font-medium text-[var(--foreground)] mb-3">Visualizer</p>
              <div className="flex flex-wrap gap-2">
                {(["", "bars", "wave", "spectrum"] as const).map((opt) => {
                  const v = audioVisualizerStyleValue;
                  const match = opt ? v === opt : !v || !["bars", "wave", "spectrum"].includes(v ?? "");
                  return (
                    <button
                      key={opt || "none"}
                      type="button"
                      onClick={() => setAudioVisualizerStyleValue(opt)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        match
                          ? "bg-[var(--accent)]/25 text-[var(--accent)] border border-[var(--accent)]/50"
                          : "bg-[var(--bg)]/80 text-[var(--muted)] border border-[var(--border)]/50 hover:border-[var(--border)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {opt || "None"}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="audioVisualizerStyle" value={(() => {
                const v = audioVisualizerStyleValue;
                return ["bars", "wave", "spectrum"].includes(v ?? "") ? v : "";
              })()} />
            </div>
          )}
          {showAudioPlayerValue && (
            <>
              <input type="hidden" name="audioTracks" value={JSON.stringify(audioTracksValue)} />
              {audioTracksValue.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {audioTracksValue.map((track, i) => (
                    <div
                      key={`${track.url}-${i}`}
                      draggable
                      onDragStart={() => setDraggedTrackIndex(i)}
                      onDragEnd={() => setDraggedTrackIndex(null)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = draggedTrackIndex;
                        if (from != null && from !== i) moveTrack(from, i);
                        setDraggedTrackIndex(null);
                      }}
                      className={`flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 px-3 py-2.5 transition-all group ${draggedTrackIndex === i ? "opacity-50 border-dashed" : "hover:border-[var(--border-bright)]"}`}
                    >
                      <GripVertical size={18} className="text-[var(--muted)] cursor-grab active:cursor-grabbing shrink-0" />
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent)]/10 shrink-0">
                        <Music size={18} className="text-[var(--accent)] fill-current" />
                      </div>
                      {editingTrackIndex === i ? (
                        <input
                          type="text"
                          value={editingTrackTitle}
                          onChange={(e) => setEditingTrackTitle(e.target.value)}
                          onBlur={() => {
                            setAudioTracksValue((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], title: editingTrackTitle.trim() || undefined };
                              return next;
                            });
                            setEditingTrackIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          autoFocus
                          className="flex-1 min-w-0 rounded border border-[var(--accent)]/50 bg-[var(--bg)] px-2 py-1 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTrackIndex(i);
                            setEditingTrackTitle(track.title || `Track ${i + 1}`);
                          }}
                          className="flex-1 min-w-0 text-left text-sm font-medium text-[var(--foreground)] truncate hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                        >
                          {track.title || `Track ${i + 1}`}
                          <Pencil size={12} className="shrink-0 opacity-50 group-hover:opacity-100" />
                        </button>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAudioTracksValue((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--warning)]/20 hover:text-[var(--warning)] transition-colors"
                          aria-label="Remove track"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") audioTrackFileRef.current?.click(); }}
                onClick={() => audioTrackFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setAudioTracksDragOver(true); }}
                onDragLeave={() => setAudioTracksDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setAudioTracksDragOver(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file && (file.type.startsWith("audio/") || /\.(mp3|aac|m4a)$/i.test(file.name))) handleAudioTrackUpload(file);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 px-4 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
                  audioTracksDragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                }`}
              >
                <div className="rounded-full bg-[var(--accent)]/10 p-2.5">
                  <Upload size={22} strokeWidth={1.5} className="text-[var(--accent)]" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {audioTracksValue.length > 0 ? "Add another track" : "Add tracks — drop or click"}
                </p>
                <p className="text-[10px] text-[var(--muted)]">MP3 or AAC · max 10 MB per track</p>
              </div>
              <input
                ref={audioTrackFileRef}
                type="file"
                accept=".mp3,.aac,audio/mpeg,audio/mp3,audio/aac"
                className="sr-only"
                aria-hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioTrackUpload(file);
                  e.target.value = "";
                }}
              />
              {audioTrackUploading && (
                <p className="mt-2 text-xs text-[var(--accent)] animate-pulse">Uploading…</p>
              )}
              {audioTrackUploadError && (
                <p className="mt-2 text-xs text-[var(--warning)] rounded-lg bg-[var(--warning)]/10 px-3 py-2">{audioTrackUploadError}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
