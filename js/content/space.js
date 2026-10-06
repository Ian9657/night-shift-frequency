// The store in metres and the one camera that sees it. The art build renders
// from this; the runtime uses the same projection for click regions, product
// paths and hand positions, so what is drawn and what is clicked always agree.
(function (root) {
  'use strict';
  // First-person clerk view: eye 1.57 m up, ~100° horizontal field of view,
  // horizon raised so the near edge of the counter stays in frame.
  const camera = Object.freeze({ eyeY: 1.57, k: 200, vx: 240, vy: 62 });
  const screen = Object.freeze({ width: 480, height: 270 });

  const room = Object.freeze({ halfW: 1.69, back: 1.97, ceiling: 2.555 });
  const counter = Object.freeze({ y: 0.95, near: 0.6, far: 1.14, thick: 0.045 });
  // Customers are drawn on a shared canvas (people.cjs) at this depth: 151 px per
  // metre, the reference figure's head top at 1.68 m, centred on the camera axis;
  // headroom above it fits figures up to about 1.95 m.
  const customer = Object.freeze({ z: 1.32, canvas: [176, 210], centre: 88, headTop: 40, height: 1.68 });

  // Interactive fixtures on the counter: centre x/z, width/height/depth, optional yaw (radians).
  // A fixture may be made of several boxes; the first is its click target.
  const fixtures = Object.freeze({
    microwave: [{ x: -1.02, z: 1.04, w: 0.46, h: 0.27, d: 0.34 }],
    pos: [{ x: -0.5, z: 0.99, w: 0.34, h: 0.31, d: 0.28 }, { x: -0.42, z: 0.78, w: 0.36, h: 0.035, d: 0.14 }],
    scanner: [{ x: -0.21, z: 0.95, w: 0.09, h: 0.19, d: 0.12 }],
    terminal: [{ x: 0.23, z: 0.95, w: 0.09, h: 0.17, d: 0.1 }],
    tray: [{ x: 0.38, z: 0.82, w: 0.18, h: 0.03, d: 0.11 }],
    bags: [{ x: 0.52, z: 0.99, w: 0.26, h: 0.03, d: 0.18 }],
    radio: [{ x: 0.64, z: 0.8, w: 0.24, h: 0.14, d: 0.09 }],
    printer: [{ x: 0.8, z: 1.0, w: 0.16, h: 0.13, d: 0.2 }],
  });

  // Static things on the counter (not clickable): drawn into the counter layer.
  const decor = Object.freeze({
    cctv: { x: -1.0, z: 1.08, w: 0.3, h: 0.24, d: 0.26, y: counter.y + 0.27 },
    candyRack: { x: 0.45, z: 1.11, w: 0.3, h: 0.13, d: 0.05 },
    changeMat: { x: 0.38, z: 0.82, w: 0.24, h: 0.004, d: 0.15 },
  });

  // The clerk's own things, nearest the camera.
  const personal = Object.freeze({
    coffee: { x: -0.12, z: 0.7, w: 0.085, h: 0.12, d: 0.085 },
    phone: { x: 0.2, z: 0.68, w: 0.05, h: 0.02, d: 0.1, yaw: 0.35 },
    signIn: { x: -0.5, z: 0.67, w: 0.21, h: 0.012, d: 0.13, yaw: -0.2 },
    can: { x: -0.27, z: 0.69, w: 0.11, h: 0.03, d: 0.06, yaw: 0.6 },
  });

  // Where goods sit: the customer puts them down at the far lane; scanned goods come nearer.
  const lane = Object.freeze({ z: 1.0, scannedZ: 0.9, x0: -0.12, x1: 0.18, gap: 0.02 });

  // Top-left of the customer canvas on screen.
  function customerOrigin() {
    const headY = camera.vy + camera.k * (camera.eyeY - customer.height) / customer.z;
    return [camera.vx - customer.centre, Math.round(headY) - customer.headTop];
  }

  // Vertical shift of a figure of `height` metres against the reference customer.
  function figureOffset(height) {
    return Math.round((customer.height - height) * scaleAt(customer.z));
  }

  function project(X, Y, Z) {
    return [camera.vx + camera.k * X / Z, camera.vy + camera.k * (camera.eyeY - Y) / Z];
  }
  // Pixels per metre at depth Z.
  function scaleAt(Z) { return camera.k / Z; }
  // Unit-free ray through the centre of screen pixel (sx, sy); Z component is 1.
  function ray(sx, sy) {
    return [(sx + 0.5 - camera.vx) / camera.k, -(sy + 0.5 - camera.vy) / camera.k, 1];
  }
  // The counter-top point under a screen pixel, or null above the counter's far edge.
  function counterPoint(sx, sy) {
    const d = ray(sx, sy);
    if (d[1] >= 0) return null;
    const t = (counter.y - camera.eyeY) / d[1];
    return t >= counter.near && t <= counter.far ? { x: d[0] * t, z: t } : null;
  }

  const api = { camera, screen, room, counter, customer, fixtures, decor, personal, lane, project, scaleAt, ray, counterPoint, customerOrigin, figureOffset };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.NSF = root.NSF || {}).space = api;
})(globalThis);
