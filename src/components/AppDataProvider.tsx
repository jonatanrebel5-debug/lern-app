"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { appDataReducer, type AppDataAction } from "@/lib/app-data";
import { toDateKey } from "@/lib/dates";
import { applyDemoActivity } from "@/lib/demo";
import { buildReport, reportFingerprint } from "@/lib/report";
import { uploadReport, type SyncResult } from "@/lib/report-sync";
import { createInitialData } from "@/lib/seed";
import { STORAGE_KEY, loadAppData, parseAppData, saveSerialized } from "@/lib/storage";
import type { AppData } from "@/lib/types";

/** Stand des Uploads für die Ausbilder-Ansicht */
export type SyncStatus = "idle" | "syncing" | SyncResult;

/**
 * Zentrale Datenverwaltung der App.
 *
 * Hydration-sicherer Ablauf:
 *  1. Server UND Browser rendern zuerst mit createInitialData() (identisch, feste IDs) → kein Mismatch.
 *  2. Nach dem Mounten (useEffect, nur im Browser) werden die gespeicherten Daten geladen
 *     und `hydrated` wird true. Erst ab dann ist auch `today` gesetzt.
 *  3. Jede Änderung wird danach automatisch in localStorage gespeichert.
 *
 * Gegen Flackern: Komponenten zeigen nutzerabhängige Werte (Zahlen, Fortschritt) erst,
 * wenn `hydrated` true ist – vorher einen neutralen Platzhalter (Skeleton).
 */

/** Probleme mit dem Gerätespeicher, die die Oberfläche dem Nutzer anzeigen kann. */
export type StorageIssue =
  | "corrupt-reset" // gespeicherte Daten waren kaputt → neu gestartet (Backup liegt unter BACKUP_KEY)
  | "quota" // Speicher voll → letzte Änderung konnte nicht gespeichert werden
  | "unavailable"; // localStorage nicht nutzbar → Daten gehen beim Schließen verloren

interface State {
  data: AppData;
  hydrated: boolean;
  /** Heutiger Kalendertag "YYYY-MM-DD"; leer bis zur Hydration (der Server kennt "heute" des Geräts nicht) */
  today: string;
  storageIssue: StorageIssue | null;
  /** Zähler: jede Erhöhung fordert einen Upload für die Ausbilder-Ansicht an (mit dem dann aktuellen Stand) */
  syncRequest: number;
  syncStatus: SyncStatus;
}

type Action =
  | { type: "hydrate"; data: AppData | null; today: string; issue: StorageIssue | null }
  | { type: "replaceData"; data: AppData }
  | { type: "setToday"; today: string }
  | { type: "setStorageIssue"; issue: StorageIssue | null }
  | { type: "requestSync" }
  | { type: "setSyncStatus"; status: SyncStatus }
  | { type: "data"; action: AppDataAction };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, data: action.data ?? state.data, hydrated: true, today: action.today, storageIssue: action.issue };
    case "requestSync":
      return { ...state, syncRequest: state.syncRequest + 1 };
    case "setSyncStatus":
      return action.status === state.syncStatus ? state : { ...state, syncStatus: action.status };
    case "replaceData":
      return { ...state, data: action.data };
    case "setToday":
      return action.today === state.today ? state : { ...state, today: action.today };
    case "setStorageIssue":
      return action.issue === state.storageIssue ? state : { ...state, storageIssue: action.issue };
    case "data": {
      const data = appDataReducer(state.data, action.action);
      return data === state.data ? state : { ...state, data };
    }
  }
}

