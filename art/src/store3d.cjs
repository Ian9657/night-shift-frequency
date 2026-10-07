// The store from the clerk's eye, rendered with the one camera in js/content/space.js.
// Layers (full-screen, drawn back to front at runtime): store-back, store-sides,
// store-counter, store-front. Interactive and animated things are separate sprites
// placed by their 'at' anchor.
'use strict';
const { Pix } = require('../tools/pixel.cjs');
const { Stage, shade, lightAt } = require('../tools/raycast.cjs');
const { sign, width: signWidth } = require('../tools/signs.cjs');
const space = require('../../js/content/space.js');
const palette = require('../palette.cjs');
const sculpt = require('../tools/sculpt.cjs');
const { camera, room, counter } = space;

const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const r5 = g => [0, 1, 2, 3, 4].map(i => g + i);
const RAMP = {
  wall: ['wall1', 'wall3', 'wall4', 'wall5', 'wall6'], cream: ['cream0', 'cream1', 'cream2', 'cream3', 'cream5'],
  steel: ['steel1', 'steel3', 'steel4', 'steel5', 'steel7'], dark: ['ink', 'steel1', 'steel2', 'steel3', 'steel5'],
  red: r5('red'), paper: ['paper0', 'paper1', 'paper2', 'paper3', 'white'], buoy: r5('buoy'), navy: r5('navy'),
  top: ['top1', 'top2', 'top3', 'top4', 'top5'], green: r5('green'), orange: r5('orange'), blue: r5('blue'),
  cyan: r5('cyan'), pink: ['pink0', 'pink0', 'pink1', 'pink2', 'pink3'], yellow: ['yellow0', 'yellow0', 'yellow1', 'yellow2', 'yellow3'],
  wood: ['wood0', 'wood1', 'wood2', 'wood3', 'wood4'], violet: ['violet0', 'violet0', 'violet1', 'violet2', 'violet2'],
};
const at = (X, Y, Z = room.back) => space.project(X, Y, Z).map(Math.round);

// ------------------------------------------------------------------ the view outside
// Distant things sit on the horizon (camera.vy); the street falls below it.
function outside(p, x0, y0, x1, y1) {
  const H = camera.vy, W = x1 - x0;
  p.bands(x0, y0, W, H - y0, ['night0', 'night1', 'night1', 'night2', 'night2']);
  p.dither(x0, H - 18, W, 3, 'night3', (x, y) => (x + 2 * y) % 5 === 0);
  p.dither(x0, H - 7, W, 4, 'night3', (x, y) => (x * 3 + y) % 7 === 0);
  // Far shore and town lights
  p.poly([[x0, H - 2], [x0 + 30, H - 6], [x0 + 70, H - 4], [x0 + 112, H - 9], [x0 + 152, H - 5], [x1, H - 7], [x1, H + 3], [x0, H + 3]], 'night2');
  p.poly([[x0, H + 1], [x0 + 40, H - 2], [x0 + 92, H], [x0 + 140, H - 3], [x1, H - 1], [x1, H + 4], [x0, H + 4]], 'night1');
  for (let i = 0; i < 26; i++) {
    const lx = x0 + Math.floor(hash(i, 3) * W), ly = H - 4 + Math.floor(hash(i, 4) * 7);
    p.px(lx, ly, hash(i, 5) < 0.3 ? 'lamp3' : 'lamp2');
  }
  // The relay tower on the far shore; its light is blinked by the runtime.
  const tx = Math.round(x0 + W * 0.78), top = H - 34;
  p.line(tx - 6, H + 1, tx - 1, top + 4, 'void').line(tx + 6, H + 1, tx + 1, top + 4, 'void');
  for (let y = top + 8; y < H; y += 6) {
    const a = Math.round((H - y) * 5 / 31), b = Math.round((H - y - 6) * 5 / 31);
    p.line(tx - 6 + a, y, tx + 6 - b, y + 6, 'void').line(tx + 6 - a, y, tx - 6 + b, y + 6, 'void');
    p.hline(tx - 6 + a, tx + 6 - a, y, 'void');
  }
  p.vline(tx, top - 2, top + 4, 'void').hline(tx - 2, tx + 2, top + 4, 'void').px(tx, top, 'red0');
  p.line(tx, top + 8, tx - 20, H - 1, 'night2').line(tx, top + 8, tx + 20, H - 1, 'night2');
  // Sea, streaks, reflections
  p.rect(x0, H + 4, W, 22, 'sea1').dither(x0, H + 4, W, 2, 'sea0', 'checker');
  for (let i = 0; i < 9; i++) {
    const sx = x0 + Math.floor(hash(i, 9) * W), sy = H + 7 + Math.floor(hash(i, 10) * 17), len = 8 + Math.floor(hash(i, 11) * 20);
    p.hline(sx, Math.min(x1 - 1, sx + len), sy, 'sea2').hline(sx + 3, Math.min(x1 - 1, sx + len - 4), sy, 'sea3');
  }
  for (let y = H + 5; y < H + 25; y += 2) p.px(tx + (y % 4 ? 1 : 0), y, 'red0');
  // Seawall, railing, a bicycle left against it
  p.rect(x0, H + 26, W, 4, 'void').hline(x0, x1 - 1, H + 26, 'night1');
  p.hline(x0, x1 - 1, H + 18, 'night0').hline(x0, x1 - 1, H + 22, 'night0');
  for (let x = x0 + 3; x < x1; x += 14) p.vline(x, H + 18, H + 26, 'night0');
  const bx = Math.round(x0 + W * 0.6), by = H + 23;
  p.ellipse(bx, by, 4, 4, 'void').ellipse(bx, by, 3, 3, 'night1').ellipse(bx + 15, by, 4, 4, 'void').ellipse(bx + 15, by, 3, 3, 'night1');
  p.line(bx, by, bx + 6, by - 7, 'void').line(bx + 6, by - 7, bx + 15, by, 'void').line(bx + 6, by - 7, bx + 12, by - 7, 'void').line(bx + 12, by - 7, bx + 15, by, 'void');
  p.hline(bx + 4, bx + 8, by - 8, 'void').line(bx + 12, by - 7, bx + 13, by - 11, 'void');
  // Wet street with puddles
  p.bands(x0, H + 30, W, y1 - H - 30, ['night1', 'night1', 'night0', 'night0']);
  for (let y = H + 32; y < y1; y += 3) p.dither(x0, y, W, 1, 'night2', x => (x * 7 + y * 3) % 13 === 0);
  p.ellipse(Math.round(x0 + W * 0.62), H + 46, 16, 2, 'night2').ellipse(Math.round(x0 + W * 0.62), H + 46, 11, 1, 'night3');
  p.ellipse(Math.round(x0 + W * 0.3), H + 70, 22, 3, 'night2');
  // Street lamp: post, hood, a widening cone of light, a broken reflection
  const lx = Math.round(x0 + W * 0.13), ly = Math.max(y0 + 6, H - 46);
  p.vline(lx, ly + 4, y1 - 4, 'void').vline(lx + 1, ly + 4, y1 - 4, 'night0');
  p.line(lx, ly + 4, lx + 4, ly + 1, 'void').hline(lx + 4, lx + 12, ly, 'void').hline(lx + 6, lx + 14, ly - 1, 'void');
  p.hline(lx + 6, lx + 13, ly + 1, 'lamp3');
  p.glow(lx + 10, ly + 2, 18, 42, ['haze0', 'haze1', 'haze2', 'lamp0'], (x, y) => y >= ly + 2 && y < y1 && Math.abs(x - lx - 10) <= (y - ly + 3) * 0.45);
  p.glow(lx + 10, ly + 2, 5, 3, ['lamp0', 'lamp1']);
  for (let y = H + 34; y < y1; y += 2) if ((y * 7) % 5) p.hline(lx + 9, lx + 11, y, y < H + 56 ? 'lamp1' : 'lamp0');
  // Glass: cold tube reflections sit inside the pane, with the outside still
  // visible between them. They are deliberately broken rather than a smooth
  // gradient, so the window keeps its pixel-art night texture.
  p.dither(x0 + 4, y0 + 1, 50, 1, 'night5', 'checker').dither(x1 - 56, y0 + 1, 50, 1, 'night5', 'checker');
  const tubeY = [y0 + 13, y0 + 15, y0 + 42, y0 + 44];
  for (const [i, ry] of tubeY.entries()) {
    const start = i < 2 ? x0 + 10 : x1 - 50;
    const width = i % 2 ? 34 : 42;
    p.hline(start, Math.min(x1 - 3, start + width), ry, i % 2 ? 'night5' : 'rain');
    if (i % 2 === 0) p.dither(start + 4, ry, width - 8, 1, 'tube', 'sparse');                     // the tube's bright core
    p.dither(start + 3, ry + 1, Math.max(4, width - 8), 1, 'night4', 'checker');
  }
  for (const [sx, sy] of [[x0 + 54, y0 + 30], [x0 + 60, y0 + 30], [x1 - 50, y0 + 60], [x1 - 45, y0 + 60]]) {
    for (let i = 0; i < 10; i++) p.px(sx + i, sy + i * 2, 'night3');
  }
  return { tower: [tx, top] };
}

function calendar(p, x, y) {
  // Compact sheet fitted to the exposed wall between shelving and window.
  p.rect(x, y + 2, 24, 25, 'paper2').hline(x, x + 23, y + 26, 'paper0');
  p.rect(x, y + 2, 24, 12, 'red2').hline(x, x + 23, y + 2, 'red3');
  sign(p, x + 6, y + 3, 'OCT', 'white');
  sign(p, x + 4, y + 9, '2005', 'paper3');
  for (const rx of [4, 19]) p.vline(x + rx, y, y + 2, 'steel6');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
    const cx = x + 2 + col * 3, cy = y + 16 + row * 3;
    if (row === 2 && col === 6) p.frame(cx - 1, cy - 1, 4, 4, 'blue2');
    else p.px(cx, cy, 'red2').px(cx + 1, cy + 1, 'red1');
  }
}

