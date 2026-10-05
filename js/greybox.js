const shiftSeed = new URLSearchParams(location.search).get('seed') || String(Date.now());
const shiftState = ShiftEngine.createShift(shiftSeed);
const events = shiftState.orders;

const CUSTOMER_POOL = {
  male: ["customer-01", "customer-03", "customer-04", "customer-05", "customer-06"],
  female: ["customer-02", "customer-07", "customer-08", "customer-09", "customer-10"],
};

function createCustomerLineup(random = Math.random) {
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  const lineup = shuffled([
    ...shuffled(CUSTOMER_POOL.male).slice(0, 4),
    ...shuffled(CUSTOMER_POOL.female).slice(0, 4),
  ]);
  return Object.freeze(lineup);
}

const customerLineup = createCustomerLineup(ShiftEngine.random(`${shiftSeed}:customers`));

const state = {
  eventIndex: 0,
  selectedId: null,
  scannedIds: [],
  paid: false,
  bagged: false,
  heatedIds: [],
  reportShown: false,
  transientStatus: null,
  busy: false,
  modeOverride: null,
  reactionCounts: {},
  dialogueFlags: new Set(),
};

let shiftStarted = false;

const frame = document.querySelector(".game-frame");
const world = PixelWorld.mount(frame);
const startShiftButton = document.querySelector("[data-start-shift]");
const clock = document.querySelector("[data-clock]");
const customerCount = document.querySelector("[data-customer-count]");
const dialogue = document.querySelector("[data-dialogue]");
const dialogueText = document.querySelector("[data-dialogue-text]");
const dialogueParts = {
  shadow: document.querySelector("[data-dialogue-part='shadow']"),
  outline: document.querySelector("[data-dialogue-part='outline']"),
  bubble: document.querySelector("[data-dialogue-part='bubble']"),
  inset: document.querySelector("[data-dialogue-part='inset']"),
  corner: document.querySelector("[data-dialogue-part='corner']"),
};
const products = document.querySelector("[data-products]");
const posList = document.querySelector("[data-pos-list]");
const posTotal = document.querySelector("[data-pos-total]");
const posStatus = document.querySelector("[data-pos-status]");
const posMode = document.querySelector("[data-pos-mode]");
const scanPad = document.querySelector("[data-scan-pad]");
const microwave = document.querySelector(".microwave");
const scanner = document.querySelector("[data-action='scan']");
const payment = document.querySelector("[data-action='pay']");
const bag = document.querySelector("[data-action='bag']");
const receipt = document.querySelector("[data-receipt]");
const receiptButton = document.querySelector("[data-action='report']");
const confirmItems = document.querySelector("[data-confirm-items]");
const mismatchDisplay = document.querySelector("[data-mismatch-display]");
const matchItemLabels = document.querySelectorAll("[data-match-item]");
const itemQuantities = document.querySelectorAll("[data-item-quantity]");
const matchStatus = document.querySelector("[data-match-status]");
const matchPrompt = document.querySelector("[data-match-prompt]");
const posNormal = document.querySelector("[data-pos-normal]");
const posComparison = document.querySelector("[data-pos-comparison]");
const itemSources = document.querySelectorAll("[data-item-source]");
const registerSources = document.querySelectorAll("[data-register-source]");
const posCountAlert = document.querySelector("[data-pos-count-alert]");
const countAnomaly = document.querySelector("[data-count-anomaly]");
const countScanned = document.querySelector("[data-count-scanned]");
const cashDrawer = document.querySelector("[data-cash-drawer]");
const coinTray = document.querySelector(".coin-tray");
const customer = document.querySelector("[data-customer]");
const workArea = document.querySelector(".work-area");
const bagStack = document.querySelector("[data-bag-stack]");
let activeBag = null;
let customerPose = "idle";
const receivingPoseCache = new Map();
let dialogueTimers = [];
let dialogueTypingTimer = null;
let dialogueUnlockTimer = null;
let dialogueLocked = false;
let paymentWaitTimer = null;
let bagWaitTimer = null;
let dialogueRevision = 0;
let dialogueTypingRevision = 0;
let dialogueTickStep = 0;
let countAttention = false;
let countAlertVisible = false;
let feedbackRevision = 0;
let feedbackTimers = [];
let previousCueKeys = new Set();
const pendingCueKeys = new Set();
const cueAnimations = new Map();
let cueDelayTimer = null;
let cueDelaySignature = "";
let cueDelayReady = false;
const CUE_DELAY_START_EVENT = 2;
const CUE_DELAY_MS = 780;


function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

let audioContext = null;
let ambienceStarted = false;
let ambienceMaster = null;
let microwaveHum = null;
let ambientIncidentTimer = null;
const SFX_GAIN = 2.65;
const DIALOGUE_TICK_GAIN = 2.85;

function gameAudio() {
  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => { });
  }

  return audioContext;
}

function playTone({
  frequency,
  duration,
  type = "square",
  gain = 0.035,
  delay = 0,
  endFrequency = frequency,
  lowpass = 2200,
}) {
  const context = gameAudio();
  if (!context) return;

  const start = context.currentTime + delay;
  const end = start + duration;
  const oscillator = context.createOscillator();
  const toneFilter = context.createBiquadFilter();
  const volume = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    end
  );

  const mixedGain = gain * SFX_GAIN;

  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(mixedGain, start + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, end);

  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(lowpass, start);
  oscillator.connect(toneFilter);
  toneFilter.connect(volume);
  volume.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
}

function playNoise({
  duration,
  gain = 0.018,
  delay = 0,
  filterType = "bandpass",
  frequency = 1200,
}) {
  const context = gameAudio();
  if (!context) return;

  const sampleCount =
    Math.max(1, Math.floor(context.sampleRate * duration));

  const buffer =
    context.createBuffer(1, sampleCount, context.sampleRate);

  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const start = context.currentTime + delay;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const volume = context.createGain();

  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, start);
  const mixedGain = gain * SFX_GAIN;

  volume.gain.setValueAtTime(mixedGain, start);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(context.destination);
  source.start(start);
  source.stop(start + duration);
}

function createLoopingNoise(context, duration = 2) {
  const sampleCount =
    Math.max(1, Math.floor(context.sampleRate * duration));

  const buffer =
    context.createBuffer(1, sampleCount, context.sampleRate);

  const data = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    const next = Math.random() * 2 - 1;
    const previous = data[index - 1] || 0;
    data[index] = previous * 0.22 + next * 0.78;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function connectFilteredLoop({
  context,
  destination,
  filterType,
  frequency,
  gain,
  duration,
  modulate = false,
}) {
  const source = createLoopingNoise(context, duration);
  const filter = context.createBiquadFilter();
  const volume = context.createGain();

  filter.type = filterType;
  filter.frequency.value = frequency;
  volume.gain.value = gain;

  source.connect(filter);
  filter.connect(volume);
  volume.connect(destination);
  source.start();

  if (modulate) {
    modulateGain(volume.gain, gain);
  }
}

function modulateGain(gainParam, baseGain) {
  function drift() {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const duration = randomBetween(8, 18);
    const target = baseGain * randomBetween(0.64, 1.18);

    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(gainParam.value, now);
    gainParam.linearRampToValueAtTime(target, now + duration);
    window.setTimeout(drift, duration * 1000);
  }

  drift();
}

function playAmbientIncident() {
  const roll = Math.random();

  if (roll < 0.38) {
    playNoise({
      duration: randomBetween(0.38, 0.62),
      gain: 0.0042,
      filterType: "bandpass",
      frequency: randomBetween(1350, 1850),
    });
    playNoise({
      duration: randomBetween(0.18, 0.30),
      gain: 0.0028,
      delay: 0.16,
      filterType: "highpass",
      frequency: randomBetween(2400, 3200),
    });
    return;
  }

  if (roll < 0.72) {
    playTone({
      frequency: randomBetween(48, 56),
      endFrequency: randomBetween(62, 70),
      duration: 0.34,
      type: "triangle",
      gain: 0.009,
      lowpass: 420,
    });
    playNoise({
      duration: 0.42,
      gain: 0.0052,
      delay: 0.035,
      filterType: "lowpass",
      frequency: 330,
    });
    return;
  }

  playTone({
    frequency: randomBetween(290, 330),
    endFrequency: randomBetween(240, 270),
    duration: 0.055,
    type: "triangle",
    gain: 0.0062,
    lowpass: 1400,
  });
  playNoise({
    duration: 0.08,
    gain: 0.0036,
    delay: 0.035,
    filterType: "bandpass",
    frequency: 900,
  });
}

function scheduleAmbientIncident() {
  if (!ambienceStarted) return;

  window.clearTimeout(ambientIncidentTimer);

  ambientIncidentTimer = window.setTimeout(() => {
    playAmbientIncident();
    scheduleAmbientIncident();
  }, randomBetween(6500, 12500));
}

function startAmbientSound() {
  if (ambienceStarted) return;

  const context = gameAudio();
  if (!context) return;

  ambienceStarted = true;
  ambienceMaster = context.createGain();
  ambienceMaster.gain.value = 0.58;
  ambienceMaster.connect(context.destination);

  const refrigerator = context.createOscillator();
  const refrigeratorVolume = context.createGain();
  refrigerator.type = "triangle";
  refrigerator.frequency.value = 58;
  refrigeratorVolume.gain.value = 0.013;
  refrigerator.connect(refrigeratorVolume);
  refrigeratorVolume.connect(ambienceMaster);
  refrigerator.start();
  modulateGain(refrigeratorVolume.gain, 0.013);

  const electrical = context.createOscillator();
  const electricalVolume = context.createGain();
  electrical.type = "sine";
  electrical.frequency.value = 119;
  electricalVolume.gain.value = 0.0054;
  electrical.connect(electricalVolume);
  electricalVolume.connect(ambienceMaster);
  electrical.start();
  modulateGain(electricalVolume.gain, 0.0054);

  connectFilteredLoop({
    context,
    destination: ambienceMaster,
    filterType: "lowpass",
    frequency: 240,
    gain: 0.0082,
    duration: 3,
    modulate: true,
  });

  connectFilteredLoop({
    context,
    destination: ambienceMaster,
    filterType: "bandpass",
    frequency: 1400,
    gain: 0.0038,
    duration: 2.7,
    modulate: true,
  });

  connectFilteredLoop({
    context,
    destination: ambienceMaster,
    filterType: "bandpass",
    frequency: 2400,
    gain: 0.0027,
    duration: 1.9,
    modulate: true,
  });

  scheduleAmbientIncident();
}

function playScanSound() {
  const base = randomBetween(955, 1005);

  playNoise({
    duration: 0.008,
    gain: 0.006,
    filterType: "bandpass",
    frequency: 2450,
  });
  playTone({
    frequency: base,
    endFrequency: base - randomBetween(95, 135),
    duration: randomBetween(0.047, 0.053),
    type: "triangle",
    gain: randomBetween(0.022, 0.025),
  });
}

function playPaymentSound(type) {
  playNoise({
    duration: 0.010,
    gain: 0.0048,
    filterType: "bandpass",
    frequency: 1900,
  });

  if (type === "tap") {
    playTone({
      frequency: 1160,
      duration: 0.04,
      type: "triangle",
      gain: 0.019,
    });
    playTone({
      frequency: 1320,
      duration: 0.032,
      type: "triangle",
      gain: 0.0085,
      delay: 0.055,
    });
    return;
  }

  /*
    Card is deliberately a different silhouette from tap:
    a medium approval body, then one tiny latch-like confirmation.
  */
  playTone({
    frequency: 690,
    endFrequency: 720,
    duration: 0.105,
    type: "triangle",
    gain: 0.018,
  });
  playTone({
    frequency: 1040,
    duration: 0.026,
    type: "triangle",
    gain: 0.014,
    delay: 0.120,
  });
}

function playAnomalyFlickerSound() {
  playNoise({
    duration: 0.026,
    gain: 0.0065,
    filterType: "bandpass",
    frequency: randomBetween(520, 760),
  });
  playTone({
    frequency: randomBetween(172, 190),
    endFrequency: randomBetween(128, 144),
    duration: 0.075,
    type: "triangle",
    gain: 0.010,
    delay: 0.012,
    lowpass: 900,
  });
}

function playCashPaperSound() {
  playNoise({
    duration: 0.020,
    gain: 0.0082,
    filterType: "bandpass",
    frequency: 2700,
  });
  playNoise({
    duration: 0.085,
    gain: 0.0058,
    delay: 0.018,
    filterType: "bandpass",
    frequency: 1250,
  });
}

function playCashDrawerSound() {
  playNoise({
    duration: 0.014,
    gain: 0.012,
    filterType: "bandpass",
    frequency: 2300,
  });
  playNoise({
    duration: 0.045,
    gain: 0.030,
    delay: 0.006,
    filterType: "lowpass",
    frequency: 520,
  });
  playTone({
    frequency: 140,
    endFrequency: 92,
    duration: 0.07,
    type: "triangle",
    gain: 0.020,
    delay: 0.008,
  });
}

function stopMicrowaveHum() {
  if (!microwaveHum) return;

  const { context, master, nodes } = microwaveHum;
  const now = context.currentTime;

  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(
    Math.max(0.0001, master.gain.value),
    now
  );
  master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.055
  );

  nodes.forEach((node) => {
    try {
      node.stop(now + 0.07);
    } catch (_error) {
      // Oscillator/source may already have been stopped.
    }
  });

  microwaveHum = null;
}

