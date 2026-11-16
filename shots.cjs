// shots.cjs — serves game/ and takes the 4 staged screenshots with plain Chromium.
// Usage: node shots.cjs  (from the repo root; writes screenshots/*.jpg, 1280x720)
const { chromium } = require('/home/hatch/workspace/mm-wallet/node_modules/playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SHOTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));
const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';

(async () => {
  const server = spawn('node', ['serve.ts', '--port', '8080'], { cwd: __dirname, stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 1500));
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    await page.goto('http://127.0.0.1:8080/' + shot.query, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4500);
    const out = path.join(__dirname, 'screenshots', shot.name);
    await page.screenshot({ path: out, type: 'jpeg', quality: 95 });
    console.log(shot.name, fs.statSync(out).size + ' bytes', errors.length ? errors.join(' | ') : 'no page errors');
    await page.close();
  }
  await browser.close();
  server.kill();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
