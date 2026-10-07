// Clicks through the full eight-order shift on all four record branches with
// real pointer input on the canvas. The game clock runs fast; production input
// and rendering paths are unchanged.
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, artifacts, URL_BASE, idle, click, playOrder, signIn, signOut } = require('./browser-helpers.cjs');

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
      await signIn(page, first === 'keep' ? 'JO' : '');
      assert.equal(await page.evaluate(() => NSF.debug.signin.name), first === 'keep' ? 'JO' : 'ROBIN');
      const texting = name === 'keep-linked';
      if (texting) {
        // One text to Night Ferry: menu → TEXT NIGHT FERRY → pick ANYONE UP? → send.
        await click(page, 'phone');
        await page.waitForFunction(() => NSF.phone.frame() === 2);
        await click(page, 'ui:phone-row-compose');
        await click(page, 'ui:phone-row-compose');
        await click(page, 'ui:phone-send-anyone');
        await click(page, 'ui:phone-send-anyone');
        assert.equal(await page.evaluate(() => NSF.debug.messages.sent.preset.id), 'anyone');
        await click(page, 'ui:phone-away');
        await page.waitForFunction(() => !NSF.phone.view.open);
      }
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
      await signOut(page, path.join(artifacts, `${name}-clockout.png`));
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
      // Texts arrive through the night; a sent one is read on air and answered.
      const inbox = await page.evaluate(() => NSF.debug.messages.inbox().map(m => m.id).sort().join());
      assert.equal(inbox, texting ? 'ferry,heard,home,light' : 'ferry,home,light');
      if (texting) assert.equal(await page.evaluate(() => NSF.debug.messages.sent.readOnAir), 1);
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
    await signIn(page);
    await page.evaluate(() => { NSF.debug.time.speed = 12; });

    // Every synthesised sound runs against a real AudioContext without throwing.
    const failures = await page.evaluate(() => {
      const a = NSF.audio, failed = [];
      const calls = [['scan'], ['payment', 'card'], ['anomaly'], ['cashPaper'], ['cashDrawer'], ['microwaveStart'],
        ['microwaveDone'], ['receipt'], ['bag'], ['dialogueTick', 'a'], ['radioTune'], ['radioVoice', 800, true], ['radioStation', 'echo'],
        ['pen'], ['stamp'], ['carPass', true], ['clockSkip'], ['tubeFlicker'], ['phoneBuzz'], ['phoneSent']];
      for (const [name, ...args] of calls) {
        try { a[name](...args); } catch (error) { failed.push(name + ': ' + error.message); }
      }
      a.radioStation('ferry');
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
    await click(page, 'basket');
    await idle(page);
    await click(page, 'scanner');
    await idle(page);
    assert.equal(await page.evaluate(id => NSF.debug.game.state.scannedIds.includes(id), item), false);
    await click(page, 'item:' + item);
    await click(page, 'scanner');
    await idle(page);
    assert.equal(await page.evaluate(id => NSF.debug.game.state.scannedIds.includes(id), item), true);

    // The radio's dial: dragging the needle along the scale tunes it, step keys move it
    // by 0.05, Night Ferry's line is replayed on tuning back.
    await click(page, 'radio');
    const scale = await page.evaluate(() => {
      const d = NSF.debug.targets()['ui:dial'], c = document.querySelector('canvas').getBoundingClientRect();
      return { x: d.x, y: d.y, w: c.width * 324 / 960 };
    });
    await page.mouse.move(scale.x, scale.y);
    await page.mouse.down();
    await page.mouse.move(scale.x + scale.w * 0.5, scale.y, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => NSF.debug.radio.view.freq), 8810);
    await click(page, 'ui:dial-down');
    assert.equal(await page.evaluate(() => NSF.debug.radio.view.station), '88.05');
    await page.evaluate(() => NSF.debug.radio.tune('87.6'));
    assert.equal(await page.evaluate(() => NSF.debug.radio.view.kind), 'ferry');
    await click(page, 'ui:dial-close');

    await click(page, 'phone');
    await page.waitForFunction(() => NSF.debug.time.paused && NSF.phone.frame() === 2);
    const frozen = await page.evaluate(() => NSF.debug.time.now);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => NSF.debug.time.now), frozen);
    await click(page, 'ui:phone-row-settings');
    await click(page, 'ui:phone-row-settings');
    await click(page, 'ui:phone-silent');
    assert.equal(await page.evaluate(() => NSF.audio.muted), true);
    await click(page, 'ui:phone-radio-2');
    assert.equal(await page.evaluate(() => NSF.audio.level('radio')), 2);
    await click(page, 'ui:phone-softR');
    assert.equal(await page.evaluate(() => NSF.phone.view.screen), 'home');
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
