import type { CardFilter } from "./srs";
import type { AppData, SubjectColor } from "./types";

/**
 * "Lernbereich": Was in einer Sitzung gelernt wird – alles, ein Fach oder ein Thema.
 * Wird über die URL gesteuert, damit Startseite & Auswahl direkt hinein verlinken können:
 *   /learn?alle=1            alle fälligen Karten
 *   /learn?fach=lf02         ein Fach
 *   /learn?thema=lf02.pc-…   ein Thema
 *   …&ueben=1                freies Üben (beeinflusst die Wiederholungsplanung nicht)
 */
export interface StudyScope {
  /** Eindeutiger Schlüssel (für React-keys) */
  key: string;
  title: string;
  subtitle?: string;
  filter: CardFilter;
  color: SubjectColor;
  /** Link zum regulären Lernen in diesem Bereich */
  href: string;
  /** Link zum freien Üben in diesem Bereich */
  practiceHref: string;
  /** Link zum Anlegen einer Karte (mit vorausgewähltem Fach/Thema) */
  addCardHref: string;
}

export interface ScopeParams {
  subjectId?: string | null;
  topicId?: string | null;
  all?: boolean;
}

export function learnHref(params: ScopeParams, practice = false): string {
  const q = new URLSearchParams();
  if (params.topicId) q.set("thema", params.topicId);
  else if (params.subjectId) q.set("fach", params.subjectId);
  else q.set("alle", "1");
  if (practice) q.set("ueben", "1");
  return `/learn?${q.toString()}`;
}

export function addCardHref(params: { subjectId?: string; topicId?: string } = {}): string {
  const q = new URLSearchParams();
  if (params.subjectId) q.set("fach", params.subjectId);
  if (params.topicId) q.set("thema", params.topicId);
  const s = q.toString();
  return s ? `/cards/new?${s}` : "/cards/new";
}

/** Ermittelt den Lernbereich aus den URL-Parametern; null, wenn Fach/Thema nicht existiert. */
export function resolveScope(data: AppData, params: ScopeParams): StudyScope | null {
  if (params.topicId) {
    const topic = data.topics.find((t) => t.id === params.topicId);
    const subject = topic && data.subjects.find((s) => s.id === topic.subjectId);
    if (!topic || !subject) return null;
    return {
      key: `topic:${topic.id}`,
      title: topic.name,
      subtitle: subject.shortName,
      filter: { topicId: topic.id },
      color: subject.color,
      href: learnHref({ topicId: topic.id }),
      practiceHref: learnHref({ topicId: topic.id }, true),
      addCardHref: addCardHref({ subjectId: subject.id, topicId: topic.id }),
    };
  }

  if (params.subjectId) {
    const subject = data.subjects.find((s) => s.id === params.subjectId);
    if (!subject) return null;
    return {
      key: `subject:${subject.id}`,
      title: subject.shortName,
      subtitle: subject.name !== subject.shortName ? subject.name : undefined,
      filter: { subjectId: subject.id },
      color: subject.color,
      href: learnHref({ subjectId: subject.id }),
      practiceHref: learnHref({ subjectId: subject.id }, true),
      addCardHref: addCardHref({ subjectId: subject.id }),
    };
  }

  return {
    key: "all",
    title: "Alle Fächer",
    filter: {},
    color: "indigo",
    href: learnHref({ all: true }),
    practiceHref: learnHref({ all: true }, true),
    addCardHref: addCardHref(),
  };
}
