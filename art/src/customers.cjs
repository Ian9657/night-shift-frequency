// Paper-doll customer parts on a shared 120x120 canvas (placed at layout.customer).
// Parts use the remappable skin/hair/cloth/under/accent slots; each customer in
// js/content/customers.js picks parts and colour ramps. Shapes are lit with
// normals (head = sphere, limbs = capsules, torso = ellipsoid); faces, hands and
// details are placed by hand. The runtime only switches parts and attaches props
// at the 'hand' anchor.
'use strict';
const { Pix, normals } = require('../tools/pixel.cjs');

const W = 120, H = 120;
const CX = 54; // head/torso centre column pair is 53|54; mirroring uses axis 53.5
const HEAD_TOP = 8;
const canvas = () => new Pix(W, H);

const SKIN = ['skin1', 'skin2', 'skin3', 'skin4'];
const HAIR = ['hair1', 'hair2', 'hair3'];
const CLOTH = ['cloth1', 'cloth2', 'cloth3', 'cloth4'];
const UNDER = ['under1', 'under2', 'under3'];
const ACCENT = ['accent0', 'accent1', 'accent2'];

// Half-widths per row from the crown down; widths are 2*hw centred on 53|54.
const PROFILES = {
  oval: [3, 5, 6, 7, 8, 8, 9, 9, 9, 9, 9, 10, 10, 10, 9, 9, 9, 8, 8, 7, 6, 6, 5, 4, 2],
  round: [4, 6, 7, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 8, 7, 6, 5, 3],
  square: [4, 6, 7, 8, 8, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 8, 7, 6, 4],
};

function rowSpan(hw) { return [CX - hw, CX + hw - 1]; }

// Keep only pixels of a mask Pix that also satisfy fn.
function mergeInto(target, source) {
  for (let i = 0; i < source.data.length; i++) if (source.data[i]) target.data[i] = source.data[i];
  return target;
}

// ------------------------------------------------------------------ heads
function head(kind) {
  const profile = PROFILES[kind];
  const p = canvas();
  profile.forEach((hw, i) => { const [a, b] = rowSpan(hw); p.hline(a, b, HEAD_TOP + i, 'skin2'); });
  // Ears
  for (let i = 11; i <= 15; i++) {
    const hw = profile[i];
    for (const x of [CX - hw - 1, CX + hw]) p.px(x, HEAD_TOP + i, 'skin2');
  }
  p.light('skin2', SKIN, normals.sphere(CX, HEAD_TOP + 11, 11, 14), { outline: 'skin0' });
  // Ear shadow and inner ear
  for (let i = 12; i <= 14; i++) p.px(CX - profile[i] - 1, HEAD_TOP + i, 'skin1').px(CX + profile[i], HEAD_TOP + i, 'skin1');
  const y = HEAD_TOP;
  // Brows
  const brow = kind === 'square' ? 'hair2' : 'hair1';
  p.hline(47, 50, y + 9, brow).px(46, y + 10, brow).hline(57, 60, y + 9, brow).px(61, y + 10, brow);
  // Eyes: lash line, then white / iris / white, a lower-lid shade
  p.hline(47, 50, y + 12, 'eye0').hline(57, 60, y + 12, 'eye0');
  p.px(48, y + 13, 'eye1').px(49, y + 13, 'eye0').px(50, y + 13, 'eye1');
  p.px(57, y + 13, 'eye1').px(58, y + 13, 'eye0').px(59, y + 13, 'eye1');
  p.hline(48, 50, y + 14, 'skin2').hline(57, 59, y + 14, 'skin1');
  // Nose: lit bridge, shadow falling right, nostril base
  p.px(53, y + 14, 'skin3').px(54, y + 15, 'skin1').px(54, y + 16, 'skin1').hline(52, 55, y + 17, 'skin1').px(53, y + 17, 'skin0');
  // Mouth with a lit lower lip
  p.px(51, y + 19, 'skin1').hline(52, 55, y + 19, 'skin0').px(56, y + 19, 'skin1').hline(52, 55, y + 20, 'skin3');
  if (kind === 'square') {
    p.px(47, y + 15, 'skin1').px(60, y + 15, 'skin1').px(50, y + 18, 'skin1').px(57, y + 18, 'skin1');
  }
  return p.anchor('eyeL', 48, y + 12).anchor('eyeR', 57, y + 12);
}

// ------------------------------------------------------------------ hair
const HAIR_LIGHT = normals.sphere(CX, 17, 13, 16);

