// Products and hand-held props at 480x270 world scale. Products stand on
// their bottom edge in the lane; light comes from the upper left.
'use strict';
const { Pix } = require('../tools/pixel.cjs');

// Column profile for a lit cylinder: index into [dark, mid, light, high].
function cylinderColumns(w) {
  return Array.from({ length: w }, (_, i) => {
    const t = (i + 0.5) / w;
    if (t < 0.12) return 1;
    if (t < 0.28) return 3;
    if (t < 0.42) return 2;
    if (t < 0.72) return 1;
    return 0;
  });
}
// Fill rows y0..y1 of a cylinder of width w at x with a 4-tone ramp.
function cylinder(p, x, y0, y1, w, ramp) {
  cylinderColumns(w).forEach((tone, i) => p.vline(x + i, y0, y1, ramp[tone]));
}

function bottle(liquid, label, cap, options = {}) {
  const p = new Pix(10, 27);
  cylinder(p, 3, 0, 2, 4, cap);
  p.hline(3, 6, 3, 'steel3');
  p.rect(3, 4, 4, 2, liquid[1]).rect(2, 6, 6, 2, liquid[1]);
  cylinder(p, 3, 4, 5, 4, liquid);
  cylinder(p, 2, 6, 7, 6, liquid);
  cylinder(p, 1, 8, 25, 8, liquid);
  cylinder(p, 1, 11, 17, 8, label);
  if (options.mark) options.mark(p);
  p.hline(1, 8, 11, label[3]).hline(1, 8, 17, label[0]);
  p.hline(2, 7, 25, liquid[0]).hline(2, 7, 26, liquid[0]);
  for (let y = 19; y < 25; y += 2) p.px(2, y, liquid[3]);
  p.outlineBy({}, options.outline || 'ink');
  return p;
}

