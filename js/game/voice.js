// Who speaks on the radio. The radio says which line is on air and for how long; this
// module gives it a voice. Today that is the murmur synthesised from the line's shape
// (audio.radioSpeech). The caption always carries the words.
(function (root) {
  'use strict';
  const { audio, strings } = root.NSF;

  // `profile`: 'ferry' (June), 'echo' or 'signal'; `ms`: how long the line is on air.
  function speak(key, vars, profile, ms) {
    audio.radioSpeech(strings.t(key, vars), Math.max(400, ms), profile);
  }

  root.NSF.voice = { speak, stop: () => audio.stopSpeech() };
})(globalThis);
