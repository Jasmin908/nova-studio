// Automated checks against the production build.
//   npm run build && npm run preview   (in one terminal)
//   npm test                           (in another)
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:4321';
const axeSource = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const LOCALES = [
  { path: '/', lang: 'de-CH', title: 'NOVA — Skin Studio, Zürich', menu: 'Menü', studio: 'studio' },
  { path: '/en/', lang: 'en', title: 'NOVA — Skin Studio, Zurich', menu: 'Menu', studio: 'studio' },
];
const VIEWPORTS = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 },
];

let failures = 0;
const notes = [];
function check(label, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

const browser = await chromium.launch();

async function open({ width, height }, path, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width < 900,
    reducedMotion: options.reduced ? 'reduce' : 'no-preference',
    javaScriptEnabled: options.js !== false,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300);
  return { page, context, errors };
}

const scrollTo = async (page, y) => {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

/* ---------- 1. Every viewport, both languages ---------- */

for (const locale of LOCALES) {
  for (const vp of VIEWPORTS) {
    const tag = `${locale.path} ${vp.name} ${vp.width}×${vp.height}`;
    const { page, context, errors } = await open(vp, locale.path);

    const head = await page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title }));
    check(`${tag}: lang and title`, head.lang === locale.lang && head.title === locale.title);

    // Walk the whole page; nothing may overflow horizontally at any point,
    // and no line of type may run past the right edge.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let overflow = null;
    let runoff = null;
    for (let y = 0; y <= total; y += Math.round(vp.height / 3)) {
      await scrollTo(page, y);
      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = document.documentElement.scrollWidth > vw || document.body.scrollWidth > vw;
        const selectors =
          '.rv__i, .statement__line, .blade__line, .cat__name, .trt > *, .trt__figures > *, .nav [data-nav-item], ' +
          '.hero__meta span, .hero__cue, .statement__para, .statement__note, .treat__note, .info dd, .info dt, ' +
          '.info__sentence, .closing__label, .closing__disclosure, .closing__cta, .footer > *';
        let worst = null;
        for (const el of document.querySelectorAll(selectors)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > vw + 0.5 || r.left < -0.5) {
            // Line 1 of the statement is cropped by the left edge on purpose.
            if (el.matches('.statement__line--1') && r.right <= vw) continue;
            worst = `${el.className || el.tagName} [${Math.round(r.left)}, ${Math.round(r.right)}] of ${vw}`;
          }
        }
        return { wide, worst };
      });
      if (result.wide) overflow = y;
      if (result.worst) runoff = result.worst;
    }
    check(`${tag}: no horizontal overflow`, overflow === null, overflow !== null ? `at y=${overflow}` : '');
    check(`${tag}: no type runs off the edge`, runoff === null, runoff ?? '');
    check(`${tag}: no console or network errors`, errors.length === 0, errors.join(' | '));
    await context.close();
  }
}

/* ---------- 2. Pinned sequences, forwards and backwards ---------- */

