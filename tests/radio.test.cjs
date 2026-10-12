// The radio: the live dial, reception, Night Ferry carried across orders, on-time
// segments, the clerk's call kept on air, pausing panels, and June's second hint. Each
// case runs in a fresh page, signed in, the clock at 4x.
const assert = require('node:assert/strict');
const { playOrder, suite } = require('./browser-helpers.cjs');

// `drain()` in the page plays out what is queued on Night Ferry by skipping, without
// waiting on air time, and returns what was on, in order.
const withDrain = [() => {
  window.drain = () => {
    const r = NSF.radio, seen = [];
    for (let i = 0; i < 20 && (r.view.key || r.view.song); i++) { seen.push(r.view.song ? 'song:' + r.view.song : r.view.key); r.skip(); }
    return seen;
  };
}];

suite('radio', [
  ['tuning away resumes an interrupted line instead of replaying it', async page => {
    const result = await page.evaluate(async () => {
      const r = NSF.radio;
      r.play(['radio.o4']);
      for (let i = 0; i < 100 && r.view.key !== 'radio.o4'; i++) { if (r.view.key) r.skip(); await new Promise(resolve => setTimeout(resolve, 20)); }
      const before = { key: r.view.key, started: r.view.startedAt, duration: r.view.duration };
      r.setFrequency(8770);
      const leftAt = NSF.time.now;
      r.setFrequency(8760);
      await new Promise(resolve => setTimeout(resolve, 350));
      return { before, leftAt, after: { key: r.view.key, started: r.view.startedAt, duration: r.view.duration } };
    });
    assert.equal(result.before.key, 'radio.o4');
    assert.equal(result.after.key, 'radio.o4');
    assert.ok(result.after.started >= result.leftAt, 'the resumed line starts after tuning back');
    assert.ok(result.after.duration < result.before.duration, 'only the remaining portion is scheduled');
  }],

  ['the dial is exclusive but live, and another frequency plays on across an order change', async page => {
    await page.evaluate(() => NSF.radio.openDial());
    const before = await page.evaluate(() => NSF.time.now);
    await page.evaluate(() => NSF.radio.setFrequency(8770));
    await page.waitForFunction(() => NSF.radio.view.key, null, { timeout: 5000 });
    assert.equal(await page.evaluate(() => NSF.time.paused), false);
    assert.ok(await page.evaluate(t => NSF.time.now > t, before));
    await page.evaluate(() => NSF.radio.beginOrder(['radio.o4']));
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => NSF.radio.view.key), 'the echo keeps playing');
  }],

  ['reception: off centre the line goes on with letters lost; out of range, static', async page => {
    const reception = await page.evaluate(() => {
      const r = NSF.radio, v = r.view, key = v.key, at = v.startedAt;
      r.setFrequency(8762, { fine: true });
      const off = { same: v.key === key && v.startedAt === at, clarity: +v.clarity.toFixed(2), lost: r.caption().includes('·') };
      r.setFrequency(8764, { fine: true });
      const out = v.kind;
      r.setFrequency(8763, { fine: true }); r.step(1);
      return { off, out, detent: v.station };
    });
    assert.deepEqual(reception, { off: { same: true, clarity: 0.33, lost: true }, out: 'static', detent: '87.65' });
  }],

  ['the clerk\'s call is answered before the next order\'s segment', async page => {
    await page.evaluate(() => {
      NSF.radio.play([{ key: 'radio.caller', vars: { name: 'JO', said: '@call.hello' }, keep: true }, { key: 'radio.replyHello', vars: {}, keep: true }]);
      NSF.radio.beginOrder(['radio.o7']);
    });
    const heard = await page.evaluate(() => drain());
    assert.ok(heard.indexOf('radio.replyHello') >= 0 && heard.indexOf('radio.replyHello') < heard.indexOf('radio.o7'), 'heard: ' + heard);
  }, { before: withDrain }],

  ['a pausing panel holds the radio; the clerk\'s song starts again afterwards', async page => {
    await page.evaluate(() => drain());
    await page.evaluate(() => { NSF.radio.play([{ song: 'slowTide', keep: true }]); });
    await page.waitForFunction(() => NSF.radio.view.song, null, { timeout: 5000 });
    await page.evaluate(() => NSF.found.open());
    assert.deepEqual(await page.evaluate(() => [NSF.time.paused, NSF.radio.view.song]), [true, null]);
    await page.evaluate(() => NSF.found.close());
    await page.waitForFunction(() => NSF.radio.view.song === 'slowTide', null, { timeout: 5000 });
  }, { before: withDrain }],

  ['Night Ferry across orders: lines carried, unstarted songs let go, on-time segments first', async page => {
    const onAir = await page.evaluate(() => {
      const r = NSF.radio, step = drain, order = [];
      step();
      r.beginOrder(['radio.o3a', { song: 'harbourLights', intro: 'radio.o7' }]);
      r.beginOrder(['radio.o4']);
      order.push(step());
      r.beginOrder([{ song: 'lastFerry' }]);
      NSF.found.open(); NSF.found.close();
      order.push(r.view.song || null);
      r.beginOrder(['radio.o1', 'radio.o3b']);
      r.beginOrder(['radio.o5a', 'radio.o5b'], { onTime: true });
      r.clearSegments();
      order.push(step());
      return order;
    });
    assert.deepEqual(onAir[0], ['radio.o3a', 'radio.o4'], 'a carried line plays; a song not started goes with its intro');
    assert.notEqual(onAir[1], 'lastFerry', 'a filler song is let go by a pause');
    assert.deepEqual(onAir[2], ['radio.o1', 'radio.o5a', 'radio.o5b'], 'on time after the line on air; the story survives the closing');
  }, { before: withDrain }],

  ['behind the counter: older leftovers let go, lines the clerk must hear first and kept', async page => {
    const onAir = await page.evaluate(() => {
      const r = NSF.radio;
      drain();
      r.beginOrder(['radio.o1']);                                        // on air now
      r.beginOrder(['radio.o3a', 'radio.o3b']);                          // waiting
      r.beginOrder(['radio.o4']);                                        // o3a/o3b one order behind: kept
      r.beginOrder(['radio.o6a', 'radio.linesOpen']);                    // now two behind: let go
      const queued = drain();
      r.beginOrder(['radio.o6a']);
      r.beginOrder(['radio.o7', 'radio.linesOpen']);
      r.clearSegments();                                                 // the closing
      return { queued, closing: drain() };
    });
    assert.deepEqual(onAir.queued, ['radio.o1', 'radio.linesOpen', 'radio.o4', 'radio.o6a'], 'the must-hear line first; two-order-old lines let go');
    assert.deepEqual(onAir.closing, ['radio.o6a', 'radio.linesOpen'], 'what must be heard survives the closing');
  }, { before: withDrain }],

  ['June mentions the frequencies again at order 4 only if none has been found', async page => {
    const segment = () => page.evaluate(() => {
      let lines = null;
      const begin = NSF.radio.beginOrder;
      NSF.radio.beginOrder = l => { lines = l; };
      NSF.broadcast.orderStarted(NSF.story.tonight.tuningNudge.at);
      NSF.radio.beginOrder = begin;
      return lines;
    });
    assert.equal((await segment()).at(-1), 'radio.tuningNudge', 'nudged when nothing was found');
    await playOrder(page, ['keep', 'linked'], 'nudge');                  // the taxi can be heard from order 2
    await page.evaluate(() => NSF.radio.setFrequency(8785));
    await page.waitForFunction(() => NSF.company.heard('walt'), null, { timeout: 10000 });
    assert.ok(!(await segment()).includes('radio.tuningNudge'), 'not nudged once a frequency was found');
  }],
]);
