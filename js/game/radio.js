// The counter radio, tuned along the bottom of the FM band. 87.6 plays Night
// Ferry's scheduled segments; 87.7 picks up the neighbouring frequency, which reads
// the register's records back with a different history; between them lie faint
// signals and static. Frequencies are in hundredths of a megahertz. Captions are
// string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings, story, night, overlay } = root.NSF;
  const BAND = story.radio.band;
  const label = freq => (freq % 10 ? (freq / 100).toFixed(2) : (freq / 100).toFixed(1));

  // `kind`: 'ferry' (87.6), 'echo' (87.7), 'signal' (someone's frequency) or 'static'.
  const view = {
    freq: BAND.ferry, station: label(BAND.ferry), kind: 'ferry', song: null,
    key: null, vars: {}, startedAt: 0, duration: 0, echo: false, offAir: false, dialOpen: false,
  };
  // Queued Night Ferry entries: { key, vars } or { song }; `keep` marks the clerk's own
  // moments on air (their text read out, the song it asked for, their call), which a
  // new order's segment never discards. `current` is the entry on air.
  let queue = [];
  let current = null;
  let lineTimer = null;
  let echoProvider = () => null;
  let signalProvider = () => null;
  let listener = () => {};
  let finished = [];
  // Songs are a short interlude so an order never waits on a full arrangement: as many
  // whole bars as fit in 15 s. The synth is stopped by the next line.
  const songLength = id => {
    const song = story.radio.songs[id], bar = 4 * 60000 / song.tempo;
    return Math.min(song.chords.length, Math.max(1, Math.floor(15000 / bar))) * bar;
  };
  const entry = line => (typeof line === 'string' ? { key: line, vars: {} } : line);

  function lineDuration(key, vars) {
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  // What is heard now: a line, a song (`song` its id) or nothing. Everything heard is
  // reported to the listener (js/game/company.js).
  function show(key, vars = {}, song = null) {
    if (view.song && !song) audio.stopSong();
    view.key = key;
    view.vars = vars;
    view.song = song;
    view.echo = view.kind === 'echo';
    view.startedAt = time.now;
    view.duration = song ? songLength(song) : key ? lineDuration(key, vars) : 0;
    if (song) audio.playSong(story.radio.songs[song]);
    else if (key && key !== 'radio.static') audio.radioVoice(Math.min(view.duration - 600, 5200), view.kind !== 'ferry');
    if (key) listener(view);
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
    current = next || null;
    if (!next) {
      show(null);
      const callbacks = finished;
      finished = [];
      callbacks.forEach(fn => fn());
      return;
    }
    if (next.song) show('radio.song', { title: '@' + story.radio.songs[next.song].title }, next.song);
    else show(next.key, next.vars);
    lineTimer = time.after(view.duration, advance);
  }

  // Queue Night Ferry lines (string keys, { key, vars } or { song }); resolves when
  // they have all been heard on 87.6.
  function play(lines) {
    queue.push(...lines.map(entry));
    const done = new Promise(resolve => finished.push(resolve));
    if (view.kind === 'ferry' && !lineTimer) advance();
    return done;
  }

  // A new order's segment replaces whatever ordinary lines of the last one are still
  // waiting, but not the clerk's own moments on air. A line already on 87.6 is cut
  // unless it is one of those; on another frequency, that keeps playing and the new
  // segment waits for the clerk to tune back.
  function beginOrder(lines) {
    queue = [...queue.filter(line => line.keep), ...lines.map(entry)];
    if (view.kind !== 'ferry' || view.offAir || current?.keep) return;
    time.cancel(lineTimer);
    lineTimer = null;
    advance();
  }

  // While the phone, records or lost and found are open the shift is paused: Night
  // Ferry goes quiet, and a song in progress starts again from the top afterwards.
  let held = false;
  function hold() {
    if (held) return;
    held = true;
    audio.radioHeld = true;
    if (view.song) {
      queue.unshift(current || { song: view.song });
      time.cancel(lineTimer);
      lineTimer = null;
      show(null);
    }
  }
  function release() {
    if (!held) return;
    held = false;
    audio.radioHeld = false;
    if (!lineTimer) advance();
  }

  function kindOf(freq) {
    if (freq === BAND.ferry) return 'ferry';
    if (freq === BAND.echo) return 'echo';
    return story.tonight.signals.some(s => s.freq === freq) ? 'signal' : 'static';
  }

  // Turn the dial to `freq` (snapped to the band's steps).
  function setFrequency(freq) {
    const next = Math.max(BAND.low, Math.min(BAND.high, Math.round(freq / BAND.step) * BAND.step));
    if (next === view.freq) return;
    // The current Night Ferry line (or song, from the top) is replayed when the player
    // tunes back.
    if (view.kind === 'ferry' && view.key && !view.offAir) queue.unshift(current || (view.song ? { song: view.song } : { key: view.key, vars: view.vars }));
    view.freq = next;
    view.station = label(next);
    view.kind = kindOf(next);
    audio.radioTune();
    audio.radioStation(view.offAir && view.kind === 'ferry' ? 'static' : view.kind, night.progress());
    show(null);
    time.cancel(lineTimer);
    lineTimer = time.after(300, advance);
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

  function closeDial() { view.dialOpen = false; overlay.close('radio'); }

  root.NSF.radio = {
    view, band: BAND, label, play, beginOrder, hold, release, tune, setFrequency, skip, signOff,
    step(direction) { setFrequency(view.freq + direction * BAND.step); },
    openDial() {
      if (view.dialOpen) return closeDial();
      if (!overlay.open('radio', { pause: false })) return;
      view.dialOpen = true;
      audio.phoneKey();
    },
    closeDial,
    // Arrow keys tune while the dial is open; Escape puts it away.
    key(name) {
      if (!view.dialOpen) return false;
      if (name === 'ArrowLeft' || name === 'ArrowRight') setFrequency(view.freq + (name === 'ArrowLeft' ? -1 : 1) * BAND.step);
      else if (name === 'Escape') closeDial();
      else return false;
      return true;
    },
    setEchoProvider(fn) { echoProvider = fn; },
    setSignalProvider(fn) { signalProvider = fn; },
    setListener(fn) { listener = fn; },
    // How long a run of Night Ferry lines takes on air.
    duration: lines => lines.reduce((sum, line) => sum + (typeof line === 'string' ? lineDuration(line)
      : line.song ? songLength(line.song) : lineDuration(line.key, line.vars)), 0),
    caption() {
      if (!view.key) return '';
      return strings.t(view.key, view.vars);
    },
    // Fraction of the caption revealed, for a slow typewriter; a song's title shows at once.
    progress() {
      if (!view.key) return 0;
      return view.song ? 1 : Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55));
    },
  };
})(globalThis);
