// The clerk's flip phone held up close, front on: three frames of it flipping open
// (closed, half open, open), drawn bottom-aligned on one canvas so the hinge stays
// put. The open frame's inner screen is left dark; the runtime draws the phone's
// menu into the 'lcd' rectangle and takes clicks on the keys at their anchors.
'use strict';
const { Pix } = require('../tools/pixel.cjs');

const W = 96, H = 236;
const HINGE = 112, BASE = 124;                   // hinge barrel top, base top

// A rounded rectangle in the silver shell: lit left edge, shaded right edge, a
// rim in the material's darkest tone.
function shell(p, x, y, w, h, r = 6) {
  for (let j = 0; j < h; j++) {
    const inset = j < r ? r - Math.round(Math.sqrt(r * r - (r - j - 0.5) ** 2)) : j >= h - r ? r - Math.round(Math.sqrt(r * r - (j - (h - r) + 0.5) ** 2)) : 0;
    p.hline(x + inset, x + w - 1 - inset, y + j, 'steel6');
    p.px(x + inset + 1, y + j, 'steel7').px(x + w - 2 - inset, y + j, 'steel5').px(x + w - 3 - inset, y + j, 'steel5');
  }
  return p;
}

function hinge(p) {
  p.rect(6, HINGE, W - 12, BASE - HINGE, 'steel4').hline(6, W - 7, HINGE + 3, 'steel6').hline(6, W - 7, HINGE + 4, 'steel5');
  p.hline(6, W - 7, BASE - 2, 'steel3');
  for (const x of [28, W - 29]) p.vline(x, HINGE, BASE - 1, 'steel3');
  return p;
}

function base(p) {
  shell(p, 2, BASE, W - 4, H - BASE);
  // Soft keys either side of the round navigation key with its OK centre.
  for (const x of [10, W - 32]) p.rect(x, 134, 22, 7, 'steel4').hline(x + 1, x + 20, 134, 'steel7').hline(x + 1, x + 20, 140, 'steel3');
  p.ellipse(48, 152, 15, 13, 'steel3').ellipse(48, 152, 14, 12, 'steel5').ellipse(48, 151, 13, 11, 'steel6');
  for (const [x, y] of [[48, 142], [48, 162], [37, 152], [59, 152]]) p.rect(x - 1, y - 1, 3, 2, 'steel3');
  p.ellipse(48, 152, 6, 5, 'steel3').ellipse(48, 152, 5, 4, 'steel7');
  // Call and end keys.
  p.rect(10, 160, 20, 8, 'green2').hline(11, 28, 160, 'green3').hline(11, 28, 167, 'green0');
  p.rect(W - 30, 160, 20, 8, 'red2').hline(W - 29, W - 12, 160, 'red3').hline(W - 29, W - 12, 167, 'red0');
  // Number keys, three by four.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = 12 + c * 25, y = 176 + r * 13;
    p.rect(x, y, 22, 10, 'steel5').hline(x + 1, x + 20, y, 'steel7').hline(x + 1, x + 20, y + 9, 'steel3');
    p.rect(x + 9, y + 3, 4, 4, 'steel3');
  }
  p.rect(46, 230, 4, 2, 'steel2');                                                           // microphone
  return p
    .anchor('up', 48, 143).anchor('down', 48, 161).anchor('left', 38, 152).anchor('right', 58, 152).anchor('ok', 48, 152)
    .anchor('softL', 21, 137).anchor('softR', W - 21, 137).anchor('end', W - 20, 164);
}

function open() {
  const p = new Pix(W, H);
  shell(p, 2, 0, W - 4, HINGE + 2);
  p.rect(36, 7, 24, 3, 'steel3').hline(37, 58, 8, 'steel1');                                  // earpiece
  p.rect(10, 16, W - 20, 90, 'steel2').rect(12, 18, W - 24, 86, 'ink');                      // screen bezel
  p.rect(15, 21, 66, 81, 'steel0').anchor('lcd', 15, 21).anchor('lcdEnd', 81, 102);
  return base(hinge(p));
}

function half() {
  const p = new Pix(W, H);
  // The lid tilted back: its inner face foreshortened, narrower toward the top.
  for (let y = 66; y < HINGE + 2; y++) {
    const inset = Math.round((HINGE - y) * 0.12);
    p.hline(2 + inset, W - 3 - inset, y, 'steel6').px(3 + inset, y, 'steel7').px(W - 4 - inset, y, 'steel5');
  }
  p.hline(9, W - 10, 66, 'steel7');
  for (let y = 74; y < 106; y++) {
    const inset = Math.round((HINGE - y) * 0.12) + 9;
    p.hline(inset, W - 1 - inset, y, y < 76 || y > 103 ? 'steel2' : 'ink');
  }
  return base(hinge(p));
}

function closed() {
  const p = new Pix(W, H);
  hinge(p);
  shell(p, 2, BASE, W - 4, H - BASE);
  // The lid's outer face: the small display lit cyan with the time, a logo stripe.
  p.rect(30, 140, 36, 26, 'steel2').rect(32, 142, 32, 22, 'ink').rect(34, 144, 28, 18, 'cyan1');
  p.hline(34, 61, 144, 'cyan3').rect(38, 151, 20, 4, 'cyan3');
  p.hline(40, 55, 190, 'steel4').hline(40, 55, 191, 'steel7');
  p.rect(6, HINGE - 6, 6, 8, 'steel4').vline(7, HINGE - 6, HINGE + 1, 'steel6');               // aerial stub
  return p;
}

module.exports = () => ({
  'handset-closed': closed(),
  'handset-half': half(),
  'handset-open': open(),
});
