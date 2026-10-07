// Shared indexed palette. Index 0 is transparent. Every sprite stores indices
// into this list, so the runtime can remap slot colours (skin, hair, cloth...)
// per customer and apply whole-scene moods without editing artwork.
// Material ramps run darkest -> lightest and are hue-shifted (js/content/colors.js).
'use strict';
const { ramp } = require('../js/content/colors.js');

const named = (prefix, values) => values.map((hex, i) => [prefix + i, hex]);

const colors = [
  ['clear', '#00000000'],
  ['void', '#05070c'], ['ink', '#0e1214'],
  // Night outside: sky, sea, wet street
  ...named('night', ['#0a0f1c', '#101a2e', '#172741', '#203759', '#2d4b73', '#43668f']),
  ...named('sea', ['#08131f', '#0e2134', '#16314a', '#22465f']),
  ['rain', '#6d8fb3'],
  ...named('lamp', ['#5a4a32', '#93774a', '#e0b363', '#fbe7a6']),
  ...named('haze', ['#1f2b40', '#2e3446', '#433f42']),
  // Interior walls and ceiling under cold fluorescent tubes: near-white and slightly
  // blue-green when lit, the dark end kept for shadow and outlines.
  ...named('wall', ['#141c1f', '#25333a', '#3e5058', '#64797f', '#93a7aa', '#c0d0cf', '#e2ece8']),
  ['tube', '#f4fcf8'], ['white', '#f3f6ea'],
  // Machine metal and plastic
  ...named('steel', ['#14191e', '#1e252b', '#2c353d', '#3f4b54', '#5a6871', '#7f8f96', '#adbcbd', '#d4ddd8']),
  // Beige 90s plastic
  ...named('cream', ['#5e5848', '#837c66', '#a8a088', '#c7c0a5', '#e0dac2', '#f1ecd9']),
  // Counter laminate
  ...named('top', ['#3e3f36', '#5b5b4d', '#7d7c68', '#a2a088', '#c4c2a8', '#dddbc4']),
  ...named('wood', ['#22170f', '#3c2a1c', '#5a3f2a', '#7d5a3c', '#a07a54']),
  // Accents
  ...named('red', ramp('#c8403a', 5)),
  ...named('orange', ramp('#df8a3a', 5)),
  ...named('yellow', ramp('#efcf5a', 4, { at: 2 })),
  ...named('green', ramp('#4fa25f', 5)),
  ...named('phos', ['#0a1a12', '#123522', '#2c6b3e', '#5cbf63', '#b4f59a']),
  ...named('cyan', ramp('#3fb3b3', 5)),
  ...named('blue', ramp('#3e64b4', 5)),
  ...named('pink', ramp('#d05c88', 4, { at: 2 })),
  ...named('violet', ramp('#6a55a0', 3, { at: 1 })),
  ...named('paper', ['#8f8a7a', '#c9c4b0', '#ebe7d6', '#fbf9ef']),
  // Harbor Mart brand: buoy orange and navy
  ...named('buoy', ramp('#e8622a', 5)),
  ...named('navy', ramp('#223e6b', 5)),
  // Remappable slots: each customer supplies its own ramps (see js/content/customers.js).
  ...named('skin', ['#4a2a22', '#7c4a36', '#a8694c', '#cf9472', '#ecc2a2']),
  ...named('hair', ['#0c0a0a', '#1e1917', '#352c28', '#54463e']),
  ...named('cloth', ['#0c111c', '#22314f', '#395376', '#527799', '#799aaf']),
  ...named('under', ['#5c5f56', '#83857a', '#a8a8a0', '#d8d8d0']),
  ...named('accent', ['#6b4b16', '#c9a24a', '#ead08a']),
  ...named('eye', ['#1a1412', '#e9e4da']),
];

const names = colors.map(([name]) => name);
const index = Object.fromEntries(names.map((name, i) => [name, i]));
const slots = names.filter(name => /^(skin|hair|cloth|under|accent)\d$/.test(name));

function rgba(hex) {
  const value = hex.replace('#', '');
  const parts = value.match(/../g).map(part => parseInt(part, 16));
  return parts.length === 3 ? [...parts, 255] : parts;
}

module.exports = { colors, names, index, slots, rgba };
