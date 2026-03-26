import type { ReactNode } from "react";
import {
  BookOpen,
  Link as LinkIcon,
  Image as ImageIcon,
  SlidersHorizontal,
  Terminal,
  MessageCircle,
  Music,
  ListTodo,
  LayoutGrid,
  History,
} from "lucide-react";
import type { EditorSectionId } from "./types";

const dashIcon = { size: 18, className: "shrink-0" };

export const EDITOR_SECTIONS: { id: EditorSectionId; label: string; icon: ReactNode }[] = [
  { id: "basics", label: "Basics", icon: <BookOpen {...dashIcon} aria-hidden /> },
  { id: "extras", label: "Extras", icon: <ListTodo {...dashIcon} aria-hidden /> },
  { id: "discord", label: "Discord", icon: <MessageCircle {...dashIcon} aria-hidden /> },
  { id: "links", label: "Links", icon: <LinkIcon {...dashIcon} aria-hidden /> },
  { id: "banner", label: "Text art", icon: <ImageIcon {...dashIcon} aria-hidden /> },
  { id: "terminal", label: "Terminal", icon: <Terminal {...dashIcon} aria-hidden /> },
  { id: "fun", label: "Styling", icon: <SlidersHorizontal {...dashIcon} aria-hidden /> },
  { id: "widgets", label: "Widgets", icon: <LayoutGrid {...dashIcon} aria-hidden /> },
  { id: "audio", label: "Audio Player", icon: <Music {...dashIcon} aria-hidden /> },
  { id: "versions", label: "Versions", icon: <History {...dashIcon} aria-hidden /> },
];
