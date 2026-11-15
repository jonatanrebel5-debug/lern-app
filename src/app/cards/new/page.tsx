import type { Metadata } from "next";
import { Suspense } from "react";
import { AddCardForm } from "@/components/cards/AddCardForm";
import { LearnSkeleton } from "@/components/learn/LearnScreen";

export const metadata: Metadata = {
  title: "Neue Karte · Lern-App",
};

/** /cards/new?fach=lf02&thema=lf02.pc-aufbau – Fach/Thema sind optional vorausgewählt. */
export default function NewCardPage() {
  return (
    <Suspense fallback={<LearnSkeleton />}>
      <AddCardForm />
    </Suspense>
  );
}
