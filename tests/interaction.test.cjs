const assert = require('node:assert/strict');
const { chromium, URL_BASE, signIn, idle, click } = require('./browser-helpers.cjs');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(URL_BASE + '?seed=interaction');
    await page.evaluate(() => { NSF.time.speed = 4; });
    await signIn(page, 'JO');
    await idle(page);
    const names = await page.evaluate(() => NSF.game.targets().map(t => t.name));
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), names[0]);
    await page.waitForTimeout(150);
    assert.deepEqual(errors, [], 'frames keep running with keyboard focus');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), names.at(-1));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), null);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), names.at(-1));
    await page.keyboard.press('Escape');
    for (let i = 0; i <= names.indexOf('phone'); i++) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => NSF.phone.view.open), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !NSF.phone.view.open);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => NSF.game.guidance()), 'take');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => NSF.ui.interactionAnnouncement(NSF.game).includes('MICROWAVE')), true);
    await page.keyboard.press('Escape');
    const touchTarget = await page.evaluate(() => NSF.debug.targets().basket);
    const touch = async (type, id, x, y) => page.evaluate(({ type, id, x, y }) => {
      const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id,
        pointerType: 'touch', clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 });
      document.querySelector('[data-game]').dispatchEvent(event);
    }, { type, id, x, y });
    const beforeHold = await page.evaluate(() => NSF.game.state.takenIds.length);
    await touch('pointerdown', 11, touchTarget.x, touchTarget.y);
    await page.waitForTimeout(180);
    await touch('pointerup', 11, touchTarget.x, touchTarget.y);
    assert.equal(await page.evaluate(() => NSF.game.state.takenIds.length), beforeHold, 'long press inspects without activating');
    await touch('pointerdown', 12, touchTarget.x, touchTarget.y);
    await touch('pointerup', 12, touchTarget.x, touchTarget.y);
    await page.waitForFunction(() => NSF.game.state.takenIds.length === 1 && !NSF.game.state.busy);
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
      g.state.feedback = null;                 // earlier steps' feedback may still be showing
      g.state.queuedActions.push({name: 'bags', eventIndex: g.state.eventIndex});
      g.update();
    });
    assert.equal(await page.evaluate(() => NSF.game.state.feedback), null, 'a stale queued click is dropped quietly');
    assert.equal(await page.evaluate(() => NSF.game.state.bagged), false);

    // The radio's dial is exclusive but live: the shift keeps running and lines advance.
    await page.evaluate(() => NSF.radio.openDial());
    const before = await page.evaluate(() => NSF.time.now);
    await page.evaluate(() => NSF.radio.setFrequency(8770));
    await page.waitForFunction(() => NSF.radio.view.key, null, { timeout: 5000 });
    assert.equal(await page.evaluate(() => NSF.time.paused), false);
    assert.ok(await page.evaluate(t => NSF.time.now > t, before));
    // A new order's segment does not silence another frequency.
    await page.evaluate(() => NSF.radio.beginOrder(['radio.o4']));
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => NSF.radio.view.key), 'the echo keeps playing across an order change');
    await page.evaluate(() => NSF.radio.closeDial());
    // The clerk's call survives the next order's segment: their words and June's reply
    // play before it.
    await page.evaluate(() => {
      NSF.radio.tune('87.6');
      NSF.radio.play([{ key: 'radio.caller', vars: { name: 'JO', said: '@call.hello' }, keep: true }, { key: 'radio.replyHello', vars: {}, keep: true }]);
      NSF.radio.beginOrder(['radio.o7']);
    });
    const heard = [];
    for (let i = 0; i < 400 && !heard.includes('radio.o7'); i++) {
      const key = await page.evaluate(() => NSF.radio.view.key);
      if (key && heard.at(-1) !== key) heard.push(key);
      await page.waitForTimeout(25);
    }
    assert.ok(heard.indexOf('radio.replyHello') >= 0 && heard.indexOf('radio.replyHello') < heard.indexOf('radio.o7'), 'reply before the next segment: ' + heard);
    // A pausing overlay holds the radio, and a song in progress starts again afterwards.
    await page.evaluate(() => { NSF.radio.play([{ song: 'slowTide' }]); });
    await page.waitForFunction(() => NSF.radio.view.song, null, { timeout: 20000 });
    await page.evaluate(() => NSF.found.open());
    assert.equal(await page.evaluate(() => [NSF.time.paused, NSF.radio.view.song]).then(v => v.join()), 'true,');
    await page.evaluate(() => NSF.found.close());
    await page.waitForFunction(() => NSF.radio.view.song === 'slowTide', null, { timeout: 5000 });
    assert.deepEqual(errors, []);
    console.log('PASS: keyboard forward/reverse focus, Enter, Escape and live announcement; premature bagging reason, queue deduplication, modal pause, automatic scan, stale order, invalid queued action, live dial, echo across orders, a call kept on air, radio held and resumed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
