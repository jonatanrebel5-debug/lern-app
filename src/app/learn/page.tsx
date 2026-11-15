import type { Metadata } from "next";
import { Suspense } from "react";
import { LearnScreen, LearnSkeleton } from "@/components/learn/LearnScreen";

export const metadata: Metadata = {
  title: "Lernen · Lern-App",
};

/**
 * /learn            → Auswahl (Fach / Thema / alles)
 * /learn?fach=…     → Lern-Sitzung (siehe src/lib/scope.ts)
 * Die URL-Parameter werden im Browser gelesen; Suspense liefert bis dahin einen Platzhalter.
 */
export default function LearnPage() {
  return (
    <Suspense fallback={<LearnSkeleton />}>
      <LearnScreen />
    </Suspense>
  );
}
