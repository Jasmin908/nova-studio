// English. Copy is taken verbatim from the Final Content Specification.
import type { Dictionary } from './index';

const en: Dictionary = {
  locale: 'en',
  lang: 'en',
  path: '/en/',
  meta: {
    title: 'NOVA — Skin Studio, Zurich',
    description:
      'NOVA Studio is a fictional concept project by Forma Studio: a skin studio in Zurich, Kreis 4.',
  },
  // Not visible on the page; used by assistive technology only.
  a11y: {
    skip: 'Skip to content',
    nav: 'Navigation',
    language: 'Language',
    newTab: 'opens in a new tab',
  },
  nav: {
    wordmark: 'NOVA',
    treatments: 'Treatments',
    studio: 'Studio',
    appointment: 'Appointment',
    menu: 'Menu',
    close: 'Close',
  },
  ids: { treatments: 'treatments', studio: 'studio', appointment: 'appointment' },
  hero: {
    lines: ['SKIN,', 'IN A NEW', 'LIGHT.'],
    meta: ['NOVA — SKIN STUDIO', 'ZURICH · KREIS 4', 'CAMPAIGN 01 — LIGHT'],
    cue: 'SCROLL',
    alt: 'Portrait of a woman with slicked-back dark hair against deep burgundy, softly lit from the side.',
  },
  statement: {
    lines: ['LOOK', 'CLOSER.'],
    paragraph:
      'No two skins are alike. So every treatment at NOVA begins with a close look – and only then with a plan that fits you.',
    note: 'OBSERVE · UNDERSTAND · CARE',
    alt: 'Close-up of the same face showing natural skin texture.',
  },
  treatments: {
    categories: ['FACE', 'FOCUS', 'BROWS', 'CONSULT'],
    note: 'All prices in CHF. Every facial begins with a short look at your skin. For medical skin concerns, we recommend seeing a dermatologist.',
  },
  studio: {
    line: 'STEP INSIDE.',
    locationLabel: 'LOCATION',
    location: 'Zurich · Kreis 4',
    hoursLabel: 'HOURS',
    hours: ['Tue–Fri 10:00–19:00', 'Sat 9:00–16:00', 'Sun + Mon closed'],
    sentence: 'A quiet room with very little in it – so the attention stays on you.',
    alt: 'Interior with burgundy walls, a dark stone floor and a pale bench; a narrow blade of light falls across the floor.',
  },
  closing: {
    label: 'A CONCEPT BY FORMA STUDIO',
    lines: ['LIKE WHAT', 'YOU SEE?'],
    disclosure:
      "NOVA Studio is a fictional concept project by Forma Studio. The studio, treatments and prices are fictional. A website like this doesn't have to be.",
    cta: 'PLAN YOUR WEBSITE',
  },
  footer: {
    line1: 'NOVA Studio — Zurich · Kreis 4',
    line2: 'NOVA Studio is a fictional concept project and not a real business.',
    creditPrefix: 'Concept, design and build:',
    creditName: 'Forma Studio',
    line4: 'Campaign imagery created with AI.',
    copyright: '© 2026 Forma Studio',
  },
};

export default en;
