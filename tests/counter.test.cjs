// The counter: keyboard, touch and pointer input, the phone menu, the speech bubble, first-sale guidance, refused clicks, the action
// queue, the scanner, changing customers and the customers' queued speech. Each case
// runs in a fresh page, signed in, the clock at 4x.
const assert = require('node:assert/strict');
const { idle, click, suite } = require('./browser-helpers.cjs');

suite('counter', [
  ['keyboard focus: Tab, Shift+Tab, Escape, Enter, and the live announcement', async page => {
    await idle(page);
    const names = await page.evaluate(() => NSF.game.targets().map(t => t.name));
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), names[0]);
    await page.waitForTimeout(150);                                     // frames keep running with focus
    await page.keyboard.press('Shift+Tab');                             // back past the first wraps to the last
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), names.at(-1));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => NSF.game.state.focusTarget), null);
    for (let i = 0; i <= names.indexOf('phone'); i++) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => NSF.phone.view.open), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !NSF.phone.view.open);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => NSF.ui.interactionAnnouncement(NSF.game).includes('MICROWAVE')));
  }],

  ['Shift on its own opens the counter scan; Shift as a modifier does not', async page => {
    const scanning = () => page.evaluate(() => NSF.ui.inspecting);
    await page.keyboard.down('Shift');
    assert.equal(await scanning(), true, 'held alone');
    await page.keyboard.press('Tab');
    assert.equal(await scanning(), false, 'Shift+Tab closes it');
    await page.keyboard.up('Shift');
    await page.keyboard.down('Meta');
    await page.keyboard.down('Shift');
    assert.equal(await scanning(), false, 'not with Cmd held');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
  }],

  ['the phone menu: a row is selected under the mouse and opened by one click; a text takes two', async page => {
    await idle(page);
    await click(page, 'phone');
    await page.waitForFunction(() => NSF.phone.frame() === 2);
    const row = await page.evaluate(() => NSF.debug.targets()['ui:phone-row-settings']);
    await page.mouse.move(row.x, row.y);
    assert.equal(await page.evaluate(() => NSF.phone.rows()[NSF.phone.view.row]), 'settings', 'hover selects');
    await page.mouse.click(row.x, row.y);
    assert.equal(await page.evaluate(() => NSF.phone.view.screen), 'settings');
    await page.keyboard.press('Escape');
    await click(page, 'ui:phone-row-compose');
    assert.equal(await page.evaluate(() => NSF.phone.view.screen), 'compose');
    const second = await page.evaluate(() => 'ui:phone-send-' + NSF.messages.presets[1].id);
    await click(page, second);
    assert.equal(await page.evaluate(() => Boolean(NSF.debug.messages.sent)), false, 'the first click only selects a text');
    await click(page, second);
    assert.equal(await page.evaluate(() => NSF.debug.messages.sent?.preset.id), await page.evaluate(() => NSF.messages.presets[1].id));
  }],

  ['a click on the speech bubble shows the rest of the line at once', async page => {
    await idle(page);
    await page.evaluate(() => { NSF.time.speed = 0.25; NSF.dialogue.clear(); NSF.dialogue.say([NSF.game.order().customerLines.at(-1)]); });
    await click(page, 'ui:bubble');
    assert.deepEqual(await page.evaluate(() => [NSF.dialogue.visibleText(), NSF.dialogue.fullText()].map(s => s.length)).then(([a, b]) => a === b && a > 0), true);
  }],

  ['the pointer: a hand over a machine, the tuning knob over the radio, the arrow over nothing', async page => {
    await idle(page);
    const shown = async at => { await page.mouse.move(at.x, at.y); await page.waitForTimeout(80); return page.evaluate(() => NSF.cursor.shown); };
    const targets = await page.evaluate(() => NSF.debug.targets());
    assert.equal(await shown(targets.scanner), 'hand');
    assert.equal(await shown(targets.radio), 'tune');
    assert.equal(await shown({ x: 640, y: 60 }), 'arrow');
    assert.ok(await page.evaluate(() => document.querySelector('[data-game]').style.cursor.includes('url(')), 'drawn as a pixel cursor');
  }],

  ['in the first sale the POS instruction and the outline point at the scanner', async page => {
    await idle(page);
    assert.equal(await page.evaluate(() => NSF.game.guidance()), 'scan');
    assert.deepEqual(await page.evaluate(() => { NSF.game.update(); return [...NSF.game.scene.cues]; }), ['scanner']);
  }],

  ['touch: a hold names the basket without acting, a tap takes an item', async page => {
    await idle(page);
    const at = await page.evaluate(() => NSF.debug.targets().basket);
    const touch = (type, id) => page.evaluate(({ type, id, x, y }) => {
      document.querySelector('[data-game]').dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id,
        pointerType: 'touch', clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    }, { type, id, x: at.x, y: at.y });
    await touch('pointerdown', 11);
    await page.waitForTimeout(180);                                     // 450 ms of game time at 4x
    await touch('pointerup', 11);
    assert.equal(await page.evaluate(() => NSF.game.state.takenIds.length), 0, 'a long press inspects without activating');
    await touch('pointerdown', 12);
    await touch('pointerup', 12);
    await page.waitForFunction(() => NSF.game.state.takenIds.length === 1 && !NSF.game.state.busy);
  }],

  ['a refused click gives its reason', async page => {
    await idle(page);
    await click(page, 'bags');
    assert.equal(await page.evaluate(() => NSF.game.state.feedback.kind), 'payFirst');
  }],

  ['the action queue: one per machine, held by a panel, stale ones dropped quietly', async page => {
    await idle(page);
    await page.evaluate(() => {
      const g = NSF.game;
      g.state.busy = true;
      g.activate('scanner'); g.activate('scanner');
      g.state.busy = false;
      NSF.phone.open();
      g.update();
    });
    assert.equal(await page.evaluate(() => NSF.game.state.queuedActions.length), 1, 'deduplicated, and waiting while the phone is open');
    assert.equal(await page.evaluate(() => NSF.game.state.scannedIds.length), 0);
    await page.evaluate(() => NSF.phone.close());
    await page.waitForFunction(() => NSF.game.state.scannedIds.length === 1 && !NSF.game.state.busy);
    const dropped = await page.evaluate(() => {
      const g = NSF.game;
      g.state.queuedActions.push({ name: 'bags', eventIndex: g.state.eventIndex - 1 });
      g.update();
      const older = g.state.queuedActions.length;
      g.state.feedback = null;
      g.state.queuedActions.push({ name: 'bags', eventIndex: g.state.eventIndex });
      g.update();
      return { older, feedback: g.state.feedback, bagged: g.state.bagged };
    });
    assert.deepEqual(dropped, { older: 0, feedback: null, bagged: false });
  }],

  ['the scanner takes the next item past a selected scanned one', async page => {
    await idle(page);
    await click(page, 'scanner');
    await idle(page);
    const first = await page.evaluate(() => NSF.game.state.scannedIds[0]);
    await click(page, 'item:' + first);
    await click(page, 'scanner');
    await idle(page);
    assert.equal(await page.evaluate(() => NSF.game.state.scannedIds.length), 2);
  }],

  ['a scanner click while the customer leaves scans the next customer\'s first item', async page => {
    const first = await page.evaluate(() => NSF.game.order());
    for (const _ of first.items) { await idle(page); await click(page, 'scanner'); }
    await idle(page);
    await click(page, first.paymentType === 'cash' ? 'drawer' : 'terminal');
    await idle(page);
    await click(page, 'bags');
    await page.waitForFunction(() => NSF.game.state.bagged && NSF.game.state.busy);
    await click(page, 'scanner');
    await page.waitForFunction(() => NSF.game.state.eventIndex === 1 && NSF.game.state.scannedIds.length === 1, null, { timeout: 20000 });
  }],

  ['customer speech is queued: no line cut or swallowed, a repeat said once', async page => {
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
  }],
]);
