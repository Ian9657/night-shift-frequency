// The clerk's flip phone: clicking it on the counter flips it open close up and pauses
// the shift. Its menu leads to the texts (js/game/messages.js), a text to Night Ferry,
// a call to it once the lines are open, and the settings: volume levels and silent
// mode, a per-browser convenience kept in localStorage.
(function (root) {
  'use strict';
  const { time, audio, messages, signin } = root.NSF;
  const FRAME_MS = 70;                                      // closed → half → open
  const SETTINGS = ['master', 'radio', 'sounds', 'silent'];
  const HOME = ['inbox', 'compose', 'call', 'settings'];
  const STORE = 'nsf.settings';
  // screen: 'home', 'inbox', 'read' (a text, `reading` its id), 'compose', 'call' or
  // 'settings'.
  const view = { open: false, closing: false, since: 0, screen: 'home', row: 0, reading: null };

  function save() {
    try {
      root.localStorage.setItem(STORE, JSON.stringify({ ...Object.fromEntries(SETTINGS.slice(0, 3).map(r => [r, audio.level(r)])), silent: audio.muted }));
    } catch (_) { /* storage unavailable: settings last for this visit */ }
  }
  function load() {
    try {
      const saved = JSON.parse(root.localStorage.getItem(STORE) || 'null');
      if (!saved) return;
      for (const r of SETTINGS.slice(0, 3)) if (Number.isFinite(saved[r])) audio.setLevel(r, saved[r]);
      audio.muted = Boolean(saved.silent);
    } catch (_) { /* unreadable: keep defaults */ }
  }

  // The rows the current screen lists.
  function rows() {
    if (view.screen === 'home') return HOME;
    if (view.screen === 'settings') return SETTINGS;
    if (view.screen === 'inbox') return messages.inbox().map(m => m.id);
    if (view.screen === 'compose') return messages.sent ? [] : messages.presets.map(p => p.id);
    if (view.screen === 'call') return messages.linesOpen() ? messages.calls.map(c => c.id) : [];
    return [];
  }
  function go(screen, row = 0) {
    view.screen = screen;
    view.row = row;
    audio.phoneKey();
  }

  function open() {
    if (view.open) return;
    Object.assign(view, { open: true, closing: false, since: time.uiNow, screen: 'home', row: messages.unread() ? 0 : view.row % HOME.length, reading: null });
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

  // OK on a row: open it, read it, send it or toggle it.
  function choose(index) {
    const list = rows(), row = list[index];
    if (row === undefined) return;
    view.row = index;
    if (view.screen === 'home') go(row);
    else if (view.screen === 'inbox') { messages.open(row); view.reading = row; go('read'); }
    else if (view.screen === 'compose') { if (messages.send(row)) view.row = 0; }
    else if (view.screen === 'call') { if (messages.callIn(row, signin.name)) view.row = 0; }
    else if (view.screen === 'settings' && row === 'silent') toggleSilent();
  }
  function back() {
    if (view.screen === 'home') close();
    else if (view.screen === 'read') go('inbox', Math.max(0, messages.inbox().findIndex(m => m.id === view.reading)));
    else go('home', HOME.indexOf(view.screen));
  }

  // A key on the handset (clicked) or its keyboard equivalent.
  function press(key) {
    if (!view.open || view.closing) return;
    const list = rows();
    if ((key === 'up' || key === 'down') && list.length) {
      view.row = (view.row + (key === 'up' ? list.length - 1 : 1)) % list.length;
      audio.phoneKey();
    } else if ((key === 'left' || key === 'right') && view.screen === 'settings') change(list[view.row], key === 'left' ? -1 : 1);
    else if (key === 'ok') choose(view.row);
    else if (key === 'back') back();
  }
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', ' ': 'ok', Escape: 'back', Backspace: 'back' };
  function key(name) {
    if (!view.open) return false;
    if (KEYS[name]) press(KEYS[name]);
    return true;
  }

  load();
  root.NSF.phone = {
    view, rows, open, close, frame, press, key, choose, setLevel, toggleSilent,
    select(index) { view.row = index; },
  };
})(globalThis);
