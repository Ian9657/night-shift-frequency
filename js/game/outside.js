// Life outside the window: cars passing on the wet street, the suspended ferry
// crossing the bay anyway late at night, drops sliding down the glass, the rain
// easing toward dawn and the tower's light. Everything is a function of the game
// clock, so it pauses with the phone and speeds up in tests; `update` only fires the
// sound when a car starts across.
(function (root) {
  'use strict';
  const { time, audio, night, radio } = root.NSF;
  const hash = n => { let h = (n * 374761393) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  const CAR_CYCLE = 21000, CAR_MS = 2300;
  // A car crosses in some cycles; fewer as the night goes on, more again toward dawn.
  function car() {
    const cycle = Math.floor(time.now / CAR_CYCLE), into = time.now - cycle * CAR_CYCLE;
    const p = night.progress();
    const chance = p < 0.6 ? 0.7 - p * 0.6 : 0.34 + (p - 0.6) * 1.1;
    if (into > CAR_MS || hash(cycle) > chance) return null;
    return { cycle, f: into / CAR_MS, leftward: hash(cycle + 7) < 0.5, near: hash(cycle + 13) < 0.5 };
  }

  // The ferry is suspended (Night Ferry says so at the start). After three it crosses
  // the bay anyway, once each 100 s, lights on.
  const FERRY_CYCLE = 100000, FERRY_MS = 80000;
  function ferry() {
    if (night.progress() < 0.5) return null;
    const into = time.now % FERRY_CYCLE;
    return into < FERRY_MS ? into / FERRY_MS : null;
  }

  // 1 until half past three, easing to a drizzle by five.
  function rain() {
    const p = night.progress();
    return p < 0.625 ? 1 : Math.max(0.3, 1 - (p - 0.625) * 1.9);
  }

  // The tower's light blinks slowly; while the echo speaks on 87.7 it keeps time with
  // the voice instead.
  function tower() {
    if (radio.view.echo && radio.view.key) return (time.now - radio.view.startedAt) % 760 < 300;
    return time.now % 1600 < 420;
  }

  // Lit windows along the far shore, each going out at its own point in the night, all
  // dark by five. One stays on all night, like the store's: it blinks back twice when
  // the store's tubes flicker after two, or when June reads the clerk's text, and goes
  // out when Night Ferry signs off.
  const TOWN = Array.from({ length: 24 }, (_, i) => ({
    u: hash(i + 500), dy: Math.floor(hash(i + 600) * 6), bright: hash(i + 800) < 0.3, outAt: 0.08 + hash(i + 700) * 0.8,
  }));
  let answerAt = -Infinity;
  function town() {
    const p = night.progress();
    return TOWN.filter(light => light.outAt > p);
  }
  function otherWindow() {
    if (radio.view.offAir) return false;
    const t = time.now - answerAt;
    return !(t >= 0 && t < 600 && Math.floor(t / 150) % 2 === 0);
  }
  function answer() {
    if (night.progress() > 0.25 && time.now - answerAt > 2000) answerAt = time.now + 900;
  }

  let lastCar = null;
  function update() {
    const c = car();
    if (c && c.cycle !== lastCar && c.f < 0.2) {
      lastCar = c.cycle;
      audio.carPass(c.near);
    }
  }

  root.NSF.outside = { car, ferry, rain, tower, town, otherWindow, answer, update, hash };
})(globalThis);
