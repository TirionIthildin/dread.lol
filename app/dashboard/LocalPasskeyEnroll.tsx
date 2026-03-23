"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import { Fingerprint } from "@phosphor-icons/react";

/**
 * Lets a signed-in local user register an additional WebAuthn passkey (session required by API).
 */
export function LocalPasskeyEnroll() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const optRes = await fetch("/api/auth/webauthn/registration/options");
      const optsJson = (await optRes.json()) as
        | PublicKeyCredentialCreationOptionsJSON
        | { error?: string };
      if (!optRes.ok) {
        const err = optsJson as { error?: string };
        setError(err.error ?? "Could not start passkey registration.");
        return;
      }
      const att = await startRegistration({ optionsJSON: optsJson as PublicKeyCredentialCreationOptionsJSON });
      const verifyRes = await fetch("/api/auth/webauthn/registration/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: att }),
      });
      const verifyData = (await verifyRes.json()) as { error?: string; ok?: boolean };
      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Passkey registration failed.");
        return;
      }
      setMessage("Passkey added. You can use it to sign in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Passkey cancelled or failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Fingerprint className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" weight="duotone" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">Passkey</p>
          <p className="text-xs text-[var(--muted)]">
            Add a passkey on this device for passwordless sign-in (in addition to your password, if you set one).
          </p>
          {error ? (
            <p className="text-xs text-[var(--warning)]" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="text-xs text-[var(--accent)]">{message}</p> : null}
          <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            {loading ? "Working…" : "Add passkey"}
          </button>
        </div>
      </div>
    </div>
  );
}
