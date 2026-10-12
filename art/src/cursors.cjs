// The pointer, drawn like the rest of the game: an arrow over nothing, a pointing hand
// over something that can be used, a closed hand while an item is held, and a dial
// knob between two arrows over the radio (scroll to tune). Each is drawn as a filled
// silhouette and outlined in ink; its 'hot' anchor is the pixel that points.
'use strict';
const { Pix } = require('../tools/pixel.cjs');

// w: paper, s: the paper's shade (creases, the far edge), c: cyan (the tuning arrows).
const COLORS = { w: 'paper3', s: 'paper1', c: 'cyan3' };

function cursor(rows, [hx, hy]) {
  const w = rows[0].length + 2, h = rows.length + 2;
  const p = new Pix(w, h);
  const filled = (x, y) => (rows[y - 1]?.[x - 1] || '.') !== '.';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (filled(x, y)) p.px(x, y, COLORS[rows[y - 1][x - 1]]);
    else if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) p.px(x, y, 'ink');
  }
  return p.anchor('hot', hx + 1, hy + 1);
}

module.exports = () => ({
  'cursor-arrow': cursor([
    'w.......',
    'ww......',
    'www.....',
    'wwww....',
    'wwwww...',
    'wwwwww..',
    'wwwwwww.',
    'wwwwwwww',
    'wwwww...',
    'ww.ww...',
    'w...ww..',
    '....ww..',
    '.....w..',
  ], [0, 0]),
  'cursor-hand': cursor([
    '...ww......',
    '...ww......',
    '...ww......',
    '...wwsww...',
    '...wwswwsww',
    'w..wwswwsww',
    'ww.wwwwwwww',
    'wwwwwwwwwww',
    '.wwwwwwwwww',
    '..wwwwwwwws',
    '..wwwwwwwws',
    '...wwwwwws.',
    '...wwwwwws.',
  ], [3, 0]),
  'cursor-grab': cursor([
    '..ww.ww.ww..',
    '.wwwswwswww.',
    '.wwwswwswwww',
    'wwwwwwwwwwww',
    'wwwwwwwwwwww',
    '.wwwwwwwwwws',
    '..wwwwwwwws.',
    '...wwwwwws..',
  ], [6, 4]),
  'cursor-tune': cursor([
    '.....wwwww.....',
    '..c.wwwcwww.c..',
    '.cc.wwwcwww.cc.',
    'ccccwwwwwwwcccc',
    '.cc.wwwwwww.cc.',
    '..c.wwwwwws.c..',
    '.....wssss.....',
  ], [7, 3]),
});
