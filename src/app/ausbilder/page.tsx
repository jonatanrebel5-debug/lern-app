import type { Metadata } from "next";
import { TrainerView } from "@/components/trainer/TrainerView";

export const metadata: Metadata = {
  title: "Ausbilder-Ansicht · Lern-App",
  robots: { index: false, follow: false },
};

/** Schreibgeschützte Übersicht über den Lernstand (Ausbilder-Code oder Lern-Code). */
export default function TrainerPage() {
  return <TrainerView />;
}
