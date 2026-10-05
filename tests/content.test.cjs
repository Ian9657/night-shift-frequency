// Text and content invariants: both languages exist, every referenced key
// resolves, the baked font covers every character, and branches have endings.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../js/content/strings.js');
const story = require('../js/content/story.js');
const { generate } = require('../js/engine/shift.js');

const ROOT = path.resolve(__dirname, '..');
for (const [key, value] of Object.entries(i18n.strings)) {
  assert.ok(Array.isArray(value) && value.length === 2 && value[0] && value[1], `${key} needs zh and en`);
  const vars = value.map(v => (v.match(/\{\w+\}/g) || []).sort().join());
  assert.equal(vars[0], vars[1], `${key} uses the same variables in both languages`);
}

// Keys referenced in runtime code and generated orders all exist.
const code = fs.readdirSync(path.join(ROOT, 'js'), { recursive: true }).filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
const literal = /'((?:title|end|item|pos|rec|origin|verify|report|say|radio|ui)\.[A-Za-z0-9.]+)'/g;
for (const [, key] of code.matchAll(literal)) assert.ok(i18n.strings[key], 'missing string ' + key);
for (let seed = 0; seed < 200; seed++) {
  for (const order of generate(seed)) {
    const keys = [...order.customerLines, order.exitLine, ...order.items.flatMap(i => [i.label, i.pos, i.real]),
      ...Object.values(order.reactions).flat().map(r => (typeof r === 'string' ? r : r.text))].filter(Boolean);
    keys.forEach(key => assert.ok(i18n.strings[key], `seed ${seed}: missing ${key}`));
  }
}
const storyKeys = [...story.radio.intro, ...story.radio.orders.flat(), ...Object.values(story.radio.endings).flat(), story.radio.signoff,
  ...Object.values(story.records).flatMap(r => [...r.lines, r.exit, ...Object.values(r.afterDecision)])];
storyKeys.forEach(key => assert.ok(i18n.strings[key], 'missing story key ' + key));
assert.equal(story.radio.orders.length, 8);
assert.deepEqual(Object.keys(story.radio.endings).sort(), ['correct-independent', 'correct-linked', 'keep-independent', 'keep-linked']);

// The baked bitmap font contains every character the game can show.
const fontFile = path.join(ROOT, 'assets/font-data.js');
globalThis.NSF = {};
require(fontFile);
const glyphs = globalThis.NSF.fontData.glyphs;
for (const [key, value] of Object.entries(i18n.strings)) {
  for (const ch of value.join('').replace(/\{\w+\}/g, '')) assert.ok(glyphs[ch], `font lacks "${ch}" (${key}); run python3 art/tools/build-font.py`);
}
for (const ch of '¥×↑↓0123456789') assert.ok(glyphs[ch], 'font lacks ' + ch);

// Translation of '@key' variables follows the active language.
i18n.setLanguage('en');
assert.equal(i18n.t('radio.echoRecord', { time: '02:41', label: '@item.spareKey' }), 'REG#02. 02:41. SPARE KEY, one.');
i18n.setLanguage('zh');
assert.equal(i18n.t('radio.echoRecord', { time: '02:41', label: '@item.spareKey' }), 'REG#02，02:41，备用钥匙，一件。');
console.log(`PASS: ${Object.keys(i18n.strings).length} bilingual strings, references, story keys and font coverage.`);
