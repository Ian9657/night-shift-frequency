// The store in metres and the one camera that sees it. The art build renders
// from this; the runtime uses the same projection for click regions, product
// paths and hand positions, so what is drawn and what is clicked always agree.
(function (root) {
  'use strict';
  // First-person clerk view: eye 1.57 m up, ~100° horizontal field of view. The
  // clerk stands `z` behind the counter's near edge plane (z = 0), far enough back
  // that the counter's front, with the cash drawer, shows above the caption bar;
  // the horizon sits low so the room shows above the customer.
  const camera = Object.freeze({ eyeY: 1.57, z: -0.25, k: 200, vx: 240, vy: 90 });
  const eye = Object.freeze([0, camera.eyeY, camera.z]);
  const screen = Object.freeze({ width: 480, height: 270 });

  const room = Object.freeze({ halfW: 1.69, back: 1.97, ceiling: 2.555 });
  // The counter top stands at about a standing customer's navel (1.68 m figure),
  // a little below the hanging elbow: at the belt or lower belly of a tall customer,
  // the upper belly of a short one.
  const counter = Object.freeze({ y: 1.05, near: 0.505, far: 1.14, thick: 0.045 });
  // Customers are drawn on a shared canvas (people.cjs) at this depth: 151 px per
  // metre, the reference figure's head top at 1.68 m, centred on the camera axis;
  // headroom above it fits figures up to about 1.95 m.
  const customer = Object.freeze({ z: 1.32, canvas: [176, 210], centre: 88, headTop: 40, height: 1.68 });

  // Interactive fixtures on the counter: centre x/z, width/height/depth, optional yaw (radians).
  // The register's keypad is a wedge, low at the clerk's edge (front) and high at the
  // back (h), so its keys tilt toward them.
  const keypad = Object.freeze({ x: -0.43, z: 0.78, w: 0.32, h: 0.04, d: 0.14, front: 0.012 });
  // A point on the keypad's slope: s across, t from front to back.
  const onKeypad = (s, t) => ({ x: keypad.x - keypad.w / 2 + s * keypad.w, z: keypad.z - keypad.d / 2 + t * keypad.d, y: counter.y + keypad.front + t * (keypad.h - keypad.front) });
  // A fixture may be made of several boxes; the first is its click target.
  const fixtures = Object.freeze({
    microwave: [{ x: -1.06, z: 1.04, w: 0.46, h: 0.27, d: 0.34 }],
    // The register and its keypad; only the record key on the keypad is clicked.
    pos: [{ x: -0.5, z: 0.99, w: 0.44, h: 0.4, d: 0.28 }, keypad],
    // The record key heads the function column, third row up (w across, d along the slope).
    recordKey: [{ ...onKeypad(0.7725, 0.5425), w: 0.026, h: 0.005, d: 0.022 }],
    scanner: [{ x: -0.21, z: 0.95, w: 0.09, h: 0.19, d: 0.12 }],
    // The chip-and-PIN terminal's round base; the pad on its pole is turned (yaw) to
    // face the customer.
    terminal: [{ x: 0.38, z: 0.95, w: 0.1, h: 0.012, d: 0.1, yaw: -0.38 }],
    // Carrier bags stand folded in a steel pocket rack (S, M, L) hung under the counter
    // on the clerk's side, like the cash drawer; their tops show above the pockets.
    bags: [{ x: 0.48, z: 0.505, w: 0.27, h: 0.095, d: 0.02, y: counter.y - counter.thick - 0.1 }],
    // The radio is the clerk's, at their right hand; the small receipt printer sits at
    // their left, in front of the register's keyboard, its paper leaving the lid top.
    radio: [{ x: 0.95, z: 0.7, w: 0.24, h: 0.14, d: 0.09 }],
    // The customer's shopping basket, set down on the far side right of the scanner;
    // the clerk takes the goods out one at a time.
    basket: [{ x: 0.12, z: 1.02, w: 0.26, h: 0.15, d: 0.2 }],
    // `exit`: where the paper leaves the lid, as a fraction of the depth from the front.
    printer: [{ x: -0.57, z: 0.64, w: 0.13, h: 0.075, d: 0.13, exit: 0.25 }],
    // The cash drawer, flush with the counter's front under the register; open, it
    // slides out towards the clerk.
    drawer: [{ x: -0.45, z: 0.515, w: 0.4, h: 0.09, d: 0.02, y: counter.y - counter.thick - 0.1 }],
  });
  const drawerTravel = 0.17;

  // Static things on the counter (not clickable): drawn into the counter layer.
  const decor = Object.freeze({
    // On the customer's edge: gum in a two-tier rack and the change tray where cash and
    // change are left.
    candyRack: { x: 0.54, z: 1.1, w: 0.22, h: 0.02, d: 0.06 },

    tray: { x: 0.5, z: 0.98, w: 0.13, h: 0.012, d: 0.09 },
    // On the end-cap at the fridge's end: the charity box on the top shelf, clear of the
    // radio, and a tray of lighters on the bottom one, just above the counter.
    donation: { x: 1.34, z: 0.99, w: 0.11, h: 0.12, d: 0.08, y: 1.512 },
    lighters: { x: 1.32, z: 0.99, w: 0.07, h: 0.025, d: 0.05, y: 1.092 },
  });

  // The clerk's own things, nearest the camera, kept to the two ends so the middle of
  // the counter is free for the sale. On the right, the clerk's corner: the radio, an
  // old magazine beside it with the flip phone lying on it, the half-finished coffee and
  // a loose receipt. On the left, the paperwork: the sign-in sheet leaning on the
  // printer with its pen, the rota on a clipboard, the receipt spike and a receipt.
  const magazine = Object.freeze({ x: 0.71, z: 0.62, w: 0.16, h: 0.006, d: 0.21, yaw: -0.18 });
  const personal = Object.freeze({
    magazine,
    phone: { x: 0.72, z: 0.6, w: 0.048, h: 0.022, d: 0.095, yaw: 0.35, y: counter.y + magazine.h },
    can: { x: 0.57, z: 0.66, w: 0.066, h: 0.115, d: 0.066 },
    receipt2: { x: 0.6, z: 0.555, w: 0.05, h: 0.002, d: 0.1, yaw: -0.4 },
    // The sign-in sheet on its board, foot on the counter, leaning back on the printer's
    // front and turned a little, so one corner rests on it (h is the board's length, d
    // its thickness). Its pen lies by its foot, tied to the clip.
    signIn: { x: -0.665, z: 0.55, w: 0.1, h: 0.14, d: 0.008, yaw: 0.2 },
    pen: { x: -0.5, z: 0.545, w: 0.1, h: 0.009, d: 0.009, yaw: 0.45 },
    rota: { x: -0.95, z: 0.74, w: 0.19, h: 0.01, d: 0.13, yaw: 0.15 },
    receipt1: { x: -0.77, z: 0.6, w: 0.05, h: 0.002, d: 0.11, yaw: 0.6 },
    spike: { x: -0.85, z: 0.62, w: 0.055, h: 0.12, d: 0.055 },
  });

  // Where goods sit: taken out of the basket they wait in front of it; scanned, they
  // come nearer the clerk.
  const lane = Object.freeze({ z: 0.86, scannedZ: 0.74, x0: -0.16, x1: 0.19, gap: 0.02 });

  // Top-left of the customer canvas on screen.
  function customerOrigin() {
    const headY = camera.vy + camera.k * (camera.eyeY - customer.height) / (customer.z - camera.z);
    return [camera.vx - customer.centre, Math.round(headY) - customer.headTop];
  }

  // Vertical shift of a figure of `height` metres against the reference customer.
  function figureOffset(height) {
    return Math.round((customer.height - height) * scaleAt(customer.z));
  }

  function project(X, Y, Z) {
    const D = Z - camera.z;
    return [camera.vx + camera.k * X / D, camera.vy + camera.k * (camera.eyeY - Y) / D];
  }
  // Pixels per metre at depth Z.
  function scaleAt(Z) { return camera.k / (Z - camera.z); }
  // Unit-free ray from the eye through the centre of screen pixel (sx, sy); its Z
  // component is 1, so eye + t * ray lies t metres in front of the eye.
  function ray(sx, sy) {
    return [(sx + 0.5 - camera.vx) / camera.k, -(sy + 0.5 - camera.vy) / camera.k, 1];
  }
  // The counter-top point under a screen pixel, or null above the counter's far edge.
  function counterPoint(sx, sy) {
    const d = ray(sx, sy);
    if (d[1] >= 0) return null;
    const t = (counter.y - camera.eyeY) / d[1], z = camera.z + t;
    return z >= counter.near && z <= counter.far ? { x: d[0] * t, z } : null;
  }

  const api = { camera, eye, screen, room, counter, customer, fixtures, drawerTravel, decor, personal, lane, project, scaleAt, ray, counterPoint, customerOrigin, figureOffset };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).space = api;
})(globalThis);
