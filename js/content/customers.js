// Customer looks: who wears what at the counter (`person`, drawn by
// art/src/people.cjs), plus colour ramps for the remappable palette slots. Skin and hair ramps are hand-picked; clothing ramps are
// generated with the shared hue-shift rules. Regulars fill ordinary orders;
// Nell and the Nell who stayed are reserved for orders five and eight.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const { ramp } = node ? require('./colors.js') : root.NSF.colors;
  const poses = node ? require('./poses.js') : root.NSF.poses;

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
    navy: '#2c3e63', charcoal: '#3a3f42', burgundy: '#6a2633', camel: '#9c8456',
    grey: '#5c6268', green: '#2c5e52', ceil: '#6f8fb0', denim: '#46628a', cream: '#c8bc9a',
    rainYellow: '#d6a429', rainTeal: '#2a7470', hiVis: '#e8681e',
  };
  const under = { white: '#b9b9b0', black: '#2e2e2e', flannel: '#7a3328', navy: '#2c3e63', lavender: '#9a8fb0' };

  // `person`: height in metres places the figure, build sets its width, `arms` and
  // `hands` are its own length and width factors, `legs` names the trousers, body is
  // the outfit, head/hair/extras the face and hair parts; poses are names from
  // js/content/poses.js, the first being how the customer waits at the counter.
  const customers = Object.freeze({
    kit: { skin: skin.medium, hair_: hair.black, cloth: cloth.grey, under: under.white, accent: '#c9a24a',
      person: { height: 1.77, build: 'slim', arms: [1.04, 0.9], hands: [1.06, 0.92], legs: 'black', head: 'oval', hair: 'messy', body: 'hoodie', extras: ['earphones'], poses: ['phone-one']} },
    hal: { skin: skin.tan, hair_: hair.grey, cloth: cloth.hiVis, under: under.flannel, accent: '#e8792e',
      person: { height: 1.74, build: 'heavy', arms: [0.98, 1.1], hands: [1, 1.15], legs: 'khaki', head: 'square', hair: 'buzz', body: 'hivis', extras: ['beard'], poses: ['both-rest']} },
    dana: { skin: skin.light, hair_: hair.black, cloth: cloth.charcoal, under: under.white, accent: '#c9a24a',
      person: { height: 1.61, build: 'slim', arms: [1, 0.9], hands: [0.96, 0.9], legs: 'black', head: 'oval', hair: 'bob', body: 'blazer', extras: ['glasses-bold'], poses: ['stand']} },
    tess: { skin: skin.pale, hair_: hair.brown, cloth: cloth.navy, under: under.white, accent: '#b3c2bf',
      person: { height: 1.58, build: 'average', arms: [0.97, 1], hands: [0.95, 0.95], legs: 'black', head: 'round', hair: 'bun', body: 'peacoat', extras: [], poses: ['one-rest']} },
    walt: { skin: skin.medium, hair_: hair.grey, cloth: cloth.camel, under: under.white, accent: '#7c3340',
      person: { height: 1.71, build: 'average', arms: [1, 0.94], hands: [1.02, 1], legs: 'brown', head: 'square', hair: 'short', body: 'trench', extras: ['wrinkles', 'glasses'], poses: ['both-rest']} },
    ana: { skin: skin.deep, hair_: hair.auburn, cloth: cloth.ceil, under: under.navy, accent: '#c9a24a',
      person: { height: 1.66, build: 'average', arms: [1.02, 1], hands: [1, 0.96], legs: 'cloth', head: 'oval', hair: 'curly', body: 'scrubs', extras: [], poses: ['one-rest']} },
    dex: { skin: skin.tan, hair_: hair.black, cloth: cloth.green, under: under.black, accent: '#a8322a',
      person: { height: 1.81, build: 'broad', arms: [1.03, 1.08], hands: [1.08, 1.1], legs: 'khaki', head: 'round', hair: 'cap', body: 'windbreaker', extras: [], poses: ['phone-call']} },
    bonnie: { skin: skin.light, hair_: hair.brown, cloth: cloth.cream, under: under.black, accent: '#e8b22e',
      person: { height: 1.64, build: 'broad', arms: [0.98, 1.06], hands: [0.98, 1.08], legs: 'navy', head: 'round', hair: 'beanie', body: 'sweater', extras: [], poses: ['one-rest']} },
    sam: { skin: skin.pale, hair_: hair.bleached, cloth: cloth.denim, under: under.black, accent: '#c9a24a',
      person: { height: 1.86, build: 'slim', arms: [1.05, 0.88], hands: [1.1, 0.9], legs: 'black', head: 'narrow', hair: 'swept', body: 'denim', extras: ['earphones'], poses: ['phone-check']} },
    edie: { skin: skin.light, hair_: hair.grey, cloth: cloth.burgundy, under: under.lavender, accent: '#8c7650',
      person: { height: 1.55, build: 'heavy', arms: [0.96, 1.04], hands: [0.92, 1], legs: 'grey', head: 'round', hair: 'perm', body: 'shawl', extras: ['wrinkles'], poses: ['both-rest']} },
    nell: { skin: skin.light, hair_: hair.black, cloth: cloth.rainYellow, under: under.white, accent: '#2b2f31',
      person: { height: 1.68, build: 'average', arms: [1, 1], hands: [1, 1], legs: 'navy', head: 'oval', hair: 'long', body: 'raincoat', extras: ['wet'], poses: ['phone-call'] } },
    nellStayed: { skin: skin.light, hair_: hair.black, cloth: cloth.rainTeal, under: under.white, accent: '#2b2f31',
      person: { height: 1.68, build: 'average', arms: [1, 1], hands: [1, 1], legs: 'navy', head: 'oval', hair: 'long', mirrorHair: true, body: 'raincoat', extras: ['wet'], poses: ['one-rest'] } },
  });
  const regulars = Object.freeze(['kit', 'hal', 'dana', 'tess', 'walt', 'ana', 'dex', 'bonnie', 'sam', 'edie']);

  const named = (prefix, values) => Object.fromEntries(values.map((v, i) => [prefix + i, v]));
  // Palette slot overrides for a customer.
  function slotColors(id) {
    const c = customers[id];
    return { ...named('skin', c.skin), ...named('hair', c.hair_), ...named('cloth', ramp(c.cloth, 5, { at: 2 })),
      ...named('under', ramp(c.under, 4, { at: 2 })), ...named('accent', ramp(c.accent, 3, { at: 1 })) };
  }
  // Arms are authored per figure: build plus height in centimetres.
  const personFrame = person => `${person.build}-${Math.round(person.height * 100)}`;

  // The sprites that draw a customer in a pose, back to front, in three passes:
  // `behind` before the counter, `counter` after it, `over` after the machines on it.
  // A part with `follows` moves with the figure's height and lean (the head, hair and
  // face); `flip` mirrors hair parts for the Nell who stayed.
  function parts(id, pose) {
    const person = customers[id].person;
    const key = `${person.body}-${personFrame(person)}-${pose}`;
    const flip = Boolean(person.mirrorHair);
    const back = { long: 'person-hair-back-long', bob: 'person-hair-back-bob' }[person.hair];
    const face = group => person.extras.filter(e => group.includes(e)).map(e => ({ sprite: 'person-' + e, follows: true }));
    return {
      behind: [
        ...(back ? [{ sprite: back, follows: true, flip }] : []),
        { sprite: 'person-back-' + key },
        { sprite: `person-head-${person.head}-${poses.poses[pose].gaze}`, follows: true },
        ...face(['wrinkles', 'beard']),
        { sprite: 'person-hair-' + person.hair, follows: true, flip },
        ...face(['glasses', 'glasses-bold', 'earphones', 'wet']),
        { sprite: 'person-front-' + key },
      ],
      counter: [{ sprite: 'person-counter-' + key }],
      over: [{ sprite: 'person-over-' + key }],
    };
  }
  // The pose for something the game asks of the customer, or how they wait.
  const poseFor = (id, action) => poses.actions[action] || customers[id].person.poses[0];
  // Every pose a customer is drawn in.
  const posesOf = id => [...new Set([...customers[id].person.poses, ...Object.values(poses.actions)])];

  const api = { customers, regulars, slotColors, personFrame, parts, poseFor, posesOf };
  if (node) module.exports = api;
  else (root.NSF = root.NSF || {}).customers = api;
})(globalThis);
