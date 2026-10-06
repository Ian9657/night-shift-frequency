// Customers at the first-person scale (151 px per metre at js/content/space.js
// customer.z), on a shared 176x180 canvas placed by space.customerOrigin().
// Paper-doll parts use the remappable skin/hair/cloth/under/accent slots.
// Shapes are lit with normals; faces, hands and seams are placed by hand.
'use strict';
const { Pix, normals, colorIndex } = require('../tools/pixel.cjs');
const sculpt = require('../tools/sculpt.cjs');
const space = require('../../js/content/space.js');
const customers = require('../../js/content/customers.js');

const [W, H] = space.customer.canvas;
const CX = space.customer.centre;         // centre columns CX-1 | CX; mirror axis CX - 0.5
const TOP = space.customer.headTop;       // crown of the head
const HEAD_H = 33;
const canvas = () => new Pix(W, H);
const mirror = x => 2 * CX - 1 - x;      // the column mirrored across the face centre

const HAIR = ['hair1', 'hair2', 'hair3'];
const CLOTH = ['cloth1', 'cloth2', 'cloth3', 'cloth4'];
const UNDER = ['under1', 'under2', 'under3'];

const merge = (target, source) => {
  for (let i = 0; i < source.data.length; i++) if (source.data[i]) target.data[i] = source.data[i];
  return target;
};
function fill(p, color, test, box = [0, 0, W, H]) {
  const [x0, y0, w, h] = box;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (test(x + 0.5, y + 0.5)) p.px(x, y, color);
  return p;
}
const inEllipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
// Linear interpolation through [t, value] control points.
function curve(points, t) {
  for (let i = 1; i < points.length; i++) {
    const [t0, v0] = points[i - 1], [t1, v1] = points[i];
    if (t <= t1) return v0 + (v1 - v0) * (t - t0) / (t1 - t0);
  }
  return points.at(-1)[1];
}

// ------------------------------------------------------------------ heads
// Widths are half-widths in pixels down the head (0 = crown, 1 = chin).
const PROFILES = {
  oval: [[0, 4], [0.06, 8], [0.15, 10.5], [0.3, 12], [0.6, 12.5], [0.72, 12], [0.84, 10], [0.93, 7.5], [1, 4]],
  round: [[0, 4.5], [0.06, 8.5], [0.15, 11], [0.3, 12.5], [0.55, 13], [0.7, 12.5], [0.82, 10.5], [0.92, 8], [1, 4.5]],
  narrow: [[0, 4], [0.06, 7.5], [0.15, 10], [0.3, 11], [0.6, 11.5], [0.72, 11], [0.84, 9], [0.93, 6.5], [1, 3.5]],
  square: [[0, 4.5], [0.06, 8.5], [0.15, 11], [0.3, 12.5], [0.62, 12.5], [0.78, 12], [0.88, 10.5], [0.95, 8], [1, 5.5]],
};
// Faces are a flat mid tone with hand-placed shading (shadow on the far rim and under
// the jaw) so no band edge cuts across the features.
const FLAT = () => [0, 0, 1];

function head(kind, gaze) {
  const p = canvas();
  const profile = PROFILES[kind];
  const halfWidth = y => Math.round(curve(profile, (y - TOP) / (HEAD_H - 1)));
  for (let y = TOP; y < TOP + HEAD_H; y++) p.hline(CX - halfWidth(y), CX + halfWidth(y) - 1, y, 'skin2');
  for (let y = TOP + 14; y <= TOP + 20; y++) {                       // ears
    const ear = y === TOP + 14 || y === TOP + 20 ? 1 : 2;
    p.hline(CX - halfWidth(y) - ear, CX - halfWidth(y) - 1, y, 'skin2').hline(CX + halfWidth(y), CX + halfWidth(y) + ear - 1, y, 'skin2');
  }
  p.light('skin2', ['skin2'], FLAT, { outline: 'skin0' });
  for (let y = TOP + 3; y < TOP + HEAD_H - 1; y++) {
    const hw = halfWidth(y), rim = y > TOP + HEAD_H - 9 ? 3 : 2;
    p.hline(CX + hw - rim, CX + hw - 1, y, 'skin1');
  }
  for (let x = CX - halfWidth(TOP + HEAD_H - 3); x < CX + halfWidth(TOP + HEAD_H - 3); x++) p.px(x, TOP + HEAD_H - 2, 'skin1');
  for (let y = TOP + 16; y <= TOP + 18; y++) p.px(CX - halfWidth(y) - 1, y, 'skin1').px(CX + halfWidth(y), y, 'skin1');
  // Where the chin sits over the neck its edge is a soft shadow, not an outline.
  for (let y = TOP + HEAD_H - 3; y <= TOP + HEAD_H; y++) for (let x = CX - 7; x < CX + 7; x++) {
    if (p.get(x, y) === colorIndex('skin0')) p.px(x, y, 'skin1');
  }
  // Features move down the face when the head tips forward to look at something held.
  const y = TOP + (GAZES[gaze].pitch || 0);
  const both = (x, yy, c) => p.px(x, yy, c).px(mirror(x), yy, c);
  // A tired, quiet face: relaxed brows; the eyes look where the pose says.
  const by = y + (GAZES[gaze].brow || 0);
  for (let x = 79; x <= 83; x++) both(x, by + 11, 'hair2');
  both(78, by + 12, 'hair2');
  if (kind === 'square') for (let x = 80; x <= 83; x++) both(x, by + 12, 'hair2');
  eyes(p, gaze, y);
  // Nose: a lit bridge and a short shadow under the tip, nothing joined
  p.vline(86, y + 18, y + 20, 'skin3');
  p.vline(89, y + 21, y + 22, 'skin1').hline(87, 88, y + 23, 'skin1');
  // Mouth: short, low-contrast, level corners; slightly open when talking
  if (GAZES[gaze].talk) p.hline(86, 89, y + 26, 'skin1').hline(87, 88, y + 27, 'skin0').hline(87, 88, y + 28, 'skin3');
  else p.hline(86, 89, y + 26, 'skin1').hline(87, 88, y + 27, 'skin3');
  return p.anchor('eyeL', 79, y + 16).anchor('eyeR', mirror(83), y + 16);
}

// Where the eyes look. Lowered gazes show lids over a sliver of iris; open ones a
// relaxed lid with white either side. Iris columns are within each 5-wide eye.
const GAZES = {
  down: { open: false, iris: [[2, 3], [1, 2]] },        // at the counter
  downLeft: { open: false, iris: [[1, 2], [0, 1]] },    // at the register
  downRight: { open: false, iris: [[3, 4], [3, 4]] },   // at the card terminal, down and right
  phoneSide: { open: true, iris: [[3, 4], [2, 3]], talk: true }, // past the phone at the ear, level, talking
  phone: { open: false, iris: [[2, 3], [1, 2]], pitch: 2, brow: 1 }, // at something held low: the head tips forward
  clerk: { open: true, iris: [[2, 3], [1, 2]], brow: -1 }, // at the clerk, brows lifted a little
  left: { open: true, iris: [[0, 1], [0, 1]] },         // across the shop
};
function eyes(p, gaze, y) {
  const g = GAZES[gaze];
  [79, mirror(83)].forEach((e, i) => {
    const [a, b] = g.iris[i], outer = i ? e + 4 : e;
    if (g.open) {
      p.hline(e + 1, e + 3, y + 14, 'skin1').hline(e, e + 4, y + 15, 'eye0');
      p.hline(e, e + 4, y + 16, 'skin3').px(outer, y + 16, 'skin1');
      p.px(e + a, y + 16, 'eye1').px(e + b, y + 16, 'eye0');
      p.hline(e + 1, e + 3, y + 17, 'skin1');
    } else {
      p.hline(e + 1, e + 3, y + 15, 'skin1').hline(e, e + 4, y + 16, 'eye0');
      p.px(e + a, y + 17, 'eye0').px(e + b, y + 17, 'eye0');
      p.hline(i ? e : e + 1, i ? e + 3 : e + 4, y + 18, 'skin1');
    }
  });
}

// ------------------------------------------------------------------ hair
const HAIR_LIGHT = normals.sphere(CX - 3, TOP + 18, 18, 24);

function groom(p, { crownX = 82, crownY = TOP - 1, sheen = [CX - 1, TOP + 17, 13, 12] } = {}) {
  const inside = (x, y) => p.get(x, y);
  // Strands fall from the crown; a few lighter strands on the lit side.
  for (let i = -9; i <= 9; i++) {
    const tx = CX + i * 4, ty = TOP + 60;
    for (let s = 3; s < 60; s++) {
      const x = Math.round(crownX + (tx - crownX) * s / 60), yy = Math.round(crownY + (ty - crownY) * s / 60);
      if (inside(x, yy) && (s + i * 3) % 7 !== 0) p.px(x, yy, i < -2 && s % 9 === 0 ? 'hair3' : 'hair1');
    }
  }
  const [sx, sy, rx, ry] = sheen;                                    // the sheen band
  for (let a = 196; a <= 286; a += 2) {
    const r = a * Math.PI / 180;
    for (const k of [0, 1]) {
      const x = Math.round(sx + Math.cos(r) * (rx - k)), yy = Math.round(sy + Math.sin(r) * (ry - k));
      if (inside(x, yy)) p.px(x, yy, (a + k) % 6 < 4 ? 'hair3' : 'hair2');
    }
  }
}

function finishHair(p, options) {
  p.light('hair2', HAIR, HAIR_LIGHT);
  groom(p, options);
  p.outlineBy({ hair1: 'hair0', hair2: 'hair0', hair3: 'hair0' });
  return p;
}

// Long hair with a side part on the viewer's left; the fringe sweeps right.
function hairLongFront() {
  const p = canvas();
  // Fringe edge: sits above the brows, dipping only at the far temple.
  const fringe = x => TOP + 8 + Math.max(0, x - 77) * 0.15 + Math.max(0, x - 95) * 0.8;
  fill(p, 'hair2', (x, y) => {
    const cap = inEllipse(CX - 0.5, TOP + 18, 15, 19)(x, y);
    const face = x > 75 && x < 101 && y > fringe(x);
    // Curtains frame the cheeks, tuck in under the jaw and spread toward the shoulders;
    // their ends are ragged rather than cut straight.
    const drop = y - (TOP + 30), ragged = (x * 7) % 5;
    const left = x > 72 - Math.max(0, drop) * 0.22 && x < (drop > 0 ? 76 : 78) && y > TOP + 14 && y < TOP + 60 - ragged;
    const right = x > (drop > 0 ? 99 : 98) && x < 104 + Math.max(0, drop) * 0.25 && y > TOP + 16 && y < TOP + 57 - ragged;
    const curtains = left || right;
    return (cap && !face && y < TOP + 30) || curtains;
  });
  p.line(81, TOP - 1, 77, TOP + 8, 'hair0');                         // the parting
  finishHair(p, { crownX: 80 });
  return curtainStrands(p, [[70, 78], [98, 112]], TOP + 26);
}

