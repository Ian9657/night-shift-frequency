const assert = require('node:assert/strict');
const { chromium, URL_BASE, signIn, idle, click } = require('./browser-helpers.cjs');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(URL_BASE + '?seed=interaction');
    await page.evaluate(() => { NSF.time.speed = 4; });
    await signIn(page, 'JO');
    await idle(page);
    await click(page, 'bags');
    assert.equal(await page.evaluate(() => NSF.game.state.feedback.kind), 'payFirst');
    await page.evaluate(() => {
      const g = NSF.game;
      g.state.busy = true;
      g.activate('scanner'); g.activate('scanner');
      g.state.busy = false;
      NSF.phone.open();
      g.update();
    });
    assert.equal(await page.evaluate(() => NSF.game.state.queuedActions.length), 1);
    assert.equal(await page.evaluate(() => NSF.game.state.scannedIds.length), 0);
    await page.evaluate(() => NSF.phone.close());
    await page.waitForFunction(() => NSF.game.state.scannedIds.length === 1 && !NSF.game.state.busy);
    assert.equal(await page.evaluate(() => NSF.game.state.queuedActions.length), 0);
    await page.evaluate(() => {
      const g = NSF.game;
      g.state.queuedActions.push({name: 'bags', eventIndex: g.state.eventIndex - 1});
      g.update();
    });
    assert.equal(await page.evaluate(() => NSF.game.state.queuedActions.length), 0);
    await page.evaluate(() => {
      const g = NSF.game;
      g.state.queuedActions.push({name: 'bags', eventIndex: g.state.eventIndex});
      g.update();
    });
    assert.equal(await page.evaluate(() => NSF.game.state.feedback.kind), 'stale');
    assert.equal(await page.evaluate(() => NSF.game.state.bagged), false);
    console.log('PASS: premature bagging reason, queue deduplication, modal pause, automatic scan, stale order and invalid queued action.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
