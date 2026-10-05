// Customer speech bubble: typewriter timing, multi-line sequences and the
// input lock used by a few deliberate lines. Lines are string keys.
(function (root) {
  'use strict';
  const { time, audio, strings } = root.NSF;
  const TYPE_MS = 26, COMMA_MS = 60, STOP_MS = 90, BETWEEN_LINES_MS = 1350;

  const view = { key: null, vars: {}, shown: 0, revision: 0 };
  let locked = false;
  let timers = [];

  function delayAfter(ch) {
    if (/[.!?…]/.test(ch)) return STOP_MS;
    if (/[,;]/.test(ch)) return COMMA_MS;
    return TYPE_MS;
  }
  function typingDuration(key, vars) {
    if (!key) return 0;
    return [...strings.t(key, vars)].reduce((sum, ch) => sum + delayAfter(ch), TYPE_MS);
  }
  function readTime(key, vars) { return key ? typingDuration(key, vars) + BETWEEN_LINES_MS : 0; }

  function clearTimers() { timers.forEach(time.cancel); timers = []; }

  function display(key, vars = {}) {
    view.key = key;
    view.vars = vars;
    view.shown = 0;
    const revision = ++view.revision;
    audio.resetTicks();
    if (!key) return;
    const tick = () => {
      if (revision !== view.revision) return;
      const text = [...strings.t(key, vars)];
      if (view.shown >= text.length) return;
      view.shown += 1;
      audio.dialogueTick(text[view.shown - 1]);
      if (view.shown < text.length) timers.push(time.after(delayAfter(text[view.shown - 1]), tick));
    };
    timers.push(time.after(TYPE_MS, tick));
  }

  // lines: array of string keys or { text, lock } entries.
  function say(lines, options = {}) {
    clearTimers();
    locked = false;
    const entries = (lines || []).map(line => (typeof line === 'string' ? { text: line } : line)).filter(e => e.text);
    const vars = options.vars || {};
    display(entries[0]?.text || null, vars);
    let delay = 0;
    entries.slice(1).forEach((entry, i) => {
      delay += typingDuration(entries[i].text, vars) + BETWEEN_LINES_MS;
      timers.push(time.after(delay, () => display(entry.text, vars)));
    });
    if (options.lock && entries.length) {
      locked = true;
      const total = entries.reduce((sum, e, i) => sum + typingDuration(e.text, vars) + (i < entries.length - 1 ? BETWEEN_LINES_MS : 0), 0);
      timers.push(time.after(total + 180, () => { locked = false; }));
    }
  }

  function clear() { say([]); }

  root.NSF.dialogue = {
    say, clear, readTime,
    get locked() { return locked; },
    // Visible text for the current language, respecting typewriter progress.
    visibleText() { return view.key ? [...strings.t(view.key, view.vars)].slice(0, view.shown).join('') : ''; },
    fullText() { return view.key ? strings.t(view.key, view.vars) : ''; },
  };
})(globalThis);
