// Chaos probe: for each seed, plays a whole night where every order starts with a
// burst of random input (clicks on objects and empty space, keys, right-clicks, dial
// drags, panels opened and closed) before a player who knows the counter finishes it;
// the report, the ending and the sign-out are clicked through the same way. Reports page
// errors, console errors and any order the player can't finish, with the last random
// moves before it. Takes a couple of minutes a night.
//   node tests/probes/chaos.cjs [seed ...]            (default: three seeds)
// Exits non-zero if anything went wrong.
const { URL_BASE, launch, click, nextMove } = require('./common.cjs');

(async () => {
  const seeds = process.argv.slice(2).length ? process.argv.slice(2) : ['chaos1', 'chaos2', 'chaos3'];
  const browser = await launch();
  const problems = [];
  try {
    for (const seed of seeds) {
      let state = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483648;
      const random = () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648; };
      const pick = list => list[Math.floor(random() * list.length)];
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const moves = [];
      const recent = () => moves.slice(-6).join(' > ');
      page.on('pageerror', e => problems.push(`${seed}: page error "${e.message}" after ${recent()}`));
      page.on('console', m => { if (m.type() === 'error') problems.push(`${seed}: console error "${m.text()}" after ${recent()}`); });
      await page.goto(URL_BASE + '?seed=' + seed);
      await page.evaluate(() => { NSF.debug.time.speed = 6; });
      await click(page, 'ui:start');
      await click(page, 'ui:sheet-sign');
      const phase = () => page.evaluate(() => NSF.debug.game.state.phase);

      const chaos = async count => {
        for (let n = 0; n < count; n++) {
          const targets = await page.evaluate(() => NSF.debug.targets());
          const names = Object.keys(targets).filter(name => name !== 'ui:again');      // not "another shift"
          const r = random(), x = 20 + random() * 1240, y = 20 + random() * 680;
          let move;
          if (r < 0.45 && names.length) { const name = pick(names); move = 'click ' + name; await page.mouse.click(targets[name].x, targets[name].y); }
          else if (r < 0.6) { const key = pick(['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Shift+Tab', 'Backspace']); move = 'key ' + key; await page.keyboard.press(key); }
          else if (r < 0.7) { move = `right-click ${x | 0},${y | 0}`; await page.mouse.click(x, y, { button: 'right' }); }
          else if (r < 0.8) { move = `click ${x | 0},${y | 0}`; await page.mouse.click(x, y); }
          else if (r < 0.88 && targets['ui:dial']) {
            const d = targets['ui:dial'];
            move = 'drag the dial';
            await page.mouse.move(d.x, d.y); await page.mouse.down();
            await page.mouse.move(d.x + (random() - 0.5) * 300, d.y + (random() - 0.5) * 60, { steps: 4 }); await page.mouse.up();
          } else {
            const name = pick(['phone', 'radio', 'lostFound', 'recordKey'].filter(n => targets[n]));
            if (name) { move = 'open ' + name; await page.mouse.click(targets[name].x, targets[name].y); }
          }
          if (move) moves.push(move);
          await page.waitForTimeout(random() * 120);
        }
      };
      // Close whatever the chaos left open, so the player can get on.
      const tidy = () => page.evaluate(() => {
        if (NSF.phone.view.open) NSF.phone.close();
        if (NSF.found.view.open) NSF.found.close();
        if (NSF.records.view.open) NSF.records.close();
        if (NSF.radio.view.dialOpen) NSF.radio.closeDial();
      });
      const pressUi = async name => { const t = await page.evaluate(() => NSF.debug.targets()); if (t[name]) await page.mouse.click(t[name].x, t[name].y); };

      const until = Date.now() + 8 * 60000;
      while (Date.now() < until) {
        const now = await phase();
        if (now === 'end') break;
        await chaos(now === 'shift' ? 30 : 6);
        const after = await phase();
        if (after === 'shift') {
          // The player finishes this order (or prints the report after the last).
          const order = await page.evaluate(() => NSF.debug.game.state.eventIndex);
          const deadline = Date.now() + 40000;
          let finished = false;
          while (Date.now() < deadline) {
            await tidy();
            const s = await page.evaluate(() => ({ phase: NSF.debug.game.state.phase, i: NSF.debug.game.state.eventIndex, last: NSF.debug.game.order().finalReport && NSF.debug.game.state.bagged }));
            if (s.phase !== 'shift' || s.i !== order) { finished = true; break; }
            if (s.last) { await pressUi('printer'); finished = true; break; }
            const move = await nextMove(page);
            await page.waitForTimeout(move === 'wait' ? 60 : 120);
          }
          if (!finished) {
            problems.push(`${seed}: stuck in order ${order + 1} after ${recent()}: ` + JSON.stringify(await page.evaluate(() => ({ state: NSF.debug.game.state, speech: NSF.debug.dialogue.fullText(), panel: NSF.overlay.view.active }))));
            break;
          }
        } else if (after === 'report') await pressUi('ui:report');
        else if (after === 'clockout') await pressUi('ui:sheet-sign');
        else await page.waitForTimeout(500);
      }
      const end = await phase();
      if (end !== 'end' && !problems.some(p => p.startsWith(seed + ': stuck'))) problems.push(`${seed}: did not reach the closing card (phase ${end})`);
      console.log(`${seed}: ${end === 'end' ? 'reached the closing card' : 'did not finish'} after ${moves.length} random moves`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  problems.forEach(p => console.log('  ' + p));
  console.log(problems.length ? `${problems.length} problems` : 'no problems');
  process.exitCode = problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
