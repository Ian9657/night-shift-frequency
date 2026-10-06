#!/usr/bin/env node
// Builds every sprite from art/src into assets/sprite-data.js (runtime bundle)
// and art/palette.gpl, plus review sheets in tests/artifacts/art-*.png.
//
//   node art/tools/build-art.cjs              full build
//   node art/tools/build-art.cjs --png        also export indexed PNGs to art/png/
//                                             (open in Aseprite with art/palette.gpl)
//   node art/tools/build-art.cjs --preview customers
//                                             contact sheet of one source file only
//
// A PNG placed in art/overrides/<name>.png replaces the generated sprite; it must
// use colours from the shared palette.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const png = require('./png.cjs');
const palette = require('../palette.cjs');
const { Pix } = require('./pixel.cjs');
const layout = require('../../js/content/layout.js');
const customers = require('../../js/content/customers.js');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'art/src');
const OVERRIDES = path.join(ROOT, 'art/overrides');
const REVIEW = path.join(ROOT, 'tests/artifacts');
const RGBA = palette.colors.map(([, hex]) => palette.rgba(hex));

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

// RGBA review surface that honours per-customer slot colours and mirroring.
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
    for (let j = 0; j < pix.height; j++) for (let i = 0; i < pix.width; i++) {
      const value = pix.data[j * pix.width + i];
      if (!value) continue;
      const tx = options.flip ? x + customers.FLIP_AXIS * 2 - i : x + i, ty = y + j;
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

function drawCustomer(surface, sprites, id, x, y, pose) {
  const slots = customers.slotColors(id);
  for (const layer of customers.layers(id, pose)) surface.draw(sprites, layer.sprite, x, y, { slots, flip: layer.flip });
  const arm = customers.frontArm(pose);
  return { slots, arm };
}

function scene(sprites) {
  const surface = new Surface(layout.world.width, layout.world.height);
  surface.draw(sprites, 'room', 0, 0);
  surface.draw(sprites, 'tower-light-on', layout.towerLight.x - 3, layout.towerLight.y - 3);
  const c = layout.customer;
  const { slots, arm } = drawCustomer(surface, sprites, 'nell', c.x, c.y, 'reach');
  surface.draw(sprites, 'counter', 0, layout.counterTop);
  for (const fixture of Object.values(layout.fixtures)) surface.draw(sprites, fixture.sprite, fixture.x, fixture.y);
  let x = layout.lane.x;
  for (const name of ['cola', 'onigiri', 'bento']) {
    if (!sprites[name]) continue;
    surface.draw(sprites, name, x, layout.lane.incomingFoot - sprites[name].height);
    x += sprites[name].width + layout.lane.gap;
  }
  if (arm) surface.draw(sprites, arm, c.x, c.y, { slots });
  return surface;
}

function customerSheet(sprites) {
  const ids = Object.keys(customers.customers);
  const cell = 96;
  const surface = new Surface(ids.length * cell, 240, palette.rgba('#324745'));
  ids.forEach((id, i) => {
    for (const [row, pose] of [[0, 'idle'], [1, 'reach']]) {
      const x = i * cell - 12, y = row * 120 + 2;
      const { slots, arm } = drawCustomer(surface, sprites, id, x, y, pose);
      if (arm) surface.draw(sprites, arm, x, y, { slots });
    }
  });
  return surface;
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
    fs.writeFileSync(path.join(REVIEW, `art-${preview}.png`), contactSheet(sprites).png(preview === 'scene' ? 2 : 4));
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
  fs.writeFileSync(path.join(REVIEW, 'art-scene.png'), scene(sprites).png(2));
  fs.writeFileSync(path.join(REVIEW, 'art-customers.png'), customerSheet(sprites).png(3));
  console.log(`built ${Object.keys(sprites).length} sprites`);
}

main();
