"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { BottomNav } from "@/components/BottomNav";
import { IconChevronDown, IconChevronRight, IconPlus } from "@/components/icons";
import { ButtonLink, ProgressBar, Skeleton } from "@/components/ui";
import { pluralCards } from "@/lib/format";
import { addCardHref, learnHref } from "@/lib/scope";
import { getProgressStats, type ProgressStats } from "@/lib/srs";
import { subjectColors } from "@/lib/subject-colors";

/** Auswahl vor dem Lernen: alles Fällige, ein Fach oder ein einzelnes Thema. */
export function SubjectPicker() {
  const { data, hydrated, today } = useAppData();
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const subjects = [...data.subjects].sort((a, b) => a.order - b.order);
  const overall = hydrated ? getProgressStats(data, today) : null;
  const overallOpen = overall ? overall.dueCount + overall.newCount : 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-2xl">
      <header className="safe-top px-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Was möchtest du lernen?</p>
            <h1 className="text-2xl font-bold tracking-tight">Lernen</h1>
          </div>
          <Link
            href={addCardHref()}
            aria-label="Neue Karte anlegen"
            className="tap glass flex size-10 items-center justify-center rounded-full text-indigo-600 dark:text-indigo-400"
          >
            <IconPlus />
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pt-4 pb-28">
        {/* Alles Fällige */}
        <section className="glow-ring animate-fade-up rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white motion-reduce:animate-none">
          <p className="text-sm/5 opacity-80">Alle Fächer</p>
          <p className="mt-1 text-2xl font-bold">
            {overall ? (overallOpen > 0 ? `${pluralCards(overallOpen)} bereit` : "Alles erledigt ✓") : <Skeleton className="h-7 w-40 bg-white/25" />}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {overall ? `${overall.dueCount} zur Wiederholung · ${overall.newCount} neu` : <Skeleton className="h-4 w-48 bg-white/25" />}
          </p>
          <Link
            href={learnHref({ all: true })}
            className="tap mt-5 flex w-full items-center justify-center rounded-2xl bg-white py-3 font-semibold text-indigo-700"
          >
            {overall && overallOpen === 0 ? "Ansehen" : "Alles lernen"}
          </Link>
        </section>

        {/* Fächer */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Fächer</h2>
          <ul className="space-y-3">
            {subjects.map((subject) => {
              const colors = subjectColors[subject.color];
              const stats = hydrated ? getProgressStats(data, today, { subjectId: subject.id }) : null;
              const topics = data.topics.filter((t) => t.subjectId === subject.id).sort((a, b) => a.order - b.order);
              const isOpen = openSubject === subject.id;
              const badge = subject.shortName.length <= 4 ? subject.shortName : subject.shortName.slice(0, 2);

              return (
                <li key={subject.id} className="glass overflow-hidden rounded-2xl">
                  <div className="flex items-stretch">
                    <Link href={learnHref({ subjectId: subject.id })} className="flex min-w-0 flex-1 items-center gap-3 p-4 transition active:bg-border/40">
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} text-[11px] font-bold text-white`}
                      >
                        {badge}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{subject.shortName}</span>
                        <span className="block truncate text-sm text-muted">{subject.name}</span>
                      </span>
                      <OpenCount stats={stats} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpenSubject(isOpen ? null : subject.id)}
                      aria-expanded={isOpen}
                      aria-label={`Themen von ${subject.shortName} ${isOpen ? "ausblenden" : "anzeigen"}`}
                      className="flex w-12 shrink-0 items-center justify-center border-l border-border text-muted"
                    >
                      <IconChevronDown className={`size-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  <div className="px-4 pb-3">
                    {stats ? <ProgressBar percent={stats.percent} barClass={colors.bar} /> : <Skeleton className="h-1.5 w-full" />}
                  </div>

                  {isOpen && (
                    <ul className="border-t border-border">
                      {topics.length === 0 && <li className="px-4 py-3 text-sm text-muted">Noch keine Themen.</li>}
                      {topics.map((topic) => {
                        const topicStats = hydrated ? getProgressStats(data, today, { topicId: topic.id }) : null;
                        return (
                          <li key={topic.id} className="border-b border-border last:border-b-0">
                            <Link href={learnHref({ topicId: topic.id })} className="flex items-center gap-3 px-4 py-3 transition active:bg-border/40">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">{topic.name}</span>
                              <OpenCount stats={topicStats} small />
                              <IconChevronRight className="size-4 shrink-0 text-muted" />
                            </Link>
                          </li>
                        );
                      })}
                      <li>
                        <Link
                          href={addCardHref({ subjectId: subject.id })}
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${colors.text}`}
                        >
                          <IconPlus className="size-4" /> Karte zu {subject.shortName} hinzufügen
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <ButtonLink href={addCardHref()} variant="secondary">
          <IconPlus className="size-5" /> Eigene Karte anlegen
        </ButtonLink>
      </main>

      <BottomNav />
    </div>
  );
}

/** Kleines Abzeichen: wie viele Karten gerade zu lernen sind (fällig + neu) – oder ein Haken. */
function OpenCount({ stats, small = false }: { stats: ProgressStats | null; small?: boolean }) {
  if (!stats) return <Skeleton className="h-6 w-8 rounded-full" />;
  const open = stats.dueCount + stats.newCount;
  const size = small ? "min-w-7 px-2 py-0.5 text-xs" : "min-w-8 px-2.5 py-1 text-sm";

  if (stats.total === 0) return <span className={`${size} rounded-full text-center text-muted`}>–</span>;
  if (open === 0)
    return (
      <span className={`${size} rounded-full bg-emerald-500/15 text-center font-semibold text-emerald-600 dark:text-emerald-400`} title="Alles erledigt">
        ✓
      </span>
    );
  return (
    <span className={`${size} rounded-full bg-indigo-500/15 text-center font-semibold text-indigo-600 tabular-nums dark:text-indigo-300`} title={`${open} zu lernen`}>
      {open}
    </span>
  );
}
