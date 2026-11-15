"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { BottomNav } from "@/components/BottomNav";
import { IconCards, IconChart, IconChevronRight, IconPlus, IconSpark } from "@/components/icons";
import { ProgressBar, Skeleton } from "@/components/ui";
import { pluralCards } from "@/lib/format";
import { addCardHref, learnHref } from "@/lib/scope";
import { getProgressStats, getStreak, getTodayCount } from "@/lib/srs";
import { subjectColors } from "@/lib/subject-colors";
import { ExampleCardsNotice } from "./ExampleCardsNotice";
import { StorageNotice } from "./StorageNotice";

/**
 * Startseite mit echten Zahlen aus dem Gerätespeicher.
 * Bis die Daten geladen sind (hydrated = false), stehen an allen nutzerabhängigen Stellen
 * graue Platzhalter – so springt nichts von "0" auf den echten Wert.
 */
export function HomeScreen() {
  const { data, hydrated, today } = useAppData();

  const goal = data.settings.dailyGoal;
  const todayCount = hydrated ? getTodayCount(data.reviewLog, today) : 0;
  const streak = hydrated ? getStreak(data.reviewLog, today) : 0;
  const overall = hydrated ? getProgressStats(data, today) : null;
  const open = overall ? overall.dueCount + overall.newCount : 0;
  const goalReached = todayCount >= goal;
  const noCards = hydrated && data.cards.length === 0;

  const subjects = [...data.subjects].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-2xl">
      <header className="safe-top px-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Willkommen zurück</p>
            <h1 className="text-2xl font-bold tracking-tight">Lern-App</h1>
          </div>
          <Link
            href={addCardHref()}
            aria-label="Neue Karte anlegen"
            className="tap glow-ring flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
          >
            <IconPlus />
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pt-4 pb-28">
        <StorageNotice />

        {/* Tagesziel & Serie */}
        <section className="glow-ring animate-fade-up rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white motion-reduce:animate-none">
          <div className="flex items-center justify-between">
            <p className="text-sm/5 opacity-80">Tagesziel</p>
            <p className="text-sm opacity-90">
              {hydrated ? (
                streak > 0 ? (
                  `🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} Serie`
                ) : (
                  "🔥 Starte deine Serie"
                )
              ) : (
                <Skeleton className="h-4 w-24 bg-white/25" />
              )}
            </p>
          </div>

          <p className="mt-1 text-3xl font-bold tabular-nums">
            {hydrated ? todayCount : <Skeleton className="h-8 w-8 bg-white/25" />}{" "}
            <span className="text-lg font-medium opacity-80">/ {goal} Karten</span>
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-700"
              style={{ width: `${hydrated ? Math.min(100, (todayCount / goal) * 100) : 0}%` }}
            />
          </div>

          <p className="mt-3 min-h-5 text-sm opacity-90">
            {!hydrated ? (
              <Skeleton className="h-4 w-44 bg-white/25" />
            ) : noCards ? (
              "Noch keine Karten – leg deine erste an."
            ) : goalReached ? (
              "Tagesziel erreicht – stark! 🎉"
            ) : open > 0 ? (
              `${pluralCards(open)} bereit · ${overall?.dueCount ?? 0} zur Wiederholung`
            ) : (
              "Für heute ist alles wiederholt."
            )}
          </p>

          <Link
            href={noCards ? addCardHref() : learnHref({ all: true })}
            className="tap mt-4 flex w-full items-center justify-center rounded-2xl bg-white py-3 font-semibold text-indigo-700"
          >
            {noCards ? "Erste Karte anlegen" : !hydrated || open > 0 ? (goalReached ? "Weiterlernen" : "Jetzt lernen") : "Freiwillig üben"}
          </Link>
        </section>

        {/* Schnellzugriff */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Schnellzugriff</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickTile
              href="/learn"
              title="Karteikarten"
              subtitle={
                hydrated ? (noCards ? "Noch leer" : open > 0 ? `${open} bereit` : "Alles erledigt ✓") : <Skeleton className="h-4 w-16" />
              }
              icon={<IconCards />}
              tone="from-indigo-500 to-violet-500"
            />
            <QuickTile href={addCardHref()} title="Neue Karte" subtitle="Eigene anlegen" icon={<IconPlus />} tone="from-emerald-500 to-teal-500" />
            <QuickTile title="Quiz" subtitle="Bald verfügbar" icon={<IconSpark />} tone="from-sky-500 to-cyan-500" />
            <QuickTile title="Statistik" subtitle="Bald verfügbar" icon={<IconChart />} tone="from-amber-500 to-orange-500" />
          </div>
        </section>

        {/* Fächer mit Fortschritt */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Meine Fächer</h2>
            <Link href="/learn" className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Alle Themen
            </Link>
          </div>
          <ul className="space-y-3">
            {subjects.map((subject) => {
              const colors = subjectColors[subject.color];
              const stats = hydrated ? getProgressStats(data, today, { subjectId: subject.id }) : null;
              const subjectOpen = stats ? stats.dueCount + stats.newCount : 0;
              return (
                <li key={subject.id}>
                  <Link
                    href={learnHref({ subjectId: subject.id })}
                    className="tap glass block rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`size-2.5 shrink-0 rounded-full bg-gradient-to-br ${colors.gradient}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {subject.shortName}
                          {subject.shortName !== subject.name && <span className="font-normal text-muted"> · {subject.name}</span>}
                        </span>
                      </span>
                      <IconChevronRight className="size-4 shrink-0 text-muted" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted">
                      {stats ? (
                        <>
                          <span>
                            {stats.total === 0
                              ? "Noch keine Karten"
                              : subjectOpen > 0
                                ? `${subjectOpen} zu lernen · ${pluralCards(stats.total)}`
                                : `Alles erledigt · ${pluralCards(stats.total)}`}
                          </span>
                          <span className="tabular-nums">{stats.percent} %</span>
                        </>
                      ) : (
                        <>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-8" />
                        </>
                      )}
                    </div>
                    <div className="mt-2">
                      {stats ? <ProgressBar percent={stats.percent} barClass={colors.bar} /> : <Skeleton className="h-1.5 w-full" />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <ExampleCardsNotice />

        <Link
          href="/ausbilder"
          className="tap glass flex items-center gap-3 rounded-2xl p-4"
        >
          <span className="text-2xl" aria-hidden="true">
            👀
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Ausbilder-Ansicht</span>
            <span className="block text-sm text-muted">So sieht dein Ausbilder deinen Lernstand</span>
          </span>
          <IconChevronRight className="size-4 shrink-0 text-muted" />
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}

function QuickTile({
  href,
  title,
  subtitle,
  icon,
  tone,
}: {
  /** Ohne href = noch nicht verfügbar */
  href?: string;
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  tone: string;
}) {
  const content = (
    <>
      <span className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-lg shadow-black/20`}>{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
    </>
  );
  const className = "glass flex flex-col items-start gap-3 rounded-2xl p-4 text-left";

  return href ? (
    <Link href={href} className={`${className} tap`}>
      {content}
    </Link>
  ) : (
    <div className={`${className} opacity-60`} aria-disabled="true">
      {content}
    </div>
  );
}
