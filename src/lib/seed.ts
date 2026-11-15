import { DEFAULT_DAILY_GOAL } from "./app-data";
import type { AppData, Card, Subject, SubjectColor, Topic } from "./types";

/**
 * Startdaten der App: Fächer, Themen und Beispielkarten.
 * Ausbildung: Kaufmann/-frau für Digitalisierungsmanagement (LF01–LF05) + Englisch + GGK.
 *
 * Die Inhalte sind hier kompakt verschachtelt notiert und werden unten in die flachen
 * Listen aus types.ts umgewandelt. IDs sind fest (nicht zufällig), damit Server und
 * Browser exakt dieselben Startdaten erzeugen.
 */

type SeedCard = [front: string, back: string];
interface SeedTopic {
  id: string;
  name: string;
  cards: SeedCard[];
}
interface SeedSubject {
  id: string;
  shortName: string;
  name: string;
  color: SubjectColor;
  topics: SeedTopic[];
}

const SEED_CREATED_AT = Date.UTC(2026, 10, 15);

const seedSource: SeedSubject[] = [
  {
    id: "lf01",
    shortName: "LF01",
    name: "Das Unternehmen und die eigene Rolle im Betrieb beschreiben",
    color: "indigo",
    topics: [
      {
        id: "ziele-rechtsformen",
        name: "Unternehmensziele & Rechtsformen",
        cards: [
          [
            "Was besagt das ökonomische Prinzip (Maximal- und Minimalprinzip)?",
            "Maximalprinzip: Mit gegebenen Mitteln einen möglichst großen Erfolg erzielen.\nMinimalprinzip: Ein festgelegtes Ziel mit möglichst geringem Mitteleinsatz erreichen.",
          ],
          [
            "Welche drei Zieldimensionen der Nachhaltigkeit verfolgen Unternehmen?",
            "Ökonomische Ziele (z. B. Gewinn), ökologische Ziele (z. B. Ressourcen schonen) und soziale Ziele (z. B. sichere Arbeitsplätze).",
          ],
          [
            "Wie haften Einzelunternehmen und GmbH?",
            "Einzelunternehmer haften unbeschränkt, auch mit ihrem Privatvermögen.\nDie GmbH haftet nur mit dem Gesellschaftsvermögen (Mindest-Stammkapital: 25.000 €).",
          ],
          [
            "Was sind Stakeholder? Nenne Beispiele.",
            "Anspruchsgruppen, die Interessen am Unternehmen haben – z. B. Kunden, Mitarbeitende, Lieferanten, Kapitalgeber, Staat und Öffentlichkeit.",
          ],
        ],
      },
      {
        id: "organisation-prozesse",
        name: "Organisation & Geschäftsprozesse",
        cards: [
          [
            "Unterschied zwischen Aufbau- und Ablauforganisation?",
            "Aufbauorganisation: die Struktur des Unternehmens (Stellen, Abteilungen, Hierarchie – dargestellt im Organigramm).\nAblauforganisation: die Abläufe, also wer was wann in welcher Reihenfolge erledigt.",
          ],
          [
            "Was unterscheidet Kern- von Unterstützungsprozessen?",
            "Kernprozesse schaffen direkt Wert für den Kunden (z. B. Vertrieb, Leistungserstellung).\nUnterstützungsprozesse ermöglichen die Kernprozesse (z. B. IT, Personal, Buchhaltung).",
          ],
          [
            "Was ist eine EPK?",
            "Eine Ereignisgesteuerte Prozesskette: grafische Darstellung eines Geschäftsprozesses aus Ereignissen (Sechsecke) und Funktionen (abgerundete Rechtecke), verbunden über Konnektoren (UND, ODER, XOR).",
          ],
        ],
      },
      {
        id: "wirtschaftlichkeit",
        name: "Wirtschaftlichkeit & Kennzahlen",
        cards: [
          [
            "Wie berechnet man die Wirtschaftlichkeit?",
            "Wirtschaftlichkeit = Ertrag ÷ Aufwand\nIst das Ergebnis größer als 1, wurde wirtschaftlich gearbeitet.",
          ],
          [
            "Wie berechnet man die Produktivität?",
            "Produktivität = Ausbringungsmenge ÷ Einsatzmenge\n(rein mengenmäßig, z. B. bearbeitete Tickets pro Arbeitsstunde)",
          ],
          [
            "Wie berechnet man die Eigenkapitalrentabilität?",
            "Eigenkapitalrentabilität = Gewinn ÷ Eigenkapital × 100 %",
          ],
        ],
      },
    ],
  },
  {
    id: "lf02",
    shortName: "LF02",
    name: "Arbeitsplätze nach Kundenwunsch ausstatten",
    color: "sky",
    topics: [
      {
        id: "pc-aufbau",
        name: "Aufbau eines PCs",
        cards: [
          [
            "Welche Aufgabe hat die CPU?",
            "Der Prozessor (Central Processing Unit) führt die Befehle von Programmen aus und übernimmt die Berechnungen – das „Gehirn“ des Computers.",
          ],
          [
            "Was ist der Arbeitsspeicher (RAM)?",
            "Ein schneller, flüchtiger Speicher für gerade laufende Programme und Daten. Beim Ausschalten geht sein Inhalt verloren.",
          ],
          [
            "SSD oder HDD – was ist der Unterschied?",
            "SSD: Flash-Speicher ohne bewegliche Teile – schneller, leiser, robuster.\nHDD: magnetische, rotierende Scheiben – langsamer, aber günstiger pro Gigabyte.",
          ],
          [
            "Welche Aufgabe hat das Mainboard?",
            "Die Hauptplatine verbindet alle Komponenten (CPU, RAM, Laufwerke, Erweiterungskarten) über Steckplätze, Chipsatz und Bussysteme.",
          ],
        ],
      },
      {
        id: "beschaffung",
        name: "Beschaffung & Angebotsvergleich",
        cards: [
          [
            "Quantitativer vs. qualitativer Angebotsvergleich?",
            "Quantitativ: Vergleich nach Preisen und Kosten (Bezugspreis).\nQualitativ: Vergleich nach Merkmalen wie Qualität, Lieferzeit, Service und Zuverlässigkeit.",
          ],
          [
            "Wie läuft eine Nutzwertanalyse ab?",
            "1. Kriterien festlegen und gewichten\n2. Jedes Angebot pro Kriterium bewerten (Punkte)\n3. Punkte × Gewichtung rechnen und addieren\n→ Das Angebot mit dem höchsten Nutzwert gewinnt.",
          ],
          [
            "Wie lautet das Schema der Bezugspreiskalkulation?",
            "Listeneinkaufspreis\n− Liefererrabatt\n= Zieleinkaufspreis\n− Liefererskonto\n= Bareinkaufspreis\n+ Bezugskosten\n= Bezugspreis (Einstandspreis)",
          ],
        ],
      },
      {
        id: "kommunikation",
        name: "Kommunikation & Kundenauftrag",
        cards: [
          [
            "Was sind die vier Seiten einer Nachricht (Schulz von Thun)?",
            "Sachinhalt, Selbstoffenbarung, Beziehung und Appell.",
          ],
          [
            "Lastenheft vs. Pflichtenheft?",
            "Lastenheft: vom Auftraggeber – WAS soll erreicht werden und WOFÜR?\nPflichtenheft: vom Auftragnehmer – WIE und WOMIT wird es umgesetzt?",
          ],
        ],
      },
    ],
  },
  {
    id: "lf03",
    shortName: "LF03",
    name: "Clients in Netzwerke einbinden",
    color: "emerald",
    topics: [
      {
        id: "netzwerk-grundlagen",
        name: "Netzwerk-Grundlagen",
        cards: [
          [
            "Wie ist eine IPv4-Adresse aufgebaut?",
            "32 Bit, aufgeteilt in 4 Blöcke (Oktette) zu je 8 Bit, dezimal mit Punkten geschrieben – z. B. 192.168.1.10.",
          ],
          [
            "Switch oder Router – was ist der Unterschied?",
            "Switch: verbindet Geräte innerhalb eines Netzes anhand ihrer MAC-Adressen (OSI-Schicht 2).\nRouter: verbindet verschiedene Netze miteinander anhand von IP-Adressen (OSI-Schicht 3).",
          ],
          [
            "Was bedeutet die Subnetzmaske 255.255.255.0 (/24)?",
            "Die ersten 24 Bit sind der Netzanteil, die letzten 8 Bit der Hostanteil. Es gibt 256 Adressen, davon 254 nutzbare für Geräte (ohne Netz- und Broadcast-Adresse).",
          ],
        ],
      },
      {
        id: "netzwerk-dienste",
        name: "Netzwerk-Dienste",
        cards: [
          [
            "Wofür ist DHCP zuständig?",
            "DHCP verteilt automatisch die Netzwerk-Konfiguration an Geräte: IP-Adresse, Subnetzmaske, Standard-Gateway und DNS-Server.",
          ],
          [
            "Wofür ist DNS zuständig?",
            "Das Domain Name System übersetzt Namen wie www.beispiel.de in die passende IP-Adresse – wie ein Telefonbuch des Internets.",
          ],
        ],
      },
    ],
  },
  {
    id: "lf04",
    shortName: "LF04",
    name: "Schutzbedarfsanalyse im eigenen Arbeitsbereich durchführen",
    color: "rose",
    topics: [
      {
        id: "it-sicherheit",
        name: "IT-Sicherheit",
        cards: [
          [
            "Nenne die drei Schutzziele der Informationssicherheit.",
            "Vertraulichkeit (nur Berechtigte sehen die Daten), Integrität (Daten sind korrekt und unverändert) und Verfügbarkeit (Daten und Systeme sind nutzbar, wenn man sie braucht).",
          ],
          [
            "Welche Schutzbedarfskategorien nutzt das BSI?",
            "Normal, hoch und sehr hoch.",
          ],
          [
            "Was besagt die 3-2-1-Backup-Regel?",
            "3 Kopien der Daten, auf 2 verschiedenen Speichermedien, davon 1 Kopie an einem anderen Ort (außer Haus).",
          ],
        ],
      },
      {
        id: "datenschutz",
        name: "Datenschutz",
        cards: [
          [
            "Datenschutz vs. Datensicherheit?",
            "Datenschutz schützt Menschen vor dem Missbrauch ihrer personenbezogenen Daten (rechtlich, z. B. DSGVO).\nDatensicherheit schützt Daten allgemein vor Verlust, Diebstahl und Manipulation (technisch-organisatorisch, z. B. Backups, Verschlüsselung).",
          ],
          [
            "Was sind personenbezogene Daten?",
            "Alle Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen (Art. 4 DSGVO) – z. B. Name, Adresse, E-Mail-Adresse, Geburtsdatum oder IP-Adresse.",
          ],
        ],
      },
    ],
  },
  {
    id: "lf05",
    shortName: "LF05",
    name: "Software zur Verwaltung von Daten anpassen",
    color: "amber",
    topics: [
      {
        id: "zahlensysteme",
        name: "Zahlensysteme & Speichergrößen",
        cards: [
          ["Was ist 1010 (binär) als Dezimalzahl?", "10\n(1·8 + 0·4 + 1·2 + 0·1)"],
          ["Was ist 255 (dezimal) als Binärzahl?", "1111 1111"],
          ["Was ist FF (hexadezimal) als Dezimalzahl?", "255\n(15·16 + 15)"],
          [
            "Wie viele Bit hat ein Byte – und was ist der Unterschied zwischen kB und KiB?",
            "1 Byte = 8 Bit.\n1 kB (Kilobyte) = 1.000 Byte, 1 KiB (Kibibyte) = 1.024 Byte.",
          ],
        ],
      },
      {
        id: "programmier-grundlagen",
        name: "Programmier-Grundlagen",
        cards: [
          [
            "Was ist eine Variable?",
            "Ein benannter Speicherplatz, in dem ein Programm einen Wert ablegt, der sich ändern kann – z. B. alter = 18.",
          ],
          [
            "Nenne vier grundlegende Datentypen.",
            "Integer (Ganzzahl), Float/Double (Kommazahl), String (Text) und Boolean (wahr/falsch).",
          ],
          [
            "Was ist ein Primärschlüssel in einer Datenbank?",
            "Ein Feld (oder eine Feldkombination), das jeden Datensatz einer Tabelle eindeutig identifiziert – z. B. eine Kundennummer.",
          ],
        ],
      },
    ],
  },
  {
    id: "englisch",
    shortName: "Englisch",
    name: "Englisch",
    color: "violet",
    topics: [
      {
        id: "business-english",
        name: "Business English Basics",
        cards: [
          ["die Rechnung", "the invoice"],
          ["einen Termin vereinbaren", "to schedule a meeting / to arrange an appointment"],
          ["Could you please send me the quote by Friday?", "Könnten Sie mir bitte das Angebot bis Freitag schicken?"],
        ],
      },
    ],
  },
  {
    id: "ggk",
    shortName: "GGK",
    name: "Gemeinschaftskunde, Geschichte & Kultur",
    color: "teal",
    topics: [
      {
        id: "politik-grundlagen",
        name: "Politik & Gesellschaft",
        cards: [
          [
            "Was bedeutet Gewaltenteilung?",
            "Die Staatsgewalt ist auf drei unabhängige Bereiche verteilt: Legislative (Gesetze beschließen – Parlament), Exekutive (Gesetze ausführen – Regierung/Verwaltung) und Judikative (Recht sprechen – Gerichte).",
          ],
          ["Seit wann gibt es das Grundgesetz?", "Es wurde am 23. Mai 1949 verkündet und trat am 24. Mai 1949 in Kraft."],
          [
            "Was ist das duale System der Berufsausbildung?",
            "Die Ausbildung findet an zwei Lernorten statt: im Ausbildungsbetrieb (Praxis) und in der Berufsschule (Theorie).",
          ],
        ],
      },
    ],
  },
];

/** Wandelt die verschachtelte Beispielstruktur in die flachen Listen aus types.ts um. */
function buildSeed(): Pick<AppData, "subjects" | "topics" | "cards"> {
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  const cards: Card[] = [];

  seedSource.forEach((s, subjectIndex) => {
    subjects.push({ id: s.id, shortName: s.shortName, name: s.name, color: s.color, order: subjectIndex });

    s.topics.forEach((t, topicIndex) => {
      const topicId = `${s.id}.${t.id}`;
      topics.push({ id: topicId, subjectId: s.id, name: t.name, order: topicIndex });

      t.cards.forEach(([front, back], cardIndex) => {
        cards.push({
          id: `${topicId}.${cardIndex + 1}`,
          topicId,
          front,
          back,
          createdAt: SEED_CREATED_AT,
          isExample: true,
        });
      });
    });
  });

  return { subjects, topics, cards };
}

/** Frischer, leerer Startzustand inkl. Beispielkarten (ohne Lernfortschritt). */
export function createInitialData(): AppData {
  return {
    version: 1,
    ...buildSeed(),
    progress: {},
    reviewLog: {},
    settings: { dailyGoal: DEFAULT_DAILY_GOAL },
  };
}
