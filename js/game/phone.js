// The clerk's flip phone as the settings menu: clicking it on the counter flips it
// open close up and pauses the shift; its screen lists the volume levels and silent
// mode. Settings are a per-browser convenience kept in localStorage.
(function (root) {
  'use strict';
  const { time, audio } = root.NSF;
  const FRAME_MS = 70;                                      // closed → half → open
  const ROWS = ['master', 'radio', 'sounds', 'silent'];
  const STORE = 'nsf.settings';
  const view = { open: false, closing: false, since: 0, row: 0 };

  function save() {
    try {
      root.localStorage.setItem(STORE, JSON.stringify({ ...Object.fromEntries(ROWS.slice(0, 3).map(r => [r, audio.level(r)])), silent: audio.muted }));
    } catch (_) { /* storage unavailable: settings last for this visit */ }
  }
  function load() {
    try {
      const saved = JSON.parse(root.localStorage.getItem(STORE) || 'null');
      if (!saved) return;
      for (const r of ROWS.slice(0, 3)) if (Number.isFinite(saved[r])) audio.setLevel(r, saved[r]);
      audio.muted = Boolean(saved.silent);
    } catch (_) { /* unreadable: keep defaults */ }
  }

  function open() {
    if (view.open) return;
    Object.assign(view, { open: true, closing: false, since: time.uiNow, row: 0 });
    time.paused = true;
    audio.radioDucked = true;
    audio.phoneFlip(true);
  }
  function close() {
    if (!view.open || view.closing) return;
    Object.assign(view, { closing: true, since: time.uiNow });
    time.paused = false;
    audio.radioDucked = false;
    audio.phoneFlip(false);
  }

  // Which drawing of the phone shows now: 0 closed, 1 half open, 2 open; the phone
  // is put away once it has shut.
  function frame() {
    const step = Math.floor((time.uiNow - view.since) / FRAME_MS);
    if (!view.closing) return Math.min(2, step);
    if (step > 2) { view.open = false; view.closing = false; }
    return Math.max(0, 2 - step);
  }

  function setLevel(row, value) {
    audio.setLevel(row, value);
    audio.phoneKey();
    save();
  }
  function toggleSilent() {
    audio.muted = !audio.muted;
    audio.phoneKey();
    save();
  }
  function change(row, delta) {
    if (row === 'silent') toggleSilent();
    else setLevel(row, audio.level(row) + delta);
  }

  // A key on the handset (clicked) or its keyboard equivalent.
  function press(key) {
    if (!view.open || view.closing) return;
    const row = ROWS[view.row];
    if (key === 'up' || key === 'down') {
      view.row = (view.row + (key === 'up' ? ROWS.length - 1 : 1)) % ROWS.length;
      audio.phoneKey();
    } else if (key === 'left' || key === 'right') change(row, key === 'left' ? -1 : 1);
    else if (key === 'ok') { if (row === 'silent') toggleSilent(); }
    else if (key === 'back') close();
  }
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', ' ': 'ok', Escape: 'back', Backspace: 'back' };
  function key(name) {
    if (!view.open) return false;
    if (KEYS[name]) press(KEYS[name]);
    return true;
  }

  load();
  root.NSF.phone = {
    view, rows: ROWS, open, close, frame, press, key, setLevel, toggleSilent,
    select(index) { view.row = index; },
  };
})(globalThis);
