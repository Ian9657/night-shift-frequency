// Counter equipment at 480x270 world scale. Top-left placement comes from
// js/content/layout.js; local anchor comments match layout coordinates.
'use strict';
const { Pix } = require('../tools/pixel.cjs');

const CREAM = ['cream0', 'cream1', 'cream3', 'cream4', 'cream5'];
const DARK = ['steel0', 'steel1', 'steel2', 'steel3', 'steel5'];
const MID = ['steel1', 'steel3', 'steel4', 'steel5', 'steel7'];
const RED = ['red0', 'red1', 'red2', 'red3', 'red4'];
const PAPER = ['steel4', 'paper1', 'paper2', 'paper3', 'white'];

// Rounded rectangle body in a ramp's mid tone, then light it.
function body(p, x, y, w, h, ramp, options = {}) {
  const r = options.round ?? 2;
  p.rect(x + r, y, w - r * 2, h, ramp[2]).rect(x, y + r, w, h - r * 2, ramp[2]);
  if (r > 1) p.rect(x + 1, y + 1, w - 2, h - 2, ramp[2]);
  p.volume(ramp[2], ramp, options);
  return p;
}

function keys(p, x, y, cols, rows, w, h, gapX, gapY, color = 'cream4') {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const kx = x + i * (w + gapX), ky = y + j * (h + gapY);
    p.rect(kx, ky, w, h, color).hline(kx, kx + w - 1, ky, 'white').hline(kx, kx + w - 1, ky + h, 'steel1');
  }
}

// ------------------------------------------------------------------ microwave 76x50
function microwave(heating) {
  const p = new Pix(76, 50);
  body(p, 0, 0, 76, 47, CREAM);
  // Door panel and perforated window
  p.rect(5, 5, 44, 37, 'cream2').frame(5, 5, 44, 37, 'cream1').hline(6, 47, 6, 'cream4');
  p.rect(8, 8, 37, 30, 'steel0');
  if (heating) {
    p.glow(26, 23, 22, 18, ['orange0', 'orange1', 'orange2', 'orange3', 'yellow2'], (x, y) => x >= 8 && x < 45 && y >= 8 && y < 38);
    p.ellipse(26, 31, 12, 3, 'orange3').ellipse(26, 31, 10, 2, 'yellow2');
    p.rect(19, 25, 15, 5, 'orange1').hline(19, 33, 25, 'orange3').rect(20, 26, 6, 3, 'yellow1');
  } else {
    p.dither(8, 8, 37, 30, 'steel1', 'checker');
    p.ellipse(26, 31, 12, 3, 'steel2').ellipse(26, 31, 10, 2, 'steel1');
  }
  for (let y = 9; y < 38; y += 2) for (let x = 9 + (y % 4 ? 1 : 0); x < 45; x += 2) p.px(x, y, heating ? 'orange1' : 'steel0');
  for (let i = 0; i < 12; i++) p.px(12 + i, 10 + i * 2, heating ? 'yellow3' : 'steel3');
  p.frame(7, 7, 39, 32, 'steel1');
  // Handle
  p.rect(49, 8, 3, 31, 'steel5').vline(49, 8, 38, 'steel7').vline(51, 9, 38, 'steel3').px(50, 7, 'steel6').px(50, 39, 'steel2');
  // Control panel
  p.rect(55, 5, 17, 37, 'cream3').vline(54, 5, 41, 'cream1').vline(55, 5, 41, 'cream5');
  p.rect(56, 7, 15, 7, 'phos0').frame(56, 7, 15, 7, 'steel1');
  const lit = heating ? 'phos4' : 'phos3';
  p.vline(59, 9, 12, lit).hline(62, 64, 10, heating ? lit : 'phos2').hline(66, 68, 10, heating ? lit : 'phos2');
  keys(p, 57, 17, 3, 3, 3, 2, 2, 2);
  p.rect(57, 29, 13, 4, heating ? 'red3' : 'red2').hline(57, 69, 29, heating ? 'red4' : 'red3').hline(57, 69, 33, 'red0');
  p.ellipse(63, 38, 2, 2, 'steel4').px(62, 37, 'steel7');
  for (let x = 58; x < 72; x += 3) p.vline(x, 1, 3, 'cream1');
  p.rect(4, 47, 7, 3, 'ink').rect(65, 47, 7, 3, 'ink');
  return p;
}

