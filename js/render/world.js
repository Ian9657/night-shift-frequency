// Draws the 480x270 world, scaled 2x onto the 960x540 canvas.
(function (root) {
  'use strict';
  const { sprites, layout, customers, time, radio } = root.NSF;
  const CUE = '#f5d873', SELECTED = '#f1f5e6', HEAT = '#eda04c';
  const LED = {
    8: ['###', '#.#', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
    6: ['###', '#..', '###', '#.#', '###'], '.': ['.', '.', '.', '.', '#'],
  };

  function sprite(ctx, name, x, y, options = {}) {
    const image = sprites.get(name, options);
    const pad = options.outline ? 1 : 0;
    if (options.flip) {
      ctx.save();
      ctx.translate(x + customers.FLIP_AXIS * 2 + 1, y);
      ctx.scale(-1, 1);
      ctx.drawImage(image, -pad, -pad);
      ctx.restore();
    } else {
      ctx.drawImage(image, Math.round(x) - pad, Math.round(y) - pad);
    }
  }

  function rain(ctx) {
    const w = layout.window, m = w.mullion;
    const gx = w.x + 5, gy = w.y + 5, gw = w.w - 10, gh = layout.counterTop - gy;
    ctx.fillStyle = 'rgba(109,143,179,0.5)';
    for (let i = 0; i < 70; i++) {
      const x = gx + (i * 37 + Math.floor(i / 7) * 11) % gw;
      const y = gy + Math.floor((i * 53 + time.now * (0.09 + (i % 3) * 0.02)) % gh);
      if (x >= m.x - 1 && x <= m.x + m.w) continue;
      ctx.fillRect(x, y, 1, Math.min(3, gy + gh - y));
    }
  }

  function clockHands(ctx, clock) {
    const [h, m] = clock.split(':').map(Number);
    const { x: cx, y: cy, hour, minute } = layout.clock;
    const hand = (angle, length, color) => {
      const radians = angle * Math.PI / 180;
      const ex = Math.round(cx + Math.sin(radians) * length), ey = Math.round(cy - Math.cos(radians) * length);
      const steps = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
      ctx.fillStyle = color;
      for (let s = 0; s <= steps; s++) ctx.fillRect(Math.round(cx + (ex - cx) * s / steps), Math.round(cy + (ey - cy) * s / steps), 1, 1);
    };
    hand(m * 6, minute, '#3f4b54');
    hand((h % 12) * 30 + m / 2, hour, '#0e1214');
    ctx.fillStyle = '#c8403a';
    ctx.fillRect(cx, cy, 1, 1);
  }

  function radioDigits(ctx, station) {
    const d = layout.fixtures.radio.display;
    ctx.fillStyle = station === '87.7' ? '#63d4d0' : '#ff8466';
    let x = d.x + 3;
    for (const ch of station) {
      const glyph = LED[ch];
      glyph.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') ctx.fillRect(x + i, d.y + 1 + j, 1, 1); }));
      x += glyph[0].length + 1;
    }
  }

  function blinking(period = 800, on = 520) { return time.now % period < on; }

  // Soft contact shadow under something resting on the counter.
  function shadow(ctx, x, w, foot) {
    ctx.fillStyle = 'rgba(14,18,20,0.3)';
    ctx.fillRect(x + 1, foot - 1, w - 2, 2);
    ctx.fillRect(x + 3, foot + 1, Math.max(1, w - 6), 1);
  }

  function draw(ctx, game, options = {}) {
    const { scene, state } = game;
    const mood = options.mood || scene.mood;
    const look = () => ({ mood });
    ctx.save();
    ctx.setTransform(layout.screen.scale, 0, 0, layout.screen.scale, 0, 0);
    sprite(ctx, 'room', 0, 0, look());
    rain(ctx);
    if (time.now % 1600 < 420) sprite(ctx, 'tower-light-on', layout.towerLight.x - 3, layout.towerLight.y - 3, look());
    clockHands(ctx, state.phase === 'end' ? '03:04' : game.order().clock);

    const c = scene.customer;
    const cx = layout.customer.x + c.dx, cy = layout.customer.y + c.dy;
    const slots = customers.slotColors(c.id);
    if (c.visible) {
      for (const layer of customers.layers(c.id, c.pose === 'idle' ? 'idle' : c.pose)) {
        sprite(ctx, layer.sprite, cx, cy, { slots, mood, flip: layer.flip });
      }
      // Occasional blink.
      if ((time.now + c.id.length * 700) % 4200 < 130) {
        const head = 'customer-head-' + customers.customers[c.id].head;
        ctx.fillStyle = slots.skin2;
        for (const eye of ['eyeL', 'eyeR']) {
          const [ex, ey] = sprites.anchor(head, eye);
          ctx.fillRect(cx + ex, cy + ey + 1, 4, 1);
        }
      }
    }

    sprite(ctx, 'counter', 0, layout.counterTop, look());
    if (scene.fixtures.drawer) sprite(ctx, 'drawer-open', layout.drawer.x - 2, layout.drawer.y - 6 + scene.fixtures.drawer, look());
    for (const fixture of Object.values(layout.fixtures)) {
      const size = sprites.size(fixture.sprite);
      shadow(ctx, fixture.x, size.w, fixture.y + size.h);
    }
    for (const product of scene.products.values()) {
      if (product.hidden || product.moving) continue;
      const size = sprites.size(product.sprite);
      shadow(ctx, product.x, size.w, product.y + size.h);
    }
    for (const [name, fixture] of Object.entries(layout.fixtures)) {
      let current = scene.fixtures[name] || fixture.sprite;
      if (name === 'radio') current = radio.view.station === '87.7' ? 'radio-echo' : 'radio';
      if (scene.cues.has(name) && blinking()) sprite(ctx, current, fixture.x, fixture.y, { outline: CUE });
      sprite(ctx, current, fixture.x, fixture.y, look());
    }
    radioDigits(ctx, radio.view.station);
    if (scene.fixtures.paper) {
      const slot = layout.fixtures.printer.slot;
      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y - scene.fixtures.paper, 12, scene.fixtures.paper);
      ctx.clip();
      sprite(ctx, 'receipt', slot.x, slot.y - scene.fixtures.paper, look());
      ctx.restore();
    }

    for (const product of scene.products.values()) {
      if (product.hidden) continue;
      const name = product.flicker ? 'spare-key' : product.sprite;
      const size = sprites.size(product.sprite), alt = sprites.size(name);
      const x = product.x + Math.floor((size.w - alt.w) / 2), y = product.y + size.h - alt.h;
      const item = game.order().items.find(entry => entry.id === product.id);
      if (state.selectedId === product.id) sprite(ctx, name, x, y, { outline: SELECTED });
      else if (state.paid && item?.heat && !state.heatedIds.includes(item.id)) sprite(ctx, name, x, y, { outline: HEAT });
      else if (scene.cues.has('item:' + product.id) && blinking()) sprite(ctx, name, x, y, { outline: CUE });
      sprite(ctx, name, x, y, { mood: product.flicker ? 'echo' : mood });
    }

    const arm = customers.frontArm(c.pose);
    if (c.visible && arm) {
      sprite(ctx, arm, cx, cy, { slots, mood });
      if (c.prop) {
        const [hx, hy] = sprites.anchor(arm, 'hand');
        const size = sprites.size(c.prop.sprite);
        sprite(ctx, c.prop.sprite, cx + hx - Math.floor(size.w / 2), cy + hy - size.h + 2, { slots: c.prop.slots, mood });
        // Fingers over the prop keep it held, not floating.
        ctx.fillStyle = slots.skin1;
        ctx.fillRect(cx + hx - 1, cy + hy, 3, 1);
      }
    }
    for (const extra of scene.extras) sprite(ctx, extra.sprite, extra.x, extra.y, look());
    ctx.restore();
  }

  root.NSF.world = { draw };
})(globalThis);
