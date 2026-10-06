// Screen-grid (960x540) layers: POS text, speech bubble, radio captions, the
// record view, the shift report, the title and the closing card. Every
// clickable region drawn here is registered for the input router.
(function (root) {
  'use strict';
  const { text, strings, dialogue, radio, records, layout, time, audio, engine, space, customers } = root.NSF;
  const t = strings.t;
  const C = {
    ink: '#101517', paper: '#ece8d0', paperShade: '#b4ae94', phosphor: '#aef08c', phosphorDim: '#55b066',
    amber: '#f5d873', red: '#ff8466', cyan: '#63d4d0', white: '#f1f5e6', panel: '#0b1311', panelLine: '#2a6a48',
    muted: '#7d8d92', shade: 'rgba(7,9,15,0.72)',
  };
  const LINE = 15;
  const SW = layout.screen.width, SH = layout.screen.height, MID = SW / 2;
  let targets = [];

  const money = value => (value / 100).toFixed(2);
  const label = key => t(key);
  const shortId = id => id.replace('sale-', '#');

  function hit(x, y, w, h, action, name) { targets.push({ x, y, w, h, action, name }); }

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
    return [[mode, C.phosphorDim, t('pos.items', { count: scanned.length })], ...rows.slice(0, 3), last];
  }

  function pos(ctx, game) {
    const s = layout.fixtures.pos.screen, k = layout.screen.scale;
    const x = s.x * k, y = s.y * k, w = s.w * k;
    ctx.fillStyle = '#0a1210';
    ctx.fillRect(x, y, w, s.h * k);
    posLines(game).forEach(([value, color, right], i) => {
      const top = y + 3 + i * 15;
      const rightWidth = right ? text.width(right) + 4 : 0;
      text.draw(ctx, value, x + 5, top, color, { clipWidth: w - 10 - rightWidth });
      if (right) text.draw(ctx, right, x + w - 5, top, color === C.phosphor ? C.phosphorDim : color, { align: 'right' });
    });
    // Scanlines.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let line = y; line < y + s.h * k; line += 2) ctx.fillRect(x, line, w, 1);
  }

  // ------------------------------------------------------------ speech bubble
  function bubble(ctx, game) {
    const visible = dialogue.visibleText();
    if (!visible || !game.scene.customer.visible) return;
    const full = dialogue.fullText();
    const lines = text.wrap(full, 240);
    const shownLines = text.wrap(visible, 240);
    const width = Math.max(...lines.map(text.width)) + 20;
    const height = lines.length * 14 + 12;
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
    shownLines.forEach((line, i) => text.draw(ctx, line, x + 10, y + 5 + i * 14, C.ink));
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
    const echo = radio.view.echo;
    const chip = 'FM ' + radio.view.station;
    const chipWidth = text.width(chip) + 12;
    const lines = text.wrap(value, 860 - chipWidth);
    const height = lines.length * 14 + 10;
    const y = SH - 6 - height;
    ctx.fillStyle = 'rgba(7,9,15,0.8)';
    ctx.fillRect(8, y, SW - 16, height);
    ctx.fillStyle = echo ? C.cyan : C.amber;
    ctx.fillRect(8, y, 2, height);
    text.draw(ctx, chip, 16, y + 5, echo ? C.cyan : C.amber);
    let remaining = Math.floor([...value].length * radio.progress());
    lines.forEach((line, i) => {
      const count = Math.max(0, Math.min([...line].length, remaining));
      remaining -= [...line].length;
      text.draw(ctx, line, 16 + chipWidth, y + 5 + i * 14, echo ? C.cyan : C.white, { maxChars: count });
    });
  }

  // ------------------------------------------------------------ chips
  function chips(ctx, game) {
    const sound = audio.muted ? t('ui.soundOff') : t('ui.soundOn');
    let x = SW - 8;
    const w = text.width(sound) + 12;
    x -= w;
    ctx.fillStyle = 'rgba(7,9,15,0.55)';
    ctx.fillRect(x, 2, w, 17);
    text.draw(ctx, sound, x + 6, 3, C.white);
    hit(x, 2, w, 17, () => { audio.muted = !audio.muted; }, 'sound');
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
    text.draw(ctx, '02:12 — 03:04', x + w / 2, cy, C.muted, { align: 'center' }); cy += 26;
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
    text.draw(ctx, '02:12 — 03:04 · REG#02', MID, 134, C.muted, { align: 'center' });
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

  function draw(ctx, game) {
    targets = [];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    pos(ctx, game);
    bubble(ctx, game);
    caption(ctx, game);
    recordView(ctx, game);
    report(ctx, game);
    ending(ctx, game);
    title(ctx, game);
    chips(ctx, game);
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
