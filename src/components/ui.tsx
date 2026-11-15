import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* Kleine, wiederverwendbare UI-Bausteine im App-Stil (Glas-Look + taktile Rückmeldung). */

/** Grauer Platzhalter, solange gespeicherte Daten noch geladen werden (verhindert Zahlen-Flackern). */
export function Skeleton({ className = "h-4 w-16" }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded-md bg-border align-middle ${className}`} aria-hidden="true" />;
}

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white glow-ring dark:from-indigo-500 dark:to-violet-500",
  secondary: "glass text-foreground",
  ghost: "text-muted",
};

const base =
  "tap flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold disabled:pointer-events-none disabled:opacity-40";

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

/** Fortschrittsbalken 0–100 % – animiert weich auf den neuen Wert */
export function ProgressBar({ percent, barClass = "bg-indigo-500", className = "h-1.5" }: { percent: number; barClass?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-border/70 ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${barClass}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

/** Runder Icon-Knopf (Zurück, Schließen, Aktualisieren …) */
export const iconButtonClass = "tap glass flex size-10 shrink-0 items-center justify-center rounded-full text-muted";