// Vertical strands on hanging hair below y0: lit side (viewer's left) catches highlights.
function curtainStrands(p, ranges, y0) {
  const outline = colorIndex('hair0');
  for (const [x0, x1] of ranges) for (let x = x0 + 1; x < x1 - 1; x++) {
    const lit = x < CX;
    for (let y = y0; y < H; y++) {
      const v = p.get(x, y);
      if (!v || v === outline) continue;                           // empty, or the outline
      const band = (x * 5 + (y >> 3)) % 4;
      p.px(x, y, band === 0 ? 'hair1' : band === 1 && lit && (y + x) % 5 ? 'hair3' : 'hair2');
    }
  }
  return p;
}

function hairLongBack() {
  const p = canvas();
  fill(p, 'hair2', (x, y) => inEllipse(CX - 0.5, TOP + 20, 17, 21)(x, y) ||
    (x > 69 && x < 107 && y > TOP + 20 && y < TOP + 82 - Math.abs(x - CX + 0.5) * 0.8));
  return finishHair(p, { crownX: 84, crownY: TOP, sheen: [CX - 1, TOP + 18, 15, 14] });
}

// The face window: below the hairline and between the temples hair stays off the face.
const onFace = (x, y, hairline) => x > 76 && x < 100 && y > hairline;
function hairPart(test, options) {
  const p = canvas();
  fill(p, 'hair2', test);
  return finishHair(p, options);
}

// Chin-length bob with a blunt fringe just above the brows.
function hairBob() {
  return hairPart((x, y) => {
    const cap = inEllipse(CX - 0.5, TOP + 17, 16, 19)(x, y) && y < TOP + 20;
    const sides = x > 70 && x < 106 && y > TOP + 12 && y < TOP + 35 - (x < 73 || x > 103 ? 1 : 0);
    const jaw = y > TOP + 28 ? 2 : 0;
    return (cap || sides) && !(x > 76 + jaw && x < 100 - jaw && y > TOP + 9.5);
  }, { crownX: CX - 3, sheen: [CX - 1, TOP + 16, 14, 12] });
}

function hairBobBack() {
  return hairPart((x, y) => inEllipse(CX - 0.5, TOP + 18, 17, 20)(x, y) || (x > 70 && x < 106 && y > TOP + 18 && y < TOP + 35),
    { crownX: CX, crownY: TOP });
}

// Short, neat, swept to the viewer's right with sideburns.
function hairShort() {
  return hairPart((x, y) => {
    const cap = (inEllipse(CX - 0.5, TOP + 14, 14.5, 16)(x, y) && y < TOP + 16) || inEllipse(CX - 2, TOP + 4, 13, 7)(x, y);
    return cap && !onFace(x, y, x < 78 || x > 97 ? TOP + 15 : TOP + 5 + (x - 78) * 0.12);
  }, { crownX: 80 });
}

// Close crop: a thin layer over the skull with skin showing through.
function hairBuzz() {
  const p = canvas();
  fill(p, 'hair2', (x, y) => inEllipse(CX - 0.5, TOP + 15, 13.5, 16.5)(x, y) && y < TOP + 14 &&
    !onFace(x, y, x < 77 || x > 98 ? TOP + 13 : x < 79 || x > 96 ? TOP + 7 : TOP + 4));
  p.light('hair2', HAIR, HAIR_LIGHT);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p.get(x, y) && (x * 3 + y) % 4 === 0) p.px(x, y, 'skin1');
  return p.outlineBy({ hair1: 'hair0', hair2: 'hair0', hair3: 'hair0', skin1: 'hair0' });
}

// Unkempt: tufts on top and an uneven fringe.
function hairMessy() {
  return hairPart((x, y) => {
    const k = Math.floor(x / 4);
    const cap = inEllipse(CX - 0.5, TOP + 15, 15, 17)(x, y) && y < TOP + 17;
    const tufts = x > 74 && x < 102 && y < TOP + 4 && y > TOP - [3, 6, 4, 7, 5][k % 5] + Math.abs((x % 4) - 2) * 1.5;
    const hairline = x < 78 || x > 97 ? TOP + 16 : TOP + 7 + [0, 3, 1, 4, 2, 0, 3][k % 7] * (x % 4 < 2 ? 1 : 0.5);
    return (cap || tufts) && !onFace(x, y, hairline);
  }, { crownX: CX + 2, crownY: TOP - 3 });
}

// Pulled back into a bun on top, centre part.
function hairBun() {
  return hairPart((x, y) => {
    const cap = inEllipse(CX - 0.5, TOP + 15, 14, 16.5)(x, y) && y < TOP + 14;
    const bun = inEllipse(CX - 0.5, TOP - 3, 7, 5)(x, y);
    return (cap || bun) && !onFace(x, y, x < 79 || x > 96 ? TOP + 9 : TOP + 4 + Math.abs(x - CX) * 0.15);
  }, { crownX: CX, crownY: TOP - 3 });
}

const ACCENT = ['accent0', 'accent1', 'accent2'];

// Baseball cap in the accent colour; the camera is just below the brim, so its
// dark underside shows. Short hair at the temples.
function hairCap() {
  const p = hairPart((x, y) => ((x > 73 && x < 78) || (x > 97 && x < 102)) && y > TOP + 7 && y < TOP + 16, {});
  const c = canvas();
  fill(c, 'accent1', (x, y) => inEllipse(CX - 0.5, TOP + 11, 15.5, 13)(x, y) && y < TOP + 9);
  c.light('accent1', ACCENT, normals.sphere(CX - 3, TOP + 8, 16, 14), { outline: 'accent0' });
  c.vline(CX - 1, TOP, TOP + 7, 'accent0').hline(CX - 2, CX - 1, TOP - 2, 'accent2');      // front seam, button
  for (let x = 71; x <= 104; x++) {
    const u = (x - CX + 0.5) / 17, drop = Math.round(1 - u * u);
    c.px(x, TOP + 8, 'accent2').vline(x, TOP + 9, TOP + 9 + drop, 'accent0');
  }
  return merge(p, c);
}

// Knit beanie with a ribbed cuff; hair falls below it to the jaw.
function hairBeanie() {
  const p = hairPart((x, y) => inEllipse(CX - 0.5, TOP + 16, 15.5, 17)(x, y) && y < TOP + 26 && !onFace(x, y, TOP + 11), { crownX: CX });
  const b = canvas();
  fill(b, 'accent1', (x, y) => inEllipse(CX - 0.5, TOP + 8, 16, 12)(x, y) && y < TOP + 6);
  b.light('accent1', ACCENT, normals.sphere(CX - 3, TOP + 2, 16, 12), { outline: 'accent0' });
  for (let y = TOP + 5; y <= TOP + 10; y++) for (let x = 72; x <= 103; x++) b.px(x, y, x % 3 === 0 ? 'accent0' : x < CX ? 'accent2' : 'accent1');
  b.hline(72, 103, TOP + 10, 'accent0').vline(71, TOP + 5, TOP + 10, 'accent0').vline(104, TOP + 5, TOP + 10, 'accent0');
  return merge(p, b);
}

// Curly textures: small lit arcs over a bumpy silhouette.
function curls(p, step) {
  const edge = colorIndex('hair0');
  for (let y = 0; y < H; y += step) for (let x = (y / step) % 2 ? step >> 1 : 0; x < W; x += step) {
    if (!p.get(x, y) || !p.get(x + 1, y + 1) || p.get(x, y) === edge) continue;
    p.px(x, y, x < CX ? 'hair3' : 'hair2').px(x + 1, y, 'hair2').px(x + 1, y + 1, 'hair1').px(x, y + 1, 'hair1');
  }
}
const bumpy = (cx, cy, rx, ry, lobes, depth) => (x, y) => {
  const a = Math.atan2(y - cy, x - cx), k = 1 + depth * Math.sin(a * lobes);
  return inEllipse(cx, cy, rx * k, ry * k)(x, y);
};
function curlyPart(test, step) {
  const p = canvas();
  fill(p, 'hair2', test);
  p.light('hair2', HAIR, HAIR_LIGHT);
  curls(p, step);
  return p.outlineBy({ hair1: 'hair0', hair2: 'hair0', hair3: 'hair0' });
}

// Big natural curls framing the face down to the jaw.
function hairCurly() {
  return curlyPart((x, y) => bumpy(CX - 0.5, TOP + 16, 22, 23, 11, 0.06)(x, y) && y < TOP + 38 &&
    !onFace(x, y, x < 79 || x > 96 ? TOP + 12 : TOP + 7 + ((x >> 1) % 2)), 4);
}

// A short set perm, tight curls above the ears.
function hairPerm() {
  return curlyPart((x, y) => bumpy(CX - 0.5, TOP + 11, 16, 14, 14, 0.07)(x, y) && y < TOP + 16 &&
    !onFace(x, y, x < 78 || x > 97 ? TOP + 14 : TOP + 6), 3);
}

// Undercut: clipped sides with skin showing, a long top swept back and up.
function hairSwept() {
  const p = canvas();
  fill(p, 'hair2', (x, y) => inEllipse(CX - 0.5, TOP + 14, 13.5, 16)(x, y) && y < TOP + 14 && (x < 78 || x > 97) && y > TOP + 4);
  p.light('hair2', HAIR, HAIR_LIGHT);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p.get(x, y) && (x * 3 + y) % 3 === 0) p.px(x, y, 'skin1');
  const top = canvas();
  fill(top, 'hair2', (x, y) => inEllipse(CX - 1, TOP + 3, 14, 9)(x, y) && y < TOP + 7);
  top.light('hair2', HAIR, normals.sphere(CX - 4, TOP - 2, 15, 10));
  for (let i = -4; i <= 4; i++) for (let x = 0; x < W; x++) {
    const y = Math.round(TOP + 4 + i * 2 - (x - CX) ** 2 / 90);
    if (top.get(x, y) && (x + i) % 5) top.px(x, y, i < 0 ? 'hair3' : 'hair1');
  }
  merge(p, top);
  return p.outlineBy({ hair1: 'hair0', hair2: 'hair0', hair3: 'hair0', skin1: 'hair0' });
}

