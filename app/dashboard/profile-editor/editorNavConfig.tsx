import type { ReactNode } from "react";
import {
  Notebook,
  Link as LinkIcon,
  Image as ImageIcon,
  SlidersHorizontal,
  Terminal,
  DiscordLogo,
  MusicNotes,
  ListChecks,
  SquaresFour,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import type { EditorSectionId } from "./types";

const dashIcon = { size: 18, weight: "regular" as const, className: "shrink-0" };

export const EDITOR_SECTIONS: { id: EditorSectionId; label: string; icon: ReactNode }[] = [
  { id: "basics", label: "Basics", icon: <Notebook {...dashIcon} aria-hidden /> },
  { id: "extras", label: "Extras", icon: <ListChecks {...dashIcon} aria-hidden /> },
  { id: "discord", label: "Discord", icon: <DiscordLogo {...dashIcon} aria-hidden /> },
  { id: "links", label: "Links", icon: <LinkIcon {...dashIcon} aria-hidden /> },
  { id: "banner", label: "Text art", icon: <ImageIcon {...dashIcon} aria-hidden /> },
  { id: "terminal", label: "Terminal", icon: <Terminal {...dashIcon} aria-hidden /> },
  { id: "fun", label: "Styling", icon: <SlidersHorizontal {...dashIcon} aria-hidden /> },
  { id: "widgets", label: "Widgets", icon: <SquaresFour {...dashIcon} aria-hidden /> },
  { id: "audio", label: "Audio Player", icon: <MusicNotes {...dashIcon} aria-hidden /> },
  { id: "versions", label: "Versions", icon: <ClockCounterClockwise {...dashIcon} aria-hidden /> },
];