// ------------------------------------------------------------------ back wall (screen-parallel)
function back() {
  const p = new Pix(480, 270);
  const [wx0, wy0] = at(-room.halfW, room.ceiling), [wx1, wy1] = at(room.halfW, 0);
  const top = Math.max(0, wy0);
  p.bands(wx0, top, wx1 - wx0, wy1 - top, ['wall6', 'wall5', 'wall5', 'wall5', 'wall4']);
  const [gx0, gy0] = at(-1.0, 2.45), [gx1, gy1] = at(1.0, 0.75);
  const glass = { x: gx0, y: Math.max(0, gy0), w: gx1 - gx0, h: gy1 - Math.max(0, gy0) };
  const { tower } = outside(p, glass.x, glass.y, gx1, gy1);
  // OPEN 24H neon hung in the right pane, facing the street: seen reversed from inside.
  const nx = Math.round(glass.x + glass.w * 0.62), ny = glass.y + 6;
  p.vline(nx + 4, 0, ny - 3, 'steel3').vline(nx + 26, 0, ny - 3, 'steel3');
  p.rect(nx - 3, ny - 3, 36, 11, 'void').frame(nx - 3, ny - 3, 36, 11, 'steel1');
  const neon = new Pix(480, 270);
  sign(neon, nx, ny, 'OPEN 24H', 'pink3', true);
  neon.outline('pink0');
  p.blit(neon, 0, 0);
  // Aluminium frame and the door mullion
  p.rect(gx0 - 5, glass.y, 5, gy1 - glass.y + 4, 'steel4').vline(gx0 - 5, glass.y, gy1 + 3, 'steel6').vline(gx0 - 1, glass.y, gy1 + 3, 'steel2');
  p.rect(gx1, glass.y, 5, gy1 - glass.y + 4, 'steel3').vline(gx1, glass.y, gy1 + 3, 'steel5');
  p.rect(gx0 - 5, gy1, gx1 - gx0 + 10, 4, 'steel3').hline(gx0 - 5, gx1 + 4, gy1, 'steel6');
  const [mx] = at(0, 1);
  p.rect(mx - 3, glass.y, 6, gy1 - glass.y, 'steel4').vline(mx - 2, glass.y, gy1, 'steel6').vline(mx + 2, glass.y, gy1, 'steel2');
  for (const hx of [mx - 8, mx + 7]) p.rect(hx, gy1 - 50, 2, 30, 'steel6').vline(hx + 1, gy1 - 50, gy1 - 21, 'steel4');
  // Left of the window, the only bare wall the shelving leaves: clock, calendar, tide table.
  const [cx, cy] = at(-1.2, 2.0), r = 12;
  p.ellipse(cx + 1, cy + 2, r, r, 'wall2').ellipse(cx, cy, r, r, 'steel1').ellipse(cx, cy, r - 1, r - 1, 'steel4').ellipse(cx, cy, r - 3, r - 3, 'cream5');
  p.dither(cx - r + 4, cy + 3, 2 * r - 8, r - 6, 'cream3', 'sparse');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    for (let rr = i % 3 ? r - 4 : r - 6; rr <= r - 3; rr++) p.px(Math.round(cx + Math.sin(a) * rr), Math.round(cy - Math.cos(a) * rr), i % 3 ? 'steel4' : 'steel1');
  }
  const [kx, ky] = at(-1.32, 1.83);
  calendar(p, kx, ky);
  // The tide table, a small card pinned under the calendar where the register doesn't
  // hide it: a navy header with the harbour buoy, the day's tide curve, two rows of times.
  const tx0 = kx, ty0 = ky + 29;
  p.rect(tx0 + 1, ty0 + 1, 24, 11, 'wall2').rect(tx0, ty0, 24, 11, 'paper2').hline(tx0, tx0 + 23, ty0 + 10, 'paper0');
  p.rect(tx0, ty0, 24, 3, 'navy1').hline(tx0 + 2, tx0 + 12, ty0 + 1, 'white').rect(tx0 + 18, ty0 + 1, 3, 2, 'buoy2');
  for (let i = 0; i < 20; i++) p.px(tx0 + 2 + i, ty0 + 6 + Math.round(Math.sin(i / 2.6) * 1.6), 'blue2');
  for (const j of [8, 9]) for (let i = 0; i < 4; i++) p.hline(tx0 + 2 + i * 5, tx0 + 4 + i * 5, ty0 + j, 'paper0');
  return p.anchor('window', glass.x, glass.y).anchor('windowSize', glass.w, glass.h).anchor('mullion', mx - 3, 6)
    .anchor('tower', tower[0], tower[1]).anchor('clock', cx, cy);
}

