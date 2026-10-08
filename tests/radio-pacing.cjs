// Optional real-time probe. Enter orders through gameplay, never by editing state.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, URL_BASE, signIn, playOrder, click, artifacts } = require('./browser-helpers.cjs');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(URL_BASE + '?seed=radio-pacing');
    await signIn(page, 'JO');
    assert.equal(await page.evaluate(() => NSF.time.speed), 1);
    await playOrder(page, ['keep', 'linked'], 'pacing');
    await page.waitForFunction(() => NSF.radio.view.key === 'radio.tuningHint', null, { timeout: 15000 });
    await page.waitForFunction(() => NSF.radio.progress() === 1, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(artifacts, 'discovery-desktop.png') });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(artifacts, 'discovery-phone.png') });
    await page.waitForFunction(() => NSF.radio.view.key === 'radio.o2', null, { timeout: 10000 });
    await page.waitForFunction(() => NSF.radio.view.song === 'slowTide', null, { timeout: 10000 });
    await click(page, 'radio');
    // Keyboard steps on the actual dial: 87.60 -> 87.85.
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => NSF.radio.view.key === 'radio.taxi1', null, { timeout: 3000 });
    assert.equal(await page.evaluate(() => NSF.company.heard('walt')), true);
    assert.equal(await page.evaluate(() => NSF.time.paused), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => NSF.radio.view.dialOpen), false);
    assert.deepEqual(errors, []);
    console.log('PASS: normal-speed first order; discovery hint, introduction, song; taxi found via keyboard dial within 3 seconds.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
