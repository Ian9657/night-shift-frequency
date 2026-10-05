const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const artifacts = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
  for (const first of ['keep', 'correct']) for (const last of ['linked', 'independent']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../greybox.html')).href + '?seed=browser-check');
    // Accelerate timers/animations, keeping the production action and DOM handlers intact.
    await page.evaluate(() => {
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => timeout(fn, ms / 15, ...args);
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        animation.playbackRate = 15;
        return animation;
      };
    });
    await page.click('[data-start-shift]');
    assert.equal(await page.locator('.register-toolbar, [data-shift-progress]').count(), 0);
    assert.ok(await page.evaluate(() => Math.abs(document.querySelector('.game-shell').getBoundingClientRect().height - innerHeight) < 1));
    const ready = () => page.waitForFunction(() => !state.busy && !dialogueLocked, { timeout: 15000 });
    for (let index = 0; index < 8; index++) {
      await page.waitForFunction(i => state.eventIndex === i, index);
      await ready();
      const order = await page.evaluate(() => JSON.parse(JSON.stringify(currentEvent())));
      if (index === 0) {
        await page.click('[data-review-sale]');
        assert.equal(await page.locator('[data-review-choices] input').count(), 0);
        await page.keyboard.press('Escape');
        assert.ok(await page.locator('[data-review-sale]').evaluate(node => node === document.activeElement));
        await page.keyboard.press('Enter');
        assert.ok(await page.evaluate(() => registerReview.open));
        await page.click('[data-review-rescan]');
      }
      console.log('Playing', first, last, order.id);
      for (const item of order.items) {
        await ready();
        const hitPoint = await page.waitForFunction(itemId => {
          const node = document.querySelector(`[data-item-id="${itemId}"]`);
          if (!node) return false;
          const r = node.getBoundingClientRect();
          for (const y of [.3, .5, .7, .15, .85]) for (const x of [.5, .3, .7, .15, .85]) {
            const px = r.x + r.width * x, py = r.y + r.height * y;
            const hit = document.elementFromPoint(px, py);
            if (hit === node || node.contains(hit)) return { x: px, y: py };
          }
          return false;
        }, item.id, { timeout: 15000 });
        const point = await hitPoint.jsonValue();
        await hitPoint.dispose();
        await page.mouse.click(point.x, point.y);
        await page.click('[data-action="scan"]');
        await ready();
      }
      if (order.mismatch) {
        await page.click('[data-review-sale]');
        assert.equal(await page.locator('[data-submit-record]').isEnabled(), false);
        assert.equal(await page.locator('[data-review-choices] input').count(), 0);
        assert.equal(await page.locator('[data-review-preview]').isVisible(), false);
        assert.ok((await page.locator('[data-review-body]').innerText()).includes('RETURN TO COUNTER TO RE-SCAN'));
        if (index === 4) {
          assert.equal(await page.locator('[data-review-body] details').count(), 0);
          await page.screenshot({path:path.join(artifacts, first + '-' + last + '-pending.png')});
        }
        await page.click('[data-review-rescan]');
        assert.equal(await page.evaluate(() => registerReview.open), false);
        assert.equal(await page.evaluate(() => shiftState.checks.filter(c => c.orderId === currentEvent().id).length), 0);
        await page.click('[data-item-id="cola"]');
        await page.click('[data-action="scan"]');
        await ready();
        await page.click('[data-review-sale]');
        await page.waitForFunction(() => registerReview.open);
        assert.equal(await page.locator('[data-review-choices] input').count(), 2);
        assert.equal(await page.locator('[data-review-preview]').isVisible(), false);
        await page.locator(`input[value="${index === 4 ? first : last}"]`).check();
        if (index === 7) {
          await page.screenshot({ path: path.join(artifacts, `${first}-${last}-choices.png`) });
          await page.setViewportSize({ width: 390, height: 844 });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await page.screenshot({ path: path.join(artifacts, `${first}-${last}-choices-mobile.png`) });
          assert.ok(await page.locator('[data-register-review]').evaluate(node => node.scrollWidth <= node.clientWidth));
          await page.setViewportSize({ width: 1440, height: 1000 });
        }
        await page.click('[data-submit-record]');
        await page.waitForFunction(() => Boolean(shiftState.decisionFor(currentEvent().id)));
        assert.equal(await page.evaluate(() => currentEvent().items[0].pos), 'SPARE KEY');
        if (index === 7) {
          await page.click('[data-review-sale]');
          const evidence = await page.locator('[data-review-body]').innerText();
          assert.ok(evidence.includes('REGISTER\nSPARE KEY'));
          assert.ok(evidence.includes('SAVED ENTRY'));
          await page.screenshot({ path: path.join(artifacts, `${first}-${last}-review.png`) });
          await page.click('[data-close-review]');
        }
      }
      await ready();
      await page.click(order.paymentType === 'cash' ? '.coin-tray' : '[data-action="pay"]');
      if (order.bagPreference === 'no') continue;
      await ready();
      if (order.requiresHeat) {
        await page.click('.microwave');
        await ready();
      }
      await page.click('[data-action="bag"]');
      if (index === 7) {
        await ready();
        await page.click('[data-action="report"]');
      }
    }
    await page.waitForFunction(() => state.reportShown);
    const report = await page.evaluate(() => shiftState.report());
    assert.equal(report.orders, 8);
    assert.equal(report.overrides, first === 'correct' ? 1 : 0);
    assert.equal(report.links, last === 'linked' ? 1 : 0);
    assert.deepEqual(errors, []);
    assert.equal(await page.locator('img').evaluateAll(nodes => nodes.filter(n => !n.complete || n.naturalWidth === 0).length), 0);
    await page.screenshot({ path: path.join(artifacts, `${first}-${last}-report.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('[data-review-sale]');
    await page.screenshot({ path: path.join(artifacts, `${first}-${last}-mobile.png`) });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log('PASS browser', first, last, report);
    await page.close();
  }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
