import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('Vercel response policy fails closed for framing and risky browser capabilities', () => {
  const config = JSON.parse(read('vercel.json'));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
  expect(headers['X-Content-Type-Options']).toBe('nosniff');
  expect(headers['X-Frame-Options']).toBe('DENY');
  expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['Permissions-Policy']).toContain('camera=()');
  expect(headers['Permissions-Policy']).toContain('geolocation=()');
  expect(headers['Permissions-Policy']).toContain('microphone=(self)');
  expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
  expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
  expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
});

test('HTML loads application scripts only from this origin', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.every((src) => src.startsWith('/'))).toBe(true);
});

test('branch source contains no obvious production secret material', () => {
  const sourceFiles = [
    'index.html', 'src/app.js', 'src/mobile-v2.js', 'src/phase2-mobile.js',
    'src/phase3-discovery.js', 'src/phase4-cockpit.js', 'src/phase5-record.js',
  ];
  const source = sourceFiles.map(read).join('\n');
  const forbidden = [
    /sk_live_[A-Za-z0-9]/i,
    /service[_-]?role\s*[:=]\s*['"][^'"]+/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
    /VERCEL_TOKEN\s*=/i,
  ];
  for (const pattern of forbidden) expect(source).not.toMatch(pattern);
});

test('restricted surfaces do not load analytics or session replay scripts', () => {
  const html = read('index.html');
  const source = [html, read('src/app.js'), read('src/phase3-discovery.js')].join('\n').toLowerCase();
  expect(source).not.toContain('posthog.init');
  expect(source).not.toContain('hotjar');
  expect(source).not.toContain('fullstory');
  expect(source).not.toContain('clarity(');
});

test('static experience remains inside a conservative source-size budget', () => {
  const files = [
    'index.html', 'src/styles.css', 'src/app.js', 'src/mobile-v2.css', 'src/mobile-v2.js',
    'src/phase2-mobile.css', 'src/phase2-mobile.js', 'src/phase3-discovery.css',
    'src/phase3-discovery.js', 'src/phase4-cockpit.css', 'src/phase4-cockpit.js',
    'src/phase5-record.css', 'src/phase5-record.js',
  ];
  const bytes = files.reduce((sum, file) => sum + fs.statSync(path.join(root, file)).size, 0);
  expect(bytes).toBeLessThan(500_000);
});

test('public entry surface exposes skip navigation and no private-client language', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/home');
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('#main')).toBeVisible();
  const text = (await page.locator('#main').innerText()).toLowerCase();
  expect(text).not.toContain('pulse metrics show');
  expect(text).not.toContain('last meaningful conversation:');
});