function startMicrowaveHum() {
  const context = gameAudio();
  if (!context) return;

  stopMicrowaveHum();

  const start = context.currentTime;
  const master = context.createGain();
  const motor = context.createOscillator();
  const wobble = context.createOscillator();
  const wobbleAmount = context.createGain();
  const lowNoise = createLoopingNoise(context, 0.7);
  const lowNoiseFilter = context.createBiquadFilter();
  const lowNoiseVolume = context.createGain();
  const cabinetTone = context.createOscillator();
  const cabinetVolume = context.createGain();

  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(
    0.013 * SFX_GAIN,
    start + 0.05
  );
  master.connect(context.destination);

  motor.type = "triangle";
  motor.frequency.setValueAtTime(116, start);

  wobble.type = "sine";
  wobble.frequency.setValueAtTime(6.6, start);
  wobbleAmount.gain.setValueAtTime(1.4, start);
  wobble.connect(wobbleAmount);
  wobbleAmount.connect(motor.frequency);

  lowNoiseFilter.type = "lowpass";
  lowNoiseFilter.frequency.setValueAtTime(430, start);
  lowNoiseVolume.gain.setValueAtTime(0.16, start);

  cabinetTone.type = "sine";
  cabinetTone.frequency.setValueAtTime(232, start);
  cabinetVolume.gain.setValueAtTime(0.18, start);

  motor.connect(master);
  lowNoise.connect(lowNoiseFilter);
  lowNoiseFilter.connect(lowNoiseVolume);
  lowNoiseVolume.connect(master);
  cabinetTone.connect(cabinetVolume);
  cabinetVolume.connect(master);

  motor.start(start);
  wobble.start(start);
  lowNoise.start(start);
  cabinetTone.start(start);

  microwaveHum = {
    context,
    master,
    nodes: [
      motor,
      wobble,
      lowNoise,
      cabinetTone
    ],
  };
}

function playMicrowaveStartSound() {
  playNoise({
    duration: 0.018,
    gain: 0.011,
    filterType: "bandpass",
    frequency: 1800,
  });
  playTone({
    frequency: 96,
    endFrequency: 118,
    duration: 0.075,
    type: "triangle",
    gain: 0.014,
    delay: 0.014,
    lowpass: 640,
  });
  startMicrowaveHum();
}

function playMicrowaveDoneSound() {
  stopMicrowaveHum();

  playTone({
    frequency: 1120,
    endFrequency: 1085,
    duration: 0.12,
    type: "triangle",
    gain: 0.022,
    lowpass: 2600,
  });
  playTone({
    frequency: 1980,
    endFrequency: 1900,
    duration: 0.045,
    type: "sine",
    gain: 0.0035,
    delay: 0.012,
    lowpass: 3000,
  });
}

function playReceiptPrintSound() {
  playNoise({
    duration: 0.018,
    gain: 0.0052,
    filterType: "bandpass",
    frequency: 1800,
  });

  [0, 0.045, 0.09, 0.135].forEach((delay) => {
    playTone({
      frequency: randomBetween(210, 250),
      duration: 0.018,
      type: "triangle",
      gain: 0.0054,
      delay,
      lowpass: 900,
    });
    playNoise({
      duration: 0.025,
      gain: 0.007,
      delay: delay + 0.002,
      filterType: "bandpass",
      frequency: 1250,
    });
  });
}

function playBagRustleSound() {
  playNoise({
    duration: 0.014,
    gain: 0.0062,
    filterType: "bandpass",
    frequency: 3200,
  });
  playNoise({
    duration: 0.145,
    gain: 0.0056,
    delay: 0.016,
    filterType: "bandpass",
    frequency: 1150,
  });
  playNoise({
    duration: 0.045,
    gain: 0.0035,
    delay: 0.058,
    filterType: "highpass",
    frequency: 2100,
  });
}

function playDialogueTone({
  frequency,
  endFrequency,
  duration,
  gain,
}) {
  const context = gameAudio();
  if (!context) return;

  const start = context.currentTime;
  const end = start + duration;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const volume = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    end
  );

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, start);

  const mixedGain =
    gain * SFX_GAIN * DIALOGUE_TICK_GAIN;

  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(
    mixedGain,
    start + 0.0012
  );
  volume.gain.exponentialRampToValueAtTime(
    0.0001,
    end
  );

  oscillator.connect(filter);
  filter.connect(volume);
  volume.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.002);
}

function playDialogueTick(character) {
  if (!character || /\s|[.,!?;]/.test(character)) return;

  dialogueTickStep += 1;

  if (
    dialogueTickStep % 3 !== 1 &&
    Math.random() < 0.82
  ) {
    return;
  }

  const pitch =
    randomBetween(1420, 1660);

  playNoise({
    duration: 0.004,
    gain: 0.0062 * DIALOGUE_TICK_GAIN,
    filterType: "bandpass",
    frequency: randomBetween(3300, 4100),
  });

  playDialogueTone({
    frequency: pitch,
    endFrequency: pitch * 0.985,
    duration: 0.007,
    gain: 0.0028,
  });
}

async function pulseState(node, className, duration) {
  if (!node) {
    await sleep(duration);
    return;
  }

  node.classList.add(className);
  await sleep(duration);
  node.classList.remove(className);
}


function waitForAnimation(node, fallbackMs) {
  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      node.removeEventListener("animationend", finish);
      resolve();
    };

    node.addEventListener("animationend", finish, {
      once: true,
    });

    window.setTimeout(finish, fallbackMs);
  });
}

function hasSavedRecord(event = currentEvent()) {
  return Boolean(shiftState.decisionFor(event.id));
}

function rescanCount(event = currentEvent()) {
  return shiftState.checksFor(event.id).length;
}

function currentEvent() {
  return events[state.eventIndex];
}

function money(value) {
  return `¥${value}`;
}

function posScreenName(item) {
  if (!item) return "";
  if (item.screen) return item.screen;
  return item.pos;
}

function paymentModeLabel(event = currentEvent()) {
  if (event.paymentType === "cash") return "CASH";
  if (event.paymentType === "tap") return "TAP";
  if (event.paymentType === "card") return "CARD";
  return "PAID";
}

function paymentPulseClass(event = currentEvent()) {
  if (event.paymentType === "cash") return "cash-processing";
  if (event.paymentType === "tap") return "tap-processing";
  return "processing";
}

function spritePath(name) {
  return `assets/pixel-sprites/${name}.svg?v=feedback-10`;
}

