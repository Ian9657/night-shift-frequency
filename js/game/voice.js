// Who speaks on the radio. The radio says which line is on air and for how long; this
// module gives it a voice, one of three ways:
// - a recorded clip of the line (assets/voice-data.js, built by art/tools/build-voice.cjs),
//   played through the radio's speaker like everything else;
// - otherwise the browser reads the line clearly (runtime-variable lines cannot be
//   pre-recorded); only browsers without speech synthesis use the old radio murmur;
// - or, if the player sets VOICE to READ ALOUD, the browser's own speech synthesis. That
//   can't go through the radio's sound (no speaker, hiss or fading), so it is a reading
//   aid more than part of the set.
// The caption always carries the words.
(function (root) {
  'use strict';
  const { audio, strings } = root.NSF;
  const speech = root.speechSynthesis && root.SpeechSynthesisUtterance ? root.speechSynthesis : null;
  const MODES = ['radio', 'browser'];
  let mode = 'radio';

  // A recorded clip stands for a line only while its text is still the line's text.
  const clipFor = key => {
    const clip = root.NSF.voiceData?.clips?.[key];
    return clip && clip.text === strings.strings[key] ? clip : null;
  };

  // The browser's voices: a higher one for June, a lower one for everyone else.
  function browserVoice(profile) {
    const voices = speech.getVoices().filter(v => /^en/i.test(v.lang));
    const want = profile === 'ferry' ? /samantha|karen|moira|tessa|serena|zira|female/i : /daniel|alex|fred|david|male/i;
    return voices.find(v => want.test(v.name)) || voices[0] || null;
  }
  function speakAloud(text, profile, ms) {
    speech.cancel();
    if (audio.muted) return;
    const line = new root.SpeechSynthesisUtterance(text);
    const voice = browserVoice(profile);
    if (voice) line.voice = voice;
    // Fit the line to its time on air: about 70 ms a character at rate 1.
    line.rate = Math.max(0.8, Math.min(1.6, (text.length * 70) / Math.max(800, ms)));
    line.pitch = profile === 'echo' ? 0.7 : profile === 'signal' ? 0.9 : 1.05;
    line.volume = (audio.level('master') / 5) * (audio.level('radio') / 5);
    speech.speak(line);
  }

  // `profile`: 'ferry' (June), 'echo' or 'signal'; `ms`: how long the line is on air;
  // `delay`: ms before speaking (after a sting).
  function speak(key, vars, profile, ms, delay = 0) {
    const text = strings.t(key, vars);
    if (mode === 'browser' && speech) {
      if (delay) root.setTimeout(() => speakAloud(text, profile, ms), delay);     // speech runs on real time anyway
      else speakAloud(text, profile, ms);
      return;
    }
    const clip = clipFor(key);
    if (clip) audio.playClip(key, clip.data, profile, delay);
    else if (speech) {
      if (delay) root.setTimeout(() => speakAloud(text, profile, ms), delay);
      else speakAloud(text, profile, ms);
    }
    else audio.radioSpeech(text, Math.max(400, ms), profile, delay);
  }

  function stop() {
    audio.stopSpeech();
    if (speech) speech.cancel();
  }

  root.NSF.voice = {
    speak, stop,
    // A recorded line's own length (ms), or null when it is synthesised.
    length: key => clipFor(key)?.ms ?? null,
    get mode() { return mode; },
    set mode(value) { mode = MODES.includes(value) && (value !== 'browser' || speech) ? value : 'radio'; },
    canReadAloud: Boolean(speech),
  };
})(globalThis);
