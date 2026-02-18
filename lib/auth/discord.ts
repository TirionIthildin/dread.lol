/**
 * Discord OAuth 2.0 – authorize URL, token exchange, user info.
 * Create an app at https://discord.com/developers/applications and set
 * DISCORD_OAUTH_CLIENT_ID, DISCORD_OAUTH_CLIENT_SECRET, AUTH_REDIRECT_URI.
 * Add redirect URI in the app: {origin}/api/auth/discord/callback
 */
import crypto from "node:crypto";

const DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize";
const DISCORD_TOKEN = "https://discord.com/api/oauth2/token";
const DISCORD_USER_ME = "https://discord.com/api/users/@me";
const DEFAULT_SCOPES = "identify";

function getConfig() {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.AUTH_REDIRECT_URI?.trim();
  const missing: string[] = [];
  if (!clientId) missing.push("DISCORD_OAUTH_CLIENT_ID");
  if (!clientSecret) missing.push("DISCORD_OAUTH_CLIENT_SECRET");
  if (!redirectUri) missing.push("AUTH_REDIRECT_URI");
  if (missing.length > 0) {
    throw new Error(
      `Missing or empty in .env: ${missing.join(", ")}. Restart the dev server after changing .env.`
    );
  }
  return { clientId: clientId!, clientSecret: clientSecret!, redirectUri: redirectUri! };
}

/**
 * Generate a random state for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Build the Discord authorization URL. Redirect the user here to sign in.
 */
export function getAuthorizeUrl(options: {
  state: string;
  scope?: string;
}): string {
  const { redirectUri, clientId } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: options.scope ?? DEFAULT_SCOPES,
    state: options.state,
  });
  return `${DISCORD_AUTHORIZE}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(DISCORD_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
}

/**
 * Fetch current user from Discord (requires identify scope).
 */
export async function getUserInfo(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(DISCORD_USER_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord userinfo failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<DiscordUser>;
}

/**
 * Build Discord CDN avatar URL. Returns default avatar URL if no avatar hash.
 */
export function getAvatarUrl(user: DiscordUser, size = 128): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }
  const index = Number.parseInt(user.discriminator, 10) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${Number.isNaN(index) ? 0 : index}.png`;
}
