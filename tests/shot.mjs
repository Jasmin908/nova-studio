// Screenshot helper for visual review.
//   node tests/shot.mjs <name> <path> <width> <height> <y,y,...> [--rm] [--nojs]
// Scroll positions are in viewport heights (e.g. 0,0.5,1.25).
// Requires `npm run preview` to be running.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const [name, path, width, height, ys, ...flags] = process.argv.slice(2);
const base = process.env.BASE_URL || 'http://localhost:4321';
const w = Number(width);
const h = Number(height);

await mkdir('tests/screens', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
  hasTouch: w < 900,
  reducedMotion: flags.includes('--rm') ? 'reduce' : 'no-preference',
  javaScriptEnabled: !flags.includes('--nojs'),
});
const page = await context.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1600);

// Section positions, in viewport heights, to help choose scroll positions.
console.log(
  await page.evaluate(() =>
    ['.hero', '.statement', '.treat', '.groundfade', '.blade', '.info', '.closing', '.footer']
      .map((s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        const top = (r.top + scrollY) / innerHeight;
        return `${s} ${top.toFixed(2)}–${(top + r.height / innerHeight).toFixed(2)}`;
      })
      .join('  '),
  ),
);

for (const y of ys.split(',').map(Number)) {
  await page.evaluate((top) => window.scrollTo(0, top), Math.round(y * h));
  await page.waitForTimeout(700);
  const file = `tests/screens/${name}-${String(y).replace('.', '_')}.jpg`;
  await page.screenshot({ path: file, type: 'jpeg', quality: 72 });
  console.log(file);
}
await browser.close();