const HAIRS = {
  long: hairLongFront, bob: hairBob, short: hairShort, buzz: hairBuzz, messy: hairMessy, bun: hairBun,
  cap: hairCap, beanie: hairBeanie, curly: hairCurly, perm: hairPerm, swept: hairSwept,
};

// ------------------------------------------------------------------ figure rig
// Each figure is a simple skeleton in metres, posed against the counter and
// projected with the store camera (js/content/space.js). Landmark heights are
// standard fractions of body height, so taller and shorter figures get their own
// shoulders, chest and elbows instead of a stretched template, and the arms bend
// and foreshorten correctly as they reach forward to the counter.
const BODY_Z = space.customer.z;
const [OX, OY] = space.customerOrigin();
const PX = space.scaleAt(BODY_Z);                                     // pixels per metre in the body plane
const v3 = sculpt.vec;
// A point in metres to canvas pixels.
function toCanvas([X, Y, Z]) {
  const [sx, sy] = space.project(X, Y, Z);
  return [Math.round(sx - OX), Math.round(sy - OY)];
}

// Half-widths, depths and the upper-arm radius in metres, measured from the
// reference body (docs/character-assets.md): against the fixed head (0.155 m wide)
// the shoulders' outline is about 2.5 head widths across, the neck about 0.65, the
// hanging arms stand a little off the body. Arms are about 0.86 of anatomical
// length, as in the reference, yet still long enough to rest a hand on the counter;
// the fingertips reach mid-thigh.
// `hand` scales the hand, `armLength` the arms; a person may set their own `arms` and `hands` factors.
const BUILDS = {
  slim: { shoulder: 0.165, chest: 0.128, chestDepth: 0.082, waist: 0.105, waistDepth: 0.072, hip: 0.12, neck: 0.046, arm: 0.032, belly: 0, hand: 0.95, armLength: 0.88 },
  average: { shoulder: 0.18, chest: 0.148, chestDepth: 0.09, waist: 0.11, waistDepth: 0.08, hip: 0.132, neck: 0.05, arm: 0.036, belly: 0, hand: 1, armLength: 0.86 },
  broad: { shoulder: 0.205, chest: 0.165, chestDepth: 0.104, waist: 0.145, waistDepth: 0.09, hip: 0.15, neck: 0.056, arm: 0.042, belly: 0.006, hand: 1.06, armLength: 0.85 },
  heavy: { shoulder: 0.2, chest: 0.18, chestDepth: 0.128, waist: 0.18, waistDepth: 0.118, hip: 0.18, neck: 0.06, arm: 0.047, belly: 0.03, hand: 1.06, armLength: 0.84 },
};

// Landmarks hang from the chin: the head sprite is a fixed size (about 0.22 m), so
// the neck is a fixed length below it. Height differences go mostly into the legs:
// the trunk takes a quarter of them. Values are heights in metres.
//
// A pose may drop either shoulder (metres, [left, right]), bring both forward, lean
// the upper body from the hips (`lean` = [toward the viewer's right, toward the
// counter] in radians) and shift it sideways (`shift`, metres). The head sprite
// follows by `headOffset` pixels, or by the fraction `headFollow` of that.
const HEAD_M = HEAD_H / PX;
function rigFor(person, pose = {}) {
  const h = person.height, b = BUILDS[person.build], dy = space.figureOffset(h);
  const drop = pose.drop || [0, 0], forward = pose.forward || 0, [roll, pitch] = pose.lean || [0, 0], shift = pose.shift || 0;
  const [armLength, armWidth] = [(person.arms?.[0] ?? 1) * b.armLength, person.arms?.[1] ?? 1];
  // The trunk is drawn a little shorter than anatomy (0.87), as in the reference body.
  const chin = h - HEAD_M, notch = chin - 0.078, s = 0.87 * (1 + 0.25 * (h - 1.68) / 0.49);   // 0.49 m: neck to hip at 1.68 m
  const hip = notch - 0.49 * s, pivot = [0, hip, BODY_Z];
  const turn = (p, a, c) => {                                          // roll a, then pitch c, about the hips
    let [x, y, z] = v3.sub(p, pivot);
    [x, y] = [x * Math.cos(a) + y * Math.sin(a), -x * Math.sin(a) + y * Math.cos(a)];
    [y, z] = [y * Math.cos(c) + z * Math.sin(c), z * Math.cos(c) - y * Math.sin(c)];
    return v3.add([x + shift, y, z], pivot);
  };
  const lean = p => turn(p, roll, pitch);
  const unlean = p => {                                                // the inverse: unpitch, then unroll
    let [x, y, z] = v3.sub(p, pivot);
    x -= shift;
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), z * Math.cos(pitch) + y * Math.sin(pitch)];
    [x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
    return v3.add([x, y, z], pivot);
  };
  const chinPoint = [0, chin, BODY_Z - 0.03];
  const [c0, c1] = [toCanvas(chinPoint), toCanvas(lean(chinPoint))], follow = pose.headFollow ?? 1;
  return {
    h, b, dy, person, s, dropM: drop, lean, unlean, headOffset: [Math.round((c1[0] - c0[0]) * follow), Math.round((c1[1] - c0[1]) * follow)],
    chin, notch, chest: notch - 0.165 * s, waist: notch - 0.355 * s, hip,
    upper: 0.186 * h * armLength, fore: 0.146 * h * armLength, arm: b.arm * armWidth, hand: b.hand * h / 1.7 * (0.5 + armLength / 2),
    handLength: (person.hands?.[0] ?? 1), handWidth: (person.hands?.[1] ?? 1), legs: person.legs || 'navy',
    shoulderJoint: side => lean([side * (b.shoulder - 0.04), notch - 0.036 - drop[side < 0 ? 0 : 1], BODY_Z - forward]),
  };
}

// Two-bone IK: the elbow for shoulder S and wrist W, bending toward `pole`.
function solveArm(S, W, upper, fore, pole) {
  let d = v3.sub(W, S), len = v3.len(d);
  const reach = upper + fore - 0.005;
  if (len > reach) { W = v3.add(S, v3.mul(d, reach / len)); d = v3.sub(W, S); len = reach; }
  const u = v3.mul(d, 1 / len);
  const along = (upper * upper - fore * fore + len * len) / (2 * len);
  const out = Math.sqrt(Math.max(0, upper * upper - along * along));
  let v = v3.sub(pole, v3.mul(u, v3.dot(pole, u)));
  v = v3.mul(v, 1 / v3.len(v));
  return { S, E: v3.add(S, v3.add(v3.mul(u, along), v3.mul(v, out))), W };
}

// ------------------------------------------------------------------ poses
// A pose gives each arm a use, where the eyes look, how the shoulders sit and how
// the upper body leans or shifts; elbows, foreshortening, hands and what crosses
// the counter follow from the rig. Arm uses:
//   'rest'  the hand lies on the counter at [x, z], optionally turned onto its side
//   'hang'  the arm hangs, the hand below the counter
//   'ear'   an open flip phone held to the ear
//   'hold'  both hands hold an open flip phone low in front, thumbs on the keys
//   'hold1' one hand holds the open flip phone low in front, thumb on the keys
//   'reach' a bank card held out toward the clerk
//   'swipe' a bank card standing in the card terminal's top slot, held by its edge
//   'take'  an open hand out over the counter, palm up, for change or a receipt
const POSES = {
  'stand': { gaze: 'clerk', left: ['hang'], right: ['hang'] },
  'one-rest': { gaze: 'down', left: ['rest', [-0.07, 1.04]], right: ['hang'], lean: [0, 0.03], shift: -0.007 },
  'both-rest': { gaze: 'downLeft', left: ['rest', [-0.15, 1.06]], right: ['rest', [0.16, 1.08]], drop: [0, 0.01], lean: [0.015, 0.05] },
  'phone-call': { gaze: 'phoneSide', left: ['rest', [-0.07, 1.04]], right: ['ear'], drop: [0.012, 0.011], lean: [0.035, 0], shift: 0.007, headFollow: 0.5 },
  'phone-check': { gaze: 'phone', left: ['hold'], right: ['hold'], drop: [0.01, 0.01], forward: 0.02, lean: [0, 0.05] },
  'phone-one': { gaze: 'phone', left: ['hang'], right: ['hold1'], drop: [0.008, 0], lean: [0.01, 0.05], shift: 0.004 },
  'card': { gaze: 'clerk', left: ['hang'], right: ['reach'], drop: [0.006, 0], lean: [0, 0.06] },
  'card-reader': { gaze: 'downRight', left: ['rest', [-0.08, 1.05]], right: ['swipe'], drop: [0.004, 0], lean: [0, 0.03] },
  'receive': { gaze: 'clerk', left: ['rest', [-0.09, 1.06]], right: ['take'], lean: [0, 0.05], shift: 0.004 },
};

// The ear on the head sprite; a phone held there sits a little in front of it.
const EAR = { x: CX + 12, y: TOP + 17 };
// The point at depth Z that projects onto canvas pixel (x, y).
function fromCanvas(x, y, Z) {
  const { vx, vy, k, eyeY } = space.camera;
  return [(x + OX + 0.5 - vx) * Z / k, eyeY - (y + OY + 0.5 - vy) * Z / k, Z];
}

// Props in metres (half extents): each half of a 2005 flip phone, and a bank card.
const FLIP = [0.0235, 0.0425, 0.0045], CARD = [0.043, 0.027, 0.0012];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// An open flip phone hinged at `hinge`: the keypad half runs along `low`, the lid
// along `lid`; `inner` is the keypad's face (the lid's screen faces back along it).
function flipPhone(hinge, low, lid, width) {
  const keypad = v3.norm(cross(width, low)), screen = v3.norm(cross(lid, width));
  return {
    kind: 'phone',
    halves: [
      { part: 'keypad', c: v3.add(hinge, v3.mul(low, FLIP[1])), axes: [width, low, keypad] },
      { part: 'lid', c: v3.add(hinge, v3.mul(lid, FLIP[1])), axes: [width, lid, screen] },
    ],
  };
}