function customerPath(name, pose = "idle") {
  const suffix = pose === 'idle' ? '' : `-${pose}`;
  return `assets/pixel-sprites/${name.replace("customer-", "customer-detail-")}-natural${suffix}.svg?v=shift-4`;
}

function customerReceivingHand() {
  const rect = world.rect(customer);
  const height = Math.min(rect.height, rect.width * 160 / 96);
  const width = height * 96 / 160;
  return {
    x: PixelWorld.snap(rect.left + (rect.width - width) / 2 + width * 87 / 96),
    y: PixelWorld.snap(rect.top + (rect.height - height) / 2 + height * 120 / 160),
  };
}

function prepareReceivingPose(customerId) {
  if (!receivingPoseCache.has(customerId)) {
    const image = new Image();
    image.src = customerPath(customerId, "receive");
    receivingPoseCache.set(customerId, image.decode().then(() => true, () => false));
  }
  return receivingPoseCache.get(customerId);
}

async function showReceivingPose() {
  const event = currentEvent();
  const available = await prepareReceivingPose(customerLineup[state.eventIndex]);
  // A failed decorative asset must never prevent the order from completing.
  if (!available || currentEvent() !== event) return;
  customerPose = "receive";
  render();
}

async function showCustomerHandPose() {
  const event = currentEvent();
  const available = await prepareReceivingPose(customerLineup[state.eventIndex]);
  if (!available || currentEvent() !== event) return false;
  customerPose = "receive";
  render();
  return true;
}

function environmentStage(index, paid, confirmed, reportShown) {
  if (reportShown) return "quiet";
  if (index === 7) return "witness";
  if (index === 4 && confirmed) return "double";
  return "quiet";
}

// Quantized hands keep the clock on the sprite grid, with no rotating vector edge.
function clockHandPath(angle, length, thickness) {
  const radians = angle * Math.PI / 180;
  const centerX = 47;
  const centerY = 47;
  const xEnd = Math.round(centerX + Math.sin(radians) * length);
  const yEnd = Math.round(centerY - Math.cos(radians) * length);
  const steps = Math.max(
    Math.abs(xEnd - centerX),
    Math.abs(yEnd - centerY)
  );
  const offset = Math.floor(thickness / 2);
  let d = "";
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(centerX + (xEnd - centerX) * step / steps);
    const y = Math.round(centerY + (yEnd - centerY) * step / steps);
    d +=
      `M${x - offset} ${y - offset}` +
      `h${thickness}v${thickness}h-${thickness}z`;
  }
  return d;
}

function renderEnvironment(event) {
  frame.dataset.environment = environmentStage(
    state.eventIndex, state.paid, hasSavedRecord(), state.reportShown
  );
  const clockCase = clock.closest(".clock");
  if (clockCase.dataset.time !== event.clock) {
    const [hours, minutes] = event.clock.split(":").map(Number);
    clockCase.querySelector("[data-clock-hour]").setAttribute("d", clockHandPath((hours % 12) * 30 + minutes / 2, 12, 3));
    clockCase.querySelector("[data-clock-minute]").setAttribute("d", clockHandPath(minutes * 6, 18, 2));
    clockCase.dataset.time = event.clock;
    clockCase.setAttribute("role", "img");
    clockCase.setAttribute("aria-label", `Clock ${event.clock}`);
  }
}


const TABLE_SURFACE = [
  { x: 24.9, y: 48.8 },
  { x: 56.3, y: 48.7 },
  { x: 91.9, y: 49 },
  { x: 97.8, y: 56.9 },
  { x: 89.4, y: 60.2 },
  { x: 29.4, y: 60.1 },
  { x: 20.7, y: 67.8 },
  { x: 0.7, y: 68 },
];


function tableSurfaceCssValue() {
  return TABLE_SURFACE.map((point) => `${point.x}% ${point.y}%`).join(", ");
}


function updateTableSurfaceVariable() {
  workArea?.style.setProperty("--table-surface", tableSurfaceCssValue());
}

updateTableSurfaceVariable();


const SVG_NS = "http://www.w3.org/2000/svg";

