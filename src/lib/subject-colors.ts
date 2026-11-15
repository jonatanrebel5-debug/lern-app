import type { SubjectColor } from "./types";

/**
 * Tailwind-Klassen pro Fachfarbe.
 * Die Klassen müssen hier vollständig ausgeschrieben sein, damit Tailwind sie beim Build findet.
 */
export const subjectColors: Record<SubjectColor, { gradient: string; bar: string; text: string }> = {
  indigo: {
    gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
    bar: "bg-gradient-to-r from-indigo-500 to-violet-400",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  sky: {
    gradient: "from-sky-500 via-cyan-400 to-teal-400",
    bar: "bg-gradient-to-r from-sky-500 to-cyan-400",
    text: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    bar: "bg-gradient-to-r from-amber-500 to-orange-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    bar: "bg-gradient-to-r from-rose-500 to-pink-400",
    text: "text-rose-600 dark:text-rose-400",
  },
  violet: {
    gradient: "from-violet-500 via-purple-500 to-fuchsia-400",
    bar: "bg-gradient-to-r from-violet-500 to-fuchsia-400",
    text: "text-violet-600 dark:text-violet-400",
  },
  teal: {
    gradient: "from-teal-400 via-cyan-500 to-sky-500",
    bar: "bg-gradient-to-r from-teal-500 to-cyan-400",
    text: "text-teal-600 dark:text-teal-400",
  },
};
