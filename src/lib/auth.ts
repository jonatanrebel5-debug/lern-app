import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Zugriffsschutz per Code – läuft ausschließlich auf dem Server (proxy.ts + /api/*).
 *
 * Zwei Rollen:
 *  - "learner": ACCESS_CODE  → komplette Lern-App
 *  - "trainer": TRAINER_CODE → nur die schreibgeschützte Ausbilder-Ansicht (/ausbilder)
 *
 * Ablauf:
 *  1. Ohne gültiges Cookie leitet der Proxy zu /unlock um.
 *  2. /api/unlock prüft den Code und setzt ein httpOnly-Cookie "rolle.signatur" (~400 Tage).
 *  3. Bei jedem Aufruf prüft der Proxy die Signatur und was die Rolle darf.
 *
 * Die Signatur ist ein HMAC über Rolle + aktuellen Code mit dem geheimen AUTH_SECRET:
 * → ohne AUTH_SECRET nicht fälschbar, Rolle nicht austauschbar
 * → ändert man einen Code, sind genau die Geräte dieser Rolle wieder gesperrt.
 */

export type Role = "learner" | "trainer";

export const ACCESS_COOKIE = "lern-app-access";
/** Browser begrenzen Cookies auf max. 400 Tage */
export const ACCESS_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
export const MIN_CODE_LENGTH = 6;

export interface AuthConfig {
  secret: string;
  codes: Partial<Record<Role, string>>;
}

function readCode(value: string | undefined): string | undefined {
  const code = value?.trim();
  return code && code.length >= MIN_CODE_LENGTH ? code : undefined;
}

/** Liest die Konfiguration; null, wenn nicht (sinnvoll) eingerichtet → App bleibt gesperrt. */
export function getAuthConfig(): AuthConfig | null {
  const secret = process.env.AUTH_SECRET?.trim();
  const learner = readCode(process.env.ACCESS_CODE);
  if (!secret || secret.length < 32 || !learner) return null;

  const trainer = readCode(process.env.TRAINER_CODE);
  return {
    secret,
    // Gleicher Code für beide Rollen wäre mehrdeutig → Ausbilder-Zugang dann deaktiviert.
    codes: trainer && trainer !== learner ? { learner, trainer } : { learner },
  };
}

function signature(role: Role, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`lern-app-access:v2:${role}:${code}`).digest("base64url");
}

/** Vergleich in konstanter Zeit (verrät nicht über die Antwortzeit, wie viel stimmt). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Welche Rolle gehört zu diesem Code? null = falscher Code. Prüft immer alle Rollen (gleiche Laufzeit). */
export function roleForCode(input: string, config: AuthConfig): Role | null {
  const candidate = input.trim();
  let match: Role | null = null;
  for (const role of ["learner", "trainer"] as const) {
    const code = config.codes[role];
    if (code && safeEqual(candidate, code) && !match) match = role;
  }
  return match;
}

export function createAccessToken(role: Role, config: AuthConfig): string {
  const code = config.codes[role];
  if (!code) throw new Error(`Rolle ${role} ist nicht eingerichtet`);
  return `${role}.${signature(role, code, config.secret)}`;
}

/** Liest Rolle aus dem Cookie-Wert – nur wenn die Signatur zum aktuellen Code passt. */
export function roleFromToken(token: string | undefined, config: AuthConfig | null): Role | null {
  if (!token || !config) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const role = token.slice(0, dot);
  if (role !== "learner" && role !== "trainer") return null;
  const code = config.codes[role];
  if (!code) return null;
  return safeEqual(token.slice(dot + 1), signature(role, code, config.secret)) ? role : null;
}

/** Startseite je Rolle */
export function homeForRole(role: Role): string {
  return role === "trainer" ? "/ausbilder" : "/";
}

/** Darf die Ausbilder-Rolle diesen Pfad sehen? (Nur Lesen) */
export function trainerMayAccess(pathname: string, method: string): boolean {
  if (pathname === "/ausbilder" || pathname.startsWith("/ausbilder/")) return true;
  if (pathname === "/api/report") return method === "GET";
  if (pathname === "/api/lock") return true;
  return false;
}

/** Nur interne Pfade als Weiterleitungsziel erlauben (kein "//boese.de" o. Ä.), passend zur Rolle. */
export function safeNextPath(next: unknown, role: Role = "learner"): string {
  const home = homeForRole(role);
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return home;
  if (next.startsWith("/unlock") || next.startsWith("/api/")) return home;
  if (role === "trainer" && !trainerMayAccess(next.split("?")[0], "GET")) return home;
  return next;
}
