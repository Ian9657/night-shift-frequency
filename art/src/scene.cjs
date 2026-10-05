// Store interior, window view and counter. World size 480x270.
'use strict';
const { Pix } = require('../tools/pixel.cjs');
const layout = require('../../js/content/layout.js');

// Deterministic pseudo-random for shelf stock, so builds are reproducible.
function rng(seed) {
  let n = seed >>> 0;
  return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

// Tiny 3x5 capitals for signage.
const GLYPHS = {
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  E: ['###', '#..', '##.', '#..', '###'], N: ['#.#', '###', '###', '###', '#.#'],
  2: ['##.', '..#', '.#.', '#..', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'], C: ['.##', '#..', '#..', '#..', '.##'],
  L: ['#..', '#..', '#..', '#..', '###'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], A: ['.#.', '#.#', '###', '#.#', '#.#'],
};
function sign(p, x, y, text, color, mirror = false) {
  const chars = [...text];
  chars.forEach((ch, i) => {
    const glyph = GLYPHS[ch];
    if (!glyph) return;
    const gx = mirror ? x + (chars.length - 1 - i) * 4 : x + i * 4;
    glyph.forEach((row, j) => [...row].forEach((c, k) => {
      if (c === '#') p.px(mirror ? gx + 2 - k : gx + k, y + j, color);
    }));
  });
}

// ------------------------------------------------------------------ ceiling and wall
function ceiling(p) {
  p.rect(0, 0, 480, 18, 'wall0');
  for (let x = 0; x < 480; x += 60) p.vline(x, 0, 15, 'ink').vline(x + 1, 0, 15, 'wall1');
  p.hline(0, 479, 8, 'wall1');
  p.hline(0, 479, 16, 'wall2').hline(0, 479, 17, 'ink');
  for (const x0 of [40, 330]) {
    p.rect(x0, 1, 104, 7, 'steel2').frame(x0, 1, 104, 7, 'steel1').hline(x0 + 1, x0 + 102, 2, 'steel4');
    p.rect(x0 + 3, 4, 98, 3, 'white').hline(x0 + 3, x0 + 100, 6, 'tube');
    p.px(x0 + 3, 4, 'tube').px(x0 + 100, 4, 'tube');
    p.dither(x0 - 6, 8, 116, 2, 'wall2', 'checker').dither(x0 + 4, 10, 96, 4, 'wall2', 'sparse');
  }
  // Vent grille and sprinkler
  p.rect(210, 3, 44, 9, 'steel2').frame(210, 3, 44, 9, 'steel1');
  for (let x = 213; x < 252; x += 3) p.vline(x, 5, 9, 'steel0');
  p.rect(176, 12, 3, 3, 'steel4').px(177, 15, 'steel5');
}

function backWall(p) {
  p.bands(0, 18, 480, 135, ['wall4', 'wall3', 'wall3', 'wall3', 'wall2', 'wall2']);
  for (const x0 of [40, 330]) p.dither(x0 - 10, 18, 124, 10, 'wall5', 'sparse').dither(x0 + 6, 18, 92, 4, 'wall5', 'checker');
}

// ------------------------------------------------------------------ shelving
function noodle(p, x, base, r) {
  const [band, lid] = pick(r, [['red2', 'paper3'], ['orange2', 'paper2'], ['blue2', 'paper3'], ['green2', 'paper2']]);
  p.rect(x, base - 12, 9, 12, 'paper2').rect(x, base - 13, 9, 2, lid).hline(x, x + 8, base - 13, 'white');
  p.rect(x, base - 8, 9, 4, band).hline(x + 1, x + 4, base - 7, 'white');
  p.vline(x + 8, base - 12, base - 1, 'paper0').vline(x, base - 11, base - 1, 'paper3');
  return 10;
}
function snack(p, x, base, r) {
  const [c0, c1, c2] = pick(r, [['orange1', 'orange2', 'orange3'], ['green1', 'green2', 'green3'], ['red1', 'red2', 'red3'], ['blue1', 'blue2', 'blue3'], ['yellow0', 'yellow1', 'yellow2']]);
  const w = 11 + Math.floor(r() * 4), h = 17 + Math.floor(r() * 4);
  p.rect(x + 1, base - h, w - 2, h, c1).rect(x, base - h + 3, w, h - 4, c1);
  p.hline(x + 1, x + w - 2, base - h, c2);
  for (let i = x + 1; i < x + w - 1; i += 2) p.px(i, base - h + 1, c0);
  p.vline(x + 2, base - h + 4, base - 3, c2).vline(x + w - 2, base - h + 3, base - 2, c0);
  p.rect(x + 3, base - h + 7, w - 6, 5, 'paper3').rect(x + 4, base - h + 8, w - 8, 3, c2);
  p.hline(x + 1, x + w - 2, base - 1, c0);
  return w + 1;
}
function box(p, x, base, r) {
  const [c0, c1, c2] = pick(r, [['cream1', 'cream3', 'cream5'], ['pink0', 'pink1', 'pink2'], ['blue0', 'blue1', 'blue3'], ['steel3', 'steel5', 'steel7'], ['violet0', 'violet1', 'violet2']]);
  const w = 9 + Math.floor(r() * 5), h = 18 + Math.floor(r() * 6);
  p.rect(x, base - h, w, h, c1).hline(x, x + w - 1, base - h, c2).vline(x, base - h, base - 1, c2).vline(x + w - 1, base - h + 1, base - 1, c0);
  p.rect(x + 2, base - h + 4, w - 4, 4, 'paper3').hline(x + 2, x + w - 3, base - 5, c0);
  p.px(x + 3, base - h + 5, 'red2');
  return w + 1;
}
function bottle(p, x, base, r) {
  const [c0, c1, c2] = pick(r, [['cyan0', 'cyan2', 'cyan3'], ['green0', 'green2', 'green3'], ['steel4', 'steel6', 'steel7'], ['orange0', 'orange2', 'orange3'], ['red0', 'red2', 'red3']]);
  const h = 17 + Math.floor(r() * 4);
  p.rect(x + 1, base - h, 3, 2, pick(r, ['white', 'red2', 'blue2', 'green2'])).rect(x + 1, base - h + 2, 3, 2, c1);
  p.rect(x, base - h + 4, 5, h - 4, c1).vline(x + 1, base - h + 4, base - 2, c2).vline(x + 4, base - h + 5, base - 1, c0);
  p.rect(x, base - h + 9, 5, 4, 'paper3').hline(x, x + 4, base - h + 10, c1);
  return 6;
}

function shelves(p) {
  const r = rng(7);
  p.rect(0, 22, 147, 131, 'wall1');
  for (let y = 26; y < 153; y += 5) for (let x = 9; x < 140; x += 5) p.px(x, y, 'wall0');
  for (const x of [0, 141]) {
    p.rect(x, 22, 6, 131, 'steel3').vline(x + 1, 22, 152, 'steel5').vline(x + 5, 22, 152, 'steel1');
    for (let y = 26; y < 150; y += 6) p.px(x + 3, y, 'steel1');
  }
  p.rect(0, 20, 147, 3, 'steel4').hline(0, 146, 20, 'steel6');
  p.rect(10, 23, 60, 6, 'red2').hline(10, 69, 23, 'red3');
  sign(p, 14, 24, 'SNACKS', 'white');
  const rows = [[54, noodle], [86, snack], [118, box], [150, bottle]];
  for (const [y, make] of rows) {
    let x = 8;
    while (x < 132) x += make(p, x, y - 1, r);
    p.dither(6, y - 3, 135, 2, 'wall0', 'rows');
    p.rect(6, y - 1, 135, 2, 'steel5').hline(6, 140, y - 1, 'steel7');
    p.rect(6, y + 1, 135, 3, 'cream4').hline(6, 140, y + 3, 'cream1');
    for (let x2 = 12; x2 < 136; x2 += 18) {
      p.rect(x2, y + 1, 7, 3, r() < 0.2 ? 'yellow2' : 'white').hline(x2 + 1, x2 + 4, y + 2, 'steel3');
      if (r() < 0.15) p.rect(x2 + 8, y + 1, 4, 3, 'red2');
    }
    p.hline(6, 140, y + 4, 'ink');
  }
}

// ------------------------------------------------------------------ window
function windowView(p) {
  const { x: x0, y: y0, w, h, mullion } = layout.window;
  const gx = x0 + 4, gy = y0 + 4, gw = w - 8, gb = 153;
  // Sky with a low cloud band lit by town glow
  p.bands(gx, gy, gw, 44, ['night0', 'night1', 'night1', 'night2', 'night2', 'night3']);
  p.dither(gx, gy + 8, gw, 3, 'night2', (x, y) => (x * 3 + y) % 7 === 0);
  p.dither(gx, gy + 36, gw, 6, 'night4', (x, y) => (x + y * 2) % 5 === 0);
  // Far hills, near hills, town lights
  p.poly([[gx, 76], [gx + 24, 70], [gx + 52, 72], [gx + 80, 66], [gx + 110, 69], [gx + 148, 64], [gx + gw, 67], [gx + gw, 84], [gx, 84]], 'night2');
  p.poly([[gx, 80], [gx + 20, 77], [gx + 46, 79], [gx + 70, 75], [gx + 98, 78], [gx + 130, 74], [gx + gw, 77], [gx + gw, 86], [gx, 86]], 'night1');
  const r = rng(21);
  for (let i = 0; i < 22; i++) {
    const lx = gx + Math.floor(r() * gw), ly = 76 + Math.floor(r() * 8);
    p.px(lx, ly, r() < 0.3 ? 'lamp3' : 'lamp2');
    if (r() < 0.3) p.px(lx + 1, ly, 'lamp1');
  }
  // Relay tower with guy wires and an unlit cap; the runtime blinks the light.
  const tx = layout.towerLight.x - 3;
  p.line(tx + 2, 84, tx + 5, 56, 'void').line(tx + 10, 84, tx + 7, 56, 'void');
  for (let y = 58; y < 84; y += 6) {
    const a = Math.round((84 - y) * 3 / 28), b = Math.round((84 - y - 6) * 3 / 28);
    p.line(tx + 2 + a, y, tx + 10 - b, y + 6, 'void').line(tx + 10 - a, y, tx + 2 + b, y + 6, 'void');
    p.hline(tx + 2 + a, tx + 10 - a, y, 'void');
  }
  p.vline(tx + 6, 51, 56, 'void').hline(tx + 4, tx + 8, 56, 'void').px(tx + 6, 53, 'red0');
  p.line(tx + 6, 58, tx - 4, 76, 'night2').line(tx + 6, 58, tx + 16, 76, 'night2');
  // Sea: dark water, wind streaks, light reflections
  p.rect(gx, 86, gw, 18, 'sea1');
  p.dither(gx, 86, gw, 2, 'sea0', 'checker');
  for (const [sx, sy, len] of [[8, 89, 16], [40, 92, 22], [86, 88, 12], [110, 95, 18], [20, 98, 14], [64, 100, 26], [120, 101, 10]]) {
    p.hline(gx + sx, gx + sx + len, sy, 'sea2').hline(gx + sx + 3, gx + sx + len - 4, sy, 'sea3');
  }
  for (let i = 0; i < 10; i++) {
    const lx = gx + Math.floor(r() * gw);
    for (let y = 87; y < 103; y += 2) if (r() < 0.6) p.px(lx, y, 'lamp1');
  }
  for (let y = 87; y < 103; y += 2) p.px(tx + 6 + (y % 4 ? 1 : 0), y, 'red0');
  // Seawall, railing and a leaning bicycle
  p.rect(gx, 104, gw, 4, 'void').hline(gx, gx + gw - 1, 104, 'night1');
  p.hline(gx, gx + gw - 1, 97, 'night0').hline(gx, gx + gw - 1, 100, 'night0');
  for (let x = gx + 3; x < gx + gw; x += 12) p.vline(x, 97, 104, 'night0');
  const bx = gx + 100;
  p.ellipse(bx, 101, 3, 3, 'void').ellipse(bx, 101, 2, 2, 'night1').ellipse(bx + 12, 101, 3, 3, 'void').ellipse(bx + 12, 101, 2, 2, 'night1');
  p.line(bx, 101, bx + 5, 95, 'void').line(bx + 5, 95, bx + 12, 101, 'void').line(bx + 5, 95, bx + 10, 95, 'void').line(bx + 10, 95, bx + 12, 101, 'void');
  p.hline(bx + 3, bx + 6, 94, 'void').line(bx + 10, 95, bx + 11, 92, 'void');
  // Wet street with puddles and reflections
  p.bands(gx, 108, gw, gb - 108, ['night1', 'night1', 'night0', 'night0']);
  for (let y = 110; y < gb; y += 3) p.dither(gx, y, gw, 1, 'night2', (x) => (x * 7 + y * 3) % 13 === 0);
  p.ellipse(gx + 90, 122, 14, 2, 'night2').ellipse(gx + 90, 122, 10, 1, 'night3');
  p.ellipse(gx + 30, 136, 18, 3, 'night2');
  p.rect(gx, 108, gw, 1, 'night2');
  // Street lamp with stepped glow and a long wet reflection
  const lx = gx + 22;
  p.vline(lx, 40, 140, 'void').vline(lx + 1, 40, 140, 'night0').vline(lx - 1, 60, 140, 'void');
  // Curved arm and hood; the lit underside throws a widening cone of light.
  p.line(lx, 40, lx + 3, 37, 'void').hline(lx + 3, lx + 9, 36, 'void').hline(lx + 5, lx + 13, 35, 'void').hline(lx + 6, lx + 12, 34, 'void');
  p.hline(lx + 6, lx + 12, 37, 'lamp3').px(lx + 9, 38, 'lamp2');
  p.glow(lx + 9, 38, 15, 34, ['haze0', 'haze1', 'haze2', 'lamp0'], (x, y) => y >= 38 && Math.abs(x - lx - 9) <= (y - 35) * 0.5);
  p.glow(lx + 9, 38, 4, 3, ['lamp0', 'lamp1']);
  // Broken reflection of the lamp on the wet road.
  for (let y = 112; y < gb; y += 2) if ((y * 7) % 5 !== 0) p.hline(lx + 8 + (y % 4 ? 1 : 0), lx + 9 + (y < 128 ? 1 : 0), y, y < 126 ? 'lamp1' : 'lamp0');
  p.rect(lx - 2, 138, 5, 2, 'void');
  // Glass: reflection of the store's ceiling tubes and faint diagonal sheen
  p.dither(gx + 2, gy + 2, 40, 1, 'night5', 'checker').dither(gx + gw - 46, gy + 2, 40, 1, 'night5', 'checker');
  for (const [sx, sy] of [[gx + 40, gy + 10], [gx + 46, gy + 10], [gx + 112, gy + 30], [gx + 117, gy + 30]]) {
    for (let i = 0; i < 9; i++) p.px(sx + i, sy + i * 2, 'night3');
  }
  // OPEN 24H neon, hung in the right pane, seen mirrored from inside.
  const nx = mullion.x + 18, ny = gy + 5;
  p.rect(nx - 3, ny - 3, 36, 11, 'void').frame(nx - 3, ny - 3, 36, 11, 'steel1');
  p.vline(nx + 4, gy - 4, ny - 3, 'steel3').vline(nx + 26, gy - 4, ny - 3, 'steel3');
  const neon = new Pix(p.width, p.height);
  sign(neon, nx, ny, 'OPEN24H', 'pink2', true);
  neon.outline('pink0');
  p.blit(neon, 0, 0);
  // Frame, mullion, handles
  p.frame(x0, y0, w, h, 'ink');
  p.rect(x0 + 1, y0 + 1, w - 2, 3, 'steel4').rect(x0 + 1, y0 + 1, 3, h - 2, 'steel4').rect(x0 + w - 4, y0 + 1, 3, h - 2, 'steel3');
  p.hline(x0 + 1, x0 + w - 2, y0 + 1, 'steel6').vline(x0 + 1, y0 + 1, y0 + h - 1, 'steel6');
  p.hline(x0 + 4, x0 + w - 5, y0 + 4, 'steel1').vline(x0 + 4, y0 + 4, gb, 'steel1');
  p.rect(mullion.x, y0, mullion.w, h, 'steel4').vline(mullion.x + 1, y0, gb, 'steel6').vline(mullion.x + mullion.w - 1, y0, gb, 'steel2');
  for (const hx of [mullion.x - 5, mullion.x + mullion.w + 3]) p.rect(hx, 82, 2, 28, 'steel6').vline(hx + 1, 82, 109, 'steel4').px(hx, 81, 'steel3').px(hx, 110, 'steel3');
}

// ------------------------------------------------------------------ wall strip: clock, tide table, switch
function wallStrip(p) {
  const { x: cx, y: cy } = layout.clock;
  p.ellipse(cx + 1, cy + 2, 13, 13, 'wall1');
  p.ellipse(cx, cy, 13, 13, 'steel1').ellipse(cx, cy, 12, 12, 'steel4').ellipse(cx, cy, 10, 10, 'cream5');
  p.dither(cx - 8, cy + 4, 17, 5, 'cream3', 'sparse');
  for (let i = 0; i < 6; i++) p.px(cx - 8 + i, cy - 7 - Math.floor(i / 3), 'white');
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, long = i % 3 === 0;
    for (let rr = long ? 7 : 8; rr <= 9; rr++) p.px(Math.round(cx + Math.sin(a) * rr), Math.round(cy - Math.cos(a) * rr), long ? 'steel1' : 'steel4');
  }
  p.px(cx, cy, 'ink');
  // Tide table, pinned
  const x = 316, y = 64;
  p.rect(x + 1, y + 1, 23, 33, 'wall1');
  p.rect(x, y, 23, 33, 'paper2').hline(x, x + 22, y + 32, 'paper0').vline(x + 22, y, y + 32, 'paper1');
  p.rect(x + 1, y + 1, 21, 5, 'blue2').hline(x + 2, x + 12, y + 3, 'white');
  for (let i = 0; i < 19; i++) p.px(x + 2 + i, y + 13 + Math.round(Math.sin(i / 2.6) * 3), 'blue2');
  for (let i = 0; i < 19; i += 2) p.px(x + 2 + i, y + 13, 'paper1');
  for (let j = 21; j < 31; j += 3) p.hline(x + 2, x + 20, y + j, 'paper1').hline(x + 2, x + 6, y + j, 'steel4');
  p.px(x + 11, y + 1, 'red2').px(x + 11, y, 'red3');
  // Light switch
  p.rect(318, 108, 7, 11, 'cream4').frame(318, 108, 7, 11, 'cream1').rect(320, 111, 3, 4, 'cream2').hline(320, 322, 111, 'white');
}

// ------------------------------------------------------------------ fridge
function fridge(p) {
  const x0 = 342, y0 = 22;
  p.rect(x0, y0, 138, 131, 'steel2').hline(x0, 479, y0, 'steel4');
  p.rect(x0 + 2, y0 + 2, 136, 11, 'blue1').hline(x0 + 2, 479, y0 + 2, 'blue2').hline(x0 + 2, 479, y0 + 12, 'blue0');
  sign(p, x0 + 8, y0 + 5, 'COLD', 'white');
  sign(p, x0 + 28, y0 + 5, 'DRINKS', 'cyan3');
  p.hline(x0 + 2, 479, y0 + 13, 'tube');
  const r = rng(11);
  for (const dx of [3, 49, 95]) {
    const x = x0 + dx, y = y0 + 15, w = 43, h = 115;
    p.rect(x, y, w, h, 'steel3').frame(x, y, w, h, 'steel1');
    p.bands(x + 3, y + 3, w - 6, h - 6, ['wall6', 'wall5', 'wall5', 'wall4', 'wall4', 'wall3']);
    p.vline(x + 3, y + 3, y + h - 4, 'tube').vline(x + 4, y + 3, y + h - 4, 'white');
    for (let sy = y + 28; sy < y + h - 2; sy += 27) {
      let bx = x + 6;
      while (bx < x + w - 8) {
        const kind = r();
        const [c0, c1, c2] = pick(r, [['green0', 'green2', 'green3'], ['cyan0', 'cyan2', 'cyan3'], ['orange0', 'orange2', 'orange3'], ['red0', 'red2', 'red3'], ['steel4', 'steel6', 'white'], ['blue0', 'blue2', 'blue3'], ['yellow0', 'yellow1', 'yellow2']]);
        if (kind < 0.55) {
          const bh = 18 + Math.floor(r() * 4);
          p.rect(bx + 1, sy - bh, 3, 2, pick(r, ['white', 'red2', 'blue2'])).rect(bx + 1, sy - bh + 2, 3, 2, c1);
          p.rect(bx, sy - bh + 4, 5, bh - 4, c1).vline(bx + 1, sy - bh + 5, sy - 2, c2).vline(bx + 4, sy - bh + 5, sy - 1, c0);
          p.rect(bx, sy - bh + 9, 5, 4, 'paper3').hline(bx, bx + 4, sy - bh + 10, c1);
          bx += 6;
        } else {
          p.rect(bx, sy - 10, 6, 10, c1).hline(bx, bx + 5, sy - 10, 'steel6').vline(bx + 1, sy - 9, sy - 1, c2).vline(bx + 5, sy - 9, sy - 1, c0);
          p.hline(bx, bx + 5, sy - 6, 'paper3');
          bx += 7;
        }
      }
      p.hline(x + 3, x + w - 4, sy, 'steel6').hline(x + 3, x + w - 4, sy + 1, 'steel3');
      for (let gx = x + 4; gx < x + w - 3; gx += 3) p.px(gx, sy + 1, 'steel1');
    }
    for (let i = 0; i < 26; i++) if (i % 4 !== 3) p.px(x + 10 + Math.floor(i / 2), y + 8 + i * 2, 'wall6');
    p.rect(x + w - 6, y + 40, 3, 34, 'steel6').vline(x + w - 5, y + 40, y + 73, 'white').vline(x + w - 4, y + 41, y + 73, 'steel4');
    p.dither(x + 3, y + h - 8, w - 6, 5, 'wall6', 'sparser');
  }
}

function cctv(p) {
  p.rect(2, 18, 5, 5, 'steel3').rect(6, 20, 6, 2, 'steel2');
  p.stamp(10, 18, `
..cccccccccccc..
.cCCCCCCCCCCCCc.
lCCHHHHCCCCCCCCc
lCCCCCCCCCCCCCCc
lccccccccccccccc
.ddddddddddddd..
..r.............`, { c: 'cream1', C: 'cream3', H: 'cream5', l: 'steel1', d: 'cream0', r: 'red3' });
  p.rect(26, 19, 3, 4, 'ink').px(27, 20, 'steel5');
}

function room() {
  const p = new Pix(480, 156);
  ceiling(p);
  backWall(p);
  shelves(p);
  windowView(p);
  wallStrip(p);
  fridge(p);
  cctv(p);
  return p;
}

// ------------------------------------------------------------------ counter
function counter() {
  const p = new Pix(480, 117);
  // Work surface seen from the clerk's side: far edge darker, near bullnose bright.
  p.rect(0, 0, 480, 34, 'top4').rect(0, 0, 480, 6, 'top3').dither(0, 6, 480, 2, 'top3', 'checker');
  p.hline(0, 479, 0, 'top1').hline(0, 479, 1, 'top2');
  p.noise(0, 4, 480, 28, 'top3', 0.025, 5).noise(0, 4, 480, 28, 'top5', 0.012, 9);
  for (const x0 of [40, 330]) p.dither(x0, 10, 104, 5, 'top5', 'sparse');
  p.rect(0, 33, 480, 3, 'top5').hline(0, 479, 34, 'cream5').hline(0, 479, 36, 'top2');
  p.rect(0, 37, 480, 2, 'ink');
  // Clerk-side cabinets with an open cubby for paper bags and receipt rolls.
  p.rect(0, 39, 480, 78, 'wall2');
  p.dither(0, 39, 480, 4, 'wall0', 'checker');
  for (const [x, w] of [[4, 150], [158, 80], [242, 120], [366, 110]]) {
    p.bands(x, 46, w, 56, ['wall3', 'wall3', 'wall3', 'wall2']);
    p.noise(x + 2, 60, w - 4, 40, 'wall2', 0.03, x).noise(x + 2, 80, w - 4, 20, 'wall4', 0.008, x + 7);
    p.rect(x + 3, 49, w - 6, 50, 0).frame(x + 3, 49, w - 6, 50, 'wall2');
    p.bands(x + 4, 50, w - 8, 48, ['wall3', 'wall3', 'wall2']);
    p.hline(x + 4, x + w - 5, 50, 'wall4');
    p.hline(x, x + w - 1, 46, 'wall5').vline(x, 46, 101, 'wall4').hline(x, x + w - 1, 101, 'wall1').vline(x + w - 1, 46, 101, 'wall1');
    p.frame(x - 1, 45, w + 2, 58, 'wall0');
    // Scuffs where shoes and knees meet the doors
    for (let i = 0; i < 5; i++) p.hline(x + 10 + i * 23 % (w - 20), x + 14 + i * 23 % (w - 20), 94 + (i % 3), 'wall1');
  }
  p.rect(160, 48, 76, 52, 'wall0').hline(160, 235, 48, 'ink');
  p.rect(164, 70, 32, 30, 'wood3').hline(164, 195, 70, 'wood4');
  for (let y = 74; y < 100; y += 5) p.hline(165, 194, y, 'wood2');
  for (const [rx, ry] of [[202, 88], [214, 88], [208, 78]]) p.ellipse(rx + 4, ry + 5, 5, 5, 'paper2').ellipse(rx + 4, ry + 5, 2, 2, 'paper0').px(rx + 2, ry + 2, 'white');
  p.hline(160, 235, 99, 'wall1');
  for (const [x, w] of [[4, 150], [242, 120], [366, 110]]) {
    const hx = x + Math.floor(w / 2) - 8;
    p.rect(hx, 52, 16, 3, 'steel5').hline(hx, hx + 15, 52, 'steel7').hline(hx, hx + 15, 55, 'wall1');
  }
  // Cash drawer face under the register.
  const dx = layout.drawer.x, dy = layout.drawer.y - layout.counterTop;
  p.rect(dx, dy, 76, 16, 'steel2').frame(dx, dy, 76, 16, 'ink').hline(dx + 1, dx + 74, dy + 1, 'steel4');
  p.rect(dx + 30, dy + 6, 16, 3, 'steel5').hline(dx + 30, dx + 45, dy + 6, 'steel7').px(dx + 70, dy + 3, 'red3');
  // Taped shift note and a sticker.
  p.rect(268, 60, 18, 16, 'yellow2').hline(268, 285, 60, 'yellow3').vline(285, 61, 75, 'yellow1');
  [11, 8, 12, 6].forEach((len, i) => p.hline(271, 271 + len, 64 + i * 3, 'orange1'));
  p.rect(272, 58, 8, 3, 'steel6');
  p.ellipse(410, 74, 5, 5, 'red2').ellipse(410, 74, 3, 3, 'white').px(410, 74, 'red2');
  // Staff-only sticker and a small bin tucked against the right door.
  p.rect(380, 84, 22, 8, 'yellow2').frame(380, 84, 22, 8, 'ink').hline(382, 399, 87, 'ink').hline(382, 392, 89, 'ink');
  p.poly([[440, 70], [466, 70], [463, 102], [443, 102]], 'steel3');
  p.volume('steel3', ['steel0', 'steel1', 'steel3', 'steel4', 'steel6']);
  p.rect(439, 68, 29, 3, 'steel4').hline(439, 467, 68, 'steel6');
  p.poly([[442, 66], [447, 62], [452, 66]], 'paper2').poly([[455, 66], [459, 63], [464, 66]], 'paper1');
  // Kick plate
  p.rect(0, 104, 480, 13, 'ink').hline(0, 479, 104, 'wall1');
  return p;
}

function drawerOpen() {
  const p = new Pix(76, 18);
  p.rect(0, 0, 76, 18, 'steel2').frame(0, 0, 76, 18, 'ink').hline(1, 74, 1, 'steel4');
  [['green1', 'green2'], ['green1', 'green2'], ['blue1', 'blue2'], ['red1', 'red2'], ['orange1', 'orange2']].forEach(([c, l], i) => {
    p.rect(3 + i * 14, 3, 12, 8, 'steel0').rect(4 + i * 14, 4, 10, 5, c).hline(4 + i * 14, 13 + i * 14, 4, l).px(8 + i * 14, 6, 'paper3');
  });
  p.rect(3, 12, 70, 4, 'steel0');
  for (let i = 0; i < 8; i++) p.ellipse(7 + i * 9, 14, 1, 1, i % 3 ? 'steel6' : 'yellow1');
  return p;
}

function towerLight() {
  const p = new Pix(7, 7);
  p.dither(0, 0, 7, 7, 'red0', 'checker').rect(1, 3, 5, 1, 'red1').rect(3, 1, 1, 5, 'red1').rect(2, 2, 3, 3, 'red2').px(3, 3, 'red4');
  return p;
}

module.exports = () => ({
  room: room(),
  counter: counter(),
  'drawer-open': drawerOpen(),
  'tower-light-on': towerLight(),
});
