import { clampDailyGoal } from "./app-data";
import { isDateKey } from "./dates";
import { DEFAULT_EASE, MIN_EASE } from "./srs";
import type { AppData, Card, CardProgress, Subject, SubjectColor, Topic } from "./types";

/**
 * Laden & Speichern im localStorage – mit Schutz vor allem, was auf echten Geräten passieren kann:
 *  - localStorage nicht verfügbar (z. B. gesperrt, privater Modus, Server-Rendering)
 *  - Speicher voll (QuotaExceededError)
 *  - kaputte oder veraltete Daten (ungültiges JSON, fehlende Felder, falsche Typen)
 *
 * Keine Funktion hier wirft einen Fehler – alles wird als Ergebnis zurückgegeben.
 */

export const STORAGE_KEY = "lern-app/data";
/** Hierhin wird kaputter Inhalt gesichert, bevor die App neu startet (zur Not wiederherstellbar). */
export const BACKUP_KEY = "lern-app/data-backup";

export type LoadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty" }
  | { status: "corrupt" }
  | { status: "unavailable" };

export type SaveResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" | "unknown" };

/** Liefert localStorage oder null, falls es (noch) nicht nutzbar ist. Schon der Zugriff kann werfen. */
export function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadAppData(storage: Storage | null = getStorage()): LoadResult {
  if (!storage) return { status: "unavailable" };

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }
  if (raw === null) return { status: "empty" };

  const data = parseAppData(raw);
  if (data) return { status: "ok", data };

  // Kaputte Daten sichern (best effort), damit nichts endgültig verloren ist.
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    /* Backup ist optional */
  }
  return { status: "corrupt" };
}

export function saveAppData(data: AppData, storage: Storage | null = getStorage()): SaveResult {
  return saveSerialized(JSON.stringify(data), storage);
}

export function saveSerialized(json: string, storage: Storage | null = getStorage()): SaveResult {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(STORAGE_KEY, json);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? "quota" : "unknown" };
  }
}

export function clearAppData(storage: Storage | null = getStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignorieren */
  }
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" || // Firefox
    error.code === 22 ||
    error.code === 1014
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Einlesen & Prüfen                                                                           */
/* ------------------------------------------------------------------------------------------ */

/**
 * Wandelt gespeicherten Text zurück in AppData.
 * - Ist die Grundstruktur unbrauchbar → null (App startet mit Startdaten neu).
 * - Einzelne kaputte Einträge werden aussortiert, der Rest bleibt erhalten.
 */
export function parseAppData(raw: string): AppData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const migrated = migrate(parsed);
  if (!migrated) return null;
  return sanitize(migrated);
}

/**
 * Bringt ältere Speicherformate auf den aktuellen Stand.
 * Heute gibt es nur Version 1 – künftige Umbauten kommen hier als weitere Fälle dazu.
 */
function migrate(input: Record<string, unknown>): Record<string, unknown> | null {
  switch (input.version) {
    case 1:
      return input;
    default:
      return null; // unbekannte Version
  }
}

const SUBJECT_COLORS: readonly SubjectColor[] = ["indigo", "sky", "amber", "emerald", "rose", "violet", "teal"];

function sanitize(input: Record<string, unknown>): AppData | null {
  if (!Array.isArray(input.subjects) || !Array.isArray(input.topics) || !Array.isArray(input.cards)) return null;

  const subjects: Subject[] = [];
  input.subjects.forEach((s, i) => {
    if (!isRecord(s) || !isNonEmptyString(s.id) || typeof s.name !== "string") return;
    subjects.push({
      id: s.id,
      name: s.name,
      shortName: typeof s.shortName === "string" ? s.shortName : s.name,
      color: SUBJECT_COLORS.includes(s.color as SubjectColor) ? (s.color as SubjectColor) : "indigo",
      order: isFiniteNumber(s.order) ? s.order : i,
    });
  });
  const subjectIds = new Set(subjects.map((s) => s.id));

  const topics: Topic[] = [];
  input.topics.forEach((t, i) => {
    if (!isRecord(t) || !isNonEmptyString(t.id) || typeof t.name !== "string") return;
    if (typeof t.subjectId !== "string" || !subjectIds.has(t.subjectId)) return;
    topics.push({ id: t.id, subjectId: t.subjectId, name: t.name, order: isFiniteNumber(t.order) ? t.order : i });
  });
  const topicIds = new Set(topics.map((t) => t.id));

  const cards: Card[] = [];
  for (const c of input.cards) {
    if (!isRecord(c) || !isNonEmptyString(c.id) || typeof c.front !== "string" || typeof c.back !== "string") continue;
    if (typeof c.topicId !== "string" || !topicIds.has(c.topicId)) continue;
    cards.push({
      id: c.id,
      topicId: c.topicId,
      front: c.front,
      back: c.back,
      createdAt: isFiniteNumber(c.createdAt) ? c.createdAt : 0,
      ...(c.isExample === true ? { isExample: true } : {}),
    });
  }
  const cardIds = new Set(cards.map((c) => c.id));

  const progress: Record<string, CardProgress> = {};
  if (isRecord(input.progress)) {
    for (const [cardId, p] of Object.entries(input.progress)) {
      if (!cardIds.has(cardId) || !isRecord(p) || !isDateKey(p.dueDate)) continue;
      progress[cardId] = {
        cardId,
        intervalDays: nonNegative(p.intervalDays, 0),
        ease: isFiniteNumber(p.ease) ? Math.max(MIN_EASE, p.ease) : DEFAULT_EASE,
        dueDate: p.dueDate,
        reviews: nonNegative(p.reviews, 0),
        lapses: nonNegative(p.lapses, 0),
        lastReviewedAt: nonNegative(p.lastReviewedAt, 0),
      };
    }
  }

  const reviewLog: Record<string, number> = {};
  if (isRecord(input.reviewLog)) {
    for (const [day, count] of Object.entries(input.reviewLog)) {
      if (isDateKey(day) && isFiniteNumber(count) && count > 0) reviewLog[day] = Math.round(count);
    }
  }

  const settings = isRecord(input.settings) ? input.settings : {};

  return {
    version: 1,
    subjects,
    topics,
    cards,
    progress,
    reviewLog,
    settings: { dailyGoal: clampDailyGoal(isFiniteNumber(settings.dailyGoal) ? settings.dailyGoal : NaN) },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function nonNegative(value: unknown, fallback: number): number {
  return isFiniteNumber(value) && value >= 0 ? value : fallback;
}