for (const vp of [VIEWPORTS[1], VIEWPORTS[2], VIEWPORTS[3], VIEWPORTS[4]]) {
  const { page, context } = await open(vp, '/');
  const read = () =>
    page.evaluate(() => {
      const vars = (el, names) => names.map((name) => el.style.getPropertyValue(name)).join(',');
      const aperture = document.querySelector('[data-seq="aperture"]');
      const blade = document.querySelector('[data-seq="blade"]');
      const stageTop = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top);
      const img = (s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return [r.left, r.top, r.width, r.height].map((v) => Math.round(v)).join(',');
      };
      return {
        a: vars(aperture, ['--wt', '--wr', '--wb', '--wl', '--exit']),
        b: vars(blade, ['--l', '--r', '--band-o', '--ix', '--iy', '--is']),
        aTop: stageTop('.statement__stage'),
        bTop: stageTop('.blade__stage'),
        aImg: img('.statement__window img'),
        bImg: img('.blade__imgbox'),
        aRect: aperture.getBoundingClientRect().top,
        bRect: blade.getBoundingClientRect().top,
        nav: document.querySelector('[data-nav]').className,
      };
    });
  const range = await page.evaluate(() => {
    const top = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
    return {
      a: [top('.statement'), top('.statement') + document.querySelector('.statement').offsetHeight - innerHeight],
      b: [top('.blade'), top('.blade') + document.querySelector('.blade').offsetHeight - innerHeight],
    };
  });

  for (const [key, label] of [
    ['a', 'Chapter 2 aperture'],
    ['b', 'Chapter 4 band'],
  ]) {
    const [start, end] = range[key];
    const steps = Array.from({ length: 21 }, (_, i) => Math.round(start + ((end - start) * i) / 20));
    const down = [];
    for (const y of steps) {
      await scrollTo(page, y);
      down.push(await read());
    }
    const up = [];
    for (const y of [...steps].reverse()) {
      await scrollTo(page, y);
      up.unshift(await read());
    }
    const same = down.every((d, i) => d[key] === up[i][key]);
    check(`${vp.name}: ${label} scrubs identically forwards and backwards`, same);

    const pinned = down.every((d) => Math.abs(d[`${key}Top`]) <= 1);
    check(`${vp.name}: ${label} stays pinned through its range`, pinned);

    const distinct = new Set(down.map((d) => d[key])).size;
    check(`${vp.name}: ${label} is driven by scroll`, distinct > 6, `${distinct} distinct states over 21 steps`);

    if (key === 'a') {
      const still = new Set(down.map((d) => d.aImg)).size === 1;
      check(`${vp.name}: Chapter 2 image never moves or scales`, still);
    } else {
      // Fixed until the mobile scale-down at the end.
      const fixedWhileOpening = new Set(down.slice(0, 9).map((d) => d.bImg)).size === 1;
      check(`${vp.name}: Chapter 4 image is fixed while the window opens`, fixedWhileOpening);
      const scales = new Set(down.map((d) => d.bImg)).size > 1;
      check(
        `${vp.name}: Chapter 4 final scale-down only on the mobile composition`,
        scales === vp.width < 900 || (scales && vp.height > vp.width),
      );
    }
    const visible = down.every((d) => !d.nav.includes('is-hidden'));
    check(`${vp.name}: navigation stays visible during ${label}`, visible);
  }
  await context.close();
}

/* ---------- 3. Reduced motion and no JavaScript ---------- */

for (const mode of [
  { label: 'reduced motion', options: { reduced: true } },
  { label: 'no JavaScript', options: { js: false } },
]) {
  for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
    const { page, context } = await open(vp, '/', mode.options);
    const state = await page.evaluate(() => {
      const style = (s) => getComputedStyle(document.querySelector(s));
      const visible = (s) => {
        const el = document.querySelector(s);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0';
      };
      return {
        motion: document.documentElement.classList.contains('motion'),
        apertureSticky: style('.statement__stage').position === 'sticky',
        bladeSticky: style('.blade__stage').position === 'sticky',
        windowClip: style('.statement__window').clipPath,
        heroTransform: style('.hero__title .rv__i').transform,
        closingTransform: style('.closing__title .rv__i').transform,
        heroMedia: style('.hero__media').transform,
        lineColour: style('.blade__dark .blade__line').color,
        fade: style('.groundfade').display,
        band: style('.blade__band').display,
        prices: visible('.trt__price'),
        photo: visible('.blade__imgbox img'),
        closeup: visible('.statement__window img'),
        info: visible('.info__sentence'),
        statementHeight: document.querySelector('.statement').offsetHeight / innerHeight,
        bladeHeight: document.querySelector('.blade').offsetHeight / innerHeight,
      };
    });
    const tag = `${mode.label}, ${vp.name}`;
    check(`${tag}: both pins removed`, !state.motion && !state.apertureSticky && !state.bladeSticky);
    check(`${tag}: Chapter 2 image shown whole, unclipped`, state.windowClip === 'none' && state.closeup);
    check(
      `${tag}: headlines present immediately`,
      state.heroTransform === 'none' && state.closingTransform === 'none' && state.heroMedia === 'none',
    );
    check(`${tag}: prelude line legible in ivory`, state.lineColour === 'rgb(242, 235, 223)', state.lineColour);
    check(`${tag}: band hidden, photograph and captions visible`, state.band === 'none' && state.photo && state.info);
    check(`${tag}: prices visible`, state.prices);
    if (mode.options.reduced) check(`${tag}: ground changes at a hard edge`, state.fade === 'none');
    notes.push(
      `${tag}: statement ${state.statementHeight.toFixed(2)} screens, studio ${state.bladeHeight.toFixed(2)} screens`,
    );
    await context.close();
  }
}

