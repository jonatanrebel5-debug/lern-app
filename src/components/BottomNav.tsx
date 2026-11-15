"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IconCards, IconChart, IconHome, IconUser } from "./icons";

interface NavEntry {
  label: string;
  /** Ohne href = Bereich ist noch nicht gebaut */
  href?: string;
  icon: ReactNode;
}

const entries: NavEntry[] = [
  { label: "Start", href: "/", icon: <IconHome className="size-6" /> },
  { label: "Lernen", href: "/learn", icon: <IconCards className="size-6" /> },
  { label: "Statistik", icon: <IconChart className="size-6" /> },
  { label: "Profil", icon: <IconUser className="size-6" /> },
];

/** Untere Navigationsleiste im iOS-Stil: Glas, schwebend, mit Abstand zum Home-Indicator. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 px-4 pt-2">
      <ul className="glass-strong mx-auto grid max-w-md grid-cols-4 rounded-3xl p-1.5 md:max-w-2xl">
        {entries.map((entry) => {
          const active = entry.href && (entry.href === "/" ? pathname === "/" : pathname.startsWith(entry.href));
          const className = `tap flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium ${
            active ? "bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300" : "text-muted"
          }`;
          return (
            <li key={entry.label}>
              {entry.href ? (
                <Link href={entry.href} className={className} aria-current={active ? "page" : undefined}>
                  {entry.icon}
                  {entry.label}
                </Link>
              ) : (
                <span className={`${className} opacity-50`} aria-disabled="true" title="Kommt bald">
                  {entry.icon}
                  {entry.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
