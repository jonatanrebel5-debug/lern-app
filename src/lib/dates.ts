/**
 * Datums-Hilfen auf Basis von Kalendertagen im lokalen Format "YYYY-MM-DD".
 * Bewusst lokale Zeit (nicht UTC): "heute" soll der Tag sein, den das iPhone anzeigt.
 * Solche Schlüssel lassen sich direkt als Strings vergleichen ("2026-11-15" < "2026-11-16").
 */

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value);
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Anzahl Kalendertage von `from` bis `to` (positiv = `to` liegt in der Zukunft). */
export function diffDays(from: string, to: string): number {
  return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / 86_400_000);
}

/** Verschiebt einen Kalendertag um `days` Tage (auch negativ). Robust bei Sommer-/Winterzeit. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}
