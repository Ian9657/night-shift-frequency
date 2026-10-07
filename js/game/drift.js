// The frequency drift: the later it gets, the less the store's readings can be
// trusted. Drift touches only what things show (the wall clock, the POS item count,
// the lights, a customer's words), never the records. What drifts in a shift comes
// from its seed, so a replay drifts the same way.
(function (root) {
  'use strict';
  const { time, audio, night, engine } = root.NSF;
  let game = null;
  let plan = { skips: [], ghost: -1, borrow: -1 };
  const seen = { skipped: new Set(), ghosted: new Set() };
  let ghostUntil = 0;

  // Two of the later ordinary orders lose ten minutes on the wall clock once the first
  // item is scanned; one flashes a count the register never had; order 6 leaves with
  // Nell's last words.
  function makePlan(seed) {
    const rng = engine.random(seed + ':drift');
    const later = [3, 5, 6];
    const skips = later.splice(Math.floor(rng() * later.length), 1).concat(later.splice(Math.floor(rng() * later.length), 1));
    return { skips, ghost: rng() < 0.5 ? 5 : 6, borrow: 5 };
  }

  const shifted = (clock, minutes) => {
    const total = night.minutes(clock) + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  // The wall clock: ten minutes fast for the rest of an order once it has skipped.
  function wallClock(clock) {
    return game.state.phase === 'shift' && seen.skipped.has(game.order().id) ? shifted(clock, 10) : clock;
  }

  // The POS item count, briefly showing five.
  const posCount = count => (time.now < ghostUntil ? 5 : count);

  // A customer's parting line: on the borrowing order, the previous customer's.
  function exitLine(order) {
    if (order.index !== plan.borrow || order.mismatch) return order.exitLine;
    return game.orders[order.index - 1].exitLine || order.exitLine;
  }

  function update() {
    if (game.state.phase !== 'shift' || !game.state.scannedIds.length) return;
    const o = game.order();
    if (plan.skips.includes(o.index) && !seen.skipped.has(o.id)) {
      seen.skipped.add(o.id);
      audio.clockSkip();
    }
    if (plan.ghost === o.index && !seen.ghosted.has(o.id)) {
      seen.ghosted.add(o.id);
      ghostUntil = time.now + 650;
    }
  }

  // The tubes flicker now and then, more often as the night wears on; after three a
  // flicker sometimes shows the other frequency's colours instead of a dip.
  function scheduleFlicker() {
    const level = night.progress();
    time.after(3200 + Math.random() * (10000 - level * 6500), () => {
      const { scene, state } = game;
      if (scene.mood === 'normal' && state.phase === 'shift') {
        const mood = level > 0.5 && Math.random() < level * 0.3 ? 'echo' : 'dim';
        scene.mood = mood;
        audio.tubeFlicker();
        time.after(mood === 'echo' ? 110 : 70, () => { if (scene.mood === mood) scene.mood = 'normal'; });
      }
      scheduleFlicker();
    });
  }

  root.NSF.drift = {
    attach(controller) {
      game = controller;
      plan = makePlan(controller.shift.seed);
      scheduleFlicker();
    },
    update, wallClock, posCount, exitLine,
    get plan() { return plan; },
  };
})(globalThis);
