const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QUIZ_BASE_URL || 'http://127.0.0.1:3002';
const axePath = process.env.AXE_PATH || require.resolve('axe-core/axe.min.js');
fs.mkdirSync('.cache', { recursive: true });
fs.mkdirSync('docs', { recursive: true });
const report = { date: new Date().toISOString(), viewports: [], accessibility: [], errors: [], failedResources: [], canceledRequests: [], outboundRequests: [], screenshots: [] };
const pathChoices = [['project','cover'],['theme','other'],['finish','blackgray'],['references','ready'],['placement','other'],['size','big'],['budget','1000to1999'],['timing','months'],['location','other'],['availability','saturday']];
const otherNotes = { theme: ['themeNote', 'Homenagem ao avô & família'], placement: ['placementNote','Ombro esquerdo'], location: ['cityNote', 'São José / SC'] };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 1000 : 844 }, isMobile: width < 768, hasTouch: width < 768, reducedMotion: 'reduce' });
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin === base) return route.continue();
        report.outboundRequests.push(route.request().url());
        return route.abort();
      });
      await context.addInitScript(() => {
        // Keep synthetic test answers out of the host computer's clipboard.
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedText = text; } } });
        document.addEventListener('click', event => {
          const a = event.target.closest?.('a[href]');
          if (a && new URL(a.href).hostname === 'wa.me') { event.preventDefault(); window.__capturedWhatsApp = a.href; }
        }, true);
      });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) report.failedResources.push({ url: response.url(), status: response.status() }); });
      page.on('requestfailed', request => {
        const failure = { url: request.url(), reason: request.failure()?.errorText };
        // Chrome cancels pending lazy images when their section disappears or the test closes.
        // Keep those cancellations visible in the report, separate from failed resources.
        (failure.reason === 'net::ERR_ABORTED' ? report.canceledRequests : report.failedResources).push(failure);
      });
      async function layout(label) {
        const issues = await page.evaluate(async () => {
          await document.fonts.ready;
          const problems = [];
          if (document.documentElement.scrollWidth > innerWidth) problems.push('page overflow');
          for (const el of document.querySelectorAll('button,.button,.choice-face,summary')) {
            if (!el.getClientRects().length) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) problems.push('small target: ' + el.textContent.trim());
            if (el.scrollWidth > el.clientWidth + 2) problems.push('text overflow: ' + el.textContent.trim());
          }
          return problems;
        });
        assert.deepEqual(issues, [], width + ': ' + label);
      }
      async function accessibility(label) {
        if (![390, 1440].includes(width)) return;
        if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ path: axePath });
        const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
        report.accessibility.push({ width, label, violations: result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) });
        assert.deepEqual(result.violations.map(v => v.id), [], width + ': accessibility ' + label);
      }
      async function screenshot(name) {
        if (![390, 1440].includes(width)) return;
        const path = '.cache/quiz-' + width + '-' + name + '.png';
        await page.screenshot({ path, fullPage: true }); report.screenshots.push(path);
      }
      const response = await page.goto(base + '/quiz', { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/);
      assert.deepEqual(await page.locator('script[src]').evaluateAll(scripts => scripts.map(s => new URL(s.src).pathname)), ['/quiz/meta-pixel.js', '/quiz/quiz.js']);
      assert.equal(await page.locator('.motion-control,#mobileMenu,.brand-pattern').count(), 0, 'standalone document');
      assert.equal(await page.locator('.project-group').first().locator('button').count(), 6, 'six original project photographs');
      assert.equal(await page.locator('#background-toggle,#gallery-toggle').count(), 0, 'no pause controls');
      await layout('intro'); await accessibility('intro'); await screenshot('intro');
      assert.equal(await page.locator('.project-photo img').first().evaluate(img => getComputedStyle(img).objectFit), 'contain');
      await page.locator('.project-group').first().locator('img').evaluateAll(async images => {
        await Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); }));
      });
      await page.locator('#gallery-open').click();
      assert.equal(await page.locator('#project-dialog').evaluate(el => el.open), true);
      assert.equal(await page.locator('#dialog-image').evaluate(el => getComputedStyle(el).objectFit), 'contain');
      for (let i = 0; i < 6; i++) {
        assert.equal(await page.locator('#dialog-count').innerText(), (i + 1) + ' / 6');
        await page.locator('#dialog-image').evaluate(img => img.decode());
        await page.locator('#dialog-next').click();
      }
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#dialog-count').innerText(), '6 / 6');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.querySelector('#project-dialog').contains(document.activeElement)), true);
      await layout('gallery dialog'); await accessibility('gallery dialog'); await screenshot('gallery');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#project-dialog').evaluate(el => el.open), false);
      assert.equal(await page.locator('#gallery-open').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      await page.locator('[data-start]').first().click();
      assert.equal(await page.locator('#quiz').isVisible(), true);
      assert.equal(await page.locator('#question-title').evaluate(el => el === document.activeElement), true);
      await page.locator('#next').click();
      assert.match(await page.locator('#form-error').innerText(), /Escolha/);
      assert.equal(await page.locator('input[name=project]').first().evaluate(el => el === document.activeElement), true);
      if (width < 768) {
        await page.locator('.mobile-inspiration').click();
        await page.locator('#dialog-close').click();
        assert.equal(await page.locator('.mobile-inspiration').evaluate(el => el === document.activeElement), true);
      }
      for (const [key, value] of pathChoices) {
        assert.equal(await page.locator('body').getAttribute('data-step'), key);
        await page.locator('input[name="' + key + '"][value="' + value + '"]').check();
        if (otherNotes[key]) await page.locator('#' + otherNotes[key][0]).fill(otherNotes[key][1]);
        await layout(key);
        if (['project','theme','budget'].includes(key)) { await accessibility(key); await screenshot(key); }
        await page.locator('#next').click();
      }
      await page.locator('#next').click();
      assert.match(await page.locator('#form-error').innerText(), /nome/);
      await page.locator('#name').fill('  João da Silva  ');
      await page.locator('.optional-details summary').click();
      await page.locator('#notes').fill('Relógio às 12:30. Símbolos: + & ? # ♥ <3');
      await layout('details'); await accessibility('details'); await screenshot('details');
      await page.locator('#next').click();
      assert.equal(await page.locator('#result').isVisible(), true);
      const message = await page.locator('#message').inputValue();
      for (const value of ['João da Silva','São José / SC','Homenagem ao avô & família','Ombro esquerdo','Mais de 20 cm','Nos próximos meses','Tenho imagens para enviar','De R$ 1.000 a R$ 1.999','Prefiro sábado','Sim, em preto e cinza','+ & ? # ♥ <3']) assert.ok(message.includes(value), value);
      const target = new URL(await page.locator('#whatsapp-link').getAttribute('href'));
      assert.equal(target.pathname, '/5547996615555'); assert.equal(target.searchParams.get('text'), message);
      assert.equal(await page.locator('#summary-details').evaluate(el => el.open), false);
      await layout('result'); await accessibility('result'); await screenshot('result');
      await page.locator('#summary-details summary').click();
      assert.ok((await page.locator('#answer-summary').innerText()).includes('Investimento em mente'));
      await layout('expanded summary');
      await page.locator('#copy-message').click();
      assert.equal(await page.evaluate(() => window.__copiedText), message);
      if (width === 1440) {
        await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); }; });
        await page.locator('#copy-message').click();
        assert.equal(await page.locator('#message').evaluate(el => el.selectionEnd - el.selectionStart), message.length, 'fallback selects the message');
      }
      await page.locator('#message').fill('  ');
      assert.equal(await page.locator('#whatsapp-link').getAttribute('href'), null);
      await page.locator('#message').fill('Olá, Gabriel! Texto que revisei: café & arte.');
      await page.locator('#whatsapp-link').click();
      assert.equal(new URL(await page.evaluate(() => window.__capturedWhatsApp)).searchParams.get('text'), 'Olá, Gabriel! Texto que revisei: café & arte.');
      await page.locator('#edit-answers').click();
      await page.locator('input[value=first]').check();
      await page.locator('#back').click();
      assert.equal(await page.locator('#intro').isVisible(), true);
      await page.locator('[data-start]').first().click();
      assert.equal(await page.locator('input[value=first]').isChecked(), true);
      await page.locator('#next').click();
      assert.equal(await page.locator('#themeNote').inputValue(), otherNotes.theme[1]);
      await page.locator('input[value=animal]').check();
      assert.equal(await page.locator('#themeNote').isDisabled(), true);
      await page.locator('#next').click();
      for (const [key] of pathChoices.slice(2)) {
        if (key === 'placement') await page.locator('input[value=arm]').check();
        if (key === 'location') await page.locator('input[value=itapema]').check();
        assert.equal(await page.locator('body').getAttribute('data-step'), key);
        await page.locator('#next').click();
      }
      await page.locator('#next').click();
      const updated = await page.locator('#message').inputValue();
      for (const value of ['minha primeira tatuagem','Animais','Braço','Itapema']) assert.ok(updated.includes(value));
      for (const [, note] of Object.values(otherNotes)) assert.ok(!updated.includes(note), 'stale note removed');
      report.viewports.push({ width, flow: 'passed', choices: 10, gallery: 'passed', keyboard: 'passed', editing: 'passed', whatsapp: 'passed', layout: 'passed' });
      await context.close();
    }
    // A full flow with no typing except the name, plus normal-motion behavior.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(base + '/quiz');
    await page.locator('[data-start]').first().click();
    for (const [key] of pathChoices) {
      await page.locator('input[name="' + key + '"]').first().check();
      await page.locator('#next').click();
    }
    await page.locator('#name').fill('Ana');
    await page.locator('#next').click();
    assert.equal(await page.locator('#result').isVisible(), true);
    report.selectionOnlyFlow = 'passed; only name typed';
    await context.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await nojs.newPage(); await fallback.goto(base + '/quiz');
    assert.equal(await fallback.locator('.no-script').isVisible(), true);
    assert.match(await fallback.locator('.no-script a').getAttribute('href'), /wa.me\/5547996615555/);
    await nojs.close();
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedResources, []);
    assert.deepEqual(report.outboundRequests, []);
    fs.writeFileSync('docs/validacao-quiz-local.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ viewports: report.viewports, accessibilityStates: report.accessibility.length, errors: report.errors, failedResources: report.failedResources, outboundRequests: report.outboundRequests, selectionOnlyFlow: report.selectionOnlyFlow }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); fs.writeFileSync('.cache/quiz-test-failure.json', JSON.stringify(report, null, 2)); process.exitCode = 1; });
