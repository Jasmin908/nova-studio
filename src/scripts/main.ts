// NOVA Studio: all page behaviour.
//
// Scrolling is always native. The two pinned sequences are pinned with CSS
// `position: sticky`; this script only reads the scroll position and writes
// custom properties that the stylesheets turn into clip and transform
// values. Every value is a direct function of scroll position, so the
// sequences scrub in both directions and never run ahead of the visitor.

const html = document.documentElement;
const mqDesktop = matchMedia('(min-width: 900px) and (orientation: landscape)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');

const $ = <T extends HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector)!;
const $$ = <T extends HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Progress of `p` through the beat [a, b], clamped to 0–1. */
const beat = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (v: number) => v.toFixed(3);

const duration = () =>
  mqReduce.matches ? 0 : parseFloat(getComputedStyle(html).getPropertyValue('--dur')) || 0;

/* ------------------------------------------------------------------ */
/* Scroll: hero drift, the two pinned sequences, navigation            */
/* ------------------------------------------------------------------ */

const nav = $('[data-nav]');
const grounds = $$('[data-ground]');
const hero = $('[data-hero]');
const aperture = $('[data-seq="aperture"]');
const blade = $('[data-seq="blade"]');
const bladeStage = $('.blade__stage', blade);

/** Slit of light in the interior photograph, as fractions of its width. */
const SLIT = { centre: 0.315, left: 0.307, right: 0.347 };
const STUDIO_RATIO = 3 / 2;

let motion = html.classList.contains('motion');
let vw = 0;
let vh = 0;
let navLine = 30;
let rest = { t: 0, r: 0, b: 0, l: 0 };
let lastY = window.scrollY;
let queued = false;

function measure() {
  vw = html.clientWidth;
  vh = motion ? bladeStage.offsetHeight : window.innerHeight;
  navLine = nav.offsetHeight / 2;

  const cs = getComputedStyle(aperture);
  const read = (name: string) => parseFloat(cs.getPropertyValue(name)) || 0;
  rest = { t: read('--ap-t'), r: read('--ap-r'), b: read('--ap-b'), l: read('--ap-l') };

  if (motion) {
    // The interior at the size at which it covers the stage.
    const iw = Math.max(vw, vh * STUDIO_RATIO);
    blade.style.setProperty('--iw', `${iw}px`);
    blade.style.setProperty('--ih', `${iw / STUDIO_RATIO}px`);
  }
}

function clearMotion() {
  hero.style.removeProperty('--hp');
  for (const name of ['--wt', '--wr', '--wb', '--wl', '--exit']) aperture.style.removeProperty(name);
  for (const name of ['--l', '--r', '--band-o', '--line-o', '--iw', '--ih', '--ix', '--iy', '--is'])
    blade.style.removeProperty(name);
  nav.classList.remove('on-band');
}

/** Chapter 1: slow image scale and headline drift. */
function updateHero(y: number) {
  const h = hero.offsetHeight;
  if (y <= h) hero.style.setProperty('--hp', n(clamp(y / h)));
}

/**
 * Chapter 2: hold, expand, exit. Returns the nav type colour while the
 * stage is in view.
 */
function updateAperture(): { pinned: boolean; theme: 'ivory' | 'dark' } {
  const r = aperture.getBoundingClientRect();
  // The last 100svh of the pin is the hold under Chapter 3.
  const distance = aperture.offsetHeight - 2 * vh;
  const p = clamp(-r.top / distance);
  const desktop = mqDesktop.matches;

  const open = desktop ? beat(p, 0.2, 0.72) : beat(p, 0.38, 0.84);
  const exit = desktop ? beat(p, 0.74, 0.94) : beat(p, 0.86, 1);
  // The window reaches full width before it reaches full height.
  const openX = beat(open, 0, 0.7);

  const top = rest.t * (1 - open);
  aperture.style.setProperty('--wt', n(top));
  aperture.style.setProperty('--wb', n(rest.b * (1 - open)));
  aperture.style.setProperty('--wl', n(rest.l * (1 - openX)));
  aperture.style.setProperty('--wr', n(rest.r * (1 - openX)));
  aperture.style.setProperty('--exit', n(exit));

  return {
    pinned: r.top <= 1 && r.bottom >= vh - 1,
    theme: (top / 100) * vh <= navLine ? 'ivory' : 'dark',
  };
}

