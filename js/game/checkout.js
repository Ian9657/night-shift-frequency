// Checkout controller: current-order state, player actions and the scene
// model the renderer draws. Cross-order history lives in the shift engine.
(function (root) {
  'use strict';
  const { time, audio, dialogue, radio, records, broadcast, engine, story, customers, layout, sprites, phone } = root.NSF;

  const params = new URLSearchParams(root.location?.search || '');
  const shift = engine.createShift(params.get('seed') || String(Date.now()));
  const orders = shift.orders;
  const CUE_DELAY_START = 2, CUE_DELAY_MS = 780;

  const state = {
    phase: 'title', // title -> shift -> report -> ending -> end
    eventIndex: 0, selectedId: null, scannedIds: [], paid: false, bagged: false, heatedIds: [],
    reportShown: false, busy: false, modeOverride: null, reactionCounts: {}, dialogueFlags: new Set(),
  };

  const F = layout.fixtures;
  const fixtureDefault = { scanner: F.scanner.sprite, terminal: F.terminal.sprite, microwave: F.microwave.sprite, drawer: F.drawer.sprite };
  // The customer's `action` (poses.js actions: card, cash, receive) or null
  // while they wait at the counter in their own pose.
  const scene = {
    customer: { id: orders[0].customer, action: null, dx: 0, dy: 0, visible: true },
    products: new Map(),
    extras: [],
    fixtures: { ...fixtureDefault, paper: 0 },
    mood: 'normal',
    cues: new Set(),
  };
  let cueSignature = '', cueReadyAt = 0;

  const order = () => orders[state.eventIndex];
  const started = () => state.phase === 'shift';
  const isScanned = item => state.scannedIds.includes(item.id);
  const scannedItems = (o = order()) => o.items.filter(isScanned);
  const needsBag = (o = order()) => o.bagPreference !== 'no';
  const pendingHeat = (o = order()) => o.items.filter(item => item.heat && isScanned(item) && !state.heatedIds.includes(item.id));
  const hasSavedRecord = (o = order()) => Boolean(shift.decisionFor(o.id));
  const rescans = (o = order()) => shift.checksFor(o.id).length;
  const blocked = () => !started() || dialogue.locked || records.view.open;

  function isPaymentReady() {
    const o = order();
    return o.items.every(isScanned) && (!o.mismatch || hasSavedRecord()) && !state.paid;
  }

  // ------------------------------------------------------------ scene helpers
  function resetProducts() {
    scene.products.clear();
    for (const item of order().items) {
      scene.products.set(item.id, { id: item.id, sprite: item.sprite, x: 0, y: 0, hidden: false, moving: false, flicker: false });
    }
    placeProducts(true);
  }

  // Lane rows: unscanned items wait at the back, scanned items come forward.
  function homes() {
    const result = new Map();
    const { lane } = layout;
    for (const [items, foot] of [[order().items.filter(i => !isScanned(i)), lane.incomingFoot], [scannedItems(), lane.scannedFoot]]) {
      const sizes = items.map(item => sprites.size(item.sprite));
      const span = sizes.reduce((sum, s) => sum + s.w, 0) + lane.gap * Math.max(0, items.length - 1);
      let x = lane.x + Math.floor((lane.width - span) / 2);
      items.forEach((item, i) => {
        result.set(item.id, { x, y: foot - sizes[i].h });
        x += sizes[i].w + lane.gap;
      });
    }
    return result;
  }

  function placeProducts(force = false) {
    const target = homes();
    for (const product of scene.products.values()) {
      if (product.moving && !force) continue;
      const home = target.get(product.id);
      product.x = home.x;
      product.y = home.y;
    }
  }

  function move(entity, x, y, ms, waypoints = []) {
    entity.moving = true;
    const points = [{ t: 0, x: entity.x, y: entity.y }, ...waypoints, { t: 1, x, y }];
    return time.path(points, ms, (px, py) => { entity.x = px; entity.y = py; }).then(() => { entity.moving = false; });
  }

  function addExtra(sprite, x, y, options = {}) {
    const extra = { sprite, x, y, front: true, ...options };
    scene.extras.push(extra);
    return extra;
  }
  function removeExtra(extra) { scene.extras = scene.extras.filter(e => e !== extra); }

  // Where the customer's hand is while doing `action`: the held note for cash, the
  // open palm when receiving.
  function handPoint(action) {
    const c = scene.customer;
    const [layer] = customers.parts(c.id, customers.poseFor(c.id, action)).over;
    const [ax, ay] = sprites.anchor(layer.sprite, 'at');
    const [hx, hy] = sprites.anchor(layer.sprite, action === 'receive' ? 'palm' : 'hand');
    return { x: layout.customer.x + c.dx + ax + hx, y: layout.customer.y + c.dy + ay + hy };
  }

  function centred(sprite, point) {
    const s = sprites.size(sprite);
    return { x: point.x - Math.floor(s.w / 2), y: point.y - Math.floor(s.h / 2) };
  }

  async function walk(from, to, ms) {
    await time.path([{ t: 0, x: from, y: 0 }, { t: 1, x: to, y: 0 }], ms, x => {
      scene.customer.dx = x;
      scene.customer.dy = x !== to && Math.floor(Math.abs(x) / 8) % 2 ? 1 : 0;
    });
    scene.customer.dy = 0;
  }

  function flashMood(mood, ms) {
    scene.mood = mood;
    time.after(ms, () => { if (scene.mood === mood) scene.mood = 'normal'; });
  }

  // ------------------------------------------------------------ dialogue
  function takeReaction(key) {
    const lines = order().reactions?.[key];
    if (!lines?.length) return { text: null, lock: false };
    const count = state.reactionCounts[key] || 0;
    const entry = lines[Math.min(count, lines.length - 1)];
    state.reactionCounts[key] = count + 1;
    return typeof entry === 'string' ? { text: entry, lock: false } : { text: entry.text, lock: Boolean(entry.lock) };
  }
  function sayReaction(key) {
    const reaction = takeReaction(key);
    if (reaction.text) dialogue.say([reaction.text], { lock: reaction.lock });
    return reaction.text;
  }
  function sayReactionSequence(keys) {
    const lines = [];
    let lock = false;
    for (const key of keys) {
      if (state.dialogueFlags.has(key)) continue;
      const reaction = takeReaction(key);
      if (!reaction.text) continue;
      state.dialogueFlags.add(key);
      lines.push(reaction.text);
      lock = lock || reaction.lock;
    }
    if (lines.length) dialogue.say(lines, { lock });
    return lines;
  }
  const sayOnce = key => sayReactionSequence([key])[0] || null;
  function reactToBlocked(key) { if (!state.busy) sayOnce(key); }

  let waitTimer = null;
  function scheduleWait(key, ms, condition) {
    time.cancel(waitTimer);
    if (!order().reactions?.[key]) return;
    const current = order();
    waitTimer = time.after(ms, () => {
      if (order() === current && !state.busy && !dialogue.locked && condition()) sayOnce(key);
    });
  }

  // ------------------------------------------------------------ actions
  function selectItem(id) {
    if (blocked() || state.busy || state.bagged) return;
    const item = order().items.find(entry => entry.id === id);
    if (!item) return;
    if (state.paid && (!item.heat || state.heatedIds.includes(item.id))) return;
    state.selectedId = id;
  }

  async function scan() {
    const o = order();
    if (blocked()) return;
    if (state.busy || !state.selectedId || state.paid) {
      if (!state.busy && state.paid) reactToBlocked('scanAfterPay');
      return;
    }
    const item = o.items.find(entry => entry.id === state.selectedId);
    if (item && isScanned(item) && (!o.mismatch || hasSavedRecord())) {
      reactToBlocked('redundantScan');
      return;
    }
    const wasScanned = isScanned(item);
    state.busy = true;
    state.modeOverride = 'pos.reading';
    const product = scene.products.get(item.id);
    const beam = centred(item.sprite, F.scanner.beam);
    await move(product, beam.x, beam.y, 115);
    product.moving = true;
    scene.fixtures.scanner = F.scanner.busy;
    audio.scan();
    if (o.mismatch) {
      // The neighbouring frequency bleeds through the scanner for a moment.
      product.flicker = true;
      flashMood('echo', 180);
      audio.anomaly();
      time.after(220, () => { product.flicker = false; });
    }
    await time.wait(o.mismatch ? 240 : 65);
    if (!wasScanned) state.scannedIds.push(item.id);
    state.selectedId = null;
    await time.wait(45);
    scene.fixtures.scanner = F.scanner.sprite;
    const home = homes().get(item.id);
    await move(product, home.x, home.y, 135);

    const keys = [];
    if (wasScanned) {
      shift.check(o.id, item.id);
      keys.push(rescans() > 1 ? 'secondRescan' : 'rescan');
    } else {
      const count = scannedItems(o).length;
      keys.push(count === 1 ? 'firstScan' : count === 2 ? 'secondScan' : 'scan');
    }
    if (isPaymentReady()) keys.push('paymentReady');
    sayReactionSequence(keys);
    state.busy = false;
    state.modeOverride = null;
    if (isPaymentReady()) scheduleWait('waitAtPayment', 4200, isPaymentReady);
  }

  // Card at the terminal: the customer reaches over, the terminal approves.
  async function terminalPayment(o) {
    const c = scene.customer;
    await time.wait(140);
    c.action = 'card';
    await time.wait(180);
    scene.fixtures.terminal = F.terminal.busy;
    audio.payment(o.paymentType);
    await time.wait(480);
    scene.fixtures.terminal = F.terminal.sprite;
    c.action = null;
    await time.wait(120);
  }

  // Cash: the customer holds out a note; the drawer opens, takes it and shuts.
  async function cashPayment() {
    const c = scene.customer;
    c.action = 'cash';
    await time.wait(160);
    audio.cashPaper();
    const hand = handPoint('cash');
    const start = centred('bill', hand), end = centred('bill', F.drawer.drop);
    c.action = null;
    const bill = addExtra('bill', start.x, start.y);
    const handoff = { x: Math.round(bill.x + (end.x - bill.x) * 0.42), y: Math.round(bill.y + (end.y - bill.y) * 0.18) };
    let contacted = false;
    const contact = () => {
      if (contacted) return;
      contacted = true;
      scene.fixtures.drawer = F.drawer.busy;
      audio.cashDrawer();
    };
    const timer = time.after(400, contact);
    await move(bill, end.x, end.y, 540, [{ t: 0.12, x: bill.x, y: bill.y }, { t: 0.48, ...handoff }, { t: 0.58, ...handoff }, { t: 0.86, ...end }]);
    time.cancel(timer);
    contact();
    await time.wait(95);
    removeExtra(bill);
    await time.wait(220);
    scene.fixtures.drawer = F.drawer.sprite;
    await time.wait(80);
  }

  // Once the sale is ready the drawer is where cash goes (a card customer says so);
  // otherwise it just opens and shuts.
  function drawer() {
    if (!state.busy && !state.paid && isPaymentReady()) return pay('cash');
    if (state.busy) return;
    scene.fixtures.drawer = scene.fixtures.drawer === F.drawer.busy ? F.drawer.sprite : F.drawer.busy;
    audio.cashDrawer();
  }

  async function printReceipt() {
    audio.receipt();
    for (const height of [3, 6, 9]) {
      scene.fixtures.paper = height;
      await time.wait(70);
    }
  }

  async function pay(source) {
    const o = order();
    if (blocked()) return;
    if (state.busy || !isPaymentReady()) {
      if (!state.busy && !state.paid) reactToBlocked('earlyPayment');
      return;
    }
    if ((o.paymentType === 'cash') !== (source === 'cash')) {
      reactToBlocked('wrongPayment');
      return;
    }
    time.cancel(waitTimer);
    state.busy = true;
    state.modeOverride = 'pos.' + o.paymentType;
    if (o.paymentType === 'cash') await cashPayment();
    else await terminalPayment(o);
    state.paid = true;
    shift.settle(o.id);
    await time.wait(60);
    await printReceipt();
    state.busy = false;
    state.modeOverride = null;
    const heat = pendingHeat(o);
    if (heat.length === 1) state.selectedId = heat[0].id;
    let line = null;
    if (heat.length) sayReaction('heatRequest');
    else line = sayReaction('pay');
    if (!needsBag(o) && !heat.length) {
      if (line) {
        state.busy = true;
        await time.wait(dialogue.readTime(line));
        state.busy = false;
      }
      await finishOrder('products');
    } else if (needsBag(o) && !heat.length) {
      scheduleWait('waitAtBag', 5200, () => state.paid && !state.bagged && !pendingHeat().length);
    }
  }

  async function heat() {
    const o = order();
    if (blocked()) return;
    if (state.busy || !state.paid) {
      if (!state.busy && !state.paid) reactToBlocked('earlyHeat');
      return;
    }
    if (!state.selectedId) {
      const pending = pendingHeat(o);
      if (pending.length !== 1) { reactToBlocked('unneededHeat'); return; }
      state.selectedId = pending[0].id;
    }
    const item = o.items.find(entry => entry.id === state.selectedId);
    if (!item || !item.heat || state.heatedIds.includes(item.id)) {
      reactToBlocked('unneededHeat');
      return;
    }
    state.busy = true;
    const product = scene.products.get(item.id);
    const cavity = centred(item.sprite, layout.microwaveCavity);
    await move(product, cavity.x, cavity.y, 145);
    product.moving = true;
    product.hidden = true;
    scene.fixtures.microwave = F.microwave.busy;
    audio.microwaveStart();
    await time.wait(500);
    state.heatedIds.push(item.id);
    state.selectedId = null;
    scene.fixtures.microwave = F.microwave.sprite;
    audio.microwaveDone();
    product.hidden = false;
    const home = homes().get(item.id);
    await move(product, home.x, home.y, 155);
    state.busy = false;
    const line = sayReaction('heatDone');
    if (!needsBag(o) && !pendingHeat(o).length) {
      await time.wait(dialogue.readTime(line));
      await finishOrder('products');
    } else if (!pendingHeat(o).length) {
      scheduleWait('waitAtBag', 5200, () => state.paid && !state.bagged);
    }
  }

  async function bag() {
    if (blocked()) return;
    if (state.busy || !state.paid || state.bagged || pendingHeat().length) {
      if (!state.busy) {
        if (!state.paid) reactToBlocked('earlyBag');
        else if (pendingHeat().length) reactToBlocked('bagBeforeHeat');
      }
      return;
    }
    time.cancel(waitTimer);
    state.busy = true;
    const opening = sayOnce('bagStarted');
    await time.wait(opening ? 120 : 0);
    // A bag is pulled off the bundle under the counter and stands open at the packing
    // place; the goods go in.
    const { stack, packing } = F.bags, open = sprites.size('bag-open'), full = sprites.size('bag-full');
    const standing = { x: packing.x - Math.floor(open.w / 2), y: packing.y - open.h };
    const bagSprite = addExtra('bag-open', stack.x - Math.floor(open.w / 2), stack.y - open.h);
    audio.bag();
    await move(bagSprite, standing.x, standing.y, 290, [{ t: 0.45, x: bagSprite.x, y: standing.y - 9 }]);
    await time.wait(80);
    for (const item of scannedItems()) {
      const product = scene.products.get(item.id);
      const target = centred(item.sprite, { x: packing.x, y: packing.y - Math.floor(open.h * 0.6) });
      await move(product, target.x, target.y, 250);
      product.moving = true;
      product.hidden = true;
      await time.wait(35);
    }
    const line = sayReaction('bag');
    await time.wait(Math.max(360, dialogue.readTime(line)));
    bagSprite.sprite = 'bag-full';
    bagSprite.x = packing.x - Math.floor(full.w / 2);
    bagSprite.y = packing.y - full.h;
    audio.bag();
    await time.wait(90);
    state.bagged = true;
    await finishOrder('bag', bagSprite);
  }

  async function finishOrder(handoff, bagSprite) {
    const o = order();
    state.busy = true;
    if (handoff === 'products' && o.reactions?.handoff) {
      const reaction = takeReaction('handoff');
      if (reaction.text) {
        dialogue.say([reaction.text], { lock: reaction.lock });
        await time.wait(dialogue.readTime(reaction.text));
      }
    }
    dialogue.say(o.exitLine ? [o.exitLine] : []);
    await time.wait(200);
    scene.customer.action = 'receive';
    const hand = handPoint('receive');
    if (handoff === 'bag') {
      const target = centred('bag-full', hand);
      await move(bagSprite, target.x, target.y - 6, 250);
      removeExtra(bagSprite);
    } else {
      for (const item of scannedItems()) {
        const product = scene.products.get(item.id);
        const target = centred(item.sprite, hand);
        await move(product, target.x, target.y, 250);
        product.moving = true;
        product.hidden = true;
      }
    }
    state.bagged = true;
    await time.wait(140);
    scene.customer.action = null;
    if (o.finalReport) {
      state.busy = false;
      return;
    }
    await time.wait(210);
    dialogue.clear();
    await walk(0, layout.customer.walk, 1100);
    scene.customer.visible = false;
    await time.wait(360);
    nextOrder();
    // Goods appear once the customer has reached the counter.
    for (const product of scene.products.values()) product.hidden = true;
    scene.customer.visible = true;
    await walk(layout.customer.walk, 0, 1100);
    await time.wait(90);
    for (const product of scene.products.values()) product.hidden = false;
    state.busy = false;
    dialogue.say(order().customerLines, { lock: state.eventIndex === 0 });
    broadcast.orderStarted(state.eventIndex);
  }

  function nextOrder() {
    time.cancel(waitTimer);
    state.eventIndex = Math.min(state.eventIndex + 1, orders.length - 1);
    Object.assign(state, {
      selectedId: null, scannedIds: [], paid: false, bagged: false, heatedIds: [], busy: true,
      modeOverride: null, reactionCounts: {}, dialogueFlags: new Set(),
    });
    scene.extras = [];
    scene.fixtures = { ...fixtureDefault, paper: 0 };
    scene.customer = { id: order().customer, action: null, dx: layout.customer.walk, dy: 0, visible: true };
    cueSignature = '';
    resetProducts();
  }

  function submitDecision(choice) {
    const o = order();
    if (!started() || state.busy || dialogue.locked || !o.mismatch || hasSavedRecord() || scannedItems(o).length !== o.items.length) return;
    if (rescans() < 1) {
      audio.anomaly();
      sayOnce('confirmBeforeRescan');
      return;
    }
    shift.commit(o.id, choice);
    records.close();
    const prefix = o.decisionKind === 'provenance' ? shift.decisionFor(o.linkedOrderId).decision + '-' : '';
    dialogue.say([story.records[o.index].afterDecision[prefix + choice]]);
    if (isPaymentReady()) scheduleWait('waitAtPayment', 4200, isPaymentReady);
  }

  function printReport() {
    const o = order();
    if (!started() || state.busy || dialogue.locked || !o.finalReport || !state.bagged || state.reportShown) return;
    state.reportShown = true;
    state.phase = 'report';
    printReceipt();
  }

  async function startEnding() {
    if (state.phase !== 'report') return;
    state.phase = 'ending';
    dialogue.clear();
    const leaving = walk(0, layout.customer.walk, 1100).then(() => { scene.customer.visible = false; });
    await time.wait(600);
    await broadcast.shiftClosed(shift.ending());
    await leaving;
    state.phase = 'end';
  }

  function startShift() {
    if (state.phase !== 'title') return;
    state.phase = 'shift';
    audio.unlock();
    audio.startAmbience();
    dialogue.say(order().customerLines, { lock: true });
    broadcast.shiftStarted();
  }

  // ------------------------------------------------------------ per-frame derived state
  // The sale's record waits for the clerk: re-scanned, not yet saved, not yet paid.
  function recordPending() {
    const o = order();
    return Boolean(o.mismatch) && scannedItems(o).length === o.items.length && !state.paid
      && !hasSavedRecord() && shift.checksFor(o.id).length > 0;
  }

  function cueTargets() {
    const o = order();
    const targets = [];
    if (!started() || state.busy || dialogue.locked || records.view.open) return targets;
    const awaitingRecord = o.mismatch && scannedItems(o).length === o.items.length && !hasSavedRecord();
    const selected = o.items.find(item => item.id === state.selectedId);
    const ready = isPaymentReady();
    // A record conflict removes guidance; the POS screen itself asks for attention.
    if (awaitingRecord) return targets;
    if (selected && !state.paid && !isScanned(selected)) targets.push('scanner');
    if (ready) targets.push(o.paymentType === 'cash' ? 'drawer' : 'terminal');
    if (state.paid && selected && selected.heat && !state.heatedIds.includes(selected.id)) targets.push('microwave');
    if (state.paid && needsBag(o) && !pendingHeat(o).length && !state.bagged) targets.push('bags');
    if (o.finalReport && state.bagged && !state.reportShown) targets.push('printer');
    if (!state.bagged) {
      const candidates = state.paid ? pendingHeat(o) : o.items.filter(item => !isScanned(item));
      for (const item of candidates) if (item.id !== state.selectedId) targets.push('item:' + item.id);
    }
    return targets;
  }

  function update() {
    placeProducts();
    const targets = cueTargets();
    const signature = targets.slice().sort().join('|');
    if (signature !== cueSignature) {
      cueSignature = signature;
      cueReadyAt = time.now + (state.eventIndex >= CUE_DELAY_START ? CUE_DELAY_MS : 0);
    }
    scene.cues = new Set(time.now >= cueReadyAt ? targets : []);
  }

  // ------------------------------------------------------------ world hit targets
  function targets() {
    const list = [];
    if (state.phase !== 'shift') return list;
    for (const [name, fixture] of Object.entries(F)) {
      if (fixture.inert) continue;
      const current = scene.fixtures[name] || fixture.sprite, size = sprites.size(current);
      const [x, y] = sprites.anchor(current, 'at');
      list.push({ name, sprite: current, x, y, w: size.w, h: size.h });
    }
    if (!state.bagged) {
      for (const product of scene.products.values()) {
        if (product.hidden) continue;
        const size = sprites.size(product.sprite);
        list.push({ name: 'item:' + product.id, sprite: product.sprite, x: product.x, y: product.y, w: size.w, h: size.h, product: true });
      }
    }
    return list;
  }

  // An action that throws must never leave the counter locked: log it, drop
  // in-flight motion and hand control back to the player.
  async function guarded(action) {
    try {
      await action();
    } catch (error) {
      console.error('Night Shift Frequency: action failed', error);
      state.busy = false;
      state.modeOverride = null;
      scene.extras = [];
      scene.customer.action = null;
      scene.fixtures = { ...fixtureDefault, paper: scene.fixtures.paper };
      for (const product of scene.products.values()) {
        product.moving = false;
        product.flicker = false;
        if (!state.bagged) product.hidden = false;
      }
      placeProducts(true);
    }
  }

  function activate(name) {
    if (name.startsWith('item:')) return guarded(() => selectItem(name.slice(5)));
    const actions = {
      scanner: scan, terminal: () => pay('terminal'), drawer, microwave: heat, bags: bag,
      printer: printReport, recordKey: () => records.open(), radio: () => radio.tune(), phone: () => phone.open(),
    };
    return actions[name] ? guarded(actions[name]) : undefined;
  }

  resetProducts();
  const controller = {
    shift, orders, state, scene, order, update, targets, activate, startShift, startEnding: () => guarded(startEnding),
    submitDecision, hasSavedRecord, recordPending, scannedItems,
    canOpenRecords: () => (state.phase === 'shift' || state.phase === 'report') && !state.busy,
  };
  records.attach(controller);
  broadcast.attach(controller);
  root.NSF.game = controller;
})(globalThis);
