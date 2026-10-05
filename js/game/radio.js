// The counter radio. 87.6 plays Night Ferry's scheduled segments; 87.7 picks up
// the neighbouring frequency, which reads the register's records back with a
// different history. Captions are string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings } = root.NSF;
  const STATIONS = ['87.6', '87.7'];

  const view = { station: '87.6', key: null, vars: {}, startedAt: 0, duration: 0, echo: false };
  let queue = [];
  let lineTimer = null;
  let echoProvider = () => null;
  let finished = [];

  function lineDuration(key, vars) {
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  function show(key, vars = {}, echo = false) {
    view.key = key;
    view.vars = vars;
    view.echo = echo;
    view.startedAt = time.now;
    view.duration = key ? lineDuration(key, vars) : 0;
    if (key) audio.radioVoice(Math.min(view.duration - 600, 5200), echo);
  }

  function advance() {
    time.cancel(lineTimer);
    lineTimer = null;
    if (view.station === '87.7') {
      const line = echoProvider();
      show(line?.key || null, line?.vars, true);
      lineTimer = time.after(line ? view.duration + 2400 : 1500, advance);
      return;
    }
    const next = queue.shift();
    if (!next) {
      show(null);
      const callbacks = finished;
      finished = [];
      callbacks.forEach(fn => fn());
      return;
    }
    show(next);
    lineTimer = time.after(view.duration, advance);
  }

  // Queue Night Ferry lines; resolves when they have all been heard on 87.6.
  function play(keys) {
    queue.push(...keys);
    const done = new Promise(resolve => finished.push(resolve));
    if (view.station === '87.6' && !lineTimer) advance();
    return done;
  }

  function tune(station) {
    const next = station || STATIONS[(STATIONS.indexOf(view.station) + 1) % STATIONS.length];
    if (next === view.station) return;
    // The current Night Ferry line is replayed when the player tunes back.
    if (view.station === '87.6' && view.key && !view.echo) queue.unshift(view.key);
    view.station = next;
    audio.radioTune();
    audio.radioStation(next);
    show(null);
    time.cancel(lineTimer);
    lineTimer = time.after(450, advance);
  }

  // Skip the current Night Ferry line (used when the ending is clicked through).
  function skip() {
    if (view.station === '87.6' && view.key) advance();
  }

  root.NSF.radio = {
    view, play, tune, skip,
    setEchoProvider(fn) { echoProvider = fn; },
    caption() {
      if (!view.key) return '';
      return strings.t(view.key, view.vars);
    },
    // Fraction of the caption revealed, for a slow typewriter.
    progress() { return view.key ? Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55)) : 0; },
  };
})(globalThis);
