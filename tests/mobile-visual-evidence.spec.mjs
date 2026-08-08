import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const routes = [
  ['home', 'homepage', 'Homepage'],
  ['discovery', 'discovery', 'Discovery'],
  ['cockpit', 'cherry-os', 'Cherry OS'],
  ['client', 'transformation-record', 'Transformation Record'],
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('capture exact-branch mobile visual evidence and PDF review sheet', async ({ page }) => {
  const outDir = path.resolve('artifacts/mobile-v2');
  fs.mkdirSync(outDir, { recursive: true });
  const captures = [];

  for (const [route, name, title] of routes) {
    await page.goto(`http://127.0.0.1:4173/#/${route}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#main')).toBeVisible();

    if (route === 'discovery') {
      await expect(page.locator('[data-brief-toggle]')).toBeVisible();
    }

    const file = path.join(outDir, `${name}-390x844.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    captures.push({ title, file });
  }

  const sections = captures.map(({ title, file }) => {
    const data = fs.readFileSync(file).toString('base64');
    return `<section><h2>${title}</h2><p>390 × 844 CSS px · exact branch capture</p><img src="data:image/png;base64,${data}" alt="${title} mobile capture"></section>`;
  }).join('');

  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, sans-serif; margin: 0; color: #111; }
    header { margin-bottom: 18px; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    header p, section p { color: #666; font-size: 10px; margin: 0 0 10px; }
    section { break-before: page; }
    section:first-of-type { break-before: auto; }
    h2 { font-size: 18px; margin: 0 0 4px; }
    img { display: block; width: 390px; max-width: 100%; height: auto; border: 1px solid #ddd; }
  </style></head><body>
    <header><h1>WorldStage mobile-first v2 visual evidence</h1><p>Branch: redesign/mobile-first-v2 · generated in GitHub Actions from the tested source.</p></header>
    ${sections}
  </body></html>`);

  await page.pdf({ path: path.join(outDir, 'WORLDSTAGE_MOBILE_V2_VISUAL_EVIDENCE.pdf'), format: 'A4', printBackground: true });
});