// ------------------------------------------------------------------ side walls, shelving, fridge
function sides() {
  const s = new Stage();
  const WALL = s.object('walls', { layer: 'main', outline: false });
  // A white tiled ceiling with two tube fittings, each with a dithered glow round it.
  s.quad([-room.halfW, room.ceiling, room.back], [2 * room.halfW, 0, 0], [0, 0, -room.back + 0.1], [0, -1, 0], (u, v, P, sx, sy) => {
    for (const tx of [-0.75, 0.75]) {
      const d = Math.abs(P[0] - tx);
      if (d < 0.05) return 'tube';
      if (d < 0.08) return 'white';
      if (d < 0.11) return 'steel6';
      if (d < 0.24 && (sx + sy) % 2 === 0) return 'wall6';
    }
    if (P[2] % 0.6 < 0.015 || (P[0] + 2) % 0.6 < 0.012) return 'wall4';                          // tile grid
    return 'wall5';
  }, WALL);
  for (const sx of [-room.halfW, room.halfW]) {
    s.quad([sx, 0, 0.1], [0, 0, room.back - 0.1], [0, room.ceiling, 0], [sx < 0 ? 1 : -1, 0, 0], () => 'wall5', WALL);
  }
  // Snack gondola on the left wall
  const G = { x: -room.halfW + 0.2, z0: 1.0, z1: 1.95 };
  const gz = (G.z0 + G.z1) / 2, gd = G.z1 - G.z0;
  s.box({ x: -room.halfW + 0.02, z: gz, w: 0.03, h: 2.05, d: gd, y: 0 }, RAMP.wall,
    (f, u, t) => (Math.round(u * 60) % 4 === 0 && Math.round(t * 70) % 4 === 0 ? 'wall1' : null), { name: 'gondola' });
  s.box({ x: -room.halfW + 0.09, z: gz, w: 0.04, h: 0.16, d: gd, y: 2.05 }, RAMP.navy, (f, u, t) => {
    if (f !== 'right') return null;
    if (t < 0.25) return 'buoy2';
    return u > 0.1 && u < 0.62 && t > 0.42 && t < 0.78 && (u * 14) % 1 < 0.62 ? 'white' : 'navy1';
  }, { name: 'gondola header' });
  const SHELVES = [
    { y: 0.12, kind: 'bags', h: 0.3, w: 0.14 }, { y: 0.55, kind: 'bags', h: 0.3, w: 0.14 },
    { y: 0.98, kind: 'bags', h: 0.26, w: 0.13 }, { y: 1.41, kind: 'cups', h: 0.11, w: 0.1 }, { y: 1.78, kind: 'boxes', h: 0.2, w: 0.11 },
  ];
  const PACKS = ['red', 'buoy', 'green', 'blue', 'yellow', 'pink', 'violet', 'orange'];
  SHELVES.forEach((shelf, row) => {
    s.box({ x: G.x, z: gz, w: 0.36, h: 0.025, d: gd, y: shelf.y }, RAMP.steel,
      (f, u) => (f === 'right' ? ((u * 40) % 1 < 0.22 ? 'buoy2' : 'white') : null), { name: 'shelf' });
    // A narrow price strip on the customer-facing shelf edge. Tiny alternating
    // marks suggest printed prices without introducing unreadable text.
    s.box({ x: G.x + 0.028, z: gz, w: 0.014, h: 0.016, d: gd - 0.02, y: shelf.y + 0.028 }, RAMP.paper,
      (f, u, t) => f === 'right' && ((Math.floor(u * 36) + row) % 7 < 2) ? 'blue2' : null, { name: 'price strip' });
    let z = G.z0 + 0.01, n = 0;
    while (z < G.z1 - shelf.w) {
      const r = hash(row * 31 + 7, n++);
      const ramp = RAMP[PACKS[Math.floor(r * PACKS.length)]];
      const facings = 3 + Math.floor(r * 3);
      const h = shelf.h * (0.68 + hash(n, row) * 0.16);
      for (let k = 0; k < facings && z < G.z1 - shelf.w; k++) {
        for (let level = 0; level < (shelf.kind === 'cups' ? 2 : 1); level++) {
          s.box({ x: G.x + 0.02, z: z + shelf.w / 2, w: 0.19, h, d: shelf.w * 0.9, y: shelf.y + 0.025 + level * h }, ramp, (f, u, t) => {
            if (f !== 'right') return f === 'top' ? ramp : null;
            if (shelf.kind === 'cups') return t > 0.85 ? RAMP.paper : t > 0.35 && t < 0.6 ? ramp : RAMP.paper;
            if (t > 0.9) return shelf.kind === 'bags' ? 'steel6' : null;
            if (t > 0.42 && t < 0.72 && u > 0.15 && u < 0.85) return shelf.kind === 'bags' ? 'white' : RAMP.paper;
            return null;
          }, { name: 'product' });
        }
        z += shelf.w;
      }
      z += 0.008;
    }
  });
  // The drinks fridge along the right wall: a cabinet whose glass doors face the room.
  // Its end panel toward the window carries a drinks poster; a canopy with the brand
  // band runs along the top, a kick plate along the bottom. Behind the glass, a lit
  // interior: the back wall glows, light strips run down behind the door frames, and
  // bottles stand on four shelves near the glass.
  const F = { x0: room.halfW - 0.66, x1: room.halfW, z0: 1.04, z1: 1.95 };
  const fx = (F.x0 + F.x1) / 2, fw = F.x1 - F.x0, fz = (F.z0 + F.z1) / 2, fd = F.z1 - F.z0;
  const DOORS = [1.05, 1.35, 1.65, 1.95];
  s.box({ x: fx, z: F.z0 + 0.015, w: fw, h: 2.2, d: 0.03, y: 0 }, RAMP.steel, (f, u, t) => {
    if (f === 'left') return t > 0.9 ? (t > 0.95 ? 'navy1' : 'buoy2') : null;
    return null;
  }, { name: 'fridge end' });
  // The end panel's top carries a short ICE COLD poster with the cola bottle; below it,
  // an end-cap of three wire shelves over the counter's end: on top film, a disposable
  // camera and the charity box (drawn with the counter), then a magazine rack, and just
  // above the counter battery cards, phone cards and the lighters.
  s.box({ x: fx, z: F.z0 - 0.002, w: fw - 0.06, h: 0.42, d: 0.004, y: 1.63 }, RAMP.paper, panel('front', 92, 64, p => {
    p.rect(0, 0, 92, 64, 'white').rect(3, 3, 86, 58, 'navy1');
    for (let y = 3; y < 61; y++) if (y % 3 === 0) p.dither(3, y, 86, 1, 'navy2', 'sparse');
    p.rect(3, 3, 86, 28, 'buoy2').hline(3, 88, 30, 'buoy0');
    const word = new Pix(30, 14);
    sign(word, 2, 0, 'ICE', 'white'); sign(word, 0, 7, 'COLD', 'white');
    for (let y = 0; y < 14; y++) for (let x = 0; x < 30; x++) if (word.get(x, y)) p.rect(10 + x * 2, 4 + y * 2, 2, 2, 'white');
    p.rect(38, 33, 4, 3, 'red3').rect(38, 36, 4, 5, 'wood1').rect(34, 41, 12, 19, 'wood1').rect(34, 47, 12, 5, 'red2').hline(34, 45, 49, 'white');   // the bottle
    for (const [bx, by] of [[18, 40], [24, 52], [56, 44], [62, 54]]) p.ellipse(bx, by, 1, 1, 'cyan3');
  }), { name: 'poster' });
  const cap = { x: F.x0 + 0.21, z: F.z0 - 0.05, w: 0.38, d: 0.1 };
  for (const x of [cap.x - cap.w / 2, cap.x + cap.w / 2]) s.box({ x, z: cap.z, w: 0.012, h: 0.58, d: cap.d, y: counter.y + 0.03 }, RAMP.steel, null, { name: 'end-cap bracket' });
  for (const y of [1.08, 1.3, 1.5]) {
    s.box({ ...cap, h: 0.012, y }, RAMP.steel, null, { name: 'end-cap shelf' });
    s.box({ x: cap.x, z: cap.z - cap.d / 2, w: cap.w, h: 0.03, d: 0.004, y: y + 0.012 }, RAMP.steel, null, { name: 'wire lip' });
  }
  // Magazines standing in the rack, covers out: masthead, cover photo, cover lines.
  [['red', 'pink'], ['blue', 'yellow'], ['green', 'orange']].forEach(([mast, ground], i) => {
    s.box({ x: cap.x - 0.12 + i * 0.12, z: cap.z + 0.01, w: 0.1, h: 0.15, d: 0.012, y: 1.312 }, RAMP.paper, panel('front', 20, 28, p => {
      p.rect(0, 0, 20, 28, ground + '2').rect(0, 0, 20, 6, mast + '2').hline(2, 17, 2, 'white');
      p.ellipse(12, 16, 5, 6, 'skin3').ellipse(12, 11, 5, 3, ['ink', 'wood1', 'yellow2'][i]).rect(7, 22, 11, 6, mast + '1');
      for (let y = 9; y < 24; y += 4) p.hline(1, 5, y, 'white');
    }), { name: 'magazine' });
  });
  // Small things: film boxes and a disposable camera on top; battery cards and phone
  // cards at the bottom.
  [[-0.15, 0.04, 0.05, RAMP.yellow, 'ink', 1.512], [-0.09, 0.04, 0.05, RAMP.yellow, 'ink', 1.512], [-0.02, 0.07, 0.045, RAMP.green, 'yellow2', 1.512],
    [-0.12, 0.05, 0.08, RAMP.paper, 'orange2', 1.092], [-0.05, 0.06, 0.09, RAMP.blue, 'white', 1.092]].forEach(([dx, w, h, ramp, mark, y]) => {
    s.box({ x: cap.x + dx, z: cap.z + 0.01, w, h, d: 0.03, y }, ramp, (f, u, t) => (f === 'front' && t > 0.35 && t < 0.65 && u > 0.2 && u < 0.8 ? mark : null), { name: 'end-cap goods' });
  });
  s.box({ x: fx, z: fz, w: fw, h: 0.25, d: fd, y: 1.95 }, RAMP.steel, (f, u, t) => {
    if (f !== 'left') return null;
    return t > 0.55 ? (t > 0.8 ? 'navy1' : 'buoy2') : t > 0.18 ? 'white' : 'steel3';
  }, { name: 'fridge canopy' });
  s.box({ x: fx, z: fz, w: fw, h: 0.2, d: fd, y: 0 }, RAMP.dark, (f, u, t) => (f === 'left' && t > 0.3 && t < 0.7 && (u * 60) % 1 < 0.5 ? 'ink' : null), { name: 'kick plate' });
  // The lit interior: back wall, light strips behind the frames, shelves, bottles.
  s.quad([F.x1 - 0.06, 0.2, F.z1], [0, 0, -fd], [0, 1.75, 0], [-1, 0, 0], (u, v, P, sx, sy) => {
    if (DOORS.some(dz => Math.abs(P[2] - dz) < 0.03)) return 'tube';
    return (sx + sy) % 2 ? 'wall6' : 'white';
  }, WALL);
  for (const y of [0.2, 0.6, 1.0, 1.4]) {
    s.box({ x: F.x0 + 0.28, z: fz, w: 0.44, h: 0.015, d: fd - 0.02, y }, RAMP.steel,
      (f, u) => (f === 'left' ? ((u * 30) % 1 < 0.2 ? 'buoy2' : 'white') : null), { name: 'fridge shelf' });
    let z = F.z0 + 0.04, n = 0;
    while (z < F.z1 - 0.06) {
      const r = hash(500 + Math.round(y * 100), n++);
      const ramp = RAMP[['cyan', 'green', 'orange', 'red', 'blue', 'buoy'][Math.floor(r * 6)]];
      const facings = 3 + Math.floor(r * 2), bh = 0.2 + r * 0.04;
      for (let k = 0; k < facings && z < F.z1 - 0.06; k++) {
        if (DOORS.every(dz => Math.abs(z + 0.028 - dz) > 0.04)) {                              // none hidden behind a frame
          s.box({ x: F.x0 + 0.1, z: z + 0.028, w: 0.055, h: bh, d: 0.055, y: y + 0.015 }, ramp, (f, u, t) => {
            if (f !== 'left' && f !== 'top') return null;
            if (t > 0.9 || f === 'top') return u > 0.3 && u < 0.7 ? (r > 0.5 ? 'white' : 'red2') : 'white';   // cap, the light behind it
            if (t > 0.72) return u > 0.2 && u < 0.8 ? ramp : 'white';                                     // shoulder
            if (t > 0.36 && t < 0.58) return RAMP.paper;                                                  // label
            return null;
          }, { name: 'bottle' });
        }
        z += 0.062;
      }
      z += 0.012;
    }
  }
  // Door frames and rails at the glass, a long handle on each door.
  for (const z of DOORS) s.box({ x: F.x0 + 0.015, z, w: 0.03, h: 1.75, d: 0.025, y: 0.2 }, RAMP.steel, null, { name: 'door frame' });
  for (const y of [0.2, 1.93]) s.box({ x: F.x0 + 0.015, z: fz, w: 0.03, h: 0.025, d: fd, y }, RAMP.steel, null, { name: 'door rail' });
  for (const z of DOORS.slice(0, 3)) s.box({ x: F.x0 - 0.02, z: z + 0.25, w: 0.02, h: 0.5, d: 0.02, y: 0.85 }, RAMP.steel, null, { name: 'handle' });
  const GLASS = s.object('glass', { outline: false });
  s.quad([F.x0, 0.2, F.z0], [0, 0, fd], [0, 1.75, 0], [-1, 0, 0], (u, v, P, sx, sy) => {
    if ((sx * 2 + sy) % 23 === 0 || (sx * 2 + sy + 1) % 23 === 0) return (sx + sy) % 3 ? 'white' : null;   // diagonal sheen
    return (sx + sy * 3) % 7 === 0 ? 'cyan4' : null;                                                        // cold tint
  }, GLASS);
  s.outline();
  return s.layer('main');
}