// Strands radiating from the crown, plus a sheen arc on the lit side.
function groom(p, options = {}) {
  const inside = (x, y) => p.get(x, y) && p.get(x, y) !== p.get(-1, -1);
  const crownX = options.crownX ?? CX - 2, crownY = options.crownY ?? 7;
  for (let i = -6; i <= 6; i++) {
    const tx = CX + i * 3, ty = 30;
    const steps = 40;
    for (let s = 6; s < steps; s++) {
      const x = Math.round(crownX + (tx - crownX) * s / steps), y = Math.round(crownY + (ty - crownY) * s / steps);
      if (inside(x, y) && (s + i) % 5 !== 0) p.px(x, y, 'hair1');
    }
  }
  for (let a = 200; a <= 280; a += 4) {
    const r = a * Math.PI / 180;
    const x = Math.round(CX + Math.cos(r) * (options.sheenRx ?? 9)), y = Math.round(16 + Math.sin(r) * (options.sheenRy ?? 8));
    if (inside(x, y)) p.px(x, y, 'hair3');
    if (inside(x + 1, y)) p.px(x + 1, y, 'hair3');
  }
}

function finishHair(p, options) {
  p.light('hair2', HAIR, HAIR_LIGHT);
  groom(p, options);
  p.outlineBy({ hair1: 'hair0', hair2: 'hair0', hair3: 'hair0' });
  return p;
}

function fill(p, color, test, box = [30, 0, 50, 70]) {
  const [x0, y0, w, h] = box;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (test(x + 0.5, y + 0.5)) p.px(x, y, color);
  return p;
}
const inEllipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const HAIR_FRONT = {
  short() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => inEllipse(CX, 17, 11.5, 11)(x, y) && (y < 15 + ((Math.floor(x) * 7) % 3 === 0 ? 1 : 0) || x < 44.5 || x > 63.5) && y < 23);
    p.line(49, 7, 47, 14, 'hair0');
    return finishHair(p);
  },
  bob() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => (inEllipse(CX, 18, 12.5, 12)(x, y) && (y < 16.5 || x < 46 || x > 62)) || ((x < 46 || x > 62) && x > 41 && x < 67 && y >= 18 && y < 34 + (x < 44 || x > 64 ? 0 : 1)));
    for (let x = 46; x < 62; x += 3) p.px(x, 16, 'hair1');
    return finishHair(p);
  },
  long() {
    const p = canvas();
    // Side part on the viewer's left; the fringe sweeps right.
    fill(p, 'hair2', (x, y) => (inEllipse(CX, 18, 12.5, 12)(x, y) && (y < 12 + (x - 44) * 0.42 || x < 46 || x > 62)) || ((x < 46 || x > 62) && x > 41 && x < 67 && y >= 18 && y < 44));
    p.line(48, 7, 46, 13, 'hair0');
    return finishHair(p, { crownX: 48 });
  },
  buzz() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => inEllipse(CX, 16, 10.5, 9)(x, y) && y < 14.5);
    p.light('hair2', HAIR, HAIR_LIGHT);
    for (let y = 7; y < 15; y++) for (let x = 42; x < 66; x++) if (p.get(x, y) && (x + y) % 2) p.px(x, y, 'hair1');
    return p;
  },
  messy() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => (inEllipse(CX, 16, 12, 10.5)(x, y) && (y < 15 || x < 45 || x > 63) && y < 22));
    for (const [tx, ty, dx] of [[45, 3, -3], [50, 1, -2], [55, 1, 1], [60, 3, 3], [64, 7, 3]]) p.poly([[tx, ty], [tx + 5 + dx, ty + 8], [tx - 2 + dx, ty + 8]], 'hair2');
    for (const [fx, fy] of [[47, 15], [52, 16], [57, 15]]) p.poly([[fx, fy - 2], [fx + 3, fy - 2], [fx + 1, fy + 2]], 'hair2');
    return finishHair(p, { crownY: 4 });
  },
  bun() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => (inEllipse(CX, 15, 11, 8)(x, y) && y < 14.5) || inEllipse(CX, 4, 5, 4.5)(x, y));
    fill(p, 'hair2', (x, y) => (x > 42 && x < 45 && y > 13 && y < 22) || (x > 63 && x < 66 && y > 13 && y < 22));
    p.hline(49, 58, 8, 'hair0');
    return finishHair(p, { crownY: 9, sheenRy: 6 });
  },
  cap() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => ((x > 42 && x < 46) || (x > 62 && x < 66)) && y > 14 && y < 23);
    finishHair(p);
    const cap = canvas();
    fill(cap, 'accent1', (x, y) => inEllipse(CX, 14, 12.5, 9)(x, y) && y < 15);
    cap.light('accent1', ACCENT, normals.sphere(CX, 14, 13, 10));
    cap.rect(40, 14, 28, 3, 'accent1').hline(40, 67, 14, 'accent2').hline(40, 67, 16, 'accent0');
    cap.rect(52, 6, 4, 3, 'white').px(53, 7, 'accent0');
    cap.vline(53, 5, 13, 'accent0');
    cap.outlineBy({ accent0: 'ink', accent1: 'ink', accent2: 'ink', white: 'ink' });
    mergeInto(p, cap);
    p.hline(44, 63, 18, 'skin1');
    return p;
  },
  beanie() {
    const p = canvas();
    fill(p, 'hair2', (x, y) => ((x > 42 && x < 46) || (x > 62 && x < 66)) && y > 15 && y < 23);
    finishHair(p);
    const hat = canvas();
    fill(hat, 'accent1', (x, y) => inEllipse(CX, 14, 12.5, 11)(x, y) && y < 14);
    hat.light('accent1', ACCENT, normals.sphere(CX, 12, 13, 12));
    hat.rect(41, 12, 26, 6, 'accent1');
    for (let x = 41; x < 67; x += 2) hat.vline(x, 12, 17, 'accent0');
    hat.hline(41, 66, 12, 'accent2');
    for (let y = 4; y < 12; y += 3) for (let x = 44; x < 64; x += 4) if (hat.get(x, y)) hat.px(x + (y % 2), y, 'accent0');
    hat.outlineBy({ accent0: 'ink', accent1: 'ink', accent2: 'ink' });
    mergeInto(p, hat);
    return p;
  },
};

