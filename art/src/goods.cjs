// Goods and handed things at the first-person scale: sculpted (art/tools/sculpt.cjs)
// at their real size where they wait on the counter (js/content/space.js lane.z),
// lit from the store's tubes and outlined in each material's darkest tone. The game
// moves them about as flat sprites.
'use strict';
const { Pix } = require('../tools/pixel.cjs');
const sculpt = require('../tools/sculpt.cjs');
const space = require('../../js/content/space.js');

const { counter } = space;
const Z = space.lane.z, Y = counter.y;
const v = sculpt.vec;
const LIGHT = v.norm([-0.4, 0.8, -0.45]);
const AXES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const r5 = name => [0, 1, 2, 3, 4].map(i => name + i);
const R = {
  steel: ['steel1', 'steel3', 'steel4', 'steel5', 'steel7'], paper: ['paper0', 'paper1', 'paper2', 'paper3', 'white'],
  cream: ['cream0', 'cream1', 'cream3', 'cream4', 'cream5'], wood: ['wood0', 'wood1', 'wood2', 'wood3', 'wood4'],
  red: r5('red'), green: r5('green'), blue: r5('blue'), orange: r5('orange'), cyan: r5('cyan'), buoy: r5('buoy'), navy: r5('navy'),
  yellow: ['yellow0', 'yellow0', 'yellow1', 'yellow2', 'yellow3'], nori: ['ink', 'steel0', 'steel1', 'steel2', 'steel3'],
  rice: ['paper1', 'paper2', 'paper3', 'white', 'white'], pink: ['pink0', 'pink0', 'pink1', 'pink2', 'pink3'],
};

// Render `field(p) -> distance` around the lane point (cx, cz); `paint(P, n)` gives the
// ramp (or a fixed colour) at a surface point. Cropped, with anchor 'base' at the
// bottom centre where it touches the counter.
function render(field, paint, { cx = 0, cz = Z, reach = 0.16 } = {}) {
  const [bx, by] = space.project(cx, Y, cz);
  const x0 = Math.floor(bx - reach * space.scaleAt(cz)), y0 = Math.floor(by - 0.3 * space.scaleAt(cz));
  const w = Math.ceil(reach * 2 * space.scaleAt(cz)), h = Math.ceil(0.34 * space.scaleAt(cz));
  const hits = sculpt.render(p => [field(p), 0], w, h, [x0, y0], { zNear: cz - 0.3, zFar: cz + 0.3 });
  const colours = hits.map(hit => {
    if (!hit) return null;
    const r = paint(hit.P, hit.n);
    if (typeof r === 'string') return { colour: r, edge: 'ink' };
    const lum = (0.3 + 0.7 * Math.max(0, v.dot(hit.n, LIGHT))) * (0.65 + 0.35 * hit.ao);
    return { colour: r[lum < 0.38 ? 1 : lum < 0.62 ? 2 : lum < 0.88 ? 3 : 4], edge: r[0] };
  });
  const p = new Pix(w, h);
  colours.forEach((c, i) => {
    if (!c) return;
    const x = i % w, y = Math.floor(i / w);
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || ny < 0 || nx >= w || ny >= h || !hits[ny * w + nx] || hits[ny * w + nx].P[2] > hits[i].P[2] + 0.015;
    });
    p.px(x, y, open ? c.edge : c.colour);
  });
  let a = w, b = h, c = -1, d = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p.data[y * w + x]) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  const out = new Pix(c - a + 1, d - b + 1);
  for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) out.data[(y - b) * out.width + x - a] = p.data[y * w + x];
  return out.anchor('base', Math.round(bx) - x0 - a, Math.round(by) - y0 - b);
}

const { cylinder, cone, box, ellipsoid, smin } = sculpt;
const local = (p, c) => v.sub(p, c);

// A PET bottle: body, shoulder, neck, cap; `liquid`, `label` and `cap` are ramps.
function bottle(liquid, label, cap, labelMark) {
  const r = 0.032, c = [0, Z];
  const field = p => Math.min(
    smin(cylinder(p, c, r, Y + 0.004, Y + 0.15), cone(p, [0, Y + 0.15, Z], [0, Y + 0.19, Z], r - 0.002, 0.012), 0.012),
    cylinder(p, c, 0.015, Y + 0.188, Y + 0.21));
  return render(field, P => {
    const h = P[1] - Y;
    if (h > 0.186) return cap;
    if (h > 0.05 && h < 0.11) return labelMark && Math.abs(P[0]) < 0.012 && h > 0.065 && h < 0.095 ? labelMark : label;
    return liquid;
  }, { reach: 0.06 });
}

