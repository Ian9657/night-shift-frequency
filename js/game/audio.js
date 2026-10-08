// Synthesised diegetic sound: room tone, machines, dialogue ticks and the
// counter radio. No music tracks. Ambient drift uses real time on purpose:
// it is texture, not game state. Everything plays through two buses, `sounds` and
// `radio`, into `master`; the phone's settings set their levels (0–5). `master` then
// gets the output gain and a limiter, so nothing clips when sounds pile up.
(function (root) {
  'use strict';
  const OUTPUT_GAIN = 2;                     // +6 dB: the mix sat well below other audio on the same device
  const SFX_GAIN = 2.65;
  const DIALOGUE_TICK_GAIN = 2.85;
  let context = null;
  // The room and the radio bed are built once, the first time sound is available after
  // the shift has asked for them, so a shift begun in silent mode gets them when silent
  // mode is turned off.
  let ambienceWanted = false, ambienceStarted = false;
  let microwaveHum = null;
  let radioBed = null;
  let tickStep = 0;
  let muted = false, away = false;
  let bus = null;
  const levels = { master: 5, radio: 5, sounds: 5 };
  let radioHeld = false;
  const between = (min, max) => min + Math.random() * (max - min);
  const gainOf = level => (level / 5) ** 2;

  function audio() {
    const Context = root.AudioContext || root.webkitAudioContext;
    if (!Context || muted) return null;
    if (!context) {
      context = new Context();
      const master = context.createGain(), sounds = context.createGain(), radio = context.createGain();
      const output = context.createGain(), limiter = context.createDynamicsCompressor();
      output.gain.value = OUTPUT_GAIN;
      limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20;
      limiter.attack.value = 0.002; limiter.release.value = 0.12;
      sounds.connect(master); radio.connect(master); master.connect(output); output.connect(limiter); limiter.connect(context.destination);
      bus = { master, sounds, radio };
      applyLevels();
    }
    if (context.state === 'suspended' && !away) context.resume().catch(() => {});
    return context;
  }

  function applyLevels() {
    if (!bus) return;
    const now = context.currentTime;
    bus.master.gain.setTargetAtTime(gainOf(levels.master), now, 0.03);
    bus.sounds.gain.setTargetAtTime(gainOf(levels.sounds), now, 0.03);
    bus.radio.gain.setTargetAtTime(radioHeld ? 0 : gainOf(levels.radio), now, 0.03);
  }

  function tone({ frequency, duration, type = 'square', gain = 0.035, delay = 0, endFrequency = frequency, lowpass = 2200 }) {
    const ctx = audio();
    if (!ctx) return;
    const start = ctx.currentTime + delay, end = start + duration;
    const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain * SFX_GAIN, start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpass, start);
    osc.connect(filter); filter.connect(volume); volume.connect(bus.sounds);
    osc.start(start); osc.stop(end + 0.01);
  }

  function noiseBuffer(ctx, duration, smooth = 0) {
    const count = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < count; i++) data[i] = (data[i - 1] || 0) * smooth + (Math.random() * 2 - 1) * (1 - smooth);
    return buffer;
  }

  function noise({ duration, gain = 0.018, delay = 0, filterType = 'bandpass', frequency = 1200 }) {
    const ctx = audio();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
    source.buffer = noiseBuffer(ctx, duration);
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(gain * SFX_GAIN, start);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter); filter.connect(volume); volume.connect(bus.sounds);
    source.start(start); source.stop(start + duration);
  }

  function loop(ctx, destination, { filterType, frequency, gain, duration, drift = true }) {
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
    source.buffer = noiseBuffer(ctx, duration, 0.22);
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    volume.gain.value = gain;
    source.connect(filter); filter.connect(volume); volume.connect(destination);
    source.start();
    if (drift) driftGain(volume.gain, gain);
    return { source, volume, filter };
  }

  function driftGain(param, baseGain) {
    const step = () => {
      if (!context) return;
      const now = context.currentTime, duration = between(8, 18);
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(baseGain * between(0.64, 1.18), now + duration);
      root.setTimeout(step, duration * 1000);
    };
    step();
  }

  function ambientIncident() {
    const roll = Math.random();
    if (roll < 0.38) {
      noise({ duration: between(0.38, 0.62), gain: 0.0042, frequency: between(1350, 1850) });
      noise({ duration: between(0.18, 0.3), gain: 0.0028, delay: 0.16, filterType: 'highpass', frequency: between(2400, 3200) });
    } else if (roll < 0.72) {
      tone({ frequency: between(48, 56), endFrequency: between(62, 70), duration: 0.34, type: 'triangle', gain: 0.009, lowpass: 420 });
      noise({ duration: 0.42, gain: 0.0052, delay: 0.035, filterType: 'lowpass', frequency: 330 });
    } else {
      tone({ frequency: between(290, 330), endFrequency: between(240, 270), duration: 0.055, type: 'triangle', gain: 0.0062, lowpass: 1400 });
      noise({ duration: 0.08, gain: 0.0036, delay: 0.035, frequency: 900 });
    }
    root.setTimeout(ambientIncident, between(6500, 12500));
  }

  // The drinks fridge's compressor: a start thump, a low hum for a minute or so, a
  // clunk and a rattle as it stops, then quiet for a while.
  function fridgeCycle(ctx, destination) {
    const on = between(40, 90), off = between(50, 110);
    const start = ctx.currentTime + 0.05;
    tone({ frequency: 62, endFrequency: 48, duration: 0.18, type: 'triangle', gain: 0.008, lowpass: 300 });
    const hum = ctx.createOscillator(), harmonic = ctx.createOscillator(), volume = ctx.createGain();
    hum.type = 'sine'; hum.frequency.value = 49;
    harmonic.type = 'triangle'; harmonic.frequency.value = 98;
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.006, start + 1.5);
    volume.gain.setValueAtTime(0.006, start + on - 0.4);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + on);
    hum.connect(volume); harmonic.connect(volume); volume.connect(destination);
    hum.start(start); harmonic.start(start); hum.stop(start + on + 0.05); harmonic.stop(start + on + 0.05);
    root.setTimeout(() => {
      tone({ frequency: 90, endFrequency: 55, duration: 0.12, type: 'triangle', gain: 0.007, lowpass: 400 });
      noise({ duration: 0.3, gain: 0.002, delay: 0.08, frequency: 1600 });
      root.setTimeout(() => fridgeCycle(ctx, destination), off * 1000);
    }, on * 1000);
  }

  function startAmbience() {
    ambienceWanted = true;
    const ctx = audio();
    if (!ctx || ambienceStarted) return;
    ambienceStarted = true;
    const master = ctx.createGain();
    master.gain.value = 0.58;
    master.connect(bus.sounds);
    for (const [type, frequency, gain] of [['triangle', 58, 0.013], ['sine', 119, 0.0054]]) {
      const osc = ctx.createOscillator(), volume = ctx.createGain();
      osc.type = type; osc.frequency.value = frequency; volume.gain.value = gain;
      osc.connect(volume); volume.connect(master); osc.start();
      driftGain(volume.gain, gain);
    }
    loop(ctx, master, { filterType: 'lowpass', frequency: 240, gain: 0.0082, duration: 3 });
    loop(ctx, master, { filterType: 'bandpass', frequency: 1400, gain: 0.0038, duration: 2.7 });
    loop(ctx, master, { filterType: 'bandpass', frequency: 2400, gain: 0.0027, duration: 1.9 });
    // Rain against the glass.
    loop(ctx, master, { filterType: 'highpass', frequency: 5200, gain: 0.0024, duration: 2.3 });
    root.setTimeout(ambientIncident, between(6500, 12500));
    root.setTimeout(() => fridgeCycle(ctx, master), between(4000, 20000));
    startRadioBed(ctx);
  }

  // ------------------------------------------------------------- the radio
  function startRadioBed(ctx) {
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(bus.radio);
    const hiss = loop(ctx, master, { filterType: 'bandpass', frequency: 3100, gain: 0.0026, duration: 1.7, drift: false });
    const hum = loop(ctx, master, { filterType: 'lowpass', frequency: 180, gain: 0.0018, duration: 2.1, drift: false });
    radioBed = { master, hiss, hum };
    tuneBed();
  }

  // What the dial is on: 'ferry' (Night Ferry, clean), 'echo' (hissing), 'signal'
  // (someone's frequency, mostly hiss) or 'static'.
  // `clarity` (0–1) thins the echo's hiss as the night goes on.
  // The last station asked for is kept even before the bed exists, so a bed built late
  // matches the dial.
  const station = { kind: 'ferry', clarity: 0 };
  function radioStation(kind, clarity = 0) {
    Object.assign(station, { kind, clarity });
    tuneBed();
  }
  function tuneBed() {
    if (!radioBed || !context) return;
    const now = context.currentTime, { kind, clarity } = station;
    const hiss = { ferry: 0.0026, echo: 0.014 - 0.009 * clarity, signal: 0.015 }[kind] ?? 0.02;
    radioBed.hiss.volume.gain.setTargetAtTime(hiss, now, 0.08);
    radioBed.hiss.filter.frequency.setTargetAtTime(kind === 'ferry' ? 3100 : 1800, now, 0.08);
  }

  function radioTune() {
    tone({ frequency: 900, endFrequency: 2600, duration: 0.18, type: 'sine', gain: 0.004, lowpass: 3000 });
    noise({ duration: 0.22, gain: 0.012, frequency: 2000 });
  }

  // A muffled voice through a small speaker: syllable-rate bursts of filtered noise.
  function radioVoice(ms, echo = false) {
    const ctx = audio();
    if (!ctx) return;
    let t = ctx.currentTime;
    const end = t + ms / 1000;
    while (t < end) {
      const syllable = between(0.09, 0.17);
      const source = ctx.createBufferSource(), band = ctx.createBiquadFilter(), low = ctx.createBiquadFilter(), volume = ctx.createGain();
      source.buffer = noiseBuffer(ctx, syllable, 0.5);
      band.type = 'bandpass';
      band.frequency.value = echo ? between(500, 700) : between(650, 1100);
      band.Q.value = 3.2;
      low.type = 'lowpass';
      low.frequency.value = 1500;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.exponentialRampToValueAtTime((echo ? 0.08 : 0.11) * between(0.6, 1), t + syllable * 0.3);
      volume.gain.exponentialRampToValueAtTime(0.0001, t + syllable);
      source.connect(band); band.connect(low); low.connect(volume); volume.connect(bus.radio);
      source.start(t); source.stop(t + syllable);
      t += syllable + (Math.random() < 0.18 ? between(0.12, 0.28) : between(0.01, 0.05));
    }
  }

  // A song on Night Ferry, through the radio's small speaker: a soft square lead, a
  // triangle pad per bar, a sine bass on beats one and three and a brushed hat, all
  // wavering a little as if off old tape.
  let song = null;
  const hz = note => 440 * 2 ** ((note - 69) / 12);
  function stopSong() {
    if (!song || !context) return;
    const now = context.currentTime;
    song.out.gain.cancelScheduledValues(now);
    song.out.gain.setValueAtTime(song.out.gain.value, now);
    song.out.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    song.nodes.forEach(node => { try { node.stop(now + 0.2); } catch (_) { /* already stopped */ } });
    song = null;
  }
  function playSong({ tempo, chords, melody }) {
    const ctx = audio();
    if (!ctx) return;
    stopSong();
    const beat = 60 / tempo, start = ctx.currentTime + 0.1, nodes = [];
    const out = ctx.createGain(), speaker = ctx.createBiquadFilter(), wow = ctx.createOscillator(), depth = ctx.createGain();
    out.gain.value = 1;
    speaker.type = 'lowpass'; speaker.frequency.value = 2300;
    out.connect(speaker); speaker.connect(bus.radio);
    wow.frequency.value = 0.55; depth.gain.value = 9;
    wow.connect(depth); wow.start(start); nodes.push(wow);
    const note = (frequency, at, length, type, gain, attack = 0.02) => {
      const osc = ctx.createOscillator(), volume = ctx.createGain();
      osc.type = type; osc.frequency.value = frequency;
      depth.connect(osc.detune);
      volume.gain.setValueAtTime(0.0001, at);
      volume.gain.exponentialRampToValueAtTime(gain, at + attack);
      volume.gain.exponentialRampToValueAtTime(gain * 0.5, at + length * 0.6);
      volume.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(volume); volume.connect(out);
      osc.start(at); osc.stop(at + length + 0.02);
      nodes.push(osc);
    };
    chords.forEach((chord, bar) => {
      const at = start + bar * 4 * beat;
      chord.forEach(n => note(hz(n), at, 4 * beat, 'triangle', 0.007, 0.3));
      for (const b of [0, 2]) note(hz(chord[0] - 12), at + b * beat, beat * 1.6, 'sine', 0.022, 0.01);
      for (let h = 0; h < 8; h++) {
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), volume = ctx.createGain(), t = at + h * beat / 2;
        source.buffer = noiseBuffer(ctx, 0.04);
        filter.type = 'highpass'; filter.frequency.value = 6000;
        volume.gain.setValueAtTime(h % 2 ? 0.0016 : 0.0026, t);
        volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        source.connect(filter); filter.connect(volume); volume.connect(out);
        source.start(t); source.stop(t + 0.05);
        nodes.push(source);
      }
    });
    let t = start;
    for (const [n, beats] of melody) {
      if (n !== null) note(hz(n), t, beats * beat * 0.92, 'square', 0.009);
      t += beats * beat;
    }
    song = { out, nodes };
  }

  // ------------------------------------------------------------- machines
  function scan() {
    const base = between(955, 1005);
    noise({ duration: 0.008, gain: 0.006, frequency: 2450 });
    tone({ frequency: base, endFrequency: base - between(95, 135), duration: between(0.047, 0.053), type: 'triangle', gain: between(0.022, 0.025) });
  }

  function payment(type) {
    noise({ duration: 0.01, gain: 0.0048, frequency: 1900 });
    // Card: a medium approval body, then one small latch-like confirmation.
    tone({ frequency: 690, endFrequency: 720, duration: 0.105, type: 'triangle', gain: 0.018 });
    tone({ frequency: 1040, duration: 0.026, type: 'triangle', gain: 0.014, delay: 0.12 });
  }

  function anomaly() {
    noise({ duration: 0.026, gain: 0.0065, frequency: between(520, 760) });
    tone({ frequency: between(172, 190), endFrequency: between(128, 144), duration: 0.075, type: 'triangle', gain: 0.01, delay: 0.012, lowpass: 900 });
  }

  function cashPaper() {
    noise({ duration: 0.02, gain: 0.0082, frequency: 2700 });
    noise({ duration: 0.085, gain: 0.0058, delay: 0.018, frequency: 1250 });
  }

  function cashDrawer() {
    noise({ duration: 0.014, gain: 0.012, frequency: 2300 });
    noise({ duration: 0.045, gain: 0.03, delay: 0.006, filterType: 'lowpass', frequency: 520 });
    tone({ frequency: 140, endFrequency: 92, duration: 0.07, type: 'triangle', gain: 0.02, delay: 0.008 });
  }

  function stopMicrowave() {
    if (!microwaveHum) return;
    const { master, nodes } = microwaveHum;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    nodes.forEach(node => { try { node.stop(now + 0.07); } catch (_) { /* already stopped */ } });
    microwaveHum = null;
  }

  function microwaveStart() {
    noise({ duration: 0.018, gain: 0.011, frequency: 1800 });
    tone({ frequency: 96, endFrequency: 118, duration: 0.075, type: 'triangle', gain: 0.014, delay: 0.014, lowpass: 640 });
    const ctx = audio();
    if (!ctx) return;
    stopMicrowave();
    const start = ctx.currentTime;
    const master = ctx.createGain(), motor = ctx.createOscillator(), wobble = ctx.createOscillator(), wobbleAmount = ctx.createGain();
    const cabinet = ctx.createOscillator(), cabinetVolume = ctx.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.013 * SFX_GAIN, start + 0.05);
    master.connect(bus.sounds);
    motor.type = 'triangle'; motor.frequency.setValueAtTime(116, start);
    wobble.type = 'sine'; wobble.frequency.setValueAtTime(6.6, start);
    wobbleAmount.gain.setValueAtTime(1.4, start);
    wobble.connect(wobbleAmount); wobbleAmount.connect(motor.frequency);
    cabinet.type = 'sine'; cabinet.frequency.setValueAtTime(232, start);
    cabinetVolume.gain.setValueAtTime(0.18, start);
    motor.connect(master); cabinet.connect(cabinetVolume); cabinetVolume.connect(master);
    const rumble = loop(ctx, master, { filterType: 'lowpass', frequency: 430, gain: 0.16, duration: 0.7, drift: false });
    [motor, wobble, cabinet].forEach(node => node.start(start));
    microwaveHum = { master, nodes: [motor, wobble, cabinet, rumble.source] };
  }

  function microwaveDone() {
    stopMicrowave();
    tone({ frequency: 1120, endFrequency: 1085, duration: 0.12, type: 'triangle', gain: 0.022, lowpass: 2600 });
    tone({ frequency: 1980, endFrequency: 1900, duration: 0.045, type: 'sine', gain: 0.0035, delay: 0.012, lowpass: 3000 });
  }

  function receipt() {
    noise({ duration: 0.018, gain: 0.0052, frequency: 1800 });
    [0, 0.045, 0.09, 0.135].forEach(delay => {
      tone({ frequency: between(210, 250), duration: 0.018, type: 'triangle', gain: 0.0054, delay, lowpass: 900 });
      noise({ duration: 0.025, gain: 0.007, delay: delay + 0.002, frequency: 1250 });
    });
  }

  function bag() {
    noise({ duration: 0.014, gain: 0.0062, frequency: 3200 });
    noise({ duration: 0.145, gain: 0.0056, delay: 0.016, frequency: 1150 });
    noise({ duration: 0.045, gain: 0.0035, delay: 0.058, filterType: 'highpass', frequency: 2100 });
  }

  function dialogueTick(character) {
    if (!character || /\s|[.,!?;…]/.test(character)) return;
    tickStep += 1;
    if (tickStep % 3 !== 1 && Math.random() < 0.82) return;
    const ctx = audio();
    if (!ctx) return;
    noise({ duration: 0.004, gain: 0.0062 * DIALOGUE_TICK_GAIN, frequency: between(3300, 4100) });
    const pitch = between(1420, 1660), start = ctx.currentTime, end = start + 0.007;
    const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, start);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.985, end);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(3200, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.0028 * SFX_GAIN * DIALOGUE_TICK_GAIN, start + 0.0012);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(filter); filter.connect(volume); volume.connect(bus.sounds);
    osc.start(start); osc.stop(end + 0.002);
  }

  // The phone: a short keypad beep, and the clack of the lid opening or shutting.
  function phoneKey() {
    tone({ frequency: 1400, duration: 0.05, type: 'sine', gain: 0.008, lowpass: 3000 });
  }
  function uiClick() {
    tone({ frequency: 1180, endFrequency: 980, duration: 0.035, type: 'triangle', gain: 0.0055, lowpass: 2600 });
  }
  function phoneFlip(opening) {
    noise({ duration: 0.02, gain: 0.012, frequency: opening ? 2600 : 1900 });
    tone({ frequency: opening ? 420 : 300, endFrequency: opening ? 380 : 220, duration: 0.04, type: 'triangle', gain: 0.012, delay: 0.012, lowpass: 1600 });
  }

  // A car on the wet street outside, through the glass: tyre hiss swelling and falling.
  function carPass(near) {
    const ctx = audio();
    if (!ctx) return;
    const start = ctx.currentTime, length = 2.4;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), volume = ctx.createGain();
    source.buffer = noiseBuffer(ctx, length, 0.4);
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(700, start);
    filter.frequency.linearRampToValueAtTime(1300, start + length * 0.45);
    filter.frequency.linearRampToValueAtTime(520, start + length);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime((near ? 0.012 : 0.007) * SFX_GAIN, start + length * 0.45);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter); filter.connect(volume); volume.connect(bus.sounds);
    source.start(start); source.stop(start + length);
  }

  // The wall clock's movement catching up ten minutes at once: a run of quick ticks.
  function clockSkip() {
    for (let i = 0; i < 10; i++) tone({ frequency: 2300, endFrequency: 2100, duration: 0.012, type: 'triangle', gain: 0.0024, delay: i * 0.035, lowpass: 3600 });
  }

  // A tube flickering: a short ballast buzz.
  function tubeFlicker() {
    tone({ frequency: 100, duration: 0.09, type: 'sawtooth', gain: 0.0042, lowpass: 900 });
    noise({ duration: 0.05, gain: 0.0022, frequency: 3200 });
  }

  // A text arriving: the phone buzzing twice against the tray. A text going: a chirp.
  function phoneBuzz() {
    for (const delay of [0, 0.32]) {
      tone({ frequency: 150, endFrequency: 140, duration: 0.2, type: 'sawtooth', gain: 0.006, delay, lowpass: 420 });
      noise({ duration: 0.2, gain: 0.003, delay, filterType: 'lowpass', frequency: 300 });
    }
  }
  // A text's ringtone through the phone's little speaker: bright two-partial pings in
  // rising threes, played twice, the way phones of the time chirped.
  function phoneRing() {
    const ctx = audio();
    if (!ctx) return;
    const start = ctx.currentTime + 0.02, speaker = ctx.createBiquadFilter();
    speaker.type = 'bandpass'; speaker.frequency.value = 2400; speaker.Q.value = 0.7;
    speaker.connect(bus.sounds);
    const ping = (note, at) => {
      for (const [ratio, gain] of [[1, 0.05], [2.01, 0.014]]) {
        const osc = ctx.createOscillator(), volume = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440 * 2 ** ((note - 69) / 12) * ratio;
        volume.gain.setValueAtTime(0.0001, at);
        volume.gain.exponentialRampToValueAtTime(gain, at + 0.004);
        volume.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
        osc.connect(volume); volume.connect(speaker);
        osc.start(at); osc.stop(at + 0.18);
      }
    };
    [0, 0.62].forEach(bar => [[83, 0], [88, 0.1], [91, 0.2], [88, 0.36], [91, 0.46]].forEach(([note, at]) => ping(note, start + bar + at)));
  }
  function phoneSent() {
    tone({ frequency: 1320, duration: 0.06, type: 'sine', gain: 0.008, lowpass: 3000 });
    tone({ frequency: 1760, duration: 0.09, type: 'sine', gain: 0.008, delay: 0.07, lowpass: 3000 });
  }

  // The door's chime as a customer comes in: two soft notes, the second lower.
  function doorChime() {
    tone({ frequency: 1318, endFrequency: 1310, duration: 0.7, type: 'sine', gain: 0.007, lowpass: 4000 });
    tone({ frequency: 1046, endFrequency: 1040, duration: 0.9, type: 'sine', gain: 0.007, delay: 0.26, lowpass: 4000 });
  }

  // Gulls over the harbour at first light: a few falling cries, far off.
  function gulls() {
    [0, 0.42, 1.6, 1.92, 2.2].forEach((delay, i) => {
      const top = between(1500, 1900) - i * 40;
      tone({ frequency: top, endFrequency: top * 0.62, duration: between(0.22, 0.34), type: 'triangle', gain: 0.0032, delay, lowpass: 2600 });
    });
  }

  // Something set down in the cardboard box under the counter.
  function boxDrop() {
    noise({ duration: 0.06, gain: 0.006, filterType: 'lowpass', frequency: 600 });
    tone({ frequency: 120, endFrequency: 80, duration: 0.06, type: 'triangle', gain: 0.006, lowpass: 500 });
  }

  // The sign-in sheet: a pen stroke per letter, the pen pressed down to sign.
  function pen() {
    noise({ duration: between(0.05, 0.08), gain: 0.0034, frequency: between(2600, 3400) });
  }
  function stamp() {
    noise({ duration: 0.16, gain: 0.0048, frequency: 2900 });
    noise({ duration: 0.05, gain: 0.0062, delay: 0.17, filterType: 'lowpass', frequency: 700 });
  }

  root.NSF.audio = {
    unlock: audio, startAmbience, scan, payment, anomaly, cashPaper, cashDrawer, microwaveStart, microwaveDone,
    stopMicrowave, receipt, bag, dialogueTick, resetTicks() { tickStep = 0; },
    radioStation, radioTune, radioVoice, phoneKey, uiClick, phoneFlip, pen, stamp, carPass, clockSkip, tubeFlicker, phoneBuzz, phoneRing, phoneSent, doorChime, gulls, playSong, stopSong, boxDrop,
    // Levels 0–5 for 'master', 'radio' and 'sounds'.
    level(name) { return levels[name]; },
    setLevel(name, value) { levels[name] = Math.max(0, Math.min(5, Math.round(value))); applyLevels(); },
    // While the shift is paused the radio is silent; the room keeps its sound.
    set radioHeld(value) { radioHeld = Boolean(value); applyLevels(); },
    // Turning silent mode off is a click, so the context may be created or resumed here;
    // the room and radio bed come up if the shift asked for them while silent.
    set muted(value) {
      muted = Boolean(value);
      if (muted) { context?.suspend().catch(() => {}); return; }
      context?.resume().catch(() => {});
      if (ambienceWanted) startAmbience();
    },
    get muted() { return muted; },
    // While the tab is hidden the game's clock stops (no frames), so the sound waits too.
    // Background timers (the fridge, incidents) still fire, but don't wake it.
    set away(value) {
      away = Boolean(value);
      if (!context || muted) return;
      (away ? context.suspend() : context.resume()).catch(() => {});
    },
  };
})(globalThis);