const DIALOGUE_LAYOUT = Object.freeze({
  minWidth: 128,
  maxWidth: 410,
  paddingX: 38,
  maxTextWidth: 338,

  bodyTop: 8,
  minBodyHeight: 58,
  lineHeight: 21,
  baselineOffset: 7,

  tailDepth: 16,

  screenScale: 0.066,

  typewriterDelay: 22,
  typewriterCommaPause: 48,
  typewriterStopPause: 72,
  betweenLinePause: 1350,
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


/* =========================================================
   TEXT MEASUREMENT
   ========================================================= */

function measureDialogueText(text) {
  dialogueText.replaceChildren();
  dialogueText.textContent = text || " ";

  const width = dialogueText.getComputedTextLength();

  dialogueText.textContent = "";

  return width;
}


/* =========================================================
   PIXEL-WIDTH WORD WRAPPING
   ========================================================= */

function wrapDialogue(text) {
  const words = text.trim().split(/\s+/);

  if (!words.length) {
    return [""];
  }

  const rows = [];
  let currentRow = "";

  for (const word of words) {
    const candidate =
      currentRow === ""
        ? word
        : `${currentRow} ${word}`;

    const candidateWidth =
      measureDialogueText(candidate);

    if (
      currentRow &&
      candidateWidth > DIALOGUE_LAYOUT.maxTextWidth
    ) {
      rows.push(currentRow);
      currentRow = word;
    } else {
      currentRow = candidate;
    }
  }

  if (currentRow) {
    rows.push(currentRow);
  }

  return rows;
}

function clearDialogueTyping() {
  if (dialogueTypingTimer) {
    window.clearTimeout(dialogueTypingTimer);
    dialogueTypingTimer = null;
  }
}

function clearDialogueLock() {
  if (dialogueUnlockTimer) {
    window.clearTimeout(dialogueUnlockTimer);
    dialogueUnlockTimer = null;
  }
  dialogueLocked = false;
}

function dialogueSequenceDuration(lines = []) {
  if (!lines.length) return 0;

  return lines.reduce((duration, line, index) => {
    const nextLinePause =
      index < lines.length - 1
        ? DIALOGUE_LAYOUT.betweenLinePause
        : 0;

    return (
      duration +
      dialogueTypingDuration(line) +
      nextLinePause
    );
  }, 0);
}

function lockDialogueInput(lines = []) {
  clearDialogueLock();

  if (!lines.length || !lines.some(Boolean)) {
    render();
    return;
  }

  dialogueLocked = true;
  const revision = dialogueRevision;
  const duration =
    prefersReducedDialogueMotion()
      ? 180
      : dialogueSequenceDuration(lines) + 180;

  dialogueUnlockTimer = window.setTimeout(() => {
    if (revision !== dialogueRevision) return;
    dialogueUnlockTimer = null;
    dialogueLocked = false;
    render();
  }, duration);

  render();
}

function dialogueCharacterCount(rows) {
  return rows.reduce(
    (total, row) => total + row.length,
    0
  );
}

function visibleDialogueRows(rows, count) {
  let remaining = count;

  return rows.map((row) => {
    const visibleCount =
      Math.max(0, Math.min(row.length, remaining));

    remaining -= row.length;

    return row.slice(0, visibleCount);
  });
}

function dialogueTypingDelay(character) {
  if (/[.!?]/.test(character)) {
    return DIALOGUE_LAYOUT.typewriterStopPause;
  }

  if (/[,;]/.test(character)) {
    return DIALOGUE_LAYOUT.typewriterCommaPause;
  }

  return DIALOGUE_LAYOUT.typewriterDelay;
}

function dialogueTypingDuration(text) {
  if (!text) return 0;

  return [...text].reduce(
    (duration, character) =>
      duration + dialogueTypingDelay(character),
    DIALOGUE_LAYOUT.typewriterDelay
  );
}

function prefersReducedDialogueMotion() {
  return window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}


/* =========================================================
   OUTER PIXEL BUBBLE
   ========================================================= */

function dialogueShellPath(width, bodyBottom) {
  const top = DIALOGUE_LAYOUT.bodyTop;
  const left = 12;
  const right = width - 10;

  return [
    // top
    `M24 ${top}`,
    `H${right - 14}`,
    `V${top + 6}`,
    `H${right - 6}`,
    `V${top + 12}`,
    `H${right}`,

    // right
    `V${bodyBottom - 12}`,
    `H${right - 6}`,
    `V${bodyBottom - 6}`,
    `H${right - 14}`,
    `V${bodyBottom}`,

    // bottom until tail
    `H66`,

    // short pixel tail
    `V${bodyBottom + 5}`,
    `H56`,
    `V${bodyBottom + 10}`,
    `H46`,
    `V${bodyBottom + 14}`,
    `H36`,

    // tail return
    `V${bodyBottom + 10}`,
    `H43`,
    `V${bodyBottom + 5}`,
    `H53`,
    `V${bodyBottom}`,

    // bottom-left
    `H24`,
    `V${bodyBottom - 6}`,
    `H18`,
    `V${bodyBottom - 12}`,
    `H${left}`,

    // left
    `V${top + 12}`,
    `H18`,
    `V${top + 6}`,
    `H24`,

    "Z",
  ].join(" ");
}

function dialogueFillPath(width, bodyBottom) {
  const top = DIALOGUE_LAYOUT.bodyTop + 5;
  const right = width - 14;
  const bottom = bodyBottom - 5;

  return [
    `M27 ${top}`,
    `H${right - 9}`,

    `V${top + 4}`,
    `H${right - 4}`,

    `V${bottom - 5}`,
    `H${right - 9}`,

    `V${bottom}`,

    // bottom before tail
    `H66`,

    // inner tail (slightly shorter + closer to shell)
    `V${bottom + 4}`,
    `H56`,
    `V${bottom + 8}`,
    `H47`,
    `V${bottom + 11}`,
    `H39`,

    // return
    `V${bottom + 8}`,
    `H45`,
    `V${bottom + 4}`,
    `H54`,
    `V${bottom}`,

    // bottom-left
    `H28`,
    `V${bottom - 4}`,
    `H24`,
    `V${top + 6}`,
    `H28`,

    "Z",
  ].join(" ");
}

function dialogueContentBox(width, bodyBottom) {
  return {
    left: 34,
    right: width - 30,
    top: DIALOGUE_LAYOUT.bodyTop + 14,
    bottom: bodyBottom - 14,
  };
}

/* =========================================================
   INNER PIXEL BORDER
   ========================================================= */

function dialogueInsetPath(width, bodyBottom) {
  const { left, right, top, bottom } =
    dialogueContentBox(width, bodyBottom);

  return [
    `M${left + 6} ${top}`,
    `H${right - 6}`,

    `v4`,
    `h6`,

    `V${bottom - 4}`,

    `h-6`,
    `v4`,

    `H${left + 6}`,

    `v-4`,
    `h-6`,

    `V${top + 4}`,

    `h6`,
  ].join(" ");
}

/* =========================================================
   CENTRED MULTI-LINE TEXT
   ========================================================= */

function renderDialogueText(
  rows,
  width,
  bodyTop,
  bodyBottom
) {
  dialogueText.replaceChildren();

  dialogueText.setAttribute(
    "text-anchor",
    "start"
  );

  const { left, right, top, bottom } =
    dialogueContentBox(width, bodyBottom);

  const centerY = (top + bottom) / 2;
  const textX = left + 9;

  const totalLineDistance =
    (rows.length - 1) *
    DIALOGUE_LAYOUT.lineHeight;

  const firstBaseline =
    centerY -
    totalLineDistance / 2 +
    DIALOGUE_LAYOUT.baselineOffset;

  rows.forEach((row, index) => {
    const tspan = document.createElementNS(
      SVG_NS,
      "tspan"
    );

    tspan.setAttribute(
      "x",
      textX.toFixed(1)
    );

    tspan.setAttribute(
      "y",
      (
        firstBaseline +
        index * DIALOGUE_LAYOUT.lineHeight
      ).toFixed(1)
    );

    tspan.textContent = row;

    dialogueText.appendChild(tspan);
  });
}


/* =========================================================
   DYNAMIC BUBBLE SIZE
   ========================================================= */

function updateDialogueBubble(rows, visibleRows = rows) {
  const measuredWidths =
    rows.map(measureDialogueText);

  const widestLine =
    Math.max(...measuredWidths, 0);

  // -------------------------------------------------
  // Width follows the actual text width.
  // -------------------------------------------------

  const width = Math.ceil(
    clamp(
      widestLine +
      DIALOGUE_LAYOUT.paddingX * 2,

      DIALOGUE_LAYOUT.minWidth,
      DIALOGUE_LAYOUT.maxWidth
    )
  );

  // -------------------------------------------------
  // Height follows line count.
  // -------------------------------------------------

  const bodyHeight = Math.max(
    DIALOGUE_LAYOUT.minBodyHeight,
    28 + rows.length * DIALOGUE_LAYOUT.lineHeight
  );

  const bodyBottom =
    DIALOGUE_LAYOUT.bodyTop +
    bodyHeight;

  const height =
    bodyBottom +
    DIALOGUE_LAYOUT.tailDepth +
    8;

  // -------------------------------------------------
  // Resize the SVG itself.
  // -------------------------------------------------

  dialogue.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );

  PixelWorld.place(dialogue, {
    left: 405, top: 57,
    width: width * DIALOGUE_LAYOUT.screenScale * PixelWorld.WIDTH / 100,
    height: height * DIALOGUE_LAYOUT.screenScale * PixelWorld.WIDTH / 100,
  });

  dialogue.style.aspectRatio =
    `${width} / ${height}`;

  // -------------------------------------------------
  // Bubble silhouette
  // -------------------------------------------------

  const shellPath =
    dialogueShellPath(
      width,
      bodyBottom
    );

  dialogueParts.shadow.setAttribute(
    "d",
    shellPath
  );

  dialogueParts.shadow.setAttribute(
    "transform",
    "translate(5 3)"
  );

  dialogueParts.outline.setAttribute(
    "d",
    shellPath
  );

  // Old second solid bubble is no longer needed.
  dialogueParts.bubble.setAttribute(
    "d",
    dialogueFillPath(width, bodyBottom)
  );

  // Inner decorative border.
  dialogueParts.inset.setAttribute(
    "d",
    dialogueInsetPath(
      width,
      bodyBottom
    )
  );

  dialogueParts.corner.setAttribute(
    "d",
    ""
  );

  // -------------------------------------------------
  // Finally render the visible text.
  // -------------------------------------------------

  renderDialogueText(
    visibleRows,
    width,
    DIALOGUE_LAYOUT.bodyTop,
    bodyBottom
  );
}


/* =========================================================
   DISPLAY DIALOGUE
   ========================================================= */

function displayDialogue(text) {
  clearDialogueTyping();
  dialogueTickStep = 0;

  dialogue.setAttribute(
    "aria-label",
    text || ""
  );

  if (!text) {
    dialogueTypingRevision += 1;
    dialogue.classList.add("hidden");
    dialogueText.replaceChildren();
    return;
  }

  // Must be visible before getComputedTextLength()
  // can reliably measure it.
  dialogue.classList.remove("hidden");

  const rows =
    wrapDialogue(text);

  if (prefersReducedDialogueMotion()) {
    updateDialogueBubble(rows);
    return;
  }

  const fullText =
    rows.join("");

  const totalCharacters =
    dialogueCharacterCount(rows);

  let visibleCharacters = 0;
  const typingRevision = ++dialogueTypingRevision;

  updateDialogueBubble(
    rows,
    visibleDialogueRows(rows, visibleCharacters)
  );

  function tick() {
    if (
      typingRevision !== dialogueTypingRevision ||
      !totalCharacters
    ) {
      return;
    }

    visibleCharacters += 1;
    playDialogueTick(
      fullText[visibleCharacters - 1]
    );

    updateDialogueBubble(
      rows,
      visibleDialogueRows(rows, visibleCharacters)
    );

    if (visibleCharacters >= totalCharacters) {
      dialogueTypingTimer = null;
      return;
    }

    dialogueTypingTimer = window.setTimeout(
      tick,
      dialogueTypingDelay(fullText[visibleCharacters - 1])
    );
  }

  dialogueTypingTimer = window.setTimeout(
    tick,
    DIALOGUE_LAYOUT.typewriterDelay
  );
}

function setDialogue(lines, options = {}) {
  dialogueTimers.forEach(timer => window.clearTimeout(timer));
  clearDialogueTyping();
  clearDialogueLock();
  dialogueTimers = [];
  const revision = ++dialogueRevision;
  const event = currentEvent();
  const dialogueLines = lines || [];
  displayDialogue(dialogueLines[0] || "");
  if (options.lock) {
    lockDialogueInput(dialogueLines);
  } else {
    render();
  }
  let delay = 0;
  dialogueLines.slice(1).forEach((line, index) => {
    delay +=
      dialogueTypingDuration(dialogueLines[index]) +
      DIALOGUE_LAYOUT.betweenLinePause;

    dialogueTimers.push(window.setTimeout(() => {
      if (revision === dialogueRevision && currentEvent() === event) displayDialogue(line);
    }, delay));
  });
}

function formatReactionLine(line, context = {}) {
  return line.replace(
    /\{(\w+)\}/g,
    (_, key) => context[key] ?? ""
  );
}

function normalizeReactionEntry(entry, context = {}) {
  const rawText =
    typeof entry === "string"
      ? entry
      : entry?.text || "";

  return {
    text: formatReactionLine(rawText, context),
    lock: Boolean(entry?.lock),
  };
}

function sayReaction(key, context = {}) {
  const reaction = takeReaction(key, context);
  const line = reaction.text;

  if (!line) return "";

  setDialogue([line], {
    lock: reaction.lock,
  });

  return line;
}

function takeReaction(key, context = {}) {
  const event = currentEvent();
  const lines = event.reactions?.[key];

  if (!lines?.length) {
    return {
      text: "",
      lock: false,
    };
  }

  const count =
    state.reactionCounts[key] || 0;

  const entry =
    lines[Math.min(count, lines.length - 1)];

  state.reactionCounts[key] = count + 1;

  return normalizeReactionEntry(entry, context);
}

function takeReactionLine(key, context = {}) {
  return takeReaction(key, context).text;
}

function sayReactionSequence(keys, context = {}) {
  const lines = [];
  let locked = false;

  keys.forEach((key) => {
    if (state.dialogueFlags.has(key)) return;

    const reaction =
      takeReaction(key, context);

    const line = reaction.text;

    if (!line) return;

    state.dialogueFlags.add(key);
    lines.push(line);
    locked = locked || reaction.lock;
  });

  if (lines.length) {
    setDialogue(lines, {
      lock: locked,
    });
  }

  return lines;
}

function sayReactionOnce(key, context = {}) {
  return sayReactionSequence([key], context)[0] || "";
}

function reactionReadTime(line) {
  if (!line) return 0;

  return (
    dialogueTypingDuration(line) +
    DIALOGUE_LAYOUT.betweenLinePause
  );
}

function clearPaymentWaitTimer() {
  if (paymentWaitTimer) {
    window.clearTimeout(paymentWaitTimer);
    paymentWaitTimer = null;
  }
}

function clearBagWaitTimer() {
  if (bagWaitTimer) {
    window.clearTimeout(bagWaitTimer);
    bagWaitTimer = null;
  }
}

function schedulePaymentWaitReaction() {
  clearPaymentWaitTimer();

  const event = currentEvent();

  if (!event.reactions?.waitAtPayment) return;

  paymentWaitTimer = window.setTimeout(() => {
    paymentWaitTimer = null;

    if (
      currentEvent() === event &&
      !state.busy &&
      !dialogueLocked &&
      isPaymentReady()
    ) {
      sayReactionOnce("waitAtPayment");
    }
  }, 4200);
}

function scheduleBagWaitReaction() {
  clearBagWaitTimer();

  const event = currentEvent();

  if (!event.reactions?.waitAtBag) return;

  bagWaitTimer = window.setTimeout(() => {
    bagWaitTimer = null;

    if (
      currentEvent() === event &&
      !state.busy &&
      !dialogueLocked &&
      state.paid &&
      orderNeedsBag(event) &&
      !hasPendingHeat(event) &&
      !state.bagged
    ) {
      sayReactionOnce("waitAtBag");
    }
  }, 5200);
}

function reactToBlockedAction(key) {
  if (state.busy) return false;

  const line =
    sayReactionOnce(key);

  return Boolean(line);
}

function eventScannedItems(event = currentEvent()) {
  return event.items.filter((item) => state.scannedIds.includes(item.id));
}


function renderProducts() {
  const event = currentEvent();
  products.replaceChildren();
  if (state.bagged || state.reportShown) return;
  const placements = PixelWorld.layout(event.items);
  event.items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product';
    button.dataset.itemId = item.id;
    button.setAttribute('aria-label', item.label);
    const image = document.createElement('img');
    image.className = 'sprite';
    image.src = spritePath(item.sprite);
    image.alt = '';
    button.append(image);
    const scanned = itemIsScanned(item);
    const size = placements[index];
    const footY = scanned ? 214 : 190;
    PixelWorld.place(button, {left:size.x,top:footY-size.foot,width:size.width,height:size.height});
    button.style.zIndex = scanned ? 55 : 50;
    button.classList.toggle('scanned', scanned);
    button.classList.toggle('selected', state.selectedId === item.id);
    button.classList.toggle('needs-heat', scanned && state.paid && itemNeedsHeat(item) && !itemIsHeated(item));
    button.addEventListener('click', () => selectItem(item.id));
    products.append(button);
  });
}

