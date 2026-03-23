"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { generateSalt, generateVerifier, SrpClientSession } from "@/lib/srp/srp6a";
import { normalizeLocalUsername } from "@/lib/auth/username";

type Mode = "login" | "register";

export default function LocalAuthForms() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const u = normalizeLocalUsername(username);
    if (u.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const salt = generateSalt();
      const verifier = generateVerifier(u, password, salt);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: u,
          email: email.trim().toLowerCase(),
          srpSalt: salt,
          srpVerifier: verifier,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      setMessage(data.message ?? "Check your email.");
      setPassword("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function onSrpLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const u = normalizeLocalUsername(username);
    if (u.length < 3 || password.length < 1) {
      setError("Enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const start = await fetch("/api/auth/srp/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const startData = (await start.json()) as { error?: string; sessionId?: string; salt?: string; B?: string };
      if (!start.ok) {
        setError(startData.error ?? "Login failed");
        return;
      }
      const { sessionId, salt, B } = startData;
      if (!sessionId || !salt || !B) {
        setError("Invalid server response");
        return;
      }
      const client = new SrpClientSession(u, password);
      const A = client.publicValue;
      client.setServerPublic(B, salt);
      const M1 = client.clientProof();
      const complete = await fetch("/api/auth/srp/login/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, A, M1 }),
        credentials: "include",
      });
      const completeData = (await complete.json()) as { error?: string; M2?: string; ok?: boolean };
      if (!complete.ok) {
        setError(completeData.error ?? "Login failed");
        return;
      }
      if (completeData.M2 && !client.verifyServerProof(completeData.M2)) {
        setError("Server verification failed");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function onPasskeyLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const u = normalizeLocalUsername(username);
    if (u.length < 3) {
      setError("Enter your username.");
      return;
    }
    setLoading(true);
    try {
      const optsRes = await fetch("/api/auth/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u }),
      });
      const optsData = (await optsRes.json()) as {
        error?: string;
        options?: Parameters<typeof startAuthentication>[0]["optionsJSON"];
        sessionKey?: string;
      };
      if (!optsRes.ok) {
        setError(optsData.error ?? "Passkey login unavailable");
        return;
      }
      if (!optsData.options || !optsData.sessionKey) {
        setError("Invalid server response");
        return;
      }
      const assertion = await startAuthentication({ optionsJSON: optsData.options });
      const verifyRes = await fetch("/api/auth/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey: optsData.sessionKey, response: assertion }),
        credentials: "include",
      });
      if (!verifyRes.ok) {
        const err = (await verifyRes.json()) as { error?: string };
        setError(err.error ?? "Passkey verification failed");
        return;
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey cancelled or failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-3">
      <div className="flex gap-2 text-[10px]">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded px-2 py-1 font-medium ${
            mode === "login" ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          Local login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded px-2 py-1 font-medium ${
            mode === "register" ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          Register
        </button>
      </div>

      {mode === "register" ? (
        <form onSubmit={onRegister} className="space-y-2">
          <input
            className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={loading}
          />
          <input
            className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
          <input
            className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]"
            placeholder="Password (never sent to server)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[var(--accent)]/20 px-2 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/30 disabled:opacity-50"
          >
            {loading ? "…" : "Register & verify email"}
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <form onSubmit={onSrpLogin} className="space-y-2">
            <input
              className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
            <input
              className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50"
            >
              {loading ? "…" : "Sign in (SRP)"}
            </button>
          </form>
          <form onSubmit={onPasskeyLogin}>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[var(--border)] px-2 py-1.5 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              Sign in with passkey (username above)
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-[10px] text-[var(--warning)]">{error}</p>}
      {message && <p className="text-[10px] text-[var(--accent)]">{message}</p>}
      <p className="text-[9px] text-[var(--muted)] leading-tight">
        Passwords use SRP-6a: only a verifier is stored. Add a passkey from the dashboard after login.
      </p>
    </div>
  );
}
