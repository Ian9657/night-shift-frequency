// Shared Playwright helpers for the canvas build. Clicks go through the real
// pointer path at the client coordinates reported by NSF.debug.targets().
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const artifacts = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const URL_BASE = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

async function idle(page) {
  await page.waitForFunction(() => {
    const { game, dialogue } = NSF.debug;
    return !game.state.busy && !dialogue.locked;
  }, null, { timeout: 15000 });
}

async function click(page, name) {
  const handle = await page.waitForFunction(n => globalThis.NSF?.debug?.targets()[n], name, { timeout: 15000 })
    .catch(() => { throw new Error('missing click target ' + name); });
  const target = await handle.jsonValue();
  await page.mouse.click(target.x, target.y);
}

// Plays the current order to completion; record orders take choices[0] (#005) or choices[1] (#008).
async function playOrder(page, choices, shots) {
  await idle(page);
  const order = await page.evaluate(() => {
    const o = NSF.debug.game.order();
    return { id: o.id, index: o.index, items: o.items.map(i => i.id), mismatch: Boolean(o.mismatch), kind: o.decisionKind,
      payment: o.paymentType, bag: o.bagPreference, heat: o.items.filter(i => i.heat).map(i => i.id), final: o.finalReport };
  });
  // Each item comes out of the basket ready to scan.
  for (let i = 0; i < order.items.length; i++) {
    await click(page, 'basket');
    await idle(page);
    await click(page, 'scanner');
    await idle(page);
  }
  if (order.mismatch) {
    // Choices must not exist before the physical re-scan.
    await click(page, 'recordKey');
    const early = await page.evaluate(() => NSF.debug.records.model());
    assert.equal(early.deciding, false);
    assert.equal(early.needsRescan, true);
    await page.screenshot({ path: path.join(artifacts, `${shots}-${order.index + 1}-pending.png`) });
    await click(page, 'ui:back');
    await click(page, 'item:' + order.items[0]);
    await click(page, 'scanner');
    await idle(page);
    // The record key, not the screen, opens the record; it lights once the re-scan is in.
    const key = await page.evaluate(() => ({ pending: NSF.debug.game.recordPending(), screen: 'pos' in NSF.debug.targets() }));
    assert.deepEqual(key, { pending: true, screen: false });
    await page.screenshot({ path: path.join(artifacts, `${shots}-${order.index + 1}-key.png`) });
    await click(page, 'recordKey');
    const choice = order.kind === 'identity' ? choices[0] : choices[1];
    await click(page, 'ui:choice:' + choice);
    await page.screenshot({ path: path.join(artifacts, `${shots}-${order.index + 1}-choices.png`) });
    await click(page, 'ui:save');
    const saved = await page.evaluate(id => NSF.debug.game.shift.decisionFor(id), order.id);
    assert.equal(saved.decision, choice);
    await idle(page);
  }
  await click(page, order.payment === 'cash' ? 'drawer' : 'terminal');
  await idle(page);
  if (order.heat.length) {
    await click(page, 'microwave');
    await idle(page);
  }
  if (order.bag !== 'no') await click(page, 'bags');
  if (order.final) {
    await page.waitForFunction(() => NSF.debug.game.state.bagged && !NSF.debug.game.state.busy, null, { timeout: 15000 });
  } else {
    await page.waitForFunction(i => NSF.debug.game.state.eventIndex === i + 1, order.index, { timeout: 15000 });
  }
  return order;
}

// START SHIFT, then sign tonight's line on the sheet (with a typed name, or the default).
async function signIn(page, name = '') {
  await click(page, 'ui:start');
  for (const letter of name) await click(page, 'ui:sheet-' + letter);
  await click(page, 'ui:sheet-sign');
  await page.waitForFunction(() => NSF.debug.game.state.phase === 'shift');
}

// After the report: Night Ferry signs off, the clerk signs out, the closing card shows.
async function signOut(page, shot) {
  await page.waitForFunction(() => NSF.debug.game.state.phase === 'clockout', null, { timeout: 60000 });
  if (shot) await page.screenshot({ path: shot });
  await click(page, 'ui:sheet-sign');
  await page.waitForFunction(() => NSF.debug.game.state.phase === 'end', null, { timeout: 15000 });
}

// Runs browser test cases, each in a fresh page so no case inherits another's radio,
// queue or feedback. `cases` is [name, async (page, browser) => {...}]; a case's page is
// signed in (unless `signIn: false`) with the clock at `speed`. Page errors fail the
// case. Every case runs; the process exits non-zero if any failed.
async function suite(title, cases, { speed = 4, seed = 'interaction' } = {}) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const failed = [];
  try {
    for (const [name, run, options = {}] of cases) {
      const page = await browser.newPage(options.viewport ? { viewport: options.viewport } : {});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        if (options.before) await page.addInitScript(...options.before);
        await page.goto(URL_BASE + '?seed=' + (options.seed || seed));
        if (options.signIn !== false) {
          await page.evaluate(v => { NSF.time.speed = v; }, speed);
          await signIn(page, options.name || '');
        }
        await run(page, browser);
        assert.deepEqual(errors, [], 'page errors');
        console.log('  ok   ' + name);
      } catch (error) {
        failed.push(name);
        console.log('  FAIL ' + name + '\n       ' + String(error.stack || error).split('\n').slice(0, 16).join('\n       '));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (failed.length) {
    console.log(`FAIL: ${title}: ${failed.length} of ${cases.length} failed`);
    process.exitCode = 1;
  } else console.log(`PASS: ${title}: ${cases.length} cases`);
}

module.exports = { chromium, artifacts, URL_BASE, idle, click, playOrder, signIn, signOut, suite };
