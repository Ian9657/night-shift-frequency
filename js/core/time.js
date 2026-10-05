// One game clock drives every wait, tween and timer. Tests raise `speed`
// instead of patching browser timers.
(function (root) {
  'use strict';
  let now = 0;
  let speed = 1;
  let last = null;
  let timers = [];
  let nextId = 1;
  const frameHandlers = [];

  function after(ms, fn) {
    const id = nextId++;
    timers.push({ id, at: now + ms, fn });
    return id;
  }
  function cancel(id) { timers = timers.filter(t => t.id !== id); }
  function wait(ms) { return new Promise(resolve => after(ms, resolve)); }

  // Linear interpolation between points, snapped to whole world pixels and
  // held in ~70ms steps so motion reads as frames rather than smooth easing.
  function path(points, duration, apply) {
    return new Promise(resolve => {
      const start = now;
      const stepMs = 70;
      const handler = () => {
        const elapsed = Math.min(duration, now - start);
        const stepped = elapsed >= duration ? duration : Math.floor(elapsed / stepMs) * stepMs;
        const t = duration ? stepped / duration : 1;
        let i = 1;
        while (i < points.length - 1 && points[i].t < t) i++;
        const a = points[i - 1], b = points[i];
        const f = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
        apply(Math.round(a.x + (b.x - a.x) * f), Math.round(a.y + (b.y - a.y) * f));
        if (elapsed >= duration) {
          frameHandlers.splice(frameHandlers.indexOf(handler), 1);
          resolve();
        }
      };
      frameHandlers.push(handler);
      handler();
    });
  }

  function tick(timestamp) {
    if (last !== null) now += Math.min(100, timestamp - last) * speed;
    last = timestamp;
    for (;;) {
      const due = timers.filter(t => t.at <= now).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      cancel(due.id);
      due.fn();
    }
    for (const handler of [...frameHandlers]) handler();
  }

  const api = {
    get now() { return now; },
    get speed() { return speed; },
    set speed(value) { speed = Math.max(0.1, Number(value) || 1); },
    after, cancel, wait, path, tick,
    onFrame(fn) { frameHandlers.push(fn); },
  };
  (root.NSF = root.NSF || {}).time = api;
})(globalThis);
