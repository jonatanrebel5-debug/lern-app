import { addDays } from "./dates";
import { DEFAULT_EASE, EASE_PENALTY } from "./srs";
import type { AppData, CardProgress } from "./types";

/**
 * Demo-Aktivität: lässt die App beim ersten Start so aussehen, als würde sie seit vier Tagen
 * aktiv genutzt (4-Tage-Serie, gefülltes 14-Tage-Diagramm, Fortschritt in LF01 und LF02).
 *
 * WICHTIG für die Hydration: Diese Funktion wird NICHT in createInitialData() aufgerufen,
 * sondern erst im Browser nach dem Mounten (AppDataProvider), weil "heute" relativ ist und
 * Server und Browser sonst unterschiedliche Daten rendern würden.
 */

/** Gelernte Karten pro Tag – ältester Tag zuerst, letzter Eintrag = heute */
export const DEMO_REVIEWS_PER_DAY = [16, 22, 19, 5];

interface DemoProgress {
  cardId: string;
  /** aktuelles Intervall in Tagen (0 = zuletzt nicht gewusst) */
  intervalDays: number;
  /** vor wie vielen Tagen zuletzt beantwortet */
  daysAgo: number;
  reviews: number;
  lapses: number;
}

/**
 * LF01: 5 von 10 gewusst (eine davon heute fällig) · LF02: 4 von 9 gewusst (= 44 %), eine fällig.
 * Je eine Karte pro Fach wurde zuletzt NICHT gewusst → taucht als Wiederholung auf.
 */
const DEMO_PROGRESS: DemoProgress[] = [
  // LF01 – Unternehmensziele & Rechtsformen
  { cardId: "lf01.ziele-rechtsformen.1", intervalDays: 8, daysAgo: 3, reviews: 3, lapses: 0 },
  { cardId: "lf01.ziele-rechtsformen.2", intervalDays: 3, daysAgo: 2, reviews: 2, lapses: 0 },
  { cardId: "lf01.ziele-rechtsformen.3", intervalDays: 3, daysAgo: 3, reviews: 3, lapses: 1 }, // heute fällig
  // LF01 – Organisation
  { cardId: "lf01.organisation-prozesse.1", intervalDays: 1, daysAgo: 1, reviews: 1, lapses: 0 }, // heute fällig
  { cardId: "lf01.organisation-prozesse.2", intervalDays: 1, daysAgo: 0, reviews: 1, lapses: 0 },
  // LF01 – Wirtschaftlichkeit: zuletzt nicht gewusst
  { cardId: "lf01.wirtschaftlichkeit.1", intervalDays: 0, daysAgo: 1, reviews: 2, lapses: 1 },

  // LF02 – PC-Aufbau
  { cardId: "lf02.pc-aufbau.1", intervalDays: 8, daysAgo: 3, reviews: 3, lapses: 0 },
  { cardId: "lf02.pc-aufbau.2", intervalDays: 3, daysAgo: 2, reviews: 2, lapses: 0 },
  { cardId: "lf02.pc-aufbau.3", intervalDays: 3, daysAgo: 3, reviews: 2, lapses: 0 }, // heute fällig
  // LF02 – Beschaffung
  { cardId: "lf02.beschaffung.1", intervalDays: 1, daysAgo: 1, reviews: 1, lapses: 0 }, // heute fällig
  { cardId: "lf02.beschaffung.2", intervalDays: 0, daysAgo: 0, reviews: 1, lapses: 1 }, // heute nicht gewusst
];

/** Erzeugt aus den Startdaten eine "belebte" Version – rein, verändert `data` nicht. */
export function applyDemoActivity(data: AppData, today: string, now: number): AppData {
  const reviewLog: Record<string, number> = { ...data.reviewLog };
  DEMO_REVIEWS_PER_DAY.forEach((count, i) => {
    const day = addDays(today, i - (DEMO_REVIEWS_PER_DAY.length - 1));
    reviewLog[day] = count;
  });

  const cardIds = new Set(data.cards.map((c) => c.id));
  const progress: Record<string, CardProgress> = { ...data.progress };
  for (const d of DEMO_PROGRESS) {
    if (!cardIds.has(d.cardId)) continue; // Karte existiert nicht (mehr) → überspringen
    const reviewDay = addDays(today, -d.daysAgo);
    progress[d.cardId] = {
      cardId: d.cardId,
      intervalDays: d.intervalDays,
      ease: Math.max(1.3, DEFAULT_EASE - d.lapses * EASE_PENALTY),
      dueDate: addDays(reviewDay, d.intervalDays),
      reviews: d.reviews,
      lapses: d.lapses,
      lastReviewedAt: Math.max(0, now - d.daysAgo * 86_400_000),
    };
  }

  return { ...data, reviewLog, progress };
}
