const assert = require('node:assert/strict');
const { chromium, URL_BASE, signIn, idle, click, playOrder } = require('./browser-helpers.cjs');
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
    assert.equal(await page.evaluate(() => NSF.game.guidance()), 'scan');
    assert.deepEqual(await page.evaluate(() => { NSF.game.update(); return [...NSF.game.scene.cues]; }), ['scanner'],
      'in the first sales the POS instruction and the outline point at the same thing');

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
    // A pausing overlay holds the radio; a song the clerk asked for starts again afterwards.
    await page.evaluate(() => { NSF.radio.play([{ song: 'slowTide', keep: true }]); });
    await page.waitForFunction(() => NSF.radio.view.song, null, { timeout: 20000 });
    await page.evaluate(() => NSF.found.open());
    assert.equal(await page.evaluate(() => [NSF.time.paused, NSF.radio.view.song]).then(v => v.join()), 'true,');
    await page.evaluate(() => NSF.found.close());
    await page.waitForFunction(() => NSF.radio.view.song === 'slowTide', null, { timeout: 5000 });

    // Night Ferry across orders, at a quick clerk's pace. Read the queue the radio will play
    // by stepping it, without waiting on air time.
    const onAir = await page.evaluate(() => {
      const r = NSF.radio, order = [];
      const drain = () => { const seen = []; for (let i = 0; i < 12 && (r.view.key || r.view.song); i++) { seen.push(r.view.song ? 'song:' + r.view.song : r.view.key); r.skip(); } return seen; };
      r.tune('87.6'); drain();
      // A segment whose song never got going: its line carries, the song goes with its intro.
      r.beginOrder(['radio.o3a', { song: 'harbourLights', intro: 'radio.o7' }]);
      r.beginOrder(['radio.o4']);
      order.push(drain());
      // A filler song playing when a pause comes is let go.
      r.beginOrder([{ song: 'lastFerry' }]);
      NSF.found.open(); NSF.found.close();
      order.push(r.view.song || null);
      // An on-time segment goes ahead of carried lines; the closing clears segments but
      // keeps the story's lines.
      r.beginOrder(['radio.o1', 'radio.o3b']);
      r.beginOrder(['radio.o5a', 'radio.o5b'], { onTime: true });
      r.clearSegments();
      order.push(drain());
      return order;
    });
    assert.deepEqual(onAir[0], ['radio.o3a', 'radio.o4'], 'a carried line plays; a song not started goes with its intro');
    assert.notEqual(onAir[1], 'lastFerry', 'a filler song is let go by a pause');
    assert.deepEqual(onAir[2], ['radio.o1', 'radio.o5a', 'radio.o5b'], 'on time after the line on air; the story survives the closing');
    // Speech is queued: a line being typed is never cut off by the next, the same line
    // twice in a row is said once, and `remaining` covers everything waiting.
    const said = await page.evaluate(async () => {
      const d = NSF.dialogue, t = NSF.strings.t, seen = [];
      d.clear();
      d.say(['say.rain1', 'say.rain2']);
      d.say(['say.cash', 'say.cash']);
      const waitMs = d.remaining();
      let cut = false, last = '';
      await new Promise(resolve => {
        const id = setInterval(() => {
          const full = d.fullText();
          if (full !== last) { if (last && seen.at(-1)?.shown < last.length) cut = true; seen.push({ full, shown: 0 }); last = full; }
          if (seen.length) seen.at(-1).shown = d.visibleText().length;
          if (d.remaining() <= 0) { clearInterval(id); resolve(); }
        }, 5);
      });
      return { lines: seen.map(s => s.full), cut, waitMs, expected: ['say.rain1', 'say.rain2', 'say.cash'].map(k => t(k)) };
    });
    assert.deepEqual(said.lines, said.expected);
    assert.equal(said.cut, false, 'no line gives way before it is typed out');
    assert.ok(said.waitMs > 2000);
    assert.deepEqual(errors, []);

    // Issue #1: a shift begun in silent mode gets the room and the radio bed once silent
    // mode is turned off, and the bed matches the dial at that moment.
    const ambience = async silent => {
      const p = await browser.newPage();
      await p.addInitScript(silent => {
        localStorage.setItem('nsf.settings', JSON.stringify({ master: 5, radio: 5, sounds: 5, silent }));
        globalThis.__loops = 0;
        globalThis.__bedTunedTo = [];
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...a) { if (this.loop) globalThis.__loops++; return start.apply(this, a); };
        const target = AudioParam.prototype.setTargetAtTime;
        AudioParam.prototype.setTargetAtTime = function (value, ...a) { globalThis.__bedTunedTo.push(value); return target.call(this, value, ...a); };
      }, silent);
      await p.goto(URL_BASE + '?seed=interaction');
      await signIn(p);
      if (silent) {
        await p.evaluate(() => { NSF.radio.setFrequency(8770); NSF.phone.toggleSilent(); });
      }
      await p.waitForTimeout(300);
      const result = await p.evaluate(() => ({ muted: NSF.audio.muted, loops: __loops, echoBed: __bedTunedTo.includes(1800) }));
      await p.close();
      return result;
    };
    // A scanned item still selected (clicked again) doesn't stop the scanner taking the next.
    {
      const p = await browser.newPage();
      await p.goto(URL_BASE + '?seed=interaction');
      await p.evaluate(() => { NSF.time.speed = 4; });
      await signIn(p);
      await idle(p);
      await click(p, 'scanner');
      await idle(p);
      const first = await p.evaluate(() => NSF.game.state.scannedIds[0]);
      await click(p, 'item:' + first);
      await click(p, 'scanner');
      await idle(p);
      assert.equal(await p.evaluate(() => NSF.game.state.scannedIds.length), 2, 'the scanner takes the next item');
      await p.close();
    }

    // June mentions the frequencies again at order 4 only if none has been found.
    {
      const p = await browser.newPage();
      await p.goto(URL_BASE + '?seed=interaction');
      await p.evaluate(() => { NSF.time.speed = 4; });
      await signIn(p);
      const segment = () => p.evaluate(() => {
        let lines = null;
        const begin = NSF.radio.beginOrder;
        NSF.radio.beginOrder = l => { lines = l; };
        NSF.broadcast.orderStarted(NSF.story.tonight.tuningNudge.at);
        NSF.radio.beginOrder = begin;
        return lines;
      });
      assert.equal((await segment()).at(-1), 'radio.tuningNudge', 'nudged when nothing was found');
      await playOrder(p, ['keep', 'linked'], 'nudge');                       // the taxi can be heard from order 2
      await p.evaluate(() => NSF.radio.setFrequency(8785));
      await p.waitForFunction(() => NSF.company.heard('walt'), null, { timeout: 10000 });
      assert.ok(!(await segment()).includes('radio.tuningNudge'), 'not nudged once a frequency was found');
      await p.close();
    }

    // A scanner click while a finished customer is leaving scans the next customer's first item.
    {
      const p = await browser.newPage();
      await p.goto(URL_BASE + '?seed=interaction');
      await p.evaluate(() => { NSF.time.speed = 4; });
      await signIn(p);
      const first = await p.evaluate(() => NSF.game.order());
      for (const _ of first.items) { await idle(p); await click(p, 'scanner'); }
      await idle(p);
      await click(p, first.paymentType === 'cash' ? 'drawer' : 'terminal');
      await idle(p);
      await click(p, 'bags');
      await p.waitForFunction(() => NSF.game.state.bagged && NSF.game.state.busy);
      await click(p, 'scanner');
      await p.waitForFunction(() => NSF.game.state.eventIndex === 1 && NSF.game.state.scannedIds.length === 1, null, { timeout: 20000 });
      await p.close();
    }

    const withSound = await ambience(false), unmuted = await ambience(true);
    assert.equal(unmuted.muted, false);
    assert.equal(unmuted.loops, withSound.loops, 'room and radio bed loops after unmuting');
    assert.ok(withSound.loops >= 6);
    assert.equal(unmuted.echoBed, true, "the late radio bed takes the echo's hiss");
    console.log('PASS: a click during the changeover carries to the next customer; the tuning nudge only when nothing was found; scanner past a selected scanned item; ambience after a silent start (issue #1); queued speech (no line cut or swallowed); keyboard forward/reverse focus, Enter, Escape and live announcement; premature bagging reason, queue deduplication, modal pause, automatic scan, stale order, invalid queued action, live dial, echo across orders, a call kept on air, radio held and resumed, Night Ferry carried across orders.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
