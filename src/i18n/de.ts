// German (primary). Copy is taken verbatim from the Final Content
// Specification, including its dashes and capitalisation.
import type { Dictionary } from './index';

const de: Dictionary = {
  locale: 'de',
  lang: 'de-CH',
  path: '/',
  meta: {
    title: 'NOVA — Skin Studio, Zürich',
    description:
      'NOVA Studio ist ein fiktives Konzeptprojekt von Forma Studio: ein Skin Studio in Zürich, Kreis 4.',
  },
  // Not visible on the page; used by assistive technology only.
  a11y: {
    skip: 'Zum Inhalt',
    nav: 'Navigation',
    language: 'Sprache',
    newTab: 'öffnet in neuem Tab',
  },
  nav: {
    wordmark: 'NOVA',
    treatments: 'Behandlungen',
    studio: 'Studio',
    appointment: 'Termin',
    menu: 'Menü',
    close: 'Schliessen',
  },
  ids: { treatments: 'behandlungen', studio: 'studio', appointment: 'termin' },
  hero: {
    lines: ['HAUT,', 'IN NEUEM', 'LICHT.'],
    meta: ['NOVA — SKIN STUDIO', 'ZÜRICH · KREIS 4', 'KAMPAGNE 01 — LICHT'],
    cue: 'SCROLLEN',
    alt: 'Porträt einer Frau mit zurückgekämmtem dunklem Haar vor tiefem Burgunderrot, von der Seite weich beleuchtet.',
  },
  statement: {
    lines: ['GENAU', 'HINSEHEN.'],
    paragraph:
      'Jede Haut ist anders. Deshalb beginnt bei NOVA jede Behandlung mit einem genauen Blick – und erst dann mit einem Plan, der zu dir passt.',
    note: 'BEOBACHTEN · VERSTEHEN · PFLEGEN',
    alt: 'Nahaufnahme desselben Gesichts mit natürlicher Hautstruktur.',
  },
  treatments: {
    categories: ['GESICHT', 'FOKUS', 'BRAUEN', 'BERATUNG'],
    note: 'Alle Preise in CHF. Jede Gesichtsbehandlung beginnt mit einem kurzen Blick auf deine Haut. Bei medizinischen Hautfragen empfehlen wir eine dermatologische Abklärung.',
  },
  studio: {
    line: 'TRITT EIN.',
    locationLabel: 'ORT',
    location: 'Zürich · Kreis 4',
    hoursLabel: 'ZEITEN',
    hours: ['Di–Fr 10–19 Uhr', 'Sa 9–16 Uhr', 'So + Mo geschlossen'],
    sentence: 'Ein ruhiger Raum mit wenig darin – damit die Aufmerksamkeit bei dir bleibt.',
    alt: 'Innenraum mit burgunderroten Wänden, dunklem Steinboden und einer hellen Bank; ein schmaler Lichtstreifen fällt über den Boden.',
  },
  closing: {
    label: 'EIN KONZEPT VON FORMA STUDIO',
    lines: ['GEFÄLLT IHNEN,', 'WAS SIE', 'SEHEN?'],
    disclosure:
      'NOVA Studio ist ein fiktives Konzeptprojekt von Forma Studio. Studio, Behandlungen und Preise sind frei erfunden. Eine Website wie diese nicht.',
    cta: 'IHRE WEBSITE PLANEN',
  },
  footer: {
    line1: 'NOVA Studio — Zürich · Kreis 4',
    line2: 'NOVA Studio ist ein fiktives Konzeptprojekt und kein reales Unternehmen.',
    creditPrefix: 'Konzept, Design und Umsetzung:',
    creditName: 'Forma Studio',
    line4: 'Kampagnenbilder mit KI erstellt.',
    copyright: '© 2026 Forma Studio',
  },
};

export default de;
