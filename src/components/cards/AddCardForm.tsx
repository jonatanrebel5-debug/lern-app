"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { IconArrowLeft, IconCheck } from "@/components/icons";
import { LearnSkeleton } from "@/components/learn/LearnScreen";
import { Button, ButtonLink, iconButtonClass } from "@/components/ui";
import { pluralCards } from "@/lib/format";
import { learnHref } from "@/lib/scope";

const NEW_TOPIC = "__new__";

/** Formular zum schnellen Anlegen eigener Karten – z. B. direkt nach dem Unterricht. */
export function AddCardForm() {
  const { hydrated } = useAppData();
  // Erst nach dem Laden anzeigen: Eigene Themen existieren nur im Gerätespeicher.
  if (!hydrated) return <LearnSkeleton />;
  return <AddCardFormInner />;
}

function AddCardFormInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, addTopic, addCard } = useAppData();

  const subjects = [...data.subjects].sort((a, b) => a.order - b.order);
  const presetTopic = data.topics.find((t) => t.id === params.get("thema"));
  const presetSubject = presetTopic?.subjectId ?? subjects.find((s) => s.id === params.get("fach"))?.id ?? subjects[0]?.id ?? "";

  const [subjectId, setSubjectId] = useState(presetSubject);
  const topicsOfSubject = data.topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order);
  const [topicChoice, setTopicChoice] = useState(presetTopic?.id ?? topicsOfSubject[0]?.id ?? NEW_TOPIC);
  const [newTopicName, setNewTopicName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [lastTopicId, setLastTopicId] = useState<string | null>(null);
  const frontRef = useRef<HTMLTextAreaElement>(null);

  /** Zurück dorthin, woher man kam (Startseite oder Lernen); ohne Verlauf (direkt geöffnet) zur Lern-Auswahl. */
  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/learn");
  }

  const creatingTopic = topicChoice === NEW_TOPIC;
  const canSave = Boolean(subjectId && front.trim() && back.trim() && (!creatingTopic || newTopicName.trim()));

  function changeSubject(id: string) {
    setSubjectId(id);
    const first = data.topics.filter((t) => t.subjectId === id).sort((a, b) => a.order - b.order)[0];
    setTopicChoice(first?.id ?? NEW_TOPIC);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const topicId = creatingTopic ? addTopic(subjectId, newTopicName) : topicChoice;
    addCard(topicId, front, back);
    // Für die nächste Karte: Thema behalten, Felder leeren, Fokus zurück auf die Frage
    if (creatingTopic) {
      setTopicChoice(topicId);
      setNewTopicName("");
    }
    setFront("");
    setBack("");
    setSavedCount((n) => n + 1);
    setLastTopicId(topicId);
    frontRef.current?.focus();
  }

  const inputClass =
    "glass w-full rounded-2xl px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-2xl">
      <header className="safe-top px-5 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Zurück"
            className={iconButtonClass}
          >
            <IconArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Neue Karte</h1>
        </div>
      </header>

      <form onSubmit={save} className="flex flex-1 flex-col gap-4 px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Fach</span>
            <select value={subjectId} onChange={(e) => changeSubject(e.target.value)} className={inputClass}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Thema</span>
            <select value={topicChoice} onChange={(e) => setTopicChoice(e.target.value)} className={inputClass}>
              {topicsOfSubject.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value={NEW_TOPIC}>＋ Neues Thema …</option>
            </select>
          </label>
        </div>

        {creatingTopic && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Name des neuen Themas</span>
            <input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="z. B. Kaufvertrag"
              className={inputClass}
              maxLength={80}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Vorderseite (Frage / Begriff)</span>
          <textarea
            ref={frontRef}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
            placeholder="z. B. Was ist ein Kaufvertrag?"
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Rückseite (Antwort)</span>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={4}
            placeholder="z. B. Zwei übereinstimmende Willenserklärungen: Antrag und Annahme."
            className={`${inputClass} resize-none`}
          />
        </label>

        {savedCount > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400" role="status">
            <IconCheck className="size-4" /> {pluralCards(savedCount)} gespeichert – du kannst direkt die nächste eingeben.
          </p>
        )}

        <div className="safe-bottom mt-auto grid gap-2 pt-2">
          <Button type="submit" disabled={!canSave}>
            Karte speichern
          </Button>
          {lastTopicId ? (
            <ButtonLink href={learnHref({ topicId: lastTopicId })} variant="secondary">
              Jetzt dieses Thema lernen
            </ButtonLink>
          ) : (
            <Button variant="ghost" onClick={goBack}>
              Abbrechen
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
