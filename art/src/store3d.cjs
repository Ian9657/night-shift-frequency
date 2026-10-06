// The store from the clerk's eye, rendered with the one camera in js/content/space.js.
// Layers (full-screen, drawn back to front at runtime): store-back, store-sides,
// store-counter, store-front. Interactive and animated things are separate sprites
// placed by their 'at' anchor.
'use strict';
const { Pix } = require('../tools/pixel.cjs');
const { Stage } = require('../tools/raycast.cjs');
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
  // Glass: the store's tubes reflected along the top, short diagonal sheen
  p.dither(x0 + 4, y0 + 1, 50, 1, 'night5', 'checker').dither(x1 - 56, y0 + 1, 50, 1, 'night5', 'checker');
  for (const [sx, sy] of [[x0 + 54, y0 + 30], [x0 + 60, y0 + 30], [x1 - 50, y0 + 60], [x1 - 45, y0 + 60]]) {
    for (let i = 0; i < 10; i++) p.px(sx + i, sy + i * 2, 'night3');
  }
  return { tower: [tx, top] };
}

function calendar(p, x, y) {
  p.rect(x + 1, y + 3, 30, 23, 'paper2').hline(x + 1, x + 30, y + 25, 'paper0').vline(x + 30, y + 3, y + 25, 'paper1');
  p.rect(x + 1, y + 3, 30, 7, 'red2').hline(x + 1, x + 30, y + 3, 'red3').hline(x + 1, x + 30, y + 9, 'red1');
  sign(p, x + 3, y + 4, 'OCT', 'white');
  sign(p, x + 15, y + 4, '2005', 'paper3');
  for (const rx of [6, 13, 19, 26]) p.rect(x + rx, y + 1, 1, 4, 'steel5').px(x + rx, y, 'steel6');
  // Every day crossed out, a gap between days; today (the last box) circled, not crossed.
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
    const cx = x + 3 + col * 4, cy = y + 12 + row * 4;
    if (row === 2 && col === 6) { p.frame(cx - 1, cy - 1, 5, 5, 'blue2'); continue; }
    p.px(cx, cy, 'red2').px(cx + 2, cy, 'red2').px(cx + 1, cy + 1, 'red2').px(cx, cy + 2, 'red1').px(cx + 2, cy + 2, 'red1');
  }
}

// ------------------------------------------------------------------ back wall (screen-parallel)
function back() {
  const p = new Pix(480, 270);
  const [wx0, wy0] = at(-room.halfW, room.ceiling), [wx1, wy1] = at(room.halfW, 0);
  const top = Math.max(0, wy0);
  p.bands(wx0, top, wx1 - wx0, wy1 - top, ['wall5', 'wall4', 'wall4', 'wall3', 'wall3']);
  const [gx0, gy0] = at(-1.0, 2.45), [gx1, gy1] = at(1.0, 0.75);
  const glass = { x: gx0, y: Math.max(0, gy0), w: gx1 - gx0, h: gy1 - Math.max(0, gy0) };
  const { tower } = outside(p, glass.x, glass.y, gx1, gy1);
  // OPEN 24H neon hung in the right pane, seen mirrored from inside.
  const nx = Math.round(glass.x + glass.w * 0.62), ny = glass.y + 6;
  p.vline(nx + 4, 0, ny - 3, 'steel3').vline(nx + 26, 0, ny - 3, 'steel3');
  p.rect(nx - 3, ny - 3, 36, 11, 'void').frame(nx - 3, ny - 3, 36, 11, 'steel1');
  const neon = new Pix(480, 270);
  sign(neon, nx, ny, 'OPEN24H', 'pink2', true);
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
  const [kx, ky] = at(-1.36, 1.62);
  calendar(p, kx, ky);
  const [tx0, ty0] = at(-1.3, 1.25);
  p.rect(tx0 + 1, ty0 + 1, 22, 30, 'wall2').rect(tx0, ty0, 22, 30, 'paper2').hline(tx0, tx0 + 21, ty0 + 29, 'paper0');
  p.rect(tx0 + 1, ty0 + 1, 20, 6, 'navy1').hline(tx0 + 2, tx0 + 11, ty0 + 3, 'white').rect(tx0 + 15, ty0 + 2, 4, 3, 'buoy2');
  for (let i = 0; i < 18; i++) p.px(tx0 + 2 + i, ty0 + 13 + Math.round(Math.sin(i / 2.8) * 3), 'blue2');
  for (let j = 20; j < 28; j += 3) p.hline(tx0 + 2, tx0 + 19, ty0 + j, 'paper1');
  return p.anchor('window', glass.x, glass.y).anchor('windowSize', glass.w, glass.h).anchor('mullion', mx - 3, 6)
    .anchor('tower', tower[0], tower[1]).anchor('clock', cx, cy);
}

