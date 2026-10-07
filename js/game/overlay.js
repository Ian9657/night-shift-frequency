// Shared modal state: one inspection panel at a time. The phone, the records and lost
// and found pause the shift (the game clock stops and Night Ferry goes quiet; the room
// keeps its sound). The radio's dial is exclusive too but stays live, since tuning is
// listening.
(function (root) {
  'use strict';
  const { time } = root.NSF;
  // The radio is looked up when needed: it loads after this module, since it uses it.
  let active = null, pausing = false;
  const view = { get active() { return active; } };

  function open(name, { pause = true } = {}) {
    if (active && active !== name) return false;
    active = name;
    pausing = pause;
    if (pause) {
      time.paused = true;
      root.NSF.radio.hold();
    }
    return true;
  }
  function close(name) {
    if (active !== name) return false;
    active = null;
    if (pausing) {
      time.paused = false;
      root.NSF.radio.release();
    }
    pausing = false;
    return true;
  }
  root.NSF.overlay = { view, open, close };
})(globalThis);
