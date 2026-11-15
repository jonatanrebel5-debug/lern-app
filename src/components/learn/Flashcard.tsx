"use client";

import { IconRotate } from "@/components/icons";
import { subjectColors } from "@/lib/subject-colors";
import type { Card, Subject, Topic } from "@/lib/types";

/**
 * Karteikarte mit 3D-Umdreh-Animation.
 * Beide Seiten liegen im selben Grid-Feld übereinander → die Karte ist so hoch wie die längere Seite.
 * Bei "Bewegung reduzieren" (iOS-Bedienungshilfen) wird ohne Animation umgeschaltet.
 */
export function Flashcard({
  card,
  topic,
  subject,
  flipped,
  onFlip,
}: {
  card: Card;
  topic?: Topic;
  subject?: Subject;
  flipped: boolean;
  onFlip: () => void;
}) {
  const colors = subjectColors[subject?.color ?? "indigo"];
  const label = [subject?.shortName, topic?.name].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? "Karte umdrehen: Frage zeigen" : "Karte umdrehen: Antwort zeigen"}
      className="block w-full animate-card-in text-left perspective-[1400px] focus-visible:outline-none motion-reduce:animate-none"
    >
      <span
        className={`grid transition-transform duration-500 ease-out transform-3d motion-reduce:transition-none ${flipped ? "rotate-y-180" : ""}`}
      >
        {/* Vorderseite: Frage */}
        <span
          className="flex min-h-[19rem] flex-col rounded-3xl glass-strong p-6 backface-hidden [grid-area:1/1]"
          aria-hidden={flipped}
        >
          <span className="flex items-center justify-between gap-3">
            <span className={`truncate text-xs font-semibold tracking-wide uppercase ${colors.text}`}>{label}</span>
            <span className="shrink-0 rounded-full bg-border/60 px-2.5 py-0.5 text-[11px] font-medium text-muted">Frage</span>
          </span>
          <span className="flex flex-1 items-center justify-center py-6 text-center text-xl/8 font-semibold text-balance whitespace-pre-line">
            {card.front}
          </span>
          <span className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <IconRotate className="size-3.5" /> Tippen zum Umdrehen
          </span>
        </span>

        {/* Rückseite: Antwort */}
        <span
          className="flex min-h-[19rem] rotate-y-180 flex-col rounded-3xl glass-strong p-6 backface-hidden [grid-area:1/1]"
          aria-hidden={!flipped}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-xs text-muted">{card.front}</span>
            <span className={`shrink-0 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-medium text-white ${colors.gradient}`}>
              Antwort
            </span>
          </span>
          <span className="flex flex-1 items-center justify-center py-6 text-center text-lg/7 font-medium text-pretty whitespace-pre-line">
            {card.back}
          </span>
          {card.isExample && <span className="text-center text-[11px] text-muted">Beispielkarte</span>}
        </span>
      </span>
    </button>
  );
}
