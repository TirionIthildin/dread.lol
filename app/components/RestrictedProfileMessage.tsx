import { ShieldWarning } from "@phosphor-icons/react/dist/ssr";

export default function RestrictedProfileMessage() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-12 text-center"
      role="status"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
        <ShieldWarning size={32} weight="duotone" className="text-[var(--warning)]" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
        This profile has been restricted
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
        This profile has been restricted due to either a billing issue or being terminated.
      </p>
    </div>
  );
}
