import { diffDays } from "./dates";

/** "heute nochmal", "morgen", "in 3 Tagen", "in 3 Wochen", "in 4 Monaten" … */
export function formatInterval(days: number): string {
  if (days <= 0) return "heute nochmal";
  if (days === 1) return "morgen";
  if (days < 14) return `in ${days} Tagen`;
  if (days < 60) return `in ${Math.round(days / 7)} Wochen`;
  if (days < 365) return `in ${Math.round(days / 30)} Monaten`;
  return "in 1 Jahr";
}

/** Fälligkeitsdatum relativ zu heute: "heute", "morgen", "in 5 Tagen" oder "am 3.12.". */
export function formatDueDate(dateKey: string, today: string): string {
  const days = diffDays(today, dateKey);
  if (days <= 0) return "heute";
  if (days === 1) return "morgen";
  if (days < 14) return `in ${days} Tagen`;
  const [, m, d] = dateKey.split("-").map(Number);
  return `am ${d}.${m}.`;
}

/** "1 Karte" / "5 Karten" */
export function pluralCards(count: number): string {
  return `${count} ${count === 1 ? "Karte" : "Karten"}`;
}
