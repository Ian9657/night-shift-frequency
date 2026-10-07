// The counter radio, tuned along the bottom of the FM band. 87.6 plays Night
// Ferry's scheduled segments; 87.7 picks up the neighbouring frequency, which reads
// the register's records back with a different history; between them lie faint
// signals and static. Frequencies are in hundredths of a megahertz. Captions are
// string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings, story } = root.NSF;
  const BAND = story.radio.band;
  const label = freq => (freq % 10 ? (freq / 100).toFixed(2) : (freq / 100).toFixed(1));

  // `kind`: 'ferry' (87.6), 'echo' (87.7), 'signal' (someone's frequency) or 'static'.
  const view = {
    freq: BAND.ferry, station: label(BAND.ferry), kind: 'ferry',
    key: null, vars: {}, startedAt: 0, duration: 0, echo: false, offAir: false, dialOpen: false,
  };
  let queue = [];
  let lineTimer = null;
  let echoProvider = () => null;
  let signalProvider = () => null;
  let finished = [];

  function lineDuration(key, vars) {
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  function show(key, vars = {}) {
    view.key = key;
    view.vars = vars;
    view.echo = view.kind === 'echo';
    view.startedAt = time.now;
    view.duration = key ? lineDuration(key, vars) : 0;
    if (key && key !== 'radio.static') audio.radioVoice(Math.min(view.duration - 600, 5200), view.kind !== 'ferry');
  }

  // Off Night Ferry, a provider says what is on this frequency now; static repeats.
  function other() {
    const line = view.kind === 'echo' ? echoProvider() : view.kind === 'signal' ? signalProvider(view.freq) : null;
    show(line?.key || 'radio.static', line?.vars);
    lineTimer = time.after(view.duration + (line ? 2400 : 1500), advance);
  }

  function advance() {
    time.cancel(lineTimer);
    lineTimer = null;
    if (view.kind !== 'ferry' || view.offAir) return other();
    const next = queue.shift();
    if (!next) {
      show(null);
      const callbacks = finished;
      finished = [];
      callbacks.forEach(fn => fn());
      return;
    }
    show(next.key, next.vars);
    lineTimer = time.after(view.duration, advance);
  }

  // Queue Night Ferry lines (string keys, or { key, vars }); resolves when they have
  // all been heard on 87.6.
  function play(lines) {
    queue.push(...lines.map(line => (typeof line === 'string' ? { key: line, vars: {} } : line)));
    const done = new Promise(resolve => finished.push(resolve));
    if (view.kind === 'ferry' && !lineTimer) advance();
    return done;
  }

  function kindOf(freq) {
    if (freq === BAND.ferry) return 'ferry';
    if (freq === BAND.echo) return 'echo';
    return story.radio.signals.some(s => s.freq === freq) ? 'signal' : 'static';
  }

  // Turn the dial to `freq` (snapped to the band's steps).
  function setFrequency(freq) {
    const next = Math.max(BAND.low, Math.min(BAND.high, Math.round(freq / BAND.step) * BAND.step));
    if (next === view.freq) return;
    // The current Night Ferry line is replayed when the player tunes back.
    if (view.kind === 'ferry' && view.key && !view.offAir) queue.unshift({ key: view.key, vars: view.vars });
    view.freq = next;
    view.station = label(next);
    view.kind = kindOf(next);
    audio.radioTune();
    audio.radioStation(view.offAir && view.kind === 'ferry' ? 'static' : view.kind);
    show(null);
    time.cancel(lineTimer);
    lineTimer = time.after(450, advance);
  }

  // Tune straight to a station by its label ('87.6'), as the ending does.
  function tune(station) {
    setFrequency(Math.round(Number(station) * 100));
  }

  // Skip the current Night Ferry line (used when the ending is clicked through).
  function skip() {
    if (view.kind === 'ferry' && view.key && !view.offAir) advance();
  }

  // After Night Ferry signs off, 87.6 carries only static.
  function signOff() {
    view.offAir = true;
    if (view.kind !== 'ferry') return;
    audio.radioStation('static');
    time.cancel(lineTimer);
    other();
  }

  root.NSF.radio = {
    view, band: BAND, label, play, tune, setFrequency, skip, signOff,
    step(direction) { setFrequency(view.freq + direction * BAND.step); },
    openDial() { view.dialOpen = !view.dialOpen; audio.phoneKey(); },
    closeDial() { view.dialOpen = false; },
    // Arrow keys tune while the dial is open; Escape puts it away.
    key(name) {
      if (!view.dialOpen) return false;
      if (name === 'ArrowLeft' || name === 'ArrowRight') setFrequency(view.freq + (name === 'ArrowLeft' ? -1 : 1) * BAND.step);
      else if (name === 'Escape') view.dialOpen = false;
      else return false;
      return true;
    },
    setEchoProvider(fn) { echoProvider = fn; },
    setSignalProvider(fn) { signalProvider = fn; },
    // How long a run of Night Ferry lines takes on air.
    duration: keys => keys.reduce((sum, key) => sum + lineDuration(key), 0),
    caption() {
      if (!view.key) return '';
      return strings.t(view.key, view.vars);
    },
    // Fraction of the caption revealed, for a slow typewriter.
    progress() { return view.key ? Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55)) : 0; },
  };
})(globalThis);