// One arm of a pose: shoulder, elbow and wrist in metres plus the hand's frame
// (f: toward the fingers, n: back of the hand, r: toward the thumb) and anything
// held. side -1 is the viewer's left.
// A hand frame that a real hand can make: f toward the fingers, n out of the back
// of the hand, and the thumb r on the side anatomy puts it for that hand (side -1
// is the person's right hand, seen on the viewer's left).
function handFrame(f, n, side) {
  f = v3.norm(f);
  n = v3.norm(v3.sub(n, v3.mul(f, v3.dot(n, f))));
  return { f, n, r: v3.mul(v3.norm(cross(n, f)), side) };
}

// Keep the hand within the wrist's range against the forearm (elbow E to wrist W):
// at most 25 degrees toward the thumb or little finger, and 70 toward the back of
// the hand or the palm. Past that the hand turns back toward the forearm.
const DEG = Math.PI / 180;
const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, v3.dot(a, b))));
function turnToward(a, b, by) {
  const perp = v3.sub(b, v3.mul(a, v3.dot(a, b)));
  if (v3.len(perp) < 1e-6) return a;
  return v3.add(v3.mul(a, Math.cos(by)), v3.mul(v3.norm(perp), Math.sin(by)));
}
function limitWrist(hand, E, W, side) {
  const u = v3.norm(v3.sub(W, E));
  let { f } = hand;
  const flat = v3.sub(u, v3.mul(hand.n, v3.dot(u, hand.n)));
  if (v3.len(flat) > 1e-6 && angle(f, v3.norm(flat)) > 25 * DEG) f = turnToward(f, v3.norm(flat), angle(f, v3.norm(flat)) - 25 * DEG);
  if (angle(f, u) > 70 * DEG) f = turnToward(f, u, angle(f, u) - 70 * DEG);
  return { ...hand, ...handFrame(f, hand.n, side) };
}

function armPose(R, side, [mode, at]) {
  const S = R.shoulderJoint(side), hs = R.hand, inward = [-side, 0, 0];
  // Solve the arm, then keep the hand within the wrist's range. A hand that holds
  // something (`grip`: the point it holds, `reach`: how far that is from the wrist
  // along the fingers) has its wrist placed again and the arm solved again.
  const solve = (W, pole, hand, prop, grip) => {
    let A = solveArm(S, grip ? v3.sub(grip.at, v3.mul(hand.f, grip.reach)) : W, R.upper, R.fore, pole);
    for (let i = 0; i < 3; i++) {
      hand = { ...hand, ...limitWrist(hand, A.E, A.W, side) };
      if (grip) A = solveArm(S, v3.sub(grip.at, v3.mul(hand.f, grip.reach)), R.upper, R.fore, pole);
    }
    return { mode, side, hand, prop, ...A };
  };
  const frame = (f, n) => handFrame(f, n, side);
  switch (mode) {
    case 'rest': {
      // Wrist just above the laminate; the hand lies relaxed, turned in toward the
      // middle, fingers loosely curled and together, so the wrist bends gently into
      // it. at[2] turns the hand onto its little-finger side.
      const W = [at[0], space.counter.y + 0.022, at[1]];
      const f = [0.4 * -side, 0, -1], tilt = at[2] || 0;
      const hand = frame(f, v3.add([0, Math.cos(tilt), 0], v3.mul(inward, -Math.sin(tilt))));
      return solve(W, [side * 0.15, -0.6, 1], { ...hand, curl: tilt ? [0.9, 0.8] : [0.45, 0.55] });
    }
    case 'hold': {
      // The flip phone open at the lower chest: the keypad half lies in both hands,
      // the hinge toward the clerk, the lid standing up with its screen toward the
      // face (the clerk sees the lid's back and its little outer display). Each hand
      // cradles a side from beneath; thumbs on the keys, not mirrored.
      const hinge = R.lean([0, R.chest - 0.005, BODY_Z - 0.3]);
      const prop = flipPhone(hinge, v3.norm([0, -0.35, 0.94]), v3.norm([0, 0.95, 0.3]), [1, 0, 0]);
      const kp = prop.halves[0], [pw, low, up] = kp.axes;
      const palm = v3.add(kp.c, v3.add(v3.mul(pw, side * 0.033), v3.add(v3.mul(up, -0.014), v3.mul(low, 0.008 + (side < 0 ? 0.008 : 0)))));
      const hand = frame(v3.mul(pw, -side), v3.mul(up, -1));
      const on = (w, l) => v3.add(kp.c, v3.add(v3.mul(up, FLIP[2] + 0.006), v3.add(v3.mul(pw, side * w), v3.mul(low, l))));
      const thumb = side < 0 ? [on(0.028, 0.02), on(0.014, -0.004)] : [on(0.028, 0.014), on(0.005, 0.012)];
      return solve(null, [side * 0.3, -1, 0.5], { ...hand, curl: [0.15, 0.2], thumb }, side > 0 ? prop : null, { at: palm, reach: 0.05 * hs * R.handLength });
    }
    case 'ear': {
      // The lid against the ear, the keypad half angled down toward the mouth; the
      // hand holds the keypad half from outside, fingers up along the lid's back.
      const [hx, hy] = R.headOffset;
      const ear = fromCanvas((side > 0 ? EAR.x + 1 : mirror(EAR.x + 1)) + hx, EAR.y + R.dy + hy, BODY_Z - 0.02);
      const lid = v3.norm([0, 0.96, 0.28]), out = v3.norm([side * 0.75, 0, -0.66]);
      const width = v3.norm(cross(out, lid));
      const hinge = v3.add(ear, v3.add(v3.mul(lid, -FLIP[1]), v3.mul(out, 0.012)));
      const prop = flipPhone(hinge, v3.norm([-side * 0.3, -0.5, -0.8]), lid, width);
      const palm = v3.add(hinge, v3.add(v3.mul(out, 0.022), v3.mul(lid, -0.012)));
      const hand = frame(lid, out);
      return solve(null, [side * 0.4, -1, -0.45], { ...hand, curl: [0.35, 0.45] }, prop, { at: palm, reach: 0.05 * hs * R.handLength });
    }
    case 'reach': {
      // The hand well out over the counter toward the clerk, the elbow kept back so
      // the forearm foreshortens. The card is pinched by one narrow end between thumb
      // and index finger, its length pointing on toward the clerk, face up.
      const W = [side * 0.06, space.counter.y + 0.2, Math.max(0.82, BODY_Z - 0.62 * (R.upper + R.fore) - 0.04)];
      const hand = frame([-side * 0.3, -0.12, -1], [side, 0.25, 0]);
      const pinch = v3.add(W, v3.add(v3.mul(hand.f, 0.085 * hs * R.handLength), v3.mul(hand.r, 0.014 * hs)));
      const long = v3.norm([-side * 0.25, -0.25, -1]), face = v3.norm(v3.sub([0, 1, 0], v3.mul(long, v3.dot([0, 1, 0], long))));
      const prop = { kind: 'card', c: v3.add(pinch, v3.mul(long, CARD[0] - 0.008)), axes: [long, cross(face, long), face] };
      return solve(W, [side * 0.5, -1, 0.6], { ...hand, curl: [1.1, 0.9], thumbTip: v3.add(pinch, v3.mul(face, 0.006)) }, prop);
    }
    case 'hold1': {
      // One hand holds the open flip phone low in front: the keypad half lies along
      // the palm, the fingers curl up round its sides, the thumb is on the keys.
      const hinge = R.lean([side * 0.03, R.chest - 0.02, BODY_Z - 0.28]);
      const prop = flipPhone(hinge, v3.norm([0, -0.35, 0.94]), v3.norm([0, 0.95, 0.3]), [1, 0, 0]);
      const kp = prop.halves[0], [, low, up] = kp.axes;
      const palm = v3.add(kp.c, v3.add(v3.mul(up, -0.017), v3.mul(low, 0.01)));
      const hand = frame(v3.mul(low, -1), v3.mul(up, -1));
      const thumbTip = v3.add(kp.c, v3.add(v3.mul(up, FLIP[2] + 0.006), v3.mul(low, -0.008)));
      return solve(null, [side * 0.4, -1, 0.5], { ...hand, curl: [0.6, 0.5], thumbTip }, prop, { at: palm, reach: 0.05 * hs * R.handLength });
    }
    case 'swipe': {
      // The card stands in the slot on top of the terminal, its face to the clerk,
      // its upper half showing; the hand comes from the side and pinches its outer
      // edge, so most of the card stays in view.
      const t = space.fixtures.terminal[0], top = space.counter.y + t.h;
      const card = [t.x, top + CARD[1] * 0.15, t.z + 0.01];
      const pinch = v3.add(card, [side * (CARD[0] + 0.004), CARD[1] * 0.45, 0.006]);
      const hand = frame([-side, -0.45, -0.25], [0, 0.35, 1]);
      const prop = { kind: 'card', c: card, axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], above: top };
      return solve(null, [side * 0.6, -1, 0.4], { ...hand, curl: [1, 0.8], thumbTip: v3.add(pinch, [0, 0, -0.007]) }, prop, { at: pinch, reach: 0.08 * hs * R.handLength });
    }
    case 'take': {
      // The hand out over the counter, palm up and loosely cupped, fingers toward
      // the clerk; whatever is handed over sits at the 'palm' anchor.
      const W = [side * 0.07, space.counter.y + 0.13, Math.max(0.9, BODY_Z - 0.55 * (R.upper + R.fore))];
      const hand = frame([-side * 0.25, 0.05, -1], [0, -1, 0]);
      return solve(W, [side * 0.5, -1, 0.5], { ...hand, curl: [0.25, 0.35] });
    }
    default: {
      const E = v3.add(S, [side * 0.04, -R.upper * 0.99, -0.02]);
      const W = v3.add(E, [side * 0.018, -R.fore * 0.96, -0.06]);
      return { mode, side, S, E, W, hand: { ...handFrame(v3.sub(W, E), [side, 0, 0], side), curl: [0.5, 0.5] } };
    }
  }
}

// ------------------------------------------------------------------ the sculpted body
// The body is one signed-distance field (art/tools/sculpt.cjs), in metres and scaled
// to height: neck, trapezius, upper chest, ribcage, waist and hips blend into one
// torso with the deltoids; the arms blend into the deltoids near the shoulder only,
// so the shoulder line runs on into the arm while an arm hanging beside the body
// stays separate from it. Held props are part of the same field.
const SHOULDER_BLEND = 0.11;                                         // metres around the deltoid where arm and torso merge
const lerp = (a, b, t) => v3.add(a, v3.mul(v3.sub(b, a), t));