/* ---------- 4. Treatment accordion by keyboard ---------- */

{
  const { page, context } = await open(VIEWPORTS[4], '/');
  const expanded = () =>
    page.$$eval('.cat__btn', (buttons) => buttons.map((b) => b.getAttribute('aria-expanded')).join(','));
  const hidden = () => page.$$eval('.cat__panel', (panels) => panels.map((p) => (p.hidden ? 'h' : 'v')).join(''));

  check('accordion: first category open by default, prices visible', (await expanded()) === 'true,false,false,false');
  check('accordion: nine treatments in four categories', (await page.$$eval('.trt', (n) => n.length)) === 9);
  const wired = await page.$$eval('.cat__btn', (buttons) =>
    buttons.every((b) => {
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      return b.tagName === 'BUTTON' && panel && panel.getAttribute('aria-labelledby') === b.id;
    }),
  );
  check('accordion: real buttons wired to their panels', wired);

  await page.focus('.cat__btn');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  check('accordion: Enter opens the second category', (await expanded()) === 'true,true,false,false');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  check('accordion: Space opens the third category', (await expanded()) === 'true,true,true,false');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  check(
    'accordion: Enter closes it again and hides the panel',
    (await expanded()) === 'true,false,true,false' && (await hidden()) === 'vhvh',
  );
  const focusRing = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('accordion: focus ring visible on the active button', focusRing !== 'none', focusRing);

  // Prices: format, tabular numerals, right-aligned column.
  const prices = await page.$$eval('.trt__price', (n) => n.map((e) => e.textContent));
  check('prices: "CHF 190" format with a non-breaking space', prices.every((p) => /^CHF \d+$/.test(p)), prices.join(', '));
  const tabular = await page.evaluate(() => {
    const host = document.querySelector('.trt__price');
    const width = (text) => {
      const span = document.createElement('span');
      span.textContent = text;
      host.append(span);
      const w = span.getBoundingClientRect().width;
      span.remove();
      return w;
    };
    return [width('111'), width('000'), width('888')];
  });
  check('prices: tabular numerals', Math.max(...tabular) - Math.min(...tabular) < 0.1, tabular.map((w) => w.toFixed(2)).join(' / '));
  const rights = await page.$$eval('.cat.is-open .trt__price', (n) => n.map((e) => Math.round(e.getBoundingClientRect().right)));
  check('prices: right-aligned column on desktop', new Set(rights).size === 1, rights.join(', '));
  await context.close();
}

/* ---------- 5. Mobile menu ---------- */