function createInitialState(): State {
  return { data: createInitialData(), hydrated: false, today: "", storageIssue: null, syncRequest: 0, syncStatus: "idle" };
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface AppDataContextValue {
  data: AppData;
  /** true, sobald die gespeicherten Daten aus dem Gerät geladen sind */
  hydrated: boolean;
  /** Heutiger Tag "YYYY-MM-DD" (leer vor der Hydration) */
  today: string;
  storageIssue: StorageIssue | null;
  dismissStorageIssue: () => void;

  /** Bewertet eine Karte: knew = true ("Wusste ich") oder false ("Wusste ich nicht") */
  rateCard: (cardId: string, knew: boolean) => void;
  /** Legt ein neues Thema in einem Fach an und gibt seine ID zurück */
  addTopic: (subjectId: string, name: string) => string;
  /** Legt eine neue Karte an und gibt ihre ID zurück */
  addCard: (topicId: string, front: string, back: string) => string;
  updateCard: (cardId: string, front: string, back: string) => void;
  deleteCard: (cardId: string) => void;
  /** Löscht alle mitgelieferten Beispielkarten samt Lernstand (Fächer, Themen & Serie bleiben) */
  deleteExampleCards: () => void;
  /** Ändert das Tagesziel (und aktualisiert die Ausbilder-Ansicht) */
  setDailyGoal: (dailyGoal: number) => void;
  /** Setzt alles auf die Startdaten zurück (Lernstand & eigene Karten gehen verloren) */
  resetAllData: () => void;

  /** Lädt den aktuellen Lernstand für die Ausbilder-Ansicht hoch (z. B. am Ende einer Sitzung) */
  requestReportSync: () => void;
  syncStatus: SyncStatus;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  /** Zuletzt gespeicherter Stand – verhindert unnötige Schreibvorgänge und Endlosschleifen zwischen Tabs */
  const lastSaved = useRef<string | null>(null);

  // 1) Nach dem Mounten: gespeicherte Daten laden (nur im Browser)
  useEffect(() => {
    const result = loadAppData();
    const issue: StorageIssue | null =
      result.status === "corrupt" ? "corrupt-reset" : result.status === "unavailable" ? "unavailable" : null;
    if (result.status === "ok") lastSaved.current = JSON.stringify(result.data);
    const now = new Date();
    const today = toDateKey(now);
    // Allererster Start (noch nichts gespeichert): Startdaten mit Demo-Aktivität beleben.
    // Passiert bewusst erst hier im Browser, weil "heute" relativ ist (Hydration-sicher).
    const data =
      result.status === "ok" ? result.data : result.status === "empty" ? applyDemoActivity(createInitialData(), today, now.getTime()) : null;
    dispatch({ type: "hydrate", data, today, issue });

    // Browser bitten, die Daten nicht automatisch zu löschen (Safari räumt sonst bei Websites nach einiger Zeit auf).
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  // 2) Jede Änderung speichern (erst nach dem Laden, sonst würden Startdaten echte Daten überschreiben)
  useEffect(() => {
    if (!state.hydrated) return;
    const json = JSON.stringify(state.data);
    if (json === lastSaved.current) return;

    const result = saveSerialized(json);
    if (result.ok) {
      lastSaved.current = json;
      if (state.storageIssue === "quota") dispatch({ type: "setStorageIssue", issue: null });
    } else {
      dispatch({ type: "setStorageIssue", issue: result.reason === "quota" ? "quota" : "unavailable" });
    }
  }, [state.data, state.hydrated, state.storageIssue]);

  // 2b) Upload für die Ausbilder-Ansicht
  const sync = useRef({
    /** Inhalt des letzten erfolgreichen Uploads (ohne Zeitstempel) */
    lastFingerprint: null as string | null,
    /** true, wenn Hochladen hier keinen Sinn hat (kein Cloud-Speicher / Ausbilder-Gerät) */
    disabled: false,
    handledRequest: 0,
    /** Daten direkt nach dem Laden – nur echte Änderungen auf diesem Gerät werden hochgeladen */
    baseline: null as AppData | null,
    latest: null as AppData | null,
  });

  const upload = useCallback(async (data: AppData, keepalive = false) => {
    const s = sync.current;
    if (s.disabled) return;
    const report = buildReport(data, toDateKey(new Date()), Date.now());
    const fingerprint = reportFingerprint(report);
    if (fingerprint === s.lastFingerprint) return;

    if (!keepalive) dispatch({ type: "setSyncStatus", status: "syncing" });
    const result = await uploadReport(report, { keepalive });
    if (result === "ok") s.lastFingerprint = fingerprint;
    // Kein Cloud-Speicher (lokal) oder kein Lern-Gerät: still überspringen, nicht ständig neu versuchen
    if (result === "not-configured" || result === "forbidden") s.disabled = true;
    if (!keepalive) dispatch({ type: "setSyncStatus", status: result });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    sync.current.latest = state.data;
    sync.current.baseline ??= state.data;
  }, [state.data, state.hydrated]);

  // Angeforderter Upload (Sitzungsende, Tagesziel geändert) – läuft mit dem dann aktuellen Stand
  useEffect(() => {
    if (!state.hydrated || state.syncRequest <= sync.current.handledRequest) return;
    sync.current.handledRequest = state.syncRequest;
    void upload(state.data);
  }, [state.syncRequest, state.hydrated, state.data, upload]);

  // Sicherheitsnetz: Wird die App geschlossen/in den Hintergrund gelegt (z. B. Sitzung abgebrochen),
  // werden Änderungen dieses Geräts noch schnell hochgeladen.
  useEffect(() => {
    const onHide = () => {
      const { latest, baseline } = sync.current;
      if (document.visibilityState !== "hidden" || !latest || latest === baseline) return;
      void upload(latest, true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [upload]);

  // 3) "Heute" aktuell halten – die App kann auf dem iPhone tagelang im Hintergrund offen bleiben
  useEffect(() => {
    const refreshToday = () => {
      if (document.visibilityState === "visible") dispatch({ type: "setToday", today: toDateKey(new Date()) });
    };
    document.addEventListener("visibilitychange", refreshToday);
    window.addEventListener("focus", refreshToday);
    const timer = window.setInterval(refreshToday, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", refreshToday);
      window.removeEventListener("focus", refreshToday);
      window.clearInterval(timer);
    };
  }, []);

  // 4) Änderungen aus einem anderen Tab übernehmen (z. B. App zweimal im Mac-Browser offen)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      const data = parseAppData(event.newValue);
      if (!data) return;
      lastSaved.current = event.newValue;
      dispatch({ type: "replaceData", data });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const rateCard = useCallback((cardId: string, knew: boolean) => {
    const now = new Date();
    dispatch({ type: "data", action: { type: "rateCard", cardId, knew, today: toDateKey(now), now: now.getTime() } });
  }, []);

  const addTopic = useCallback(
    (subjectId: string, name: string) => {
      const id = newId();
      const order = state.data.topics.filter((t) => t.subjectId === subjectId).length;
      dispatch({ type: "data", action: { type: "addTopic", topic: { id, subjectId, name: name.trim(), order } } });
      return id;
    },
    [state.data.topics],
  );

  const addCard = useCallback((topicId: string, front: string, back: string) => {
    const id = newId();
    dispatch({
      type: "data",
      action: { type: "addCard", card: { id, topicId, front: front.trim(), back: back.trim(), createdAt: Date.now() } },
    });
    return id;
  }, []);

  const updateCard = useCallback((cardId: string, front: string, back: string) => {
    dispatch({ type: "data", action: { type: "updateCard", cardId, front: front.trim(), back: back.trim() } });
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    dispatch({ type: "data", action: { type: "deleteCard", cardId } });
  }, []);

  const deleteExampleCards = useCallback(() => {
    dispatch({ type: "data", action: { type: "deleteExampleCards" } });
  }, []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    dispatch({ type: "data", action: { type: "setDailyGoal", dailyGoal } });
    dispatch({ type: "requestSync" });
  }, []);

  const requestReportSync = useCallback(() => dispatch({ type: "requestSync" }), []);

  const resetAllData = useCallback(() => {
    dispatch({ type: "replaceData", data: createInitialData() });
  }, []);

  const dismissStorageIssue = useCallback(() => dispatch({ type: "setStorageIssue", issue: null }), []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data: state.data,
      hydrated: state.hydrated,
      today: state.today,
      storageIssue: state.storageIssue,
      dismissStorageIssue,
      rateCard,
      addTopic,
      addCard,
      updateCard,
      deleteCard,
      deleteExampleCards,
      setDailyGoal,
      resetAllData,
      requestReportSync,
      syncStatus: state.syncStatus,
    }),
    [
      state,
      dismissStorageIssue,
      rateCard,
      addTopic,
      addCard,
      updateCard,
      deleteCard,
      deleteExampleCards,
      setDailyGoal,
      resetAllData,
      requestReportSync,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** Zugriff auf Daten und Aktionen – in jeder Client-Komponente unterhalb des AppDataProviders. */
export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData muss innerhalb von <AppDataProvider> verwendet werden.");
  return context;
}