function deltoidCentre(R, A) {
  return sculpt.vec.add(A.S, [A.side * 0.008, -0.004, 0]);
}

// An arm: the upper arm full under the deltoid and slimmer above the elbow; the
// elbow point standing out on the outside of the bend; the forearm fullest just
// below the elbow, tapering to the wrist; the sleeve running a little past it.
function armField(A, b, pad) {             // b: the arm radius
  const { cone, smin } = sculpt, r = b;
  const mid = lerp(A.S, A.E, 0.45), fore = lerp(A.E, A.W, 0.3);
  const u = v3.norm(v3.sub(A.W, A.E)), cuff = v3.add(A.W, v3.mul(u, 0.012));
  const inside = v3.add(v3.norm(v3.sub(A.S, A.E)), u), bent = v3.len(inside) > 0.3;
  const tip = bent ? v3.sub(A.E, v3.mul(v3.norm(inside), r * 0.34)) : A.E;
  return p => {
    let d = smin(cone(p, A.S, mid, r * 1.02 + pad, r * 0.86 + pad), cone(p, mid, A.E, r * 0.86 + pad, r * 0.66 + pad), 0.008);
    d = smin(d, cone(p, A.E, fore, r * 0.74 + pad, r * 0.8 + pad), 0.01);
    d = smin(d, cone(p, fore, cuff, r * 0.8 + pad, r * 0.55 + pad), 0.01);
    if (bent) d = smin(d, v3.len(v3.sub(p, tip)) - r * 0.42 - pad, 0.006);
    return d;
  };
}

// A hand, kept simple: palm, the four fingers as one slightly curled block (their
// partings are painted), and the thumb. Its frame is anatomical (handFrame) and
// kept within the wrist's range (limitWrist). hl and hw scale its length and width.
function handParts(A, hl, hw) {
  const { cone, ellipsoid, box, local } = sculpt;
  const { f, n, r } = A.hand, [c1, c2] = A.hand.curl || [0.4, 0.5], W = A.W;
  const at = (a, b, c) => v3.add(W, v3.add(v3.mul(f, a * hl), v3.add(v3.mul(r, b * hw), v3.mul(n, c * hw))));
  const palmC = at(0.048, 0, -0.002);
  const bend = a => ({ dir: v3.norm(v3.sub(v3.mul(f, Math.cos(a)), v3.mul(n, Math.sin(a)))), up: v3.norm(v3.add(v3.mul(n, Math.cos(a)), v3.mul(f, Math.sin(a)))) });
  const K = at(0.088, -0.002, -0.002), b1 = bend(c1), b2 = bend(c1 + c2);
  const J = v3.add(K, v3.mul(b1.dir, 0.042 * hl));
  const seg1 = v3.add(K, v3.mul(b1.dir, 0.021 * hl)), seg2 = v3.add(J, v3.mul(b2.dir, 0.016 * hl));
  const [B, T] = A.hand.thumb || [at(0.025, 0.032, -0.006),
    A.hand.thumbTip || v3.add(at(0.025, 0.032, -0.006), v3.mul(v3.norm(v3.add(v3.mul(f, 0.55), v3.add(v3.mul(r, 0.55), v3.mul(n, -0.35)))), 0.05 * hl))];
  const M = v3.add(lerp(B, T, 0.5), v3.mul(r, 0.004 * hw));
  return [
    p => ellipsoid(local(p, palmC, [r, n, f]), [0, 0, 0], [0.042 * hw, 0.0135 * hw, 0.046 * hl]),
    p => cone(p, at(-0.015, 0, 0), at(0.02, 0, 0), 0.022 * hw, 0.026 * hw),
    p => box(p, seg1, [r, b1.up, b1.dir], [0.036 * hw, 0.0105 * hw, 0.022 * hl], 0.008 * hw),
    p => box(p, seg2, [r, b2.up, b2.dir], [0.033 * hw, 0.009 * hw, 0.017 * hl], 0.007 * hw),
    p => Math.min(cone(p, B, M, 0.0105 * hw, 0.009 * hw), cone(p, M, T, 0.009 * hw, 0.008 * hw)),
  ];
}

function bodyField(R, arms, garment) {
  const { b } = R, Z = BODY_Z, pad = garment.pad || 0;
  const { ellipsoid, cone, box, smin } = sculpt;
  const drop = side => R.dropM[side < 0 ? 0 : 1];
  // The trunk is wider than it is deep: cones are evaluated with depth stretched,
  // and the distance divided back so the march never oversteps.
  const trunk = (a, ra, bb, rb, depth) => {
    const x0 = Math.max(ra, rb);
    return p => cone([p[0], p[1], Z + (p[2] - Z) * x0 / depth], a, bb, ra, rb) * depth / x0;
  };
  const torsoParts = [
    // trapezius: from high on the side of the neck, sloping about 20 degrees down to
    // the point of the shoulder, where the deltoid rounds it off
    p => cone(p, [-0.026, R.notch + 0.034, Z + 0.018], [-(b.shoulder - 0.04), R.notch - 0.028 - drop(-1), Z + 0.008], 0.02 + pad, 0.03 + pad),
    p => cone(p, [0.026, R.notch + 0.034, Z + 0.018], [b.shoulder - 0.04, R.notch - 0.028 - drop(1), Z + 0.008], 0.02 + pad, 0.03 + pad),
    // upper chest under the collarbones: below the trapezius, so the shoulder line stays a slope
    p => ellipsoid(p, [0, R.notch - 0.07, Z + 0.005], [b.chest + 0.012 + pad, 0.06, b.chestDepth - 0.012 + pad]),
    // ribcage: widest across the chest, ending above the waist
    p => ellipsoid(p, [0, R.chest, Z], [b.chest + pad, 0.13 * R.s, b.chestDepth + pad]),
    trunk([0, R.chest - 0.06 * R.s, Z], b.chest - 0.01 + pad, [0, R.waist, Z], b.waist + pad, b.waistDepth + pad),
    trunk([0, R.waist, Z], b.waist + pad, [0, R.hip, Z], b.hip + pad, b.waistDepth + 0.005 + pad),
  ];
  // A long coat carries on below the hips and flares a little; anything else ends in
  // a hem just below them, over the trousers.
  if (garment.long) torsoParts.push(trunk([0, R.hip, Z], b.hip + pad, [0, R.hip - 0.5, Z], b.hip + pad + 0.04, b.waistDepth + 0.01 + pad));
  const hem = garment.long ? R.hip - 0.55 : R.hip + 0.05;           // short tops end just above the hip bones
  // Pelvis and legs, in trousers: seen above the counter on taller people.
  const hipX = b.hip * 0.55, legR = b.hip * 0.47;
  const legParts = [
    trunk([0, R.hip + 0.09, Z], b.hip - 0.005, [0, R.hip - 0.09, Z], b.hip - 0.01, b.waistDepth),
    ...[-1, 1].map(side => p => cone(p, [side * hipX, R.hip - 0.05, Z], [side * (hipX + 0.005), R.hip - 0.5, Z - 0.01], legR, legR * 0.72)),
  ];
  if (b.belly > 0) torsoParts.push(p => ellipsoid(p, [0, R.waist + 0.045, Z - b.belly * 0.4], [b.waist + 0.005 + pad, 0.15 * R.s, b.waistDepth + b.belly * 0.8 + pad]));
  const sleeve = Math.min(pad, 0.009);                                 // sleeves are thinner cloth than the body
  const deltoids = arms.map(A => ({ c: deltoidCentre(R, A), r: R.arm * 0.98 + sleeve }));
  const armFields = arms.map(A => armField(A, R.arm, sleeve));
  const hands = arms.map(A => handParts(A, R.hand * R.handLength, R.hand * R.handWidth));
  const props = arms.filter(A => A.prop).map(A => A.prop);
  const neckField = p => cone(p, [0, R.chin + 0.01, Z + 0.01], [0, R.notch - 0.03, Z], b.neck, b.neck + 0.006);
  const extras = garment.extra ? garment.extra(R) : [];

  return p => {
    const q = R.unlean(p);                                             // the trunk leans; arms and hands are already placed
    let t = torsoParts[0](q);
    for (let i = 1; i < torsoParts.length; i++) t = smin(t, torsoParts[i](q), 0.05);
    t = Math.max(t, hem - q[1]);
    for (const d of deltoids) t = smin(t, v3.len(v3.sub(p, d.c)) - d.r, 0.03);
    const n = neckField(q);
    let d = smin(t, n, 0.024), tag = n < t ? 'neck' : 'torso';           // the neck flows into the trapezius
    const legs = Math.min(...legParts.map(field => field(q)));
    if (legs < d) { d = legs; tag = 'legs'; }
    arms.forEach((A, i) => {
      const a = armFields[i](p);
      const k = 0.045 * Math.max(0, 1 - v3.len(v3.sub(p, deltoids[i].c)) / SHOULDER_BLEND);
      if (a < d) tag = 'arm:' + A.side;
      d = smin(d, a, k);
      let h = Infinity;
      for (const field of hands[i]) h = smin(h, field(p), 0.004);
      if (h < d) { d = h; tag = 'hand:' + A.side; }
    });
    for (const [name, field] of extras) { const c = field(q); if (c < d) { d = c; tag = name; } }
    for (const prop of props) {
      const c = prop.kind === 'phone'
        ? Math.min(...prop.halves.map(half => box(p, half.c, half.axes, FLIP, 0.003)))
        : Math.max(box(p, prop.c, prop.axes, CARD, 0.0006), prop.above !== undefined ? prop.above - p[1] : -Infinity);
      if (c < d) { d = c; tag = prop.kind; }
    }
    return [d, tag];
  };
}

