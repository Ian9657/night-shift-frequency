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
  // A fixture may be made of several boxes; the first is its click target.
  const fixtures = Object.freeze({
    microwave: [{ x: -1.02, z: 1.04, w: 0.46, h: 0.27, d: 0.34 }],
    pos: [{ x: -0.5, z: 0.99, w: 0.44, h: 0.4, d: 0.28 }, { x: -0.43, z: 0.78, w: 0.32, h: 0.035, d: 0.14 }],
    scanner: [{ x: -0.21, z: 0.95, w: 0.09, h: 0.19, d: 0.12 }],
    terminal: [{ x: 0.23, z: 0.95, w: 0.09, h: 0.17, d: 0.1 }],
    // Carrier bags hang in a bundle on the clerk's side of the counter, their handles
    // hooked over its near lip.
    bags: [{ x: 0.12, z: 0.495, w: 0.26, h: 0.18, d: 0.01, y: counter.y - 0.18 }],
    // The radio is the clerk's, at their right hand; the receipt printer stands by the
    // bags and the card terminal, where the receipt is handed over.
    radio: [{ x: 0.85, z: 0.7, w: 0.24, h: 0.14, d: 0.09 }],
    printer: [{ x: 0.74, z: 1.0, w: 0.16, h: 0.13, d: 0.2 }],
    // The cash drawer, flush with the counter's front under the register; open, it
    // slides out towards the clerk.
    drawer: [{ x: -0.45, z: 0.515, w: 0.4, h: 0.09, d: 0.02, y: counter.y - counter.thick - 0.1 }],
  });
  const drawerTravel = 0.17;

  // Static things on the counter (not clickable): drawn into the counter layer.
  const decor = Object.freeze({
    cctv: { x: -1.0, z: 1.08, w: 0.3, h: 0.24, d: 0.26, y: counter.y + 0.27 },
    candyRack: { x: 0.45, z: 1.11, w: 0.3, h: 0.13, d: 0.05 },
  });

  // The clerk's own things, nearest the camera.
  const personal = Object.freeze({
    phone: { x: 0.47, z: 0.63, w: 0.048, h: 0.022, d: 0.095, yaw: 0.35 },
    can: { x: 0.36, z: 0.66, w: 0.066, h: 0.115, d: 0.066 },
    signIn: { x: -0.5, z: 0.67, w: 0.21, h: 0.012, d: 0.13, yaw: -0.2 },
  });

  // Where goods sit: the customer puts them down at the far lane; scanned goods come nearer.
  const lane = Object.freeze({ z: 1.0, scannedZ: 0.9, x0: -0.16, x1: 0.19, gap: 0.02 });

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
