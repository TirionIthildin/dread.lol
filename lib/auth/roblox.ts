/**
 * Roblox OAuth 2.0 – authorize URL, token exchange, user info.
 * Register an app at https://create.roblox.com/dashboard/credentials (OAuth tab)
 * and set ROBLOX_OAUTH_CLIENT_ID, ROBLOX_OAUTH_CLIENT_SECRET.
 * Add redirect URI: {origin}/api/auth/roblox/callback
 *
 * Scopes: openid profile (for user ID, display name, username, created_at, profile URL, avatar)
 */
import crypto from "node:crypto";

const ROBLOX_AUTHORIZE = "https://apis.roblox.com/oauth/v1/authorize";
const ROBLOX_TOKEN = "https://apis.roblox.com/oauth/v1/token";
const ROBLOX_USERINFO = "https://apis.roblox.com/oauth/v1/userinfo";
const DEFAULT_SCOPES = "openid profile";

function getConfig() {
  const clientId = process.env.ROBLOX_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.ROBLOX_OAUTH_CLIENT_SECRET?.trim();
  const baseUrl =
    process.env.ROBLOX_OAUTH_REDIRECT_URI?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  const redirectUri = baseUrl.includes("/api/auth/roblox")
    ? baseUrl
    : `${baseUrl.replace(/\/$/, "")}/api/auth/roblox/callback`;
  if (!clientId) throw new Error("ROBLOX_OAUTH_CLIENT_ID is not set");
  if (!clientSecret) throw new Error("ROBLOX_OAUTH_CLIENT_SECRET is not set");
  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate a random state for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Build the Roblox authorization URL. Redirect the user here to link their account.
 */
export function getAuthorizeUrl(options: { state: string; scope?: string }): string {
  const { redirectUri, clientId } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: options.scope ?? DEFAULT_SCOPES,
    state: options.state,
  });
  return `${ROBLOX_AUTHORIZE}?${params.toString()}`;
}

export interface RobloxTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCode(code: string): Promise<RobloxTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(ROBLOX_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roblox token exchange failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<RobloxTokenResponse>;
}

export interface RobloxUserInfo {
  sub: string;
  name?: string;
  nickname?: string;
  preferred_username?: string;
  created_at?: number;
  profile?: string;
  picture?: string | null;
}

/**
 * Fetch current user from Roblox (requires openid + profile scope).
 */
export async function getUserInfo(accessToken: string): Promise<RobloxUserInfo> {
  const res = await fetch(ROBLOX_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roblox userinfo failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<RobloxUserInfo>;
}
