// Speech probe: plays whole nights the way a quick player would and watches the
// customers' speech bubble. A line that gives way before it is fully typed is CUT; a
// line asked for but never shown by the time the bubble is cleared is DROPPED. Also
// prints each night's length and the longest a line waited to appear.
//   node tests/probes/speech.cjs [seed ...]           (default: four seeds)
// Exits non-zero if any line was cut or dropped.
const { URL_BASE, launch, signIn, playNight } = require('./common.cjs');

(async () => {
  const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['a', 'b', 'c', 'd'];
  const browser = await launch();
  const problems = [];
  try {
    for (const seed of seeds) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      page.on('pageerror', e => problems.push(`${seed}: page error ${e.message}`));
      await page.goto(URL_BASE + '?seed=' + seed);
      await page.evaluate(() => {
        const d = NSF.dialogue, t = NSF.strings.t, log = window.speechLog = { problems: [], lag: 0 };
        const order = () => NSF.debug.game.state.eventIndex + 1;
        let asked = [], shown = new Set(), last = { full: '', typed: 0 };
        const askedAt = new Map();
        const watch = () => {
          const full = d.fullText(), typed = d.visibleText().length;
          if (full !== last.full) {
            if (last.full && last.typed < last.full.length) log.problems.push(`order ${order()}  CUT ${last.typed}/${last.full.length}  "${last.full}"`);
            last = { full, typed: 0 };
          }
          if (!full) return;
          if (!shown.has(full) && askedAt.has(full)) { log.lag = Math.max(log.lag, NSF.time.now - askedAt.get(full)); askedAt.delete(full); }
          shown.add(full);
          last.typed = Math.max(last.typed, typed);
        };
        const say = d.say, clear = d.clear;
        d.say = (lines, options) => {
          for (const line of lines || []) {
            const key = typeof line === 'string' ? line : line.text;
            if (!key) continue;
            asked.push(key);
            if (!askedAt.has(t(key))) askedAt.set(t(key), NSF.time.now);
          }
          return say(lines, options);
        };
        d.clear = () => {
          watch();
          for (const key of asked) if (!shown.has(t(key))) log.problems.push(`order ${order()}  DROPPED  "${t(key)}"`);
          asked = []; shown = new Set();
          return clear();
        };
        setInterval(watch, 5);
      });
      await page.evaluate(() => { NSF.debug.time.speed = 2; });
      await signIn(page);
      await playNight(page);
      const log = await page.evaluate(() => ({ ...speechLog, length: NSF.time.now }));
      console.log(`${seed}: night ${Math.round(log.length / 1000)} s of game time, longest wait before a line showed ${Math.round(log.lag)} ms`);
      log.problems.forEach(p => problems.push(`${seed}: ${p}`));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  problems.forEach(p => console.log('  ' + p));
  console.log(problems.length ? `${problems.length} problems` : 'no line cut or dropped');
  process.exitCode = problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
