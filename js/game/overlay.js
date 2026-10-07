// Shared modal state. Exactly one inspection panel may own the game pause at a time.
(function (root) {
  'use strict';
  const { time, audio } = root.NSF;
  let active = null;
  const view = { get active() { return active; } };

  function open(name) {
    if (active && active !== name) return false;
    active = name;
    time.paused = true;
    audio.paused = true;
    return true;
  }
  function close(name) {
    if (active !== name) return false;
    active = null;
    time.paused = false;
    audio.paused = false;
    return true;
  }
  root.NSF.overlay = { view, open, close };
})(globalThis);
