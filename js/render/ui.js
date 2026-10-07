// Screen-grid (960x540) layers: POS text, speech bubble, radio captions, the
// record view, the shift report, the title, the closing card and the phone held
// up close. Every
// clickable region drawn here is registered for the input router.
(function (root) {
  'use strict';
  const { text, strings, dialogue, radio, records, layout, time, audio, engine, space, customers, sprites, phone, night, signin, story, drift, messages } = root.NSF;
  const t = strings.t;
  const C = {
    ink: '#101517', paper: '#ece8d0', paperShade: '#b4ae94', phosphor: '#aef08c', phosphorDim: '#55b066',
    amber: '#f5d873', red: '#ff8466', cyan: '#63d4d0', white: '#f1f5e6', panel: '#0b1311', panelLine: '#2a6a48',
    muted: '#7d8d92', shade: 'rgba(7,9,15,0.72)',
  };
  const LINE = 15;
  const SW = layout.screen.width, SH = layout.screen.height, MID = SW / 2;
  // The canvas keeps its 960×540 coordinate system on every device. On a
  // narrow viewport the CSS fit makes the bitmap font too small to read, so
  // the dense text surfaces use a fractional nearest-neighbour scale and
  // recompute their wrapping locally.
  const narrow = () => root.innerWidth < 900 || (root.visualViewport && root.visualViewport.width < 900);
  let targets = [];

  const money = value => (value / 100).toFixed(2);
  const label = key => t(key);
  const shortId = id => id.replace('sale-', '#');

  // `action` gets the screen-grid point clicked; `drag`, if given, also follows the
  // pointer while it is held down.
  function hit(x, y, w, h, action, name, drag) { targets.push({ x, y, w, h, action, name, drag }); }

  function box(ctx, x, y, w, h, fill, border, notch = 2) {
    ctx.fillStyle = border;
    ctx.fillRect(x + notch, y, w - notch * 2, h);
    ctx.fillRect(x, y + notch, w, h - notch * 2);
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x + notch, y + 2, w - notch * 2, h - 4);
    ctx.fillRect(x + 2, y + notch, w - 4, h - notch * 2);
  }

  function button(ctx, x, y, w, caption, action, options = {}) {
    const h = 20;
    const focused = options.focused;
    box(ctx, x, y, w, h, focused ? C.panelLine : C.panel, options.disabled ? C.muted : C.phosphor);
    text.draw(ctx, caption, x + w / 2, y + 3, options.disabled ? C.muted : C.phosphor, { align: 'center' });
    if (!options.disabled) hit(x, y, w, h, action, options.name);
  }

  // ------------------------------------------------------------ POS screen
  function posLines(game) {
    const { state, shift } = game;
    const o = game.order();
    if (state.reportShown || state.phase === 'ending' || state.phase === 'end') {
      const report = shift.report();
      return [[t('pos.closed'), C.phosphor], [t('pos.sales', { amount: money(report.sales) }), C.phosphor],
        [`${t('report.overrides')} ${report.overrides} · ${t('report.links')} ${report.links}`, C.phosphorDim],
        [t('report.orders') + ' ' + report.orders, C.phosphorDim]];
    }
    const scanned = game.scannedItems();
    const full = scanned.length === o.items.length;
    if (o.mismatch && full && !state.paid) {
      const saved = game.hasSavedRecord();
      const checks = shift.checksFor(o.id).length;
      const prior = o.linkedOrderId ? shift.decisionFor(o.linkedOrderId) : null;
      const head = prior ? t('pos.link', { order: shortId(o.linkedOrderId).slice(1) }) : t('pos.mismatch');
      const status = saved ? t('pos.recordSaved') : checks ? t('pos.recordPending') : t('pos.rescanPending');
      const decision = shift.decisionFor(o.id);
      return [[head, C.red],
        [`${t('rec.item')} ${label(o.items[0].real)}`, C.phosphor],
        [`${t('rec.register')} ${label(decision ? decision.finalRecordedLabel : o.items[0].pos)}`, decision ? C.phosphor : C.red],
        [status, saved || time.now % 900 < 600 ? C.amber : C.panel]];
    }
    const grouped = engine.groupItems(shift.displayedItems(o.id).filter(item => state.scannedIds.includes(item.id)));
    const mode = state.modeOverride ? t(state.modeOverride) : state.paid ? t('pos.' + o.paymentType) : t('pos.ready');
    const total = scanned.reduce((sum, item) => sum + item.price, 0);
    const rows = grouped.length ? grouped.map(item => [label(item.pos), C.phosphor, 'x' + item.quantity])
      : [[t('pos.waiting'), C.phosphorDim]];
    while (rows.length < 3) rows.push(['', C.phosphor]);
    const last = o.finalReport && state.bagged ? [t('pos.printReport'), time.now % 900 < 600 ? C.amber : C.panel]
      : [t('pos.total', { amount: money(total) }), C.phosphor];
    return [[mode, C.phosphorDim, t('pos.items', { count: drift.posCount(scanned.length) })], ...rows.slice(0, 3), last];
  }

  // The green screen: a status bar (register, shift clock), the sale's lines with a
  // blinking cursor after the last, then scanlines, curved-glass corners and a glare.
  function pos(ctx, game) {
    const s = layout.fixtures.pos.screen, k = layout.screen.scale;
    const x = s.x * k, y = s.y * k, w = s.w * k, h = s.h * k;
    const ts = narrow() ? 1.15 : 1;
    const step = narrow() ? 14 : 15;
    ctx.fillStyle = '#0a1210';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.panelLine;
    ctx.fillRect(x + 2, y + 2, w - 4, 12);
    const clock = night.clock();
    text.draw(ctx, t('pos.register'), x + 5, y + 1, C.phosphor, { scale: ts });
    text.draw(ctx, clock, x + w - 5, y + 1, C.phosphor, { align: 'right', scale: ts });
    const lines = posLines(game);
    lines.forEach(([value, color, right], i) => {
      const top = y + 15 + i * step;
      const rightWidth = right ? text.width(right) * ts + 4 : 0;
      text.draw(ctx, value, x + 5, top, color, { clipWidth: w - 10 - rightWidth, scale: ts });
      if (right) text.draw(ctx, right, x + w - 5, top, color === C.phosphor ? C.phosphorDim : color, { align: 'right', scale: ts });
      if (i === lines.length - 1 && time.now % 1000 < 500) {
        ctx.fillStyle = C.phosphor;
        ctx.fillRect(Math.min(x + 7 + text.width(value) * ts, x + w - 11), top + 2, 5, 9);
      }
    });
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let line = y; line < y + h; line += 2) ctx.fillRect(x, line, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 4; i++) {
      const r = 8 - i * 2;
      ctx.fillRect(x, y + i * 2, r, 2); ctx.fillRect(x + w - r, y + i * 2, r, 2);
      ctx.fillRect(x, y + h - 2 - i * 2, r, 2); ctx.fillRect(x + w - r, y + h - 2 - i * 2, r, 2);
    }
    ctx.fillStyle = 'rgba(241,245,230,0.07)';
    for (let i = 0; i < 26; i += 2) ctx.fillRect(x + 6 + i * 2, y + 30 - i, 14, 2);
  }

  // ------------------------------------------------------------ speech bubble
  function bubble(ctx, game) {
    const visible = dialogue.visibleText();
    if (!visible || !game.scene.customer.visible) return;
    const full = dialogue.fullText();
    const ts = narrow() ? 1.2 : 1;
    const lines = text.wrap(full, Math.floor(240 / ts));
    const shownLines = text.wrap(visible, Math.floor(240 / ts));
    const width = Math.max(...lines.map(text.width)) * ts + 20;
    const height = lines.length * 14 * ts + 12;
    const k = layout.screen.scale, c = game.scene.customer, L = layout.customer;
    const rise = space.figureOffset(customers.customers[c.id].person.height);
    const headRight = (L.x + c.dx + L.head.x + 18) * k;
    const x = Math.min(headRight + 8, SW - 6 - width);
    const y = Math.max(24, (L.y + L.head.y + rise + 22) * k - height);
    box(ctx, x + 2, y + 2, width, height, 'rgba(7,9,15,0.5)', 'rgba(7,9,15,0.5)');
    box(ctx, x, y, width, height, C.paper, C.ink, 3);
    ctx.fillStyle = C.ink;
    // Tail pointing back at the speaker.
    const tx = x - 1, ty = y + height - 12;
    for (let i = 0; i < 5; i++) ctx.fillRect(tx - i * 2, ty + i, 2 + i * 2, 1);
    ctx.fillStyle = C.paper;
    for (let i = 0; i < 4; i++) ctx.fillRect(tx - i * 2 + 2, ty + i, i * 2, 1);
    shownLines.forEach((line, i) => text.draw(ctx, line, x + 10, y + 5 + i * 14 * ts, C.ink, { scale: ts }));
  }

  // ------------------------------------------------------------ radio caption
  function caption(ctx, game) {
    const value = radio.caption();
    if (!value) {
      if (game.state.phase === 'shift' && game.state.eventIndex >= 2 && game.state.eventIndex <= 4) {
        text.draw(ctx, t('ui.radioHint'), SW - 10, SH - 18, 'rgba(241,245,230,0.45)', { align: 'right' });
      }
      return;
    }
    const tone = { ferry: C.amber, echo: C.cyan, signal: C.paper }[radio.view.kind] || C.muted;
    const chip = 'FM ' + radio.view.station;
    const ts = narrow() ? 1.2 : 1;
    const chipWidth = text.width(chip) * ts + 12;
    const lines = text.wrap(value, Math.floor((860 - chipWidth) / ts));
    const height = lines.length * 14 * ts + 10;
    // At the top left, over the shelves, so the counter, the bags and the open drawer
    // stay in view; only as wide as the line.
    const y = 6;
    const width = 16 + chipWidth + Math.max(...lines.map(line => text.width(line))) + 10 - 8;
    ctx.fillStyle = 'rgba(7,9,15,0.8)';
    ctx.fillRect(8, y, width, height);
    ctx.fillStyle = tone;
    ctx.fillRect(8, y, 2, height);
    text.draw(ctx, chip, 16, y + 5, tone, { scale: ts });
    let remaining = Math.floor([...value].length * radio.progress());
    lines.forEach((line, i) => {
      const count = Math.max(0, Math.min([...line].length, remaining));
      remaining -= [...line].length;
      text.draw(ctx, line, 16 + chipWidth, y + 5 + i * 14 * ts, radio.view.kind === 'ferry' ? C.white : tone, { maxChars: count, scale: ts });
    });
  }

  // ------------------------------------------------------------ the radio's dial, close up
  // Over the radio while it is open: the dial's cream scale from 87.5 to 88.1 with its
  // red needle, step keys either side, the frequency and a signal meter. Click or drag
  // on the scale to tune. Only Night Ferry and the echo are marked; the rest is found
  // by ear. The counter stays live round it.
  function dial(ctx, game) {
    if (!radio.view.dialOpen || game.state.phase === 'title' || game.state.phase === 'signin') return;
    const { low, high } = radio.band;
    const x = 540, y = 204, w = 408, h = 84;
    box(ctx, x, y, w, h, '#2c353d', '#14191e', 3);
    hit(x, y, w, h, () => {}, null);
    const wx = x + 42, wy = y + 10, ww = w - 84, wh = 40;
    ctx.fillStyle = '#e0dac2';
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#a8a088';
    ctx.fillRect(wx, wy + wh - 2, ww, 2);
    const at = freq => Math.round(wx + 20 + (freq - low) / (high - low) * (ww - 40));
    for (let f = low; f <= high; f += radio.band.step) {
      const major = f % 10 === 0;
      ctx.fillStyle = '#5e5848';
      ctx.fillRect(at(f), wy + 4, 1, major ? 9 : 5);
      if (major) text.draw(ctx, radio.label(f), at(f), wy + 16, C.ink, { align: 'center' });
    }
    for (const [f, color] of [[radio.band.ferry, '#df8a3a'], [radio.band.echo, '#3fb3b3']]) {
      ctx.fillStyle = color;
      ctx.fillRect(at(f) - 2, wy + 1, 5, 2);
    }
    ctx.fillStyle = '#c8403a';
    ctx.fillRect(at(radio.view.freq) - 1, wy, 2, wh);
    const tuneTo = point => radio.setFrequency(low + (point.x - wx - 20) / (ww - 40) * (high - low));
    hit(wx, wy, ww, wh, tuneTo, 'dial', tuneTo);
    button(ctx, x + 8, y + 18, 26, '<', () => radio.step(-1), { name: 'dial-down' });
    button(ctx, x + w - 34, y + 18, 26, '>', () => radio.step(1), { name: 'dial-up' });
    const readout = text.draw(ctx, t('radio.dial', { freq: radio.view.station }), wx, y + 58, C.phosphor);
    const strength = { ferry: radio.view.offAir ? 0 : 4, echo: 4, signal: radio.caption() && radio.caption() !== t('radio.static') ? 2 : 0 }[radio.view.kind] || 0;
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = b < strength ? C.phosphor : '#3f4b54';
      ctx.fillRect(readout + 10 + b * 7, y + 70 - b * 3, 5, 4 + b * 3);
    }
    text.draw(ctx, t('radio.dialHint'), wx + ww, y + 58, C.muted, { align: 'right' });
    button(ctx, x + w - 26, y - 10, 22, '×', () => radio.closeDial(), { name: 'dial-close' });
  }

  // ------------------------------------------------------------ the phone, close up
  // The handset (art/src/handset.cjs) at 2x, flipping open; on its inner screen a
  // status bar with the shift clock over the current screen: the menu, the texts, one
  // text read, a text to Night Ferry, or the settings (levels drawn as signal-style
  // bars, silent mode). The left soft key is OK (SEND), the right one and the red key go
  // back. Click a row, a bar or a key; a click outside puts the phone away.
  const PHONE_ROWS = { master: 'phone.master', radio: 'phone.radio', sounds: 'phone.sounds', silent: 'phone.silent' };
  const LCD = { back: '#d6e6ec', ink: '#14223a', bar: '#223e6b', dim: '#9fb4c0', select: '#223e6b', light: '#f3f6ea' };
  function phoneView(ctx, game) {
    if (!phone.view.open) return;
    const name = ['handset-closed', 'handset-half', 'handset-open'][phone.frame()];
    ctx.fillStyle = 'rgba(7,9,15,0.55)';
    ctx.fillRect(0, 0, SW, SH);
    hit(0, 0, SW, SH, () => phone.close(), 'phone-away');
    const size = sprites.size(name), image = sprites.get(name);
    const px = 600, py = SH - size.h * 2 - 18;
    ctx.drawImage(image, px, py, size.w * 2, size.h * 2);
    hit(px, py, size.w * 2, size.h * 2, () => {}, null);                 // the handset itself swallows stray clicks
    if (name !== 'handset-open') return;
    const at = anchor => { const [ax, ay] = sprites.anchor(name, anchor); return [px + ax * 2, py + ay * 2]; };
    for (const [key, w, h] of [['up', 24, 16], ['down', 24, 16], ['left', 16, 20], ['right', 16, 20], ['ok', 16, 14], ['softL', 44, 16], ['softR', 44, 16], ['end', 40, 18]]) {
      const [kx, ky] = at(key);
      const press = { softL: 'ok', softR: 'back', end: 'back' }[key] || key;
      hit(kx - w / 2, ky - h / 2, w, h, () => phone.press(press), 'phone-' + key);
    }
    const [x0, y0] = at('lcd'), [x1, y1] = at('lcdEnd'), w = x1 - x0, h = y1 - y0;
    ctx.fillStyle = LCD.back;
    ctx.fillRect(x0, y0, w, h);
    // Status bar: signal, the shift clock, battery.
    ctx.fillStyle = LCD.bar;
    ctx.fillRect(x0, y0, w, 16);
    ctx.fillStyle = LCD.light;
    for (let i = 0; i < 4; i++) ctx.fillRect(x0 + 4 + i * 4, y0 + 11 - i * 2, 3, 3 + i * 2);
    ctx.fillRect(x1 - 20, y0 + 5, 14, 7); ctx.fillRect(x1 - 6, y0 + 7, 2, 3);
    ctx.fillStyle = LCD.bar; ctx.fillRect(x1 - 19, y0 + 6, 3, 5);
    text.draw(ctx, night.clock(), x0 + w / 2, y0 + 1, LCD.light, { align: 'center' });
    const screen = phone.view.screen, rows = phone.rows();
    const sender = m => (m.from === 'self' ? t('phone.self', { name: signin.name }) : t('phone.unknown'));
    const reading = screen === 'read' && messages.inbox().find(m => m.id === phone.view.reading);
    const heading = { home: t('phone.menu'), inbox: t('phone.inbox'), compose: t('phone.to'), settings: t('phone.title') }[screen] || sender(reading);
    text.draw(ctx, heading, x0 + w / 2, y0 + 20, LCD.ink, { align: 'center', clipWidth: w - 6 });
    // A selectable row: highlighted when selected; a click on it selects it, a click on
    // the selected row chooses it.
    const row = (i, caption, name, right) => {
      const ry = y0 + 40 + i * 22, selected = phone.view.row === i;
      if (selected) { ctx.fillStyle = LCD.select; ctx.fillRect(x0 + 2, ry - 2, w - 4, 19); }
      const ink = selected ? LCD.light : LCD.ink;
      const rightWidth = right ? text.width(right) + 6 : 0;
      text.draw(ctx, caption, x0 + 5, ry, ink, { clipWidth: w - 10 - rightWidth });
      if (right) text.draw(ctx, right, x1 - 5, ry, ink, { align: 'right' });
      if (name) hit(x0, ry - 2, w, 19, () => (selected ? phone.choose(i) : phone.select(i)), name);
      return { ry, ink, selected };
    };
    const wrapped = (value, y, color = LCD.ink) => text.wrap(value, w - 10).forEach((line, i) => text.draw(ctx, line, x0 + 5, y + i * 14, color));
    if (screen === 'home') {
      const unread = messages.unread();
      rows.forEach((id, i) => row(i, id === 'inbox' ? (unread ? t('phone.inboxNew', { count: unread }) : t('phone.inbox'))
        : id === 'compose' ? t('phone.compose') : t('phone.title'), 'phone-row-' + id));
    } else if (screen === 'inbox') {
      if (!rows.length) text.draw(ctx, t('phone.empty'), x0 + w / 2, y0 + 44, LCD.dim, { align: 'center' });
      messages.inbox().slice(0, 5).forEach((m, i) => {
        const r = row(i, sender(m), 'phone-msg-' + m.id, m.clock);
        if (!m.read && !r.selected) { ctx.fillStyle = LCD.bar; ctx.fillRect(x0 + 2, r.ry - 2, 2, 19); }
      });
    } else if (screen === 'read' && reading) {
      text.draw(ctx, reading.clock, x0 + w / 2, y0 + 34, LCD.dim, { align: 'center' });
      wrapped(t(reading.text), y0 + 52);
    } else if (screen === 'compose') {
      if (messages.sent) {
        text.draw(ctx, t('phone.sent', { clock: messages.sent.clock }), x0 + 5, y0 + 40, LCD.dim);
        wrapped(t(messages.sent.preset.text), y0 + 58);
      } else {
        messages.presets.forEach((p, i) => row(i, t(p.label), 'phone-send-' + p.id));
        const p = messages.presets[phone.view.row];
        if (p) wrapped(t(p.text), y0 + 40 + messages.presets.length * 22 + 4, LCD.bar);
      }
    } else if (screen === 'settings') {
      rows.forEach((id, i) => {
        const ry = y0 + 40 + i * 22, selected = phone.view.row === i;
        if (selected) { ctx.fillStyle = LCD.select; ctx.fillRect(x0 + 2, ry - 2, w - 4, 19); }
        const ink = selected ? LCD.light : LCD.ink;
        text.draw(ctx, t(PHONE_ROWS[id]), x0 + 5, ry, ink);
        if (id === 'silent') {
          text.draw(ctx, t(audio.muted ? 'phone.on' : 'phone.off'), x1 - 5, ry, ink, { align: 'right' });
          hit(x0, ry - 2, w, 19, () => { phone.select(i); phone.toggleSilent(); }, 'phone-silent');
          return;
        }
        hit(x0, ry - 2, w - 44, 19, () => phone.select(i), 'phone-row-' + id);
        const level = audio.level(id);
        for (let b = 0; b < 5; b++) {
          const bx = x1 - 42 + b * 8, bh = 4 + b * 2;
          ctx.fillStyle = b < level ? ink : (selected ? '#5a7397' : LCD.dim);
          ctx.fillRect(bx, ry + 14 - bh, 6, bh);
          hit(bx - 1, ry - 2, 8, 19, () => { phone.select(i); phone.setLevel(id, level === b + 1 ? b : b + 1); }, `phone-${id}-${b + 1}`);
        }
      });
    }
    // Soft key captions over the two keys under the screen.
    text.draw(ctx, t(screen === 'compose' && !messages.sent ? 'phone.send' : 'phone.select'), x0 + 5, y1 - 16, LCD.ink);
    text.draw(ctx, t('phone.back'), x1 - 5, y1 - 16, LCD.ink, { align: 'right' });
  }

  // ------------------------------------------------------------ record view
  function recordView(ctx, game) {
    if (!records.view.open) return;
    const m = records.model();
    const o = m.order;
    const shift = game.shift;
    ctx.fillStyle = 'rgba(5,8,10,0.55)';
    ctx.fillRect(0, 0, SW, SH);
    const w = 440, h = 392, x = MID - w / 2, y = 64;
    box(ctx, x, y, w, h, C.panel, C.panelLine, 3);
    hit(x, y, w, h, () => {}, 'panel');
    text.draw(ctx, t('rec.title'), x + 14, y + 8, C.phosphor);
    button(ctx, x + w - 34, y + 6, 22, '×', () => records.close(), { name: 'close' });
    ctx.fillStyle = C.panelLine;
    ctx.fillRect(x + 12, y + 30, w - 24, 1);
    let cy = y + 38;
    const heading = value => { text.draw(ctx, value, x + 14, cy, C.white); cy += LINE + 2; };
    const row = (key, value, color = C.phosphor) => {
      text.draw(ctx, key, x + 22, cy, C.muted);
      text.draw(ctx, value, x + 120, cy, color, { clipWidth: w - 130 });
      cy += LINE;
    };
    heading(o.id.toUpperCase());
    row(t('rec.time'), o.clock);
    row(t('rec.item'), o.items.map(item => label(item.real || item.pos)).join(' / '), m.conflicting ? C.red : C.phosphor);
    row(t('rec.register'), m.full ? o.items.map(item => label(shift.currentRegisterObservation(o.id, item.id))).join(' / ') : t('rec.awaiting'), m.conflicting ? C.red : C.phosphor);
    if (o.mismatch) row(t('rec.rescan'), m.checks.length ? label(m.checks.at(-1).result) : t('rec.pending'), m.checks.length ? C.phosphor : C.muted);
    if (o.decisionKind === 'provenance' && m.prior) {
      cy += 4;
      heading(t('rec.linked', { order: shortId(m.prior.orderId).slice(1) }));
      row(t('rec.entry'), label(m.prior.finalRecordedLabel));
      row(t('rec.origin'), t('origin.' + m.prior.recordOrigin));
      row(t('rec.verify'), t('verify.' + m.prior.verificationMode));
    }
    if (m.needsRescan) {
      cy += 6;
      text.draw(ctx, t('rec.instruction'), x + 14, cy, C.amber);
      cy += LINE;
    }
    if (m.decision) {
      cy += 4;
      heading(t('rec.saved'));
      row(t('rec.entry'), label(m.decision.finalRecordedLabel));
      row(t('rec.origin'), t('origin.' + m.decision.recordOrigin));
      row(t('rec.verify'), t('verify.' + m.decision.verificationMode));
      if (m.decision.linkedOrderId) row(t('rec.from'), m.decision.linkedOrderId.toUpperCase());
    }
    const controls = records.controls();
    if (m.deciding) {
      cy += 6;
      heading(t('rec.choose'));
      m.choices.forEach(choice => {
        const index = controls.findIndex(c => c.kind === 'choice' && c.choice === choice);
        const caption = choice === 'keep' ? `${t('rec.keep')}: ${label(o.items[0].pos)}`
          : choice === 'correct' ? `${t('rec.correct')}: ${label(o.items[0].real)}`
            : choice === 'linked' ? t('rec.linkedChoice', { order: shortId(o.linkedOrderId).slice(1) }) : t('rec.independent');
        const focused = records.view.focus === index;
        if (focused) { ctx.fillStyle = 'rgba(85,176,102,0.18)'; ctx.fillRect(x + 16, cy - 2, w - 32, LINE + 2); }
        ctx.fillStyle = C.phosphor;
        ctx.fillRect(x + 22, cy + 2, 9, 9);
        ctx.fillStyle = C.panel;
        ctx.fillRect(x + 23, cy + 3, 7, 7);
        if (records.view.draft === choice) { ctx.fillStyle = C.phosphor; ctx.fillRect(x + 25, cy + 5, 3, 3); }
        text.draw(ctx, caption, x + 38, cy, C.phosphor);
        hit(x + 16, cy - 2, w - 32, LINE + 2, () => { records.choose(choice); records.view.focus = index; }, 'choice:' + choice);
        cy += LINE + 3;
      });
      if (m.preview) {
        const p = m.preview;
        const parts = [label(p.finalRecordedLabel), t('origin.' + p.recordOrigin), t('verify.' + p.verificationMode),
          ...(p.linkedOrderId ? [p.linkedOrderId.toUpperCase()] : [])];
        text.draw(ctx, `${t('rec.preview')}  ${parts.join(' · ')}`, x + 22, cy + 2, C.amber, { clipWidth: w - 36 });
      }
      cy += LINE + 4;
    } else if (m.showHistory) {
      cy += 6;
      heading(t('rec.paid'));
      const list = m.transactions.slice(0, 5);
      if (!list.length) row('', t('rec.none'), C.muted);
      for (const tx of list) {
        const items = tx.lines.map(line => `${label(line.label)} x${line.quantity}`).join(' / ');
        text.draw(ctx, `${shortId(tx.orderId)}  ${items}  ${money(tx.total)}  ${t('origin.' + tx.recordOrigin)}`, x + 22, cy, C.phosphorDim, { clipWidth: w - 36 });
        cy += LINE - 1;
      }
    }
    const footerY = y + h - 50;
    const backIndex = controls.findIndex(c => c.kind === 'back');
    button(ctx, x + 14, footerY, 120, t('rec.back'), () => records.close(), { focused: records.view.focus === backIndex, name: 'back' });
    if (m.deciding) {
      const saveIndex = controls.findIndex(c => c.kind === 'save');
      button(ctx, x + w - 134, footerY, 120, t('rec.save'), () => game.submitDecision(records.view.draft),
        { disabled: !records.view.draft || dialogue.locked, focused: records.view.focus === saveIndex, name: 'save' });
    }
    text.draw(ctx, t('rec.keys'), x + w / 2, y + h - 22, C.muted, { align: 'center' });
  }

  // ------------------------------------------------------------ report, title, ending
  function report(ctx, game) {
    if (game.state.phase !== 'report') return;
    const r = game.shift.report();
    ctx.fillStyle = 'rgba(5,8,10,0.5)';
    ctx.fillRect(0, 0, SW, SH);
    const w = 220, h = 206, x = MID - w / 2, y = 150;
    ctx.fillStyle = C.paper;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.paperShade;
    for (let i = 0; i < w; i += 6) ctx.fillRect(x + i, y + h, 3, 3);
    let cy = y + 14;
    text.draw(ctx, 'HARBOR MART  REG#02', x + w / 2, cy, C.ink, { align: 'center' }); cy += 18;
    text.draw(ctx, t('report.title'), x + w / 2, cy, C.ink, { align: 'center' }); cy += 22;
    for (const [key, value] of [['report.sales', money(r.sales)], ['report.orders', r.orders], ['report.overrides', r.overrides],
      ['report.links', r.links], ['report.verified', r.verified]]) {
      text.draw(ctx, t(key), x + 16, cy, C.ink);
      text.draw(ctx, String(value), x + w - 16, cy, C.ink, { align: 'right' });
      cy += 18;
    }
    cy += 8;
    text.draw(ctx, `${game.orders[0].clock} — ${story.night.closing}`, x + w / 2, cy, C.muted, { align: 'center' }); cy += 26;
    text.draw(ctx, t('report.continue'), x + w / 2, cy, time.now % 1000 < 650 ? C.ink : C.paperShade, { align: 'center' });
    hit(0, 0, SW, SH, () => game.startEnding(), 'report');
  }

  function title(ctx, game) {
    if (game.state.phase !== 'title') return;
    ctx.fillStyle = 'rgba(7,9,15,0.62)';
    ctx.fillRect(0, 0, SW, SH);
    text.draw(ctx, t('title.name'), MID, 160, C.white, { align: 'center', scale: 3, shadow: C.ink });
    text.draw(ctx, t('title.place'), MID, 230, C.amber, { align: 'center' });
    button(ctx, MID - 80, 290, 160, t('title.start'), () => game.startShift(), { name: 'start' });
    text.draw(ctx, t('title.hint'), MID, 336, C.muted, { align: 'center' });
  }

  function ending(ctx, game) {
    if (game.state.phase === 'ending') hit(0, 0, SW, SH - 60, () => radio.skip(), 'skip');
    if (game.state.phase !== 'end') return;
    const { shift, orders } = game;
    ctx.fillStyle = 'rgba(7,9,15,0.86)';
    ctx.fillRect(0, 0, SW, SH);
    text.draw(ctx, t('end.title'), MID, 90, C.white, { align: 'center', scale: 2 });
    text.draw(ctx, `${story.night.start} — ${story.night.dawn} · ${signin.name}`, MID, 134, C.muted, { align: 'center' });
    text.draw(ctx, t('end.records'), MID, 172, C.amber, { align: 'center' });
    let cy = 196;
    for (const o of [orders[4], orders[7]]) {
      const d = shift.decisionFor(o.id);
      const parts = [label(d.finalRecordedLabel), t('origin.' + d.recordOrigin), t('verify.' + d.verificationMode)];
      text.draw(ctx, `${shortId(o.id)}  ${parts.join(' · ')}`, MID, cy, C.phosphor, { align: 'center' });
      cy += 18;
    }
    cy += 10;
    for (const key of root.NSF.story.radio.endings[shift.ending()]) {
      for (const line of text.wrap(t(key), 560)) {
        text.draw(ctx, line, MID, cy, C.white, { align: 'center' });
        cy += 15;
      }
    }
    text.draw(ctx, t('end.note'), MID, 380, C.muted, { align: 'center' });
    // The seed lets anyone replay this exact shift (index.html?seed=...).
    text.draw(ctx, t('end.seed', { seed: shift.seed }), SW - 12, SH - 20, C.muted, { align: 'right' });
    button(ctx, MID - 80, 414, 160, t('end.again'), () => {
      const url = new URL(root.location.href);
      url.searchParams.delete('seed');
      root.location.href = url.href;
    }, { name: 'again' });
  }

  // ------------------------------------------------------------ the sign-in sheet
  // A clipboard on the left: Harbor Mart's night staff sheet, the same signature on
  // every night before this one and none of them signed out. At 01:00 the clerk writes
  // their name on tonight's line with the letter keys on the right (or the keyboard);
  // at 05:00 the earlier lines read as their name, and they sign out.
  const INK = '#2c4a9a';
  function scribble(ctx, x, y) {
    ctx.fillStyle = INK;
    for (let i = 0; i < 58; i++) {
      const dy = Math.round(Math.sin(i / 3.1) * 3 + Math.sin(i / 1.3) * 1.5);
      ctx.fillRect(x + i, y + 6 + dy, 2, 2);
    }
    ctx.fillRect(x + 62, y + 4, 2, 2);
  }
  function sheet(ctx, game) {
    const v = signin.view;
    if (game.state.phase !== 'signin' && game.state.phase !== 'clockout') return;
    const out = v.mode === 'out';
    ctx.fillStyle = out ? 'rgba(7,9,15,0.3)' : 'rgba(7,9,15,0.6)';
    ctx.fillRect(0, 0, SW, SH);
    hit(0, 0, SW, SH, () => {}, null);
    const bx = 28, by = 60, bw = 372, bh = 384;
    box(ctx, bx, by, bw, bh, '#7d5a3c', '#3c2a1c', 4);
    ctx.fillStyle = '#a07a54';
    ctx.fillRect(bx + 6, by + 4, bw - 12, 2);
    const px = bx + 16, py = by + 34, pw = bw - 32, ph = bh - 46;
    ctx.fillStyle = C.paperShade;
    ctx.fillRect(px + 3, py + 3, pw, ph);
    ctx.fillStyle = C.paper;
    ctx.fillRect(px, py, pw, ph);
    box(ctx, bx + bw / 2 - 60, by + 14, 120, 30, '#adbcbd', '#3f4b54', 3);           // the clip
    ctx.fillStyle = '#7f8f96';
    ctx.fillRect(bx + bw / 2 - 50, by + 34, 100, 3);
    text.draw(ctx, t('sheet.store'), px + pw / 2, py + 16, C.ink, { align: 'center' });
    text.draw(ctx, t('sheet.title'), px + pw / 2, py + 32, C.ink, { align: 'center' });
    const cols = [px + 12, px + 70, px + 228, px + 282];
    const top = py + 64, step = 34;
    ['sheet.date', 'sheet.name', 'sheet.in', 'sheet.out'].forEach((key, i) => text.draw(ctx, t(key), cols[i], top, C.muted));
    ctx.fillStyle = C.ink;
    ctx.fillRect(px + 8, top + 16, pw - 16, 1);
    const nights = ['10/09', '10/10', '10/11', '10/12', '10/13', '10/14'];
    nights.forEach((date, i) => {
      const y = top + 24 + i * step, tonight = i === nights.length - 1;
      ctx.fillStyle = C.paperShade;
      ctx.fillRect(px + 8, y + step - 8, pw - 16, 1);
      for (const cx of cols.slice(1)) ctx.fillRect(cx - 8, top, 1, step * nights.length + 16);
      text.draw(ctx, date, cols[0], y + 4, C.ink);
      if (!tonight) {
        if (out) text.draw(ctx, signin.name, cols[1], y + 4, INK);
        else scribble(ctx, cols[1], y + 2);
        text.draw(ctx, story.night.start, cols[2], y + 4, INK);
        return;
      }
      const name = v.mode === 'in' && v.open ? v.draft : signin.name;
      const end = text.draw(ctx, name, cols[1], y + 4, INK);
      if (v.mode === 'in' && v.open && time.uiNow % 1000 < 550) { ctx.fillStyle = INK; ctx.fillRect(end + 1, y + 4, 2, 13); }
      if (out) text.draw(ctx, story.night.start, cols[2], y + 4, INK);
      if (v.signedOut) text.draw(ctx, story.night.dawn, cols[3], y + 4, INK);
    });
    text.draw(ctx, t(out ? 'sheet.hintOut' : 'sheet.hintIn'), px + pw / 2, py + ph - 26, C.muted, { align: 'center' });
    if (out) {
      if (!v.signedOut) button(ctx, 486, 404, 200, t('sheet.signOut'), () => signin.sign(), { name: 'sheet-sign' });
      return;
    }
    // Letter keys, nine to a row, the last key rubs out.
    const keys = [...signin.letters, 'DEL'];
    const kx = 494, ky = 188;
    keys.forEach((key, i) => {
      const x = kx + (i % 9) * 46, y = ky + Math.floor(i / 9) * 40;
      const erase = key === 'DEL';
      box(ctx, x, y, 40, 32, C.panel, C.phosphor);
      text.draw(ctx, erase ? t('sheet.erase') : key, x + 20, y + 9, C.phosphor, { align: 'center' });
      hit(x, y, 40, 32, () => (erase ? signin.erase() : signin.type(key)), erase ? 'sheet-del' : 'sheet-' + key);
    });
    button(ctx, kx + 116, ky + 140, 180, t('sheet.signIn'), () => signin.sign(), { name: 'sheet-sign' });
  }

  function draw(ctx, game) {
    targets = [];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    pos(ctx, game);
    bubble(ctx, game);
    caption(ctx, game);
    dial(ctx, game);
    recordView(ctx, game);
    report(ctx, game);
    ending(ctx, game);
    title(ctx, game);
    sheet(ctx, game);
    phoneView(ctx, game);
    ctx.restore();
  }

  // Topmost UI region under a screen-grid point.
  function hitTest(x, y) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const r = targets[i];
      if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r;
    }
    return null;
  }

  root.NSF.ui = { draw, hitTest, get targets() { return targets.slice(); } };
})(globalThis);
