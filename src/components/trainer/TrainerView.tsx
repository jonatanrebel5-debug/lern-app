"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IconArrowLeft, IconRotate } from "@/components/icons";
import { ProgressBar, Skeleton, iconButtonClass } from "@/components/ui";
import { diffDays, toDateKey } from "@/lib/dates";
import { pluralCards } from "@/lib/format";
import { useAppData } from "@/components/AppDataProvider";
import { buildReport, getActivity, parseReport, percent, type ProgressReport, type SubjectReport } from "@/lib/report";
import { getStreak, getTodayCount } from "@/lib/srs";
import { subjectColors } from "@/lib/subject-colors";
import { ActivityChart } from "./ActivityChart";

type Role = "learner" | "trainer";
type LoadState =
  | { status: "loading" }
  | { status: "ok"; report: ProgressReport; role: Role; today: string }
  | { status: "empty" | "not-configured"; role: Role }
  | { status: "error" };

async function fetchReport(): Promise<LoadState> {
  try {
    const res = await fetch("/api/report", { cache: "no-store" });
    if (res.status === 401) {
      window.location.replace("/unlock?next=/ausbilder");
      return { status: "loading" };
    }
    const json = (await res.json()) as { status?: string; role?: Role; report?: unknown };
    const role: Role = json.role === "learner" ? "learner" : "trainer";
    if (json.status === "not-configured" || json.status === "empty") return { status: json.status, role };
    const report = json.status === "ok" ? parseReport(json.report) : null;
    if (!report) return { status: "error" };
    return { status: "ok", report, role, today: toDateKey(new Date()) };
  } catch {
    return { status: "error" };
  }
}

function formatUpdated(ms: number, today: string): string {
  const date = new Date(ms);
  const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const days = diffDays(toDateKey(date), today);
  if (days === 0) return `heute, ${time} Uhr`;
  if (days === 1) return `gestern, ${time} Uhr`;
  return `${date.toLocaleDateString("de-DE", { day: "numeric", month: "numeric", year: "numeric" })}, ${time} Uhr`;
}

/** Schreibgeschützte Ausbilder-Ansicht: zeigt die hochgeladene Zusammenfassung, verändert nichts. */
export function TrainerView() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setRefreshing(true);
    const next = await fetchReport();
    setState(next);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReport().then((next) => {
      if (!cancelled) setState(next);
    });
    // Beim Zurückkehren in die App automatisch aktualisieren
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchReport().then((next) => !cancelled && setState(next));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const role = "role" in state ? state.role : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-2xl">
      <header className="safe-top px-5 pb-2">
        <div className="flex items-center gap-3">
          {role === "learner" && (
            <Link
              href="/"
              aria-label="Zurück zur App"
              className={iconButtonClass}
            >
              <IconArrowLeft />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">Ausbilder-Ansicht</p>
            <h1 className="text-2xl font-bold tracking-tight">Lernstand</h1>
          </div>
          <span className="glass shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted">🔒 Nur Ansicht</span>
          <button
            type="button"
            onClick={reload}
            aria-label="Aktualisieren"
            disabled={refreshing}
            className={`${iconButtonClass} disabled:opacity-50`}
          >
            <IconRotate className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {state.status === "ok" && <p className="mt-2 text-xs text-muted">Stand: {formatUpdated(state.report.updatedAt, state.today)}</p>}
      </header>

      <main className="flex-1 space-y-6 px-5 pt-4 pb-10">
        {state.status === "loading" && <LoadingState />}
        {state.status === "not-configured" && (
          <Notice emoji="☁️" title="Cloud-Speicher noch nicht verbunden">
            Hier erscheint der Lernstand, sobald die App online ist und der Speicher (Upstash Redis) verbunden wurde. Während der
            Entwicklung auf dem eigenen Rechner ist das normal – die App funktioniert trotzdem ganz normal.
          </Notice>
        )}
        {state.status === "not-configured" && state.role === "learner" && <LocalPreview />}
        {state.status === "empty" && (
          <Notice emoji="📭" title="Noch keine Daten">
            Sobald die erste Lern-Sitzung abgeschlossen ist, erscheint hier automatisch der Lernstand.
          </Notice>
        )}
        {state.status === "error" && (
          <Notice emoji="⚠️" title="Konnte nicht geladen werden">
            Bitte prüfe die Internetverbindung und tippe oben auf Aktualisieren.
          </Notice>
        )}
        {state.status === "ok" && <Report report={state.report} today={state.today} />}

        <p className="text-center text-xs text-muted">Diese Ansicht ist schreibgeschützt – hier lässt sich nichts verändern oder löschen.</p>
        {role === "trainer" && <LockButton />}
      </main>
    </div>
  );
}

