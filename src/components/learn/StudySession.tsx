"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { IconCheck, IconX } from "@/components/icons";
import { Button, ButtonLink, ProgressBar } from "@/components/ui";
import { formatDueDate, formatInterval, pluralCards } from "@/lib/format";
import type { StudyScope } from "@/lib/scope";
import { getCards, getNextDueDate, getTodayCount, reviewCard } from "@/lib/srs";
import { subjectColors } from "@/lib/subject-colors";
import { Flashcard } from "./Flashcard";
import { SessionShell } from "./SessionShell";

/**
 * Eine Lern-Sitzung.
 *
 * Die Warteschlange (Karten-IDs) wird beim Start EINMAL übernommen und dann lokal geführt:
 *  - "Wusste ich"       → Karte fliegt aus der Sitzung
 *  - "Wusste ich nicht" → Karte wandert ans Ende und kommt in dieser Sitzung nochmal
 * Die Bewertung selbst geht an rateCard() (Spaced Repetition + Tagesziel/Serie).
 * Im Übungsmodus (practice) wird nichts bewertet – nur durchgeblättert.
 */
export function StudySession({
  scope,
  initialQueue,
  practice,
}: {
  scope: StudyScope;
  initialQueue: string[];
  practice: boolean;
}) {
  const { data, today, rateCard } = useAppData();
  const [queue, setQueue] = useState(initialQueue);
  const [total] = useState(initialQueue.length);
  const [flipped, setFlipped] = useState(false);
  /** Zählt jede Antwort – als key sorgt das dafür, dass die nächste Karte frisch (Vorderseite) erscheint */
  const [turn, setTurn] = useState(0);
  const [tally, setTally] = useState({ known: 0, unknown: 0 });

  const cardsById = useMemo(() => new Map(data.cards.map((c) => [c.id, c])), [data.cards]);
  // Karten, die währenddessen gelöscht wurden (z. B. in einem anderen Tab), werden übersprungen.
  const pending = queue.filter((id) => cardsById.has(id));
  const card = pending.length > 0 ? cardsById.get(pending[0]) : undefined;
  const topic = card && data.topics.find((t) => t.id === card.topicId);
  const subject = topic && data.subjects.find((s) => s.id === topic.subjectId);

  const answer = useCallback(
    (knew: boolean) => {
      if (!card) return;
      if (!practice) rateCard(card.id, knew);
      setTally((t) => (knew ? { ...t, known: t.known + 1 } : { ...t, unknown: t.unknown + 1 }));
      setQueue((q) => {
        const rest = q.filter((id) => id !== card.id);
        return knew ? rest : [...rest, card.id];
      });
      setFlipped(false);
      setTurn((n) => n + 1);
    },
    [card, practice, rateCard],
  );

  // Tastatur (Mac): Leertaste/Enter = umdrehen, ← / 1 = wusste ich nicht, → / 2 = wusste ich
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card || e.metaKey || e.ctrlKey || e.altKey) return;
      // Liegt der Fokus auf einem Knopf/Feld, übernimmt der Browser die Taste selbst → nicht doppelt auslösen
      if (e.target instanceof Element && e.target.closest("button, a, input, textarea, select")) return;
      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && (e.key === "ArrowLeft" || e.key === "1")) {
        answer(false);
      } else if (flipped && (e.key === "ArrowRight" || e.key === "2")) {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, flipped, answer]);

  if (total === 0) return <EmptyState scope={scope} practice={practice} />;

  const done = total - pending.length;
  const percent = total > 0 ? (done / total) * 100 : 0;
  const barClass = subjectColors[scope.color].bar;

  if (!card) {
    return <SessionSummary scope={scope} practice={practice} total={total} tally={tally} />;
  }

  // Vorschau: wann kommt die Karte wieder, je nach Antwort?
  const previewKnown = !practice ? reviewCard(data.progress[card.id], card.id, true, today, 0).intervalDays : null;
  const isRepeat = tally.known + tally.unknown >= total && pending.length > 0;

  return (
    <SessionShell
      title={practice ? `Üben: ${scope.title}` : scope.title}
      subtitle={scope.subtitle}
      right={`${done}/${total}`}
      progress={<ProgressBar percent={percent} barClass={barClass} />}
      footer={
        flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => answer(false)}
              className="tap flex flex-col items-center gap-0.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-2 py-3 text-[15px] font-semibold text-rose-600 backdrop-blur-md dark:text-rose-400"
            >
              <span className="flex items-center gap-1 whitespace-nowrap">
                <IconX className="size-4" /> Wusste ich nicht
              </span>
              {!practice && <span className="text-xs font-normal opacity-80">{formatInterval(0)}</span>}
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="tap flex flex-col items-center gap-0.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-3 text-[15px] font-semibold text-emerald-700 backdrop-blur-md dark:text-emerald-400"
            >
              <span className="flex items-center gap-1 whitespace-nowrap">
                <IconCheck className="size-4" /> Wusste ich
              </span>
              {previewKnown !== null && <span className="text-xs font-normal opacity-80">{formatInterval(previewKnown)}</span>}
            </button>
          </div>
        ) : (
          <Button onClick={() => setFlipped(true)}>Antwort zeigen</Button>
        )
      }
    >
      {practice && (
        <p className="mb-3 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
          Freies Üben – zählt nicht für deine Wiederholungsplanung.
        </p>
      )}
      <div className="flex flex-1 flex-col justify-center py-2">
        <Flashcard
          key={`${card.id}-${turn}`}
          card={card}
          topic={topic}
          subject={subject}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />
        <p className="mt-4 text-center text-xs text-muted" aria-live="polite">
          {isRepeat ? "Wiederholung von Karten, die du noch nicht wusstest" : `${pending.length} übrig`}
          <span className="hidden md:inline"> · Tastatur: Leertaste umdrehen, ← / → bewerten</span>
        </p>
      </div>
    </SessionShell>
  );
}

