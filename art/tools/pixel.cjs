// Indexed pixel buffer used to author sprites. Colours are palette names.
'use strict';
const palette = require('../palette.cjs');

function colorIndex(color) {
  if (color === null || color === undefined || color === '.') return 0;
  if (typeof color === 'number') return color;
  const value = palette.index[color];
  if (value === undefined) throw new Error('Unknown palette colour: ' + color);
  return value;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

const PATTERNS = {
  checker: (x, y) => (x + y) % 2 === 0,
  sparse: (x, y) => x % 2 === 0 && y % 2 === 0,
  sparser: (x, y) => (x % 4 === 0 && y % 4 === 0) || (x % 4 === 2 && y % 4 === 2),
  rows: (x, y) => y % 2 === 0,
  cols: (x, y) => x % 2 === 0,
  diag: (x, y) => (x + y) % 4 === 0,
};

class Pix {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
    this.anchors = {};
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(x, y) { return this.inside(x, y) ? this.data[y * this.width + x] : 0; }
  px(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (this.inside(x, y)) this.data[y * this.width + x] = colorIndex(color);
    return this;
  }
  rect(x, y, w, h, color) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, color);
    return this;
  }
  frame(x, y, w, h, color) {
    this.hline(x, x + w - 1, y, color).hline(x, x + w - 1, y + h - 1, color);
    return this.vline(x, y, y + h - 1, color).vline(x + w - 1, y, y + h - 1, color);
  }
  hline(x0, x1, y, color) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.px(x, y, color); return this; }
  vline(x, y0, y1, color) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.px(x, y, color); return this; }
  line(x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  // Scanline polygon fill; points are [x, y] pairs on pixel centres.
  poly(points, color) {
    const ys = points.map(p => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) this.hline(Math.round(xs[i]), Math.round(xs[i + 1]) - 1, y, color);
    }
    return this;
  }
  ellipse(cx, cy, rx, ry, color) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx + 0.5) + (y * y) / (ry * ry + 0.5) <= 1) this.px(cx + x, cy + y, color);
    }
    return this;
  }
  dither(x, y, w, h, color, pattern = 'checker') {
    const test = typeof pattern === 'function' ? pattern : PATTERNS[pattern];
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (test(i, j)) this.px(i, j, color);
    return this;
  }
  // Vertical gradient between colours using ordered dithering at band edges.
  bands(x, y, w, h, colors) {
    const step = h / colors.length;
    for (let j = 0; j < h; j++) {
      const position = j / step;
      let band = Math.floor(position);
      const fraction = position - band;
      if (fraction > 0.66 && band + 1 < colors.length && (x + j) % 2 === 0) band += 1;
      for (let i = 0; i < w; i++) {
        const b = fraction > 0.66 && band + 1 < colors.length && (i + j) % 2 === 0 ? band + 1 : Math.floor(position);
        this.px(x + i, y + j, colors[Math.min(b, colors.length - 1)]);
      }
    }
    return this;
  }
  // Stamp a text grid. legend maps characters to palette names; '.' and ' ' are skipped.
  stamp(x, y, rows, legend, options = {}) {
    const lines = Array.isArray(rows) ? rows : rows.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
    lines.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (ch === '.' || ch === ' ') return;
        const color = legend[ch];
        if (color === undefined) throw new Error(`No legend entry for "${ch}"`);
        const px = options.flip ? x + row.length - 1 - i : x + i;
        this.px(px, y + j, color);
      });
    });
    return this;
  }
  blit(source, x, y, options = {}) {
    for (let j = 0; j < source.height; j++) for (let i = 0; i < source.width; i++) {
      const value = source.data[j * source.width + i];
      if (!value) continue;
      const tx = options.flip ? x + source.width - 1 - i : x + i;
      this.px(tx, y + j, options.color ?? value);
    }
    return this;
  }
  // Add a one-pixel outline around opaque pixels (4-neighbour).
  outline(color, options = {}) {
    const copy = this.data.slice();
    const value = colorIndex(color);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (copy[y * this.width + x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < this.width && ny < this.height && copy[ny * this.width + nx];
      });
      if (near && (!options.bottomOnly || copy[(y - 1) * this.width + x])) this.data[y * this.width + x] = value;
    }
    return this;
  }
  // Replace one colour with another inside a rectangle (or everywhere).
  swap(from, to, area = [0, 0, this.width, this.height]) {
    const a = colorIndex(from), b = colorIndex(to);
    const [x, y, w, h] = area;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (this.get(i, j) === a) this.px(i, j, b);
    }
    return this;
  }
  // Light from the upper left: recolour every pixel of `target` using a ramp
  // [outline?, dark, mid, light, highlight]. Edges facing the light brighten,
  // edges facing away darken with a dithered falloff. Draw details afterwards.
  volume(target, ramp, options = {}) {
    const t = colorIndex(target);
    const [dark, mid, light, high] = ramp.length >= 5 ? ramp.slice(1) : ramp;
    const depth = options.depth ?? 1;
    const inside = (x, y) => this.inside(x, y) && this.data[y * this.width + x] === t;
    const reach = (x, y, dx, dy) => {
      let d = 0;
      while (d < 4 && inside(x + dx * (d + 1), y + dy * (d + 1))) d++;
      return d + 1;
    };
    const plan = [];
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (!inside(x, y)) continue;
      const up = reach(x, y, 0, -1), left = reach(x, y, -1, 0);
      const down = reach(x, y, 0, 1), right = reach(x, y, 1, 0);
      const lit = Math.min(up, options.flat ? 9 : left), shade = Math.min(down, right);
      let color = mid;
      if (shade === 1) color = dark;
      else if (shade <= depth && (x + y) % 2 === 0) color = dark;
      else if (lit === 1 && up === 1 && left === 1 && high) color = high;
      else if (lit === 1) color = light;
      else if (lit === 2 && (x + y) % 2 === 0 && options.soft) color = light;
      plan.push([x, y, color]);
    }
    for (const [x, y, color] of plan) this.px(x, y, color);
    if (ramp.length >= 5 && options.outline !== false) this.outlineAround(t, ramp[0], plan);
    return this;
  }
  // Outline the pixels in `plan` (or of colour target) with a colour, outside only.
  outlineAround(_target, color, plan) {
    const set = new Set(plan.map(([x, y]) => y * this.width + x));
    const value = colorIndex(color);
    const writes = [];
    for (const key of set) {
      const x = key % this.width, y = Math.floor(key / this.width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (this.inside(nx, ny) && !this.data[ny * this.width + nx]) writes.push(ny * this.width + nx);
      }
    }
    for (const i of writes) this.data[i] = value;
    return this;
  }
  // Outline every transparent pixel next to an opaque one; colour chosen by the
  // neighbour's colour through `map` (palette name -> outline name), else `fallback`.
  outlineBy(map, fallback) {
    const copy = this.data.slice();
    const lookup = new Map(Object.entries(map).map(([k, v]) => [colorIndex(k), colorIndex(v)]));
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (copy[y * this.width + x]) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        const n = copy[ny * this.width + nx];
        if (!n) continue;
        const out = lookup.get(n) ?? (fallback ? colorIndex(fallback) : 0);
        if (out) { this.data[y * this.width + x] = out; break; }
      }
    }
    return this;
  }
  // Deterministic sparse speckle inside an area, only over pixels of `on` (if given).
  noise(x, y, w, h, color, density, seed = 1, on = null) {
    let n = seed >>> 0;
    const base = on === null ? null : colorIndex(on);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      n = (n * 1664525 + 1013904223) >>> 0;
      if (n / 4294967296 < density && (base === null || this.get(i, j) === base)) this.px(i, j, color);
    }
    return this;
  }
  // Radial light falloff with 4x4 ordered dithering. colors run dim -> bright.
  // `clip(x, y)` may veto pixels (e.g. keep a cone below its lamp).
  glow(cx, cy, rx, ry, colors, clip = null) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (clip && !clip(x, y)) continue;
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d >= 1) continue;
      const v = (1 - d) * colors.length;
      let level = Math.floor(v);
      if (v - level > BAYER[(y & 3) * 4 + (x & 3)]) level += 1;
      if (level >= 1) this.px(x, y, colors[Math.min(level, colors.length) - 1]);
    }
    return this;
  }
  // Lambert lighting for every pixel of `target`. normal(x, y) returns a unit
  // [nx, ny, nz] (screen space, y down). ramp runs dark -> light (no outline).
  // Levels are hard cel bands; options.dither checkers only the band seams.
  light(target, ramp, normal, options = {}) {
    const t = colorIndex(target);
    const [lx, ly, lz] = options.light || [-0.5, -0.62, 0.6];
    const len = Math.hypot(lx, ly, lz);
    const ambient = options.ambient ?? 0.18, diffuse = options.diffuse ?? 0.95;
    const plan = [];
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (this.data[y * this.width + x] !== t) continue;
      const n = normal(x, y);
      const d = Math.max(0, (n[0] * lx + n[1] * ly + n[2] * lz) / len);
      const v = Math.min(0.999, ambient + diffuse * d) * ramp.length;
      let level = Math.floor(v);
      const f = v - level;
      if (options.dither && f > 0.7 && (x + y) % 2 === 0) level += 1;
      plan.push([x, y, ramp[Math.min(level, ramp.length - 1)]]);
    }
    for (const [x, y, c] of plan) this.px(x, y, c);
    if (options.outline) this.outlineAround(t, options.outline, plan);
    return this;
  }
  anchor(name, x, y) { this.anchors[name] = [x, y]; return this; }
  clone() {
    const copy = new Pix(this.width, this.height);
    copy.data.set(this.data);
    copy.anchors = JSON.parse(JSON.stringify(this.anchors));
    return copy;
  }
}

