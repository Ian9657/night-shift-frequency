const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../greybox.html')).href);
    await page.evaluate(async () => {
      const assets = ['bank-card-sage', 'bank-card-burgundy', 'bank-card-blue', 'phone-graphite', 'phone-moss'];
      for (let n = 1; n <= 10; n++) for (const suffix of ['', '-receive', '-pay-extract', '-pay-present', '-pay-contact']) {
        assets.push('customer-detail-' + String(n).padStart(2, '0') + '-natural' + suffix);
      }
      for (const name of assets) {
        const image = new Image();
        image.src = 'assets/pixel-sprites/' + name + '.svg';
        await image.decode();
      }
    });
    await page.click('[data-start-shift]');
    await page.waitForFunction(() => !dialogueLocked);
    for (const type of ['card','tap']) {
      await page.evaluate(type => {
        state.eventIndex = type === 'card' ? 0 : 3;
        render();
        window.paymentTest = animateTerminalPayment(currentEvent());
      }, type);
      await page.waitForFunction(() => document.querySelector('.payment-motion')?.dataset.phase === 'contact');
      await page.screenshot({path:path.join(__dirname,'artifacts',type+'-contact.png')});
      await page.evaluate(() => window.paymentTest);
      assert.equal(await page.locator('.payment-motion').count(),0);
    }
    await page.evaluate(() => {
      state.eventIndex=6;
      state.scannedIds=currentEvent().items.map(item=>item.id);
      render();
    });
    await page.waitForTimeout(150);
    assert.ok((await page.locator('[data-item-quantity]').allTextContents()).includes('x2'));
    await page.screenshot({path:path.join(__dirname,'artifacts','quantity-two.png')});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(__dirname,'artifacts','quantity-two-mobile.png')});
    console.log('PASS: connected card/phone animation; x2 POS; desktop/mobile captures');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
