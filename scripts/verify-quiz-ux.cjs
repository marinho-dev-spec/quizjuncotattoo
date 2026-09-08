const assert = require('node:assert/strict');
const fs = require('node:fs');
const playwright = require('playwright');
const base = process.env.QUIZ_BASE_URL || 'http://127.0.0.1:3002';
const engine = process.env.QUIZ_ENGINE || 'chromium';

(async () => {
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.CHROME_PATH } : {}) });
  const report = { date: new Date().toISOString(), engine, states: [], errors: [] };
  try {
    for (const [width, height] of [[390,844], [844,390], [1440,900]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1000, isMobile: width < 1000, reducedMotion: 'reduce' });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      async function audit(state) {
        const result = await page.evaluate(async () => {
          await document.fonts.ready;
          const axe = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } });
          const overflow = [];
          for (const el of document.querySelectorAll('button,.button,.choice-face,summary,input,textarea')) {
            if (!el.getClientRects().length) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) overflow.push('small target: ' + (el.id || el.textContent));
            if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement) && el.scrollWidth > el.clientWidth + 2) overflow.push('text overflow: ' + (el.id || el.textContent));
          }
          return { violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), overflow, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert.deepEqual(result, { violations: [], overflow: [], pageOverflow: false }, `${engine} ${width} ${state}`);
        report.states.push({ width, height, state, status: 'passed' });
      }
      await audit('intro');
      await page.locator('#gallery-open').click();
      await page.locator('#dialog-image').evaluate(img => img.decode());
      const dialogLayout = await page.locator('#project-dialog').evaluate(el => {
        const r = el.getBoundingClientRect();
        const image = document.querySelector('#dialog-image').getBoundingClientRect();
        return { fits: r.top >= 0 && r.bottom <= innerHeight + 1, imageVisible: image.height > 40, internalScroll: el.scrollHeight > el.clientHeight + 2 };
      });
      assert.deepEqual(dialogLayout, { fits: true, imageVisible: true, internalScroll: false }, `${width} dialog fits landscape`);
      await audit('gallery');
      if (height < 500) await page.screenshot({ path: `.cache/ux-${engine}-landscape-gallery.png` });
      await page.locator('#dialog-close').click();
      await page.locator('[data-start]').first().click();
      for (let step = 0; step < 11; step++) {
        const key = await page.locator('body').getAttribute('data-step');
        assert.equal(await page.locator('#progress').getAttribute('aria-valuenow'), String(step + 1));
        assert.equal(await page.locator('#question-title').evaluate(el => el === document.activeElement), true);
        if (step < 10) {
          const options = page.locator('input[type=radio]');
          for (const option of await options.all()) {
            await option.check();
            assert.equal(await option.isChecked(), true);
          }
          // After choosing a photo near the top, the next action remains reachable.
          if (width === 390 && key === 'theme') {
            await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
            const r = await page.locator('#next').boundingBox();
            assert.ok(r.y >= 0 && r.y + r.height <= height + 1, 'mobile continue button stays in the viewport');
          }
        } else {
          await page.locator('#name').fill('A'.repeat(60));
          await page.locator('.optional-details summary').click();
          await page.locator('#notes').fill('Detalhe '.repeat(60));
          // A small visual viewport models the area left above a phone keyboard.
          if (width === 390) {
            await page.setViewportSize({ width, height: 420 });
            await page.locator('#name').focus();
            await page.locator('#name').scrollIntoViewIfNeeded();
            const field = await page.locator('#name').boundingBox();
            const action = await page.locator('#next').boundingBox();
            assert.ok(field.y + field.height <= Math.min(420, action.y), 'name remains above the action with keyboard-size viewport');
            await page.setViewportSize({ width, height });
          }
        }
        await audit(key);
        if (height < 500 && key === 'budget') await page.screenshot({ path: `.cache/ux-${engine}-landscape-budget.png`, fullPage: true });
        await page.locator('#next').click();
      }
      await page.locator('#summary-details summary').click();
      await audit('result with long name and expanded answers');
      const link = new URL(await page.locator('#whatsapp-link').getAttribute('href'));
      assert.equal(link.hostname, 'wa.me');
      assert.equal(link.searchParams.get('text'), await page.locator('#message').inputValue());
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(`docs/validacao-ux-${engine}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ engine, states: report.states.length, errors: report.errors, status: 'passed' }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