function hairBack(kind) {
  const p = canvas();
  if (kind === 'bob') fill(p, 'hair2', (x, y) => inEllipse(CX, 22, 13.5, 13)(x, y));
  else fill(p, 'hair2', (x, y) => inEllipse(CX, 22, 13.5, 13)(x, y) || (x > 40 && x < 68 && y > 20 && y < 62 - Math.abs(x - CX) * 0.3), [30, 0, 50, 80]);
  return finishHair(p, { crownY: 6 });
}

// ------------------------------------------------------------------ bodies
const TORSO = [[46, 39], [61, 39], [70, 42], [75, 47], [77, 56], [77, H], [30, H], [30, 56], [32, 47], [37, 42]];
const LEFT_ARM = [[34, 49], [30, 78], [31, 114]];

function limb(points, radius) {
  const p = canvas();
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, ay] = points[i], [bx, by] = points[i + 1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= steps; s++) p.ellipse(Math.round(ax + (bx - ax) * s / steps), Math.round(ay + (by - ay) * s / steps), radius, radius, 'cloth2');
  }
  p.light('cloth2', CLOTH, normals.capsule(points, radius + 0.5), { outline: 'cloth0' });
  // Elbow crease
  const [ex, ey] = points[1];
  p.px(ex + 1, ey - 1, 'cloth1').px(ex + 2, ey, 'cloth1');
  return p;
}

function hand(p, x, y, pose) {
  const grid = pose === 'low' ? `
.dddd.
dlmmmd
dmmmsd
dmmmsd
dmsmsd
.dsdsd
..d.d.` : `
.dddd..
dllmmd.
dlmmmsd
dmmmmsd
dmmmssd
.dmssd.
..ddd..`;
  p.stamp(x - 3, y - 3, grid, { d: 'skin0', l: 'skin3', m: 'skin2', s: 'skin1' });
  return p.anchor('hand', x, y);
}

function neck(p) {
  p.rect(49, 26, 10, 18, 'skin2');
  p.light('skin2', SKIN, normals.cylinder(53.5, 6), { outline: 'skin0' });
  p.hline(49, 58, 31, 'skin1').hline(50, 57, 32, 'skin1');
}

function torso(kind) {
  const t = canvas();
  const wide = kind === 'coat' ? 1 : 0;
  t.poly(TORSO.map(([x, y]) => [x < CX ? x - wide : x + wide, y]), 'cloth2');
  t.light('cloth2', CLOTH, normals.sphere(53.5, 82, 26, 52), { outline: 'cloth0' });
  return t;
}