// ------------------------------------------------------------------ counter layer
function counterLayer() {
  const s = new Stage();
  const TOP = s.object('counter', { ramp: RAMP.top });
  s.quad([-room.halfW, counter.y, counter.near], [2 * room.halfW, 0, 0], [0, 0, counter.far - counter.near], [0, 1, 0], (u, v, P, sx, sy) => {
    if (counter.far - P[2] < 0.015) return 'buoy2';                         // brand strip on the far lip
    if (P[2] - counter.near < 0.03) return P[2] - counter.near < 0.012 ? 'white' : 'top5'; // bullnose
    const n = hash(Math.floor(P[0] * 220 + 900), Math.floor(P[2] * 220));
    if (n < 0.03) return 'top3';
    if (P[0] > -0.75 && P[0] < -0.15 && P[2] > 0.7 && P[2] < 0.9 && n > 0.75 && n < 0.8) return 'top3'; // wear by the register
    // Reflections from the fluorescent tubes: two short, cool bands broken by
    // the grain and kept below the far lip so they read as reflected light.
    const band = (P[2] > 0.72 && P[2] < 0.78) || (P[2] > 0.93 && P[2] < 0.97);
    if (band && Math.abs(P[0]) < 1.42 && (Math.floor(P[0] * 46) + sy) % 9 < 5) return 'top5';
    // A few fixed scuffs near the clerk's working area.  They are sparse and
    // deterministic, so rebuilds do not make the counter shimmer.
    if (P[2] > 0.58 && P[2] < 0.9 && P[0] > -0.35 && P[0] < 0.42 && ((sx * 7 + sy * 3) % 47 === 0)) return 'top3';
    return P[2] > 1.02 ? 'top3' : 'top4';
  }, TOP);
  s.quad([-room.halfW, counter.y - counter.thick, counter.near], [2 * room.halfW, 0, 0], [0, counter.thick, 0], [0, 0, -1], () => 'top2', TOP);
  const UNDER = s.object('under', { outline: false });
  s.quad([-room.halfW, 0, counter.near + 0.06], [2 * room.halfW, 0, 0], [0, counter.y - counter.thick, 0], [0, 0, -1], (u, v, P, sx, sy) => ((sx + sy) % 2 ? 'wall0' : 'ink'), UNDER);
  const { candyRack, lighters, donation, tray } = space.decor;
  const PACKS = ['red', 'green', 'blue', 'yellow', 'pink', 'buoy', 'cyan', 'violet'];
  // Gum: a steel tray with two tiers of packs, each with a white wrapper band.
  s.box(candyRack, RAMP.steel, null, { name: 'candy rack' });
  for (const row of [0, 1]) {
    s.box({ x: candyRack.x, z: candyRack.z - 0.012 + row * 0.022, w: candyRack.w, h: 0.03 * row + 0.002, d: 0.02, y: counter.y + candyRack.h }, RAMP.steel, null, { name: 'candy rack' });
    for (let i = 0; i < 7; i++) {
      const ramp = RAMP[PACKS[(i * 3 + row * 5) % PACKS.length]];
      s.box({ x: candyRack.x - candyRack.w / 2 + 0.017 + i * 0.031, z: candyRack.z - 0.012 + row * 0.022, w: 0.024, h: 0.06, d: 0.012, y: counter.y + candyRack.h + 0.03 * row + 0.002 },
        ramp, (f, u, t) => (f === 'front' && t > 0.4 && t < 0.62 ? 'white' : null), { name: 'gum' });
    }
  }
  // Disposable lighters standing in a tray.
  s.box(lighters, RAMP.dark, null, { name: 'lighters' });
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4), col = i % 4;
    s.box({ x: lighters.x - 0.024 + col * 0.016, z: lighters.z + 0.012 - row * 0.022, w: 0.011, h: 0.06, d: 0.009, y: lighters.y + 0.004 },
      RAMP[['red', 'yellow', 'blue', 'green', 'pink', 'buoy', 'cyan', 'violet'][(i * 5) % 8]], (f, u, t) => (t > 0.86 ? 'steel5' : null), { name: 'lighter' });
  }
  // A clear charity box: coins in the bottom, the slot on top, a paper label.
  s.box(donation, RAMP.cyan, (f, u, t) => {
    if (f === 'top') return t > 0.4 && t < 0.6 && u > 0.25 && u < 0.75 ? 'ink' : 'cyan3';
    if (t < 0.28) return hash(Math.floor(u * 14), Math.floor(t * 10) + (f === 'front' ? 0 : 7)) < 0.6 ? 'yellow2' : 'steel5';
    if (f === 'front' && t > 0.5 && t < 0.78 && u > 0.15 && u < 0.85) return Math.hypot(u - 0.5, (t - 0.64) * 1.6) < 0.12 ? 'red2' : 'paper3';
    return f === 'front' ? 'cyan2' : 'cyan1';
  }, { name: 'donation box' });
  // The change tray: a shallow grey dish with a raised rim and rubber nubs.
  s.box(tray, RAMP.steel, (f, u, t) => {
    if (f !== 'top') return null;
    if (u < 0.08 || u > 0.92 || t < 0.1 || t > 0.9) return 'steel4';
    return (Math.floor(u * 12) + Math.floor(t * 8)) % 3 === 0 ? 'steel2' : 'steel1';
  }, { name: 'change tray' });
  // Flat paperwork lies in the counter layer, under the machines and the clerk's
  // phone. The staff rota on a clipboard: seven nights across, the same signature in every
  // night's box.
  const { rota, receipt1, receipt2, magazine } = space.personal;
  s.box(rota, RAMP.wood, (f, u, t) => {
    if (f !== 'top') return null;
    if (t > 0.86) return u > 0.35 && u < 0.65 ? 'steel6' : null;                             // the clip
    if (u < 0.06 || u > 0.94 || t < 0.06) return null;                                        // the board's edge
    if (t > 0.7) return (u * 7) % 1 < 0.1 ? 'paper1' : 'paper2';                               // the days
    if ((u * 7) % 1 < 0.1 || (t * 5) % 1 < 0.12) return 'paper1';
    return t > 0.42 && t < 0.62 && (u * 7) % 1 > 0.25 && (u * 7) % 1 < 0.8 ? 'blue2' : 'paper3';
  }, { name: 'rota' });
  // Loose receipts, a few printed lines on each.
  for (const slip of [receipt1, receipt2]) {
    s.box(slip, RAMP.paper, (f, u, t) => (f === 'top' && (t * 8) % 1 < 0.25 && u > 0.15 && u < (t > 0.8 ? 0.5 : 0.85) ? 'paper1' : f === 'top' ? 'white' : null), { name: 'receipt' });
  }
  // An old magazine: red masthead with its title, a cover star (dark hair, face,
  // shoulders in a blue top) on a yellow ground, cover lines down the left, a barcode.
  s.box(magazine, RAMP.paper, (f, u, t) => {
    if (f !== 'top') return null;
    if (t > 0.8) return t > 0.84 && t < 0.95 && u > 0.08 && u < 0.8 && (u * 10) % 1 < 0.75 ? 'white' : 'red2';
    const hx = (u - 0.6) / 0.22, hy = (t - 0.5) / 0.2;
    if (t < 0.32 && Math.abs(u - 0.6) < 0.3 - (0.32 - t) * 0.3) return 'blue2';                 // shoulders
    if (Math.hypot(hx, hy) < 0.85) return 'skin3';                                           // face
    if (Math.hypot(hx, (t - 0.56) / 0.24) < 1.2 && t > 0.44) return 'ink';                    // hair
    if (t < 0.14 && u < 0.3) return (u * 40) % 1 < 0.5 ? 'ink' : 'white';                     // barcode
    if (u < 0.32 && (t * 11) % 1 < 0.4) return t > 0.6 ? 'white' : 'red2';                     // cover lines
    return 'yellow2';
  }, { name: 'magazine' });
  // Contact shadows of everything that stands on the counter (not the drawer below it).
  const footprints = [...Object.values(space.fixtures).flat(), ...Object.values(space.personal), ...Object.values(space.decor)].filter(f => f.y === undefined);
  s.contactShadows(TOP, footprints);
  s.outline();
  return s.layer('main');
}

// ------------------------------------------------------------------ the clerk's things (nearest)
function front() {
  const s = new Stage();
  // The sign-in sheet on a hardboard clipboard, leaning back on the printer's front and
  // turned so one corner rests on it. Name, in and out columns under a header; the
  // same signature on every row but the last, which tonight's clerk hasn't signed.
  const { signIn, pen } = space.personal, [printer] = space.fixtures.printer;
  const add = (...vs) => vs.reduce((a, b) => a.map((x, i) => x + b[i])), mul = (v, k) => v.map(x => x * k);
  const lean = Math.atan2(printer.z - printer.d / 2 - signIn.z, printer.h);
  const c = Math.cos(signIn.yaw), sn = Math.sin(signIn.yaw);
  const across = [c, 0, -sn], back = [sn, 0, c];
  const up = add([0, Math.cos(lean), 0], mul(back, Math.sin(lean))), n = add([0, Math.sin(lean), 0], mul(back, -Math.cos(lean)));
  const U = mul(across, signIn.w), V = mul(up, signIn.h), T = mul(n, -signIn.d);
  const O = add([signIn.x, counter.y, signIn.z], mul(U, -0.5));
  const lit = (ramp, normal) => (P, sx, sy) => shade(ramp, lightAt(P, normal), sx, sy);
  const board = s.object('sign-in', { ramp: RAMP.wood }), paperLit = lit(RAMP.paper, n);
  // The board's edges, then its face: a hardboard margin round the sheet.
  s.quad(add(O, U), T, V, across, (u, t, P, sx, sy) => lit(RAMP.wood, across)(P, sx, sy), board);
  s.quad(O, T, V, mul(across, -1), (u, t, P, sx, sy) => lit(RAMP.wood, mul(across, -1))(P, sx, sy), board);
  s.quad(add(O, V), U, T, up, (u, t, P, sx, sy) => lit(RAMP.wood, up)(P, sx, sy), board);
  const ROWS = 6;
  s.quad(O, U, V, n, (u, t, P, sx, sy) => {
    if (u < 0.07 || u > 0.93 || t < 0.04 || t > 0.8) return t > 0.9 && Math.hypot((u - 0.5) * 2, (t - 0.95) * 3) < 0.12 ? 'ink' : lit(RAMP.wood, n)(P, sx, sy);
    if (t > 0.7) return t < 0.72 ? 'paper1' : 'paper2';                                            // the header
    const row = Math.floor((t - 0.04) / (0.66 / ROWS)), r = ((t - 0.04) / (0.66 / ROWS)) % 1;
    if (r < 0.16 || Math.abs(u - 0.62) < 0.03) return 'paper1';                                       // ruled lines
    if (row > 0 && r > 0.4 && r < 0.75 && u > 0.14 && u < 0.52 && Math.abs(u - 0.3) > 0.03) return 'blue2'; // the signature
    return paperLit(P, sx, sy);
  }, board);
  // The clip: a steel plate over the top edge with its rolled spring, standing proud of the board.
  const clip = s.object('clip', { ramp: RAMP.steel });
  const clipO = add(O, mul(U, 0.3), mul(V, 0.78), mul(n, 0.004));
  s.quad(clipO, mul(U, 0.4), mul(V, 0.26), n, (u, t, P, sx, sy) => (t > 0.66 && t < 0.82 ? 'steel6' : t > 0.82 ? 'steel5' : lit(RAMP.steel, n)(P, sx, sy)), clip);
  // Its shadow on the printer's front beside the raised corner.
  const front = printer.z - printer.d / 2, edge = add(O, U);
  s.quad([edge[0], counter.y, front], [0.012, 0, 0], [0, printer.h, 0], [0, 0, -1], (u, t) => (u < 0.5 + t * 0.5 ? 'ink' : null), s.object('shadow'));
  // The pen on its chain: a biro by the board's foot, the bead chain looping down from the clip.
  s.box(pen, RAMP.blue, (f, u, t) => (u > 0.85 ? 'steel5' : u < 0.12 ? 'blue0' : null), { name: 'pen' });
  const tie = add(clipO, mul(U, 0.4)), end = [pen.x - Math.cos(pen.yaw) * pen.w / 2, counter.y + pen.h, pen.z + Math.sin(pen.yaw) * pen.w / 2];
  const sag = add(mul(add(tie, end), 0.5), [0, -0.05, -0.02]);
  const string = s.object('string', { outline: false });
  for (let i = 0; i <= 80; i++) {
    const k = i / 80, P = add(mul(tie, (1 - k) ** 2), mul(sag, 2 * k * (1 - k)), mul(end, k * k));
    P[1] = Math.max(P[1], counter.y + 0.002);
    const [x, y] = space.project(...P).map(Math.round);
    if (x >= 0 && y >= 0 && x < s.w && y < s.h) s.plot(y * s.w + x, P[2] - 0.01, i % 6 < 3 ? 'steel6' : 'steel3', string);   // a bead chain
  }
  s.outline();
  return s.layer('main');
}

// ------------------------------------------------------------------ fixtures as sprites
function fixture(boxes, ramps, decorate) {
  const s = new Stage();
  boxes.forEach((b, i) => s.box(b, ramps[i], decorate[i] || null));
  s.outline();
  return s.sprite();
}

// A face drawn by hand at about its size on screen, laid across a box face: the
// decorator samples it by (u, t), t running bottom to top. `only` names the face.
function panel(only, w, h, draw) {
  const p = new Pix(w, h);
  draw(p);
  return (f, u, t) => {
    if (f !== only) return null;
    const v = p.data[Math.min(h - 1, Math.floor((1 - t) * h)) * w + Math.min(w - 1, Math.floor(u * w))];
    return v ? palette.names[v] : null;
  };
}
const both = (...decorators) => (f, u, t) => decorators.reduce((found, d) => found || d(f, u, t), null);
const text = (p, x, y, words, color) => sign(p, x, y, words, color);

