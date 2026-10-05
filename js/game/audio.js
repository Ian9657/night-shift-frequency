// Synthesised diegetic sound: room tone, machines, dialogue ticks and the
// counter radio. No music tracks. Ambient drift uses real time on purpose:
// it is texture, not game state.
(function (root) {
  'use strict';
  const SFX_GAIN = 2.65;
  const DIALOGUE_TICK_GAIN = 2.85;
  let context = null;
  let ambienceStarted = false;
  let microwaveHum = null;
  let radioBed = null;
  let tickStep = 0;
  let muted = false;
  const between = (min, max) => min + Math.random() * (max - min);

  function audio() {
    const Context = root.AudioContext || root.webkitAudioContext;
    if (!Context || muted) return null;
    if (!context) context = new Context();
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
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
    osc.connect(filter); filter.connect(volume); volume.connect(ctx.destination);
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
    source.connect(filter); filter.connect(volume); volume.connect(ctx.destination);
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

  function startAmbience() {
    const ctx = audio();
    if (!ctx || ambienceStarted) return;
    ambienceStarted = true;
    const master = ctx.createGain();
    master.gain.value = 0.58;
    master.connect(ctx.destination);
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
    startRadioBed(ctx);
  }

  // ------------------------------------------------------------- the radio
  function startRadioBed(ctx) {
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    const hiss = loop(ctx, master, { filterType: 'bandpass', frequency: 3100, gain: 0.0026, duration: 1.7, drift: false });
    const hum = loop(ctx, master, { filterType: 'lowpass', frequency: 180, gain: 0.0018, duration: 2.1, drift: false });
    radioBed = { master, hiss, hum, station: '87.6' };
  }

  function radioStation(station) {
    if (!radioBed || !context) return;
    const now = context.currentTime;
    radioBed.station = station;
    const echo = station === '87.7';
    radioBed.hiss.volume.gain.setTargetAtTime(echo ? 0.011 : 0.0026, now, 0.08);
    radioBed.hiss.filter.frequency.setTargetAtTime(echo ? 1800 : 3100, now, 0.08);
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
      volume.gain.exponentialRampToValueAtTime((echo ? 0.05 : 0.07) * between(0.6, 1), t + syllable * 0.3);
      volume.gain.exponentialRampToValueAtTime(0.0001, t + syllable);
      source.connect(band); band.connect(low); low.connect(volume); volume.connect(ctx.destination);
      source.start(t); source.stop(t + syllable);
      t += syllable + (Math.random() < 0.18 ? between(0.12, 0.28) : between(0.01, 0.05));
    }
  }

  // ------------------------------------------------------------- machines
  function scan() {
    const base = between(955, 1005);
    noise({ duration: 0.008, gain: 0.006, frequency: 2450 });
    tone({ frequency: base, endFrequency: base - between(95, 135), duration: between(0.047, 0.053), type: 'triangle', gain: between(0.022, 0.025) });
  }

  function payment(type) {
    noise({ duration: 0.01, gain: 0.0048, frequency: 1900 });
    if (type === 'tap') {
      tone({ frequency: 1160, duration: 0.04, type: 'triangle', gain: 0.019 });
      tone({ frequency: 1320, duration: 0.032, type: 'triangle', gain: 0.0085, delay: 0.055 });
      return;
    }
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
    master.connect(ctx.destination);
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
    osc.connect(filter); filter.connect(volume); volume.connect(ctx.destination);
    osc.start(start); osc.stop(end + 0.002);
  }

  root.NSF.audio = {
    unlock: audio, startAmbience, scan, payment, anomaly, cashPaper, cashDrawer, microwaveStart, microwaveDone,
    stopMicrowave, receipt, bag, dialogueTick, resetTicks() { tickStep = 0; },
    radioStation, radioTune, radioVoice,
    set muted(value) { muted = Boolean(value); if (muted && context) context.suspend(); else if (context) context.resume(); },
    get muted() { return muted; },
  };
})(globalThis);
