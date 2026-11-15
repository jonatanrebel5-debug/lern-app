import { reviewCard } from "./srs";
import type { AppData, Card, Topic } from "./types";

/**
 * Alle Änderungen an den App-Daten laufen über diesen Reducer.
 * Er ist pur (keine Uhr, kein Zufall, kein Speicher) – Zeitpunkte und IDs werden
 * von außen mitgegeben. Das macht ihn vorhersagbar und leicht testbar.
 */
export type AppDataAction =
  | { type: "rateCard"; cardId: string; knew: boolean; today: string; now: number }
  | { type: "addTopic"; topic: Topic }
  | { type: "addCard"; card: Card }
  | { type: "updateCard"; cardId: string; front: string; back: string }
  | { type: "deleteCard"; cardId: string }
  | { type: "deleteExampleCards" }
  | { type: "setDailyGoal"; dailyGoal: number };

export function appDataReducer(state: AppData, action: AppDataAction): AppData {
  switch (action.type) {
    case "rateCard": {
      if (!state.cards.some((c) => c.id === action.cardId)) return state;
      const progress = reviewCard(state.progress[action.cardId], action.cardId, action.knew, action.today, action.now);
      return {
        ...state,
        progress: { ...state.progress, [action.cardId]: progress },
        reviewLog: { ...state.reviewLog, [action.today]: (state.reviewLog[action.today] ?? 0) + 1 },
      };
    }

    case "addTopic": {
      const { topic } = action;
      if (!state.subjects.some((s) => s.id === topic.subjectId)) return state;
      if (state.topics.some((t) => t.id === topic.id)) return state;
      return { ...state, topics: [...state.topics, topic] };
    }

    case "addCard": {
      if (!state.topics.some((t) => t.id === action.card.topicId)) return state;
      return { ...state, cards: [...state.cards, action.card] };
    }

    case "updateCard":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.cardId ? { ...c, front: action.front, back: action.back } : c)),
      };

    case "deleteCard":
      return removeCards(state, (c) => c.id === action.cardId);

    case "deleteExampleCards":
      // Fächer, Themen und das Lern-Tagebuch (Serie!) bleiben erhalten – nur die Beispielkarten gehen.
      return removeCards(state, (c) => c.isExample === true);

    case "setDailyGoal":
      return { ...state, settings: { ...state.settings, dailyGoal: clampDailyGoal(action.dailyGoal) } };
  }
}

/** Entfernt Karten samt ihrem Lernstand. */
function removeCards(state: AppData, shouldRemove: (card: Card) => boolean): AppData {
  const removed = new Set(state.cards.filter(shouldRemove).map((c) => c.id));
  if (removed.size === 0) return state;
  const progress = Object.fromEntries(Object.entries(state.progress).filter(([cardId]) => !removed.has(cardId)));
  return { ...state, cards: state.cards.filter((c) => !removed.has(c.id)), progress };
}

export const MIN_DAILY_GOAL = 1;
export const MAX_DAILY_GOAL = 500;
export const DEFAULT_DAILY_GOAL = 20;

export function clampDailyGoal(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DAILY_GOAL;
  return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(value)));
}