// Round things (the scanner gun) are sculpted (art/tools/sculpt.cjs) inside the
// fixture's box and shaded with the same ramps; `paint(hit)` may override a pixel.
const LIGHT = sculpt.vec.norm([-0.4, 0.8, -0.45]);
function sculpted(box, field, ramp, paint) {
  const y0 = box.y ?? counter.y;
  const corners = [-1, 1].flatMap(sx => [0, 1].flatMap(sy => [-1, 1].map(sz => space.project(box.x + sx * box.w / 2, y0 + sy * box.h, box.z + sz * box.d / 2))));
  const x0 = Math.floor(Math.min(...corners.map(c => c[0]))) - 2, x1 = Math.ceil(Math.max(...corners.map(c => c[0]))) + 2;
  const yA = Math.floor(Math.min(...corners.map(c => c[1]))) - 2, yB = Math.ceil(Math.max(...corners.map(c => c[1]))) + 2;
  const w = x1 - x0, h = yB - yA, hits = sculpt.render(field, w, h, [x0, yA]);
  const p = new Pix(w, h);
  hits.forEach((hit, i) => {
    if (!hit) return;
    const lum = (0.3 + 0.7 * Math.max(0, sculpt.vec.dot(hit.n, LIGHT))) * (0.6 + 0.4 * hit.ao);
    p.px(i % w, Math.floor(i / w), (paint && paint(hit)) || ramp[lum < 0.35 ? 1 : lum < 0.6 ? 2 : lum < 0.85 ? 3 : 4]);
  });
  for (let i = 0; i < hits.length; i++) {
    const x = i % w, y = Math.floor(i / w);
    if (hits[i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const j = (y + dy) * w + x + dx; return x + dx < 0 || x + dx >= w || y + dy < 0 || y + dy >= h || !hits[j] || hits[j].P[2] > hits[i].P[2] + 0.02; })) p.px(x, y, ramp[0]);
  }
  return p.anchor('at', x0, yA);
}

