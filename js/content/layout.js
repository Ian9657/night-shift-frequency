// Where things are on screen, in 480x270 world pixels, derived from the store in
// metres and its one camera (js/content/space.js). The runtime reads positions
// from here; the art build renders from space.js directly, so what is drawn and
// what is clicked agree. Fixture sprites carry their own top-left as anchor 'at'.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const space = node ? require('./space.js') : root.NSF.space;
  const { counter } = space;
  const point = (X, Y, Z) => { const [x, y] = space.project(X, Y, Z); return { x: Math.round(x), y: Math.round(y) }; };
  // A screen-parallel rectangle: a box's front face (centre x, width w, front at z)
  // between heights y0 and y1, cut to the fraction [u0, u1] across and [v0, v1] down.
  function face(x, w, z, y0, y1, [u0, u1], [v0, v1]) {
    const a = space.project(x - w / 2 + w * u0, y1 - (y1 - y0) * v0, z);
    const b = space.project(x - w / 2 + w * u1, y1 - (y1 - y0) * v1, z);
    return { x: Math.round(a[0]), y: Math.round(a[1]), w: Math.round(b[0] - a[0]), h: Math.round(b[1] - a[1]) };
  }

  const F = space.fixtures;
  const [pos] = F.pos, [radio] = F.radio, [drawer] = F.drawer, [bags] = F.bags, [printer] = F.printer;
  const [scanner] = F.scanner, [microwave] = F.microwave;
  const lane = space.lane;
  const laneLeft = point(lane.x0, counter.y, lane.z), laneRight = point(lane.x1, counter.y, lane.z);
  const origin = space.customerOrigin();

  const layout = Object.freeze({
    world: { width: 480, height: 270 },
    screen: { width: 960, height: 540, scale: 2 },
    // Clickable machines, each a sprite with its default and busy states.
    fixtures: Object.freeze({
      // Idle, the microwave's display shows the shift clock (drawn by the runtime).
      microwave: { sprite: 'store-microwave', busy: 'store-microwave-heating', display: face(microwave.x, microwave.w, microwave.z - microwave.d / 2, counter.y, counter.y + microwave.h, [60 / 82, 80 / 82], [4 / 48, 13 / 48]) },
      // The register's record key opens the record view; it lights while a record waits.
      recordKey: { sprite: 'store-pos-key', lit: 'store-pos-key-lit' },
      scanner: { sprite: 'store-scanner', busy: 'store-scanner-reading', beam: point(scanner.x - 0.03, counter.y + 0.08, scanner.z - 0.1) },
      terminal: { sprite: 'store-terminal', busy: 'store-terminal-approved' },
      // Cash goes into the drawer: it opens, takes the note and shuts.
      drawer: { sprite: 'store-drawer', busy: 'store-drawer-open', drop: point(drawer.x, drawer.y + drawer.h, counter.near - space.drawerTravel * 0.4) },
      // A bag is pulled off the hanging bundle and opened at the packing place on the counter.
      bags: { sprite: 'store-bags', stack: point(bags.x, bags.y + bags.h, bags.z - bags.d / 2), packing: point(0.48, counter.y, 0.86) },
      radio: { sprite: 'store-radio', echo: 'store-radio-echo', dial: face(radio.x, radio.w, radio.z - radio.d / 2, counter.y, counter.y + radio.h, [26 / 48, 45 / 48], [5 / 28, 14 / 28]) },
      // The clerk's flip phone: opens close up as the settings menu (js/game/phone.js).
      phone: { sprite: 'store-phone' },
      printer: { sprite: 'store-printer', slot: point(printer.x + 0.01, counter.y + printer.h, printer.z - printer.d / 2 + printer.d * printer.exit) },
    }),
    // The register's screen, where the runtime draws the sale.
    pos: { screen: face(pos.x, pos.w, pos.z - pos.d / 2, counter.y, counter.y + pos.h, [8 / 80, 72 / 80], [7 / 73, 55 / 73]) },
    // Drawn with the machines but not clicked: the register, the clerk's half-finished
    // can of coffee and the receipt spike.
    decor: Object.freeze(['store-pos', 'store-can', 'store-spike']),
    // Goods wait at the far side of the lane and come forward once scanned.
    lane: { x: laneLeft.x, width: laneRight.x - laneLeft.x, incomingFoot: laneLeft.y, scannedFoot: point(0, counter.y, lane.scannedZ).y, gap: 4 },
    microwaveCavity: point(microwave.x - 0.05, counter.y + 0.13, microwave.z - microwave.d / 2 + 0.06),
    // The customer canvas (art/src/people.cjs): its top-left, the head, and how far
    // they walk in from the right.
    customer: { x: origin[0], y: origin[1], head: { x: space.customer.centre, y: space.customer.headTop }, walk: 300 },
  });
  if (node) module.exports = layout;
  else (root.NSF = root.NSF || {}).layout = layout;
})(globalThis);