// Garments: thickness over the body (`pad`), extra shapes (a hood, a tall collar),
// what the trunk and sleeves are made of, and details painted by position on the
// body, so a belt or a pocket follows the body's surface and perspective. A
// painter gets the hit, the rig, the lit tone level and where on the body it is:
// x across, y up, z depth (unleaned; front is z < BODY_Z) and, on an arm, the
// distance from the shoulder joint.
const RAMPS = {
  cloth: ['cloth1', 'cloth2', 'cloth3', 'cloth4'], under: ['under1', 'under2', 'under3', 'under3'], skin: ['skin1', 'skin2', 'skin3', 'skin3'],
  accent: ['accent0', 'accent1', 'accent2', 'accent2'], phone: ['steel3', 'steel4', 'steel5', 'steel6'], card: ['blue1', 'blue2', 'blue3', 'blue3'],
};
const OUTLINE = { cloth: 'cloth0', under: 'under0', skin: 'skin0', accent: 'accent0', phone: 'steel1', card: 'blue0' };
// Trousers, by name: [outline, shadow, mid, light, highlight].
const TROUSERS = {
  navy: ['navy0', 'navy1', 'navy2', 'navy3', 'navy3'], black: ['ink', 'steel0', 'steel1', 'steel2', 'steel2'],
  khaki: ['cream0', 'cream1', 'cream2', 'cream3', 'cream3'], brown: ['wood0', 'wood1', 'wood2', 'wood3', 'wood3'],
  grey: ['steel1', 'steel2', 'steel3', 'steel4', 'steel4'],
};

// Shared shapes and marks.
const lighter = level => ({ level: Math.min(3, level + 1) });
const darker = level => ({ level: Math.max(0, level - 1) });
// A V opening whose half-width grows from 0 at `top - depth` to `width` at `top`.
const vHalf = (y, top, depth, width) => (y > top ? width : y < top - depth ? -1 : width * (y - (top - depth)) / depth);
// The stand collar: a short cylinder round the base of the neck.
const standCollar = (height, flare) => R => [['collar', p => sculpt.cylinder(p, [0, BODY_Z + 0.005], R.b.neck + flare, R.notch - 0.01, R.notch + height)]];
// A round mark (button, stud) at (cx, cy) on the front.
const dot = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) < r;
// Red and dark flannel checks.
function plaid(P) {
  const a = Math.floor(P[0] * 55) % 3 === 0, b = Math.floor(P[1] * 55) % 3 === 0;
  return a && b ? { color: 'under0' } : a || b ? { color: 'under1' } : { material: 'under' };
}

const GARMENTS = {
  plain: { pad: 0 },

  // The acceptance sample: a fitted crew-neck T-shirt with short sleeves, so the
  // body's structure shows (docs/character-assets.md).
  tee: {
    pad: 0.005,
    paint(hit, R, level, { arm }) { return arm !== undefined && arm > 0.12 ? { material: 'skin' } : null; },
  },

  // Nell: raincoat with a stand collar open in a V over a light top, overlapping fronts, a belt.
  raincoat: {
    pad: 0.012, long: true, extra: standCollar(0.045, 0.02),
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag !== 'torso' && hit.tag !== 'collar') return null;
      if (front && Math.abs(x) < Math.min(0.03, Math.max(0, (y - (R.notch - 0.07)) * 0.5))) return { material: 'under' };
      if (hit.tag !== 'torso') return null;
      if (Math.abs(y - R.waist) < 0.016) return y < R.waist - 0.011 ? { color: 'cloth0' } : darker(level);
      if (front && y < R.notch - 0.07 && Math.abs(x - 0.035) < 0.0035) return { color: 'cloth1' };
      return null;
    },
  },

  // Kit: pullover hoodie, the hood bunched behind the neck, drawstrings, a front pocket.
  hoodie: {
    pad: 0.016,
    extra: R => [['collar', p => {
      const c = [0, R.notch + 0.012, BODY_Z + 0.02], q = v3.sub(p, c);
      const ring = Math.hypot(Math.hypot(q[0], q[2] * 1.25) - (R.b.neck + 0.045), q[1] * 1.3) - 0.028;
      return Math.max(ring, (c[2] - 0.035) - p[2]);
    }]],
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag === 'collar') return front ? null : darker(level);
      if (hit.tag !== 'torso' || !front) return null;
      for (const [sx, len] of [[-0.022, 0.13], [0.022, 0.11]]) {
        if (Math.abs(x - sx) < 0.003 && y < R.notch && y > R.notch - len) return { color: y < R.notch - len + 0.012 ? 'under1' : 'under3' };
      }
      const top = R.waist + 0.035;
      if (y < top && y > top - 0.005 && Math.abs(x) < 0.09) return { color: 'cloth1' };
      if (y < top && Math.abs(Math.abs(x) - (0.09 + (top - y) * 0.4)) < 0.0045) return { color: 'cloth1' };
      return null;
    },
  },

  // Hal: quilted down vest over a red flannel shirt; the shirt shows at the arms and collar.
  vest: {
    pad: 0.022, sleeve: 'under',
    paint(hit, R, level, { x, y, z, front, arm }) {
      if (arm !== undefined) return plaid(hit.P);
      if (hit.tag !== 'torso') return null;
      if (Math.abs(x) > R.b.shoulder - 0.05 && y > R.chest - 0.03) return plaid(hit.P);         // the armholes
      if (front && Math.abs(x) < vHalf(y, R.notch + 0.03, 0.06, 0.04)) return plaid(hit.P);    // shirt at the neck
      if (front && Math.abs(x) < 0.0025 && y < R.notch - 0.03) return { color: 'cloth0' };      // zip
      const k = ((R.notch - y) / 0.05) % 1;
      if (y < R.notch - 0.02) return k < 0.1 ? darker(level) : k < 0.2 ? lighter(level) : null;
      return null;
    },
  },

  // Dana: blazer with notched lapels over a white shirt, one button, a breast pocket.
  blazer: {
    pad: 0.012,
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag !== 'torso' || !front) return null;
      const v = vHalf(y, R.notch + 0.03, 0.15, 0.05), ax = Math.abs(x);
      if (ax < v) return y > R.notch - 0.01 && ax > v - 0.018 ? { color: 'under3' } : { material: 'under' };    // shirt and its collar
      if (v >= 0 && ax < v + 0.035) return Math.abs(ax - v - 0.035) < 0.004 || Math.abs(ax - v) < 0.003 ? { color: 'cloth0' } : lighter(level);
      if (dot(x, y, 0, R.notch - 0.16, 0.007)) return { color: 'cloth0' };
      if (x > 0.045 && x < 0.1 && Math.abs(y - R.chest - 0.035) < 0.003) return { color: 'cloth0' };
      return null;
    },
  },

  // Tess: hospital scrubs with short sleeves over a navy long-sleeved top, pen, ID badge.
  scrubs: {
    pad: 0.008, sleeve: 'under',
    paint(hit, R, level, { x, y, z, front, arm }) {
      if (arm !== undefined) return arm < 0.12 ? { material: 'cloth' } : null;
      if (hit.tag !== 'torso' || !front) return null;
      if (Math.abs(x) < vHalf(y, R.notch + 0.02, 0.09, 0.035)) return { material: 'under' };
      if (Math.abs(Math.abs(x) - vHalf(y, R.notch + 0.02, 0.09, 0.035)) < 0.004) return lighter(level);
      if (x > -0.11 && x < -0.04 && y > R.chest - 0.035 && y < R.chest + 0.025 && (Math.abs(x + 0.11) < 0.003 || Math.abs(x + 0.04) < 0.003 || Math.abs(y - R.chest - 0.025) < 0.003)) return { color: 'cloth1' };
      if (Math.abs(x + 0.06) < 0.004 && y > R.chest + 0.01 && y < R.chest + 0.045) return { color: 'accent1' };
      if (x > 0.045 && x < 0.085 && y > R.chest - 0.005 && y < R.chest + 0.045) {
        if (x < 0.062 && y > R.chest + 0.018) return { color: 'blue2' };
        return { color: Math.abs(y - R.chest - 0.005) < 0.004 ? 'paper1' : 'paper3' };
      }
      return null;
    },
  },

  // Walt: cardigan with ribbed front bands over a shirt and a striped tie, wooden buttons, pockets.
  cardigan: {
    pad: 0.014,
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag !== 'torso' || !front) return null;
      const v = vHalf(y, R.notch + 0.03, 0.2, 0.06), ax = Math.abs(x);
      if (ax < v) {
        const tie = 0.006 + (R.notch - y) * 0.06;
        if (y < R.notch + 0.005 && ax < tie) return { color: Math.floor((x + y) * 160) % 3 ? 'accent1' : 'accent0' };
        return y > R.notch - 0.01 && ax > v - 0.02 ? { color: 'under3' } : { material: 'under' };
      }
      if (ax < (v < 0 ? 0.012 : v + 0.012)) return Math.floor(y * 200) % 2 ? lighter(level) : null;   // ribbed band
      for (let k = 1; k < 5; k++) if (dot(x, y, 0.004, R.notch - 0.2 - k * 0.05, 0.007)) return { color: 'wood2' };
      if (Math.abs(y - R.waist - 0.03) < 0.003 && ax > 0.05 && ax < 0.11) return { color: 'cloth1' };
      return null;
    },
  },

  // Ana: double-breasted peacoat, collar turned up, wide lapels, two rows of silver buttons.
  peacoat: {
    pad: 0.022, long: true, extra: standCollar(0.065, 0.032),
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag === 'collar') return front && Math.abs(x) < 0.025 ? { material: 'under' } : null;
      if (hit.tag !== 'torso' || !front) return null;
      const v = vHalf(y, R.notch + 0.04, 0.12, 0.03), ax = Math.abs(x);
      if (ax < v) return { material: 'under' };
      if (v >= 0 && ax < v + 0.055) return Math.abs(ax - v - 0.055) < 0.004 ? { color: 'cloth0' } : lighter(level);
      for (const cy of [R.notch - 0.13, R.notch - 0.2, R.notch - 0.27]) for (const cx of [-0.05, 0.05]) {
        if (dot(x, y, cx, cy, 0.009)) return { color: dot(x, y, cx - 0.002, cy + 0.002, 0.004) ? 'accent2' : 'accent0' };
      }
      return null;
    },
  },

  // Dex: zip windbreaker, a red band across the chest and round the sleeves, small stand collar.
  windbreaker: {
    pad: 0.018, extra: standCollar(0.04, 0.025),
    paint(hit, R, level, { x, y, z, front, arm }) {
      if (arm !== undefined) return arm > 0.09 && arm < 0.12 ? { material: 'accent' } : null;
      if (hit.tag !== 'torso') return null;
      if (y > R.chest + 0.015 && y < R.chest + 0.055) return { material: 'accent' };
      if (front && Math.abs(x) < 0.0028 && y < R.notch) return { color: Math.floor(y * 300) % 2 ? 'steel5' : 'steel3' };
      return null;
    },
  },

  // Bonnie: fisherman's sweater, ribbed crew neck and cuffs, three cables, moss stitch.
  sweater: {
    pad: 0.016,
    paint(hit, R, level, { x, y, z, front, arm }) {
      if (arm !== undefined) return arm > R.upper + R.fore - 0.05 ? (Math.floor(hit.P[0] * 250 + hit.P[2] * 250) % 2 ? darker(level) : null) : null;
      if (hit.tag !== 'torso') return null;
      if (y > R.notch - 0.012) return Math.floor(x * 220) % 2 ? darker(level) : lighter(level);
      if (!front) return null;
      for (const cx of [-0.065, 0, 0.065]) {
        const d = Math.abs(x - cx);
        if (d > 0.013 && d < 0.017) return darker(level);
        if (d < 0.013) return Math.floor(y * 70 + Math.abs(x - cx) * 140) % 3 === 0 ? darker(level) : lighter(level);
      }
      return (Math.floor(x * 300) + Math.floor(y * 300)) % 7 === 0 ? darker(level) : null;
    },
  },

  // Sam: denim jacket open over a black T-shirt, point collar, flap pockets, gold topstitching.
  denim: {
    pad: 0.012,
    paint(hit, R, level, { x, y, z, front }) {
      if (hit.tag !== 'torso' || !front) return null;
      const ax = Math.abs(x), open = 0.042 + Math.max(0, R.notch - y) * 0.03;
      if (ax < open) return y > R.notch - 0.004 && y < R.notch + 0.004 ? { color: 'under3' } : { material: 'under' };
      if (ax < open + 0.004) return { color: 'cloth0' };
      if (Math.abs(ax - open - 0.011) < 0.002 && Math.floor(y * 200) % 2) return { color: 'accent2' };
      if (y > R.notch - 0.03 && ax < 0.1) return Math.abs(y - (R.notch - 0.03)) < 0.004 ? { color: 'cloth0' } : lighter(level);   // collar points
      if (ax > 0.06 && ax < 0.11 && y > R.chest - 0.01 && y < R.chest + 0.04) {
        if (y > R.chest + 0.025) return Math.abs(y - R.chest - 0.025) < 0.003 ? { color: 'cloth0' } : lighter(level);
        if (dot(ax, y, 0.085, R.chest + 0.02, 0.005)) return { color: 'accent2' };
        if (Math.abs(ax - 0.06) < 0.003 || Math.abs(ax - 0.11) < 0.003) return { color: 'cloth1' };
      }
      return null;
    },
  },

  // Edie: lavender blouse with a round collar under a knitted shawl draped over the
  // shoulders and upper arms, open at the front, fringed.
  shawl: {
    pad: 0.01, body: 'under', sleeve: 'under',
    paint(hit, R, level, { x, y, z, front, arm }) {
      const knit = () => (Math.floor((hit.P[0] + hit.P[1]) * 130) % 5 === 0 ? darker(level) : { material: 'cloth' });
      if (arm !== undefined) {
        if (arm < 0.15) return knit();
        return arm < 0.162 && Math.floor(hit.P[0] * 160 + hit.P[2] * 160) % 2 ? { color: 'cloth1' } : null;
      }
      if (hit.tag !== 'torso') return null;
      const ax = Math.abs(x), edge = R.notch - 0.04 - 0.14 * Math.min(1, ax / (R.b.shoulder - 0.02));
      const opening = front && ax < 0.035 + Math.max(0, R.notch - y) * 0.35;
      if (y > edge && !opening) return knit();
      if (y > edge - 0.012 && y <= edge && !opening && Math.floor(x * 160) % 2) return { color: 'cloth1' };   // fringe
      if (front && y > R.notch - 0.02 && ax < 0.055) return { color: 'under3' };                            // the blouse's collar
      return null;
    },
  },
};

