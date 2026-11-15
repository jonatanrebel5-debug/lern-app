"use client";

import { useState } from "react";

const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WEEKDAYS_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function parts(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return { weekday, label: `${d}.${m}.` };
}

/**
 * Säulendiagramm "Lernaktivität der letzten 14 Tage" (eine Datenreihe → eine Farbe, keine Legende).
 *  - dünne Balken, oben abgerundet, am Grundlinie verankert, 2 px Abstand
 *  - gestrichelte Linie = Tagesziel
 *  - Antippen/Überfahren zeigt den Wert oben an; ganze Spalte ist die Tippfläche
 *  - Screenreader bekommen dieselben Werte als Liste
 */
export function ActivityChart({ days, goal, today }: { days: { date: string; count: number }[]; goal: number; today: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = days.find((d) => d.date === selected) ?? days[days.length - 1];
  const max = Math.max(goal, ...days.map((d) => d.count), 1);
  const goalPct = (goal / max) * 100;

  const activeParts = parts(active.date);
  const activeLabel = active.date === today ? "Heute" : `${WEEKDAYS_LONG[activeParts.weekday]}, ${activeParts.label}`;

  return (
    <div>
      {/* Wertanzeige für den gewählten Tag */}
      <p className="mb-3 text-sm" aria-live="polite">
        <span className="text-muted">{activeLabel}: </span>
        <span className="font-semibold tabular-nums">
          {active.count} {active.count === 1 ? "Karte" : "Karten"}
        </span>
        {active.count >= goal && <span className="text-muted"> · Ziel erreicht</span>}
      </p>

      <div className="relative h-36" onMouseLeave={() => setSelected(null)}>
        {/* Tagesziel-Linie */}
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/50" style={{ bottom: `${goalPct}%` }} aria-hidden="true">
          <span className="absolute -top-4 right-0 rounded px-1 text-[10px] text-muted backdrop-blur-sm">Ziel {goal}</span>
        </div>

        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-border" aria-hidden="true">
          {days.map((d) => {
            const isActive = d.date === active.date;
            const height = d.count > 0 ? Math.max(3, (d.count / max) * 100) : 0;
            return (
              <button
                key={d.date}
                type="button"
                tabIndex={-1}
                onClick={() => setSelected(d.date)}
                onMouseEnter={() => setSelected(d.date)}
                className="flex h-full flex-1 items-end justify-center"
              >
                {d.count > 0 ? (
                  <span
                    className={`block w-full max-w-5 rounded-t-[4px] bg-gradient-to-t from-indigo-500 to-violet-400 transition-opacity ${isActive ? "opacity-100 shadow-[0_0_12px_rgb(var(--glow)/0.6)]" : "opacity-70"}`}
                    style={{ height: `${height}%` }}
                  />
                ) : (
                  <span className="block h-[2px] w-full max-w-5 rounded-full bg-border" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wochentage */}
      <div className="mt-1.5 flex gap-[2px]" aria-hidden="true">
        {days.map((d) => (
          <span
            key={d.date}
            className={`flex-1 text-center text-[10px] ${d.date === today ? "font-semibold text-foreground" : "text-muted"}`}
          >
            {WEEKDAYS_SHORT[parts(d.date).weekday]}
          </span>
        ))}
      </div>

      {/* Textfassung für Screenreader */}
      <ul className="sr-only">
        {days.map((d) => {
          const p = parts(d.date);
          return (
            <li key={d.date}>
              {WEEKDAYS_LONG[p.weekday]}, {p.label}: {d.count} Karten
            </li>
          );
        })}
      </ul>
    </div>
  );
}
