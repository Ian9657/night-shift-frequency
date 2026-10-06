// Text and content invariants: every referenced key resolves, no string is
// orphaned, the baked font covers every character, and branches have endings.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { strings, t } = require('../js/content/strings.js');
const story = require('../js/content/story.js');
const { generate } = require('../js/engine/shift.js');

const ROOT = path.resolve(__dirname, '..');
for (const [key, value] of Object.entries(strings)) {
  assert.ok(typeof value === 'string' && value.trim(), `${key} is empty`);
  assert.ok(/^[\x20-\x7e·…—“”‘’×↑↓]*$/.test(value), `${key} contains characters outside the English set`);
}

// Keys referenced in runtime code and generated orders all exist.
const code = fs.readdirSync(path.join(ROOT, 'js'), { recursive: true }).filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
const literal = /'((?:title|end|item|pos|rec|origin|verify|report|say|radio|ui)\.[A-Za-z0-9.]+)'/g;
for (const [, key] of code.matchAll(literal)) assert.ok(strings[key], 'missing string ' + key);
for (let seed = 0; seed < 200; seed++) {
  for (const order of generate(seed)) {
    const keys = [...order.customerLines, order.exitLine, ...order.items.flatMap(i => [i.label, i.pos, i.real]),
      ...Object.values(order.reactions).flat().map(r => (typeof r === 'string' ? r : r.text))].filter(Boolean);
    keys.forEach(key => assert.ok(strings[key], `seed ${seed}: missing ${key}`));
  }
}
const storyKeys = [...story.radio.intro, ...story.radio.orders.flat(), ...Object.values(story.radio.endings).flat(), story.radio.signoff,
  ...Object.values(story.records).flatMap(r => [...r.lines, r.exit, ...Object.values(r.afterDecision)])];
storyKeys.forEach(key => assert.ok(strings[key], 'missing story key ' + key));
assert.equal(story.radio.orders.length, 8);
assert.deepEqual(Object.keys(story.radio.endings).sort(), ['correct-independent', 'correct-linked', 'keep-independent', 'keep-linked']);

// The baked bitmap font contains every character the game can show.
const fontFile = path.join(ROOT, 'assets/font-data.js');
globalThis.NSF = {};
require(fontFile);
const glyphs = globalThis.NSF.fontData.glyphs;
for (const [key, value] of Object.entries(strings)) {
  for (const ch of value.replace(/\{\w+\}/g, '')) assert.ok(glyphs[ch], `font lacks "${ch}" (${key}); run python3 art/tools/build-font.py`);
}
for (const ch of '×↑↓0123456789') assert.ok(glyphs[ch], 'font lacks ' + ch);

// No orphaned strings: each key is referenced literally, as '@key', by the story,
// or through a dynamic prefix the runtime builds from data.
const storyText = JSON.stringify(story);
const dynamic = /^(pos|say)\.(cash|card|tap)$|^(origin|verify)\./;
for (const key of Object.keys(strings)) {
  const used = code.includes(`'${key}'`) || code.includes('@' + key) || storyText.includes(`"${key}"`) || dynamic.test(key);
  assert.ok(used, 'unused string ' + key);
}

// '@key' variables are looked up themselves.
assert.equal(t('radio.echoRecord', { time: '02:41', label: '@item.spareKey' }), 'REG#02. 02:41. SPARE KEY, one.');
console.log(`PASS: ${Object.keys(strings).length} strings, references, no orphans, story keys and font coverage.`);
