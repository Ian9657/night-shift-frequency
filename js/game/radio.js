// The counter radio, tuned along the bottom of the FM band. 87.6 plays Night
// Ferry's scheduled segments; 87.7 picks up the neighbouring frequency, which reads
// the register's records back with a different history; between them lie faint
// signals and static. Frequencies are in hundredths of a megahertz. Captions are
// string keys resolved at draw time.
(function (root) {
  'use strict';
  const { time, audio, strings, story, night, overlay, voice } = root.NSF;
  const BAND = story.radio.band;
  const label = freq => (freq % 10 ? (freq / 100).toFixed(2) : (freq / 100).toFixed(1));
  // A transmitter comes in over a window either side of its frequency: clear on it,
  // fainter and noisier a step or two off, gone three hundredths away.
  const WINDOW = 3;

  // `kind`: 'ferry' (87.6), 'echo' (87.7), 'signal' (someone's frequency) or 'static'.
  // `target` is the transmitter in range and `clarity` (0–1) how cleanly it comes in.
  const view = {
    freq: BAND.ferry, station: label(BAND.ferry), kind: 'ferry', target: BAND.ferry, clarity: 1, song: null,
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
  // Queue entries are copies: a song entry notes once its `intro` line has been said.
  const entry = line => (typeof line === 'string' ? { key: line, vars: {} } : { ...line });

  function lineDuration(key, vars) {
    return Math.max(2600, strings.t(key, vars).length * 52 + 1200);
  }

  // What is heard now: a line, a song (`song` its id) or nothing. Everything heard is
  // reported to the listener (js/game/company.js).
  function show(key, vars = {}, song = null) {
    if (view.song && !song) audio.stopSong();
    voice.stop();
    view.key = key;
    view.vars = vars;
    view.song = song;
    view.echo = view.kind === 'echo';
    view.startedAt = time.now;
    view.duration = song ? songLength(song) : key ? lineDuration(key, vars) : 0;
    if (song) audio.playSong(story.radio.songs[song]);
    else if (key && key !== 'radio.static') voice.speak(key, vars, view.kind, view.duration - 600);
    if (key) listener(view);
  }

  // The background hiss and hum for what the dial is on and how cleanly.
  function tuneBed() {
    audio.radioStation(view.offAir && view.kind === 'ferry' ? 'static' : view.kind, night.progress(), view.clarity);
  }

  // Off Night Ferry, a provider says what is on this frequency now; static repeats.
  function other() {
    const line = view.kind === 'echo' ? echoProvider() : view.kind === 'signal' ? signalProvider(view.target) : null;
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
    // A song with an `intro` is announced first; the two go (or are dropped) together.
    if (next.song && next.intro && !next.introSaid) {
      next.introSaid = true;
      queue.unshift(next);
      show(next.intro, {});
    } else if (next.song) show('radio.song', { title: '@' + story.radio.songs[next.song].title }, next.song);
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

  // A new order's segment follows whatever of the last one is still to come, so a quick
  // clerk misses nothing June says: lines carry over, and whatever is on air (a line or
  // a song) finishes. Songs that haven't started and aren't the clerk's own are the one
  // thing let go, each with its intro. An `onTime` segment (the record orders) goes ahead
  // of the carried lines, right after what is on air. On another frequency the queue just
  // waits for the clerk to tune back.
  function beginOrder(lines, { onTime = false } = {}) {
    const kept = queue.filter(line => line.keep), carried = queue.filter(line => !line.keep && !line.song);
    // An on-time segment carries the story (the key's message): it is never let go.
    const fresh = lines.map(line => ({ ...entry(line), ...(onTime ? { story: true } : {}) }));
    queue = onTime ? [...kept, ...fresh, ...carried] : [...kept, ...carried, ...fresh];
    if (view.kind !== 'ferry' || view.offAir || current?.keep) return;
    if (view.key) return;                                          // let what is on air finish
    time.cancel(lineTimer);
    lineTimer = null;
    advance();
  }

  // Before the closing letter: what is left of the night's segments is let go, except the
  // clerk's own moments and the story's lines, which come first.
  function clearSegments() {
    queue = queue.filter(line => line.keep || line.story);
  }

  // While the phone, records or lost and found are open the shift is paused: Night
  // Ferry goes quiet. A song in progress is let go, unless the clerk asked for it, in
  // which case it starts again from the top afterwards.
  let held = false;
  function hold() {
    if (held) return;
    held = true;
    audio.radioHeld = true;
    voice.stop();
    if (view.song) {
      if (current?.keep) queue.unshift(current);
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
    // A line interrupted by the pause goes on speaking for the time it has left.
    else if (view.key && !view.song && view.key !== 'radio.static') voice.speak(view.key, view.vars, view.kind, view.duration - (time.now - view.startedAt) - 600);
  }

  // What the dial picks up at `freq`: the nearest transmitter within the window.
  function reception(freq) {
    const transmitters = [[BAND.ferry, 'ferry'], [BAND.echo, 'echo'], ...story.tonight.signals.map(s => [s.freq, 'signal'])];
    let best = { kind: 'static', target: null, clarity: 0 };
    for (const [at, kind] of transmitters) {
      const clarity = 1 - Math.abs(freq - at) / WINDOW;
      if (clarity > best.clarity) best = { kind, target: at, clarity };
    }
    return best;
  }

  // Turn the dial to `freq`: to the band's steps (the step keys), or, `fine`, to the
  // hundredth (dragging the needle). Moving within the same transmitter's window only
  // changes how cleanly it comes in; crossing to another starts what is on there.
  function setFrequency(freq, { fine = false } = {}) {
    const grain = fine ? 1 : BAND.step;
    const next = Math.max(BAND.low, Math.min(BAND.high, Math.round(freq / grain) * grain));
    if (next === view.freq) return;
    const heard = reception(next);
    if (heard.kind === view.kind && heard.target === view.target) {
      Object.assign(view, { freq: next, station: label(next), clarity: heard.clarity });
      audio.radioTune(true);
      tuneBed();
      return;
    }
    // The current Night Ferry line (or song, from the top) is replayed when the player
    // tunes back.
    // (A song cut during its intro is announced again.)
    if (view.kind === 'ferry' && view.key && !view.offAir) {
      queue.unshift(current ? { ...current, introSaid: Boolean(current.song && view.song) } : (view.song ? { song: view.song } : { key: view.key, vars: view.vars }));
    }
    Object.assign(view, { freq: next, station: label(next), kind: heard.kind, target: heard.target, clarity: heard.clarity });
    audio.radioTune();
    tuneBed();
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
    tuneBed();
    time.cancel(lineTimer);
    other();
  }

  // The step keys move to the next detent of the band (from 87.63, up is 87.65).
  function step(direction) {
    const detent = direction > 0 ? Math.floor(view.freq / BAND.step) + 1 : Math.ceil(view.freq / BAND.step) - 1;
    setFrequency(detent * BAND.step);
  }

  function closeDial() { view.dialOpen = false; overlay.close('radio'); }

  root.NSF.radio = {
    view, band: BAND, label, play, beginOrder, clearSegments, hold, release, tune, setFrequency, skip, signOff,
    step,
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
      if (name === 'ArrowLeft' || name === 'ArrowRight') step(name === 'ArrowLeft' ? -1 : 1);
      else if (name === 'Escape') closeDial();
      else return false;
      return true;
    },
    setEchoProvider(fn) { echoProvider = fn; },
    setSignalProvider(fn) { signalProvider = fn; },
    setListener(fn) { listener = fn; },
    // How long a run of Night Ferry lines takes on air.
    duration: lines => lines.reduce((sum, line) => sum + (typeof line === 'string' ? lineDuration(line)
      : line.song ? songLength(line.song) + (line.intro ? lineDuration(line.intro) : 0) : lineDuration(line.key, line.vars)), 0),
    // Off the centre of a transmitter, some of what is said is lost in the noise: the
    // same letters each time for a line and a clarity, so it doesn't shimmer.
    caption() {
      if (!view.key) return '';
      const text = strings.t(view.key, view.vars);
      if (view.clarity >= 1 || view.key === 'radio.static') return text;
      const lost = (1 - view.clarity) * 0.85;
      return [...text].map((ch, i) => (ch !== ' ' && ((i * 2654435761 + view.key.length * 97) >>> 0) % 1000 / 1000 < lost ? '·' : ch)).join('');
    },
    // Fraction of the caption revealed, for a slow typewriter; a song's title shows at once.
    progress() {
      if (!view.key) return 0;
      return view.song ? 1 : Math.min(1, (time.now - view.startedAt) / Math.max(1, view.duration * 0.55));
    },
  };
})(globalThis);
