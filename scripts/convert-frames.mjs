/**
 * convert-frames.mjs
 * Converts all brain-frames JPGs to WebP:
 *   - Desktop: max 1280px wide, quality 72
 *   - Mobile:  max 768px wide,  quality 65
 *
 * Outputs:
 *   public/brain-frames-webp/frame_XXXX.webp         (desktop)
 *   public/brain-frames-webp-mobile/frame_XXXX.webp  (mobile)
 *
 * Run: node scripts/convert-frames.mjs
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const INPUT_DIR     = join(ROOT, 'public', 'brain-frames');
const OUTPUT_DESK   = join(ROOT, 'public', 'brain-frames-webp');
const OUTPUT_MOBILE = join(ROOT, 'public', 'brain-frames-webp-mobile');

const DESKTOP_WIDTH  = 1280;
const MOBILE_WIDTH   = 768;
const DESKTOP_QUALITY = 72;
const MOBILE_QUALITY  = 65;
const CONCURRENCY    = 8; // parallel conversions

// Create output dirs
[OUTPUT_DESK, OUTPUT_MOBILE].forEach(d => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

const files = readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'))
  .sort();

console.log(`\n🧠 Converting ${files.length} frames...\n`);

let done = 0;

async function convertFile(filename) {
  const src = join(INPUT_DIR, filename);
  const base = filename.replace(/\.(jpg|jpeg)$/i, '.webp');

  await Promise.all([
    // Desktop WebP
    sharp(src)
      .resize({ width: DESKTOP_WIDTH, withoutEnlargement: true })
      .webp({ quality: DESKTOP_QUALITY, effort: 4 })
      .toFile(join(OUTPUT_DESK, base)),

    // Mobile WebP (smaller)
    sharp(src)
      .resize({ width: MOBILE_WIDTH, withoutEnlargement: true })
      .webp({ quality: MOBILE_QUALITY, effort: 4 })
      .toFile(join(OUTPUT_MOBILE, base)),
  ]);

  done++;
  if (done % 20 === 0 || done === files.length) {
    const pct = Math.round((done / files.length) * 100);
    process.stdout.write(`\r  ✓ ${done}/${files.length}  (${pct}%)`);
  }
}

// Process in batches of CONCURRENCY
for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(convertFile));
}

// --- Size report ---
import { statSync } from 'fs';

let origTotal = 0, deskTotal = 0, mobTotal = 0;
for (const f of files) {
  const base = f.replace(/\.(jpg|jpeg)$/i, '.webp');
  origTotal += statSync(join(INPUT_DIR, f)).size;
  deskTotal += statSync(join(OUTPUT_DESK, base)).size;
  mobTotal  += statSync(join(OUTPUT_MOBILE, base)).size;
}

const mb = b => (b / 1024 / 1024).toFixed(2);
console.log(`\n\n📊 Results:`);
console.log(`  Original  JPG  (240 frames): ${mb(origTotal)} MB`);
console.log(`  Desktop   WebP (240 frames): ${mb(deskTotal)} MB  (${Math.round((1 - deskTotal/origTotal)*100)}% smaller)`);
console.log(`  Mobile    WebP (240 frames): ${mb(mobTotal)} MB  (${Math.round((1 - mobTotal/origTotal)*100)}% smaller)`);
console.log(`\n✅ Done! WebP frames are in:`);
console.log(`  public/brain-frames-webp/`);
console.log(`  public/brain-frames-webp-mobile/`);
