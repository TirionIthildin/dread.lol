export type EditorSectionId =
  | "basics"
  | "discord"
  | "extras"
  | "links"
  | "banner"
  | "terminal"
  | "fun"
  | "widgets"
  | "audio"
  | "versions";

export const EDITOR_SECTION_IDS: EditorSectionId[] = [
  "basics",
  "extras",
  "discord",
  "links",
  "banner",
  "terminal",
  "fun",
  "widgets",
  "audio",
  "versions",
];

export function parseEditorSectionId(raw: string | null): EditorSectionId | null {
  if (!raw) return null;
  return EDITOR_SECTION_IDS.includes(raw as EditorSectionId) ? (raw as EditorSectionId) : null;
}
