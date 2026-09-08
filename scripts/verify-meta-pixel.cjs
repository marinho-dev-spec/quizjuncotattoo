const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const production = 'https://quizjuncotattoo.vercel.app';
const pixelId = '1075539164267174';
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const report = { date: new Date().toISOString(), pixelId, checks: [], errors: [] };
  try {
    for (const width of [390,1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', isMobile: width === 390, hasTouch: width === 390 });
      // Observe calls without altering SDK behavior or bypassing Meta's bot filtering.
      await context.addInitScript(() => {
        let current;
        window.__metaCalls = [];
        Object.defineProperty(window, 'fbq', {
          configurable: true,
          get: () => current,
          set(value) {
            current = new Proxy(value, { apply(target, receiver, args) {
              window.__metaCalls.push(Array.from(args));
              return Reflect.apply(target, receiver, args);
            } });
          },
        });
      });
      const events = [], google = [], sdkResponses = [];
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (/google-analytics|googletagmanager|googleadservices|doubleclick/.test(url.hostname)) { google.push(url.hostname); return route.abort(); }
        // Inspect real SDK payloads without sending synthetic conversions to Meta.
        if (url.hostname.endsWith('facebook.com') && url.pathname.replace(/\/$/, '') === '/tr') {
          const params = new URLSearchParams(url.search);
          for (const [key, value] of new URLSearchParams(request.postData() || '')) params.set(key, value);
          events.push(Object.fromEntries(params));
          return route.fulfill({ status: 200, body: '' });
        }
        if (url.origin === production && process.env.QUIZ_META_LIVE !== 'true') {
          const relative = ['/', '/quiz', '/quiz/'].includes(url.pathname) ? '/quiz/index.html' : url.pathname;
          const file = path.resolve('public', '.' + relative);
          assert.ok(file.startsWith(path.resolve('public') + path.sep));
          return route.fulfill({ status: 200, contentType: mime[path.extname(file)] || 'application/octet-stream', body: await fs.readFile(file) });
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('response', response => { if (response.url().includes('connect.facebook.net') && response.url().includes('fbevents.js')) sdkResponses.push(response.status()); });
      await page.goto(production, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => typeof window.fbq?.callMethod === 'function');
      await page.waitForTimeout(750);
      assert.deepEqual(sdkResponses, [200], 'real Meta SDK loads exactly once');
      const calls = async eventName => page.evaluate(name => window.__metaCalls.filter(call => call[0] === 'trackSingle' && call[2] === name), eventName);
      assert.equal((await calls('PageView')).length, 1);
      assert.equal((await calls('Contact')).length, 0);
      await page.locator('[data-start]').click();
      for (let step = 0; step < 10; step++) {
        await page.locator('input[type=radio]').first().check();
        await page.locator('#next').click();
      }
      await page.locator('#name').fill('NOME PRIVADO TESTE 8271');
      await page.locator('#next').click();
      assert.equal((await calls('Contact')).length, 0, 'quiz completion is not a WhatsApp contact');
      await page.locator('#message').fill(' ');
      await page.locator('#whatsapp-link').click();
      assert.equal((await calls('Contact')).length, 0, 'empty message never triggers contact');
      await page.locator('#message').fill('MENSAGEM PRIVADA TESTE 8271');
      // Stop navigation after the tracking listener; nothing is sent to WhatsApp.
      await page.evaluate(() => document.addEventListener('click', event => { if (event.target.closest?.('#whatsapp-link')) event.preventDefault(); }));
      await page.locator('#whatsapp-link').click();
      await page.waitForTimeout(750);
      await page.locator('#whatsapp-link').click();
      await page.waitForTimeout(250);
      assert.equal((await calls('Contact')).length, 1, 'double clicks count only once');
      assert.ok(events.every(event => event.id === pixelId));
      assert.ok(events.every(event => ['PageView', 'Contact'].includes(event.ev)));
      const allCalls = await page.evaluate(() => window.__metaCalls);
      const contact = (await calls('Contact'))[0];
      assert.equal(contact[1], pixelId);
      assert.equal(contact[3].cta_origem, 'quiz_resultado');
      assert.equal(contact[3].content_category, 'tatuagem');
      assert.doesNotMatch(JSON.stringify({ allCalls, events }), /8271|MENSAGEM PRIVADA|NOME PRIVADO/);
      const pixels = await page.evaluate(() => window.fbq.getState().pixels);
      assert.equal(pixels.length, 1);
      assert.equal(pixels[0].id, pixelId);
      assert.equal(pixels[0].eventCount, 2, 'real SDK processes PageView and Contact');
      assert.deepEqual(pixels[0].userData, {});
      assert.deepEqual(pixels[0].userDataFormFields, {});
      assert.deepEqual(google, []);
      report.checks.push({ width, source: process.env.QUIZ_META_LIVE === 'true' ? 'production' : 'local files with production hostname', sdk: 200, pageView: 1, contact: 1, duplicateContacts: 0, quizDataInPayload: false, googleTags: false, capturedTransportRequests: events.length, note: 'SDK calls and processing verified; automated-browser traffic may be filtered by Meta. Any outgoing test event is intercepted.' });
      await context.close();
    }
    const quiet = await browser.newContext();
    const page = await quiet.newPage();
    const external = [];
    await quiet.route('https://connect.facebook.net/**', route => { external.push(route.request().url()); return route.abort(); });
    await quiet.route('http://127.0.0.1:3002/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Local tracking test</title>' }));
    await page.goto('http://127.0.0.1:3002');
    await page.addScriptTag({ path: 'public/quiz/meta-pixel.js' });
    assert.equal(await page.evaluate(() => typeof window.fbq), 'undefined');
    assert.deepEqual(external, []);
    await quiet.close();
    assert.deepEqual(report.errors, []);
    report.localTrackingDisabled = true;
    await fs.mkdir('.cache', { recursive: true });
    await fs.writeFile('.cache/validacao-meta-pixel.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
