/**
 * Datenmodell der Lern-App.
 *
 * Aufbau:  Fach (Subject) → Thema (Topic) → Karteikarte (Card)
 * Der Lernstand einer Karte (CardProgress) liegt bewusst getrennt von der Karte selbst,
 * damit Inhalte bearbeitet werden können, ohne den Lernfortschritt zu verlieren.
 */

/** Farbschema eines Fachs – wird in src/lib/subject-colors.ts auf Tailwind-Klassen abgebildet. */
export type SubjectColor = "indigo" | "sky" | "amber" | "emerald" | "rose" | "violet" | "teal";

export interface Subject {
  id: string;
  /** Kurzname für Kacheln und Navigation, z. B. "LF02" */
  shortName: string;
  /** Voller Name, z. B. "Arbeitsplätze nach Kundenwunsch ausstatten" */
  name: string;
  color: SubjectColor;
  /** Reihenfolge in Listen */
  order: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface Card {
  id: string;
  topicId: string;
  /** Vorderseite: Frage / Begriff */
  front: string;
  /** Rückseite: Antwort / Erklärung */
  back: string;
  /** Zeitpunkt der Erstellung (ms seit 1970) */
  createdAt: number;
  /** true = mitgelieferte Beispielkarte (kann gesammelt gelöscht werden) */
  isExample?: boolean;
}

/**
 * Lernstand einer Karte für die verteilte Wiederholung (Spaced Repetition).
 * Fehlt für eine Karte ein Eintrag, gilt sie als "neu" und sofort fällig.
 */
export interface CardProgress {
  cardId: string;
  /** Aktueller Abstand bis zur nächsten Wiederholung in Tagen (0 = heute nochmal) */
  intervalDays: number;
  /** Faktor, um den das Intervall bei "Wusste ich" wächst (startet bei 2.5) */
  ease: number;
  /** Fällig ab diesem Kalendertag (lokales Datum, Format "YYYY-MM-DD") */
  dueDate: string;
  /** Wie oft die Karte insgesamt beantwortet wurde */
  reviews: number;
  /** Wie oft sie nicht gewusst wurde */
  lapses: number;
  /** Letzte Antwort (ms seit 1970) */
  lastReviewedAt: number;
}

export interface Settings {
  /** Wie viele Karten pro Tag das Tagesziel sind */
  dailyGoal: number;
}

/** Alles, was im Gerät gespeichert wird. */
export interface AppData {
  /** Version des Speicherformats – für spätere Umbauten (Migrationen) */
  version: 1;
  subjects: Subject[];
  topics: Topic[];
  cards: Card[];
  /** Lernstand je Karte, Schlüssel = cardId */
  progress: Record<string, CardProgress>;
  /** Anzahl beantworteter Karten pro Kalendertag ("YYYY-MM-DD" → Anzahl), Basis für Tagesziel & Serie */
  reviewLog: Record<string, number>;
  settings: Settings;
}
