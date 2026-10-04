// Generates the web derivatives from the three originals.
// Originals are read into memory and never written to. Output goes to
// public/img/ and a manifest to src/data/images.json.
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { ORIGINALS } from './originals.mjs';

const OUT_DIR = 'public/img';
const MANIFEST = 'src/data/images.json';

// Crops are fractions of the original frame, so every variant is cut
// from the same three files.
const VARIANTS = [
  { asset: 'hero', key: 'desktop', crop: null, widths: [1280, 1920, 2560, 3840] },
  // Portrait cut from the right third, face centred.
  { asset: 'hero', key: 'mobile', crop: { left: 0.42, width: 0.46 }, widths: [720, 1080, 1440, 1766] },
  { asset: 'closeup', key: 'desktop', crop: null, widths: [1280, 1920, 2560, 3840] },
  // Portrait cut centred on the face.
  { asset: 'closeup', key: 'mobile', crop: { left: 0.21, width: 0.46 }, widths: [720, 1080, 1440, 1766] },
  // The interior is always the full 3:2 frame; framing is done in CSS.
  { asset: 'studio', key: 'full', crop: null, widths: [1280, 1920, 2560, 3504] },
];

const FORMATS = {
  avif: (img) => img.avif({ quality: 60, effort: 5, chromaSubsampling: '4:4:4' }),
  webp: (img) => img.webp({ quality: 84, effort: 5, smartSubsample: true }),
};
const FALLBACK_WIDTH = 1920;

const short = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 8);

await mkdir(OUT_DIR, { recursive: true });
for (const f of await readdir(OUT_DIR)) await rm(`${OUT_DIR}/${f}`);

const manifest = {};
let total = 0;

for (const v of VARIANTS) {
  const source = await readFile(ORIGINALS[v.asset].path);
  const meta = await sharp(source).metadata();
  const region = v.crop
    ? {
        left: Math.round(meta.width * v.crop.left),
        top: 0,
        width: Math.round(meta.width * v.crop.width),
        height: meta.height,
      }
    : { left: 0, top: 0, width: meta.width, height: meta.height };

  const entry = { width: region.width, height: region.height, avif: [], webp: [], fallback: '' };

  for (const w of v.widths) {
    const width = Math.min(w, region.width);
    const base = () => sharp(source).extract(region).resize({ width });
    for (const [ext, encode] of Object.entries(FORMATS)) {
      const buf = await encode(base()).toBuffer();
      const name = `${v.asset}-${v.key}-${width}.${short(buf)}.${ext}`;
      await writeFile(`${OUT_DIR}/${name}`, buf);
      entry[ext].push({ w: width, src: `/img/${name}` });
      total += buf.length;
      console.log(`${name.padEnd(44)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB`);
    }
  }

  const fw = Math.min(FALLBACK_WIDTH, region.width);
  const jpg = await sharp(source)
    .extract(region)
    .resize({ width: fw })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const jpgName = `${v.asset}-${v.key}-${fw}.${short(jpg)}.jpg`;
  await writeFile(`${OUT_DIR}/${jpgName}`, jpg);
  entry.fallback = `/img/${jpgName}`;
  total += jpg.length;
  console.log(`${jpgName.padEnd(44)} ${(jpg.length / 1024).toFixed(0).padStart(5)} KB`);

  manifest[v.asset] ??= {};
  manifest[v.asset][v.key] = entry;
}

await mkdir('src/data', { recursive: true });
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${(total / 1024 / 1024).toFixed(2)} MB of derivatives written to ${OUT_DIR}`);