function body(kind) {
  const p = canvas();
  if (kind === 'hoodie') {
    fill(p, 'cloth2', (x, y) => inEllipse(53.5, 41, 11, 6)(x, y), [35, 30, 40, 20]);
    p.light('cloth2', CLOTH, normals.sphere(53.5, 41, 12, 7), { outline: 'cloth0' });
  }
  neck(p);
  mergeInto(p, torso(kind));
  const arm = limb(LEFT_ARM, 5);
  if (kind === 'vest') for (let x = 20; x < 40; x++) if (arm.get(x, 70)) arm.px(x, 70, 'accent2').px(x, 71, 'accent1');
  mergeInto(p, arm);
  if (kind === 'jacket') {
    p.poly([[48, 40], [60, 40], [59, H], [49, H]], 'under2');
    p.light('under2', UNDER, normals.cylinder(53.5, 8));
    for (let y = 42; y < H; y += 2) p.px(47, y, 'steel5').px(60, y + 1, 'steel5');
    p.vline(46, 41, H - 1, 'cloth0').vline(61, 41, H - 1, 'cloth0');
    p.poly([[41, 39], [48, 40], [49, 54]], 'cloth4').poly([[67, 39], [60, 40], [59, 54]], 'cloth3');
    p.line(41, 39, 49, 54, 'cloth1').line(67, 39, 59, 54, 'cloth1');
    p.hline(37, 44, 72, 'cloth1').px(64, 60, 'steel6').px(64, 61, 'steel4');
    p.line(40, 84, 43, 100, 'cloth1').line(68, 84, 66, 98, 'cloth1');
  } else if (kind === 'hoodie') {
    neck(p);
    p.line(50, 44, 48, 60, 'under3').line(57, 44, 59, 60, 'under3');
    p.rect(47, 61, 2, 2, 'steel6').rect(59, 61, 2, 2, 'steel6');
    p.hline(39, 68, 96, 'cloth1').line(39, 96, 36, 110, 'cloth1').line(68, 96, 71, 110, 'cloth1');
    p.line(40, 78, 44, 90, 'cloth1');
  } else if (kind === 'coat') {
    const collar = canvas();
    collar.poly([[41, 31], [66, 31], [68, 46], [59, 46], [54, 54], [53, 54], [48, 46], [39, 46]], 'cloth2');
    collar.light('cloth2', CLOTH, normals.sphere(53.5, 40, 16, 10), { outline: 'cloth0' });
    collar.poly([[49, 34], [58, 34], [54, 52], [53, 52]], 'under2');
    collar.line(49, 34, 53, 52, 'cloth0').line(58, 34, 54, 52, 'cloth0');
    mergeInto(p, collar);
    p.vline(57, 54, H - 1, 'cloth1');
    for (const y of [62, 76, 90]) for (const x of [48, 61]) p.ellipse(x, y, 1, 1, 'accent1').px(x - 1, y - 1, 'accent2');
    p.line(44, 40, 35, 52, 'cloth1').line(63, 40, 72, 52, 'cloth1');
    for (const [x, y0] of [[38, 58], [40, 64], [36, 72]]) p.vline(x, y0, y0 + 10, 'cloth4');
  } else if (kind === 'vest') {
    p.vline(53, 42, H - 1, 'cloth0').vline(54, 42, H - 1, 'steel5');
    for (const y of [70, 80]) p.rect(31, y, 46, 3, 'accent1').hline(31, 76, y, 'accent2').hline(31, 76, y + 2, 'accent0');
    p.rect(38, 52, 10, 4, 'cloth1').rect(60, 52, 10, 4, 'cloth1').hline(38, 47, 52, 'cloth3').hline(60, 69, 52, 'cloth3');
    p.poly([[44, 39], [50, 40], [52, 47]], 'cloth3').poly([[64, 39], [58, 40], [56, 47]], 'cloth3');
  }
  return p;
}

// ------------------------------------------------------------------ right arm poses
const ARMS = {
  idle: [[73, 49], [77, 78], [76, 114]],
  reach: [[73, 49], [85, 73], [84, 99]],
  low: [[73, 49], [91, 72], [107, 96]],
  phone: [[73, 49], [80, 70], [67, 36]],
};

