import { Resend } from "resend";
import { getCanonicalOrigin } from "@/lib/site";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
}

/** Non-secret snapshot for admin UI (env-based configuration). */
export function getResendAdminSnapshot(): {
  apiKeyConfigured: boolean;
  /** Last 4 characters of the key when set, for sanity checks without exposing the secret */
  apiKeySuffix: string | null;
  emailFrom: string;
  usingDefaultFromAddress: boolean;
  canonicalOrigin: string;
} {
  const key = process.env.RESEND_API_KEY?.trim();
  const emailFromEnv = process.env.EMAIL_FROM?.trim();
  return {
    apiKeyConfigured: Boolean(key),
    apiKeySuffix: key && key.length >= 4 ? key.slice(-4) : key ? key : null,
    emailFrom: getFrom(),
    usingDefaultFromAddress: !emailFromEnv,
    canonicalOrigin: getCanonicalOrigin(),
  };
}

/**
 * Send a one-off test message (admin tooling). Does not log the API key.
 */
export async function sendAdminTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }
  const origin = getCanonicalOrigin();
  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [to.trim()],
    subject: "Dread.Lol — Resend test",
    text: `This is a test email from Dread.Lol.\n\nIf you received this, Resend is working.\n\nSite origin used for auth links: ${origin}\n`,
    html: `<p>This is a test email from <strong>Dread.Lol</strong>.</p><p>If you received this, Resend is working.</p><p class="muted">Site origin used for auth links: <code>${origin}</code></p>`,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendVerificationEmail(to: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }
  const origin = getCanonicalOrigin();
  const url = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [to],
    subject: "Verify your email — Dread.Lol",
    text: `Click to verify your email and finish creating your account:\n\n${url}\n\nIf you did not sign up, ignore this message.`,
    html: `<p>Click to verify your email:</p><p><a href="${url}">${url}</a></p>`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