/**
 * Chapter 4: the band travels, settles on the slit, becomes the window and
 * opens. On mobile the image finally scales down to show the whole room.
 */
function updateBlade(): { pinned: boolean; band: boolean } {
  const r = blade.getBoundingClientRect();
  const distance = blade.offsetHeight - vh;
  const p = clamp(-r.top / distance);
  const desktop = mqDesktop.matches;

  const iw = Math.max(vw, vh * STUDIO_RATIO);
  const ih = iw / STUDIO_RATIO;
  const iwPct = (iw / vw) * 100;

  // Mobile: the scale-down takes exactly as much scroll as the image loses
  // in height, so its bottom edge rises at native scroll speed with the
  // captions following directly beneath it.
  const finalHeight = vw / STUDIO_RATIO;
  const shrinkStart = desktop ? 1 : clamp(1 - (vh - finalHeight) / distance);
  const k = shrinkStart;

  const travel = beat(p, 0.03 * k, 0.4 * k);
  const settle = beat(p, 0.42 * k, 0.55 * k);
  const open = beat(p, 0.55 * k, (desktop ? 0.9 : 0.97) * k);
  const shrink = desktop ? 0 : beat(p, shrinkStart, 1);

  // Everything in percentages of the stage width.
  const half = desktop ? 3 : 6;
  const slit = SLIT.centre * 100;
  const slitLeft = slit - (SLIT.centre - SLIT.left) * iwPct;
  const slitRight = slit + (SLIT.right - SLIT.centre) * iwPct;

  const centre = lerp(100 + half, slit, travel);
  // Settling: the band draws in to the lit opening while the ivory gives
  // way to the photograph behind it.
  let left = lerp(centre - half, slitLeft, settle);
  let right = lerp(centre + half, slitRight, settle);
  left = lerp(left, 0, open);
  right = lerp(right, 100, open);
  const bandOpacity = 1 - settle;

  blade.style.setProperty('--l', n(left));
  blade.style.setProperty('--r', n(right));
  blade.style.setProperty('--band-o', n(bandOpacity));
  // Once the photograph is fully open the prelude line lies hidden beneath
  // it; it must not reappear when the image scales down on mobile.
  blade.style.setProperty('--line-o', open >= 1 ? '0' : '1');

  // Image position: the slit sits at 31.5% of the stage. It only ever
  // changes during the final mobile scale-down.
  const x0 = SLIT.centre * (vw - iw);
  const y0 = 0.4 * (vh - ih);
  blade.style.setProperty('--ix', `${n(x0 * (1 - shrink))}px`);
  blade.style.setProperty('--iy', `${n(y0 * (1 - shrink))}px`);
  blade.style.setProperty('--is', n(lerp(1, vw / iw, shrink)));

  return {
    pinned: r.top <= 1 && r.bottom >= vh - 1,
    band: bandOpacity > 0.5 && right > 0 && left < 100,
  };
}

/** Topmost ground under the navigation line. Later sections sit on top. */
function groundAtNav(): HTMLElement | null {
  let hit: HTMLElement | null = null;
  for (const g of grounds) {
    const r = g.getBoundingClientRect();
    if (r.height > 0 && r.top <= navLine && r.bottom > navLine) hit = g;
  }
  return hit;
}