function arm(pose) {
  const p = limb(ARMS[pose], 5);
  if (pose === 'reach') hand(p, 84, 104, 'reach');
  if (pose === 'low') hand(p, 111, 101, 'low');
  if (pose === 'phone') {
    p.rect(62, 14, 5, 16, 'steel1').frame(62, 14, 5, 16, 'ink').rect(63, 16, 3, 9, 'cyan1').px(63, 16, 'cyan3');
    hand(p, 66, 30, 'reach');
  }
  return p;
}

// ------------------------------------------------------------------ accessories
function glasses() {
  const p = canvas();
  p.frame(46, HEAD_TOP + 11, 6, 5, 'ink').frame(56, HEAD_TOP + 11, 6, 5, 'ink').hline(52, 55, HEAD_TOP + 12, 'ink');
  p.hline(43, 45, HEAD_TOP + 12, 'ink').hline(62, 64, HEAD_TOP + 12, 'ink');
  p.px(47, HEAD_TOP + 12, 'white').px(57, HEAD_TOP + 12, 'white');
  return p;
}
function mask() {
  const p = canvas();
  p.rect(46, HEAD_TOP + 15, 16, 8, 'under2');
  p.light('under2', UNDER, normals.sphere(CX, HEAD_TOP + 18, 9, 6), { outline: 'under0' });
  for (const y of [17, 19, 21]) p.hline(48, 59, HEAD_TOP + y, 'under1');
  p.line(45, HEAD_TOP + 16, 43, HEAD_TOP + 13, 'under1').line(62, HEAD_TOP + 16, 64, HEAD_TOP + 13, 'under1');
  return p;
}
function earphones() {
  const p = canvas();
  for (const x of [43, 64]) p.rect(x, HEAD_TOP + 13, 2, 2, 'white');
  p.line(44, HEAD_TOP + 15, 48, 40, 'white').line(64, HEAD_TOP + 15, 59, 40, 'white').line(47, 40, 53, 52, 'paper2').line(60, 40, 54, 52, 'paper2');
  p.vline(53, 52, 66, 'paper2');
  return p;
}
function scarf() {
  const p = canvas();
  fill(p, 'accent1', (x, y) => (inEllipse(53.5, 38, 14, 6)(x, y)) || (x > 57 && x < 64 && y > 38 && y < 66), [35, 28, 40, 40]);
  p.light('accent1', ACCENT, normals.sphere(53.5, 40, 15, 12), { outline: 'ink' });
  for (let x = 42; x < 66; x += 3) p.vline(x, 34, 42, 'accent0');
  for (let x = 58; x < 64; x += 2) p.px(x, 66, 'accent1').px(x, 67, 'accent0');
  return p;
}
function beard() {
  const p = canvas();
  for (let y = HEAD_TOP + 16; y < HEAD_TOP + 25; y++) for (let x = 44; x < 64; x++) {
    const inside = Math.abs(x - 53.5) < 9.5 - Math.max(0, y - HEAD_TOP - 20) * 1.4;
    if (inside && (x + y) % 2 === 0 && !(y === HEAD_TOP + 19 && x > 51 && x < 56)) p.px(x, y, 'hair1');
  }
  p.hline(49, 58, HEAD_TOP + 18, 'hair1').hline(50, 57, HEAD_TOP + 18, 'hair2');
  return p;
}
function wet() {
  const p = canvas();
  for (const [x, y] of [[44, 10], [58, 6], [63, 14], [39, 46], [68, 45], [42, 58], [73, 62], [47, 33], [33, 70], [66, 74]]) {
    p.px(x, y, 'white').px(x, y + 1, 'cyan3');
  }
  return p;
}

module.exports = () => {
  const parts = {};
  for (const kind of Object.keys(PROFILES)) parts['customer-head-' + kind] = head(kind);
  for (const [name, make] of Object.entries(HAIR_FRONT)) parts['customer-hair-' + name] = make();
  parts['customer-hair-back-bob'] = hairBack('bob');
  parts['customer-hair-back-long'] = hairBack('long');
  for (const kind of ['jacket', 'hoodie', 'coat', 'vest']) parts['customer-body-' + kind] = body(kind);
  for (const pose of Object.keys(ARMS)) parts['customer-arm-' + pose] = arm(pose);
  parts['customer-glasses'] = glasses();
  parts['customer-mask'] = mask();
  parts['customer-earphones'] = earphones();
  parts['customer-scarf'] = scarf();
  parts['customer-beard'] = beard();
  parts['customer-wet'] = wet();
  return parts;
};
