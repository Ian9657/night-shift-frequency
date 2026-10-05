// Clicks through the full eight-order shift on all four record branches with
// real pointer input on the canvas. The game clock runs fast; production input
// and rendering paths are unchanged.
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, artifacts, URL_BASE, click, playOrder } = require('./browser-helpers.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const first of ['keep', 'correct']) for (const last of ['linked', 'independent']) {
      const name = `${first}-${last}`;
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(URL_BASE + '?seed=browser-check');
      await page.evaluate(() => { NSF.debug.time.speed = 12; });
      await click(page, 'ui:start');
      for (let i = 0; i < 8; i++) {
        const order = await playOrder(page, [first, last], name).catch(async error => {
          await page.screenshot({ path: path.join(artifacts, `${name}-failure.png`) });
          console.error(await page.evaluate(() => JSON.stringify({ state: NSF.debug.game.state, extras: NSF.debug.game.scene.extras,
            dialogue: NSF.debug.dialogue.fullText(), locked: NSF.debug.dialogue.locked })));
          throw error;
        });
        if (i === 6) await page.screenshot({ path: path.join(artifacts, `${name}-counter.png`) });
        if (order.final) break;
      }
      await click(page, 'printer');
      await page.waitForFunction(() => NSF.debug.game.state.phase === 'report');
      await page.screenshot({ path: path.join(artifacts, `${name}-report.png`) });
      await click(page, 'ui:report');
      await page.waitForFunction(() => NSF.debug.game.state.phase === 'end', null, { timeout: 60000 });
      await page.screenshot({ path: path.join(artifacts, `${name}-end.png`) });
      const result = await page.evaluate(() => ({
        ending: NSF.debug.game.shift.ending(), report: NSF.debug.game.shift.report(),
        transactions: NSF.debug.game.shift.transactions.length, overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.equal(result.ending, name);
      assert.equal(result.transactions, 8);
      assert.equal(result.report.overrides, first === 'correct' ? 1 : 0);
      assert.equal(result.report.links, last === 'linked' ? 1 : 0);
      assert.equal(result.overflow, false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log('path ok:', name);
    }
    // Narrow portrait viewport: the scene fits without page overflow; sound toggles.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(URL_BASE + '?seed=browser-check');
    await click(page, 'ui:sound');
    assert.equal(await page.evaluate(() => NSF.audio.muted), true);
    await page.screenshot({ path: path.join(artifacts, 'mobile-title.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.close();
    console.log('PASS: four record branches, report, ending, sound toggle, narrow viewport.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
