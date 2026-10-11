// Shared by the probes: where the game is, a browser, and a player who knows the
// counter. Probes are optional tools for looking at the game the way a person would;
// the verification list is in tests/run-all.cjs.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const helpers = require('../browser-helpers.cjs');

// BASE=<folder> plays a copy of the game instead (for example a previous version
// checked out elsewhere), to compare a probe's findings before and after a change.
const URL_BASE = process.env.BASE ? pathToFileURL(path.resolve(process.env.BASE, 'index.html')).href : helpers.URL_BASE;

function launch(args = []) {
  return helpers.chromium.launch({ headless: true, channel: 'chrome', args });
}

// The counter as a player sees it, enough to decide what to do next.
const counter = page => page.evaluate(() => {
  const g = NSF.debug.game, o = g.order(), s = g.state;
  return {
    phase: s.phase, i: s.eventIndex, busy: s.busy, locked: NSF.debug.dialogue.locked,
    walking: !g.scene.customer.visible || g.scene.customer.dx !== 0,
    mismatch: Boolean(o.mismatch), kind: o.decisionKind, saved: g.hasSavedRecord(), rescans: g.shift.checksFor(o.id).length,
    scanned: s.scannedIds.length, n: o.items.length, paid: s.paid, pay: o.paymentType, bag: o.bagPreference, bagged: s.bagged,
    heat: o.items.some(x => x.heat && s.scannedIds.includes(x.id) && !s.heatedIds.includes(x.id)), final: o.finalReport,
  };
});

// One move of a player who knows the counter: the next thing a sale needs, in order. The
// record orders are kept as they are (keep, then linked). Returns what it did, or
// 'wait' when the counter is busy, 'done' when the night's last sale is bagged.
async function nextMove(page, { before = async () => {} } = {}) {
  const s = await counter(page);
  if (s.final && s.bagged) return 'done';
  if (s.busy || s.locked || s.walking) return 'wait';
  await before(s);
  const press = name => helpers.click(page, name).then(() => name);
  if (s.scanned < s.n) return press('scanner');
  if (s.mismatch && !s.saved) {
    if (!s.rescans) { await press('item:cola'); return press('scanner'); }
    await press('recordKey');
    await press('ui:choice:' + (s.kind === 'identity' ? 'keep' : 'linked'));
    return press('ui:save');
  }
  if (!s.paid) return press(s.pay === 'cash' ? 'drawer' : 'terminal');
  if (s.heat) return press('microwave');
  if (s.bag !== 'no' && !s.bagged) return press('bags');
  return 'wait';
}

// Plays the whole night's sales with `nextMove`, pausing `pause()` ms between moves.
async function playNight(page, { pause = () => 0, before } = {}) {
  for (;;) {
    const move = await nextMove(page, { before });
    if (move === 'done') return;
    await page.waitForTimeout(move === 'wait' ? 40 : pause());
  }
}

module.exports = { ...helpers, URL_BASE, launch, counter, nextMove, playNight };
