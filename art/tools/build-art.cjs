#!/usr/bin/env node
// Builds every sprite from art/src into assets/sprite-data.js (runtime bundle)
// and art/palette.gpl, plus review sheets in tests/artifacts/art-*.png.
//
//   node art/tools/build-art.cjs              full build
//   node art/tools/build-art.cjs --png        also export indexed PNGs to art/png/
//                                             (open in Aseprite with art/palette.gpl)
//   node art/tools/build-art.cjs --preview goods
//                                             contact sheet of one source file only
//   node art/tools/build-art.cjs --preview store3d
//                                             the store, every customer pose, rig sheets
//   node art/tools/build-art.cjs --preview sample
//                                             the figure acceptance sample
//
// A PNG placed in art/overrides/<name>.png replaces the generated sprite; it must
// use colours from the shared palette.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const png = require('./png.cjs');
const palette = require('../palette.cjs');
const { Pix } = require('./pixel.cjs');
const customers = require('../../js/content/customers.js');
const space = require('../../js/content/space.js');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'art/src');
const OVERRIDES = path.join(ROOT, 'art/overrides');
const REVIEW = path.join(ROOT, 'tests/artifacts');
const RGBA = palette.colors.map(([, hex]) => palette.rgba(hex));
const AXIS = space.customer.centre - 0.5;                          // the customer canvas's mirror axis

function loadSprites(only) {
  const sprites = {};
  for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.cjs')).sort()) {
    if (only && file !== only + '.cjs') continue;
    const made = require(path.join(SRC, file))();
    for (const [name, pix] of Object.entries(made)) {
      if (sprites[name]) throw new Error('Duplicate sprite name: ' + name);
      if (!(pix instanceof Pix)) throw new Error(`${file}: ${name} is not a Pix`);
      sprites[name] = pix;
    }
  }
  return sprites;
}

function applyOverride(name, pix) {
  const file = path.join(OVERRIDES, name + '.png');
  if (!fs.existsSync(file)) return pix;
  const image = png.decode(fs.readFileSync(file));
  const lookup = new Map(RGBA.map((c, i) => [c.join(','), i]));
  const result = new Pix(image.width, image.height);
  result.anchors = pix.anchors;
  for (let i = 0; i < image.width * image.height; i++) {
    const c = [...image.rgba.subarray(i * 4, i * 4 + 4)];
    if (c[3] === 0) continue;
    const index = lookup.get(c.join(','));
    if (index === undefined) throw new Error(`${name}.png uses a colour outside the palette: ${c}`);
    result.data[i] = index;
  }
  console.log('override:', name);
  return result;
}

function writeGpl() {
  const lines = ['GIMP Palette', 'Name: Night Shift Frequency', 'Columns: 8', '#'];
  palette.colors.forEach(([name, hex]) => {
    const [r, g, b] = palette.rgba(hex);
    lines.push(`${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${name}`);
  });
  fs.writeFileSync(path.join(ROOT, 'art/palette.gpl'), lines.join('\n') + '\n');
}

// RGBA review surface that honours per-customer slot colours, a sprite's crop
// offset on the customer canvas (anchor 'at', with `placed`) and mirroring about
// that canvas's axis (`flip`).
class Surface {
  constructor(width, height, background = [8, 10, 12, 255]) {
    this.width = width; this.height = height;
    this.rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) this.rgba.set(background, i * 4);
  }
  draw(sprites, name, x, y, options = {}) {
    const pix = sprites[name];
    if (!pix) return;
    const colors = RGBA.map((c, i) => options.slots?.[palette.names[i]] ? palette.rgba(options.slots[palette.names[i]]) : c);
    const [ax, ay] = options.placed ? pix.anchors.at || [0, 0] : [0, 0];
    for (let j = 0; j < pix.height; j++) for (let i = 0; i < pix.width; i++) {
      const value = pix.data[j * pix.width + i];
      if (!value) continue;
      const tx = options.flip ? x + 2 * AXIS - (ax + i) : x + ax + i, ty = y + ay + j;
      if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) continue;
      this.rgba.set(colors[value], (ty * this.width + tx) * 4);
    }
  }
  png(scale) {
    const out = Buffer.alloc(this.width * scale * this.height * scale * 4);
    for (let y = 0; y < this.height * scale; y++) for (let x = 0; x < this.width * scale; x++) {
      const at = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
      out.set(this.rgba.subarray(at, at + 4), (y * this.width * scale + x) * 4);
    }
    return png.encodeRGBA(this.width * scale, this.height * scale, out);
  }
}

