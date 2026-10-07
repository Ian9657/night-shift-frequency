// Draws the first-person store (480x270 world pixels, 2x on the 960x540 canvas)
// back to front: the back wall and view, the side shelving, the customer behind the
// counter, the counter, the customer's hands on it, the machines, the goods, hands
// held out over the machines, things in motion, and the clerk's own things nearest.
(function (root) {
  'use strict';
  const { sprites, layout, customers, space, time, radio, night, outside, drift, messages, found } = root.NSF;
  const CUE = '#f5d873', SELECTED = '#f1f5e6', HEAT = '#eda04c', HOVER = '#9fd6e6';
  // 3x5 digits for the microwave's clock display.
  const LED = {
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
    3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
    6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '###'], ':': ['.', '#', '.', '#', '.'],
  };
  const AXIS = space.customer.centre - 0.5;
  // Lost-and-found items as 8x8 pictures (story.tonight.found names them): peeking over the
  // box's rim here, close up in ui.js.
  const ICON_COLORS = { Y: '#efcf5a', y: '#b8902f', d: '#6b4b16', W: '#f3f6ea', g: '#8f8a7a', B: '#3e64b4', P: '#ebe7d6', R: '#c8403a' };
  const BOOT = ['..YYYY..', '..YYYY..', '..YYYY..', '..YYYy..', '.YYYYy..', 'YYYYYy..', 'YYYYYYy.', 'dddddd..'];
  const ICONS = {
    boot: BOOT,
    bootRight: BOOT.map(row => [...row].reverse().join('')),
    receipt: ['.WWWWW..', '.WgggW..', '.WWWWW..', '.WgggW..', '.WWWWW..', '.WggWW..', '.WWWWW..', '.W.W.W..'],
    band: ['..WWWW..', '.W....W.', 'W......W', 'W..BBB.W', 'W..BBB.W', '.W....W.', '..WWWW..', '........'],
    ticket: ['........', 'PPPPPPPP', 'PRRRRRRP', 'PPPP.PPP', 'PgggPPPP', 'PPPPPPPP', '........', '........'],
  };
  // An item's picture at (x, y), `scale` pixels per dot, its first `rows` rows.
  function icon(ctx, name, x, y, scale = 1, rows = 8) {
    ICONS[name].slice(0, rows).forEach((row, j) => [...row].forEach((c, i) => {
      if (c === '.') return;
      ctx.fillStyle = ICON_COLORS[c];
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }));
  }                       // the customer canvas's mirror axis

  function sprite(ctx, name, x, y, options = {}) {
    const image = sprites.get(name, options);
    const pad = options.outline ? 1 : 0;
    ctx.drawImage(image, Math.round(x) - pad, Math.round(y) - pad);
  }
  // A sprite at its own 'at' anchor (fixtures and full-screen layers).
  function placed(ctx, name, options) {
    const [x, y] = sprites.anchor(name, 'at') || [0, 0];
    sprite(ctx, name, x, y, options);
  }

  // The glass of the storefront minus the door's mullion and its two handles, which
  // stand in front of everything outside.
  function glass() {
    const [gx, gy] = sprites.anchor('store-back', 'window'), [gw, gh] = sprites.anchor('store-back', 'windowSize');
    const [mx] = sprites.anchor('store-back', 'mullion');
    return { gx, gy, gw, gh, door: [mx - 5, mx + 11], horizon: space.camera.vy };
  }
  function clipGlass(ctx, g) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.gx, g.gy, g.door[0] - g.gx, g.gh);
    ctx.rect(g.door[1] + 1, g.gy, g.gx + g.gw - g.door[1] - 1, g.gh);
    ctx.clip();
  }

  function rain(ctx, g) {
    ctx.fillStyle = 'rgba(109,143,179,0.45)';
    const count = Math.round(80 * outside.rain());
    for (let i = 0; i < count; i++) {
      const x = g.gx + (i * 37 + Math.floor(i / 7) * 11) % g.gw;
      const y = g.gy + Math.floor((i * 53 + time.now * (0.09 + (i % 3) * 0.02)) % g.gh);
      ctx.fillRect(x, y, 1, Math.min(3, g.gy + g.gh - y));
    }
    // Drops on the glass itself: each hangs, then slides a little way and hangs again,
    // leaving a faint wet trail.
    for (let i = 0; i < Math.round(18 * outside.rain()); i++) {
      const x = g.gx + 2 + Math.floor(outside.hash(i + 101) * (g.gw - 4));
      const period = 5200 + outside.hash(i + 202) * 6000, phase = (time.now + outside.hash(i + 303) * period) % period;
      const run = Math.floor(outside.hash(i + 404) * g.gh), slid = Math.min(1, phase / period * 3) * 22;
      const y = g.gy + Math.floor((run + Math.floor(time.now / period) * 22 + slid) % g.gh);
      ctx.fillStyle = 'rgba(173,188,189,0.14)';
      ctx.fillRect(x, Math.max(g.gy, y - 4), 1, Math.min(4, y - g.gy));
      ctx.fillStyle = 'rgba(212,221,216,0.55)';
      ctx.fillRect(x, y, 1, 2);
    }
  }

  // A car along the wet street, headlights first, its lights smeared on the road.
  function car(ctx, g) {
    const c = outside.car();
    if (!c) return;
    const L = 32, span = g.gw + 80, base = g.horizon + (c.near ? 47 : 39);
    const x = Math.round(c.leftward ? g.gx + g.gw + 40 - c.f * span : g.gx - 40 - L + c.f * span);
    const dir = c.leftward ? -1 : 1, front = c.leftward ? x : x + L - 1, back = c.leftward ? x + L - 1 : x;
    ctx.fillStyle = 'rgba(251,231,166,0.45)';                                     // the beams ahead
    for (let i = 1; i < 30; i++) for (let j = -Math.floor(i / 6); j <= Math.floor(i / 8); j++) {
      if ((i + j) % 2 && outside.hash(i * 31 + j) > i / 40) ctx.fillRect(front + dir * i, base - 4 + j, 1, 1);
    }
    ctx.fillStyle = 'rgba(224,179,99,0.35)';                                      // reflections on the road
    for (let k = 1; k < 11; k += 2) ctx.fillRect(front - dir * 3 - 1, base + k, 3, 1);
    ctx.fillStyle = 'rgba(200,64,58,0.35)';
    for (let k = 1; k < 8; k += 2) ctx.fillRect(back - 1, base + k, 2, 1);
    const cab = c.leftward ? x + 8 : x + 10;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(x, base - 7, L, 7);                                              // body
    ctx.fillRect(cab, base - 12, 14, 5);                                          // cabin
    ctx.fillStyle = '#203759';
    ctx.fillRect(cab + 1, base - 11, 5, 3); ctx.fillRect(cab + 8, base - 11, 5, 3); // windows catching the lamp
    ctx.fillStyle = '#2d4b73';
    ctx.fillRect(x + 1, base - 7, L - 2, 1);                                      // the roofline's sheen
    ctx.fillStyle = '#0e1214';
    for (const wx of [5, L - 10]) ctx.fillRect(x + wx, base - 1, 5, 2);            // wheels
    ctx.fillStyle = '#fbe7a6';
    ctx.fillRect(front - (dir < 0 ? 0 : 1), base - 5, 2, 2);
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(back - (dir < 0 ? 1 : 0), base - 5, 2, 2);
  }

  // The town's lit windows on the far shore, and the one that stays on, with its
  // reflection broken up on the water.
  function shore(ctx, g) {
    for (const light of outside.town()) {
      ctx.fillStyle = light.bright ? '#fbe7a6' : '#e0b363';
      ctx.fillRect(g.gx + Math.floor(light.u * g.gw), g.horizon - 4 + light.dy, 1, 1);
    }
    if (!outside.otherWindow()) return;
    const x = g.gx + Math.round(g.gw * 0.36), y = g.horizon - 6;
    ctx.fillStyle = '#fbe7a6';
    ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = 'rgba(224,179,99,0.35)';
    for (let k = 8; k < 24; k += 2) ctx.fillRect(x - (k % 4 ? 0 : 1), y + k, k % 4 ? 2 : 3, 1);
  }

  // The ferry, lit, out on the bay, and its lights broken up in the water.
  function ferry(ctx, g) {
    const f = outside.ferry();
    if (f === null) return;
    const x = Math.round(g.gx - 34 + f * (g.gw + 68)), y = g.horizon + 11;
    ctx.fillStyle = 'rgba(224,179,99,0.4)';
    for (let k = 3; k < 15; k += 2) ctx.fillRect(x + 6 + (k * 3) % 7, y + k, 10 - Math.floor(k / 2), 1);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(x, y - 2, 30, 4);                                                // hull
    ctx.fillRect(x + 6, y - 6, 18, 4);                                            // decks
    ctx.fillRect(x + 10, y - 9, 9, 3);
    ctx.fillRect(x + 14, y - 13, 1, 4);                                           // mast
    ctx.fillStyle = '#e0b363';
    for (let wx = 0; wx < 7; wx++) ctx.fillRect(x + 8 + wx * 2, y - 5, 1, 2);
    ctx.fillStyle = '#fbe7a6';
    for (const wx of [11, 14, 17]) ctx.fillRect(x + wx, y - 8, 1, 1);
    ctx.fillStyle = time.now % 1400 < 700 ? '#f3f6ea' : '#5cbf63';
    ctx.fillRect(x + 14, y - 14, 1, 1);
  }

  function clockHands(ctx, clock) {
    const [h, m] = clock.split(':').map(Number);
    const [cx, cy] = sprites.anchor('store-back', 'clock');
    const hand = (angle, length, color) => {
      const radians = angle * Math.PI / 180;
      const ex = Math.round(cx + Math.sin(radians) * length), ey = Math.round(cy - Math.cos(radians) * length);
      const steps = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
      ctx.fillStyle = color;
      for (let s = 0; s <= steps; s++) ctx.fillRect(Math.round(cx + (ex - cx) * s / steps), Math.round(cy + (ey - cy) * s / steps), 1, 1);
    };
    hand(m * 6, 9, '#3f4b54');
    hand((h % 12) * 30 + m / 2, 6, '#0e1214');
    ctx.fillStyle = '#c8403a';
    ctx.fillRect(cx, cy, 1, 1);
  }

  // The radio's needle at the low end of the dial: a pixel per 0.1 MHz from 87.6.
  function radioNeedle(ctx, freq) {
    const d = layout.fixtures.radio.dial;
    ctx.fillStyle = '#c8403a';
    ctx.fillRect(d.x + 3 + Math.round((freq - radio.band.ferry) / 10), d.y + 1, 1, d.h - 2);
  }

  // The microwave's idle display: the same time as the wall clock, without the leading zero.
  function microwaveClock(ctx, clock) {
    const d = layout.fixtures.microwave.display, digits = clock.replace(/^0/, '');
    const width = [...digits].reduce((w, ch) => w + LED[ch][0].length + 1, -1);
    let x = d.x + Math.floor((d.w - width) / 2);
    const y = d.y + Math.floor((d.h - 5) / 2);
    ctx.fillStyle = '#5cbf63';
    for (const ch of digits) {
      LED[ch].forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') ctx.fillRect(x + i, y + j, 1, 1); }));
      x += LED[ch][0].length + 1;
    }
  }

  const blinking = (period = 800, on = 520) => time.now % period < on;
  // Under the pointer (or held on a touch screen), or just tapped.
  const pointed = (state, name) => state.phase === 'shift' && (state.hoverTarget === name || state.flash?.name === name);

  // Soft contact shadow under something standing on the counter.
  function shadow(ctx, x, w, foot) {
    ctx.fillStyle = 'rgba(14,18,20,0.28)';
    ctx.fillRect(x + 1, foot - 1, w - 2, 2);
  }

  // The customer: every part at its place on the customer canvas; parts that follow
  // the figure (head, hair, face) move with its height and lean, hair may mirror.
  function customer(ctx, game, pass, mood) {
    const c = game.scene.customer;
    if (!c.visible) return;
    const person = customers.customers[c.id].person;
    const pose = customers.poseFor(c.id);
    const list = customers.parts(c.id, pose);
    const [hx, hy] = sprites.anchor(list.behind.find(p => p.sprite.startsWith('person-back-')).sprite, 'head') || [0, 0];
    const ox = layout.customer.x + c.dx, oy = layout.customer.y + c.dy, rise = space.figureOffset(person.height);
    const slots = customers.slotColors(c.id);
    for (const part of list[pass]) {
      const [ax, ay] = sprites.anchor(part.sprite, 'at');
      const x = ox + (part.follows ? hx : 0), y = oy + (part.follows ? rise + hy : 0);
      if (part.flip) {
        ctx.save();
        ctx.translate(x + 2 * AXIS + 1 - ax, y + ay);
        ctx.scale(-1, 1);
        ctx.drawImage(sprites.get(part.sprite, { slots, mood }), 0, 0);
        ctx.restore();
      } else sprite(ctx, part.sprite, x + ax, y + ay, { slots, mood });
      // An occasional blink over the eyes.
      if (part.sprite.startsWith('person-head-') && (time.now + c.id.length * 700) % 4200 < 130) {
        ctx.fillStyle = slots.skin2;
        for (const eye of ['eyeL', 'eyeR']) {
          const [ex, ey] = sprites.anchor(part.sprite, eye);
          ctx.fillRect(x + ax + ex, y + ay + ey - 1, 5, 3);
        }
      }
    }
  }

  function draw(ctx, game, options = {}) {
    const { scene, state } = game;
    const mood = options.mood || scene.mood;
    const look = { mood };
    ctx.save();
    ctx.setTransform(layout.screen.scale, 0, 0, layout.screen.scale, 0, 0);
    placed(ctx, 'store-back', { mood, slots: night.sky() });
    const g = glass();
    clipGlass(ctx, g);
    shore(ctx, g);
    ferry(ctx, g);
    car(ctx, g);
    rain(ctx, g);
    ctx.restore();
    if (outside.tower()) {
      const [tx, ty] = sprites.anchor('store-back', 'tower');
      ctx.fillStyle = '#ff5a4a';
      ctx.fillRect(tx - 1, ty - 1, 3, 3);
    }
    const clock = night.clock();
    clockHands(ctx, drift.wallClock(clock));
    placed(ctx, 'store-sides', look);

    customer(ctx, game, 'behind', mood);
    placed(ctx, 'store-counter', look);
    customer(ctx, game, 'counter', mood);

    for (const name of layout.decor) placed(ctx, name, look);       // machines and things that aren't clicked
    for (const [name, fixture] of Object.entries(layout.fixtures)) {
      let current = name in scene.fixtures ? scene.fixtures[name] : fixture.sprite;
      if (!current) continue;
      if (name === 'radio') current = radio.view.kind === 'echo' ? fixture.echo : fixture.sprite;
      if (name === 'recordKey' && game.recordPending() && blinking(900, 600)) current = fixture.lit;
      let [x, y] = sprites.anchor(current, 'at');
      if (name === 'phone' && messages.buzzing()) x += Math.floor(time.now / 45) % 2 ? 1 : -1;
      if (pointed(state, name)) sprite(ctx, current, x, y, { outline: HOVER });
      else if (scene.cues.has(name) && blinking()) sprite(ctx, current, x, y, { outline: CUE });
      sprite(ctx, current, x, y, look);
      if (name === 'phone' && messages.unread() && blinking(1400, 300)) {       // the new-text light
        const size = sprites.size(current);
        ctx.fillStyle = '#7ce0dc';
        ctx.fillRect(x + Math.floor(size.w * 0.5), y + Math.floor(size.h * 0.35), 2, 1);
      }
    }
    radioNeedle(ctx, radio.view.freq);
    const box = layout.fixtures.lostFound, inBox = found.items();          // what peeks over the box's rim
    inBox.forEach((item, i) => icon(ctx, item.icon, box.rim.x + Math.round(i * (box.width - 8) / Math.max(1, inBox.length - 1)), box.rim.y - 5, 1, 5));
    if (!scene.fixtures.microwave || scene.fixtures.microwave === layout.fixtures.microwave.sprite) microwaveClock(ctx, clock);
    if (scene.fixtures.paper) {                                     // the receipt rising from the printer
      const slot = layout.fixtures.printer.slot;
      ctx.fillStyle = '#f3f6ea';
      ctx.fillRect(slot.x - 6, slot.y - scene.fixtures.paper * 2, 12, scene.fixtures.paper * 2);
      ctx.fillStyle = '#c9c4b0';
      for (let y = slot.y - scene.fixtures.paper * 2 + 2; y < slot.y; y += 3) ctx.fillRect(slot.x - 4, y, 7, 1);
    }

    for (const product of scene.products.values()) {
      if (product.hidden) continue;
      const name = product.flicker ? 'spare-key' : product.sprite;
      const size = sprites.size(product.sprite), alt = sprites.size(name);
      const x = product.x + Math.floor((size.w - alt.w) / 2), y = product.y + size.h - alt.h;
      if (!product.moving) shadow(ctx, product.x, size.w, product.y + size.h);
      const item = game.order().items.find(entry => entry.id === product.id);
      if (state.selectedId === product.id) sprite(ctx, name, x, y, { outline: SELECTED });
      else if (state.paid && item?.heat && !state.heatedIds.includes(item.id)) sprite(ctx, name, x, y, { outline: HEAT });
      else if (pointed(state, 'item:' + product.id)) sprite(ctx, name, x, y, { outline: HOVER });
      else if (scene.cues.has('item:' + product.id) && blinking()) sprite(ctx, name, x, y, { outline: CUE });
      sprite(ctx, name, x, y, { mood: product.flicker ? 'echo' : mood });
    }

    for (const extra of scene.extras) sprite(ctx, extra.sprite, extra.x, extra.y, look);
    placed(ctx, 'store-front', look);
    ctx.restore();
  }

  root.NSF.world = { draw, icon };
})(globalThis);
