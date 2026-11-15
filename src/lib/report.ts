import { addDays, isDateKey } from "./dates";
import { getProgressStats } from "./srs";
import type { AppData, SubjectColor } from "./types";

/**
 * Lernstand-Zusammenfassung für die Ausbilder-Ansicht.
 *
 * Hochgeladen wird bewusst NUR diese Zusammenfassung (keine Karteninhalte):
 * Fortschritt pro Fach, Tagesziel und das Lern-Tagebuch der letzten 60 Tage.
 * Serie, "heute" und die 14-Tage-Aktivität berechnet die Ausbilder-Ansicht selbst aus dem
 * Tagebuch – mit dem Datum ihres Geräts. So stimmen die Werte auch Tage nach dem Upload noch.
 */

export const REPORT_LOG_DAYS = 60;
const SUBJECT_COLORS: readonly SubjectColor[] = ["indigo", "sky", "amber", "emerald", "rose", "violet", "teal"];

export interface SubjectReport {
  id: string;
  shortName: string;
  name: string;
  color: SubjectColor;
  total: number;
  /** zuletzt gewusst (Intervall ≥ 1 Tag) */
  known: number;
  /** sicher gelernt (Intervall ≥ 21 Tage) */
  mastered: number;
  /** noch nie gelernt */
  newCount: number;
}

export interface ProgressReport {
  version: 1;
  /** Zeitpunkt des Uploads (ms) */
  updatedAt: number;
  dailyGoal: number;
  /** "YYYY-MM-DD" → beantwortete Karten (letzte 60 Tage) */
  reviewLog: Record<string, number>;
  subjects: SubjectReport[];
  totals: {
    cards: number;
    known: number;
    mastered: number;
    newCount: number;
    ownCards: number;
    exampleCards: number;
    /** alle jemals beantworteten Karten */
    reviews: number;
  };
}

export function buildReport(data: AppData, today: string, now: number): ProgressReport {
  const subjects = [...data.subjects]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const st = getProgressStats(data, today, { subjectId: s.id });
      return {
        id: s.id,
        shortName: s.shortName,
        name: s.name,
        color: s.color,
        total: st.total,
        known: st.knownCount,
        mastered: st.masteredCount,
        newCount: st.newCount,
      };
    });

  const overall = getProgressStats(data, today);
  const since = addDays(today, -(REPORT_LOG_DAYS - 1));
  const reviewLog = Object.fromEntries(Object.entries(data.reviewLog).filter(([day]) => day >= since && day <= today));
  const exampleCards = data.cards.filter((c) => c.isExample).length;

  return {
    version: 1,
    updatedAt: now,
    dailyGoal: data.settings.dailyGoal,
    reviewLog,
    subjects,
    totals: {
      cards: overall.total,
      known: overall.knownCount,
      mastered: overall.masteredCount,
      newCount: overall.newCount,
      ownCards: data.cards.length - exampleCards,
      exampleCards,
      reviews: Object.values(data.reviewLog).reduce((sum, n) => sum + n, 0),
    },
  };
}

/** Inhaltlicher "Fingerabdruck" ohne Zeitstempel – gleicher Inhalt = kein erneuter Upload. */
export function reportFingerprint(report: ProgressReport): string {
  const { updatedAt: _ignored, ...content } = report;
  void _ignored;
  return JSON.stringify(content);
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Aktivität der letzten `days` Tage bis einschließlich `today` (älteste zuerst). */
export function getActivity(reviewLog: Record<string, number>, today: string, days = 14): { date: string; count: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    return { date, count: reviewLog[date] ?? 0 };
  });
}

/* ------------------------------------------------------------------------------------------ */
/* Prüfen (Server beim Speichern, Ansicht beim Laden) – kaputte Daten dürfen nichts abstürzen lassen */
/* ------------------------------------------------------------------------------------------ */

const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1_000_000;
const isText = (v: unknown, max = 200): v is string => typeof v === "string" && v.length <= max;

export function parseReport(value: unknown): ProgressReport | null {
  if (typeof value !== "object" || value === null) return null;
  const r = value as Record<string, unknown>;
  if (r.version !== 1 || typeof r.updatedAt !== "number" || !Number.isFinite(r.updatedAt)) return null;
  if (!isCount(r.dailyGoal) || r.dailyGoal < 1) return null;
  if (!Array.isArray(r.subjects) || r.subjects.length > 100) return null;
  if (typeof r.reviewLog !== "object" || r.reviewLog === null || Array.isArray(r.reviewLog)) return null;
  if (typeof r.totals !== "object" || r.totals === null) return null;

  const subjects: SubjectReport[] = [];
  for (const s of r.subjects as unknown[]) {
    if (typeof s !== "object" || s === null) return null;
    const x = s as Record<string, unknown>;
    if (!isText(x.id, 100) || !isText(x.shortName) || !isText(x.name)) return null;
    if (![x.total, x.known, x.mastered, x.newCount].every(isCount)) return null;
    subjects.push({
      id: x.id,
      shortName: x.shortName,
      name: x.name,
      color: SUBJECT_COLORS.includes(x.color as SubjectColor) ? (x.color as SubjectColor) : "indigo",
      total: x.total as number,
      known: x.known as number,
      mastered: x.mastered as number,
      newCount: x.newCount as number,
    });
  }

  const reviewLog: Record<string, number> = {};
  const entries = Object.entries(r.reviewLog as Record<string, unknown>);
  if (entries.length > 400) return null;
  for (const [day, count] of entries) {
    if (!isDateKey(day) || !isCount(count)) return null;
    reviewLog[day] = count;
  }

  const t = r.totals as Record<string, unknown>;
  const keys = ["cards", "known", "mastered", "newCount", "ownCards", "exampleCards", "reviews"] as const;
  if (!keys.every((k) => isCount(t[k]))) return null;

  return {
    version: 1,
    updatedAt: r.updatedAt,
    dailyGoal: r.dailyGoal,
    reviewLog,
    subjects,
    totals: Object.fromEntries(keys.map((k) => [k, t[k] as number])) as ProgressReport["totals"],
  };
}