function renderPos() {
  const event = currentEvent();
  const scanned = eventScannedItems(event);
  const displayed = shiftState.displayedItems(event.id).filter(item => state.scannedIds.includes(item.id));
  const grouped = ShiftEngine.groupItems(displayed);
  const total = scanned.reduce((sum, item) => sum + item.price, 0);
  posList.innerHTML = scanned.length
    ? grouped.map((item) => `<div class="pos-row"><span>${item.pos} x${item.quantity}</span><b>${money(item.price * item.quantity)}</b></div>`).join("")
    : "<div class=\"pos-row\"><span>WAITING FOR ITEMS</span><b></b></div>";

  posTotal.textContent = `TOTAL ${money(total)}`;
  posMode.textContent = state.modeOverride ||
    (state.paid ? paymentModeLabel(event) : "READY");

  matchItemLabels.forEach((label, index) => {
    label.textContent = posScreenName(grouped[index]) || (index === 0 ? "WAITING FOR ITEMS" : "");
  });
  itemQuantities.forEach((label, index) => {
    label.textContent = grouped[index] && !state.reportShown ? `x${grouped[index].quantity}` : "";
  });
  const awaitingMatch = event.mismatch && scanned.length === event.items.length;
  const canConfirmMismatch =
    awaitingMatch &&
    !hasSavedRecord();

  confirmItems.disabled =
    state.busy ||
    dialogueLocked ||
    !awaitingMatch ||
    hasSavedRecord();

  if (event.mismatch && scanned.length === event.items.length) {
    posStatus.textContent = hasSavedRecord()
      ? "RECORD SAVED"
      : rescanCount(event) > 0
        ? "RECORD PENDING"
        : "RE-SCAN PENDING";
    confirmItems.classList.toggle(
      "hidden",
      !awaitingMatch || hasSavedRecord()
    );
  } else if (state.transientStatus) {
    posStatus.textContent = state.transientStatus;
    confirmItems.classList.add("hidden");
  } else if (state.reportShown) {
    posStatus.textContent = `SALES ${money(shiftState.report().sales)}`;
    confirmItems.classList.add("hidden");
  } else {
    posStatus.textContent = `${scanned.length} ITEMS`;
    confirmItems.classList.add("hidden");
  }
  matchStatus.textContent = posStatus.textContent;
  matchPrompt.textContent = canConfirmMismatch
    ? rescanCount() > 0
      ? "REVIEW ENTRY"
      : "RE-SCAN ITEMS"
    : `TOTAL ${money(total)}  ${posMode.textContent}`;

  if (state.reportShown) {
    const report = shiftState.report();
    posList.textContent = `SALES ${money(report.sales)} / ${report.orders} TRANSACTIONS`;
    posTotal.textContent = `TOTAL ${money(report.sales)}`;
    posStatus.textContent = "SHIFT CLOSED";
    posMode.textContent = "REPORT";
    matchItemLabels[0].textContent = `SALES ${money(report.sales)}`;
    matchItemLabels[1].textContent = `EDIT ${report.overrides} LINK ${report.links}`;
    matchStatus.textContent = "SHIFT CLOSED";
    matchPrompt.textContent = `${report.orders} SALES / REG#02`;
  }
  const comparisonVisible = Boolean(awaitingMatch && !state.paid && !state.reportShown);
  const alertVisible = countAlertVisible && Boolean(event.afterPayStatus);
  mismatchDisplay.classList.toggle("is-alert", comparisonVisible || alertVisible);
  posNormal.classList.toggle("hidden", comparisonVisible || alertVisible);
  posComparison.classList.toggle("hidden", !comparisonVisible);
  posCountAlert.classList.toggle("hidden", !alertVisible);
  matchStatus.classList.toggle("hidden", alertVisible);
  itemSources.forEach((label, index) => { label.textContent = scanned[index]?.real || scanned[index]?.label || ""; });
  registerSources.forEach((label, index) => { label.textContent = posScreenName(scanned[index]); });
  const comparisonLabels = posComparison.querySelectorAll('.pos-screen-label text');
  comparisonLabels[2].textContent = event.decisionKind === 'provenance' ? 'OLD' : 'ITEM';
  comparisonLabels[3].textContent = event.decisionKind === 'provenance' ? 'SRC' : 'REG';
  if (comparisonVisible && event.decisionKind === 'provenance') {
    const prior = shiftState.decisionFor(event.linkedOrderId);
    itemSources[1].textContent = prior?.finalRecordedLabel || '';
    const reference = event.linkedOrderId.replace('sale-', '#');
    registerSources[1].textContent = `${prior?.recordOrigin || ''} ${reference}`;
    matchStatus.textContent = `LINK: ${reference}`;
  } else if (comparisonVisible) {
    matchStatus.textContent = hasSavedRecord() ? 'RECORD SAVED' : 'CHECK RECORD';
  }
  countAnomaly.textContent = alertVisible ? state.transientStatus : "";
  countScanned.textContent = alertVisible ? `SCANNED: ${scanned.length}` : "";
  if (alertVisible) {
    mismatchDisplay.setAttribute("aria-label", `${state.transientStatus}. SCANNED: ${scanned.length}`);
    return;
  }
  if (comparisonVisible) {
    mismatchDisplay.setAttribute("aria-label", [matchStatus.textContent,
    ...scanned.map(item => `ITEM ${item.real || item.label}. REGISTER ${item.pos}`)].join(". "));
    return;
  }
  mismatchDisplay.setAttribute("aria-label", [
    ...Array.from(matchItemLabels, (label, index) =>
      `${label.textContent} ${itemQuantities[index].textContent}`.trim()),
    matchStatus.textContent,
    matchPrompt.textContent,
  ].filter(Boolean).join(". "));
}

function renderReceipt(lines = []) {
  receipt.classList.toggle("printed", Boolean(lines.length));
  receipt.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
}

function resetFeedback() {
  feedbackRevision += 1;
  feedbackTimers.forEach(timer => window.clearTimeout(timer));
  feedbackTimers = [];
  clearCueDelay();
  countAttention = false;
  countAlertVisible = false;
  previousCueKeys.clear();
  pendingCueKeys.clear();
  cueAnimations.forEach(({ animation }) => animation.cancel());
  cueAnimations.clear();
}

function clearCueDelay() {
  if (cueDelayTimer) {
    window.clearTimeout(cueDelayTimer);
    cueDelayTimer = null;
  }
  cueDelaySignature = "";
  cueDelayReady = false;
}

function delayedCuesApply() {
  return state.eventIndex >= CUE_DELAY_START_EVENT;
}

function cueTargetSignature(targets) {
  return [...targets.keys()].sort().join("|");
}

function cueDisplayReady(targets, showCues) {
  if (!showCues || !targets.size) {
    clearCueDelay();
    return false;
  }

  if (!delayedCuesApply()) {
    clearCueDelay();
    return true;
  }

  const signature = cueTargetSignature(targets);

  if (signature !== cueDelaySignature) {
    clearCueDelay();
    cueDelaySignature = signature;
    cueDelayTimer = window.setTimeout(() => {
      if (cueDelaySignature !== signature || !delayedCuesApply()) return;
      cueDelayReady = true;
      cueDelayTimer = null;
      render();
    }, CUE_DELAY_MS);
  }

  return cueDelayReady;
}

function startCountAnomaly(event) {
  const revision = ++feedbackRevision;
  feedbackTimers.forEach(timer => window.clearTimeout(timer));
  countAttention = true;
  countAlertVisible = true;
  state.transientStatus = event.afterPayStatus[0];
  playAnomalyFlickerSound();
  render();
  const later = (delay, update) => window.setTimeout(() => {
    if (revision !== feedbackRevision || currentEvent() !== event) return;
    update();
    render();
  }, delay);
  feedbackTimers = [
    later(800, () => { countAttention = false; }),
    later(1700, () => {
      countAlertVisible = false;
      state.transientStatus = event.afterPayStatus[1];
      playAnomalyFlickerSound();
    }),
  ];
}

