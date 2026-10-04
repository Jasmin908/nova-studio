import de from './de';
import en from './en';

export type Locale = 'de' | 'en';

export interface Dictionary {
  locale: Locale;
  lang: string;
  path: string;
  meta: { title: string; description: string };
  a11y: { skip: string; nav: string; language: string; newTab: string };
  nav: {
    wordmark: string;
    treatments: string;
    studio: string;
    appointment: string;
    menu: string;
    close: string;
  };
  ids: { treatments: string; studio: string; appointment: string };
  hero: { lines: string[]; meta: string[]; cue: string; alt: string };
  statement: { lines: string[]; paragraph: string; note: string; alt: string };
  treatments: { categories: string[]; note: string };
  studio: {
    line: string;
    locationLabel: string;
    location: string;
    hoursLabel: string;
    hours: string[];
    sentence: string;
    alt: string;
  };
  closing: { label: string; lines: string[]; disclosure: string; cta: string };
  footer: {
    line1: string;
    line2: string;
    creditPrefix: string;
    creditName: string;
    line4: string;
    copyright: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = { de, en };