const sideOf = tag => (tag.startsWith('arm') || tag.startsWith('hand') ? Number(tag.split(':')[1]) : 0);
function materialOf(tag, garment) {
  if (tag === 'neck' || tag.startsWith('hand')) return 'skin';
  if (tag === 'legs') return 'legs';
  if (tag === 'phone' || tag === 'card') return tag;
  if (tag.startsWith('arm')) return garment.sleeve || 'cloth';
  if (tag === 'torso') return garment.body || 'cloth';
  return 'cloth';
}

// Colour for one hit: material ramp by light and occlusion (or one flat tone for
// checking form), a crease inside a bent elbow, then the props' faces and the
// garment's paint.
function shadeHit(hit, R, garment, arms, flat) {
  let material = materialOf(hit.tag, garment);
  if (material === 'legs' && R.legs === 'cloth') material = 'cloth';
  // Shaded by planes, as a pixel artist would: the side toward the light (left), the
  // front, the side away; a highlight only where the form also turns up; undersides
  // and deep creases a step darker.
  const [nx, ny] = hit.n;
  let level = flat ? 1 : nx < -0.5 ? (ny > 0.15 ? 3 : 2) : nx < 0.35 ? 2 : nx < 0.78 ? 1 : 0;
  if (!flat && ny < (hit.tag === 'torso' ? -0.32 : -0.6)) level = Math.max(0, level - 1);
  if (!flat && hit.ao < 0.3) level = Math.max(0, level - 1);
  if (!flat && hit.tag.startsWith('arm')) {
    const A = arms.find(a => a.side === sideOf(hit.tag)), inside = v3.add(v3.norm(v3.sub(A.S, A.E)), v3.norm(v3.sub(A.W, A.E)));
    const q = v3.sub(hit.P, A.E);
    if (v3.len(inside) > 0.3 && v3.len(q) < R.arm * 1.5 && v3.dot(q, v3.norm(inside)) > 0) level = Math.max(0, level - 1);
  }
  if (material === 'legs') {
    const t = TROUSERS[R.legs];
    return { color: flat ? t[2] : t[1 + Math.min(level, 2)], material: 'legs', outline: t[0] };
  }
  if (!flat && hit.tag.startsWith('hand')) {                                 // partings between the fingers
    const A = arms.find(a => a.side === sideOf(hit.tag)), q = v3.sub(hit.P, A.W);
    const along = v3.dot(q, A.hand.f) / (R.hand * R.handLength), across = v3.dot(q, A.hand.r) / (R.hand * R.handWidth);
    if (along > 0.098 && [-0.02, 0, 0.018].some(g => Math.abs(across - g) < 0.0022)) return { color: 'skin1', material };
  }
  const prop = arms.find(A => A.prop && A.prop.kind === material)?.prop;
  if (prop && material === 'phone' && !flat) {
    const half = prop.halves.reduce((best, h) => {
      const q = sculpt.local(hit.P, h.c, h.axes);
      const out = Math.max(Math.abs(q[0]) - FLIP[0], Math.abs(q[1]) - FLIP[1], Math.abs(q[2]) - FLIP[2]);
      return !best || out < best.out ? { h, q, out } : best;
    }, null);
    const [u, v, w] = half.q;
    if (half.h.part === 'lid' && w < -FLIP[2] + 0.002 && Math.abs(u) < 0.014 && v > 0.006 && v < 0.03) {     // the outer display
      return { color: Math.abs(u) > 0.011 || v < 0.009 || v > 0.027 ? 'steel7' : v > 0.02 ? 'cyan4' : 'cyan3', material };
    }
    if (half.h.part === 'keypad' && w > FLIP[2] - 0.002 && Math.abs(u) < 0.016 && v > -0.03 && v < 0.02) {  // the keys
      return { color: (Math.round(u / 0.008) + Math.round(v / 0.009)) % 2 ? 'steel2' : 'steel5', material };
    }
  }
  if (prop && material === 'card' && !flat) {
    const [u, v] = sculpt.local(hit.P, prop.c, prop.axes);
    if (v > CARD[1] * 0.35 && v < CARD[1] * 0.65) return { color: 'paper3', material };
    if (u < -CARD[0] * 0.45 && u > -CARD[0] * 0.8 && Math.abs(v) < CARD[1] * 0.25) return { color: 'yellow2', material };
  }
  if (!flat && hit.tag === 'torso') {
    const [x, y, z] = R.unlean(hit.P), b = R.b;
    for (const side of [-1, 1]) {
      const a = [side * (b.chest - 0.012), R.chest + 0.02], e = [side * (b.waist - 0.035), R.waist + 0.03];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * (e[0] - a[0]) + (y - a[1]) * (e[1] - a[1])) / ((e[0] - a[0]) ** 2 + (e[1] - a[1]) ** 2)));
      if (z < BODY_Z && t > 0.1 && t < 0.9 && Math.hypot(x - a[0] - t * (e[0] - a[0]), y - a[1] - t * (e[1] - a[1])) < 0.0035) level = Math.max(0, level - 1);
    }
  }
  let where = null;
  if (!flat && garment.paint) {
    const [x, y, z] = R.unlean(hit.P), A = hit.tag.startsWith('arm') && arms.find(a => a.side === sideOf(hit.tag));
    where = { x, y, z, front: z < BODY_Z, arm: A ? v3.len(v3.sub(hit.P, A.S)) : undefined };
  }
  const over = where && garment.paint(hit, R, level, where);
  if (over && over.color) return { color: over.color, material };
  if (over && over.material) material = over.material;
  if (over && over.level !== undefined) level = over.level;
  return { color: RAMPS[material][level], material };
}

