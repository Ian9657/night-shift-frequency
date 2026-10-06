// Draws the first-person store (480x270 world pixels, 2x on the 960x540 canvas)
// back to front: the back wall and view, the side shelving, the customer behind the
// counter, the counter, the customer's hands on it, the machines, the goods, hands
// held out over the machines, things in motion, and the clerk's own things nearest.
(function (root) {
  'use strict';
  const { sprites, layout, customers, space, time, radio } = root.NSF;
  const CUE = '#f5d873', SELECTED = '#f1f5e6', HEAT = '#eda04c';
  const LED = {
    8: ['###', '#.#', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
    6: ['###', '#..', '###', '#.#', '###'], '.': ['.', '.', '.', '.', '#'],
  };
  const AXIS = space.customer.centre - 0.5;                       // the customer canvas's mirror axis

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

  function rain(ctx) {
    const [gx, gy] = sprites.anchor('store-back', 'window'), [gw, gh] = sprites.anchor('store-back', 'windowSize');
    const [mx, mw] = sprites.anchor('store-back', 'mullion');
    ctx.fillStyle = 'rgba(109,143,179,0.45)';
    for (let i = 0; i < 80; i++) {
      const x = gx + (i * 37 + Math.floor(i / 7) * 11) % gw;
      const y = gy + Math.floor((i * 53 + time.now * (0.09 + (i % 3) * 0.02)) % gh);
      if (x >= mx - 1 && x <= mx + mw) continue;
      ctx.fillRect(x, y, 1, Math.min(3, gy + gh - y));
    }
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

  function radioDigits(ctx, station) {
    const d = layout.fixtures.radio.display;
    ctx.fillStyle = '#16120c';
    ctx.fillRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
    ctx.fillStyle = station === '87.7' ? '#63d4d0' : '#ff8466';
    let x = d.x + Math.floor((d.w - 15) / 2);
    for (const ch of station) {
      const glyph = LED[ch];
      glyph.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') ctx.fillRect(x + i, d.y + Math.floor((d.h - 5) / 2) + j, 1, 1); }));
      x += glyph[0].length + 1;
    }
  }

  const blinking = (period = 800, on = 520) => time.now % period < on;

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
    const pose = customers.poseFor(c.id, c.action);
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
    placed(ctx, 'store-back', look);
    rain(ctx);
    if (time.now % 1600 < 420) {
      const [tx, ty] = sprites.anchor('store-back', 'tower');
      ctx.fillStyle = '#ff5a4a';
      ctx.fillRect(tx - 1, ty - 1, 3, 3);
    }
    clockHands(ctx, state.phase === 'end' ? '03:04' : game.order().clock);
    placed(ctx, 'store-sides', look);

    customer(ctx, game, 'behind', mood);
    placed(ctx, 'store-counter', look);
    customer(ctx, game, 'counter', mood);

    for (const name of layout.decor) placed(ctx, name, look);       // machines and things that aren't clicked
    for (const [name, fixture] of Object.entries(layout.fixtures)) {
      let current = scene.fixtures[name] || fixture.sprite;
      if (name === 'radio') current = radio.view.station === '87.7' ? fixture.echo : fixture.sprite;
      const [x, y] = sprites.anchor(current, 'at');
      if (scene.cues.has(name) && blinking()) sprite(ctx, current, x, y, { outline: CUE });
      sprite(ctx, current, x, y, look);
    }
    radioDigits(ctx, radio.view.station);
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
      else if (scene.cues.has('item:' + product.id) && blinking()) sprite(ctx, name, x, y, { outline: CUE });
      sprite(ctx, name, x, y, { mood: product.flicker ? 'echo' : mood });
    }

    customer(ctx, game, 'over', mood);
    for (const extra of scene.extras) sprite(ctx, extra.sprite, extra.x, extra.y, look);
    placed(ctx, 'store-front', look);
    ctx.restore();
  }

  root.NSF.world = { draw };
})(globalThis);
