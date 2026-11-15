import { parseReport, type ProgressReport } from "./report";

/**
 * Minimaler Upstash-Redis-Zugriff über die REST-API (kein Zusatzpaket nötig).
 * Nur auf dem Server verwenden – der Token darf nie in den Browser gelangen.
 *
 * Unterstützt beide Namensvarianten, die die Vercel-Integration setzen kann:
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   oder
 *   KV_REST_API_URL / KV_REST_API_TOKEN (alte Vercel-KV-Namen)
 */

export const REPORT_KEY = "lern-app:report:v1";
const TIMEOUT_MS = 5000;

interface RedisConfig {
  url: string;
  token: string;
}

export function getRedisConfig(): RedisConfig | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim();
  // Online nur HTTPS; im Entwicklungsmodus auch ein lokaler Test-Server (http://localhost:…)
  const allowed = url?.startsWith("https://") || (process.env.NODE_ENV !== "production" && url?.startsWith("http://localhost:"));
  if (!url || !token || !allowed) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

async function command(config: RedisConfig, args: string[]): Promise<unknown> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null;
  if (!res.ok || !json || json.error) throw new Error(`Redis-Fehler (${res.status}): ${json?.error ?? "unbekannt"}`);
  return json.result;
}

export async function saveReport(config: RedisConfig, report: ProgressReport): Promise<void> {
  await command(config, ["SET", REPORT_KEY, JSON.stringify(report)]);
}

/** null = noch nichts gespeichert (oder gespeicherter Inhalt unbrauchbar) */
export async function loadReport(config: RedisConfig): Promise<ProgressReport | null> {
  const raw = await command(config, ["GET", REPORT_KEY]);
  if (typeof raw !== "string") return null;
  try {
    return parseReport(JSON.parse(raw));
  } catch {
    return null;
  }
}