// The first-person store, as the game draws it (js/render/world.js): layers back
// to front, the customer's parts (customers.parts) on their canvas.
function store(sprites, id = 'nell', pose = process.env.POSE || customers.poseFor(id)) {
  const surface = new Surface(480, 270);
  const put = name => sprites[name] && surface.draw(sprites, name, ...(sprites[name].anchors.at || [0, 0]));
  const [ox, oy] = space.customerOrigin();
  const slots = customers.slotColors(id);
  const rise = space.figureOffset(customers.customers[id].person.height);
  const parts = customers.parts(id, pose);
  const [hx, hy] = sprites[parts.behind.find(p => p.sprite.startsWith('person-back-')).sprite].anchors.head;
  const draw = part => {
    if (!sprites[part.sprite]) throw new Error(`missing sprite ${part.sprite}`);
    surface.draw(sprites, part.sprite, ox + (part.follows ? hx : 0), oy + (part.follows ? rise + hy : 0), { slots, flip: part.flip, placed: true });
  };
  put('store-back');
  put('store-sides');
  parts.behind.forEach(draw);
  put('store-counter');
  parts.counter.forEach(draw);
  for (const name of ['store-microwave', 'store-cctv', 'store-printer', 'store-pos', 'store-bags', 'store-scanner', 'store-terminal', 'store-tray', 'store-radio', 'store-phone']) put(name);
  parts.over.forEach(draw);
  put('store-front');
  return surface;
}

// Every customer in the store, cropped to the customer area: how they wait, then
// each thing the game asks of them (paying by card, by phone, in cash, receiving).
function peopleSheet(sprites) {
  const shots = Object.keys(customers.customers).flatMap(id => customers.posesOf(id).map(pose => [id, pose]));
  const [cx, cy, cw, ch] = [152, 8, 176, 182], cols = 5;
  const sheet = new Surface(Math.min(cols, shots.length) * (cw + 4), Math.ceil(shots.length / cols) * (ch + 4), [255, 255, 255, 255]);
  shots.forEach(([id, pose], n) => {
    const scene = store(sprites, id, pose), dx = (n % cols) * (cw + 4), dy = Math.floor(n / cols) * (ch + 4);
    for (let y = 0; y < ch; y++) scene.rgba.copy(sheet.rgba, ((dy + y) * sheet.width + dx) * 4, ((cy + y) * 480 + cx) * 4, ((cy + y) * 480 + cx + cw) * 4);
  });
  return sheet;
}

// Rig check: plain block figures of different heights and builds (columns) in
// test poses (rows), with Nell's skin and hair and a neutral cloth. The flat sheet
// drops shading to show form alone; pink marks are shoulder, elbow and wrist, and
// neck, chest, waist and hip on the centre line (also where the counter hides them).
const RIG_TESTS = [
  { height: 1.68, build: 'average', arms: [1, 1], hands: [1, 1] }, { height: 1.88, build: 'average', arms: [1.03, 0.95], hands: [1.08, 1] },
  { height: 1.52, build: 'average', arms: [0.97, 1], hands: [0.94, 0.96] }, { height: 1.72, build: 'heavy', arms: [0.97, 1.08], hands: [1, 1.12] },
  { height: 1.72, build: 'slim', arms: [1.04, 0.88], hands: [1.06, 0.9] },
];
const RIG_POSES = ['both-rest', 'phone-call', 'phone-one', 'phone-check', 'card', 'card-reader', 'receive'];
function rigSheet(sprites, flat) {
  const { figure } = require(path.join(SRC, 'people.cjs'));
  const { ramp } = require('../../js/content/colors.js');
  const slots = { ...customers.slotColors('nell'), ...Object.fromEntries(ramp('#6f7b85', 5, { at: 2 }).map((hex, i) => ['cloth' + i, hex])) };
  const [ox, oy] = space.customerOrigin();
  const [cx, cy, cw, ch] = [176, 0, 128, 200];
  const sheet = new Surface(RIG_TESTS.length * (cw + 4), RIG_POSES.length * (ch + 4), [255, 255, 255, 255]);
  RIG_POSES.forEach((pose, row) => RIG_TESTS.forEach((test, col) => {
    const f = figure({ ...test, body: 'plain' }, pose, { flat });
    const local = { ...sprites, back: f.back, front: f.front, counter: f.counter, over: f.over };
    const [hx, hy] = f.back.anchors.head;
    const surface = new Surface(480, 270);
    const put = name => surface.draw(local, name, ...(local[name].anchors.at || [0, 0]));
    put('store-back'); put('store-sides');
    for (const [name, shifted] of [['back', false], [`person-head-oval-${f.gaze}`, true], ['person-hair-short', true], ['front', false]]) {
      surface.draw(local, name, ox + (shifted ? hx : 0), oy + (shifted ? f.dy + hy : 0), { slots, placed: shifted });
    }
    put('store-counter');
    surface.draw(local, 'counter', ox, oy, { slots });
    for (const name of ['store-scanner', 'store-terminal']) put(name);
    surface.draw(local, 'over', ox, oy, { slots });
    if (flat) for (const [x, y] of f.joints) {
      const tx = ox + x, ty = oy + y;
      if (tx >= 0 && ty >= 0 && tx < 480 && ty < 270) surface.rgba.set([255, 40, 160, 255], (ty * 480 + tx) * 4);
    }
    for (let y = 0; y < ch; y++) surface.rgba.copy(sheet.rgba, ((row * (ch + 4) + y) * sheet.width + col * (cw + 4)) * 4, ((cy + y) * 480 + cx) * 4, ((cy + y) * 480 + cx + cw) * 4);
  }));
  return sheet;
}

