"use client";

import dynamic from "next/dynamic";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Suspense } from "react";
import type { ProfileRow } from "@/lib/db/schema";
import type { Profile } from "@/lib/profiles";
import type { DiscordWidgetData } from "@/lib/discord-widgets";
import type { CryptoWidgetData } from "@/lib/crypto-widgets";
import type { GithubWidgetData } from "@/lib/github-widgets";
import type { EditorSectionId } from "@/app/dashboard/profile-editor/types";
import { TerminalSection } from "@/app/dashboard/profile-editor/sections/TerminalSection";
import { BasicsSection } from "@/app/dashboard/profile-editor/sections/BasicsSection";
import { DiscordSection } from "@/app/dashboard/profile-editor/sections/DiscordSection";
import { ExtrasSection } from "@/app/dashboard/profile-editor/sections/ExtrasSection";
import { BannerSection } from "@/app/dashboard/profile-editor/sections/BannerSection";
import { FunSection } from "@/app/dashboard/profile-editor/sections/FunSection";
import { WidgetsSection } from "@/app/dashboard/profile-editor/sections/WidgetsSection";
import { AudioSection } from "@/app/dashboard/profile-editor/sections/AudioSection";
import { SectionTip } from "@/app/dashboard/profile-editor/SectionTip";

const VersionsSectionLazy = dynamic(
  () =>
    import("@/app/dashboard/profile-editor/sections/VersionsSection").then((m) => ({
      default: m.VersionsSection,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-[var(--muted)] px-1 py-2" role="status">
        Loading versions…
      </p>
    ),
  }
);

export type ProfileEditorFormFieldsProps = {
  activeEditorSection: EditorSectionId;
  profile: ProfileRow;
  baseProfileForPreview: Profile | undefined;
  versions: import("@/lib/profile-versions").ProfileVersionRow[];
  onVersionsSaved: () => void;
  onVersionsRestored: () => void;
  onVersionsDeleted: () => void;
  discordAvatarUrl?: string | null;
  availableDiscordBadges: string[];
  hasPremiumAccess: boolean;
  robloxLinked: boolean;
  widgetPreviewFiltered: DiscordWidgetData | null;
  widgetsMatchAccent: boolean;
  setWidgetsMatchAccent: (v: boolean) => void;
  widgetCount: number;
  canEnableMore: boolean;
  widgetAccountAge: boolean;
  setWidgetAccountAge: (v: boolean) => void;
  widgetJoined: boolean;
  setWidgetJoined: (v: boolean) => void;
  widgetServerCount: boolean;
  setWidgetServerCount: (v: boolean) => void;
  widgetServerInvite: boolean;
  setWidgetServerInvite: (v: boolean) => void;
  widgetRobloxAccountAge: boolean;
  setWidgetRobloxAccountAge: (v: boolean) => void;
  widgetRobloxProfile: boolean;
  setWidgetRobloxProfile: (v: boolean) => void;
  githubUsernameInput: string;
  setGithubUsernameInput: (v: string) => void;
  widgetGithubLastPush: boolean;
  setWidgetGithubLastPush: (v: boolean) => void;
  widgetGithubPublicRepos: boolean;
  setWidgetGithubPublicRepos: (v: boolean) => void;
  widgetGithubContributions: boolean;
  setWidgetGithubContributions: (v: boolean) => void;
  selectedCryptoIds: string[];
  setSelectedCryptoIds: Dispatch<SetStateAction<string[]>>;
  discordInviteInput: string;
  setDiscordInviteInput: (v: string) => void;
  githubPreviewFiltered: GithubWidgetData | null;
  selectedGithubWidgetsCsv: string;
  cryptoPreviewData: CryptoWidgetData | null;
  slugValue: string;
  setSlugValue: (v: string) => void;
  slugCheck: "idle" | "checking" | "available" | "taken";
  setSlugCheck: (v: "idle" | "checking" | "available" | "taken") => void;
  debouncedCheckSlug: () => void;
  taglineValue: string;
  setTaglineValue: (v: string) => void;
  descriptionValue: string;
  setDescriptionValue: (v: string) => void;
  bannerValue: string;
  setBannerValue: (v: string) => void;
  avatarUrlValue: string;
  setAvatarUrlValue: (v: string) => void;
  avatarUploading: boolean;
  setAvatarUploading: (v: boolean) => void;
  avatarUploadError: string | null;
  setAvatarUploadError: (v: string | null) => void;
  avatarFileInputRef: RefObject<HTMLInputElement | null>;
  terminalCommandEntries: { command: string; output: string }[];
  setTerminalCommandEntries: Dispatch<SetStateAction<{ command: string; output: string }[]>>;
  cardEffectTilt: boolean;
  setCardEffectTilt: (v: boolean) => void;
  cardEffectSpotlight: boolean;
  setCardEffectSpotlight: (v: boolean) => void;
  cardEffectGlare: boolean;
  setCardEffectGlare: (v: boolean) => void;
  cardEffectMagneticBorder: boolean;
  setCardEffectMagneticBorder: (v: boolean) => void;
  cardOpacityValue: number;
  setCardOpacityValue: (v: number) => void;
  cardBlurValue: string;
  setCardBlurValue: (v: string) => void;
  customFontValue: string;
  setCustomFontValue: (v: string) => void;
  customFontUrlValue: string;
  setCustomFontUrlValue: (v: string) => void;
  customFontUploading: boolean;
  setCustomFontUploading: (v: boolean) => void;
  customFontUploadError: string | null;
  setCustomFontUploadError: (v: string | null) => void;
  customFontFileRef: RefObject<HTMLInputElement | null>;
  cursorStyleValue: string;
  setCursorStyleValue: (v: string) => void;
  cursorImageUrlValue: string;
  setCursorImageUrlValue: (v: string) => void;
  cursorUploading: boolean;
  setCursorUploading: (v: boolean) => void;
  cursorUploadError: string | null;
  setCursorUploadError: (v: string | null) => void;
  cursorFileRef: RefObject<HTMLInputElement | null>;
  backgroundTypeValue: string;
  setBackgroundTypeValue: (v: string) => void;
  backgroundUrlValue: string;
  setBackgroundUrlValue: (v: string) => void;
  backgroundUploading: boolean;
  backgroundUploadError: string | null;
  setBackgroundUploadError: (v: string | null) => void;
  backgroundFileInputRef: RefObject<HTMLInputElement | null>;
  backgroundAudioUrlValue: string;
  setBackgroundAudioUrlValue: (v: string) => void;
  backgroundAudioUploading: boolean;
  backgroundAudioUploadError: string | null;
  backgroundAudioFileRef: RefObject<HTMLInputElement | null>;
  backgroundAudioStartSecondsValue: string;
  setBackgroundAudioStartSecondsValue: (v: string) => void;
  backgroundDragOver: boolean;
  setBackgroundDragOver: (v: boolean) => void;
  audioDragOver: boolean;
  setAudioDragOver: (v: boolean) => void;
  backgroundEffectValue: string;
  setBackgroundEffectValue: (v: string) => void;
  handleBackgroundFileUpload: (file: File) => Promise<void>;
  handleBackgroundAudioUpload: (file: File) => Promise<void>;
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
};

export function ProfileEditorFormFields(p: ProfileEditorFormFieldsProps) {
  const { activeEditorSection, profile, versions, onVersionsSaved, onVersionsRestored, onVersionsDeleted } = p;
  return (
    <>
      <BasicsSection
        visible={activeEditorSection === "basics"}
        profile={profile}
        slugValue={p.slugValue}
        setSlugValue={p.setSlugValue}
        slugCheck={p.slugCheck}
        setSlugCheck={p.setSlugCheck}
        debouncedCheckSlug={p.debouncedCheckSlug}
        taglineValue={p.taglineValue}
        setTaglineValue={p.setTaglineValue}
        descriptionValue={p.descriptionValue}
        setDescriptionValue={p.setDescriptionValue}
        avatarUrlValue={p.avatarUrlValue}
        setAvatarUrlValue={p.setAvatarUrlValue}
        discordAvatarUrl={p.discordAvatarUrl}
        avatarUploading={p.avatarUploading}
        setAvatarUploading={p.setAvatarUploading}
        avatarUploadError={p.avatarUploadError}
        setAvatarUploadError={p.setAvatarUploadError}
        avatarFileInputRef={p.avatarFileInputRef}
      />
      <SectionTip sectionId="basics" profile={profile} activeSection={activeEditorSection} slugDraft={p.slugValue} />

      <DiscordSection
        visible={activeEditorSection === "discord"}
        profile={profile}
        availableDiscordBadges={p.availableDiscordBadges}
      />
      <SectionTip sectionId="discord" profile={profile} activeSection={activeEditorSection} />

      <ExtrasSection
        visible={activeEditorSection === "extras"}
        profile={profile}
        hasPremiumAccess={p.hasPremiumAccess}
        cardEffectTilt={p.cardEffectTilt}
        setCardEffectTilt={p.setCardEffectTilt}
        cardEffectSpotlight={p.cardEffectSpotlight}
        setCardEffectSpotlight={p.setCardEffectSpotlight}
        cardEffectGlare={p.cardEffectGlare}
        setCardEffectGlare={p.setCardEffectGlare}
        cardEffectMagneticBorder={p.cardEffectMagneticBorder}
        setCardEffectMagneticBorder={p.setCardEffectMagneticBorder}
      />
      <SectionTip sectionId="extras" profile={profile} activeSection={activeEditorSection} />

      <BannerSection
        visible={activeEditorSection === "banner"}
        profile={profile}
        bannerValue={p.bannerValue}
        setBannerValue={p.setBannerValue}
      />
      <SectionTip sectionId="banner" profile={profile} activeSection={activeEditorSection} bannerDraft={p.bannerValue} />

      <TerminalSection
        visible={activeEditorSection === "terminal"}
        profile={profile}
        terminalCommandEntries={p.terminalCommandEntries}
        setTerminalCommandEntries={p.setTerminalCommandEntries}
      />
      <SectionTip sectionId="terminal" profile={profile} activeSection={activeEditorSection} />

      <FunSection
        visible={activeEditorSection === "fun"}
        profile={profile}
        hasPremiumAccess={p.hasPremiumAccess}
        cardOpacityValue={p.cardOpacityValue}
        setCardOpacityValue={p.setCardOpacityValue}
        cardBlurValue={p.cardBlurValue}
        setCardBlurValue={p.setCardBlurValue}
        customFontValue={p.customFontValue}
        setCustomFontValue={p.setCustomFontValue}
        customFontUrlValue={p.customFontUrlValue}
        setCustomFontUrlValue={p.setCustomFontUrlValue}
        customFontUploading={p.customFontUploading}
        setCustomFontUploading={p.setCustomFontUploading}
        customFontUploadError={p.customFontUploadError}
        setCustomFontUploadError={p.setCustomFontUploadError}
        customFontFileRef={p.customFontFileRef}
        cursorStyleValue={p.cursorStyleValue}
        setCursorStyleValue={p.setCursorStyleValue}
        cursorImageUrlValue={p.cursorImageUrlValue}
        setCursorImageUrlValue={p.setCursorImageUrlValue}
        cursorUploading={p.cursorUploading}
        setCursorUploading={p.setCursorUploading}
        cursorUploadError={p.cursorUploadError}
        setCursorUploadError={p.setCursorUploadError}
        cursorFileRef={p.cursorFileRef}
        backgroundTypeValue={p.backgroundTypeValue}
        setBackgroundTypeValue={p.setBackgroundTypeValue}
        backgroundUrlValue={p.backgroundUrlValue}
        setBackgroundUrlValue={p.setBackgroundUrlValue}
        backgroundUploading={p.backgroundUploading}
        backgroundUploadError={p.backgroundUploadError}
        setBackgroundUploadError={p.setBackgroundUploadError}
        backgroundFileInputRef={p.backgroundFileInputRef}
        backgroundAudioUrlValue={p.backgroundAudioUrlValue}
        setBackgroundAudioUrlValue={p.setBackgroundAudioUrlValue}
        backgroundAudioUploading={p.backgroundAudioUploading}
        backgroundAudioUploadError={p.backgroundAudioUploadError}
        backgroundAudioFileRef={p.backgroundAudioFileRef}
        backgroundAudioStartSecondsValue={p.backgroundAudioStartSecondsValue}
        setBackgroundAudioStartSecondsValue={p.setBackgroundAudioStartSecondsValue}
        backgroundDragOver={p.backgroundDragOver}
        setBackgroundDragOver={p.setBackgroundDragOver}
        audioDragOver={p.audioDragOver}
        setAudioDragOver={p.setAudioDragOver}
        backgroundEffectValue={p.backgroundEffectValue}
        setBackgroundEffectValue={p.setBackgroundEffectValue}
        handleBackgroundFileUpload={p.handleBackgroundFileUpload}
        handleBackgroundAudioUpload={p.handleBackgroundAudioUpload}
      />
      <SectionTip sectionId="fun" profile={profile} activeSection={activeEditorSection} />

      <WidgetsSection
        visible={activeEditorSection === "widgets"}
        profile={profile}
        baseProfileForPreview={p.baseProfileForPreview}
        robloxLinked={p.robloxLinked}
        widgetPreviewFiltered={p.widgetPreviewFiltered}
        widgetsMatchAccent={p.widgetsMatchAccent}
        setWidgetsMatchAccent={p.setWidgetsMatchAccent}
        widgetCount={p.widgetCount}
        canEnableMore={p.canEnableMore}
        widgetAccountAge={p.widgetAccountAge}
        setWidgetAccountAge={p.setWidgetAccountAge}
        widgetJoined={p.widgetJoined}
        setWidgetJoined={p.setWidgetJoined}
        widgetServerCount={p.widgetServerCount}
        setWidgetServerCount={p.setWidgetServerCount}
        widgetServerInvite={p.widgetServerInvite}
        setWidgetServerInvite={p.setWidgetServerInvite}
        widgetRobloxAccountAge={p.widgetRobloxAccountAge}
        setWidgetRobloxAccountAge={p.setWidgetRobloxAccountAge}
        widgetRobloxProfile={p.widgetRobloxProfile}
        setWidgetRobloxProfile={p.setWidgetRobloxProfile}
        githubUsernameInput={p.githubUsernameInput}
        setGithubUsernameInput={p.setGithubUsernameInput}
        widgetGithubLastPush={p.widgetGithubLastPush}
        setWidgetGithubLastPush={p.setWidgetGithubLastPush}
        widgetGithubPublicRepos={p.widgetGithubPublicRepos}
        setWidgetGithubPublicRepos={p.setWidgetGithubPublicRepos}
        widgetGithubContributions={p.widgetGithubContributions}
        setWidgetGithubContributions={p.setWidgetGithubContributions}
        selectedCryptoIds={p.selectedCryptoIds}
        setSelectedCryptoIds={p.setSelectedCryptoIds}
        discordInviteInput={p.discordInviteInput}
        setDiscordInviteInput={p.setDiscordInviteInput}
        githubPreviewFiltered={p.githubPreviewFiltered}
        selectedGithubWidgetsCsv={p.selectedGithubWidgetsCsv}
        cryptoPreviewData={p.cryptoPreviewData}
      />
      <SectionTip sectionId="widgets" profile={profile} activeSection={activeEditorSection} />

      <AudioSection
        visible={activeEditorSection === "audio"}
        showAudioPlayerValue={p.showAudioPlayerValue}
        setShowAudioPlayerValue={p.setShowAudioPlayerValue}
        audioVisualizerStyleValue={p.audioVisualizerStyleValue}
        setAudioVisualizerStyleValue={p.setAudioVisualizerStyleValue}
        audioTracksValue={p.audioTracksValue}
        setAudioTracksValue={p.setAudioTracksValue}
        audioTrackUploading={p.audioTrackUploading}
        audioTrackUploadError={p.audioTrackUploadError}
        audioTrackFileRef={p.audioTrackFileRef}
        audioTracksDragOver={p.audioTracksDragOver}
        setAudioTracksDragOver={p.setAudioTracksDragOver}
        editingTrackIndex={p.editingTrackIndex}
        setEditingTrackIndex={p.setEditingTrackIndex}
        editingTrackTitle={p.editingTrackTitle}
        setEditingTrackTitle={p.setEditingTrackTitle}
        draggedTrackIndex={p.draggedTrackIndex}
        setDraggedTrackIndex={p.setDraggedTrackIndex}
        handleAudioTrackUpload={p.handleAudioTrackUpload}
        moveTrack={p.moveTrack}
      />
      <SectionTip sectionId="audio" profile={profile} activeSection={activeEditorSection} audioTrackCount={p.audioTracksValue.length} />

      {activeEditorSection === "versions" && (
        <Suspense fallback={null}>
          <VersionsSectionLazy
            visible
            profile={profile}
            versions={versions}
            onSaved={onVersionsSaved}
            onRestored={onVersionsRestored}
            onDeleted={onVersionsDeleted}
          />
        </Suspense>
      )}
      <SectionTip sectionId="versions" profile={profile} activeSection={activeEditorSection} />
    </>
  );
}
