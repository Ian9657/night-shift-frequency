(function (root) {
  'use strict';
  const catalog = [
    { id: 'coffee', label: 'COFFEE', sprite: 'coffee', pos: 'BOSS BLACK COFFEE', screen: 'COFFEE', price: 148 },
    { id: 'onigiri', label: 'ONIGIRI', sprite: 'onigiri', pos: 'TUNA ONIGIRI', price: 132 },
    { id: 'bento', label: 'BENTO', sprite: 'bento', pos: 'KARAAGE BENTO', price: 498, heat: true },
    { id: 'tea', label: 'TEA', sprite: 'drink', pos: 'GREEN TEA', price: 128 },
    { id: 'water', label: 'WATER', sprite: 'drink', pos: 'MINERAL WATER 500ML', screen: 'MINERAL WATER', price: 120 },
    { id: 'sandwich', label: 'SAND', sprite: 'sandwich', pos: 'EGG SANDWICH', price: 298 },
    { id: 'juice', label: 'JUICE', sprite: 'canned-drink', pos: 'ORANGE JUICE', price: 158 },
    { id: 'cola', label: 'COLA', sprite: 'canned-drink', pos: 'COLA 500ML', price: 180 },
    { id: 'bread', label: 'BREAD', sprite: 'bread', pos: 'MILK BREAD', price: 168 },
  ];
  function random(seed) {
    let n = 2166136261;
    for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return () => {
      n += 0x6D2B79F5;
      let t = Math.imul(n ^ n >>> 15, 1 | n);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  function generate(seed) {
    const rng = random(seed);
    const pick = list => list[Math.floor(rng() * list.length)];
    const clocks = ['02:12', '02:18', '02:24', '02:30', '02:41', '02:46', '02:52', '02:58'];
    const contexts = [
      { name: 'quiet', style: 'quiet', lines: [], exit: null },
      { name: 'tired', style: 'quiet', lines: [], exit: null },
      { name: 'rain', style: 'chatty', lines: ['Still raining.', 'Bought an umbrella. Left it at work.'], scan: 'Useful purchase.', exit: 'Stay dry.' },
      { name: 'after_work', style: 'brief', lines: ["Should've eaten at work."], exit: 'Cheers.' },
      { name: 'shopping', style: 'chatty', lines: ['Came in for milk.'], scan: 'Forgot the milk.', exit: 'Back in a second.' },
      { name: 'awake', style: 'brief', lines: ["Couldn't sleep."], exit: null },
    ];
    const recent = [];
    const result = [];
    for (let i = 0; i < 8; i++) {
      const special = i === 4 || i === 7;
      const previous = result[i - 1];
      const paymentType = i === 0 ? 'card' : i === 1 || special ? 'cash' : i === 3 ? 'tap'
        : pick(['card', 'cash', 'tap'].filter(p => p !== previous.paymentType));
      const bagPreference = i === 1 ? 'no' : i > 2 && !special && previous.bagPreference !== 'no' && rng() < .25 ? 'no' : 'yes';
      let items;
      if (special) items = [copy(catalog.find(p => p.id === 'cola'))];
      else if (i === 0 || i === 3) items = [copy(catalog[0]), copy(catalog[i === 0 ? 1 : 8])];
      else if (i === 2) items = [copy(catalog[2]), copy(catalog[3])];
      else {
        const pool = catalog.filter(p => !p.heat);
        items = [];
        const count = i === 5 ? 1 : 1 + Math.floor(rng() * 2);
        while (items.length < count) {
          const available = pool.filter(p => !items.some(item => item.id === p.id));
          const fresh = available.filter(p => !recent.slice(-3).flat().includes(p.id));
          items.push(copy(pick(fresh.length ? fresh : available)));
        }
      }
      // Repeat purchases use distinct physical-unit IDs, with one shared SKU.
      if ([1, 6].includes(i) && (i === 6 || rng() < .45)) {
        const drink = copy(pick(catalog.filter(p => ['tea', 'water', 'juice', 'cola'].includes(p.id))));
        items = [drink, copy(drink)];
      }
      const occurrences = new Map();
      items = items.map(item => {
        const productId = item.id;
        const number = (occurrences.get(productId) || 0) + 1;
        occurrences.set(productId, number);
        return { ...item, productId, id: number === 1 ? productId : `${productId}-${number}` };
      });
      recent.push(items.map(item => item.id));
      const contextIndex = i === 0 ? 0 : Math.floor(rng() * contexts.length);
      const context = special ? null : contexts.splice(contextIndex, 1)[0];
      const paymentLine = paymentType === 'cash' ? 'Cash.' : paymentType === 'tap' ? "I'll tap." : 'Card.';
      const order = {
        id: `sale-${String(i + 1).padStart(3, '0')}`, clock: clocks[i], paymentType, bagPreference,
        items, requiresHeat: i === 2, context: context?.name || 'record',
        speechStyle: context?.style || 'brief', paymentAsset: paymentType === 'tap' ? pick(['phone-graphite', 'phone-moss']) : pick(['bank-card-sage', 'bank-card-burgundy', 'bank-card-blue']),
        customerLines: special ? (i === 4 ? ["Yeah, I'm at the shop."] : ['Same one as before.'])
          : [...(context.style === 'quiet' ? [paymentLine] : context.lines), ...(bagPreference === 'no' ? ['No bag.'] : [])],
        exitLine: special ? 'Right.' : context.exit,
        reactions: {
          paymentReady: context?.style === 'quiet' ? [] : [paymentLine], wrongPayment: [paymentLine], earlyPayment: ['These first.'],
          earlyBag: ['Not yet.'], redundantScan: ['Same one.'], earlyHeat: ['After, yeah.'],
          unneededHeat: ['Not that one.'], bagBeforeHeat: ['Hot first.'],
          ...(i === 2 ? { heatRequest: ['Heat this, please.'] } : {}),
          ...(context?.scan ? { firstScan: [context.scan] } : {}),
        },
      };
      if (special) {
        order.mismatch = true;
        order.decisionKind = i === 4 ? 'identity' : 'provenance';
        order.linkedOrderId = i === 7 ? result[4].id : null;
        order.items[0].real = 'COLA 500ML';
        order.items[0].pos = 'SPARE KEY';
        order.reactions.rescan = [{ text: 'Something wrong?', lock: true }];
        order.reactions.secondRescan = ['Still doing it?'];
        order.reactions.confirmBeforeRescan = ['Run it again.'];
      }
      order.finalReport = i === 7;
      result.push(order);
    }
    return result;
  }
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function createShift(seed) {
    const orders = freeze(generate(seed));
    const checks = [];
    const decisions = [];
    const transactions = [];
    const requireOrder = id => {
      const order = orders.find(o => o.id === id);
      if (!order) throw new Error('Unknown order');
      return order;
    };
    const decisionFor = id => decisions.find(d => d.orderId === id);
    const checksFor = id => checks.filter(c => c.orderId === id);
    const observation = (id, itemId) => {
      const item = requireOrder(id).items.find(item => item.id === itemId);
      if (!item) throw new Error('Unknown item');
      return item;
    };
    // Preview and commit share one projection; neither changes scanner facts.
    const previewDecision = (id, choice) => {
      const order = requireOrder(id);
      const allowed = order.decisionKind === 'identity' ? ['keep', 'correct'] : ['linked', 'independent'];
      if (!order.mismatch || !allowed.includes(choice)) throw new Error('Invalid decision');
      const evidence = checksFor(id);
      if (!evidence.length) throw new Error('Rescan required');
      const item = observation(id, evidence.at(-1).itemId);
      const prior = decisionFor(order.linkedOrderId);
      if (order.decisionKind === 'provenance' && !prior) throw new Error('Missing source transaction');
      return {
        orderId: id, itemId: item.id, physicalLabel: item.real || item.pos,
        initialRegisterLabel: item.pos, checks: copy(evidence), decision: choice,
        finalRecordedLabel: choice === 'correct' ? item.real || item.pos
          : choice === 'linked' ? prior.finalRecordedLabel : evidence.at(-1).result,
        recordOrigin: choice === 'correct' ? 'MANUAL' : choice === 'linked' ? prior.recordOrigin : 'REGISTER',
        verificationMode: choice === 'linked' ? 'LINKED_HISTORY' : 'CURRENT_SCAN',
        linkedOrderId: choice === 'linked' ? prior.orderId : null,
      };
    };
    const displayedItems = id => {
      const decision = decisionFor(id);
      return requireOrder(id).items.map(item => ({
        ...item,
        pos: decision?.itemId === item.id ? decision.finalRecordedLabel : item.pos,
        screen: decision?.itemId === item.id && decision.finalRecordedLabel !== item.pos ? undefined : item.screen,
      }));
    };
    return Object.freeze({
      seed: String(seed), orders,
      get checks() { return copy(checks); },
      get decisions() { return copy(decisions); },
      get transactions() { return copy(transactions); },
      checksFor(id) { return copy(checksFor(id)); },
      decisionFor(id) { return copy(decisionFor(id) || null); },
      currentRegisterObservation(id, itemId) { return observation(id, itemId).pos; },
      displayedItems,
      previewDecision,
      check(id, itemId) {
        const order = requireOrder(id);
        const item = observation(id, itemId);
        if (!order.mismatch || decisionFor(id)) return;
        checks.push({ orderId: id, itemId, type: 'rescan', result: item.pos });
      },
      commit(id, choice) {
        requireOrder(id);
        if (decisionFor(id)) return copy(decisionFor(id));
        const record = previewDecision(id, choice);
        decisions.push(record);
        return copy(record);
      },
      settle(id) {
        const existing = transactions.find(t => t.orderId === id);
        if (existing) return copy(existing);
        const order = requireOrder(id);
        const decision = decisionFor(id);
        if (order.mismatch && !decision) throw new Error('Decision required');
        const transaction = {
          orderId: id, clock: order.clock, paymentType: order.paymentType,
          lines: groupItems(displayedItems(id))
            .map(item => ({ itemId: item.productId, label: item.pos, quantity: item.quantity, unitPrice: item.price, price: item.price * item.quantity })),
          total: order.items.reduce((sum, item) => sum + item.price, 0),
          recordOrigin: decision?.recordOrigin || 'REGISTER',
          verificationMode: decision?.verificationMode || 'AUTO',
          linkedOrderId: decision?.linkedOrderId || null,
        };
        transactions.push(transaction);
        return copy(transaction);
      },
      report() {
        return { sales: transactions.reduce((sum, t) => sum + t.total, 0), orders: transactions.length,
          overrides: decisions.filter(d => d.recordOrigin === 'MANUAL' && d.verificationMode === 'CURRENT_SCAN').length,
          links: decisions.filter(d => d.verificationMode === 'LINKED_HISTORY').length,
          verified: decisions.filter(d => d.verificationMode === 'CURRENT_SCAN').length };
      },
    });
  }
  function groupItems(items) {
    const groups = new Map();
    for (const item of items) {
      const key = `${item.productId || item.id}:${item.pos}:${item.price}`;
      if (!groups.has(key)) groups.set(key, { ...item, quantity: 0 });
      groups.get(key).quantity += 1;
    }
    return [...groups.values()];
  }
  const api = { generate, createShift, random, groupItems };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ShiftEngine = api;
})(globalThis);
