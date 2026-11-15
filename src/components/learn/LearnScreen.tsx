"use client";

import { useSearchParams } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import { ButtonLink, Skeleton } from "@/components/ui";
import { resolveScope } from "@/lib/scope";
import { getCards, getStudyQueue } from "@/lib/srs";
import { SessionShell } from "./SessionShell";
import { StudySession } from "./StudySession";
import { SubjectPicker } from "./SubjectPicker";

/** Entscheidet anhand der URL: Auswahl anzeigen oder eine Lern-Sitzung starten. */
export function LearnScreen() {
  const params = useSearchParams();
  const { data, hydrated, today } = useAppData();

  const subjectId = params.get("fach");
  const topicId = params.get("thema");
  const all = params.has("alle");
  const practice = params.has("ueben");

  if (!subjectId && !topicId && !all) return <SubjectPicker />;

  // Die Warteschlange hängt vom gespeicherten Lernstand ab → erst nach dem Laden berechnen.
  if (!hydrated) return <LearnSkeleton />;

  const scope = resolveScope(data, { subjectId, topicId, all });
  if (!scope) {
    return (
      <SessionShell title="Nicht gefunden">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-4xl">🤔</p>
          <p className="text-muted">Dieses Fach oder Thema gibt es nicht (mehr).</p>
          <div className="w-full max-w-xs">
            <ButtonLink href="/learn">Zur Auswahl</ButtonLink>
          </div>
        </div>
      </SessionShell>
    );
  }

  // Wird nur beim Start der Sitzung übernommen (siehe StudySession) – spätere Änderungen sortieren nicht um.
  const queue = practice
    ? getCards(data, scope.filter).map((c) => c.id)
    : getStudyQueue(data, today, scope.filter).map((c) => c.id);

  return <StudySession key={`${scope.key}|${practice ? "practice" : "review"}`} scope={scope} initialQueue={queue} practice={practice} />;
}

export function LearnSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 safe-top md:max-w-2xl" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-72 w-full rounded-3xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}