for (const locale of LOCALES) {
  const { page, context } = await open(VIEWPORTS[1], locale.path);
  const button = page.locator('[data-menu-open]');
  check(`menu ${locale.path}: label is "${locale.menu}", no icon`, (await button.innerText()).trim() === locale.menu);
  await button.click();
  await page.waitForTimeout(900);
  const opened = await page.evaluate(() => {
    const d = document.querySelector('[data-menu]');
    return {
      open: d.open,
      modal: d.matches(':modal'),
      focusInside: d.contains(document.activeElement),
      links: d.querySelectorAll('[data-menu-link]').length,
      opacity: getComputedStyle(d).opacity,
      covers: d.getBoundingClientRect().width === innerWidth && d.getBoundingClientRect().height === innerHeight,
    };
  });
  check(
    `menu ${locale.path}: opens as a full-screen modal with three links`,
    opened.open && opened.modal && opened.focusInside && opened.links === 3 && opened.opacity === '1' && opened.covers,
    JSON.stringify(opened),
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  const closed = await page.evaluate(() => ({
    open: document.querySelector('[data-menu]').open,
    focus: document.activeElement.hasAttribute('data-menu-open'),
  }));
  check(`menu ${locale.path}: Escape closes it and returns focus`, !closed.open && closed.focus);

  await button.click();
  await page.waitForTimeout(900);
  await page.locator('[data-menu-link]').nth(1).click();
  await page.waitForTimeout(500);
  const jumped = await page.evaluate(() => ({
    open: document.querySelector('[data-menu]').open,
    top: Math.round(document.querySelector('.blade').getBoundingClientRect().top),
    hash: location.hash,
  }));
  check(
    `menu ${locale.path}: a chapter link closes it and jumps to the chapter`,
    !jumped.open && Math.abs(jumped.top) <= 2 && jumped.hash === `#${locale.studio}`,
    JSON.stringify(jumped),
  );
  await context.close();
}

/* ---------- 6. Content rules ---------- */

for (const locale of LOCALES) {
  const { page, context } = await open(VIEWPORTS[4], locale.path);
  const content = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a')];
    return {
      contact: anchors.filter((a) => /^(tel|mailto):/.test(a.getAttribute('href') || '')).length,
      forms: document.querySelectorAll('form, input, textarea, select').length,
      forma: ['.closing__cta', '.footer__credit'].map((s) => {
        const a = document.querySelector(s);
        return [a.getAttribute('href'), a.target, a.rel].join(' ');
      }),
      external: anchors.filter((a) => /^https?:/.test(a.getAttribute('href') || '')).map((a) => a.getAttribute('href')),
      h1: document.querySelectorAll('h1').length,
      heroDisclosure: /fikti|fiction/i.test(document.querySelector('.hero').textContent),
      textOverStudio: document.querySelector('.blade__photo').innerText.trim(),
      alts: [...document.querySelectorAll('img')].map((i) => i.alt.length > 20),
      footerLines: document.querySelector('.footer').children.length,
    };
  });
  check(`content ${locale.path}: no form, phone or email`, content.contact === 0 && content.forms === 0);
  // The Chapter 5 CTA and the footer credit are the only external links.
  const forma = 'https://forma-webdesign.netlify.app/ _blank noopener noreferrer';
  check(
    `content ${locale.path}: CTA and footer credit open Forma Studio in a new tab; no other external links`,
    content.forma.every((link) => link === forma) && content.external.length === 2,
    `${content.forma.join(' | ')} | external: ${content.external.join(', ')}`,
  );
  check(`content ${locale.path}: one h1, no disclosure in the hero`, content.h1 === 1 && !content.heroDisclosure);
  check(`content ${locale.path}: no text over the studio photograph`, content.textOverStudio === '');
  check(`content ${locale.path}: three images with alt text`, content.alts.length === 3 && content.alts.every(Boolean));
  check(`content ${locale.path}: six footer lines`, content.footerLines === 6);
  await context.close();
}

/* ---------- 7. Touch targets and keyboard order ---------- */

for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
  const { page, context } = await open(vp, '/');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a, button')]
      .filter((el) => !el.closest('dialog') && !el.classList.contains('skip'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.height < 44 || r.width < 44))
      .map(({ el, r }) => `${el.textContent.trim().slice(0, 24)} ${Math.round(r.width)}×${Math.round(r.height)}`),
  );
  check(`${vp.name}: touch targets at least 44 px`, small.length === 0, small.join(' | '));

  const order = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.textContent.trim().slice(0, 18)));
  }
  notes.push(`${vp.name} tab order: ${order.join(' › ')}`);
  await context.close();
}

/* ---------- 8. axe (WCAG 2 A and AA) ---------- */

for (const locale of LOCALES) {
  for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
    for (const reduced of [false, true]) {
      const { page, context } = await open(vp, locale.path, { reduced });
      await page.addScriptTag({ content: axeSource });
      const results = await page.evaluate(() =>
        window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }),
      );
      const found = results.violations.map(
        (v) => `${v.id} (${v.nodes.length}): ${v.nodes.map((node) => node.target.join(' ')).slice(0, 4).join('; ')}`,
      );
      check(
        `axe ${locale.path} ${vp.name}${reduced ? ' reduced motion' : ''}: no WCAG A/AA violations`,
        found.length === 0,
        found.join(' | '),
      );
      const review = results.incomplete.map((v) => `${v.id} (${v.nodes.length})`);
      if (review.length) notes.push(`axe ${locale.path} ${vp.name}${reduced ? ' rm' : ''} needs manual review: ${review.join(', ')}`);
      await context.close();
    }
  }
}

await browser.close();
console.log('\nNotes');
for (const note of notes) console.log(`  ${note}`);
console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