// ------------------------------------------------------------------ POS 88x70, screen local (8,6,72,40)
function pos() {
  const p = new Pix(88, 70);
  body(p, 0, 0, 88, 51, CREAM, { round: 3 });
  // Bezel recess around the CRT
  p.rect(4, 2, 80, 46, 'cream2').hline(4, 83, 2, 'cream1').vline(4, 2, 47, 'cream1').hline(5, 83, 47, 'cream4').vline(83, 3, 47, 'cream4');
  p.rect(6, 4, 76, 44, 'steel1').frame(6, 4, 76, 44, 'ink');
  p.rect(8, 6, 72, 40, 'ink');
  // Brand plate, LED and knob under the screen
  p.rect(10, 48, 18, 2, 'cream1').hline(11, 26, 48, 'steel4');
  p.px(74, 48, 'phos3').px(75, 48, 'phos4');
  p.ellipse(66, 49, 1, 1, 'cream1');
  // Neck
  p.rect(34, 51, 20, 4, 'steel2').hline(34, 53, 51, 'steel0').hline(35, 52, 52, 'steel3');
  // Keyboard base with a numeric block and coloured function keys
  body(p, 0, 55, 88, 15, DARK, { round: 2 });
  p.rect(3, 58, 60, 9, 'steel1');
  keys(p, 4, 59, 12, 3, 4, 2, 1, 1, 'cream3');
  p.rect(66, 58, 19, 9, 'steel1');
  keys(p, 67, 59, 3, 3, 3, 2, 1, 1, 'cream4');
  p.rect(78, 59, 6, 5, 'green2').hline(78, 83, 59, 'green4').hline(78, 83, 64, 'green0');
  p.rect(78, 65, 6, 2, 'red2').hline(78, 83, 65, 'red3');
  return p;
}

// ------------------------------------------------------------------ scanner 26x36, beam local (13,11)
function scanner(reading) {
  const p = new Pix(26, 36);
  body(p, 3, 28, 20, 8, DARK, { round: 2 });
  p.rect(9, 24, 8, 5, 'steel2').vline(9, 24, 28, 'steel4').vline(16, 24, 28, 'steel0');
  // Handle with grip ridges and trigger
  p.poly([[10, 12], [17, 12], [18, 26], [11, 26]], 'steel3');
  p.volume('steel3', DARK);
  for (let y = 15; y < 25; y += 2) p.hline(12, 16, y, 'steel1');
  p.rect(8, 13, 2, 4, 'steel1').px(8, 13, 'steel4');
  // Head, tilted toward the counter, with the read window underneath
  p.poly([[1, 2], [22, 0], [24, 4], [24, 10], [3, 13], [1, 9]], 'steel4');
  p.volume('steel4', MID);
  p.line(2, 3, 21, 1, 'steel7');
  p.poly([[4, 10], [22, 8], [22, 10], [4, 12]], reading ? 'red3' : 'red0');
  if (reading) {
    p.line(4, 11, 22, 9, 'red4');
    p.glow(13, 12, 12, 3, ['red1', 'red2'], (x, y) => y > 11);
  } else p.line(4, 11, 22, 9, 'red1');
  p.px(19, 3, reading ? 'green4' : 'green2');
  for (let y = 26; y < 34; y += 2) p.px(21 + (y % 4 ? 1 : 0), y, 'steel1');
  return p;
}

// ------------------------------------------------------------------ terminal 28x34, contact local (14,5)
function terminal(approved) {
  const p = new Pix(28, 34);
  body(p, 1, 2, 26, 32, DARK, { round: 3 });
  p.rect(7, 0, 14, 3, 'steel0').hline(8, 19, 1, 'ink');
  p.rect(4, 5, 20, 10, 'steel0').rect(5, 6, 18, 8, approved ? 'phos3' : 'phos1');
  if (approved) {
    p.stamp(10, 7, `
.....o
....o.
o..o..
.oo...
..o...`, { o: 'phos0' });
    p.hline(5, 22, 6, 'phos4');
  } else {
    p.hline(6, 13, 8, 'phos3').hline(6, 10, 11, 'phos2');
  }
  const mark = approved ? 'phos0' : 'phos2';
  p.px(20, 8, mark).px(21, 9, mark).px(20, 10, mark);
  keys(p, 5, 17, 3, 4, 5, 2, 2, 1, 'steel5');
  p.rect(5, 29, 5, 2, 'red2').rect(12, 29, 5, 2, 'yellow1').rect(19, 29, 5, 2, 'green2');
  return p;
}