function SessionSummary({
  scope,
  practice,
  total,
  tally,
}: {
  scope: StudyScope;
  practice: boolean;
  total: number;
  tally: { known: number; unknown: number };
}) {
  const { data, today, requestReportSync, syncStatus } = useAppData();
  const todayCount = getTodayCount(data.reviewLog, today);
  const goal = data.settings.dailyGoal;
  const goalReached = todayCount >= goal;

  // Sitzung abgeschlossen → Lernstand für die Ausbilder-Ansicht hochladen (im Hintergrund)
  useEffect(() => {
    if (!practice) requestReportSync();
  }, [practice, requestReportSync]);

  return (
    <SessionShell title={scope.title} subtitle={scope.subtitle} footer={<SummaryActions />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div>
          <p className="text-5xl">{tally.unknown === 0 ? "🏆" : "🎉"}</p>
          <h2 className="mt-3 text-2xl font-bold">Geschafft!</h2>
          <p className="mt-1 text-muted">
            {practice ? `Du hast ${pluralCards(total)} geübt.` : `Du hast ${pluralCards(total)} gelernt.`}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tally.known}</p>
            <p className="text-sm text-muted">gewusst</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{tally.unknown}</p>
            <p className="text-sm text-muted">nicht gewusst</p>
          </div>
        </div>

        {!practice && (
          <div className="w-full glass rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tagesziel</span>
              <span className="text-muted tabular-nums">
                {todayCount} / {goal} {goalReached && "✓"}
              </span>
            </div>
            <ProgressBar className="mt-2 h-2" percent={(todayCount / goal) * 100} barClass={goalReached ? "bg-emerald-500" : "bg-indigo-500"} />
          </div>
        )}

        {!practice && (syncStatus === "syncing" || syncStatus === "ok") && (
          <p className="text-xs text-muted" role="status">
            {syncStatus === "syncing" ? "Lernstand wird für deinen Ausbilder aktualisiert …" : "☁️ Lernstand für deinen Ausbilder aktualisiert"}
          </p>
        )}
      </div>
    </SessionShell>
  );
}

function SummaryActions() {
  return (
    <div className="grid gap-2">
      <ButtonLink href="/learn">Weiter lernen</ButtonLink>
      <ButtonLink href="/" variant="ghost">
        Zur Startseite
      </ButtonLink>
    </div>
  );
}

/** Nichts zu lernen: entweder alles erledigt (→ freies Üben anbieten) oder noch gar keine Karten. */
function EmptyState({ scope, practice }: { scope: StudyScope; practice: boolean }) {
  const { data, today } = useAppData();
  const cardCount = getCards(data, scope.filter).length;
  const nextDue = getNextDueDate(data, today, scope.filter);

  if (cardCount === 0) {
    return (
      <SessionShell
        title={scope.title}
        subtitle={scope.subtitle}
        footer={
          <div className="grid gap-2">
            <ButtonLink href={scope.addCardHref}>Erste Karte anlegen</ButtonLink>
            <ButtonLink href="/learn" variant="ghost">
              Zur Auswahl
            </ButtonLink>
          </div>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-5xl">📭</p>
          <h2 className="text-xl font-bold">Noch keine Karten</h2>
          <p className="max-w-xs text-muted">
            In {scope.title} gibt es noch nichts zu lernen. Leg nach dem Unterricht einfach eine Karte mit Frage und Antwort an.
          </p>
        </div>
      </SessionShell>
    );
  }

  return (
    <SessionShell
      title={scope.title}
      subtitle={scope.subtitle}
      footer={
        <div className="grid gap-2">
          {!practice && <ButtonLink href={scope.practiceHref}>Trotzdem üben</ButtonLink>}
          <ButtonLink href={scope.addCardHref} variant="secondary">
            Eigene Karte hinzufügen
          </ButtonLink>
          <ButtonLink href="/learn" variant="ghost">
            Zur Auswahl
          </ButtonLink>
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="text-xl font-bold">Alles erledigt!</h2>
        <p className="max-w-xs text-muted">
          In {scope.title} ist gerade nichts fällig.
          {nextDue && (
            <>
              <br />
              Nächste Wiederholung: <span className="font-medium text-foreground">{formatDueDate(nextDue, today)}</span>
            </>
          )}
        </p>
        <p className="max-w-xs text-sm text-muted">Mit „Trotzdem üben“ kannst du alle {pluralCards(cardCount)} durchgehen, ohne deinen Plan zu verändern.</p>
      </div>
    </SessionShell>
  );
}
