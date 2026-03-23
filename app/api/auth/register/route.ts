import { NextRequest, NextResponse } from "next/server";
import { localRegisterSchema } from "@/lib/api-schemas";
import { getPendingTokenForEmail, newToken, setPendingRegistration } from "@/lib/auth/auth-valkey";
import { findLocalUserByEmail, findLocalUserByUsername } from "@/lib/auth/local-account";
import { newLocalUserId } from "@/lib/auth/local-ids";
import { isValidLocalUsername, normalizeEmail, normalizeLocalUsername } from "@/lib/auth/username";
import { sendVerificationEmail } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import { rateLimitByIp } from "@/lib/rate-limit";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 3600;

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp(request, "auth-register", REGISTER_LIMIT, REGISTER_WINDOW);
  if (!limit.allowed) return limit.response;

  try {
    const body = localRegisterSchema.parse(await request.json());
    const username = normalizeLocalUsername(body.username);
    const email = normalizeEmail(body.email);
    if (!isValidLocalUsername(username)) {
      return NextResponse.json({ error: "Username must be 3–32 characters (letters, numbers, _, -)." }, { status: 400 });
    }

    const [dupUser, dupEmail] = await Promise.all([
      findLocalUserByUsername(username),
      findLocalUserByEmail(email),
    ]);
    if (dupUser) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }
    if (dupEmail) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const pendingEmailKey = email;
    const existingPending = await getPendingTokenForEmail(pendingEmailKey);
    if (existingPending) {
      return NextResponse.json(
        { error: "Registration already pending for this email. Check your inbox or wait before retrying." },
        { status: 409 }
      );
    }

    const userId = newLocalUserId();
    const token = newToken();
    await setPendingRegistration(token, pendingEmailKey, {
      userId,
      username,
      email,
      srpSalt: body.srpSalt.toLowerCase(),
      srpVerifier: body.srpVerifier.toLowerCase(),
    });

    const sent = await sendVerificationEmail(email, token);
    if (!sent.ok) {
      logger.error("AuthRegister", "Resend failed:", sent.error);
      return NextResponse.json(
        { error: sent.error ?? "Email could not be sent. Try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, message: "Check your email to verify your account." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