// ------------------------------------------------------------------ tray 36x12, drop local (18,5)
function tray() {
  const p = new Pix(36, 12);
  p.ellipse(18, 6, 17, 5, 'steel4');
  p.volume('steel4', MID);
  p.ellipse(18, 6, 13, 3, 'steel2').ellipse(18, 7, 12, 2, 'steel1');
  p.hline(8, 24, 4, 'steel3');
  for (const [cx, c] of [[12, 'yellow1'], [16, 'steel6'], [22, 'yellow1']]) p.ellipse(cx, 7, 1, 1, c).px(cx - 1, 6, 'white');
  return p;
}

// ------------------------------------------------------------------ radio 58x34, display local (32,15) 19x7
function radio(echo) {
  const p = new Pix(58, 34);
  p.line(48, 10, 56, 0, 'steel5').line(49, 10, 57, 0, 'steel3');
  p.px(53, 4, 'steel7').px(51, 7, 'steel7').ellipse(56, 1, 1, 1, 'steel7');
  p.rect(10, 3, 30, 2, 'steel3').hline(10, 39, 3, 'steel6');
  p.rect(8, 4, 3, 7, 'steel2').rect(39, 4, 3, 7, 'steel2');
  body(p, 0, 9, 56, 25, RED, { round: 3 });
  p.hline(3, 52, 12, 'steel6').hline(3, 52, 13, 'steel3');
  // Round speaker grille
  p.ellipse(15, 22, 10, 9, 'red0').ellipse(15, 22, 9, 8, 'steel1');
  for (let y = 14; y < 31; y++) for (let x = 6; x < 25; x++) {
    if (Math.hypot(x - 15, y - 22) < 8.5 && (x + y) % 2 === 0) p.px(x, y, 'steel0');
  }
  p.ellipse(15, 22, 2, 2, 'steel3').px(14, 21, 'steel6');
  // Frequency window (digits drawn at runtime) and dial scale
  p.rect(31, 14, 21, 9, 'ink').rect(32, 15, 19, 7, echo ? 'cyan0' : 'red0');
  p.glow(41, 18, 10, 4, [echo ? 'cyan1' : 'red1'], (x, y) => x >= 32 && x <= 50 && y >= 15 && y <= 21);
  p.rect(31, 24, 21, 3, 'cream4');
  for (let x = 32; x < 51; x += 2) p.px(x, 24, x % 6 === 2 ? 'ink' : 'cream1');
  p.vline(echo ? 42 : 40, 24, 26, echo ? 'cyan2' : 'red3');
  for (const [kx, r] of [[36, 3], [47, 2]]) {
    p.ellipse(kx, 30, r, r, 'steel4');
    p.volume('steel4', MID, { outline: false });
    p.px(kx - 1, 29, 'white');
  }
  p.rect(26, 29, 4, 2, 'steel1').px(27, 29, 'steel6');
  p.rect(3, 33, 5, 1, 'ink').rect(48, 33, 5, 1, 'ink');
  return p;
}

// ------------------------------------------------------------------ bags
function bagStack() {
  const p = new Pix(40, 12);
  for (let i = 3; i >= 0; i--) {
    const y = i * 2, x = i;
    p.rect(x, y, 36, 4, 'paper3').frame(x, y, 36, 4, 'paper1').hline(x + 1, x + 34, y + 1, 'white');
    p.rect(x + 6, y, 5, 2, 'paper1').rect(x + 25, y, 5, 2, 'paper1');
    if (i === 0) p.rect(x + 14, y + 1, 8, 2, 'blue2').px(x + 15, y + 1, 'blue3');
  }
  p.hline(0, 39, 11, 'top2');
  return p;
}

