// The treatment menu from the Final Content Specification. Names, durations
// and prices are shared by both languages; only descriptions are translated.
export interface Treatment {
  /** Index into the four categories (0 = 01). */
  category: number;
  name: string;
  minutes: number;
  chf: number;
  de: string;
  en: string;
}

export const treatments: Treatment[] = [
  {
    category: 0,
    name: 'LUMEN',
    minutes: 75,
    chf: 190,
    de: 'Unsere Signaturbehandlung: Reinigung, Peeling, Massage und Maske, abgestimmt auf deine Haut an diesem Tag.',
    en: 'Our signature facial: cleanse, exfoliation, massage and mask, adjusted to your skin on the day.',
  },
  {
    category: 0,
    name: 'PUR',
    minutes: 60,
    chf: 160,
    de: 'Gründliche Tiefenreinigung mit sorgfältiger Ausreinigung und beruhigender Maske.',
    en: 'A thorough deep cleanse with careful extractions and a calming mask.',
  },
  {
    category: 0,
    name: 'HALO',
    minutes: 90,
    chf: 240,
    de: 'Die ausführliche Variante: LUMEN, erweitert um eine lange Gesichts-, Nacken- und Schultermassage.',
    en: 'The long version: LUMEN, extended with an unhurried face, neck and shoulder massage.',
  },
  {
    category: 1,
    name: 'PRISMA',
    minutes: 45,
    chf: 140,
    de: 'Sanftes Fruchtsäure-Peeling, das die Hautoberfläche verfeinert – Stärke und Einwirkzeit legen wir gemeinsam fest.',
    en: "A gentle fruit-acid peel that refines the skin's surface – strength and timing are decided together.",
  },
  {
    category: 1,
    name: 'KONTUR',
    minutes: 45,
    chf: 130,
    de: 'Manuelle Gesichtsmassage mit festen, modellierenden Griffen – ohne Geräte, ohne Eile.',
    en: 'A hands-only facial massage with firm, sculpting strokes – no devices, no rush.',
  },
  {
    category: 2,
    name: 'LINIE',
    minutes: 30,
    chf: 55,
    de: 'Brauen in Form gebracht – mit Pinzette und Faden, entlang deiner natürlichen Linie.',
    en: 'Brows shaped with tweezers and thread, following your natural line.',
  },
  {
    category: 2,
    name: 'LIFT',
    minutes: 60,
    chf: 120,
    de: 'Brow Lamination inklusive Form und Farbe – für Brauen, die mehrere Wochen in Richtung bleiben.',
    en: 'Brow lamination including shape and tint – for brows that stay in place for several weeks.',
  },
  {
    category: 3,
    name: 'BLICK',
    minutes: 30,
    chf: 60,
    de: 'Erstgespräch mit Hautanalyse; der Betrag wird an deine erste Behandlung angerechnet.',
    en: 'A first conversation with a skin assessment; the fee is credited towards your first treatment.',
  },
  {
    category: 3,
    name: 'PLAN',
    minutes: 60,
    chf: 120,
    de: 'Ausführliche Beratung mit schriftlicher Pflegeroutine – mit dem, was du schon hast, und nur dem, was fehlt.',
    en: 'An in-depth consultation with a written routine – built on what you already own, adding only what is missing.',
  },
];

// "75 MIN" and "CHF 190" (non-breaking space, no decimals).
export const formatDuration = (minutes: number) => `${minutes} MIN`;
export const formatPrice = (chf: number) => `CHF ${chf}`;
