// Deterministic shift generation, record checks, decisions and the ledger.
// Pure logic: no DOM, audio or timing. Shared by the browser and Node tests.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const story = node ? require('../content/story.js') : root.NSF.story;
  const customerData = node ? require('../content/customers.js') : root.NSF.customers;

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
  const product = id => copy(story.catalog.find(p => p.id === id));

  // Customers by order index. Orders six and seven, after three, are two of the people
  // who stayed (story.stayed), whose frequencies the radio can find earlier in the
  // night; the other ordinary orders are drawn from everyone else.
  function lineup(seed) {
    const rng = random(seed + ':customers');
    const shuffle = list => {
      const pool = [...list];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool;
    };
    const stayed = shuffle(Object.keys(story.stayed)).slice(0, 2);
    const others = shuffle(customerData.regulars.filter(id => !stayed.includes(id)));
    return [...others.slice(0, 5), stayed[0], stayed[1]];
  }

  function generate(seed) {
    const rng = random(seed);
    const pick = list => list[Math.floor(rng() * list.length)];
    const contexts = story.contexts.map(c => ({ ...c }));
    const regulars = lineup(seed);
    const recent = [];
    const result = [];
    for (let i = 0; i < 8; i++) {
      const record = story.records[i];
      const previous = result[i - 1];
      const paymentType = i === 0 ? 'card' : i === 1 || record ? 'cash'
        : previous.paymentType === 'card' ? 'cash' : 'card';
      const bagPreference = i === 1 ? 'no' : i > 2 && !record && previous.bagPreference !== 'no' && rng() < .25 ? 'no' : 'yes';
      let items;
      if (record) items = [product('cola')];
      else if (i === 0) items = [product('coffee'), product('sandwich')];
      else if (i === 3) items = [product('coffee'), product('bread')];
      else if (i === 2) items = [product('lasagne'), product('tea')];
      else {
        const pool = story.catalog.filter(p => !p.heat);
        items = [];
        const count = i === 5 ? 1 : 1 + Math.floor(rng() * 2);
        while (items.length < count) {
          const available = pool.filter(p => !items.some(item => item.id === p.id));
          const fresh = available.filter(p => !recent.slice(-3).flat().includes(p.id));
          items.push(copy(pick(fresh.length ? fresh : available)));
        }
      }
      // Repeat purchases use distinct physical-unit IDs with one shared SKU.
      if ([1, 6].includes(i) && (i === 6 || rng() < .45)) {
        const drink = product(pick(story.drinks));
        items = [drink, copy(drink)];
      }
      const seen = new Map();
      items = items.map(item => {
        const productId = item.id;
        const number = (seen.get(productId) || 0) + 1;
        seen.set(productId, number);
        return { ...item, productId, id: number === 1 ? productId : `${productId}-${number}`, pos: item.label };
      });
      recent.push(items.map(item => item.id));
      const context = record ? null : contexts.splice(i === 0 ? 0 : Math.floor(rng() * contexts.length), 1)[0];
      const paymentLine = 'say.' + paymentType;
      const order = {
        id: `sale-${String(i + 1).padStart(3, '0')}`, index: i, clock: story.clocks[i], paymentType, bagPreference,
        items, requiresHeat: i === 2, context: context?.name || 'record',
        customer: record ? record.customer : regulars[i],
        speechStyle: context?.style || 'brief',
        propColor: pick(['#5f8f6a', '#7c3340', '#3a5a9a']),
        customerLines: record ? [...record.lines]
          : [...(context.style === 'quiet' ? [paymentLine] : context.lines), ...(bagPreference === 'no' ? ['say.noBag'] : [])],
        exitLine: record ? record.exit : context.exit || null,
        reactions: {
          paymentReady: context?.style === 'quiet' ? [] : [paymentLine], wrongPayment: [paymentLine], earlyPayment: ['say.earlyPayment'],
          earlyBag: ['say.earlyBag'], redundantScan: ['say.redundantScan'], earlyHeat: ['say.earlyHeat'],
          unneededHeat: ['say.unneededHeat'], bagBeforeHeat: ['say.bagBeforeHeat'], scanAfterPay: ['say.scanAfterPay'],
          ...(i === 2 ? { heatRequest: ['say.heatRequest'] } : {}),
          ...(context?.scan ? { firstScan: [context.scan] } : {}),
          ...(record ? record.reactions : {}),
        },
      };
      if (record) {
        order.mismatch = true;
        order.decisionKind = record.decisionKind;
        order.linkedOrderId = record.decisionKind === 'provenance' ? result[4].id : null;
        order.items[0].real = 'item.cola';
        order.items[0].pos = 'item.spareKey';
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
      const item = requireOrder(id).items.find(entry => entry.id === itemId);
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
        ...item, pos: decision?.itemId === item.id ? decision.finalRecordedLabel : item.pos,
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
        return {
          sales: transactions.reduce((sum, t) => sum + t.total, 0), orders: transactions.length,
          overrides: decisions.filter(d => d.recordOrigin === 'MANUAL' && d.verificationMode === 'CURRENT_SCAN').length,
          links: decisions.filter(d => d.verificationMode === 'LINKED_HISTORY').length,
          verified: decisions.filter(d => d.verificationMode === 'CURRENT_SCAN').length,
        };
      },
      // 'keep-linked' etc. once both record orders are decided, else null.
      ending() {
        const first = decisions.find(d => d.orderId === orders[4].id);
        const last = decisions.find(d => d.orderId === orders[7].id);
        return first && last ? `${first.decision}-${last.decision}` : null;
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

  const api = { generate, createShift, random, groupItems, lineup };
  if (node) module.exports = api;
  else (root.NSF = root.NSF || {}).engine = api;
})(globalThis);
