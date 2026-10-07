// Captures key frames for human review and checks that each authored pose or
// state is actually reached: card contact, cash hand-off, heating, the record
// order's scanner bleed, the 87.7 echo caption, the record view and a phone in
// landscape. Screenshots go to tests/artifacts/visual-*.png.
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, artifacts, URL_BASE, idle, click, playOrder, signIn } = require('./browser-helpers.cjs');

const shot = (page, name) => page.screenshot({ path: path.join(artifacts, `visual-${name}.png`) });
const speed = (page, value) => page.evaluate(v => { NSF.debug.time.speed = v; }, value);
const order = page => page.evaluate(() => {
  const o = NSF.debug.game.order();
  return { index: o.index, items: o.items.map(i => i.id), payment: o.paymentType, bag: o.bagPreference };
});

async function scanAll(page) {
  await idle(page);
  for (let i = 0; i < (await order(page)).items.length; i++) {
    await click(page, 'basket');
    await idle(page);
    await click(page, 'scanner');
    await idle(page);
  }
}

async function finish(page, index) {
  const o = await order(page);
  if (o.bag !== 'no') await click(page, 'bags');
  await page.waitForFunction(i => NSF.debug.game.state.eventIndex === i + 1, index, { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_BASE + '?seed=visual-check');
    await click(page, 'ui:start');
    for (const letter of 'JO') await click(page, 'ui:sheet-' + letter);
    await shot(page, 'sign-in');
    await click(page, 'ui:sheet-sign');
    await speed(page, 12);

    // Order 1: card contact at the terminal.
    await scanAll(page);
    await speed(page, 0.2);
    await click(page, 'terminal');
    await page.waitForFunction(() => NSF.debug.game.scene.fixtures.terminal === 'store-terminal-approved');
    await shot(page, 'card-contact');
    await speed(page, 12);
    await idle(page);
    await finish(page, 0);

    // Order 2: the customer's note on the change tray goes into the drawer.
    await scanAll(page);
    await speed(page, 0.2);
    await click(page, 'drawer');
    await page.waitForFunction(() => NSF.debug.game.scene.extras.some(e => e.sprite === 'bill'));
    await shot(page, 'cash-bill');
    await page.waitForFunction(() => NSF.debug.game.scene.fixtures.drawer === 'store-drawer-open');
    await shot(page, 'cash-drawer');
    await speed(page, 12);
    await page.waitForFunction(() => NSF.debug.game.state.eventIndex === 2, null, { timeout: 15000 });

    // Order 3: heating after payment.
    await scanAll(page);
    await click(page, (await order(page)).payment === 'cash' ? 'drawer' : 'terminal');
    await idle(page);
    await speed(page, 0.2);
    await click(page, 'microwave');
    await page.waitForFunction(() => NSF.debug.game.scene.fixtures.microwave === 'store-microwave-heating');
    await shot(page, 'heating');
    await speed(page, 12);
    await idle(page);
    await finish(page, 2);

    await playOrder(page, ['keep', 'linked'], 'visual');

    // Order 5: the scanner bleeds through to the other frequency.
    await scanAll(page);
    await click(page, 'item:cola');
    await speed(page, 0.2);
    await click(page, 'scanner');
    await page.waitForFunction(() => NSF.debug.game.scene.products.get('cola').flicker);
    await shot(page, 'record-flicker');
    await speed(page, 12);
    await idle(page);
    await click(page, 'radio');
    await click(page, 'ui:dial-up');
    await click(page, 'ui:dial-up');
    await page.waitForFunction(() => NSF.debug.radio.view.echo && NSF.debug.radio.caption());
    await page.waitForTimeout(400);
    await shot(page, 'radio-echo');
    // Between the stations, someone's frequency: the taxi dispatch.
    await click(page, 'ui:dial-up');
    await click(page, 'ui:dial-up');
    await click(page, 'ui:dial-up');
    await page.waitForFunction(() => NSF.debug.radio.view.kind === 'signal' && NSF.debug.radio.caption().startsWith('Car six'));
    await page.waitForTimeout(500);
    await shot(page, 'radio-signal');
    await click(page, 'ui:dial-close');
    await click(page, 'recordKey');
    await click(page, 'ui:choice:keep');
    await shot(page, 'record-choices');
    await page.keyboard.press('Escape');
    await click(page, 'phone');
    await page.waitForFunction(() => NSF.phone.frame() === 2);
    await shot(page, 'phone-menu');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await shot(page, 'phone-text');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');
    await shot(page, 'phone-compose-row');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await shot(page, 'phone-compose');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await shot(page, 'settings-phone');
    await page.close();

    // Phone held sideways.
    const phone = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    phone.on('pageerror', e => errors.push(e.message));
    await phone.goto(URL_BASE + '?seed=visual-check');
    await signIn(phone);
    await phone.waitForTimeout(1500);
    await shot(phone, 'phone-landscape');
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await phone.evaluate(() => document.querySelector('canvas').getBoundingClientRect().bottom <= innerHeight), true, 'the whole view fits the phone');
    await phone.close();
    assert.deepEqual(errors, []);
    console.log('PASS: key poses, heating, scanner bleed, echo radio and a signal, record view, the phone\'s menu, a text, compose and settings, and landscape phone captured.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