// Normal helpers for Pix.light.
const normals = {
  sphere(cx, cy, rx, ry) {
    return (x, y) => {
      const u = Math.max(-1, Math.min(1, (x + 0.5 - cx) / rx)), v = Math.max(-1, Math.min(1, (y + 0.5 - cy) / ry));
      const z = Math.sqrt(Math.max(0.05, 1 - u * u - v * v));
      const l = Math.hypot(u, v, z);
      return [u / l, v / l, z / l];
    };
  },
  // Vertical cylinder that curls toward the viewer; `tilt` leans the top back.
  cylinder(cx, rx, tilt = 0) {
    return (x) => {
      const u = Math.max(-0.98, Math.min(0.98, (x + 0.5 - cx) / rx));
      const z = Math.sqrt(1 - u * u);
      const l = Math.hypot(u, tilt, z);
      return [u / l, -tilt / l, z / l];
    };
  },
  // Capsule around a polyline (limbs): normal points away from the nearest axis point.
  capsule(points, radius) {
    return (x, y) => {
      let best = null;
      for (let i = 0; i + 1 < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[i + 1];
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy || 1)));
        const px = ax + dx * t, py = ay + dy * t;
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        if (!best || d < best.d) best = { d, ux: (x + 0.5 - px) / radius, uy: (y + 0.5 - py) / radius };
      }
      const z = Math.sqrt(Math.max(0.05, 1 - best.ux ** 2 - best.uy ** 2));
      const l = Math.hypot(best.ux, best.uy, z);
      return [best.ux / l, best.uy / l, z / l];
    };
  },
};

module.exports = { Pix, colorIndex, normals };
