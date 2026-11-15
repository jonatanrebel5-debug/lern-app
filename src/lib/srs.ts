import { addDays } from "./dates";
import type { AppData, Card, CardProgress } from "./types";

/**
 * Spaced Repetition (verteiltes Wiederholen) – vereinfachte Variante des SM-2-Verfahrens
 * mit nur zwei Antworten:
 *
 *  "Wusste ich"       → Intervall wächst: 1 Tag → 3 Tage → danach jeweils × ease (max. 365 Tage)
 *  "Wusste ich nicht" → Intervall zurück auf 0 (kommt heute nochmal), ease sinkt etwas,
 *                       damit schwierige Karten künftig langsamer "weiterwandern".
 *
 * Alle Funktionen hier sind "pur": Sie verändern nichts, sondern geben neue Werte zurück.
 * `today` wird immer übergeben, damit die Logik testbar ist und nicht selbst die Uhr liest.
 */

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const EASE_PENALTY = 0.2;
export const MAX_INTERVAL_DAYS = 365;
/** Ab diesem Intervall gilt eine Karte als "sicher gelernt" */
export const MASTERED_INTERVAL_DAYS = 21;

function nextInterval(current: number, ease: number): number {
  if (current < 1) return 1;
  if (current < 3) return 3;
  return Math.min(MAX_INTERVAL_DAYS, Math.round(current * ease));
}

/** Berechnet den neuen Lernstand einer Karte nach einer Antwort. */
export function reviewCard(
  previous: CardProgress | undefined,
  cardId: string,
  knew: boolean,
  today: string,
  now: number,
): CardProgress {
  const base: CardProgress = previous ?? {
    cardId,
    intervalDays: 0,
    ease: DEFAULT_EASE,
    dueDate: today,
    reviews: 0,
    lapses: 0,
    lastReviewedAt: 0,
  };

  const intervalDays = knew ? nextInterval(base.intervalDays, base.ease) : 0;
  const ease = knew ? base.ease : Math.max(MIN_EASE, base.ease - EASE_PENALTY);

  return {
    cardId,
    intervalDays,
    ease,
    dueDate: addDays(today, intervalDays),
    reviews: base.reviews + 1,
    lapses: base.lapses + (knew ? 0 : 1),
    lastReviewedAt: now,
  };
}

/** Neue Karten (ohne Lernstand) und Karten mit erreichtem Fälligkeitsdatum sind dran. */
export function isDue(progress: CardProgress | undefined, today: string): boolean {
  return !progress || progress.dueDate <= today;
}

export interface CardFilter {
  subjectId?: string;
  topicId?: string;
}

/** Alle Karten, optional gefiltert nach Fach oder Thema – in der Reihenfolge Fach → Thema → Karte. */
export function getCards(data: AppData, filter: CardFilter = {}): Card[] {
  const topicIds = new Set(
    data.topics
      .filter((t) => (!filter.subjectId || t.subjectId === filter.subjectId) && (!filter.topicId || t.id === filter.topicId))
      .map((t) => t.id),
  );
  return data.cards.filter((c) => topicIds.has(c.topicId));
}

/**
 * Lern-Warteschlange: zuerst bereits gelernte, fällige Karten (am längsten überfällige zuerst),
 * danach neue Karten in ihrer normalen Reihenfolge.
 */
export function getStudyQueue(data: AppData, today: string, filter: CardFilter = {}): Card[] {
  const cards = getCards(data, filter);
  const dueReviews = cards
    .filter((c) => data.progress[c.id] && isDue(data.progress[c.id], today))
    .sort((a, b) => data.progress[a.id].dueDate.localeCompare(data.progress[b.id].dueDate));
  const fresh = cards.filter((c) => !data.progress[c.id]);
  return [...dueReviews, ...fresh];
}

export interface ProgressStats {
  total: number;
  /** Noch nie gelernt */
  newCount: number;
  /** Schon gelernt und heute (wieder) fällig */
  dueCount: number;
  /** Zuletzt gewusst (Intervall ≥ 1 Tag) */
  knownCount: number;
  /** Sicher gelernt (Intervall ≥ 21 Tage) */
  masteredCount: number;
  /** Anteil gewusster Karten in Prozent (0–100) */
  percent: number;
}

export function getProgressStats(data: AppData, today: string, filter: CardFilter = {}): ProgressStats {
  const cards = getCards(data, filter);
  let newCount = 0;
  let dueCount = 0;
  let knownCount = 0;
  let masteredCount = 0;

  for (const card of cards) {
    const p = data.progress[card.id];
    if (!p) {
      newCount++;
      continue;
    }
    if (isDue(p, today)) dueCount++;
    if (p.intervalDays >= 1) knownCount++;
    if (p.intervalDays >= MASTERED_INTERVAL_DAYS) masteredCount++;
  }

  return {
    total: cards.length,
    newCount,
    dueCount,
    knownCount,
    masteredCount,
    percent: cards.length ? Math.round((knownCount / cards.length) * 100) : 0,
  };
}

/** Frühestes zukünftiges Fälligkeitsdatum im Filter (für "Nächste Wiederholung: morgen"), sonst null. */
export function getNextDueDate(data: AppData, today: string, filter: CardFilter = {}): string | null {
  let next: string | null = null;
  for (const card of getCards(data, filter)) {
    const due = data.progress[card.id]?.dueDate;
    if (due && due > today && (!next || due < next)) next = due;
  }
  return next;
}

/** Wie viele Karten heute schon beantwortet wurden (für das Tagesziel). */
export function getTodayCount(reviewLog: Record<string, number>, today: string): number {
  return reviewLog[today] ?? 0;
}

/**
 * Serie (Streak): Anzahl aufeinanderfolgender Tage mit mindestens einer gelernten Karte.
 * Hat man heute noch nicht gelernt, zählt die Serie bis gestern – sie reißt erst ab,
 * wenn ein ganzer Tag ohne Lernen vergangen ist.
 */
export function getStreak(reviewLog: Record<string, number>, today: string): number {
  let day = (reviewLog[today] ?? 0) > 0 ? today : addDays(today, -1);
  let streak = 0;
  while ((reviewLog[day] ?? 0) > 0) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
