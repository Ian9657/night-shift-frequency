// Customer speech bubble: lines are queued and typed out one at a time. A line that
// has started always finishes typing and stays up long enough to read before the next
// one replaces it, so a reaction to the clerk's action never cuts off or swallows what
// the customer was saying. Lines are string keys; `lock` holds input until a line has
// been typed out.
(function (root) {
  'use strict';
  const { time, audio, strings } = root.NSF;
  const TYPE_MS = 26, COMMA_MS = 60, STOP_MS = 90;
  // How long a finished line stays before the next one: a full beat, or a shorter one
  // when more lines are waiting so replies don't fall behind the counter.
  const HOLD_MS = 1350, HOLD_BUSY_MS = 800;

  const view = { key: null, vars: {}, shown: 0, revision: 0 };
  let queue = [];                 // { text, vars, lock }
  let current = null;             // the entry on screen, with `typedAt` (game time it finishes typing)
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

  function clearTimers() { timers.forEach(time.cancel); timers = []; }

  function display(entry) {
    current = entry;
    view.key = entry ? entry.text : null;
    view.vars = entry ? entry.vars : {};
    view.shown = 0;
    const revision = ++view.revision;
    audio.resetTicks();
    if (!entry) return;
    entry.typedAt = time.now + typingDuration(entry.text, entry.vars);
    const text = [...strings.t(entry.text, entry.vars)];
    const tick = () => {
      if (revision !== view.revision || view.shown >= text.length) return;
      view.shown += 1;
      audio.dialogueTick(text[view.shown - 1]);
      if (view.shown < text.length) timers.push(time.after(delayAfter(text[view.shown - 1]), tick));
      else next();
    };
    timers.push(time.after(TYPE_MS, tick));
  }

  // Once the line on screen is typed out, the next waiting line follows after a hold.
  function next() {
    if (!queue.length) return;
    const wait = Math.max(0, current ? current.typedAt + (queue.length > 1 ? HOLD_BUSY_MS : HOLD_MS) - time.now : 0);
    timers.push(time.after(wait, () => display(queue.shift())));
  }

  // Queue lines (string keys or { text, lock } entries). A line identical to the one
  // just before it (on screen or waiting) is said once.
  function say(lines, options = {}) {
    const vars = options.vars || {};
    const before = queue.length ? queue[queue.length - 1] : current && view.shown < [...strings.t(current.text, current.vars)].length ? current : null;
    let last = before ? before.text : null;
    for (const line of lines || []) {
      const entry = typeof line === 'string' ? { text: line } : line;
      if (!entry.text || entry.text === last) continue;
      queue.push({ text: entry.text, vars, lock: Boolean(options.lock || entry.lock) });
      last = entry.text;
    }
    const idle = !current || view.shown >= [...strings.t(current.text, current.vars)].length;
    if (idle && queue.length) {
      clearTimers();
      if (!current) display(queue.shift());
      else next();
    }
  }

  // Hide the bubble and forget anything waiting (between customers, at the ending).
  function clear() {
    clearTimers();
    queue = [];
    display(null);
  }

  // Game-time ms until everything queued has been typed out and read.
  function remaining() {
    if (!current) return 0;
    let at = current.typedAt;
    for (const entry of queue) at = Math.max(at + HOLD_BUSY_MS, time.now) + typingDuration(entry.text, entry.vars);
    return Math.max(0, at + HOLD_BUSY_MS - time.now);
  }

  root.NSF.dialogue = {
    say, clear, remaining,
    // Input waits while a locked line is waiting or still being typed.
    get locked() {
      return queue.some(entry => entry.lock) || Boolean(current?.lock && time.now < current.typedAt + 180);
    },
    // Visible text for the current language, respecting typewriter progress.
    visibleText() { return view.key ? [...strings.t(view.key, view.vars)].slice(0, view.shown).join('') : ''; },
    fullText() { return view.key ? strings.t(view.key, view.vars) : ''; },
  };
})(globalThis);
