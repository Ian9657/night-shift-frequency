// Pacing probe: a practised player at normal speed (a person's reaction time between
// moves) plays the whole night. Reports, order by order, how long the player spent
// waiting on animations, locked lines and customers walking; how much of each Night
// Ferry line and song was heard; and how long each action keeps the counter busy. Saves
// a screenshot of the first sale, each record conflict and each payment to
// tests/artifacts/pacing-*.png. Takes about a minute and a half.
//   node tests/probes/pacing.cjs [seed]
// Report only: exits non-zero just for page errors.
const path = require('node:path');
const { URL_BASE, launch, signIn, playNight, artifacts } = require('./common.cjs');

(async () => {
  const browser = await launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_BASE + '?seed=' + (process.argv[2] || 'pacing'));
    await signIn(page, 'JO');
    await page.evaluate(() => {
      const g = NSF.debug.game, d = NSF.debug.dialogue, log = window.pacing = { orders: [], radio: [], actions: {} };
      const begin = i => { log.cur = { i, t0: NSF.time.now, clicks: 0, queued: 0, busy: 0, locked: 0, walk: 0 }; log.orders.push(log.cur); };
      begin(0);
      // Each Night Ferry line or song on 87.6, and how much of it ran.
      let onAir = null;
      setInterval(() => {
        const v = NSF.radio.view, key = v.kind === 'ferry' ? (v.song || v.key) : null;
        if (onAir && onAir.key !== key) { onAir.heard = Math.min(1, (NSF.time.now - onAir.at) / onAir.duration); onAir = null; }
        if (key && !onAir) { onAir = { key, at: NSF.time.now, duration: v.duration, order: g.state.eventIndex + 1 }; log.radio.push(onAir); }
      }, 10);
      // How long each action keeps the counter busy, and clicks taken while it was.
      const activate = g.activate;
      g.activate = name => {
        log.cur.clicks++;
        if (g.state.busy) log.cur.queued++;
        else {
          const t = NSF.time.now;
          const id = setInterval(() => { if (!g.state.busy) { clearInterval(id); (log.actions[name] = log.actions[name] || []).push(NSF.time.now - t); } }, 10);
        }
        return activate(name);
      };
      // Where the time goes: customers walking, input locked by a line, or busy.
      let last = NSF.time.now, index = 0;
      setInterval(() => {
        const dt = NSF.time.now - last;
        last = NSF.time.now;
        if (g.state.eventIndex !== index) { log.cur.t1 = NSF.time.now; index = g.state.eventIndex; begin(index); }
        if (!g.scene.customer.visible || g.scene.customer.dx) log.cur.walk += dt;
        else if (d.locked) log.cur.locked += dt;
        else if (g.state.busy) log.cur.busy += dt;
      }, 10);
    });
    const shots = new Set();
    const shoot = async name => { if (!shots.has(name)) { shots.add(name); await page.screenshot({ path: path.join(artifacts, `pacing-${name}.png`) }); } };
    await playNight(page, {
      pause: () => 350 + Math.random() * 250,
      before: async s => {
        if (s.i === 0 && s.scanned === 0) await shoot('first');
        else if (s.mismatch && !s.saved && s.scanned === s.n) await shoot('conflict-' + (s.i + 1));
        else if (!s.paid && s.scanned === s.n) await shoot('pay-' + (s.i + 1));
      },
    });
    const log = await page.evaluate(() => { pacing.cur.t1 = NSF.time.now; return pacing; });
    const sec = ms => ((ms || 0) / 1000).toFixed(1).padStart(7);
    console.log('order    total  walking   locked     busy  clicks  queued');
    for (const o of log.orders) console.log(String(o.i + 1).padStart(5), sec(o.t1 - o.t0), sec(o.walk), sec(o.locked), sec(o.busy), String(o.clicks).padStart(7), String(o.queued).padStart(7));
    console.log('\nNight Ferry (how much of each line or song was heard):');
    for (const r of log.radio) console.log(`  order ${r.order}  ${r.key.padEnd(18)} ${r.heard === undefined ? 'still on air' : Math.round(r.heard * 100) + '%'}`);
    console.log('\nCounter busy after each action (median ms):');
    for (const [name, times] of Object.entries(log.actions)) {
      times.sort((a, b) => a - b);
      console.log(`  ${name.padEnd(12)} ${Math.round(times[times.length >> 1])}  (${times.length}x)`);
    }
  } finally {
    await browser.close();
  }
  if (errors.length) { console.log('page errors:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exit(1); });