// The acceptance sample (docs/character-assets.md): one average customer in a
// plain fitted T-shirt, both hands resting on the counter. Three panels: the
// structure (flat tones, no counter, skeleton lines through neck root, shoulders,
// elbows, wrists, ribcage, waist and pelvis), the shaded body without the counter,
// and the counter view.
function sampleSheet(sprites) {
  const { figure } = require(path.join(SRC, 'people.cjs'));
  const { ramp } = require('../../js/content/colors.js');
  const slots = { ...customers.slotColors('kit'), ...Object.fromEntries(ramp('#7d8fa3', 5, { at: 2 }).map((hex, i) => ['cloth' + i, hex])) };
  const person = { height: 1.68, build: 'average', arms: [1, 1], hands: [1, 1], legs: 'grey', body: 'tee' };
  const [ox, oy] = space.customerOrigin();
  const [cx, cy, cw, ch] = [152, 20, 176, 190];
  const panels = [];
  for (const mode of ['structure', 'shaded', 'counter']) {
    const f = figure(person, 'both-rest', { flat: mode === 'structure' });
    const local = { ...sprites, back: f.back, front: f.front, counter: f.counter, over: f.over };
    const [hx, hy] = f.back.anchors.head;
    const surface = new Surface(480, 270, [24, 34, 52, 255]);
    const put = name => surface.draw(local, name, ...(local[name].anchors.at || [0, 0]));
    if (mode === 'counter') { put('store-back'); put('store-sides'); }
    for (const [name, shifted] of [['back', false], [`person-head-oval-${f.gaze}`, true], ['person-hair-short', true], ['front', false]]) {
      surface.draw(local, name, ox + (shifted ? hx : 0), oy + (shifted ? f.dy + hy : 0), { slots, placed: shifted });
    }
    if (mode === 'counter') put('store-counter');
    surface.draw(local, 'counter', ox, oy, { slots });
    if (mode === 'counter') for (const name of ['store-scanner', 'store-terminal']) put(name);
    surface.draw(local, 'over', ox, oy, { slots });
    if (mode === 'structure') {
      const L = f.landmarks, ink = [255, 60, 170, 255];
      const dot = ([x, y]) => { for (const [i, j] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = ox + x + i, Y = oy + y + j; if (X >= 0 && Y >= 0 && X < 480 && Y < 270) surface.rgba.set(ink, (Y * 480 + X) * 4); } };
      const line = ([x0, y0], [x1, y1]) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let t = 0; t <= n; t++) { const X = Math.round(ox + x0 + (x1 - x0) * t / n), Y = Math.round(oy + y0 + (y1 - y0) * t / n); if (X >= 0 && Y >= 0 && X < 480 && Y < 270) surface.rgba.set([255, 140, 210, 255], (Y * 480 + X) * 4); } };
      for (const i of [0, 1]) { line(L.neckRoot, L.shoulders[i]); line(L.shoulders[i], L.elbows[i]); line(L.elbows[i], L.wrists[i]); }
      line(L.chin, L.neckRoot); line(L.ribs[0], L.ribs[1]); line(L.waist[0], L.waist[1]); line(L.pelvis[0], L.pelvis[1]);
      line(L.ribs[0], L.waist[0]); line(L.ribs[1], L.waist[1]); line(L.waist[0], L.pelvis[0]); line(L.waist[1], L.pelvis[1]);
      [L.chin, L.neckRoot, ...L.shoulders, ...L.elbows, ...L.wrists].forEach(dot);
    }
    panels.push(surface);
  }
  const scale = 3, sheet = new Surface(panels.length * (cw + 4), ch, [255, 255, 255, 255]);
  panels.forEach((surface, n) => { for (let y = 0; y < ch; y++) surface.rgba.copy(sheet.rgba, (y * sheet.width + n * (cw + 4)) * 4, ((cy + y) * 480 + cx) * 4, ((cy + y) * 480 + cx + cw) * 4); });
  return sheet.png(scale);
}

