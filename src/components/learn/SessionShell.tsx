import Link from "next/link";
import type { ReactNode } from "react";
import { IconX } from "@/components/icons";
import { iconButtonClass } from "@/components/ui";

/**
 * Rahmen für den Lernmodus: Vollbild ohne untere Navigation (Fokus aufs Lernen),
 * oben Schließen-Knopf + Titel, unten optional eine Aktionsleiste mit Abstand zum Home-Indicator.
 */
export function SessionShell({
  title,
  subtitle,
  right,
  progress,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  progress?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-2xl">
      <header className="safe-top px-5 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            aria-label="Lernen beenden"
            className={iconButtonClass}
          >
            <IconX />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-semibold">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <div className="flex min-w-10 shrink-0 justify-end text-sm font-medium tabular-nums text-muted">{right}</div>
        </div>
        {progress && <div className="mt-3">{progress}</div>}
      </header>

      <main className="flex flex-1 flex-col px-5 pb-4">{children}</main>

      {footer && <footer className="safe-bottom px-5 pt-2">{footer}</footer>}
    </div>
  );
}