const goods = {
  coffee: () => render(p => cylinder(p, [0, Z], 0.027, Y + 0.002, Y + 0.105), P => {
    const h = P[1] - Y;
    if (h > 0.096 || h < 0.008) return R.steel;
    if (h > 0.045 && h < 0.07) return Math.abs(P[0]) < 0.01 ? R.cream : R.paper;
    return R.wood;
  }, { reach: 0.05 }),
  tea: () => bottle(R.green, R.paper, R.green, R.green),
  water: () => bottle(R.cyan, R.blue, R.blue, R.paper),
  cola: () => bottle(R.wood, R.red, R.red, R.paper),
  juice: () => render(p => Math.min(box(p, [0, Y + 0.075, Z], AXES, [0.034, 0.073, 0.034], 0.003),
    box(p, [0, Y + 0.158, Z], [[1, 0, 0], v.norm([0, 1, 1]), v.norm([0, -1, 1])], [0.034, 0.024, 0.024], 0.002)), P => {
    const h = P[1] - Y;
    if (h > 0.148) return R.paper;
    if (h > 0.04 && h < 0.1 && P[2] < Z) return Math.hypot(P[0], h - 0.07) < 0.018 ? R.yellow : R.orange;
    return R.orange;
  }, { reach: 0.06 }),
  // Rice ball: a rounded triangle standing up, the seaweed band at the bottom, a red wrapper stripe.
  onigiri: () => render(p => {
    const q = local(p, [0, Y + 0.004, Z]), s = [v.norm([0.94, 0.34, 0]), v.norm([-0.94, 0.34, 0])];
    const tri = Math.max(v.dot(q, s[0]) - 0.035, v.dot(q, s[1]) - 0.035, -q[1], q[1] - 0.085);
    return Math.max(tri, Math.abs(q[2]) - 0.018) - 0.006;
  }, P => {
    const h = P[1] - Y;
    if (h < 0.03) return R.nori;
    if (Math.abs(P[0]) < 0.004) return R.red;
    return R.rice;
  }, { reach: 0.07 }),
  // Sandwich wedge in its pack, the cut face showing the layers.
  sandwich: () => render(p => {
    const q = local(p, [0, Y + 0.004, Z]);
    const tri = Math.max(q[0] * 0.6 + q[1] * 0.8 - 0.05, -q[0] - 0.055, -q[1]);
    return Math.max(tri, Math.abs(q[2]) - 0.032) - 0.004;
  }, P => {
    const h = P[1] - Y;
    if (P[2] < Z - 0.028) return h < 0.018 ? R.cream : h < 0.026 ? R.green : h < 0.034 ? R.yellow : h < 0.042 ? R.pink : R.cream;
    return R.paper;
  }, { reach: 0.08 }),
  // Bento: a black tray with a clear lid over rice, salmon, greens and egg.
  bento: () => render(p => box(p, [0, Y + 0.024, Z], AXES, [0.072, 0.022, 0.055], 0.006), P => {
    const h = P[1] - Y, x = P[0], z = P[2] - Z;
    if (h < 0.016) return R.nori;
    if (h > 0.04) {
      if (x < -0.01) return R.rice;
      if (z < 0) return x < 0.03 ? R.orange : R.green;
      return R.yellow;
    }
    return R.steel;
  }, { reach: 0.09 }),
  // A bun in a clear bag, the bag's twist at one end.
  bread: () => render(p => Math.min(
    ellipsoid(p, [0, Y + 0.03, Z], [0.065, 0.03, 0.05]),
    box(p, [0.075, Y + 0.03, Z], AXES, [0.012, 0.012, 0.018], 0.004)), P => {
    if (P[0] > 0.06) return R.paper;
    return P[1] - Y > 0.045 && Math.abs(P[0]) < 0.02 ? R.blue : R.yellow;
  }, { reach: 0.1 }),
};

const props = {
  // A banknote, held up a little so its face shows.
  bill: () => render(p => box(p, [0, Y + 0.035, Z], [[1, 0, 0], v.norm([0, 0.6, 0.8]), v.norm([0, -0.8, 0.6])], [0.075, 0.034, 0.0015], 0.0005),
    P => (Math.hypot(P[0] / 0.075, (P[1] - Y - 0.035) / 0.03) < 0.42 ? 'paper3' : R.green), { reach: 0.09 }),
  // The spare key that flickers through the scanner on record orders.
  'spare-key': () => render(p => Math.min(
    Math.abs(Math.hypot(p[0] + 0.025, p[1] - Y - 0.02) - 0.014) - 0.004 + Math.max(0, Math.abs(p[2] - Z) - 0.002),
    box(p, [0.012, Y + 0.02, Z], AXES, [0.026, 0.005, 0.003], 0.001)), () => R.yellow, { reach: 0.06 }),
  // A white carrier bag with the store's buoy: standing open, then full and closed.
  'bag-open': () => render(p => Math.max(box(p, [0, Y + 0.12, Z], AXES, [0.11, 0.12, 0.06], 0.02), -box(p, [0, Y + 0.16, Z], AXES, [0.095, 0.12, 0.045], 0.015)),
    P => (Math.hypot(P[0], P[1] - Y - 0.11) < 0.03 && P[2] < Z ? R.buoy : R.paper), { reach: 0.13 }),
  'bag-full': () => render(p => Math.min(
    smin(box(p, [0, Y + 0.11, Z], AXES, [0.1, 0.11, 0.06], 0.03), ellipsoid(p, [0, Y + 0.2, Z], [0.08, 0.05, 0.05]), 0.03),
    ...[-1, 1].map(s => Math.abs(Math.hypot(p[0] - s * 0.035, p[1] - Y - 0.25) - 0.025) - 0.005 + Math.max(0, Math.abs(p[2] - Z) - 0.004))),
  P => (Math.hypot(P[0], P[1] - Y - 0.1) < 0.03 && P[2] < Z ? R.buoy : R.paper), { reach: 0.13 }),
};

module.exports = () => Object.fromEntries([...Object.entries(goods), ...Object.entries(props)].map(([name, make]) => [name, make()]));
