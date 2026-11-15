import type { ProgressReport } from "./report";

/**
 * Lädt die Lernstand-Zusammenfassung zum Server hoch. Wirft nie – liefert ein Ergebnis:
 *  ok              gespeichert
 *  not-configured  kein Cloud-Speicher verbunden (z. B. lokal ohne Upstash) → einfach überspringen
 *  forbidden       Gerät ist nicht mit dem Lern-Code freigeschaltet (z. B. Ausbilder-Gerät)
 *  error           Netzwerk-/Serverfehler → beim nächsten Anlass erneut versuchen
 */
export type SyncResult = "ok" | "not-configured" | "forbidden" | "error";

export async function uploadReport(report: ProgressReport, options: { keepalive?: boolean } = {}): Promise<SyncResult> {
  try {
    const res = await fetch("/api/report", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      // keepalive: Upload läuft weiter, auch wenn die App gerade in den Hintergrund geht
      keepalive: options.keepalive,
      cache: "no-store",
    });
    if (res.ok) return "ok";
    if (res.status === 503) return "not-configured";
    if (res.status === 401 || res.status === 403) return "forbidden";
    return "error";
  } catch {
    return "error";
  }
}
