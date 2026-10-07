// Sprite bundle invariants: it matches the sources, uses the shared palette,
// every sprite is referenced by the game, and layout/anchors stay in bounds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const png = require('../art/tools/png.cjs');
const palette = require('../art/palette.cjs');
const layout = require('../js/content/layout.js');
const customers = require('../js/content/customers.js');
const story = require('../js/content/story.js');

const ROOT = path.resolve(__dirname, '..');
const bundleFile = path.join(ROOT, 'assets/sprite-data.js');
const before = fs.readFileSync(bundleFile, 'utf8');
execFileSync('node', [path.join(ROOT, 'art/tools/build-art.cjs')], { cwd: ROOT, stdio: 'pipe' });
assert.equal(fs.readFileSync(bundleFile, 'utf8'), before, 'assets/sprite-data.js is stale: run node art/tools/build-art.cjs');

globalThis.NSF = {};
require(bundleFile);
const { sprites } = globalThis.NSF.spriteData;
const names = Object.keys(sprites);

// Indices stay inside the palette, and the indexed PNG export that Aseprite
// edits round-trips exactly through the codec used for art/overrides.
const RGBA = palette.colors.map(([, hex]) => palette.rgba(hex));
for (const name of names) {
  const pixels = Buffer.from(sprites[name].data, 'base64');
  assert.equal(pixels.length, sprites[name].w * sprites[name].h, name);
  assert.ok(pixels.every(v => v < RGBA.length), `${name} indexes outside the palette`);
  const image = png.decode(png.encodeIndexed(sprites[name].w, sprites[name].h, pixels, RGBA));
  for (let i = 0; i < pixels.length; i++) {
    const actual = [...image.rgba.subarray(i * 4, i * 4 + 4)];
    if (pixels[i]) assert.deepEqual(actual, RGBA[pixels[i]], name);
    else assert.equal(actual[3], 0, name);
  }
}

// Every sprite is referenced: as a string literal in runtime code, a catalogue
// sprite, a fixture or decor sprite, or a part customers.parts names for a pose.
const code = ['js', 'js/content', 'js/game', 'js/render', 'js/engine', 'js/core']
  .flatMap(dir => fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(ROOT, dir, f), 'utf8')))
  .join('\n');
const used = new Set(story.catalog.map(p => p.sprite));
for (const fixture of Object.values(layout.fixtures)) for (const key of ['sprite', 'busy', 'echo']) if (fixture[key]) used.add(fixture[key]);
for (const name of layout.decor) used.add(name);
for (const id of Object.keys(customers.customers)) {
  for (const pose of customers.posesOf(id)) for (const part of Object.values(customers.parts(id, pose)).flat()) used.add(part.sprite);
}
for (const name of names) {
  assert.ok(used.has(name) || code.includes(`'${name}'`), `sprite ${name} is never used`);
}
for (const name of used) assert.ok(sprites[name], `referenced sprite ${name} is missing`);

// Machines sit inside the view, placed by their 'at' anchor; customer parts carry
// their place on the customer canvas.
for (const [key, fixture] of Object.entries(layout.fixtures)) {
  const s = sprites[fixture.sprite], [x, y] = s.anchors.at;
  assert.ok(x > -s.w && x < layout.world.width && y >= 0 && y + s.h <= layout.world.height, key + ' is in view');
}
for (const id of Object.keys(customers.customers)) {
  for (const pose of customers.posesOf(id)) for (const part of Object.values(customers.parts(id, pose)).flat()) {
    assert.ok(sprites[part.sprite].anchors.at, `${part.sprite} has its canvas place`);
  }
  assert.equal(Object.keys(customers.slotColors(id)).length, palette.slots.length, id);
}

// The two widest goods fit the lane side by side.
const widths = story.catalog.map(p => sprites[p.sprite].w).sort((a, b) => b - a);
assert.ok(widths[0] + widths[1] + layout.lane.gap <= layout.lane.width, 'two widest products fit the lane');
console.log(`PASS: ${names.length} sprites match sources, palette, references, layout and anchors.`);
