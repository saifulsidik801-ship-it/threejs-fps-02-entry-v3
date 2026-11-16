// verify-polish.cjs — self-tests (?test=1) + live smoke test (menu -> Play -> BUY, W moves, B toggles).
// Run: node verify-polish.cjs  (from the repo root)
const { chromium } = require('/home/hatch/workspace/mm-wallet/node_modules/playwright-core');
const { spawn } = require('node:child_process');

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';

(async () => {
  const server = spawn('node', ['serve.ts', '--port', '8081'], { cwd: __dirname, stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 1500));
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
  let fail = 0;
  // 1. Self-tests.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [], logs = [];
    let sawFavicon = false;
    // CDP Network capture: the only way to see the browser's own favicon fetch.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    const net404 = [];
    cdp.on('Network.responseReceived', (ev) => {
      if (ev.response.status >= 400) net404.push(ev.response.status + ' ' + ev.response.url);
      if (ev.response.url.includes('favicon.ico')) sawFavicon = true;
    });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); else logs.push(m.text()); });
    page.on('requestfailed', (r) => errors.push('REQFAIL: ' + r.url() + ' ' + (r.failure() || {}).errorText));
    page.on('request', (r) => { if (r.url().includes('favicon.ico')) sawFavicon = true; });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon.ico')) errors.push('HTTP' + r.status() + ': ' + r.url()); });
    await page.goto('http://127.0.0.1:8081/?test=1', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);
    const title = await page.title();
    const testLine = logs.find((l) => l.includes('SALTPIER self-tests'));
    console.log('TESTS title:', title);
    console.log('TESTS line:', testLine || '(none)');
    // The only 404 the browser reports is its automatic /favicon.ico request
    // (no favicon file in game/ — pre-existing, not a game asset). Real missing
    // game files would surface as HTTP entries above; filter the favicon echo.
    const realErrs = sawFavicon ? errors.filter((e) => !/Failed to load resource.*404/.test(e)) : errors;
    console.log('TESTS network 404s (CDP):', net404.length ? net404.join(' | ') : 'none');
    console.log('TESTS errors (excl. favicon 404, sawFavicon=' + sawFavicon + '):', realErrs.length ? realErrs.join(' | ') : 'none');
    if (!testLine || !testLine.includes('20 passed, 0 failed')) { console.log('TESTS: FAIL'); fail += 1; }
    if (realErrs.length) { console.log('TESTS: real errors present'); fail += 1; }
    if (net404.some((u) => !u.includes('favicon.ico'))) { console.log('TESTS: non-favicon 404 on the wire'); fail += 1; }
    await page.close();
  }
  // 2. Live smoke: menu -> Play -> BUY PHASE, W moves, B toggles buy.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    let sawFavicon = false;
    const cdp2 = await page.context().newCDPSession(page);
    await cdp2.send('Network.enable');
    cdp2.on('Network.responseReceived', (ev) => {
      if (ev.response.url.includes('favicon.ico')) sawFavicon = true;
      if (ev.response.status >= 400 && !ev.response.url.includes('favicon.ico')) errors.push('HTTP' + ev.response.status + ': ' + ev.response.url);
    });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    page.on('request', (r) => { if (r.url().includes('favicon.ico')) sawFavicon = true; });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon.ico')) errors.push('HTTP' + r.status() + ': ' + r.url()); });
    await page.goto('http://127.0.0.1:8081/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);
    const menuVisible = await page.evaluate(() => !document.getElementById('menu').hidden);
    await page.click('#play');
    await page.waitForTimeout(1500);
    const phase = await page.evaluate(() => document.getElementById('phase').textContent);
    const shotA = await page.screenshot({ type: 'jpeg', quality: 80 });
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1200);
    await page.keyboard.up('KeyW');
    const shotB = await page.screenshot({ type: 'jpeg', quality: 80 });
    const moved = !shotA.equals(shotB);
    const buyBefore = await page.evaluate(() => document.getElementById('buy').hidden);
    await page.keyboard.press('KeyB');
    await page.waitForTimeout(400);
    const buyAfter = await page.evaluate(() => document.getElementById('buy').hidden);
    await page.keyboard.press('KeyB');
    await page.waitForTimeout(400);
    const buyBack = await page.evaluate(() => document.getElementById('buy').hidden);
    console.log('SMOKE menuVisible:', menuVisible, '| phase after Play:', JSON.stringify(phase));
    console.log('SMOKE W moves view:', moved, '| buy hidden before/after/back:', buyBefore, buyAfter, buyBack);
    const realErrs = sawFavicon ? errors.filter((e) => !/Failed to load resource.*404/.test(e)) : errors;
    console.log('SMOKE errors (excl. favicon 404, sawFavicon=' + sawFavicon + '):', realErrs.length ? realErrs.join(' | ') : 'none');
    // Buy menu starts OPEN in BUY PHASE (round start shows it); B toggles it shut, then open.
    if (!menuVisible || !/BUY/.test(phase) || !moved || buyBefore !== false || buyAfter !== true || buyBack !== false) { console.log('SMOKE: FAIL'); fail += 1; }
    if (realErrs.length) { console.log('SMOKE: page errors present'); fail += 1; }
    await page.close();
  }
  await browser.close();
  server.kill();
  console.log(fail === 0 ? 'VERIFY: ALL PASS' : 'VERIFY: ' + fail + ' FAILING BLOCK(S)');
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
