import type { Metadata } from "next";
import { Suspense } from "react";
import { UnlockForm } from "@/components/auth/UnlockForm";

export const metadata: Metadata = {
  title: "Freischalten · Lern-App",
  robots: { index: false, follow: false },
};

export default function UnlockPage() {
  return (
    <Suspense>
      <UnlockForm />
    </Suspense>
  );
}
