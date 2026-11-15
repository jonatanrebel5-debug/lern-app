"use client";

import { useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { Button } from "@/components/ui";
import { pluralCards } from "@/lib/format";

/**
 * Hinweis auf die mitgelieferten Beispielkarten – mit Löschen in zwei Schritten
 * (eigene Bestätigung statt window.confirm, das in der iPhone-App unschön aussieht).
 */
export function ExampleCardsNotice() {
  const { data, hydrated, deleteExampleCards } = useAppData();
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) return null;
  const exampleCount = data.cards.filter((c) => c.isExample).length;
  if (exampleCount === 0) return null;
  const ownCount = data.cards.length - exampleCount;

  return (
    <section className="rounded-2xl border border-dashed border-border p-4 backdrop-blur-md">
      <p className="font-medium">Beispielkarten</p>
      <p className="mt-1 text-sm text-muted">
        {pluralCards(exampleCount)} sind Beispiele zum Ausprobieren
        {ownCount > 0 ? `, ${pluralCards(ownCount)} hast du selbst angelegt.` : "."} Wenn du genug eigene Karten hast, kannst du die Beispiele
        entfernen – deine eigenen Karten, Themen und deine Serie bleiben erhalten.
      </p>

      {confirming ? (
        <div className="mt-3 rounded-xl bg-rose-500/10 p-3" role="alertdialog" aria-label="Beispielkarten löschen bestätigen">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Wirklich alle {pluralCards(exampleCount)} löschen? Ihr Lernstand geht dabei verloren.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="py-2.5" onClick={() => setConfirming(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-rose-600 py-2.5 shadow-rose-500/20 dark:bg-rose-500"
              onClick={() => {
                deleteExampleCards();
                setConfirming(false);
              }}
            >
              Löschen
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
          Beispielkarten löschen
        </button>
      )}
    </section>
  );
}
