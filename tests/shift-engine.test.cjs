const assert = require('node:assert/strict');
const { generate, createShift, groupItems } = require('../js/engine/shift.js');
const units = Array.from({length: 12}, (_, i) => ({id: 'cola-' + i, productId: 'cola', pos: 'COLA', price: 180}));
assert.equal(groupItems(units)[0].quantity, 12);
for (let seed = 0; seed < 500; seed++) {
  const orders = generate(seed);
  assert.deepEqual(orders, generate(seed));
  assert.equal(orders.length, 8);
  assert.deepEqual(orders.filter(o => o.mismatch).map(o => o.id), ['sale-005', 'sale-008']);
  assert.equal(orders[1].paymentType, 'cash');
  assert.equal(orders[1].bagPreference, 'no');
  assert.equal(orders[2].items.filter(p => p.heat).length, 1);
  assert.equal(groupItems(orders[6].items)[0].quantity, 2);
  assert.equal(orders[0].speechStyle, 'quiet');
  assert.equal(orders[0].customerLines.length, 1);
  assert.equal(orders[3].paymentType, 'tap');
  assert.equal(orders[4].customer, 'wen');
  assert.equal(orders[7].customer, 'wenEcho');
  const regulars = orders.filter(o => !o.mismatch).map(o => o.customer);
  assert.equal(new Set(regulars).size, 6);
  const lines = orders.flatMap(o => o.customerLines).filter(line => !['say.noBag', 'say.card', 'say.cash', 'say.tap'].includes(line));
  assert.equal(new Set(lines).size, lines.length);
  for (const order of orders) {
    assert.ok(order.items.length >= 1 && order.items.length <= 2);
    assert.equal(new Set(order.items.map(p => p.id)).size, order.items.length);
    assert.equal(Boolean(order.requiresHeat), order.items.some(p => p.heat));
    assert.ok(order.items.every(p => p.price > 0));
  }
}
for (const first of ['keep', 'correct']) for (const last of ['linked', 'independent']) {
  const shift = createShift('branches');
  const original = JSON.stringify(shift.orders);
  assert.ok(Object.isFrozen(shift.orders[4].items[0]));
  assert.equal(Reflect.set(shift, 'orders', []), false);
  assert.equal(Reflect.set(shift.orders[4].items[0], 'pos', 'CORRUPTED'), false);
  assert.throws(() => shift.commit('sale-005', first), /Rescan/);
  assert.throws(() => shift.settle('sale-005'), /Decision/);
  for (const order of shift.orders) {
    if (order.mismatch) {
      shift.check(order.id, 'cola');
      const preview = shift.previewDecision(order.id, order.id === 'sale-005' ? first : last);
      assert.equal(shift.decisionFor(order.id), null);
      shift.commit(order.id, order.id === 'sale-005' ? first : last);
      assert.deepEqual(shift.decisionFor(order.id), preview);
      shift.commit(order.id, order.id === 'sale-005' ? first : last);
    }
    shift.settle(order.id);
    shift.settle(order.id);
  }
  assert.equal(shift.decisions.length, 2);
  assert.equal(JSON.stringify(shift.orders), original);
  assert.equal(shift.currentRegisterObservation('sale-005', 'cola'), 'item.spareKey');
  assert.equal(shift.currentRegisterObservation('sale-008', 'cola'), 'item.spareKey');
  assert.equal(shift.displayedItems('sale-005')[0].pos, first === 'correct' ? 'item.cola' : 'item.spareKey');
  const final = shift.decisionFor('sale-008');
  assert.equal(final.verificationMode, last === 'linked' ? 'LINKED_HISTORY' : 'CURRENT_SCAN');
  assert.equal(final.recordOrigin, first === 'correct' && last === 'linked' ? 'MANUAL' : 'REGISTER');
  assert.equal(shift.transactions[0].verificationMode, 'AUTO');
  assert.equal(shift.report().verified, last === 'linked' ? 1 : 2);
  assert.equal(shift.transactions.length, 8);
  const repeated = shift.transactions.find(t => t.orderId === 'sale-007');
  assert.equal(repeated.lines.length, 1);
  assert.equal(repeated.lines[0].quantity, 2);
  assert.equal(repeated.lines[0].price, repeated.total);
  assert.equal(shift.report().sales, shift.orders.flatMap(o => o.items).reduce((sum, p) => sum + p.price, 0));
  assert.equal(shift.report().overrides, first === 'correct' ? 1 : 0);
  assert.equal(shift.report().links, last === 'linked' ? 1 : 0);
  const expected = first === 'correct' && last === 'linked' ? 'item.cola' : 'item.spareKey';
  assert.equal(shift.decisionFor('sale-008').finalRecordedLabel, expected);
  assert.equal(shift.ending(), `${first}-${last}`);
  const snapshot = shift.decisions;
  snapshot[0].finalRecordedLabel = 'CORRUPTED';
  assert.notEqual(shift.decisionFor('sale-005').finalRecordedLabel, 'CORRUPTED');
}
console.log('PASS: 500 seeds; all four decision paths; immutable history; idempotent settlement.');