function frame() {
  queued = false;
  const y = window.scrollY;

  let pinned = false;
  let apertureTheme: 'ivory' | 'dark' | null = null;
  let band = false;

  if (motion) {
    updateHero(y);
    const a = updateAperture();
    const b = updateBlade();
    pinned = a.pinned || b.pinned;
    apertureTheme = a.theme;
    band = b.band;
  }

  // Type colour by the ground beneath the navigation.
  const ground = groundAtNav();
  let theme: 'ivory' | 'dark' = 'ivory';
  if (ground) {
    const kind = ground.dataset.ground;
    if (kind === 'light') theme = 'dark';
    else if (kind === 'fade') {
      const r = ground.getBoundingClientRect();
      theme = (navLine - r.top) / r.height < 0.45 ? 'dark' : 'ivory';
    }
    if (motion && apertureTheme && aperture.contains(ground)) theme = apertureTheme;
  }
  nav.dataset.theme = theme;

  // While the opaque ivory band is under the navigation in Chapter 4, the
  // type reads near-black exactly where the band is and ivory elsewhere.
  nav.classList.toggle('on-band', band && ground !== null && blade.contains(ground));

  // Hide on scroll down, return on scroll up. Always visible, and never
  // animating, while a sequence is pinned.
  const dy = y - lastY;
  nav.classList.toggle('no-anim', pinned);
  if (pinned || y < 80) nav.classList.remove('is-hidden');
  else if (dy > 4) nav.classList.add('is-hidden');
  else if (dy < -4) nav.classList.remove('is-hidden');
  lastY = y;
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(frame);
}

function refresh() {
  measure();
  schedule();
}

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', refresh);
document.fonts?.ready.then(refresh);
mqReduce.addEventListener('change', () => {
  motion = !mqReduce.matches;
  html.classList.toggle('motion', motion);
  if (!motion) clearMotion();
  refresh();
});
refresh();

/* ------------------------------------------------------------------ */
/* Headline reveals: hero on load, Chapter 5 once on entry             */
/* ------------------------------------------------------------------ */

function reveal(el: HTMLElement) {
  el.classList.add('is-in');
  window.setTimeout(() => el.classList.add('is-done'), 1400);
}

for (const el of $$('[data-reveal]')) {
  if (el.dataset.reveal === 'load' || !('IntersectionObserver' in window)) {
    requestAnimationFrame(() => requestAnimationFrame(() => reveal(el)));
    continue;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        reveal(el);
        observer.disconnect();
      }
    },
    { threshold: 0.35 },
  );
  observer.observe(el);
}

/* ------------------------------------------------------------------ */
/* Treatment categories                                                */
/* ------------------------------------------------------------------ */

for (const cat of $$('[data-cat]')) {
  const button = $<HTMLButtonElement>('.cat__btn', cat);
  const panel = $('.cat__panel', cat);
  let timer = 0;

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    window.clearTimeout(timer);

    if (open) {
      panel.hidden = false;
      void panel.offsetHeight; // start the wipe from the closed state
      cat.classList.add('is-open');
    } else {
      cat.classList.remove('is-open');
      timer = window.setTimeout(() => {
        panel.hidden = true;
        schedule();
      }, duration());
    }
    schedule();
  });
}

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */

const menu = $<HTMLDialogElement>('[data-menu]');
const menuOpen = $<HTMLButtonElement>('[data-menu-open]');
let menuTimer = 0;

function openMenu() {
  window.clearTimeout(menuTimer);
  menu.showModal();
  html.classList.add('menu-open');
  requestAnimationFrame(() => menu.classList.add('is-open'));
}

function closeMenu(animated = true) {
  menu.classList.remove('is-open');
  html.classList.remove('menu-open');
  window.clearTimeout(menuTimer);
  if (animated && duration() > 0) menuTimer = window.setTimeout(() => menu.close(), duration());
  else menu.close();
}

menuOpen.addEventListener('click', openMenu);
$('[data-menu-close]', menu).addEventListener('click', () => closeMenu());
// Escape closes with the same fade.
menu.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeMenu();
});
// A chapter link closes at once so the native jump is not delayed.
for (const link of $$('[data-menu-link]', menu)) link.addEventListener('click', () => closeMenu(false));
mqDesktop.addEventListener('change', () => {
  if (menu.open) closeMenu(false);
  refresh();
});
