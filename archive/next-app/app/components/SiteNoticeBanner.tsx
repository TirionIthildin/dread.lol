import type { SiteNoticeVariant } from "@/lib/site-notice-settings-shared";

const variantClass: Record<SiteNoticeVariant, string> = {
  info: "border-[var(--accent)]/40 bg-[var(--accent-muted)] text-[var(--foreground)]",
  warning: "border-[var(--warning)]/50 bg-[var(--warning)]/10 text-[var(--foreground)]",
  critical: "border-red-500/50 bg-red-500/10 text-[var(--foreground)]",
};

export default function SiteNoticeBanner({
  message,
  variant,
}: {
  message: string;
  variant: SiteNoticeVariant;
}) {
  return (
    <div
      role="region"
      aria-label="Site notice"
      className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono leading-snug ${variantClass[variant]}`}
    >
      <p className="whitespace-pre-wrap break-words">{message}</p>
    </div>
  );
}
