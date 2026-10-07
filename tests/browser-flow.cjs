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
      const listening = name === 'keep-independent';
      for (let i = 0; i < 8; i++) {
        if (listening && i === 3) {
          // Listen to all three frequencies between the stations, then back to Night Ferry.
          await click(page, 'radio');
          for (const freq of [8785, 8795, 8805]) {
            await page.evaluate(f => NSF.debug.radio.setFrequency(f), freq);
            await page.waitForFunction(() => NSF.debug.radio.view.kind === 'signal' && NSF.debug.radio.view.key && NSF.debug.radio.view.key !== 'radio.static', null, { timeout: 15000 });
          }
          await page.evaluate(() => NSF.debug.radio.tune('87.6'));
          await click(page, 'ui:dial-close');
          assert.deepEqual(await page.evaluate(() => ['walt', 'ana', 'hal'].map(NSF.company.heard)), [true, true, true]);
        }
        if (texting && i === 5) {
          // The lines are open: call in and say hello; June answers, and thanks the clerk at the end.
          await idle(page);
          await click(page, 'phone');
          await page.waitForFunction(() => NSF.phone.frame() === 2);
          await click(page, 'ui:phone-row-call');
          await click(page, 'ui:phone-row-call');
          await click(page, 'ui:phone-say-hello');                 // the first row is already selected
          assert.equal(await page.evaluate(() => NSF.debug.messages.call.preset.id), 'hello');
          await click(page, 'ui:phone-away');
          await page.waitForFunction(() => !NSF.phone.view.open);
          await page.waitForFunction(() => NSF.debug.radio.view.key === 'radio.replyHello', null, { timeout: 30000 });
        }
        if (listening && i === 5) {
          // The person who stayed knows the clerk was listening.
          await page.waitForFunction(() => NSF.debug.dialogue.fullText(), null, { timeout: 15000 });
          const said = await page.evaluate(() => ({ line: NSF.debug.dialogue.fullText(), who: NSF.debug.game.order().customer }));
          assert.equal(said.line, await page.evaluate(w => NSF.strings.t(NSF.story.tonight.stayed[w]), said.who));
        }
        const order = await playOrder(page, [first, last], name).catch(async error => {
          await page.screenshot({ path: path.join(artifacts, `${name}-failure.png`) });
          console.error(await page.evaluate(() => JSON.stringify({ state: NSF.debug.game.state, extras: NSF.debug.game.scene.extras,
            dialogue: NSF.debug.dialogue.fullText(), locked: NSF.debug.dialogue.locked })));
          throw error;
        });
        if (i === 6) await page.screenshot({ path: path.join(artifacts, `${name}-counter.png`) });
        if (order.final) break;
      }
      // Lost and found: both boots, and something from each of the two who stayed.
      await click(page, 'lostFound');
      const box = await page.evaluate(() => ({ paused: NSF.debug.time.paused, items: NSF.found.items().map(i => i.id) }));
      assert.equal(box.paused, true);
      assert.equal(box.items.length, 4);
      assert.ok(box.items.includes('boot') && box.items.includes('bootRight'));
      if (name === 'keep-linked') await page.screenshot({ path: path.join(artifacts, 'lost-found.png') });
      await click(page, 'ui:found-away');
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
      // June thanks the clerk by name before signing off only if they texted or called.
      assert.equal(await page.evaluate(() => NSF.debug.messages.thanks('X').length), texting ? 1 : 0);
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
        ['pen'], ['stamp'], ['carPass', true], ['clockSkip'], ['tubeFlicker'], ['phoneBuzz'], ['phoneSent'], ['doorChime'], ['gulls'], ['playSong', NSF.story.radio.songs.slowTide], ['stopSong'], ['boxDrop']];
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
