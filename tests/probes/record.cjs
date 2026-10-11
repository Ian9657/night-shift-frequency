// Record probe: records what the game plays, from its own output, to a file you can
// listen to (tests/artifacts/<name>.webm), and prints the peak level. For judging how
// things sound, which no test can.
//   node tests/probes/record.cjs june          June's opening line and the dial hint
//   node tests/probes/record.cjs voices        the echo, then the taxi dispatch
//   node tests/probes/record.cjs opening       the shift starting: time signal, June, the music bed
//   node tests/probes/record.cjs song          the first song
//   node tests/probes/record.cjs <name> "<script>" [seconds]   anything else, run in the page
const fs = require('node:fs');
const path = require('node:path');
const { URL_BASE, launch, artifacts } = require('./common.cjs');

const PRESETS = {
  june: ["const t = NSF.strings.t; NSF.audio.radioSpeech(t('radio.intro1'), 3300, 'ferry'); setTimeout(() => NSF.audio.radioSpeech(t('radio.tuningHint'), 6600, 'ferry'), 3600)", 11],
  voices: ["const t = NSF.strings.t; NSF.audio.radioSpeech(t('radio.echoDoor'), 2600, 'echo'); setTimeout(() => NSF.audio.radioSpeech(t('radio.taxi1'), 4800, 'signal'), 3000)", 8.5],
  opening: ['NSF.debug.game.startShift(); NSF.signin.sign();', 18],
  song: ['NSF.audio.playSong(NSF.story.radio.songs.slowTide)', 14],
};

(async () => {
  const [name = 'june', custom, customSeconds] = process.argv.slice(2);
  const [script, seconds] = custom ? [custom, Number(customSeconds) || 8] : PRESETS[name] || [];
  if (!script) { console.error('unknown preset ' + name + '; one of ' + Object.keys(PRESETS).join(', ')); process.exit(2); }
  const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('page error', e.message));
    // Everything the game sends to the speakers also goes to a recorder and a peak meter.
    await page.addInitScript(() => {
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (target, ...rest) {
        if (target instanceof AudioDestinationNode && !window.__recording) {
          const stream = this.context.createMediaStreamDestination(), meter = this.context.createAnalyser();
          connect.call(this, stream); connect.call(this, meter);
          const recorder = new MediaRecorder(stream.stream, { mimeType: 'audio/webm;codecs=opus' }), chunks = [];
          recorder.ondataavailable = e => chunks.push(e.data);
          recorder.start();
          let peak = 0;
          const samples = new Float32Array(2048);
          setInterval(() => { meter.getFloatTimeDomainData(samples); for (const v of samples) peak = Math.max(peak, Math.abs(v)); }, 20);
          window.__recording = { recorder, chunks, peak: () => 20 * Math.log10(peak || 1e-9) };
        }
        return connect.call(this, target, ...rest);
      };
    });
    await page.goto(URL_BASE + '?seed=record');
    await page.evaluate(() => NSF.audio.unlock());
    await page.evaluate(script);
    await page.waitForTimeout(seconds * 1000);
    const { data, peak } = await page.evaluate(() => new Promise(resolve => {
      const { recorder, chunks, peak } = window.__recording;
      recorder.onstop = async () => {
        const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
        let text = '';
        for (const b of bytes) text += String.fromCharCode(b);
        resolve({ data: btoa(text), peak: peak() });
      };
      recorder.stop();
    }));
    const file = path.join(artifacts, name + '.webm');
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`${path.relative(process.cwd(), file)}  peak ${peak.toFixed(1)} dBFS`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