function Report({ report, today }: { report: ProgressReport; today: string }) {
  const { totals } = report;
  const streak = getStreak(report.reviewLog, today);
  const todayCount = getTodayCount(report.reviewLog, today);
  const activity = getActivity(report.reviewLog, today, 14);
  const activeDays = activity.filter((d) => d.count > 0).length;
  const sum14 = activity.reduce((s, d) => s + d.count, 0);

  const fields = report.subjects.filter((s) => /^LF\d+/i.test(s.shortName));
  const others = report.subjects.filter((s) => !/^LF\d+/i.test(s.shortName));

  return (
    <>
      {/* Gesamtfortschritt */}
      <section className="glow-ring animate-fade-up rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white motion-reduce:animate-none">
        <p className="text-sm/5 opacity-80">Gesamtfortschritt</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{percent(totals.known, totals.cards)} %</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${percent(totals.known, totals.cards)}%` }}
          />
        </div>
        <p className="mt-3 text-sm opacity-90">
          {totals.known} von {pluralCards(totals.cards)} gewusst · {totals.mastered} sicher gelernt
        </p>
      </section>

      {/* Serie & Tagesziel */}
      <section className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">Serie</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            🔥 {streak} <span className="text-base font-medium text-muted">{streak === 1 ? "Tag" : "Tage"}</span>
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">Heute</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {todayCount} <span className="text-base font-medium text-muted">/ {report.dailyGoal}</span>
          </p>
          <ProgressBar className="mt-2 h-1.5" percent={(todayCount / report.dailyGoal) * 100} barClass={todayCount >= report.dailyGoal ? "bg-emerald-500" : "bg-indigo-500"} />
        </div>
      </section>

      {/* Aktivität */}
      <section className="glass rounded-2xl p-4">
        <h2 className="font-semibold">Lernaktivität · letzte 14 Tage</h2>
        <p className="mb-4 text-sm text-muted">
          {pluralCards(sum14)} an {activeDays} {activeDays === 1 ? "Tag" : "Tagen"}
        </p>
        <ActivityChart days={activity} goal={report.dailyGoal} today={today} />
      </section>

      {/* Lernfelder */}
      {fields.length > 0 && <SubjectList title="Lernfelder" subjects={fields} />}
      {others.length > 0 && <SubjectList title="Weitere Fächer" subjects={others} />}

      <p className="text-xs text-muted">
        „Gewusst“ = zuletzt richtig beantwortet. „Sicher“ = über mehrere Wochen hinweg immer wieder gewusst. Insgesamt{" "}
        {totals.reviews} Antworten · {totals.ownCards} eigene Karten
        {totals.exampleCards > 0 && `, ${totals.exampleCards} Beispielkarten`}.
      </p>
    </>
  );
}

/** Ohne Cloud: Vorschau mit den Daten dieses Geräts – so sieht die Seite später für den Ausbilder aus. */
function LocalPreview() {
  const { data, hydrated, today } = useAppData();
  const [now] = useState(() => Date.now());
  if (!hydrated) return null;
  return (
    <>
      <p className="text-center text-xs font-medium tracking-wide text-muted uppercase">Vorschau mit den Daten auf diesem Gerät</p>
      <Report report={buildReport(data, today, now)} today={today} />
    </>
  );
}

function SubjectList({ title, subjects }: { title: string; subjects: SubjectReport[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ul className="space-y-3">
        {subjects.map((s) => {
          const colors = subjectColors[s.color];
          const pct = percent(s.known, s.total);
          return (
            <li key={s.id} className="glass rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full bg-gradient-to-br ${colors.gradient}`} aria-hidden="true" />
                <p className="min-w-0 flex-1 font-medium">
                  {s.shortName}
                  {s.name !== s.shortName && <span className="font-normal text-muted"> · {s.name}</span>}
                </p>
                <span className="shrink-0 font-semibold tabular-nums">{pct} %</span>
              </div>
              <ProgressBar className="mt-3 h-1.5" percent={pct} barClass={colors.bar} />
              <p className="mt-2 text-sm text-muted">
                {s.total === 0
                  ? "Noch keine Karten"
                  : `${s.known} von ${s.total} gewusst · ${s.mastered} sicher · ${s.newCount} noch nicht gelernt`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Notice({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-6 text-center">
      <p className="text-4xl">{emoji}</p>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}

function LockButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/lock", { method: "POST" }).catch(() => {});
        window.location.replace("/unlock");
      }}
      className="mx-auto block text-sm font-medium text-muted underline underline-offset-4"
    >
      Auf diesem Gerät abmelden
    </button>
  );
}
