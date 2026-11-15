"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

type Status = "idle" | "checking" | "wrong" | "not-configured" | "offline";

const messages: Partial<Record<Status, string>> = {
  wrong: "Der Code stimmt nicht. Versuch es nochmal.",
  "not-configured": "Die App ist noch nicht eingerichtet (kein Zugriffscode auf dem Server hinterlegt).",
  offline: "Keine Verbindung zum Server. Bitte prüfe dein Internet.",
};

/** Code-Eingabe. Geprüft wird ausschließlich auf dem Server (/api/unlock). */
export function UnlockForm() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || status === "checking") return;
    setStatus("checking");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, next: params.get("next") }),
      });
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; next?: string; error?: string };
      if (res.ok && result.ok) {
        // Voller Seitenwechsel, damit der Server das neue Cookie sieht
        window.location.replace(result.next ?? "/");
        return;
      }
      setStatus(result.error === "not-configured" ? "not-configured" : "wrong");
      if (result.error !== "not-configured") setCode("");
    } catch {
      setStatus("offline");
    }
  }

  const message = messages[status];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 safe-top safe-bottom">
      <div className="flex flex-col items-center text-center">
        <div className="glow-ring flex size-20 animate-fade-up items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-4xl font-bold text-white motion-reduce:animate-none">
          L
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Lern-App</h1>
        <p className="mt-1 text-muted">Bitte gib deinen Zugriffscode ein.</p>
        <p className="mt-1 text-xs text-muted">Ausbilder: Mit dem Ausbilder-Code geht es direkt zur Lernstand-Übersicht.</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {/* Verstecktes Benutzerfeld: hilft dem iPhone-Schlüsselbund, den Code zu speichern */}
        <input type="text" name="username" autoComplete="username" value="lern-app" readOnly hidden />
        <label className="block">
          <span className="sr-only">Zugriffscode</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status === "wrong") setStatus("idle");
            }}
            placeholder="Zugriffscode"
            aria-invalid={status === "wrong"}
            aria-describedby={message ? "unlock-message" : undefined}
            className={`glass w-full rounded-2xl px-4 py-4 text-center text-xl tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-base focus:ring-2 ${
              status === "wrong" ? "border-rose-500 focus:ring-rose-500/20" : "border-border focus:border-indigo-500 focus:ring-indigo-500/20"
            }`}
          />
        </label>

        {message && (
          <p id="unlock-message" role="alert" className="text-center text-sm text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}

        <Button type="submit" disabled={!code.trim() || status === "checking"}>
          {status === "checking" ? "Prüfe …" : "Freischalten"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted">Du musst den Code auf jedem Gerät nur einmal eingeben.</p>
    </div>
  );
}
