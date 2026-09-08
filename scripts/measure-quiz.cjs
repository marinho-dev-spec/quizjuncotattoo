const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.QUIZ_BASE_URL || 'http://127.0.0.1:3002';
const label = process.argv[2] || 'after';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const report = { date: new Date().toISOString(), environment: 'Local Chromium, cold cache, 1.6 Mbps download, 150 ms latency, 4x CPU slowdown; laboratory measurements, not real-user Core Web Vitals.', runs: [] };
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: width === 390 ? 3 : 1, isMobile: width === 390, hasTouch: width === 390 });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(() => {
        window.auditPerf = { lcp: 0, cls: 0, blockingMs: 0 };
        new PerformanceObserver(list => { for (const e of list.getEntries()) { window.auditPerf.lcp = e.startTime; window.auditPerf.lcpElement = e.element?.tagName + '.' + e.element?.className; } }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.auditPerf.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => { for (const e of list.getEntries()) window.auditPerf.blockingMs += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
      });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({ ...window.auditPerf, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime, resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, bytes: r.encodedBodySize, duration: Math.round(r.duration) })) }));
      const frames = await page.evaluate(() => new Promise(resolve => {
        const deltas = []; let previous = performance.now(); const end = previous + 2000;
        function frame(now) { deltas.push(now - previous); previous = now; if (now < end) requestAnimationFrame(frame); else resolve({ frames: deltas.length, over50ms: deltas.filter(t => t > 50).length, p95ms: deltas.sort((a,b) => a-b)[Math.floor(deltas.length * .95)] }); }
        requestAnimationFrame(frame);
      }));
      report.runs.push({ width, ...metrics, transferBytes: metrics.resources.reduce((sum,r) => sum + r.bytes, 0), frames });
      await page.screenshot({ path: `.cache/audit-${label}-${width}-intro.png`, fullPage: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await page.locator('[data-start]').first().click();
      for (let step = 0; step < 11; step++) {
        const key = await page.locator('body').getAttribute('data-step');
        await page.screenshot({ path: `.cache/audit-${label}-${width}-${key}.png`, fullPage: true, animations: 'disabled' });
        if (step < 10) await page.locator('input[type=radio]').first().check();
        else await page.locator('#name').fill('Ana');
        await page.locator('#next').click();
      }
      await page.screenshot({ path: `.cache/audit-${label}-${width}-result.png`, fullPage: true, animations: 'disabled' });
      await context.close();
    }
    fs.writeFileSync(`docs/performance-${label}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
