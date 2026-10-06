// Customer looks: paper-doll parts plus colour ramps for the remappable
// palette slots. Skin and hair ramps are hand-picked; clothing ramps are
// generated with the shared hue-shift rules. Regulars fill ordinary orders;
// Nell and the Nell who stayed are reserved for orders five and eight.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const { ramp } = node ? require('./colors.js') : root.NSF.colors;

  // [outline, shadow, mid, light, highlight]
  const skin = {
    pale: ['#6e4a40', '#b98a78', '#e0b49a', '#f2cfb8', '#fbe6d6'],
    light: ['#5e3a30', '#a9735c', '#d39c7c', '#e8bb9a', '#f6d8be'],
    medium: ['#4a2c22', '#8a5a42', '#b47a5a', '#cf9a76', '#e4bb98'],
    tan: ['#3a2218', '#6e4632', '#93603f', '#b07c58', '#c99b76'],
    deep: ['#22140f', '#4a2e22', '#6a4230', '#86563f', '#a27052'],
  };
  // [outline, shadow, mid, light]
  const hair = {
    black: ['#060505', '#141110', '#26201d', '#4a3f39'],
    brown: ['#1a100b', '#3a2519', '#5e3e2a', '#8c6446'],
    grey: ['#3a3a38', '#6d6d69', '#9d9d97', '#cfcfc8'],
    auburn: ['#2a0e0b', '#56211a', '#86372a', '#b45a44'],
    bleached: ['#5a4a2e', '#9c8452', '#c9b07a', '#ead7a6'],
  };
  const cloth = {
    navy: '#2c3e63', olive: '#4a5638', charcoal: '#3a3f42', burgundy: '#6a2633', trench: '#9c8456',
    grey: '#5c6268', green: '#2c5e52', rainYellow: '#d6a429', rainTeal: '#2a7470',
  };
  const under = { white: '#b9b9b0', black: '#2e2e2e' };

  const customers = Object.freeze({
    kit: { body: 'hoodie', head: 'oval', hair: 'messy', extras: ['earphones'], skin: skin.medium, hair_: hair.black, cloth: cloth.grey, under: under.white, accent: '#c9a24a' },
    hal: { body: 'vest', head: 'square', hair: 'buzz', extras: ['beard'], skin: skin.tan, hair_: hair.grey, cloth: cloth.navy, under: under.white, accent: '#e8792e' },
    dana: { body: 'jacket', head: 'oval', hair: 'bob', extras: ['glasses'], skin: skin.light, hair_: hair.black, cloth: cloth.charcoal, under: under.white, accent: '#c9a24a' },
    tess: { body: 'hoodie', head: 'round', hair: 'bun', extras: ['mask'], skin: skin.pale, hair_: hair.brown, cloth: cloth.green, under: under.white, accent: '#c9a24a' },
    walt: { body: 'coat', head: 'square', hair: 'short', extras: ['scarf', 'glasses'], skin: skin.medium, hair_: hair.grey, cloth: cloth.trench, under: under.white, accent: '#7c3340' },
    ana: { body: 'coat', head: 'oval', hair: 'bob', extras: [], skin: skin.deep, hair_: hair.auburn, cloth: cloth.navy, under: under.white, accent: '#b3c2bf' },
    dex: { body: 'jacket', head: 'round', hair: 'cap', extras: [], skin: skin.tan, hair_: hair.black, cloth: cloth.olive, under: under.black, accent: '#cf4436' },
    bonnie: { body: 'vest', head: 'round', hair: 'beanie', extras: [], skin: skin.light, hair_: hair.brown, cloth: cloth.charcoal, under: under.black, accent: '#e8b22e' },
    sam: { body: 'jacket', head: 'oval', hair: 'short', extras: ['earphones'], skin: skin.pale, hair_: hair.bleached, cloth: cloth.burgundy, under: under.black, accent: '#c9a24a' },
    edie: { body: 'coat', head: 'round', hair: 'bun', extras: ['scarf'], skin: skin.light, hair_: hair.grey, cloth: cloth.burgundy, under: under.white, accent: '#8c7650' },
    nell: { body: 'coat', head: 'oval', hair: 'long', extras: ['wet'], skin: skin.light, hair_: hair.black, cloth: cloth.rainYellow, under: under.white, accent: '#2b2f31', phone: true },
    nellStayed: { body: 'coat', head: 'oval', hair: 'long', mirrorHair: true, extras: ['wet'], skin: skin.light, hair_: hair.black, cloth: cloth.rainTeal, under: under.white, accent: '#2b2f31' },
  });
  const regulars = Object.freeze(['kit', 'hal', 'dana', 'tess', 'walt', 'ana', 'dex', 'bonnie', 'sam', 'edie']);

  const named = (prefix, values) => Object.fromEntries(values.map((v, i) => [prefix + i, v]));
  // Palette slot overrides for a customer.
  function slotColors(id) {
    const c = customers[id];
    return { ...named('skin', c.skin), ...named('hair', c.hair_), ...named('cloth', ramp(c.cloth, 5, { at: 2 })),
      ...named('under', ramp(c.under, 4, { at: 2 })), ...named('accent', ramp(c.accent, 3, { at: 1 })) };
  }
  // Slot overrides for a prop (card) of a single colour.
  function propColors(hex) { return named('accent', ramp(hex, 3, { at: 1 })); }

  // Back-to-front layers drawn behind the counter for a pose.
  function layers(id, pose) {
    const c = customers[id];
    const hairBack = { long: 'customer-hair-back-long', bob: 'customer-hair-back-bob' }[c.hair];
    const lower = c.extras.filter(e => ['scarf', 'beard', 'mask'].includes(e));
    const upper = c.extras.filter(e => ['glasses', 'earphones', 'wet'].includes(e));
    const list = [];
    if (hairBack) list.push({ sprite: hairBack, flip: Boolean(c.mirrorHair) });
    list.push({ sprite: 'customer-body-' + c.body });
    if (pose === 'idle' && !c.phone) list.push({ sprite: 'customer-arm-idle' });
    list.push({ sprite: 'customer-head-' + c.head });
    for (const e of lower) list.push({ sprite: 'customer-' + e });
    list.push({ sprite: 'customer-hair-' + c.hair, flip: Boolean(c.mirrorHair) });
    for (const e of upper) list.push({ sprite: 'customer-' + e });
    if (pose === 'idle' && c.phone) list.push({ sprite: 'customer-arm-phone' });
    return list;
  }

  // Arm drawn in front of the counter while handing things over.
  function frontArm(pose) {
    return { reach: 'customer-arm-reach', low: 'customer-arm-low' }[pose] || null;
  }

  // Mirrored parts reflect around the head centre (between columns 53 and 54).
  const FLIP_AXIS = 53.5;
  const api = { customers, regulars, slotColors, propColors, layers, frontArm, FLIP_AXIS };
  if (node) module.exports = api;
  else (root.NSF = root.NSF || {}).customers = api;
})(globalThis);