function pulseNewCues(targets, showCues) {
  const eligible = new Set(targets.keys());
  for (const key of eligible) if (!previousCueKeys.has(key)) pendingCueKeys.add(key);
  for (const key of pendingCueKeys) if (!eligible.has(key)) pendingCueKeys.delete(key);
  previousCueKeys = eligible;
  for (const [key, entry] of cueAnimations) {
    if (!showCues || !eligible.has(key) || targets.get(key).node !== entry.node) {
      entry.animation.cancel();
      cueAnimations.delete(key);
    }
  }
  if (!showCues) return;
  for (const key of pendingCueKeys) {
    const { node, weak } = targets.get(key);
    // Capture the existing outline so a brightness pulse never replaces it.
    const filter = getComputedStyle(node).filter;
    const base = filter === "none" ? "" : `${filter} `;
    const animation = node.animate([
      { filter: `${base}brightness(1)` },
      { filter: `${base}brightness(${weak ? 1.10 : 1.24})`, offset: 0.5 },
      { filter: `${base}brightness(1)` },
    ], { duration: 280, easing: "steps(3, end)", iterations: 1 });
    const entry = { node, animation };
    cueAnimations.set(key, entry);
    const remove = () => { if (cueAnimations.get(key) === entry) cueAnimations.delete(key); };
    animation.finished.then(remove, remove);
  }
  pendingCueKeys.clear();
}

function renderNextTargets() {
  const event = currentEvent();
  const needsBag = orderNeedsBag(event);

  const pendingHeat =
    hasPendingHeat(event);

  const selectedItem =
    event.items.find(
      (item) =>
        item.id === state.selectedId
    );

  const selectedIsScanned =
    selectedItem &&
    itemIsScanned(selectedItem);

  const canHeatSelected =
    state.paid &&
    selectedItem &&
    selectedIsScanned &&
    itemNeedsHeat(selectedItem) &&
    !itemIsHeated(selectedItem);

  const canScanSelected =
    selectedItem &&
    !state.paid &&
    (!selectedIsScanned || event.mismatch);

  const paymentReady =
    isPaymentReady();

  const cashPaymentReady =
    paymentReady &&
    event.paymentType === "cash";

  const terminalPaymentReady =
    paymentReady &&
    event.paymentType !== "cash";

  const anomalyQuiet =
    Boolean(event.afterPayStatus && (countAttention || countAlertVisible)) ||
    Boolean(event.mismatch && eventScannedItems(event).length === event.items.length && !hasSavedRecord());

  const showCues =
    shiftStarted &&
    !state.busy &&
    !dialogueLocked &&
    !countAttention &&
    !anomalyQuiet &&
    !products.classList.contains("is-held");
  const targets = new Map();
  const deviceCues = [
    ["scanner", scanner, Boolean(canScanSelected)],
    ["payment", payment, terminalPaymentReady],
    ["cash-payment", coinTray, cashPaymentReady],
    ["microwave", microwave, Boolean(canHeatSelected)],
    ["bag", bag, state.paid && needsBag && !pendingHeat && !state.bagged],
    ["report", receiptButton, event.finalReport && state.bagged && !state.reportShown],
    ["confirm", confirmItems, event.mismatch && !hasSavedRecord() && rescanCount() > 0 && eventScannedItems(event).length === event.items.length],
  ];
  for (const [key, node, eligible] of deviceCues) {
    if (eligible) targets.set(key, { node, weak: false });
  }
  if (!state.bagged && !state.reportShown) {
    const candidates = state.paid
      ? pendingHeatItems(event)
      : event.items.filter(item => !itemIsScanned(item));
    for (const item of candidates) {
      const node = products.querySelector(`[data-item-id="${item.id}"]`);
      if (node) targets.set(`item:${item.id}`, { node, weak: true });
    }
  }
  const showVisibleCues =
    cueDisplayReady(targets, showCues);

  for (const [key, node, eligible] of deviceCues) {
    node.classList.toggle("is-next", Boolean(eligible && showVisibleCues));
  }

  pulseNewCues(targets, showVisibleCues);

  payment.classList.toggle(
    "paid",
    state.paid
  );
}

function render() {
  const event = currentEvent();
  frame.dataset.state = getStateName();
  frame.classList.toggle("is-waiting-start", !shiftStarted);
  frame.classList.toggle("is-busy", state.busy);
  frame.classList.toggle("is-dialogue-locked", dialogueLocked);
  clock.textContent = event.clock;
  renderEnvironment(event);
  customerCount.textContent = `CUST ${String(state.eventIndex + 1).padStart(3, "0")}`;
  const customerId = customerLineup[state.eventIndex];
  const customerSrc = customerPath(customerId, customerPose);
  prepareReceivingPose(customerId);
  if (customer.getAttribute("src") !== customerSrc) customer.src = customerSrc;
  customer.dataset.variant = customerId;
  customer.alt = customerId === "customer-collie" ? "Border collie customer" : "Customer";
  renderProducts();
  renderPos();
  renderNextTargets();
  reviewAccess.disabled = !shiftStarted || state.busy;
  const reviewNeeded = event.mismatch && !hasSavedRecord() && eventScannedItems().length === event.items.length;
  reviewAccess.setAttribute('aria-label', reviewNeeded ? 'Review entry' : 'View transaction records');
  reviewAccess.dataset.attention = String(Boolean(reviewNeeded));
  if (registerReview.open) renderRegisterReview();
}

function getStateName() {
  if (state.reportShown) return "report";
  if (state.bagged) return "complete_order";
  if (state.paid && hasPendingHeat()) return "service_required";
  if (state.paid) return "paid";
  if (isPaymentReady()) return "payment_ready";
  if (state.selectedId) return "item_selected";
  if (currentEvent().items.length) return "item_placed";
  return "wait_customer";
}

function selectItem(id) {
  if (
    !shiftStarted ||
    state.busy ||
    dialogueLocked ||
    state.bagged
  ) {
    return;
  }

  const event = currentEvent();

  const item =
    event.items.find(
      (entry) => entry.id === id
    );

  if (!item) return;

  /*
    Before payment:
    normal scanner selection.
  */
  if (!state.paid) {
    state.selectedId = id;

    if (!itemIsScanned(item)) {
      scanPad.classList.add("flash");

      window.setTimeout(
        () =>
          scanPad.classList.remove("flash"),
        160
      );
    }

    render();
    return;
  }

  /*
    After payment:
    only unheated heat-required goods
    remain selectable.
  */
  if (
    !itemNeedsHeat(item) ||
    itemIsHeated(item)
  ) {
    return;
  }

  state.selectedId = id;

  render();
}

async function animateSelectedThroughScanner(itemId) {
  const oldNode = products.querySelector(`[data-item-id="${itemId}"]`);
  if (!oldNode) return;
  const start = world.rect(oldNode);
  const target = world.rect(scanner);
  const ghost = oldNode.cloneNode(true);
  ghost.classList.add('product-ghost');
  ghost.removeAttribute('data-item-id');
  PixelWorld.place(ghost, start);
  world.layer.append(ghost);
  oldNode.style.visibility = 'hidden';
  const scan = { x: PixelWorld.snap(target.left + target.width/2 - start.left-start.width/2,2),
    y: PixelWorld.snap(target.top + target.height*.43 - start.top-start.height/2,2) };
  try {
    await PixelWorld.move(ghost,[{t:0,x:0,y:0},{t:1,...scan}],115);
    scanner.classList.add('reading');
    playScanSound();
    await sleep(65);
    if (!state.scannedIds.includes(itemId)) state.scannedIds.push(itemId);
    state.selectedId = null;
    render();
    const next = products.querySelector(`[data-item-id="${itemId}"]`);
    if (!next) return;
    const end = world.rect(next);
    next.style.visibility = 'hidden';
    ghost.classList.remove('selected');
    await sleep(45);
    scanner.classList.remove('reading');
    await PixelWorld.move(ghost,[{t:0,...scan},{t:1,x:end.left-start.left,y:end.top-start.top}],135);
    next.style.visibility = '';
  } finally {
    scanner.classList.remove('reading');
    ghost.remove();
  }
}

async function scanSelected() {
  const event = currentEvent();

  if (!shiftStarted) return;
  if (dialogueLocked) return;

  if (
    state.busy ||
    !state.selectedId ||
    state.paid
  ) {
    if (!state.busy && state.paid) {
      reactToBlockedAction("scanAfterPay");
    }
    return;
  }

  const item =
    event.items.find(
      (entry) =>
        entry.id === state.selectedId
    );

  if (
    item &&
    itemIsScanned(item) &&
    (!event.mismatch || hasSavedRecord())
  ) {
    reactToBlockedAction("redundantScan");
    return;
  }

  const scannedId =
    state.selectedId;

  const wasAlreadyScanned =
    item && itemIsScanned(item);

  state.busy = true;
  state.modeOverride = "READING";

  render();

  await animateSelectedThroughScanner(
    scannedId
  );

  if (item) {
    const scannedCount =
      eventScannedItems(event).length;

    const reactionKeys = [];

    if (wasAlreadyScanned) {
      shiftState.check(event.id, item.id);
      if (event.mismatch) {
        playAnomalyFlickerSound();
      }
      reactionKeys.push(
        rescanCount() > 1
          ? "secondRescan"
          : "rescan"
      );
    } else if (scannedCount === 1) {
      reactionKeys.push("firstScan");
    } else if (scannedCount === 2) {
      reactionKeys.push("secondScan");
    } else {
      reactionKeys.push("scan");
    }

    if (isPaymentReady()) {
      reactionKeys.push("paymentReady");
    }

    sayReactionSequence(reactionKeys, {
      item: item.label,
      pos: posScreenName(item),
    });
  }

  state.busy = false;
  state.modeOverride = null;
  render();

  if (isPaymentReady()) {
    schedulePaymentWaitReaction();
  }
}

function orderNeedsBag(event = currentEvent()) {
  return event.bagPreference !== "no";
}

function itemNeedsHeat(item) {
  return Boolean(item.heat);
}

