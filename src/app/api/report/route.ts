import { cookies } from "next/headers";
import { ACCESS_COOKIE, getAuthConfig, roleFromToken } from "@/lib/auth";
import { getRedisConfig, loadReport, saveReport } from "@/lib/redis";
import { parseReport } from "@/lib/report";

/**
 * /api/report – Lernstand-Zusammenfassung für die Ausbilder-Ansicht.
 *   GET  (Lern- & Ausbilder-Rolle): lesen
 *   PUT  (nur Lern-Rolle):          speichern
 * Ohne Redis-Konfiguration antwortet die API mit "not-configured" statt mit einem Fehler.
 * (Der Proxy prüft die Rolle bereits – hier wird zur Sicherheit nochmal geprüft.)
 */

const MAX_BODY_BYTES = 50_000;

async function currentRole() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return roleFromToken(token, getAuthConfig());
}

export async function GET() {
  const role = await currentRole();
  if (!role) return Response.json({ status: "locked" }, { status: 401 });

  const redis = getRedisConfig();
  if (!redis) return Response.json({ status: "not-configured", role });

  try {
    const report = await loadReport(redis);
    return Response.json(report ? { status: "ok", role, report } : { status: "empty", role }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[report] Laden fehlgeschlagen:", error);
    return Response.json({ status: "error", role }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  const role = await currentRole();
  if (role !== "learner") return Response.json({ status: "forbidden" }, { status: role ? 403 : 401 });

  const redis = getRedisConfig();
  if (!redis) return Response.json({ status: "not-configured" }, { status: 503 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return Response.json({ status: "too-large" }, { status: 413 });

  let report;
  try {
    report = parseReport(JSON.parse(text));
  } catch {
    report = null;
  }
  if (!report) return Response.json({ status: "invalid" }, { status: 400 });

  try {
    await saveReport(redis, report);
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("[report] Speichern fehlgeschlagen:", error);
    return Response.json({ status: "error" }, { status: 502 });
  }
}