// ------------------------------------------------------------------ rendering a pose
// A pose rendered as layers: `back` (torso and the arms at the sides, under the
// hair), `front` (arms raised or held in front, over it), `counter` (whatever is
// nearer than the counter's far edge, drawn over the counter) and `over` (a hand
// held out over the counter or onto the card terminal, drawn over the machines;
// its 'palm' anchor is where a receiving hand holds what it is given). Outlines run round
// the silhouette and where one part passes in front of another, never across the
// shoulder where arm and torso are one surface; the cuff edges the wrist.
// The back layer's 'head' anchor is how far the lean moves the head sprite.
function poseParts(R, pose, garment, { flat = false } = {}) {
  const arms = [armPose(R, -1, pose.left), armPose(R, 1, pose.right)];
  const hits = sculpt.render(bodyField(R, arms, garment), W, H, [OX, OY]);
  const frontSides = new Set(arms.filter(A => !['rest', 'hang'].includes(A.mode)).map(A => A.side));
  const shaded = hits.map(hit => hit && shadeHit(hit, R, garment, arms, flat));
  const deltoids = arms.map(A => deltoidCentre(R, A));
  const nearShoulder = P => deltoids.some(c => v3.len(v3.sub(P, c)) < SHOULDER_BLEND);
  const colors = shaded.map(s => s && s.color);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, hit = hits[i];
    if (!hit) continue;
    let mark = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      const other = nx >= 0 && ny >= 0 && nx < W && ny < H ? hits[ny * W + nx] : null;
      const nearer = other && other.P[2] > hit.P[2];
      if (!other) { mark = 'edge'; break; }
      if (other.tag === hit.tag) { if (other.P[2] > hit.P[2] + 0.06) { mark = 'edge'; break; } continue; }
      const [a, b] = [hit.tag, other.tag];
      if (a.startsWith('arm') && b.startsWith('hand')) {                                  // the cuff, unless the forearm is bare
        if (shaded[i].material !== 'skin') { mark = 'edge'; break; }
        continue;
      }
      if (a.startsWith('hand') && b.startsWith('arm')) continue;
      if (b === 'legs' && a !== 'legs' && !a.startsWith('hand')) { mark = 'edge'; break; } // a hem over the trousers
      if (a === 'legs' && b === 'torso') continue;
      if (a.startsWith('arm') && !b.startsWith('arm') && b !== 'phone' && b !== 'card') {
        if (!nearShoulder(hit.P)) { mark = 'edge'; break; }
        continue;
      }
      if (b.startsWith('arm') && !a.startsWith('arm') && a !== 'phone' && a !== 'card') continue;
      if (other.P[2] > hit.P[2] + (a === 'phone' || a === 'card' || a.startsWith('hand') ? 0.003 : 0.012)) { mark = 'edge'; break; }
    }
    if (mark === 'edge') colors[i] = shaded[i].outline || OUTLINE[shaded[i].material];
  }
  // Tidy single stray pixels inside a part.
  const tidy = colors.slice();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!colors[i]) continue;
    const around = [colors[i - 1], colors[i + 1], colors[i - W], colors[i + W]];
    if (around.every(c => c && c === around[0]) && around[0] !== colors[i] && !Object.values(OUTLINE).includes(colors[i]) && colors[i] !== 'skin1') tidy[i] = around[0];
  }
  const back = canvas(), front = canvas(), counter = canvas(), over = canvas();
  const outSides = new Set(arms.filter(A => ['reach', 'swipe', 'take'].includes(A.mode)).map(A => A.side));
  hits.forEach((hit, i) => {
    if (!hit) return;
    const forward = hit.tag === 'phone' || hit.tag === 'card' || frontSides.has(sideOf(hit.tag));
    const held = hit.tag === 'card' || outSides.has(sideOf(hit.tag));
    const layer = hit.P[2] < space.counter.far ? (held ? over : counter) : forward ? front : back;
    layer.px(i % W, Math.floor(i / W), tidy[i]);
  });
  // A resting hand presses on the laminate: a tight shadow just below and beside it.
  const restSides = new Set(arms.filter(A => A.mode === 'rest').map(A => A.side));
  hits.forEach((hit, i) => {
    if (!hit || !hit.tag.startsWith('hand') || !restSides.has(sideOf(hit.tag))) return;
    const x = i % W, y = Math.floor(i / W);
    for (const [dx, dy] of [[0, 2], [1, 2], [-1, 1], [1, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && !hits[ny * W + nx] && !counter.get(nx, ny)) counter.px(nx, ny, 'top2');
    }
  });
  for (const A of arms.filter(A => A.mode === 'take')) over.anchor('palm', ...toCanvas(v3.add(A.W, v3.add(v3.mul(A.hand.f, 0.05 * R.hand * R.handLength), v3.mul(A.hand.n, -0.02)))));
  back.anchor('head', ...R.headOffset);
  return { back, front, counter, over, arms };
}

// ------------------------------------------------------------------ extras
// Thin wire frames, and heavier black ones.
function glasses(bold) {
  const p = canvas();
  const c = bold ? 'ink' : 'steel1';
  for (const x0 of [77, mirror(84)]) {
    p.frame(x0, TOP + 13, 8, 6, c).px(x0 + 6, TOP + 14, 'white');
    if (bold) p.hline(x0, x0 + 7, TOP + 12, c);
  }
  p.hline(85, 90, TOP + 14, c).hline(74, 76, TOP + 14, c).hline(mirror(76), mirror(74), TOP + 14, c);
  return p;
}

// Wired earbuds: the wires meet on the chest and go into a pocket.
function earphones() {
  const p = canvas();
  p.rect(CX - 14, TOP + 17, 2, 2, 'paper3').rect(CX + 12, TOP + 17, 2, 2, 'paper3');
  // Down past the jaw first, then in under the chin, so no wire crosses the face.
  p.line(CX - 13, TOP + 19, CX - 12, TOP + 36, 'paper2').line(CX - 12, TOP + 36, CX - 6, TOP + 62, 'paper2');
  p.line(CX + 12, TOP + 19, CX + 11, TOP + 36, 'paper2').line(CX + 11, TOP + 36, CX - 5, TOP + 62, 'paper2');
  p.line(CX - 6, TOP + 62, CX - 9, TOP + 96, 'paper2');
  return p;
}

// Paper mask from the bridge of the nose to the chin.
function mask() {
  const p = canvas();
  for (let y = TOP + 19; y <= TOP + 31; y++) {
    const hw = Math.round(curve(PROFILES.round, (y - TOP) / (HEAD_H - 1))) - (y > TOP + 28 ? 1 : 0);
    p.hline(CX - hw, CX + hw - 1, y, 'paper2');
  }
  p.light('paper2', ['paper1', 'paper2', 'paper3'], normals.sphere(CX - 3, TOP + 22, 13, 10), { outline: 'paper0' });
  for (const y of [TOP + 23, TOP + 27]) p.hline(CX - 8, CX + 7, y, 'paper1');
  return p;
}

// Lines of age: crow's feet, bags under the eyes, smile lines.
function wrinkles() {
  const p = canvas();
  const both = (x, y) => p.px(x, y, 'skin1').px(mirror(x), y, 'skin1');
  both(77, TOP + 16); both(76, TOP + 17); both(77, TOP + 18);
  for (let x = 80; x <= 82; x++) both(x, TOP + 18);
  both(84, TOP + 22); both(83, TOP + 23); both(83, TOP + 24); both(84, TOP + 25);
  return p;
}

// Full short beard along the jaw and a moustache; the lips stay clear.
function beard() {
  const p = canvas();
  for (let y = TOP + 20; y <= TOP + HEAD_H; y++) {
    const hw = Math.round(curve(PROFILES.square, Math.min(1, (y - TOP) / (HEAD_H - 1))));
    for (let x = CX - hw; x < CX + hw; x++) {
      const lips = y >= TOP + 26 && y <= TOP + 27 && x >= CX - 3 && x <= CX + 2;
      const cheek = y < TOP + 24 && Math.abs(x - CX + 0.5) < hw - 3;
      if (!lips && !cheek) p.px(x, y, (x + y) % 3 ? 'hair2' : 'hair1');
    }
  }
  return p.outlineBy({ hair1: 'hair0', hair2: 'hair0' });
}

// Raindrops on hair and shoulders.
function wet() {
  const p = canvas();
  for (const [x, y] of [[74, 10], [93, 3], [101, 16], [65, 54], [109, 56], [70, 74], [114, 82], [80, 42], [61, 94], [104, 102], [92, 86]]) {
    p.px(x, TOP + y, 'white').px(x, TOP + y + 1, 'cyan3');
  }
  return p;
}

// Parts every customer can share, plus the bodies and arms for each customer whose
// outfit has been rebuilt on the rig (only Nell so far).
module.exports = () => {
  const sprites = {
    'person-hair-back-long': hairLongBack(),
    'person-hair-back-bob': hairBobBack(),
    'person-glasses': glasses(false),
    'person-glasses-bold': glasses(true),
    'person-earphones': earphones(),
    'person-mask': mask(),
    'person-wrinkles': wrinkles(),
    'person-beard': beard(),
    'person-wet': wet(),
  };
  for (const kind of Object.keys(PROFILES)) for (const gaze of Object.keys(GAZES)) sprites[`person-head-${kind}-${gaze}`] = head(kind, gaze);
  for (const [kind, draw] of Object.entries(HAIRS)) sprites['person-hair-' + kind] = draw();
  for (const c of Object.values(customers.customers)) {
    const { body, poses = [] } = c.person;
    if (!GARMENTS[body]) continue;
    const frame = customers.personFrame(c.person);
    for (const name of poses) {
      const parts = poseParts(rigFor(c.person, POSES[name]), POSES[name], GARMENTS[body]);
      for (const layer of ['back', 'front', 'counter', 'over']) sprites[`person-${layer}-${body}-${frame}-${name}`] = parts[layer];
    }
  }
  return sprites;
};

module.exports.POSES = POSES;

// One figure in one pose from a person spec, for the rig review sheets: its layers,
// joints to mark (shoulder, elbow, wrist per arm; neck, chest, waist and hip on the
// body's centre line, including those hidden by the counter) and named landmarks
// for the structure view.
module.exports.figure = (person, name, options) => {
  const pose = POSES[name], R = rigFor(person, pose), parts = poseParts(R, pose, GARMENTS[person.body] || GARMENTS.plain, options);
  const centre = [R.notch, R.chest, R.waist, R.hip].map(y => toCanvas(R.lean([0, y, BODY_Z - 0.1])));
  const at = P => toCanvas(R.lean(P));
  const [left, right] = parts.arms;
  const landmarks = {
    chin: at([0, R.chin, BODY_Z - 0.05]), neckRoot: at([0, R.notch, BODY_Z - 0.06]),
    neckSides: [-1, 1].map(s => at([s * R.b.neck, R.notch + 0.02, BODY_Z - 0.03])),
    shoulders: [left, right].map(A => toCanvas(A.S)), elbows: [left, right].map(A => toCanvas(A.E)), wrists: [left, right].map(A => toCanvas(A.W)),
    ribs: [-1, 1].map(s => at([s * R.b.chest, R.chest, BODY_Z - 0.03])), waist: [-1, 1].map(s => at([s * R.b.waist, R.waist, BODY_Z - 0.03])),
    pelvis: [-1, 1].map(s => at([s * R.b.hip, R.hip, BODY_Z - 0.03])), centre,
  };
  return { dy: R.dy, gaze: pose.gaze, ...parts, landmarks, joints: [...parts.arms.flatMap(A => [A.S, A.E, A.W].map(toCanvas)), ...centre] };
};