function itemIsHeated(item) {
  return state.heatedIds.includes(item.id);
}

function itemIsScanned(item) {
  return state.scannedIds.includes(item.id);
}

function pendingHeatItems(event = currentEvent()) {
  return event.items.filter(
    (item) =>
      itemNeedsHeat(item) &&
      itemIsScanned(item) &&
      !itemIsHeated(item)
  );
}

function hasPendingHeat(event = currentEvent()) {
  return pendingHeatItems(event).length > 0;
}

function isPaymentReady() {
  const event = currentEvent();

  const allScanned =
    event.items.every(
      (item) =>
        itemIsScanned(item)
    );

  const mismatchReady =
    !event.mismatch ||
    hasSavedRecord();

  return (
    allScanned &&
    mismatchReady &&
    !state.paid
  );
}

async function animateCashToTray(onTrayContact = () => { }) {
  const event = currentEvent();
  const poseShown = await showCustomerHandPose();

  await sleep(poseShown ? 90 : 40);
  playCashPaperSound();

  const hand = customerReceivingHand();

  const trayRect =
    world.rect(coinTray);

  const bill =
    document.createElement("img");

  bill.className = "cash-bill-ghost";
  bill.src = "assets/pixel-sprites/cash-bill.svg?v=feedback-2";
  bill.alt = "";
  bill.setAttribute("aria-hidden", "true");

  const sourceX = hand.x;
  const sourceY = hand.y;

  const targetX =
    trayRect.left +
    trayRect.width * 0.54;

  const targetY =
    trayRect.top +
    trayRect.height * 0.45;

  const handoffX =
    sourceX + (targetX - sourceX) * 0.42;

  const handoffY =
    sourceY + (targetY - sourceY) * 0.18;

  bill.style.left = `${PixelWorld.snap(sourceX - 15)}px`;
  bill.style.top = `${PixelWorld.snap(sourceY - 7)}px`;
  bill.style.width = "30px";
  bill.style.height = "15px";

  world.layer.append(bill);

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const handoffDx = handoffX - sourceX;
  const handoffDy = handoffY - sourceY;

  const tuckHandTimer = window.setTimeout(() => {
    if (currentEvent() === event) {
      customerPose = "idle";
      render();
    }
  }, 300);

  let trayContacted = false;
  const contactTray = () => {
    if (trayContacted || currentEvent() !== event) return;
    trayContacted = true;
    playCashDrawerSound();
    onTrayContact();
  };

  const trayContactTimer =
    window.setTimeout(contactTray, 400);

  await PixelWorld.move(bill, [
    {t:0,x:0,y:0},{t:.12,x:0,y:0},
    {t:.48,x:handoffDx,y:handoffDy},{t:.58,x:handoffDx,y:handoffDy},
    {t:.86,x:dx,y:dy},{t:1,x:dx,y:dy},
  ], 540);

  window.clearTimeout(tuckHandTimer);
  window.clearTimeout(trayContactTimer);
  contactTray();

  await sleep(95);

  bill.remove();

  if (currentEvent() === event) {
    customerPose = "idle";
    render();
  }
}

async function payOrder(source = "terminal") {
  const event = currentEvent();

  if (!shiftStarted) return;
  if (dialogueLocked) return;

  if (state.busy || !isPaymentReady()) {
    if (!state.busy && !state.paid) {
      reactToBlockedAction("earlyPayment");
    }
    return;
  }

  if (event.paymentType === "cash" && source !== "cash") {
    reactToBlockedAction("wrongPayment");
    return;
  }
  if (event.paymentType !== "cash" && source === "cash") {
    reactToBlockedAction("wrongPayment");
    return;
  }

  clearPaymentWaitTimer();

  state.busy = true;
  state.modeOverride = paymentModeLabel(event);
  render();

  const paymentType = event.paymentType || "card";

  if (paymentType === "cash") {
    let registerResponse =
      Promise.resolve();

    await animateCashToTray(() => {
      registerResponse = Promise.all([
        pulseState(coinTray, "cash-processing", 360),
        pulseState(cashDrawer, "open", 420),
      ]);
    });

    await registerResponse;
  } else {
    await animateTerminalPayment(event);
  }

  state.paid = true;
  const transaction = shiftState.settle(event.id);
  const receipt = [
    `${transaction.orderId.toUpperCase()}  ${transaction.clock}`,
    ...transaction.lines.map(line => `${line.label} x${line.quantity} ¥${line.price}`),
    `TOTAL ¥${transaction.total}`, `ORIGIN: ${transaction.recordOrigin}`, `VERIFY: ${transaction.verificationMode}`,
    ...(transaction.linkedOrderId ? [`FROM: ${transaction.linkedOrderId.toUpperCase()}`] : []),
  ];

  render();

  await sleep(60);

  renderReceipt(receipt);

  playReceiptPrintSound();
  await pulseState(receiptButton, "printing", 220);

  if (event.afterPayStatus) {
    startCountAnomaly(event);
    window.setTimeout(() => {
      if (currentEvent() === event) {
        sayReaction("countAnomaly");
      }
    }, 260);
  }

  state.busy = false;
  state.modeOverride = null;

  const pendingHeat = pendingHeatItems(event);

  if (pendingHeat.length === 1) {
    state.selectedId = pendingHeat[0].id;
  }

  render();

  let postPaymentLine = "";

  if (pendingHeat.length) {
    sayReaction("heatRequest");
  } else if (!event.afterPayStatus) {
    postPaymentLine = sayReaction("pay");
  }

  if (
    !orderNeedsBag(event) &&
    !hasPendingHeat(event)
  ) {
    if (postPaymentLine) {
      state.busy = true;
      render();
      await sleep(reactionReadTime(postPaymentLine));
      state.busy = false;
      render();
    }

    await completeOrderWithoutBag();
  } else if (
    state.paid &&
    orderNeedsBag(event) &&
    !hasPendingHeat(event)
  ) {
    scheduleBagWaitReaction();
  }
}

async function heatSelected() {
  const event = currentEvent();

  if (!shiftStarted) return;
  if (dialogueLocked) return;

  if (
    state.busy ||
    !state.paid
  ) {
    if (!state.busy && !state.paid) {
      reactToBlockedAction("earlyHeat");
    }
    return;
  }

  if (!state.selectedId) {
    const pendingHeat = pendingHeatItems(event);

    if (pendingHeat.length === 1) {
      state.selectedId = pendingHeat[0].id;
      render();
    } else {
      reactToBlockedAction("unneededHeat");
      return;
    }
  }

  const item =
    event.items.find(
      (entry) =>
        entry.id === state.selectedId
    );

  if (
    !item ||
    !itemNeedsHeat(item) ||
    itemIsHeated(item)
  ) {
    reactToBlockedAction("unneededHeat");
    return;
  }

  const itemId = item.id;

  const oldNode =
    products.querySelector(
      `[data-item-id="${itemId}"]`
    );

  if (!oldNode) return;

  state.busy = true;

  render();

  /*
    render() rebuilt the product nodes,
    so fetch the current selected product again.
  */
  const productNode =
    products.querySelector(
      `[data-item-id="${itemId}"]`
    );

  if (!productNode) {
    state.busy = false;
    state.modeOverride = null;
    return;
  }

  const oldRect =
    world.rect(productNode);

  const microwaveRect =
    world.rect(microwave);

  /*
    Aim around the microwave door cavity.

    These two percentages are the only values
    you should tune if the sprite alignment
    needs a few pixels of adjustment.
  */
  const spriteScale = Math.min(microwaveRect.width / 112, microwaveRect.height / 104);
  const targetX = microwaveRect.left + (microwaveRect.width - 112 * spriteScale) / 2 + 32 * spriteScale;
  const targetY = microwaveRect.top + (microwaveRect.height - 104 * spriteScale) / 2 + 53 * spriteScale;

  const sourceX =
    oldRect.left +
    oldRect.width / 2;

  const sourceY =
    oldRect.top +
    oldRect.height / 2;

  const dx =
    targetX - sourceX;

  const dy =
    targetY - sourceY;

  /*
    Same physical-language as scanner:
    clone the product and move the clone.
  */
  const ghost =
    productNode.cloneNode(true);

  ghost.classList.add("product-ghost");
  ghost.removeAttribute("data-item-id");

  ghost.style.left =
    `${oldRect.left}px`;

  ghost.style.top =
    `${oldRect.top}px`;

  ghost.style.width =
    `${oldRect.width}px`;

  ghost.style.height =
    `${oldRect.height}px`;

  /*
    Heating movement should not carry
    selection / orange service outlines.
  */
  ghost.classList.remove(
    "selected",
    "needs-heat"
  );

  world.layer.append(ghost);

  productNode.style.visibility =
    "hidden";

  /*
    Product enters microwave.
  */
  await PixelWorld.move(ghost, [{t:0,x:0,y:0},{t:1,x:dx,y:dy}], 145);

  /*
    Product disappears inside the oven.
  */
  ghost.style.visibility = "hidden";
  microwave.src = "assets/pixel-sprites/microwave-heating.svg?v=feedback-10";
  playMicrowaveStartSound();

  await sleep(500);

  /*
    Mark service complete BEFORE rendering
    the returned product.
  */
  if (
    !state.heatedIds.includes(itemId)
  ) {
    state.heatedIds.push(itemId);
  }

  state.selectedId = null;

  render();

  const returnedNode =
    products.querySelector(
      `[data-item-id="${itemId}"]`
    );

  if (!returnedNode) {
    microwave.src = "assets/pixel-sprites/microwave-edge.svg?v=feedback-10";
    stopMicrowaveHum();
    ghost.remove();

    state.busy = false;
    state.modeOverride = null;

    render();
    return;
  }

  const returnedRect =
    world.rect(returnedNode);

  returnedNode.style.visibility =
    "hidden";

  const returnX =
    returnedRect.left +
    returnedRect.width / 2;

  const returnY =
    returnedRect.top +
    returnedRect.height / 2;

  const returnDx =
    returnX - sourceX;

  const returnDy =
    returnY - sourceY;

  microwave.src = "assets/pixel-sprites/microwave-edge.svg?v=feedback-10";
  playMicrowaveDoneSound();
  ghost.style.visibility = "visible";

  /*
    Product comes back to its scanned position.
  */
  await PixelWorld.move(ghost, [{t:0,x:dx,y:dy},{t:1,x:returnDx,y:returnDy}], 155);

  returnedNode.style.visibility = "";

  ghost.remove();

  state.busy = false;
  state.modeOverride = null;

  render();

  const heatDoneLine = sayReaction("heatDone", {
    item: item.label,
    pos: posScreenName(item),
  });

  /*
    Future-proof no-bag orders:
    if heating was the last service,
    hand the goods directly to customer.
  */
  if (
    !orderNeedsBag(event) &&
    !hasPendingHeat(event)
  ) {
    await sleep(reactionReadTime(heatDoneLine));
    await completeOrderWithoutBag();
  } else if (!hasPendingHeat(event)) {
    scheduleBagWaitReaction();
  }
}

