const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      let count = 0;
      for (let seed = 0; seed < 60; seed++) {
        await page.goto(pathToFileURL(path.resolve(__dirname, '../greybox.html')).href + '?seed=' + seed);
        await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });
        count += await page.evaluate(seed => {
        shiftStarted = true;
        let checked = 0;
          for (let index = 0; index < 8; index++) {
            state.eventIndex = index;
            const ids = currentEvent().items.map(item => item.id);
            for (const scanned of [[], ids.slice(0, 1), ids]) {
              state.scannedIds = scanned;
              render();
              for (const node of products.querySelectorAll('.product')) {
                const r = node.getBoundingClientRect();
                for (const selector of ['.coin-tray', '.payment-terminal', '.scanner', '.receipt-printer']) {
                  const device = document.querySelector(selector).getBoundingClientRect();
                  const overlap = Math.min(r.right, device.right) - Math.max(r.left, device.left) > 1
                    && Math.min(r.bottom, device.bottom) - Math.max(r.top, device.top) > 1;
                  if (overlap) throw new Error(`Product overlaps ${selector}: ${seed}/${index}/${node.dataset.itemId}`);
                }
                let reachable = false;
                for (const x of [.15, .3, .5, .7, .85]) for (const y of [.15, .3, .5, .7, .85]) {
                  const hit = document.elementFromPoint(r.x + x * r.width, r.y + y * r.height);
                  if (hit === node || node.contains(hit)) reachable = true;
                }
                if (!reachable) throw new Error(`Unreachable: seed ${seed}, order ${index}, item ${node.dataset.itemId}, scanned ${scanned}`);
                checked++;
              }
            }
          }
        return checked;
        }, seed);
      }
      console.log(`PASS ${width}px: ${count} product hitboxes across 60 generated shifts`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
