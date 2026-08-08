import { mockEvents, mockPendingCommands } from "./mock";
import type { AnomalyEvent, PendingCommand } from "./types";

/**
 * REST layer for anomaly events and the human approval queue.
 *
 * TODO(backend): these hit /api/events, /api/commands/pending and
 * /api/commands/:id/authorize. Until those exist each call falls back to mock
 * fixtures so the console stays operable.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function getApiUrl(path: string = ""): string {
  if (path.startsWith("http")) return path;
  if (import.meta.env["VITE_API_BASE_URL"]) {
    const base = import.meta.env["VITE_API_BASE_URL"].replace(/\/$/, "");
    return `${base}${path}`;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  if (host !== "localhost" && host !== "127.0.0.1") {
    return `https://smoa-backend.onrender.com${path}`;
  }
  return `http://localhost:8000${path}`;
}

async function getJson<T>(url: string, fallback: () => T): Promise<T> {
  try {
    const res = await fetch(getApiUrl(url), { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    await delay(320);
    return fallback();
  }
}

export function fetchEvents(): Promise<AnomalyEvent[]> {
  return getJson("/api/events", mockEvents);
}

export function fetchPendingCommands(): Promise<PendingCommand[]> {
  return getJson("/api/commands/pending", mockPendingCommands);
}

export async function authorizeCommand(
  id: string,
  decision: "approve" | "reject",
  operatorNote?: string,
): Promise<{ id: string; state: "approved" | "rejected" }> {
  try {
    const res = await fetch(getApiUrl(`/api/commands/${id}/authorize`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, operatorNote }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { id: string; state: "approved" | "rejected" };
  } catch {
    await delay(420);
    return { id, state: decision === "approve" ? "approved" : "rejected" };
  }
}

export async function setTelemetrySourceApi(source: "simulator" | "digital-twin"): Promise<void> {
  try {
    await fetch(getApiUrl("/api/telemetry/source"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });
  } catch (e) {
    console.warn("Failed to set telemetry source via backend API, using local state", e);
  }
}

export function formatMet(met: number | null | undefined) {
  if (met === null || met === undefined || isNaN(met)) return "000:00:00:00";
  const d = Math.floor(met / 86400);
  const h = Math.floor((met % 86400) / 3600);
  const m = Math.floor((met % 3600) / 60);
  const s = Math.floor(met % 60);
  const p = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${p(d, 3)}:${p(h)}:${p(m)}:${p(s)}`;
}

export function formatClock(ts: number | null | undefined) {
  if (!ts || isNaN(ts)) return "--:--:--Z";
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "--:--:--Z";
    return d.toISOString().slice(11, 19) + "Z";
  } catch {
    return "--:--:--Z";
  }
}

export function timeAgo(ts: number | null | undefined) {
  if (!ts || isNaN(ts)) return "just now";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}
