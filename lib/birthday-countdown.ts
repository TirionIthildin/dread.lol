/**
 * Birthday countdown (month + day only, no year).
 * Returns a short string for display on profiles.
 */
export function getBirthdayCountdown(mmdd: string): string {
  const match = /^(\d{2})-(\d{2})$/.exec(mmdd?.trim() ?? "");
  if (!match) return "";
  const month = parseInt(match[1], 10) - 1;
  const day = parseInt(match[2], 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month, day);
  next.setHours(0, 0, 0, 0);
  const diffMs = next.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today's their birthday!";
  if (diffDays === 1) return "Tomorrow!";
  if (diffDays < 365) return `${diffDays} days until their birthday`;
  return "";
}
