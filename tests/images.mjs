// Image loading check: every campaign image must load, at every width,
// pixel density and format, with no failed image requests.
//   node tests/images.mjs            (requires `npm run preview`)
import { chromium, devices } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:4321';
const CASES = [
  ...[320, 375, 390, 404].flatMap((width) =>
    [1, 2, 3].map((dpr) => ({ label: `mobile ${width} @${dpr}x`, width, height: 844, dpr, mobile: true })),
  ),
  { label: 'tablet portrait 768 @2x', width: 768, height: 1024, dpr: 2, mobile: true },
  { label: 'desktop 1440 @1x', width: 1440, height: 900, dpr: 1, mobile: false },
  { label: 'desktop 1920 @2x', width: 1920, height: 1080, dpr: 2, mobile: false },
];
// Accept headers that make the browser fall through AVIF -> WebP -> JPEG.
const FORMATS = [
  { label: 'avif', block: [] },
  { label: 'webp', block: ['.avif'] },
  { label: 'jpeg', block: ['.avif', '.webp'] },
];

let failures = 0;
const browser = await chromium.launch();

for (const path of ['/', '/en/']) {
  for (const c of CASES) {
    for (const format of path === '/' ? FORMATS : [FORMATS[0]]) {
      const context = await browser.newContext({
        viewport: { width: c.width, height: c.height },
        deviceScaleFactor: c.dpr,
        isMobile: c.mobile,
        hasTouch: c.mobile,
        userAgent: c.mobile ? devices['iPhone 13'].userAgent : undefined,
      });
      const page = await context.newPage();
      const bad = [];
      const requested = [];
      page.on('response', (r) => {
        if (!/\/img\//.test(r.url())) return;
        requested.push(`${r.status()} ${r.headers()['content-type']} ${r.url().split('/img/')[1]}`);
        if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
      });
      page.on('requestfailed', (r) => /\/img\//.test(r.url()) && bad.push(`failed ${r.url()}`));

      // Simulate a browser without support for a format by removing its
      // <source> elements before the parser reaches the images.
      if (format.block.length) {
        await page.addInitScript((types) => {
          new MutationObserver((records) => {
            for (const rec of records)
              for (const node of rec.addedNodes)
                if (node.nodeName === 'SOURCE' && types.some((t) => node.type === `image/${t.slice(1)}`)) node.remove();
          }).observe(document, { childList: true, subtree: true });
        }, format.block);
      }

      await page.goto(base + path, { waitUntil: 'networkidle' });
      // Scroll through the page so lazy images are requested.
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= total; y += c.height / 2) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(60);
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const images = await page.evaluate(() =>
        [...document.querySelectorAll('img')].map((img) => ({
          src: (img.currentSrc || '(none)').split('/img/')[1] ?? img.currentSrc,
          ok: img.complete && img.naturalWidth > 0,
          natural: `${img.naturalWidth}×${img.naturalHeight}`,
        })),
      );
      const allOk = images.length === 3 && images.every((i) => i.ok) && bad.length === 0;
      const rightFormat = images.every((i) => i.src.endsWith(format.label === 'jpeg' ? '.jpg' : `.${format.label}`));
      // The crop must match the composition: desktop crops on desktop,
      // mobile crops on mobile (the interior uses one frame everywhere).
      const crop = c.mobile ? '-mobile-' : '-desktop-';
      const rightCrop = images.slice(0, 2).every((i) => i.src.includes(crop));
      if (!allOk || !rightFormat || !rightCrop) failures++;
      console.log(
        `${allOk && rightFormat && rightCrop ? 'PASS' : 'FAIL'}  ${path.padEnd(5)} ${c.label.padEnd(24)} ${format.label.padEnd(5)} ` +
          images.map((i) => `${i.ok ? '' : '✗ '}${i.src}`).join('  |  ') +
          (bad.length ? `  ERRORS: ${bad.join(', ')}` : ''),
      );
      if (process.env.VERBOSE) console.log(requested.map((r) => `        ${r}`).join('\n'));
      await context.close();
    }
  }
}

await browser.close();
console.log(failures === 0 ? '\nAll image checks passed.' : `\n${failures} image check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
