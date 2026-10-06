// Clicks through the full eight-order shift on all four record branches with
// real pointer input on the canvas. The game clock runs fast; production input
// and rendering paths are unchanged.
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, artifacts, URL_BASE, idle, click, playOrder } = require('./browser-helpers.cjs');

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
    // Narrow portrait viewport: the scene fits without page overflow; the phone opens,
    // pauses the shift, sets silent mode and a level, and is put away.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_BASE + '?seed=browser-check');
    assert.equal(await page.evaluate(() => NSF.debug.seed), 'browser-check');
    await page.screenshot({ path: path.join(artifacts, 'mobile-title.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await click(page, 'ui:start');
    await page.evaluate(() => { NSF.debug.time.speed = 12; });

    // Every synthesised sound runs against a real AudioContext without throwing.
    const failures = await page.evaluate(() => {
      const a = NSF.audio, failed = [];
      const calls = [['scan'], ['payment', 'card'], ['anomaly'], ['cashPaper'], ['cashDrawer'], ['microwaveStart'],
        ['microwaveDone'], ['receipt'], ['bag'], ['dialogueTick', 'a'], ['radioTune'], ['radioVoice', 800, true], ['radioStation', '87.7']];
      for (const [name, ...args] of calls) {
        try { a[name](...args); } catch (error) { failed.push(name + ': ' + error.message); }
      }
      a.radioStation('87.6');
      return failed;
    });
    assert.deepEqual(failures, []);

    // An action that throws mid-animation hands control back instead of locking the counter.
    const item = await page.evaluate(() => NSF.debug.game.order().items[0].id);
    await idle(page);
    await page.evaluate(() => {
      const original = NSF.audio.scan;
      NSF.audio.scan = () => { NSF.audio.scan = original; throw new Error('injected test failure'); };
    });
    await click(page, 'item:' + item);
    await click(page, 'scanner');
    await idle(page);
    assert.equal(await page.evaluate(id => NSF.debug.game.state.scannedIds.includes(id), item), false);
    await click(page, 'item:' + item);
    await click(page, 'scanner');
    await idle(page);
    assert.equal(await page.evaluate(id => NSF.debug.game.state.scannedIds.includes(id), item), true);

    await click(page, 'phone');
    await page.waitForFunction(() => NSF.debug.time.paused && NSF.phone.frame() === 2);
    const frozen = await page.evaluate(() => NSF.debug.time.now);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => NSF.debug.time.now), frozen);
    await click(page, 'ui:phone-silent');
    assert.equal(await page.evaluate(() => NSF.audio.muted), true);
    await click(page, 'ui:phone-radio-2');
    assert.equal(await page.evaluate(() => NSF.audio.level('radio')), 2);
    await click(page, 'ui:phone-softR');
    await page.waitForFunction(() => !NSF.phone.view.open);
    assert.equal(await page.evaluate(() => NSF.debug.time.paused), false);
    assert.deepEqual(errors, []);
    await page.close();
    console.log('PASS: four record branches, report, ending, audio smoke, failure recovery, seed, narrow viewport.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