function bagOpen() {
  const p = new Pix(27, 27);
  for (const hx of [4, 15]) p.ellipse(hx + 4, 5, 4, 4, 'paper1').ellipse(hx + 4, 5, 2, 3, 0).rect(hx, 5, 9, 4, 0);
  p.poly([[1, 9], [26, 9], [25, 26], [2, 26]], 'paper2');
  p.volume('paper2', PAPER);
  p.rect(3, 9, 21, 3, 'steel5').hline(3, 23, 9, 'steel3');
  p.line(8, 13, 7, 24, 'paper3').line(18, 14, 19, 24, 'paper1').line(12, 16, 12, 22, 'white');
  p.rect(10, 17, 7, 3, 'blue2').px(11, 17, 'blue3');
  return p;
}

function bagFull() {
  const p = new Pix(30, 30);
  for (const hx of [6, 17]) p.ellipse(hx + 3, 4, 3, 4, 'paper1').ellipse(hx + 3, 4, 1, 3, 0);
  p.rect(7, 6, 4, 6, 'red2').hline(7, 10, 6, 'red4').rect(8, 4, 2, 2, 'red3');
  p.rect(14, 7, 10, 5, 'orange2').hline(14, 23, 7, 'paper3');
  p.poly([[1, 11], [28, 11], [29, 26], [27, 29], [2, 29], [0, 26]], 'paper2');
  p.volume('paper2', PAPER);
  p.line(9, 14, 8, 26, 'paper3').line(20, 15, 21, 27, 'paper1');
  p.rect(11, 19, 8, 3, 'blue2').px(12, 19, 'blue3');
  return p;
}

// ------------------------------------------------------------------ printer 40x36, slot local (8,2); receipt 12x15
function printer() {
  const p = new Pix(40, 36);
  body(p, 0, 12, 40, 24, DARK, { round: 2 });
  p.poly([[3, 4], [36, 4], [38, 8], [38, 13], [1, 13], [1, 8]], 'steel3');
  p.volume('steel3', DARK);
  p.hline(5, 34, 5, 'steel5');
  p.rect(6, 1, 28, 3, 'ink').hline(7, 32, 2, 'paper2');
  for (let x = 6; x < 34; x += 2) p.px(x, 0, 'steel6').px(x + 1, 0, 'steel4');
  p.rect(5, 19, 18, 8, 'steel1').hline(5, 22, 19, 'steel3').rect(7, 21, 14, 1, 'steel0');
  p.px(31, 19, 'phos4').px(31, 22, 'steel4').px(33, 19, 'red1');
  p.rect(28, 26, 8, 4, 'steel3').hline(28, 35, 26, 'steel5');
  p.rect(5, 31, 12, 1, 'cream2');
  return p;
}

function receipt() {
  const p = new Pix(12, 15);
  p.rect(0, 0, 12, 15, 'paper3').vline(11, 0, 14, 'paper1').vline(0, 0, 14, 'white');
  for (const [y, w] of [[2, 8], [4, 6], [6, 9], [8, 5], [10, 8]]) p.hline(2, 1 + w, y, 'steel4');
  for (let x = 0; x < 12; x += 2) p.px(x, 14, 0);
  return p;
}

function caddy() {
  const p = new Pix(14, 28);
  p.line(3, 0, 5, 13, 'wood4').line(4, 0, 6, 13, 'wood3');
  p.line(7, 2, 7, 13, 'paper3').ellipse(7, 2, 1, 1, 'paper3');
  p.line(10, 1, 9, 13, 'red2').line(12, 3, 10, 13, 'blue2');
  p.poly([[1, 12], [12, 12], [11, 27], [2, 27]], 'steel4');
  p.volume('steel4', MID);
  p.hline(2, 11, 13, 'steel6');
  return p;
}

module.exports = () => ({
  microwave: microwave(false),
  'microwave-heating': microwave(true),
  pos: pos(),
  scanner: scanner(false),
  'scanner-reading': scanner(true),
  terminal: terminal(false),
  'terminal-approved': terminal(true),
  tray: tray(),
  radio: radio(false),
  'radio-echo': radio(true),
  bags: bagStack(),
  'bag-open': bagOpen(),
  'bag-full': bagFull(),
  printer: printer(),
  receipt: receipt(),
  caddy: caddy(),
});
