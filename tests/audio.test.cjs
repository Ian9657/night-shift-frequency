// Sound that tests can observe without listening: which voice a radio line gets
// (murmured, recorded, read aloud) and when it stops, and the room's ambience after a
// shift begun in silent mode (#1). Each case runs in a fresh page, signed in, at 4x.
const assert = require('node:assert/strict');
const { suite } = require('./browser-helpers.cjs');
const { toRadioWav } = require('../art/tools/build-voice.cjs');

// Counts looping sources (the room tone and the radio bed) and the values the radio bed
// is tuned to, with silent mode saved as `silent` before the page loads.
const watchAmbience = silent => [silent => {
  localStorage.setItem('nsf.settings', JSON.stringify({ master: 5, radio: 5, sounds: 5, silent }));
  globalThis.__loops = 0;
  globalThis.__tunedTo = [];
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.loop) globalThis.__loops++; return start.apply(this, a); };
  const target = AudioParam.prototype.setTargetAtTime;
  AudioParam.prototype.setTargetAtTime = function (value, ...a) { globalThis.__tunedTo.push(value); return target.call(this, value, ...a); };
}, silent];

let loopsWithSound = null;

suite('audio', [
  ['the line on air is murmured with its profile and stops when the dial leaves it', async page => {
    const voiced = await page.evaluate(async () => {
      const a = NSF.audio, r = NSF.radio, calls = [], speak = a.radioSpeech, stop = a.stopSpeech;
      a.radioSpeech = (text, ms, profile) => { calls.push('speak ' + profile + ': ' + text); return speak(text, ms, profile); };
      a.stopSpeech = () => { calls.push('stop'); return stop(); };
      r.play(['radio.o4']);
      for (let i = 0; i < 100 && r.view.key !== 'radio.o4'; i++) { if (r.view.key) r.skip(); await new Promise(go => setTimeout(go, 30)); }
      const spoke = calls.includes('speak ferry: ' + NSF.strings.t('radio.o4'));
      calls.length = 0;
      r.setFrequency(8700, { fine: true });
      return { spoke, stopped: calls[0] === 'stop' };
    });
    assert.deepEqual(voiced, { spoke: true, stopped: true });
  }],

  ['a recording plays instead of the murmur and sets the line\'s time; one of older text is ignored', async page => {
    const tone = toRadioWav({ rate: 11025, samples: Float32Array.from({ length: 13230 }, (_, i) => Math.sin(i / 9)) });
    const recorded = await page.evaluate(async ({ data, ms }) => {
      const a = NSF.audio, r = NSF.radio, t = NSF.strings.t, used = new Set();
      const clip = a.playClip, synth = a.radioSpeech;
      a.playClip = (key, ...rest) => { used.add('clip:' + key); return clip(key, ...rest); };
      a.radioSpeech = (text, ...rest) => { used.add('synth:' + text); return synth(text, ...rest); };
      NSF.voiceData.clips['radio.o4'] = { text: NSF.strings.strings['radio.o4'], ms, data };
      NSF.voiceData.clips['radio.o3a'] = { text: 'an older script', ms, data };
      const wait = async key => { for (let i = 0; i < 100 && r.view.key !== key; i++) { if (r.view.key) r.skip(); await new Promise(go => setTimeout(go, 30)); } };
      r.play(['radio.o4', 'radio.o3a']);
      await wait('radio.o4');
      const duration = r.view.duration;
      await wait('radio.o3a');
      return {
        duration,
        o4: [used.has('clip:radio.o4'), used.has('synth:' + t('radio.o4'))],
        o3a: [used.has('clip:radio.o3a'), used.has('synth:' + t('radio.o3a'))],
      };
    }, { data: tone.wav.toString('base64'), ms: tone.ms });
    assert.deepEqual(recorded.o4, [true, false], 'the recording, not the murmur');
    assert.deepEqual(recorded.o3a, [false, true], 'a recording of older text falls back to the murmur');
    assert.equal(recorded.duration, tone.ms + 900);
  }],

  ['VOICE: READ ALOUD has the browser speak the line, is saved, and switches back', async page => {
    const aloud = await page.evaluate(() => {
      const spoken = [];
      speechSynthesis.speak = u => { spoken.push(u.text); };
      NSF.phone.toggleVoice();
      const mode = NSF.voice.mode, kept = JSON.parse(localStorage.getItem('nsf.settings')).voice;
      NSF.voice.speak('radio.o4', {}, 'ferry', 3000);
      NSF.phone.toggleVoice();
      return { mode, kept, spoken, back: NSF.voice.mode };
    });
    assert.deepEqual(aloud, { mode: 'browser', kept: 'browser', spoken: [await page.evaluate(() => NSF.strings.t('radio.o4'))], back: 'radio' });
  }],

  ['the room and radio bed with sound on from the start (the reference for #1)', async page => {
    await page.waitForTimeout(300);
    loopsWithSound = await page.evaluate(() => __loops);
    assert.ok(loopsWithSound >= 6, 'room tone and radio bed loops: ' + loopsWithSound);
  }, { before: watchAmbience(false) }],

  ['#1: begun in silent mode, the room and radio bed come when it is turned off, matching the dial', async page => {
    await page.evaluate(() => { NSF.radio.setFrequency(8770); NSF.phone.toggleSilent(); });
    await page.waitForTimeout(300);
    const result = await page.evaluate(() => ({ muted: NSF.audio.muted, loops: __loops, echoBed: __tunedTo.includes(1800) }));
    assert.deepEqual(result, { muted: false, loops: loopsWithSound, echoBed: true });
  }, { before: watchAmbience(true) }],
]);
