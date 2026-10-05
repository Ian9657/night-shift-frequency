const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../greybox.html')).href);
    await page.click('[data-start-shift]');
    await page.waitForFunction(() => !dialogueLocked);
    for (const viewport of [{width:1440,height:1000},{width:1001,height:777},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(80);
      const issues = await page.evaluate(() => {
        const issues = [];
        const layer = document.querySelector('.pixel-world');
        const scale = layer.getBoundingClientRect().width / PixelWorld.WIDTH;
        if (layer.clientWidth !== 640 || layer.clientHeight !== 360) issues.push('world size');
        const matrix = new DOMMatrix(getComputedStyle(layer).transform);
        if (matrix.a !== matrix.d) issues.push('nonuniform scale');
        for (const [selector, box] of Object.entries(PixelWorld.fixtures)) {
          const node = layer.querySelector(selector);
          ['left','top','width','height'].forEach((key,i) => {
            if (parseFloat(node.style[key]) !== box[i]) issues.push(selector+':'+key);
          });
          if (Math.abs(node.getBoundingClientRect().width / scale - box[2]) > 1) issues.push(selector+': scale');
        }
        return issues;
      });
      assert.deepEqual(issues, []);
    }
    await page.setViewportSize({width:1440,height:1000});
    for (const type of ['card','tap']) {
      await page.evaluate(type => {
        state.eventIndex = type === 'card' ? 0 : 3;
        render();
        window.phases = [];
        window.poseObserver = new MutationObserver(() => {
          const overlay = document.querySelector('.payment-motion');
          if (!overlay?.dataset.phase || window.phases.at(-1)?.phase === overlay.dataset.phase) return;
          const prop = overlay.querySelector('.payment-prop');
          window.phases.push({phase:overlay.dataset.phase, left:parseFloat(prop.style.left),top:parseFloat(prop.style.top),width:parseFloat(prop.style.width),opacity:getComputedStyle(prop).opacity,transform:getComputedStyle(prop).transform});
        });
        window.poseObserver.observe(world.layer,{subtree:true,childList:true,attributes:true,attributeFilter:['data-phase']});
        window.paymentTest = animateTerminalPayment(currentEvent());
      }, type);
      await page.waitForFunction(() => document.querySelector('.payment-motion')?.dataset.phase === 'present');
      await page.setViewportSize({width:1001,height:777});
      await page.evaluate(() => window.paymentTest);
      const phases = await page.evaluate(() => {window.poseObserver.disconnect();return window.phases;});
      assert.deepEqual(phases.map(p=>p.phase), ['extract','present','contact','retract','tuck']);
      for (const p of phases) {
        assert.equal(p.left % 2, 0); assert.equal(p.top % 2, 0);
        assert.equal(p.width, 8); assert.equal(p.opacity, '1'); assert.equal(p.transform, 'none');
      }
      assert.equal(await page.locator('.customer.payment-hidden').count(),0);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/odd/mobile world scale; all discrete payment phases; resize during payment; no runtime errors');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