function sprites() {
  const F = space.fixtures;
  const result = {};

  // Microwave, a commercial stainless one: brushed steel, the door's gap and frame, a
  // perforated window onto the dim cavity (turntable, old splashes, a glare across the
  // glass), a handle bar standing off the door, raised keys and START/STOP, and the
  // store's laminated heating-time card on its side. Heating, the cavity glows warm over
  // the turntable and the display counts down; idle, the runtime shows the time.
  const micro = heating => {
    const [m] = F.microwave, s = new Stage();
    const front = panel('front', 82, 48, p => {
      p.rect(1, 1, 54, 46, 'steel4').frame(1, 1, 54, 46, 'ink');                                 // the door and its gap
      p.hline(2, 53, 2, 'steel6').vline(2, 2, 45, 'steel5');
      for (let y = 7; y < 41; y++) for (let x = 6; x < 50; x++) {
        let c;
        if (heating) {
          const d = Math.hypot((x - 27) / 21, (y - 23) / 16);
          c = d < 0.45 ? 'yellow3' : d < 0.75 ? 'yellow2' : 'orange2';
        } else {
          c = y < 11 ? 'steel3' : 'steel2';                                                       // the cavity, lit from its roof
          if (Math.abs((x - 27) / 18) ** 2 + ((y - 35) / 3) ** 2 < 1) c = y < 35 ? 'steel5' : 'steel4';   // the turntable
          if ([[11, 13], [12, 13], [12, 14], [37, 20], [38, 20], [21, 27], [22, 27], [44, 29]].some(([sx, sy]) => sx === x && sy === y)) c = 'wood2';   // old splashes
        }
        if (x % 2 === 0 && y % 2 === 0) c = heating ? 'orange1' : 'steel0';                        // the perforated screen
        if (x + y > 20 && x + y < 27 && (x + y) % 3 !== 0 && x < 22) c = heating ? 'yellow3' : 'steel5';   // glare on the glass
        p.px(x, y, c);
      }
      if (heating) p.ellipse(27, 36, 14, 2, 'orange3').ellipse(27, 33, 6, 3, 'wood2').hline(22, 32, 30, 'wood3');   // the plate and a bowl
      p.frame(5, 6, 46, 36, 'steel2').hline(6, 49, 41, 'steel5');
      p.vline(56, 1, 46, 'ink');                                                                 // the panel's seam
      p.rect(60, 4, 20, 9, 'ink').frame(60, 4, 20, 9, 'steel2').hline(61, 78, 12, 'steel5');
      if (heating) text(p, 62, 6, '0:42', 'phos4');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {                                   // raised keys
        const kx = 61 + c * 6, ky = 16 + r * 5;
        p.rect(kx, ky, 5, 3, 'steel5').hline(kx, kx + 4, ky, 'steel7').hline(kx, kx + 4, ky + 3, 'steel1');
      }
      for (const [kx, top, body] of [[61, 'green3', 'green2'], [71, 'red3', 'red2']]) p.rect(kx, 38, 8, 5, body).hline(kx, kx + 7, 38, top).hline(kx, kx + 7, 43, 'steel1');
    });
    s.box(m, RAMP.steel, (f, u, t) => {
      const found = front(f, u, t);
      if (found) return found;
      if (f === 'right') {                                                                       // the heating-time card
        if (u > 0.12 && u < 0.62 && t > 0.3 && t < 0.86) {
          if (t > 0.76) return 'red2';
          return (t * 14) % 1 < 0.35 && u > 0.17 && u < 0.57 ? (u < 0.4 ? 'steel3' : 'steel4') : 'white';
        }
        return Math.floor(t * 34) % 4 === 0 ? 'steel4' : null;                                   // brushed
      }
      if (f === 'top') return Math.floor(t * 46) % 5 === 0 ? 'steel6' : null;
      return null;
    });
    // The handle bar on its stand-offs, off the door's opening edge.
    const hx = m.x - m.w / 2 + m.w * (52 / 82), fz = m.z - m.d / 2;
    s.box({ x: hx, z: fz - 0.016, w: 0.016, h: 0.17, d: 0.01, y: counter.y + 0.05 }, RAMP.steel, (f, u, t) => (f === 'front' ? (u < 0.4 ? 'steel7' : 'steel5') : null));
    for (const y of [0.06, 0.2]) s.box({ x: hx, z: fz - 0.007, w: 0.008, h: 0.008, d: 0.012, y: counter.y + y }, RAMP.steel);
    s.outline();
    return s.sprite();
  };
  result['store-microwave'] = micro(false);
  result['store-microwave-heating'] = micro(true);

  // Register: a beige CRT with the green-screen sale (drawn by the runtime), brand
  // badge, power light and a label-tape REG 2. In front of it a matching beige POS
  // keypad, a wedge sloping toward the clerk, its keys raised caps on the slope: a 4x4
  // block of product keys with coloured paper labels under clear caps, a dark number pad
  // with a double 0, and a function column (VOID, CLEAR, the amber record key, a
  // double-height TOTAL). A card-reader groove runs along the back, the mode lock sits
  // at the back left with its brass key turned to REG; the 0, CLEAR and TOTAL are worn,
  // grime sits between the keys and old price-gun labels are stuck on the back edge.
  const [monitor, keypad] = F.pos;
  const vec = { add: (...vs) => vs.reduce((a, b) => a.map((x, i) => x + b[i])), mul: (v, k) => v.map(x => x * k) };
  const rise = keypad.h - keypad.front, slopeLength = Math.hypot(keypad.d, rise);
  const along = [0, rise / slopeLength, keypad.d / slopeLength], normal = [0, keypad.d / slopeLength, -rise / slopeLength];
  const x0 = keypad.x - keypad.w / 2, z0 = keypad.z - keypad.d / 2;
  const onSlope = (u, t) => [x0 + u * keypad.w, counter.y + keypad.front + t * rise, z0 + t * keypad.d];
  const lit = (ramp, n) => (P, sx, sy) => shade(ramp, lightAt(P, n), sx, sy);
  // A key cap centred at (u, t) on the slope, w across and d along it, standing h proud.
  function keyCap(s, u, t, w, d, ramp, top = null, h = 0.004) {
    const id = s.object('key', { ramp });
    const O = vec.add(onSlope(u, t), [-w / 2, 0, 0], vec.mul(along, -d / 2)), U = [w, 0, 0], V = vec.mul(along, d), H = vec.mul(normal, h);
    const face = n => (a, b, P, sx, sy) => lit(ramp, n)(P, sx, sy);
    s.quad(vec.add(O, H), U, V, normal, (a, b, P, sx, sy) => (top && top(a, b)) || lit(ramp, normal)(P, sx, sy), id);
    s.quad(O, U, H, vec.mul(along, -1), face(vec.mul(along, -1)), id);
    s.quad(O, V, H, [-1, 0, 0], face([-1, 0, 0]), id);
    s.quad(vec.add(O, U), V, H, [1, 0, 0], face([1, 0, 0]), id);
  }
  const ROW = 0.185, rowT = r => 0.08 + (r + 0.5) * ROW, KEY = 0.02;
  const LABELS = ['buoy2', 'green2', 'yellow2', 'red2', 'blue2', null, 'pink2', 'cyan2', 'violet1', 'orange2', null, 'green2', 'yellow2', null, 'blue2', 'red2'];
  const [rec] = F.recordKey, recU = (rec.x - x0) / keypad.w, fnU = [recU, recU + 0.095];
  result['store-pos'] = (() => {
    const s = new Stage();
    // The monitor: a deep bezel, then the CRT's housing stepping in toward the back,
    // with vent slots down its side; knobs and a power button on the chin.
    const front = monitor.z - monitor.d / 2;
    const vents = (f, u, t) => (f === 'right' && t > 0.5 && t < 0.92 && u > 0.15 && u < 0.85 && (t * 22) % 1 < 0.35 ? 'cream1' : null);
    s.box({ ...monitor, z: front + 0.06, d: 0.12 }, RAMP.cream, both(panel('front', 80, 73, p => {
      p.rect(0, 0, 80, 73, 'cream3');
      p.hline(0, 79, 0, 'cream4').vline(0, 0, 72, 'cream4').hline(0, 79, 72, 'cream1').vline(79, 0, 72, 'cream1');
      p.rect(6, 5, 68, 52, 'cream1').rect(8, 7, 64, 48, 'phos0');
      for (const [x, y] of [[8, 7], [71, 7], [8, 54], [71, 54]]) p.px(x, y, 'cream1');             // rounded glass
      p.rect(8, 59, 16, 5, 'buoy2').hline(8, 23, 59, 'buoy3');                                // brand badge
      p.rect(27, 58, 19, 7, 'white').hline(27, 45, 64, 'paper2').px(45, 58, 'paper2');          // label tape
      text(p, 29, 59, 'REG2', 'ink');
      for (const kx of [50, 55]) p.ellipse(kx, 61, 2, 2, 'cream1').px(kx, 60, 'cream5').px(kx - 1, 61, 'cream4');   // brightness, contrast
      p.rect(59, 59, 4, 4, 'cream1').rect(60, 60, 2, 2, 'cream4').px(64, 60, 'phos4');          // power button and light
      p.rect(65, 56, 12, 10, 'yellow2').hline(65, 76, 56, 'yellow3').px(76, 65, 'yellow1');        // a sticky note
      p.hline(67, 74, 59, 'blue1').hline(67, 72, 61, 'blue1').hline(68, 73, 63, 'blue1');
    }), vents));
    s.box({ x: monitor.x, z: front + 0.17, w: monitor.w * 0.82, h: monitor.h * 0.86, d: 0.1, y: counter.y + monitor.h * 0.04 }, RAMP.cream, vents);
    s.box({ x: monitor.x, z: front + 0.25, w: monitor.w * 0.58, h: monitor.h * 0.66, d: 0.06, y: counter.y + monitor.h * 0.1 }, RAMP.cream);
    // The keypad's body: the sloping top, the low front lip, the wedge-shaped ends.
    const body = s.object('keypad', { ramp: RAMP.cream });
    const lock = (u, t) => Math.hypot((u - 0.09) * keypad.w, (t - 0.86) * slopeLength);
    s.quad(onSlope(0, 0), [keypad.w, 0, 0], vec.mul(along, slopeLength), normal, (u, t, P, sx, sy) => {
      if (t > 0.87 && t < 0.9 && u > 0.42 && u < 0.95) return 'ink';                               // card-reader groove
      const r = lock(u, t);
      if (r < 0.0035) return 'ink';
      if (r < 0.008) return 'steel5';
      if (r < 0.0095) return 'steel1';
      if (u < 0.015 || u > 0.985 || t > 0.97) return 'cream1';
      if (t > 0.9 && u > 0.17 && u < 0.39) return (u * 30) % 1 < 0.6 ? ((u * 15) % 1 < 0.5 ? 'white' : 'orange2') : 'cream2';   // price-gun labels stuck on the edge
      if (t > 0.06 && t < 0.84 && u > 0.04 && u < 0.97 && hash(sx, sy) < 0.35) return 'cream2';    // grime between the keys
      return lit(RAMP.cream, normal)(P, sx, sy);
    }, body);
    s.quad([x0, counter.y, z0], [keypad.w, 0, 0], [0, keypad.front, 0], [0, 0, -1], (u, t, P, sx, sy) => lit(RAMP.cream, [0, 0, -1])(P, sx, sy), body);
    for (const [u, n] of [[0, [-1, 0, 0]], [1, [1, 0, 0]]]) {
      s.quad([x0 + u * keypad.w, counter.y, z0], [0, 0, keypad.d], [0, keypad.h, 0], n,
        (a, b, P, sx, sy) => (b * keypad.h > keypad.front + a * rise ? null : lit(RAMP.cream, n)(P, sx, sy)), body);
    }
    // Product keys: pale caps over coloured paper labels.
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const label = LABELS[r * 4 + c];
      keyCap(s, 0.06 + (c + 0.5) * 0.085, rowT(r), 0.022, KEY, RAMP.paper, (a, b) => (label && a > 0.2 && a < 0.8 && b > 0.3 && b < 0.75 ? label : null));
    }
    // The number pad: dark caps with a centre dot, the double 0 worn shiny.
    for (let r = 1; r < 4; r++) for (let c = 0; c < 3; c++) {
      keyCap(s, 0.4725 + c * 0.085, rowT(r), 0.022, KEY, RAMP.steel, (a, b) => (a > 0.4 && a < 0.6 && b > 0.35 && b < 0.65 ? 'steel6' : null));
    }
    keyCap(s, 0.515, rowT(0), 0.0492, KEY, RAMP.steel, (a, b) => (a > 0.25 && a < 0.75 && b > 0.3 && b < 0.7 ? 'steel7' : null));
    keyCap(s, 0.6425, rowT(0), 0.022, KEY, RAMP.steel);
    // The function column; the record key is its own sprite.
    keyCap(s, fnU[0], rowT(3), 0.026, KEY, RAMP.steel);                                         // VOID
    keyCap(s, fnU[1], rowT(3), 0.026, KEY, RAMP.red, (a, b) => (a > 0.3 && a < 0.7 && b > 0.3 && b < 0.7 ? 'red4' : null));   // CLEAR, worn
    keyCap(s, fnU[1], rowT(2), 0.026, KEY, RAMP.steel);                                         // SUBTOTAL
    keyCap(s, fnU[0], rowT(1), 0.026, KEY, RAMP.steel);
    keyCap(s, fnU[0], rowT(0), 0.026, KEY, RAMP.steel);
    keyCap(s, fnU[1], (rowT(0) + rowT(1)) / 2, 0.026, ROW * slopeLength + KEY, RAMP.green,
      (a, b) => (a > 0.3 && a < 0.7 && b > 0.35 && b < 0.65 ? 'green4' : null));               // TOTAL, worn
    // The brass key in the lock, turned to REG.
    const [kx, ky, kz] = onSlope(0.09, 0.86);
    s.box({ x: kx, z: kz, w: 0.016, h: 0.02, d: 0.004, yaw: 0.6, y: ky }, RAMP.yellow,
      (f, u, t) => (t > 0.55 && Math.hypot(u - 0.5, t - 0.78) < 0.14 ? 'ink' : null), { name: 'mode key' });
    s.outline();
    return s.sprite();
  })();

  // The record key: an amber cap in the function column, lit up while a record waits.
  const recordKey = on => {
    const s = new Stage();
    keyCap(s, recU, (rec.z - z0) / keypad.d, rec.w, rec.d, RAMP.yellow, (a, b) => (on ? 'white' : a < 0.45 && b > 0.55 ? 'white' : 'yellow3'), rec.h);
    s.outline();
    return s.sprite();
  };
  result['store-pos-key'] = recordKey(false);
  result['store-pos-key-lit'] = recordKey(true);

  // Scanner gun in its cradle, turned side-on so its pistol shape reads: the head
  // points off toward the customer's side, its red window at the tip; the grip
  // drops into the cradle; the window and a light on top turn bright while reading.
  const scanner = reading => {
    const [b] = F.scanner, y0 = counter.y, { box, cone, smin } = sculpt, v = sculpt.vec;
    const f = v.norm([-0.85, 0.12, 0.5]), up = v.norm(v.sub([0, 1, 0], v.mul(f, v.dot([0, 1, 0], f))));
    const side = [f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]];
    const head = [b.x, y0 + 0.14, b.z], tip = v.add(head, v.mul(f, 0.055)), led = v.add(v.add(head, v.mul(f, -0.035)), v.mul(up, 0.028));
    const field = p => {
      const cradle = box(p, [b.x, y0 + 0.016, b.z], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0.045, 0.016, 0.05], 0.008);
      const nose = box(p, head, [f, up, side], [0.06, 0.026, 0.022], 0.01);
      const grip = cone(p, v.add(head, v.add(v.mul(f, -0.03), v.mul(up, -0.01))), v.add(v.add(head, v.mul(f, -0.055)), v.mul(up, -0.11)), 0.017, 0.015);
      const trigger = cone(p, v.add(head, v.add(v.mul(f, -0.005), v.mul(up, -0.03))), v.add(head, v.add(v.mul(f, -0.012), v.mul(up, -0.05))), 0.006, 0.005);
      return [smin(Math.min(cradle, trigger), smin(grip, nose, 0.012), 0.004), 0];
    };
    return sculpted(b, field, RAMP.dark, hit => {
      if (v.dot(v.sub(hit.P, tip), f) > -0.006) return reading ? 'red4' : 'red1';             // the window
      if (v.len(v.sub(hit.P, led)) < 0.007) return reading ? 'red4' : 'green1';
      return null;
    });
  };
  result['store-scanner'] = scanner(false);
  result['store-scanner-reading'] = scanner(true);

  // Chip-and-PIN terminal on its swivel stand, turned to face the customer, so the
  // clerk sees its back: a maker's sticker, vents, status lights (green once approved)
  // and the coiled cable dropping to the stand; on top the card slot, its far edge lit
  // by the screen the customer is reading.
  const terminal = (approved, card = false) => fixture(card ? [...F.terminal, cardInSlot] : F.terminal, [RAMP.dark, RAMP.steel, RAMP.blue], [both(panel('back', 16, 28, p => {
    p.rect(3, 3, 10, 6, 'paper2').hline(4, 11, 5, 'steel3').hline(4, 9, 7, 'steel3');           // sticker
    for (let y = 11; y < 17; y += 2) p.hline(4, 11, y, 'ink');                                   // vents
    p.px(4, 20, approved ? 'green4' : 'green1').px(7, 20, 'buoy2').px(10, 20, approved ? 'green4' : 'steel3');
    for (let y = 22; y < 28; y++) p.px(12 + (y % 2), y, 'steel5').px(13 - (y % 2), y, 'ink');   // coiled cable
  }), (f, u, t) => {
    if (f !== 'top') return null;
    if (t > 0.45 && t < 0.58 && u > 0.12 && u < 0.88) return 'ink';                           // card slot
    if (t < 0.3) return approved ? 'phos4' : 'phos2';                                          // screen glow
    return null;
  }), (f, u, t) => (f === 'top' && Math.hypot(u - 0.5, t - 0.5) < 0.18 ? 'steel2' : null),   // the swivel
  (f, u, t) => (f === 'back' || f === 'front' ? (t > 0.55 && t < 0.75 ? 'paper3' : u < 0.3 && t < 0.45 ? 'yellow2' : null) : null)]);   // the card: stripe, chip
  // The customer's card standing in the slot, its back to the clerk.
  const [pinpad] = F.terminal;
  const cardInSlot = { x: pinpad.x, z: pinpad.z, w: 0.054, h: 0.034, d: 0.002, yaw: pinpad.yaw, y: pinpad.y + pinpad.h - 0.012 };
  result['store-terminal'] = terminal(false);
  result['store-terminal-card'] = terminal(false, true);
  result['store-terminal-approved'] = terminal(true, true);

  // The cash drawer under the register, in a dark steel housing hung under the counter.
  // Shut, its front: folded steel edges, a bevelled check slot, a round key lock with
  // its keyway, a CASH label tape, a maker's plate, corner screws, the finger recess
  // under its lower edge and knee scuffs. Open, it slides out towards the clerk and
  // shows its till, a black plastic insert: stacks of notes under four spring clips at
  // the back, five cups of copper, silver and gold coins in front.
  const [till] = F.drawer;
  // The housing frames the drawer's sides and foot; its top sits in the counter's shadow.
  const housing = s => s.box({ x: till.x, z: till.z + 0.02, w: till.w + 0.034, h: till.h, d: 0.03, y: till.y - 0.012 }, RAMP.dark,
    (f, u, t) => (f === 'top' ? 'ink' : null), { name: 'drawer housing' });
  const drawerFront = panel('front', 104, 23, p => {
    for (let y = 2; y < 20; y++) if (y > 12) for (let x = 1; x < 103; x++) if ((x + y) % 2 === 0 && y > 12 + (x % 3)) p.px(x, y, 'steel3');   // darker toward the floor
    p.hline(0, 103, 0, 'steel6').hline(0, 103, 1, 'steel5').hline(0, 103, 22, 'ink').hline(4, 99, 21, 'steel1').hline(0, 103, 20, 'steel2');   // folded edges, the finger recess
    p.vline(0, 0, 22, 'steel5').vline(103, 0, 22, 'steel2');
    for (const [x, y] of [[3, 3], [100, 3], [3, 18], [100, 18]]) p.px(x, y, 'steel1').px(x - 1, y - 1, 'steel6');   // screws
    p.rect(30, 5, 44, 5, 'steel2').hline(30, 73, 5, 'steel1').rect(32, 7, 40, 2, 'ink').hline(30, 73, 10, 'steel6');   // check slot
    p.rect(6, 6, 19, 7, 'white').hline(6, 24, 12, 'paper2');                                    // label tape, two pixels round the word
    text(p, 8, 7, 'CASH', 'ink');
    p.rect(42, 13, 20, 4, 'steel2').hline(43, 60, 14, 'steel4').hline(43, 56, 15, 'steel3');       // maker's plate
    p.ellipse(91, 11, 4, 4, 'steel6').ellipse(91, 11, 3, 3, 'steel3').vline(91, 9, 13, 'ink').px(90, 9, 'steel7');   // key lock
    for (const [x, y, len] of [[14, 17, 6], [36, 18, 3], [66, 18, 7], [80, 17, 5]]) p.hline(x, x + len, y, 'steel4');   // knee scuffs
  });
  result['store-drawer'] = (() => {
    const s = new Stage();
    housing(s);
    s.box(till, RAMP.steel, drawerFront);
    s.outline();
    return s.sprite();
  })();
  const NOTES = ['green', 'blue', 'orange', 'red'], COINS = [['wood2', 'wood3'], ['steel5', 'steel7'], ['yellow2', 'yellow3'], ['steel5', 'steel7'], ['wood2', 'wood3']];
  result['store-drawer-open'] = (() => {
    const s = new Stage(), d = space.drawerTravel;
    housing(s);
    s.box({ ...till, z: counter.near - d / 2, d }, RAMP.steel, (f, u, t) => {
      if (f === 'front') return drawerFront(f, u, t);
      if (f !== 'top') return null;
      if (u < 0.04 || u > 0.96 || t > 0.94 || t < 0.06) return 'steel4';                        // the till's rim
      if (t > 0.5) {                                                                           // notes under their clips
        const cell = Math.floor((u - 0.04) / 0.23), cu = ((u - 0.04) / 0.23) % 1, nt = (t - 0.5) / 0.44;
        if (cu < 0.06 || cell > 3) return 'ink';
        const note = NOTES[cell];
        if (nt > 0.86) return cu > 0.4 && cu < 0.6 ? 'steel4' : 'ink';                           // the clip's hinge
        if (nt > 0.66 && nt < 0.76 && cu > 0.1 && cu < 0.96) return nt < 0.71 ? 'steel6' : 'steel2';   // the spring clip
        if (cu < 0.1 || cu > 0.96) return 'ink';
        if (nt < 0.14) return (nt * 40) % 2 < 1 ? 'paper2' : note + '1';                         // the stack's edges
        if (cu < 0.16 || cu > 0.9 || nt > 0.62) return note + '3';                               // the top note's border
        if (Math.hypot((cu - 0.55) / 0.16, (nt - 0.38) / 0.18) < 1) return note + '1';             // the portrait
        if (cu < 0.32 && nt > 0.42) return 'white';                                              // the value
        return note + '2';
      }
      if (Math.abs(t - 0.48) < 0.03) return 'ink';
      const cell = Math.floor((u - 0.04) / 0.184), cu = ((u - 0.04) / 0.184) % 1, ct = (t - 0.06) / 0.39;
      if (cu < 0.08 || cell > 4) return 'ink';                                                 // coin cups
      for (const [cx, cy] of [[0.32, 0.25], [0.72, 0.3], [0.5, 0.55], [0.3, 0.8], [0.74, 0.78]]) {
        const r = Math.hypot((cu - cx) * 0.074, (ct - cy) * 0.066);
        if (r < 0.011) return r < 0.006 && (cu - cx) < 0 ? COINS[cell][1] : COINS[cell][0];
        if (r < 0.0125) return 'steel1';
      }
      return 'steel0';
    });
    s.outline();
    return s.sprite();
  })();
  // Carrier bags in a steel pocket rack under the counter: three pockets with S, M and
  // L label tapes, each holding a stack of folded white bags whose tops and handle
  // loops stand above the rim; the middle stack shows the brand buoy.
  result['store-bags'] = fixture(F.bags, [RAMP.steel], [panel('front', 72, 26, p => {
    p.rect(0, 0, 72, 26, 'steel2').hline(0, 71, 25, 'ink').vline(0, 0, 25, 'steel4').vline(71, 0, 25, 'steel1');
    [['S', 2], ['M', 26], ['L', 50]].forEach(([size, x], i) => {
      const h = [5, 7, 9][i];                                                                   // bigger bags stand taller
      for (let k = 0; k < 4; k++) p.hline(x + 1 + (k % 2), x + 19 - (k % 2), 11 - h + k * 2, k % 2 ? 'paper2' : 'white');   // folded tops
      p.rect(x + 1, 12 - h, 19, h, 'paper3');
      for (let k = 0; k < 4; k++) p.hline(x + 1 + (k % 2), x + 19 - (k % 2), 12 - h + k * 2, k % 2 ? 'paper2' : 'white');
      for (const hx of [x + 5, x + 15]) p.ellipse(hx, 11 - h, 3, 2, 'white').ellipse(hx, 11 - h, 2, 1, 'steel2');   // handle loops
      if (i === 1) p.ellipse(x + 10, 9 - h + 4, 2, 2, 'buoy2').px(x + 10, 9 - h + 4, 'navy2');
      p.rect(x, 12, 21, 13, 'steel4').hline(x, x + 20, 12, 'steel6').vline(x, 12, 24, 'steel5').vline(x + 20, 12, 24, 'steel2');   // the pocket
      p.rect(x + 6, 16, 9, 7, 'white').hline(x + 6, x + 14, 22, 'paper2');                      // size tape
      text(p, x + 9, 17, size, 'ink');
    });
  })]);

  // Receipt printer, a two-tone thermal printer: a charcoal base with a FEED button,
  // power and paper lights and a brand line; a lighter clamshell lid set in from the
  // base's edges, with its seam, the tear bar and the exit slot across its top; the
  // last receipt still standing out of the slot and curling toward the clerk.
  result['store-printer'] = (() => {
    const [b] = F.printer, s = new Stage(), base = b.h * 0.6, LID = ['steel0', 'steel1', 'steel2', 'steel3', 'steel5'];
    s.box({ ...b, h: base }, RAMP.dark, (f, u, t) => {
      if (f !== 'front') return null;
      if (t > 0.45 && t < 0.75 && u > 0.08 && u < 0.3) return 'steel3';                        // brand line
      if (t > 0.35 && t < 0.75 && u > 0.6 && u < 0.72) return 'steel4';                         // FEED
      if (t > 0.45 && t < 0.7 && u > 0.78 && u < 0.83) return 'phos4';                          // power
      if (t > 0.45 && t < 0.7 && u > 0.87 && u < 0.92) return 'red1';                            // paper
      return null;
    }, { name: 'printer base' });
    const lid = { x: b.x, z: b.z + b.d * 0.05, w: b.w * 0.92, d: b.d * 0.86, h: b.h - base, y: counter.y + base };
    const exitT = (b.exit * b.d - (lid.z - lid.d / 2 - (b.z - b.d / 2))) / lid.d;
    s.box(lid, LID, (f, u, t) => {
      if (f === 'top' && Math.abs(t - exitT) < 0.03 && u > 0.12 && u < 0.88) return 'ink';         // exit slot
      if (f === 'top' && t > exitT - 0.09 && t < exitT - 0.03 && u > 0.1 && u < 0.9) return (Math.floor(u * 40) % 2 ? 'steel6' : 'steel4');   // tear bar
      if (f === 'top' && t > 0.93) return 'steel3';                                                // the hinge
      if (f === 'front' && t > 0.7) return 'steel4';                                               // rounded front edge
      return null;
    }, { name: 'printer lid' });
    // The receipt: up out of the slot, then bending forward over the tear bar.
    const paper = s.object('receipt', { ramp: RAMP.paper }), pw = 0.058, px = b.x + 0.01;
    let P = [px - pw / 2, counter.y + b.h, b.z - b.d / 2 + b.d * b.exit];
    [[0.03, 0], [0.012, 0.6], [0.012, 1.2]].forEach(([len, tilt], i) => {
      const V = [0, len * Math.cos(tilt), -len * Math.sin(tilt)], n = [0, Math.sin(tilt), -Math.cos(tilt)];
      s.quad(P, [pw, 0, 0], V, n, (u, t, Q, sx, sy) => (i === 0 && u > 0.12 && u < 0.8 && (t * 5) % 1 < 0.3 ? 'paper1' : shade(RAMP.paper, lightAt(Q, n), sx, sy)), paper);
      P = vec.add(P, V);
    });
    s.outline();
    return s.sprite();
  })();

  // The customer's shopping basket, red plastic: rows of holes in its sides, a white
  // label on the front, a thicker rim, and the black handles folded down along the long
  // sides. Full, goods fill its mouth and a few stand up out of it; empty, its gridded
  // floor.
  const basket = full => {
    const [b] = F.basket, s = new Stage(), top = counter.y + b.h;
    const GOODS = ['yellow2', 'blue2', 'green2', 'white', 'orange2', 'pink2', 'cyan2', 'paper3'];
    s.box(b, RAMP.red, (f, u, t) => {
      if (f === 'top') {
        if (u < 0.04 || u > 0.96 || t < 0.06 || t > 0.94) return 'red3';                         // the rim
        if (full) {
          const cell = hash(Math.floor(u * 6), Math.floor(t * 3));
          return (u * 6) % 1 < 0.1 || (t * 3) % 1 < 0.12 ? 'red0' : GOODS[Math.floor(cell * GOODS.length)];
        }
        return (u * 14) % 1 < 0.3 || (t * 7) % 1 < 0.3 ? 'red0' : 'red1';                         // the floor's grid
      }
      if (t > 0.84) return 'red3';
      if (f === 'front' && u > 0.38 && u < 0.62 && t > 0.5 && t < 0.76) return 'white';           // label
      if (t > 0.12 && (u * 9) % 1 > 0.25 && (u * 9) % 1 < 0.75 && (t * 4) % 1 > 0.3 && (t * 4) % 1 < 0.75) return 'red0';   // holes
      return null;
    }, { name: 'basket' });
    for (const dz of [-1, 1]) s.box({ x: b.x, z: b.z + dz * (b.d / 2 - 0.01), w: b.w * 0.7, h: 0.008, d: 0.014, y: top }, RAMP.dark, null, { name: 'handle' });
    // Full, a carton, a bottle and a snack bag stand up out of its mouth.
    if (full) {
      s.box({ x: b.x - 0.08, z: b.z + 0.03, w: 0.07, h: 0.07, d: 0.05, y: top - 0.04 }, RAMP.paper, (f, u, t) => (t > 0.55 && t < 0.75 ? 'blue2' : null), { name: 'carton' });
      s.box({ x: b.x + 0.01, z: b.z + 0.04, w: 0.035, h: 0.11, d: 0.035, y: top - 0.05 }, RAMP.green, (f, u, t) => (t > 0.4 && t < 0.62 ? 'white' : t > 0.9 ? 'steel5' : null), { name: 'bottle' });
      s.box({ x: b.x + 0.08, z: b.z + 0.02, w: 0.09, h: 0.06, d: 0.03, y: top - 0.035, yaw: 0.2 }, RAMP.orange, (f, u, t) => (Math.hypot(u - 0.5, t - 0.5) < 0.2 ? 'yellow3' : null), { name: 'snack bag' });
    }
    s.outline();
    return s.sprite();
  };
  result['store-basket'] = basket(true);
  result['store-basket-empty'] = basket(false);

  // The radio: perforated speaker, a lit dial whose scale starts below 88 so the
  // needle can sit on 87.7, tuning and volume knobs, the band, a signal light. It
  // stays low-key until a broadcast comes through (echo).
  const radio = echo => {
    const [body] = F.radio, top = counter.y + body.h;
    const s = new Stage();
    s.box(body, RAMP.red, panel('front', 48, 28, p => {
      p.ellipse(12, 14, 10, 10, 'red0').ellipse(12, 14, 9, 9, 'steel1');
      for (let y = 6; y <= 22; y++) for (let x = 4; x <= 20; x++) if (Math.hypot(x - 12, y - 14) < 8 && (x + (y % 2)) % 2 === 0 && y % 2 === 0) p.px(x, y, echo ? 'steel4' : 'steel3');
      p.rect(25, 4, 21, 11, 'red0').rect(26, 5, 19, 9, echo ? 'yellow3' : 'cream3');
      p.hline(26, 44, 9, 'cream1');                                                            // the scale: a rule and ticks, no numbers
      for (let x = 27; x < 45; x += 2) p.vline(x, (x - 27) % 6 === 0 ? 6 : 8, 10, 'cream0');
      for (const kx of [28, 42]) p.ellipse(kx, 21, 3, 3, 'steel0').ellipse(kx, 21, 2, 2, 'steel2').px(kx - 1, 20, 'steel5').vline(kx, 19, 20, 'steel6');
      text(p, 32, 21, 'FM', 'red1');
      p.rect(45, 25, 2, 2, echo ? 'cyan4' : 'cyan0');
      if (echo) p.px(44, 25, 'cyan2').px(47, 26, 'cyan2').px(45, 24, 'cyan2').px(46, 27, 'cyan2');
    }));
    s.box({ x: body.x - 0.09, z: body.z + 0.02, w: 0.012, h: 0.05, d: 0.012, y: top }, RAMP.steel);
    s.box({ x: body.x + 0.09, z: body.z + 0.02, w: 0.012, h: 0.05, d: 0.012, y: top }, RAMP.steel);
    s.box({ x: body.x, z: body.z + 0.02, w: 0.2, h: 0.012, d: 0.014, y: top + 0.05 }, RAMP.steel);
    s.box({ x: body.x + 0.105, z: body.z - 0.01, w: 0.006, h: 0.26, d: 0.006, y: top }, RAMP.steel);
    s.outline();
    return s.sprite();
  };
  result['store-radio'] = radio(false);
  result['store-radio-echo'] = radio(true);

  // The clerk's own flip phone, closed, lying on the magazine: a silver clamshell with
  // the hinge barrel at the far end, an aerial stub, the small outer display lit
  // cyan, the seam between lid and base, and a strap with a red bead charm.
  const { phone } = space.personal;
  result['store-phone'] = (() => {
    const c = Math.cos(phone.yaw), s = Math.sin(phone.yaw), v = sculpt.vec;
    const axes = [[c, 0, -s], [0, 1, 0], [s, 0, c]], [hw, hh, hd] = [phone.w / 2, phone.h / 2, phone.d / 2];
    const centre = [phone.x, (phone.y ?? counter.y) + hh, phone.z];
    const at = q => v.add(centre, v.add(v.add(v.mul(axes[0], q[0]), v.mul(axes[1], q[1])), v.mul(axes[2], q[2])));
    const hinge = [at([-hw + 0.004, 0, hd - 0.006]), at([hw - 0.004, 0, hd - 0.006])];
    const aerial = [at([hw - 0.008, 0.002, hd - 0.002]), at([hw - 0.008, 0.002, hd + 0.014])];
    const bead = at([hw + 0.016, -hh + 0.006, -hd + 0.012]), loop = [at([hw - 0.004, -hh + 0.004, -hd + 0.006]), bead];
    const field = P => [Math.min(
      sculpt.box(P, centre, axes, [hw, hh, hd], 0.008),
      sculpt.cone(P, hinge[0], hinge[1], hh + 0.002, hh + 0.002),
      sculpt.cone(P, aerial[0], aerial[1], 0.004, 0.0035),
      sculpt.cone(P, loop[0], loop[1], 0.0016, 0.0016),
      v.len(v.sub(P, bead)) - 0.0065), 0];
    const bounds = { x: phone.x + 0.008, z: phone.z, w: 0.13, h: phone.h + 0.01, d: 0.13 };
    return sculpted(bounds, field, RAMP.steel, hit => {
      if (v.len(v.sub(hit.P, bead)) < 0.008) return hit.n[1] > 0.5 ? 'red4' : 'red2';
      const [x, y, z] = sculpt.local(hit.P, centre, axes);
      if (Math.abs(x) > hw + 0.001 && z < -hd + 0.02) return 'ink';                          // the strap's cord
      if (z > hd - 0.012) return z > hd + 0.006 ? 'steel1' : 'steel3';                        // hinge, aerial
      if (y > hh - 0.003 && Math.abs(x) < 0.014 && z > hd - 0.05 && z < hd - 0.018) {        // the outer display
        return Math.abs(x) > 0.011 || z < hd - 0.047 || z > hd - 0.021 ? 'ink' : z > hd - 0.03 ? 'cyan4' : 'cyan3';
      }
      if (Math.abs(y) < 0.0018 && y < hh - 0.004) return 'steel1';                             // lid and base
      return null;
    });
  })();
  // The clerk's canned coffee, opened and half drunk: the tab bent up, a drip down
  // the side from the last sip.
  const { can } = space.personal, r = can.w / 2;
  result['store-can'] = sculpted(can, P => [sculpt.cylinder(P, [can.x, can.z], r, counter.y, counter.y + can.h), 0], RAMP.wood, hit => {
    const [x, y, z] = hit.P, h = y - counter.y, dx = x - can.x, dz = z - can.z;
    if (h > can.h - 0.002) {                                                                  // the lid
      if (Math.hypot(dx, dz + 0.014) < 0.007) return 'ink';                                    // the mouth
      if (Math.hypot(dx, dz - 0.004) < 0.006) return 'steel5';                                 // the tab
      return Math.hypot(dx, dz) > r - 0.004 ? 'steel3' : 'steel4';
    }
    if (h > can.h - 0.012 || h < 0.008) return hit.n[0] < -0.3 ? 'steel3' : 'steel5';          // the rims
    if (Math.abs(dx + 0.012) < 0.003 && h > can.h - 0.05 && dz < 0) return 'wood1';             // a drip
    if (h > 0.042 && h < 0.07) return hit.n[0] < -0.4 ? 'cream2' : 'cream4';                   // the label band
    return null;
  });
  // A receipt spike: a steel rod on a round base with the night's receipts on it.
  const { spike } = space.personal;
  result['store-spike'] = (() => {
    const v = sculpt.vec, base = counter.y;
    const slips = [[0.018, 0.4, 0.15], [0.03, -0.7, -0.2], [0.042, 1.2, 0.1], [0.055, 0.1, -0.12]];
    const slipFrame = ([, yaw, tilt]) => {
      const f = [Math.cos(yaw), Math.sin(tilt), Math.sin(yaw)], n = v.norm([-f[1] * Math.cos(yaw), 1, -f[1] * Math.sin(yaw)]);
      return [v.norm(f), n, v.norm([f[1] * n[2] - f[2] * n[1], f[2] * n[0] - f[0] * n[2], f[0] * n[1] - f[1] * n[0]])];
    };
    const field = P => [Math.min(
      sculpt.cylinder(P, [spike.x, spike.z], 0.026, base, base + 0.008),
      sculpt.cylinder(P, [spike.x, spike.z], 0.0022, base, base + spike.h),
      ...slips.map(s => sculpt.box(P, [spike.x, base + s[0], spike.z], slipFrame(s), [0.028, 0.0012, 0.04], 0.001))), 0];
    return sculpted({ ...spike, w: 0.11, d: 0.11 }, field, RAMP.steel, hit => {
      const y = hit.P[1] - base;
      if (y > 0.012 && Math.hypot(hit.P[0] - spike.x, hit.P[2] - spike.z) > 0.004) return hit.n[1] > 0.3 ? 'white' : 'paper2';
      return null;
    });
  })();
  return result;
}

module.exports = () => ({
  'store-back': back(),
  'store-sides': sides(),
  'store-counter': counterLayer(),
  'store-front': front(),
  ...sprites(),
});