const products = {
  coffee: () => {
    const p = new Pix(10, 20);
    cylinder(p, 1, 1, 18, 8, ['wood1', 'wood2', 'wood3', 'wood4']);
    cylinder(p, 1, 0, 1, 8, ['steel3', 'steel5', 'steel6', 'steel7']);
    cylinder(p, 1, 18, 18, 8, ['steel3', 'steel5', 'steel6', 'steel7']);
    cylinder(p, 1, 6, 12, 8, ['paper1', 'paper2', 'paper3', 'white']);
    p.rect(3, 7, 3, 4, 'ink').px(4, 8, 'paper3').px(4, 9, 'yellow1');
    p.hline(2, 7, 14, 'yellow1');
    p.outlineBy({}, 'ink');
    return p;
  },
  onigiri: () => {
    const p = new Pix(20, 16);
    p.poly([[10, 0], [19, 14], [1, 14]], 'paper2');
    p.volume('paper2', ['ink', 'paper1', 'paper2', 'paper3', 'white']);
    p.rect(7, 8, 7, 7, 'ink').rect(8, 9, 5, 5, 'steel1').hline(8, 12, 9, 'steel3');
    p.px(10, 4, 'red2').px(11, 4, 'red3');
    p.line(6, 6, 9, 2, 'white');
    p.rect(2, 14, 17, 1, 'red2');
    return p;
  },
  bento: () => {
    const p = new Pix(30, 14);
    p.rect(1, 9, 28, 4, 'steel1').hline(1, 28, 9, 'steel3').hline(1, 28, 12, 'ink');
    p.rect(1, 2, 28, 8, 'paper3');
    p.rect(2, 3, 12, 6, 'paper2').dither(2, 3, 12, 6, 'white', 'sparse');
    p.rect(15, 3, 8, 6, 'orange1');
    for (const [x, y] of [[15, 3], [18, 5], [16, 7], [20, 3], [21, 6]]) p.ellipse(x + 1, y + 1, 1, 1, 'orange2').px(x, y, 'orange3');
    p.rect(23, 3, 5, 6, 'green1').px(24, 4, 'green3').px(26, 6, 'green2').px(25, 3, 'red2');
    p.px(6, 5, 'red2').px(7, 5, 'red3');
    p.rect(0, 1, 30, 2, 'steel6').hline(1, 28, 1, 'white').px(3, 2, 'white').px(4, 2, 'white');
    for (let i = 0; i < 5; i++) p.px(4 + i * 2, 3 + i, 'white');
    p.rect(20, 9, 8, 3, 'red2').hline(21, 26, 10, 'paper3');
    p.outlineBy({}, 'ink');
    return p;
  },
  tea: () => bottle(['green0', 'green1', 'green2', 'green3'], ['paper1', 'paper2', 'paper3', 'white'], ['green1', 'green2', 'green3', 'green4'], {
    mark: p => { p.rect(3, 12, 4, 4, 'green2').px(4, 13, 'green4'); },
    outline: 'green0',
  }),
  water: () => bottle(['steel4', 'steel5', 'steel6', 'steel7'], ['blue1', 'blue2', 'blue3', 'blue4'], ['blue1', 'blue2', 'blue3', 'blue4'], {
    mark: p => { p.hline(3, 6, 13, 'white').hline(3, 5, 15, 'blue4'); },
    outline: 'steel2',
  }),
  cola: () => bottle(['wood0', 'wood1', 'wood2', 'wood3'], ['red1', 'red2', 'red3', 'red4'], ['red1', 'red2', 'red3', 'red4'], {
    mark: p => { p.line(2, 15, 7, 12, 'white').line(3, 15, 7, 13, 'paper2'); },
  }),
  sandwich: () => {
    const p = new Pix(22, 16);
    p.poly([[1, 0], [21, 15], [1, 15]], 'steel6');
    p.poly([[2, 2], [18, 14], [2, 14]], 'cream4');
    p.poly([[3, 5], [14, 13], [3, 13]], 'yellow1');
    p.line(3, 4, 15, 13, 'cream5').line(3, 6, 12, 13, 'yellow2');
    for (let i = 0; i < 4; i++) p.px(4 + i * 2, 8 + i, 'green2');
    p.vline(2, 2, 14, 'cream3');
    p.line(1, 0, 21, 15, 'white');
    p.rect(1, 13, 9, 2, 'red2').hline(2, 6, 14, 'paper3');
    p.outlineBy({}, 'steel3');
    return p;
  },
  juice: () => {
    const p = new Pix(13, 21);
    p.poly([[2, 4], [6, 0], [10, 4]], 'paper3');
    p.rect(5, 0, 3, 1, 'paper2');
    p.rect(1, 4, 11, 16, 'orange2');
    for (let x = 1; x < 12; x++) p.vline(x, 4, 19, x < 3 ? 'orange3' : x > 8 ? 'orange1' : 'orange2');
    p.ellipse(5, 11, 3, 3, 'yellow2').ellipse(5, 11, 2, 2, 'orange3').px(4, 10, 'white');
    p.rect(1, 15, 11, 3, 'paper3').hline(2, 7, 16, 'green2');
    p.hline(1, 11, 4, 'paper2').vline(11, 4, 19, 'orange0');
    p.outlineBy({}, 'ink');
    return p;
  },
  bread: () => {
    const p = new Pix(24, 13);
    p.rect(2, 2, 20, 10, 'paper3').rect(1, 3, 22, 8, 'paper3');
    p.ellipse(11, 6, 9, 4, 'cream4');
    p.volume('cream4', ['ink', 'cream2', 'cream4', 'cream5', 'white'], { outline: false });
    p.rect(4, 4, 6, 3, 'blue2').hline(4, 9, 4, 'blue3').px(5, 5, 'white');
    p.px(16, 5, 'red2').px(17, 5, 'red2');
    p.rect(21, 4, 3, 6, 'paper2').px(23, 5, 'yellow1').px(23, 8, 'yellow1');
    p.hline(2, 21, 11, 'paper1');
    p.outlineBy({}, 'paper0');
    return p;
  },
  'spare-key': () => {
    const p = new Pix(18, 9);
    p.ellipse(4, 4, 4, 4, 'yellow1').ellipse(4, 4, 2, 2, 0);
    p.rect(8, 3, 9, 3, 'yellow1').hline(8, 16, 3, 'yellow3').hline(8, 16, 5, 'yellow0');
    p.rect(11, 6, 2, 2, 'yellow0').rect(14, 6, 2, 2, 'yellow0').px(17, 4, 'yellow0');
    p.px(2, 1, 'yellow3').px(1, 3, 'yellow3');
    p.outlineBy({}, 'orange0');
    return p;
  },
};

const props = {
  bill: () => {
    const p = new Pix(15, 7);
    p.rect(0, 0, 15, 7, 'green2').frame(0, 0, 15, 7, 'green0').hline(1, 13, 1, 'green3');
    p.ellipse(7, 3, 2, 2, 'paper3').px(7, 3, 'green1');
    p.rect(2, 2, 2, 3, 'green1').rect(11, 2, 2, 3, 'green1');
    return p;
  },
  card: () => {
    const p = new Pix(10, 7);
    p.rect(0, 0, 10, 7, 'accent1').frame(0, 0, 10, 7, 'ink');
    p.hline(1, 8, 1, 'accent2').rect(1, 2, 8, 1, 'ink');
    p.rect(2, 4, 2, 2, 'yellow2').hline(5, 8, 5, 'accent2');
    return p;
  },
  phone: () => {
    const p = new Pix(7, 12);
    p.rect(0, 0, 7, 12, 'steel1').frame(0, 0, 7, 12, 'ink');
    p.rect(1, 1, 5, 8, 'cyan1').hline(1, 5, 1, 'cyan3').px(2, 3, 'cyan3').px(4, 5, 'cyan2');
    p.rect(2, 10, 3, 1, 'steel4');
    return p;
  },
};

module.exports = () => Object.fromEntries([...Object.entries(products), ...Object.entries(props)].map(([name, make]) => [name, make()]));