// ------------------------------------------------------------------ side walls, shelving, fridge
function sides() {
  const s = new Stage();
  const WALL = s.object('walls', { layer: 'main', outline: false });
  // Ceiling with two tube fittings
  s.quad([-room.halfW, room.ceiling, room.back], [2 * room.halfW, 0, 0], [0, 0, -room.back + 0.1], [0, -1, 0], (u, v, P, sx, sy) => {
    for (const tx of [-0.75, 0.75]) {
      const d = Math.abs(P[0] - tx);
      if (d < 0.05) return 'white';
      if (d < 0.08) return 'tube';
      if (d < 0.12) return 'steel5';
    }
    return P[2] % 0.6 < 0.015 ? 'wall2' : 'wall3';
  }, WALL);
  for (const sx of [-room.halfW, room.halfW]) {
    s.quad([sx, 0, 0.1], [0, 0, room.back - 0.1], [0, room.ceiling, 0], [sx < 0 ? 1 : -1, 0, 0], () => 'wall4', WALL);
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
    let z = G.z0 + 0.01, n = 0;
    while (z < G.z1 - shelf.w) {
      const r = hash(row * 31 + 7, n++);
      const ramp = RAMP[PACKS[Math.floor(r * PACKS.length)]];
      const facings = 2 + Math.floor(r * 3);
      const h = shelf.h * (0.85 + hash(n, row) * 0.2);
      for (let k = 0; k < facings && z < G.z1 - shelf.w; k++) {
        for (let level = 0; level < (shelf.kind === 'cups' ? 2 : 1); level++) {
          s.box({ x: G.x + 0.02, z: z + shelf.w / 2, w: 0.24, h, d: shelf.w * 0.9, y: shelf.y + 0.025 + level * h }, ramp, (f, u, t) => {
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
  // Drink fridge on the right wall, its end panel carrying a 2005 drink poster
  const F = { x: room.halfW - 0.32, z0: 1.04, z1: 1.95 };
  const fz = (F.z0 + F.z1) / 2, fd = F.z1 - F.z0;
  s.box({ x: F.x, z: fz, w: 0.64, h: 2.2, d: fd, y: 0 }, RAMP.steel, (f, u, t) => {
    if (f === 'front') {
      if (t > 0.9) return t > 0.95 ? 'navy1' : 'buoy2';
      if (u > 0.12 && u < 0.88 && t > 0.3 && t < 0.82) {
        if (u > 0.42 && u < 0.58 && t > 0.38 && t < 0.72) return t > 0.66 ? 'white' : 'cyan2';
        if (t > 0.74) return 'white';
        return t < 0.36 ? 'buoy2' : 'cyan0';
      }
      return null;
    }
    if (f === 'left') return t > 0.9 ? (t > 0.95 ? 'navy1' : 'buoy2') : t > 0.88 ? 'tube' : 'wall6';
    return null;
  }, { name: 'fridge' });
  for (const y of [0.18, 0.6, 1.02, 1.44]) {
    s.box({ x: room.halfW - 0.63, z: fz, w: 0.05, h: 0.012, d: fd - 0.02, y }, RAMP.steel,
      (f, u) => (f === 'left' ? ((u * 30) % 1 < 0.2 ? 'buoy2' : 'white') : null), { name: 'fridge shelf' });
    let z = F.z0 + 0.02, n = 0;
    while (z < F.z1 - 0.07) {
      const r = hash(500 + Math.round(y * 100), n++);
      const ramp = RAMP[['cyan', 'green', 'orange', 'red', 'blue', 'buoy'][Math.floor(r * 6)]];
      const facings = 2 + Math.floor(r * 3), bh = 0.22 + r * 0.06;
      for (let k = 0; k < facings && z < F.z1 - 0.07; k++) {
        s.box({ x: room.halfW - 0.68, z: z + 0.035, w: 0.065, h: bh, d: 0.065, y: y + 0.012 }, ramp, (f, u, t) => {
          if (f !== 'left') return null;
          if (t > 0.86) return u > 0.3 && u < 0.7 ? (r > 0.5 ? 'white' : 'red2') : 'wall6';
          if (t > 0.74) return u > 0.2 && u < 0.8 ? ramp : 'wall6';
          if (t > 0.38 && t < 0.6) return RAMP.paper;
          return null;
        }, { name: 'bottle' });
        z += 0.075;
      }
      z += 0.01;
    }
  }
  for (const z of [1.05, 1.35, 1.65, 1.95]) s.box({ x: room.halfW - 0.62, z, w: 0.03, h: 2.0, d: 0.02, y: 0.08 }, RAMP.steel, null, { name: 'door frame' });
  const GLASS = s.object('glass', { outline: false });
  s.quad([room.halfW - 0.62, 0.08, F.z0], [0, 0, fd], [0, 1.92, 0], [-1, 0, 0], (u, v, P, sx, sy) => {
    const doorPos = (P[2] - 1.05) % 0.3;
    if (doorPos > 0.24 && doorPos < 0.27 && P[1] > 0.9 && P[1] < 1.4) return 'steel7';
    return (sx * 2 + sy * 3) % 41 === 0 ? 'white' : null;
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
    return P[2] > 1.02 ? 'top3' : 'top4';
  }, TOP);
  s.quad([-room.halfW, counter.y - counter.thick, counter.near], [2 * room.halfW, 0, 0], [0, counter.thick, 0], [0, 0, -1], () => 'top2', TOP);
  const UNDER = s.object('under', { outline: false });
  s.quad([-room.halfW, 0, counter.near + 0.06], [2 * room.halfW, 0, 0], [0, counter.y - counter.thick, 0], [0, 0, -1], (u, v, P, sx, sy) => ((sx + sy) % 2 ? 'wall0' : 'ink'), UNDER);
  const { candyRack, changeMat } = space.decor;
  s.box(changeMat, RAMP.green, null, { name: 'change mat', outline: false });
  s.box(candyRack, RAMP.steel, (f, u, t) => {
    if (f === 'top') return ['red2', 'buoy2', 'green2', 'blue2', 'yellow2', 'pink1'][Math.floor(u * 12) % 6];
    if (f === 'front') return t > 0.8 ? RAMP.steel : t > 0.55 ? RAMP[['red', 'yellow', 'green', 'blue', 'pink', 'buoy'][Math.floor(u * 10) % 6]] : (u * 10) % 1 < 0.15 ? 'steel5' : 'steel1';
    return null;
  }, { name: 'candy rack' });
  // Contact shadows of everything that stands on the counter.
  const footprints = [...Object.values(space.fixtures).flat(), ...Object.values(space.personal), candyRack];
  s.contactShadows(TOP, footprints);
  s.outline();
  return s.layer('main');
}

// ------------------------------------------------------------------ the clerk's things (nearest)
function front() {
  const s = new Stage();
  const { coffee, signIn, can } = space.personal;
  s.box(signIn, RAMP.paper, (f, u, t) => {
    if (f !== 'top') return null;
    if (t > 0.88) return 'steel6';
    if (u < 0.05 || u > 0.95) return 'wood2';
    if ((t * 9) % 1 < 0.12) return 'paper1';
    if ((t * 9) % 1 > 0.35 && (t * 9) % 1 < 0.65 && u > 0.1 && u < 0.45) return 'blue2';  // the same signature, every row
    return null;
  }, { name: 'sign-in' });
  s.box(can, RAMP.green, (f, u) => (u > 0.4 && u < 0.6 ? 'yellow2' : null), { name: 'energy can' });
  s.box(coffee, RAMP.paper, (f, u, t) => (f === 'top' ? 'steel1' : t > 0.3 && t < 0.62 ? 'wood2' : t > 0.9 ? 'steel2' : null), { name: 'coffee' });
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

  // Microwave: meshed door window, handle, control panel with a clock and keys.
  // Heating, the window glows warm over the turntable and the clock counts down.
  const micro = heating => fixture(F.microwave, [RAMP.steel], [both(panel('front', 106, 62, p => {
    p.rect(2, 4, 66, 54, 'steel4').frame(2, 4, 66, 54, 'steel2');
    for (let y = 9; y < 52; y++) for (let x = 7; x < 63; x++) {
      if (heating) {
        const d = Math.hypot((x - 35) / 28, (y - 30) / 21);
        p.px(x, y, d < 0.45 ? 'yellow3' : d < 0.75 ? 'yellow2' : 'orange2');
      } else p.px(x, y, (x + y) % 2 ? 'steel0' : 'steel1');
    }
    if (heating) p.ellipse(35, 46, 18, 3, 'orange3').ellipse(35, 42, 7, 4, 'wood2').hline(29, 41, 39, 'wood3');   // the plate and a bowl
    p.frame(6, 8, 58, 45, 'steel2').hline(7, 62, 9, heating ? 'yellow3' : 'steel2');
    p.rect(70, 8, 3, 46, 'steel6').vline(72, 8, 53, 'steel3');                                // handle
    p.rect(76, 6, 27, 11, 'ink').frame(76, 6, 27, 11, 'steel2');
    text(p, 79, 9, heating ? '0:42' : '3:47', heating ? 'phos4' : 'phos3');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.rect(77 + c * 9, 21 + r * 7, 7, 5, 'steel5').hline(77 + c * 9, 83 + c * 9, 25 + r * 7, 'steel2');
    p.rect(77, 50, 12, 6, 'green2').rect(91, 50, 11, 6, 'red2').hline(77, 101, 55, 'steel1');
  }))]);
  result['store-microwave'] = micro(false);
  result['store-microwave-heating'] = micro(true);

  // Security monitor on the microwave: a grey top-down view of the aisles, the
  // camera's name, a recording light, scan lines.
  result['store-cctv'] = fixture([space.decor.cctv], [RAMP.dark], [panel('front', 63, 51, p => {
    p.rect(3, 3, 57, 40, 'steel2').frame(3, 3, 57, 40, 'ink');
    for (let y = 5; y < 42; y++) for (let x = 5; x < 58; x++) p.px(x, y, (y % 2) ? 'steel1' : 'steel2');
    for (const x of [10, 24, 38]) p.rect(x, 9, 8, 22, 'steel3').vline(x, 9, 30, 'steel4');      // aisles
    p.rect(8, 34, 46, 5, 'steel4').hline(8, 53, 34, 'steel5');                                 // the counter
    p.rect(30, 30, 3, 3, 'steel6');                                                             // someone at it
    text(p, 6, 5, 'CAM1', 'steel6');
    p.rect(53, 6, 2, 2, 'red3');
    p.rect(8, 45, 4, 3, 'steel4').rect(52, 45, 4, 3, 'steel4');
  })]);

  // Register: a beige CRT with the green-screen sale, brand badge and power light;
  // a keyboard with its key rows, a number pad and the total key.
  result['store-pos'] = fixture(F.pos, [RAMP.cream, RAMP.dark], [both(panel('front', 80, 73, p => {
    p.rect(0, 0, 80, 73, 'cream3');
    p.hline(0, 79, 0, 'cream4').vline(0, 0, 72, 'cream4').hline(0, 79, 72, 'cream1').vline(79, 0, 72, 'cream1');
    p.rect(6, 5, 68, 52, 'cream1').rect(8, 7, 64, 48, 'phos0');
    for (const [x, y] of [[8, 7], [71, 7], [8, 54], [71, 54]]) p.px(x, y, 'cream1');               // rounded glass
    p.rect(10, 9, 60, 8, 'phos2');
    text(p, 18, 10, 'HARBOR MART', 'phos4');
    [[22, 14], [30, 10], [26, 16], [18, 12]].forEach(([len, price], i) => {
      p.hline(12, 12 + len, 21 + i * 6, 'phos3').hline(12, 12 + len - 2, 22 + i * 6, 'phos2');
      p.hline(66 - price, 66, 21 + i * 6, 'phos3');
    });
    p.hline(12, 66, 45, 'phos2');
    text(p, 12, 48, 'TOTAL', 'phos4');
    p.rect(52, 48, 14, 5, 'phos3').rect(67, 48, 2, 5, 'phos4');                                // the sum, the cursor
    p.rect(8, 61, 16, 5, 'buoy2').hline(8, 23, 61, 'buoy3');                                  // brand badge
    p.rect(70, 62, 2, 2, 'phos4');                                                              // power light
    for (let x = 30; x < 62; x += 3) p.vline(x, 61, 66, 'cream2');                              // vents
  })), (f, u, t) => {
    if (f !== 'top') return null;
    if (u > 0.82) return t > 0.2 && t < 0.92 && (u * 30) % 1 < 0.7 && (t * 4) % 1 < 0.7 ? (t > 0.5 ? 'cream4' : 'buoy2') : 'steel1';   // number pad, total key
    if ((u * 16) % 1 < 0.72 && (t * 5) % 1 < 0.66) return t > 0.8 ? 'steel5' : 'cream4';
    return null;
  }]);

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

  // Card terminal: backlit LCD, keypad with the coloured row, the card slot on top.
  const terminal = approved => fixture(F.terminal, [RAMP.dark], [both(panel('front', 20, 38, p => {
    p.rect(2, 3, 16, 10, 'steel1').rect(3, 4, 14, 8, approved ? 'phos3' : 'phos2');
    text(p, approved ? 7 : 3, 6, approved ? 'OK' : 'CARD', 'phos0');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.rect(3 + c * 5, 16 + r * 4, 4, 3, 'steel5').hline(3 + c * 5, 6 + c * 5, 18 + r * 4, 'steel3');
    p.rect(3, 32, 4, 3, 'red2').rect(8, 32, 4, 3, 'yellow2').rect(13, 32, 4, 3, 'green2');
  })), (f, u, t) => (f === 'top' && t > 0.45 && t < 0.55 && u > 0.15 && u < 0.85 ? 'ink' : null)]);
  result['store-terminal'] = terminal(false);
  result['store-terminal-approved'] = terminal(true);

  // Change tray with a few coins; a stack of carrier bags with the brand buoy.
  result['store-tray'] = fixture(F.tray, [RAMP.steel], [(f, u, t) => {
    if (f !== 'top' || u < 0.1 || u > 0.9 || t < 0.18 || t > 0.82) return null;
    for (const [cu, ct, c] of [[0.3, 0.45, 'yellow2'], [0.42, 0.6, 'steel6'], [0.62, 0.4, 'yellow3']]) if (Math.hypot((u - cu) * 2.2, t - ct) < 0.1) return c;
    return u < 0.14 || t < 0.24 ? 'steel1' : 'steel2';
  }]);
  result['store-bags'] = fixture(F.bags, [RAMP.paper], [(f, u, t) => {
    if (f === 'front') return (t * 4) % 1 < 0.3 ? 'paper1' : null;                            // the stack's edges
    if (f !== 'top') return null;
    if (Math.hypot(u - 0.5, (t - 0.45) * 0.8) < 0.13) return Math.hypot(u - 0.5, (t - 0.45) * 0.8) < 0.07 ? 'navy2' : 'buoy2';
    if (t > 0.78 && Math.abs(Math.hypot(u - 0.5, t - 0.95) - 0.14) < 0.03) return 'paper1';     // handle cut-out
    return null;
  }]);

  // Receipt printer with paper curling out of the slot and a power light.
  result['store-printer'] = (() => {
    const [b] = F.printer, s = new Stage();
    s.box(b, RAMP.dark, (f, u, t) => {
      if (f === 'top' && t > 0.62 && t < 0.7 && u > 0.12 && u < 0.88) return 'ink';
      if (f === 'front' && u > 0.78 && u < 0.86 && t > 0.62 && t < 0.72) return 'phos4';
      if (f === 'front' && u > 0.1 && u < 0.5 && t > 0.62 && t < 0.68) return 'steel4';
      return null;
    });
    s.box({ x: b.x, z: b.z + b.d * 0.16, w: b.w * 0.6, h: 0.05, d: 0.004, y: counter.y + b.h }, RAMP.paper, (f, u, t) => (f === 'front' && (t * 6) % 1 < 0.18 && u > 0.15 && u < 0.7 ? 'paper1' : null));
    s.outline();
    return s.sprite();
  })();

  // The radio: perforated speaker, a lit dial whose scale starts below 88 so the
  // needle can sit on 87.7, tuning and volume knobs, the band, a signal light. It
  // stays low-key until a broadcast comes through (echo).
  const radio = echo => {
    const [body] = F.radio, top = counter.y + body.h;
    const s = new Stage();
    s.box(body, RAMP.red, panel('front', 64, 37, p => {
      p.ellipse(16, 19, 13, 13, 'red0').ellipse(16, 19, 12, 12, 'steel1');
      for (let y = 8; y <= 30; y++) for (let x = 5; x <= 27; x++) if (Math.hypot(x - 16, y - 19) < 11 && (x + (y % 2)) % 2 === 0 && y % 2 === 0) p.px(x, y, echo ? 'steel4' : 'steel3');
      p.rect(33, 5, 28, 15, 'red0').rect(34, 6, 26, 13, echo ? 'yellow3' : 'cream3');
      for (let x = 35; x < 60; x += 2) p.vline(x, 15, x % 10 === 5 ? 17 : 16, 'cream0');
      text(p, 39, 8, '88', 'cream0'); text(p, 53, 8, '98', 'cream0');
      p.vline(36, 7, 17, 'red2');                                                              // the needle, at 87.7
      for (const kx of [39, 53]) p.ellipse(kx, 28, 4, 4, 'steel0').ellipse(kx, 28, 3, 3, 'steel2').px(kx - 1, 26, 'steel5').vline(kx, 25, 27, 'steel6');
      text(p, 44, 31, 'FM', 'red1');
      p.rect(59, 25, 2, 2, echo ? 'cyan4' : 'cyan0');
      if (echo) p.px(58, 25, 'cyan2').px(61, 26, 'cyan2').px(59, 24, 'cyan2').px(60, 27, 'cyan2');
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

  // The clerk's own flip phone, closed: silver, a hinge, the small outer display.
  result['store-phone'] = fixture([space.personal.phone], [RAMP.steel], [(f, u, t) => {
    if (f !== 'top') return null;
    if (t > 0.9) return 'steel3';                                                               // hinge
    if (t > 0.58 && t < 0.82 && u > 0.25 && u < 0.75) return t > 0.62 && t < 0.78 && u > 0.3 && u < 0.7 ? 'cyan2' : 'ink';
    return null;
  }]);
  return result;
}

module.exports = () => ({
  'store-back': back(),
  'store-sides': sides(),
  'store-counter': counterLayer(),
  'store-front': front(),
  ...sprites(),
});