async function animateProductsToCustomer() {
  const hand = customerReceivingHand();
  for (const node of products.querySelectorAll('.product.scanned')) {
    const r = world.rect(node);
    await PixelWorld.move(node, [{t:0,x:0,y:0},
      {t:1,x:hand.x-r.left-r.width/2,y:hand.y-r.top-r.height/2}],250);
    node.style.visibility = 'hidden';
  }
}

async function animateActiveBagToCustomer() {
  if (!activeBag) return;
  const r = world.rect(activeBag), hand = customerReceivingHand();
  await PixelWorld.move(activeBag, [{t:0,x:0,y:0},
    {t:1,x:hand.x-r.left-r.width/2,y:hand.y-r.top-r.height/2}],250);
  removeActiveBag();
}

async function finishOrder(handoffType) {
  const event = currentEvent();

  state.busy = true;

  if (handoffType === "products" && event.reactions?.handoff) {
    const handoff =
      takeReaction("handoff");

    if (handoff.text) {
      setDialogue([handoff.text], {
        lock: handoff.lock,
      });
      await sleep(reactionReadTime(handoff.text));
    }
  }

  setDialogue(event.exitLine ? [event.exitLine] : []);

  await sleep(200);

  await showReceivingPose();

  if (handoffType === "bag") {
    await animateActiveBagToCustomer();
  } else {
    await animateProductsToCustomer();
  }

  state.bagged = true;
  render();

  if (event.finalReport) {
    state.busy = false;
    render();
    return;
  }

  await sleep(210);

  setDialogue([]);
  customer.classList.add("is-leaving");

  await waitForAnimation(customer, 500);

  customer.classList.remove("is-leaving");
  customer.classList.add("is-away");

  await sleep(360);

  products.classList.add("is-held");
  customer.classList.add("is-entering");

  nextEvent({
    keepBusy: true,
    quiet: true,
  });

  await waitForAnimation(customer, 500);

  customer.classList.remove(
    "is-entering",
    "is-away"
  );

  await sleep(90);

  products.classList.remove("is-held");
  state.busy = false;
  setDialogue(currentEvent().customerLines, {
    lock: state.eventIndex === 0,
  });
  render();
}

async function completeOrderWithoutBag() {
  if (
    state.busy ||
    !state.paid ||
    state.bagged ||
    hasPendingHeat()
  ) {
    return;
  }

  await finishOrder("products");
}

async function bagOrder() {
  if (!shiftStarted) return;
  if (dialogueLocked) return;

  if (
    state.busy ||
    !state.paid ||
    state.bagged ||
    hasPendingHeat()
  ) {
    if (!state.busy) {
      if (!state.paid) {
        reactToBlockedAction("earlyBag");
      } else if (hasPendingHeat()) {
        reactToBlockedAction("bagBeforeHeat");
      }
    }
    return;
  }

  clearBagWaitTimer();

  state.busy = true;

  const bagStartedLine =
    sayReactionOnce("bagStarted");

  /*
    Phase 1:
    pull the bag from the stack.
  */
  await sleep(bagStartedLine ? 120 : 0);

  await placeActiveBag();

  render();

  await sleep(80);

  /*
    Phase 2:
    pack every scanned item into it.
  */
  await animateProductsIntoBag();

  const bagLine =
    sayReaction("bag");

  await sleep(
    Math.max(360, reactionReadTime(bagLine))
  );

  const filledBag = activeBag?.querySelector("img");
  if (filledBag) {
    filledBag.src = "assets/pixel-sprites/bag-film-filled.svg";
    playBagRustleSound();
    await filledBag.decode().catch(() => { });
  }

  await sleep(90);

  /*
    Only now complete the order.
    renderProducts() may safely remove the product DOM.
  */
  state.bagged = true;

  render();

  await finishOrder("bag");
}

function showReport() {
  const event = currentEvent();
  if (!shiftStarted || state.busy || dialogueLocked || !event.finalReport || !state.bagged) return;
  state.reportShown = true;
  const report = shiftState.report();
  renderReceipt(['SHIFT CLOSED', `SALES ¥${report.sales}`, `TRANSACTIONS ${report.orders}`, `MANUAL OVERRIDES ${report.overrides}`, `LINKED ENTRIES ${report.links}`]);
  playReceiptPrintSound();
  render();
}

function confirmMismatch() {
  openRegisterReview();
}

function submitRegisterDecision(choice) {
  const event = currentEvent();
  if (
    !shiftStarted || state.busy || dialogueLocked || !event.mismatch || hasSavedRecord() ||
    eventScannedItems(event).length !== event.items.length
  ) return;

  if (rescanCount() < 1) {
    playAnomalyFlickerSound();
    scanner.classList.add("is-next");
    window.setTimeout(() => {
      scanner.classList.remove("is-next");
    }, 520);
    sayReactionOnce("confirmBeforeRescan");
    return;
  }

  shiftState.commit(event.id, choice);
  registerReview.close();
  render();
  setDialogue([choice === 'correct' ? 'You can change those?' : choice === 'keep' ? 'That what it says?' : 'Right. Cash.']);

  if (isPaymentReady()) {
    schedulePaymentWaitReaction();
  }
}

function nextEvent(options = {}) {
  clearPaymentWaitTimer();
  clearBagWaitTimer();
  removeActiveBag();
  resetFeedback();
  customerPose = "idle";

  state.eventIndex = Math.min(state.eventIndex + 1, events.length - 1);
  state.selectedId = null;
  state.scannedIds = [];
  state.paid = false;
  state.bagged = false;
  state.heatedIds = [];
  state.reportShown = false;
  state.transientStatus = null;
  state.busy = Boolean(options.keepBusy);
  state.modeOverride = null;
  state.reactionCounts = {};
  state.dialogueFlags = new Set();
  renderReceipt([]);
  setDialogue(
    options.quiet
      ? []
      : currentEvent().customerLines,
    {
      lock: !options.quiet,
    }
  );
  render();
}


async function animateProductsIntoBag() {
  if (!activeBag) return;
  const bagRect = world.rect(activeBag);
  for (const product of products.querySelectorAll('.product.scanned')) {
    const r = world.rect(product);
    product.style.zIndex = '64';
    await PixelWorld.move(product, [{t:0,x:0,y:0},
      {t:1,x:bagRect.left+bagRect.width/2-r.left-r.width/2,
        y:bagRect.top+bagRect.height*.46-r.top-r.height/2}],250);
    product.style.visibility = 'hidden';
    await sleep(35);
  }
}

async function placeActiveBag() {
  removeActiveBag();
  activeBag = document.createElement('div');
  activeBag.className = 'active-bag';
  const image = document.createElement('img');
  image.className = 'sprite'; image.alt = '';
  image.src = 'assets/pixel-sprites/bag-flat-stack.svg';
  activeBag.append(image);
  workArea.append(activeBag);
  await image.decode().catch(() => {});
  const from = world.rect(bag), to = world.rect(activeBag);
  const x = PixelWorld.snap(from.left+from.width*.46-to.left-to.width/2,2);
  const y = PixelWorld.snap(from.top+from.height*.44-to.top-to.height/2,2);
  bagStack?.classList.add('is-pulling');
  playBagRustleSound();
  await PixelWorld.move(activeBag,[{t:0,x,y},{t:1,x:PixelWorld.snap(x*.4,2),y:PixelWorld.snap(y*.7,2)}],250);
  image.src = 'assets/pixel-sprites/bag-film.svg';
  await image.decode().catch(() => {});
  await PixelWorld.move(activeBag,[{t:0,x:PixelWorld.snap(x*.4,2),y:PixelWorld.snap(y*.7,2)},{t:1,x:0,y:0}],290);
  bagStack?.classList.remove('is-pulling');
  activeBag.classList.add('placed');
  await sleep(80);
}

function removeActiveBag() {
  bagStack?.classList.remove("is-pulling");

  if (activeBag) {
    activeBag.remove();
    activeBag = null;
  }

  bag.style.visibility = "";
}

function setupBagStack() {
  if (!bagStack || !bag) return;

  const image = bag.querySelector(".sprite");
  if (image) {
    image.src = "assets/pixel-sprites/bag-flat-stack.svg?v=feedback-16";
  }
}

function startShift() {
  if (shiftStarted) return;

  shiftStarted = true;
  startShiftButton?.classList.add("hidden");
  gameAudio();
  startAmbientSound();
  setDialogue(currentEvent().customerLines, {
    lock: true,
  });
  render();
}

startShiftButton?.addEventListener("click", startShift);

microwave.addEventListener("click", heatSelected);
scanner.addEventListener("click", scanSelected);
payment.addEventListener("click", () => payOrder("terminal"));
coinTray?.addEventListener("click", () => payOrder("cash"));
bag.addEventListener("click", bagOrder);
receiptButton.addEventListener("click", showReport);
confirmItems.addEventListener("click", confirmMismatch);

setupBagStack();
render();
