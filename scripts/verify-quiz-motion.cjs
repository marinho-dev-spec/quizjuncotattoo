const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QUIZ_BASE_URL || 'http://127.0.0.1:3002';
fs.mkdirSync('.cache', { recursive: true });
fs.mkdirSync('docs', { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const report = { date: new Date().toISOString(), checks: [], errors: [] };
  try {
    for (const width of [390,1440]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 768, hasTouch: width < 768, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      await page.goto(base + '/quiz', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.brand > span').count(), 0);
      assert.ok((await page.locator('.brand img').boundingBox()).width >= 96);
      assert.equal(await page.locator('#studio-atmosphere .tattoo-particle').count(), 28);
      assert.equal(await page.locator('.tattoo-engraving').count(), 0);
      const rain = await page.locator('.tattoo-particle').evaluateAll(elements => elements.map(el => ({
        visible: getComputedStyle(el).display !== 'none',
        icon: el.querySelector('use').getAttribute('href'),
        width: el.getBoundingClientRect().width
      })));
      assert.equal(rain.filter(item => item.visible).length, width < 761 ? 18 : 28);
      assert.equal(new Set(rain.map(item => item.icon)).size, 4, 'four tattoo motifs in the rainfall');
      assert.ok(rain.every(item => item.width < 62), 'small symbols replace the large engravings');
      assert.equal(await page.locator('#background-toggle,#gallery-toggle').count(), 0);
      assert.equal(await page.locator('#studio-atmosphere').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      const particle = page.locator('#studio-atmosphere span').first();
      const before = await particle.evaluate(el => getComputedStyle(el).transform);
      const yBefore = await particle.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
      await page.waitForTimeout(200);
      assert.notEqual(await particle.evaluate(el => getComputedStyle(el).transform), before);
      assert.ok(await particle.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42) > yBefore, 'symbols fall down like rain');
      await page.screenshot({ path: '.cache/quiz-motion-' + width + '-intro.png', fullPage: true });
      await page.locator('#project-viewport').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.project-gallery').dataset.offscreen === 'false');
      const track = page.locator('#project-track');
      const initial = await track.evaluate(el => getComputedStyle(el).transform);
      await page.waitForTimeout(700);
      const next = await track.evaluate(el => getComputedStyle(el).transform);
      assert.notEqual(next, initial, 'continuous horizontal movement');
      assert.equal(await track.evaluate(el => getComputedStyle(el).animationTimingFunction), 'linear');
      const geometry = await page.locator('.project-photo img').first().evaluate(img => {
        const rect = img.getBoundingClientRect();
        return { ratio: rect.width / rect.height, natural: img.naturalWidth / img.naturalHeight, fit: getComputedStyle(img).objectFit, transform: getComputedStyle(img).transform, width: rect.width, viewport: document.querySelector('#project-viewport').clientWidth };
      });
      assert.equal(geometry.fit, 'contain');
      assert.equal(geometry.transform, 'none');
      assert.ok(Math.abs(geometry.ratio - geometry.natural) < .001, 'full original photo proportions');
      assert.ok(geometry.width < geometry.viewport, 'each photograph fits fully inside the strip');
      await page.locator('#project-viewport').hover();
      const onHover = await track.evaluate(el => getComputedStyle(el).transform);
      await page.waitForTimeout(400);
      assert.notEqual(await track.evaluate(el => getComputedStyle(el).transform), onHover, 'hover never pauses the strip');
      await page.screenshot({ path: '.cache/quiz-motion-' + width + '-carousel.png', fullPage: true });
      // Seeking the animation verifies the seamless join without waiting 68 seconds.
      await track.evaluate(el => { el.getAnimations()[0].currentTime = 67950; });
      const joinBefore = await track.evaluate(el => {
        const rect = el.querySelectorAll('.project-group')[1].getBoundingClientRect();
        return rect.left - document.querySelector('#project-viewport').getBoundingClientRect().left;
      });
      await page.waitForTimeout(150);
      const joinAfter = await track.evaluate(el => {
        const rect = el.querySelector('.project-group').getBoundingClientRect();
        return rect.left - document.querySelector('#project-viewport').getBoundingClientRect().left;
      });
      assert.ok(Math.abs(joinBefore - joinAfter) < 18, 'loop has no jump between duplicate and original');
      await page.locator('#gallery-open').click();
      assert.equal(await page.locator('#project-dialog').evaluate(el => el.open), true);
      assert.equal(await page.locator('#dialog-image').evaluate(el => getComputedStyle(el).objectFit), 'contain');
      assert.equal(await page.locator('#studio-atmosphere').getAttribute('data-paused'), 'false', 'background remains automatic');
      await page.locator('#dialog-close').click();
      await page.locator('.project-photo').first().click({ force: true });
      assert.equal(await page.locator('#dialog-count').innerText(), '1 / 6', 'tap on an actual project opens that photo');
      await page.locator('#dialog-close').click();
      await page.locator('[data-start]').first().click();
      assert.equal(await page.locator('#quiz').isVisible(), true);
      assert.equal(await page.locator('#studio-atmosphere').getAttribute('data-paused'), 'false');
      await page.waitForTimeout(450);
      await page.screenshot({ path: '.cache/quiz-motion-' + width + '-question.png', fullPage: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await particle.evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.locator('#studio-atmosphere').isVisible(), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      report.checks.push({ width, continuousStrip: 'passed', fullPhotos: 'passed', seamlessLoop: 'passed', noPauseControls: 'passed', hoverKeepsMoving: 'passed', tattooRain: 'passed', smallSymbols: 'passed', reducedMotion: 'passed', modal: 'passed', quiz: 'passed' });
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    fs.writeFileSync('docs/validacao-quiz-motion.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
