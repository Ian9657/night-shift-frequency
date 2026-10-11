// Levels probe: plays a set of the game's sounds one at a time and measures each at the
// output: peak (dBFS) and RMS (dB). For keeping the mix even and checking nothing nears
// the limiter (−3 dBFS); no test listens.
//   node tests/probes/levels.cjs
const { URL_BASE, launch } = require('./common.cjs');

// [label, script run in the page, how long to measure in ms]
const SOUNDS = [
  ['room tone', 'NSF.audio.startAmbience()', 1500],
  ['scanner', 'NSF.audio.scan()', 300],
  ['cash drawer', 'NSF.audio.cashDrawer()', 300],
  ['June speaking', "NSF.audio.radioSpeech(NSF.strings.t('radio.intro1'), 2600, 'ferry')", 2600],
  ['a song', 'NSF.audio.playSong(NSF.story.radio.songs.slowTide)', 4000],
  ['time signal', "NSF.audio.radioSting('pips')", 5600],
  ['text ringtone', 'NSF.audio.phoneRing()', 1800],
  ['door chime', 'NSF.audio.doorChime()', 1200],
];

(async () => {
  const browser = await launch(['--autoplay-policy=no-user-gesture-required']);
  try {
    const page = await browser.newPage();
    // A meter on whatever reaches the speakers.
    await page.addInitScript(() => {
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (target, ...rest) {
        if (target instanceof AudioDestinationNode && !window.__meter) { window.__meter = this.context.createAnalyser(); window.__meter.fftSize = 2048; connect.call(this, window.__meter); }
        return connect.call(this, target, ...rest);
      };
      window.__measure = ms => new Promise(resolve => {
        const samples = new Float32Array(2048);
        let peak = 0, sum = 0, n = 0;
        const id = setInterval(() => { __meter.getFloatTimeDomainData(samples); for (const v of samples) { peak = Math.max(peak, Math.abs(v)); sum += v * v; n++; } }, 20);
        setTimeout(() => { clearInterval(id); resolve({ peak: 20 * Math.log10(peak || 1e-9), rms: 10 * Math.log10(sum / n || 1e-12) }); }, ms);
      });
    });
    await page.goto(URL_BASE + '?seed=levels');
    await page.evaluate(() => NSF.audio.unlock());
    console.log('sound              peak dBFS   RMS dB');
    for (const [label, script, ms] of SOUNDS) {
      const level = await page.evaluate(async ([script, ms]) => { (0, eval)(script); return __measure(ms); }, [script, ms]);
      await page.evaluate(() => { NSF.audio.stopSpeech(); NSF.audio.stopSong(); });
      console.log(`${label.padEnd(18)} ${level.peak.toFixed(1).padStart(9)} ${level.rms.toFixed(1).padStart(8)}`);
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
