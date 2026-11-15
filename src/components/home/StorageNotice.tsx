"use client";

import { useAppData, type StorageIssue } from "@/components/AppDataProvider";
import { IconX } from "@/components/icons";

const messages: Record<StorageIssue, { title: string; text: string }> = {
  "corrupt-reset": {
    title: "Gespeicherte Daten waren beschädigt",
    text: "Die App wurde mit den Startdaten neu gestartet. Eine Sicherung der alten Daten liegt im Gerät.",
  },
  quota: {
    title: "Speicher voll",
    text: "Deine letzte Änderung konnte nicht gespeichert werden. Gib etwas Speicher auf dem Gerät frei.",
  },
  unavailable: {
    title: "Speichern nicht möglich",
    text: "Der Browser erlaubt kein Speichern (z. B. privater Modus). Dein Fortschritt geht beim Schließen verloren.",
  },
};

/** Zeigt Probleme mit dem Gerätespeicher an (aus AppDataProvider), wegklickbar. */
export function StorageNotice() {
  const { storageIssue, dismissStorageIssue } = useAppData();
  if (!storageIssue) return null;
  const { title, text } = messages[storageIssue];

  return (
    <div role="status" className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <div className="flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">{title}</p>
        <p className="mt-1 text-amber-800/80 dark:text-amber-200/80">{text}</p>
      </div>
      <button type="button" onClick={dismissStorageIssue} aria-label="Hinweis schließen" className="self-start text-amber-800 dark:text-amber-300">
        <IconX className="size-4" />
      </button>
    </div>
  );
}