function contactSheet(sprites) {
  const list = Object.entries(sprites);
  const width = 480;
  let x = 2, y = 2, rowHeight = 0;
  const places = list.map(([name, pix]) => {
    if (x + pix.width > width) { x = 2; y += rowHeight + 4; rowHeight = 0; }
    const at = [x, y];
    x += pix.width + 4;
    rowHeight = Math.max(rowHeight, pix.height);
    return [name, at];
  });
  const surface = new Surface(width, y + rowHeight + 2, palette.rgba('#324745'));
  for (const [name, [px, py]] of places) surface.draw(sprites, name, px, py, { slots: customers.slotColors('nell') });
  return surface;
}

function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
  fs.mkdirSync(REVIEW, { recursive: true });
  const sprites = loadSprites(preview);
  if (preview) {
    if (preview === 'sample') {
      Object.assign(sprites, loadSprites('store3d'), loadSprites('people'));
      fs.writeFileSync(path.join(REVIEW, 'art-sample.png'), sampleSheet(sprites));
      console.log('preview sample written');
      return;
    }
    if (preview === 'store3d') {
      Object.assign(sprites, loadSprites('people'));
      fs.writeFileSync(path.join(REVIEW, 'art-store.png'), store(sprites).png(3));
      fs.writeFileSync(path.join(REVIEW, 'art-people.png'), peopleSheet(sprites).png(2));
      fs.writeFileSync(path.join(REVIEW, 'art-rig.png'), rigSheet(sprites, false).png(2));
      fs.writeFileSync(path.join(REVIEW, 'art-rig-flat.png'), rigSheet(sprites, true).png(2));
      console.log('preview store3d composite written');
      return;
    }
    fs.writeFileSync(path.join(REVIEW, `art-${preview}.png`), contactSheet(sprites).png(4));
    console.log(`preview ${preview}: ${Object.keys(sprites).length} sprites`);
    return;
  }
  for (const name of Object.keys(sprites)) sprites[name] = applyOverride(name, sprites[name]);
  const bundle = { palette: palette.colors.map(([, hex]) => hex), names: palette.names, slots: palette.slots, sprites: {} };
  for (const [name, pix] of Object.entries(sprites)) {
    bundle.sprites[name] = { w: pix.width, h: pix.height, anchors: pix.anchors, data: Buffer.from(pix.data).toString('base64') };
  }
  writeGpl();
  fs.writeFileSync(path.join(ROOT, 'assets/sprite-data.js'),
    '// Generated by art/tools/build-art.cjs. Do not edit; change art/src or art/overrides.\n' +
    '(globalThis.NSF = globalThis.NSF || {}).spriteData = ' + JSON.stringify(bundle) + ';\n');
  if (args.includes('--png')) {
    const out = path.join(ROOT, 'art/png');
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out);
    for (const [name, pix] of Object.entries(sprites)) fs.writeFileSync(path.join(out, name + '.png'), png.encodeIndexed(pix.width, pix.height, pix.data, RGBA));
  }
  fs.writeFileSync(path.join(REVIEW, 'art-store.png'), store(sprites).png(3));
  fs.writeFileSync(path.join(REVIEW, 'art-people.png'), peopleSheet(sprites).png(2));
  console.log(`built ${Object.keys(sprites).length} sprites`);
}

main();
