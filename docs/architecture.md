# Architecture

How the code is organised and why. For what changed when, see
[CHANGELOG.md](../CHANGELOG.md); for how to work on it, see
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Constraints

- **Open `index.html` from disk and play.** No server, no build step for players.
- Therefore **classic scripts, not ES modules**: browsers refuse to load module scripts
  from `file://`. Each file is an IIFE that reads its dependencies from the global
  `NSF` namespace and adds its own entry to it. `index.html` lists the scripts in
  dependency order.
- Files that Node tests need (`js/content/*`, `js/engine/shift.js`) also export through
  `module.exports`.
- A missing script or wrong order fails at load (destructuring `NSF` yields
  `undefined`), and the browser tests treat any page error as a failure.

## Layers

| Layer | Files | Owns |
| --- | --- | --- |
| Content | `js/content/` | The store in metres and its camera (`space.js`), screen positions derived from it (`layout.js`), customer poses, strings, colour ramps, customer looks, story and radio script. Data only, plus small pure helpers. Everything that changes from night to night is one entry of `story.nights` (date, clocks, Night Ferry's segments, the frequencies, texts, who stayed, lost and found, drift); the build plays `story.tonight`, the first. |
| Engine | `js/engine/shift.js` | The shift's domain: order generation from a seed, re-scan checks, record decisions, settlement, the report and the ending key. No DOM, audio or time. |
| Core | `js/core/time.js` | The single game clock: `wait`, `after`, stepped `path` motion. Tests speed it up. `paused` stops it while the phone is open; `uiNow` keeps running for what animates over it. |
| Game | `js/game/` | Interaction: `checkout.js` (current-order state, scene model, player actions), `dialogue.js`, `radio.js` (the player), `broadcast.js` (what is on air), `records.js` (the POS record view), `phone.js` (the flip phone: menu, texts and settings), `messages.js` (texts received and sent, the call to Night Ferry), `audio.js` (synthesised sound), `night.js` (the clock of the night, dawn and the colours outside), `signin.js` (the sign-in sheet and the clerk's name), `outside.js` (cars, the ferry, rain and the tower's light, as functions of the game clock), `drift.js` (what the readings show as the night wears on, planned from the seed), `voice.js` (gives the line on air a voice), `company.js` (what the clerk has heard on the radio and who notices), `found.js` (the lost-and-found box, derived from who has been in). |
| Render | `js/render/` | `sprites.js` (indexed sprites → cached canvases, slot recolouring, moods, outlines), `text.js` (bitmap font), `world.js` (480×270 world), `ui.js` (960×540 overlays and their click regions). |
| Boot | `js/main.js` | Canvas sizing, the frame loop, input routing, test hooks (`NSF.debug`). |

## A frame

```text
requestAnimationFrame
  → time.tick()       advance the game clock, fire due timers, step motion
  → game.update()     place products, derive next-action cues
  → world.draw()      store, rain and clock, customer behind the counter, counter, fixtures, goods, store front
  → ui.draw()         POS text, speech bubble, radio caption, panels; registers click regions
```

## Input

```text
mouse: pointerdown / touch: pointerup (if the finger neither moved 10 px nor held 450 ms)
  → redraw (so click regions match the current state)
  → ui.hitTest()      topmost UI region, if any
  → otherwise world targets from game.targets(): products, then fixtures, by opaque pixel
    in reverse draw order; failing an exact hit, the nearest within 1 px (mouse) or 3 px
    (touch), none if two are equally near
  → game.activate(name) → queued if a machine is busy, else the action in guarded()
keyboard: Tab / arrows move game focus over game.targets(); Enter or Space activates it
```

A touch held on a world object only names it (hover label); a second finger, a move or
losing the window cancels the gesture. A UI region with `drag` (the dial) acts on
pointerdown and follows the pointer.

`guarded()` catches any error thrown by an action, logs it, drops in-flight motion
and releases input, so a failure can never lock the counter.

UI click regions are registered by the same code that draws them. World click regions
come from `js/content/layout.js` and the sprites' `at` anchors, the same data the world is drawn
from; only the click priority (UI, then products, then fixtures) is defined separately.

## State ownership

| State | Owner | Notes |
| --- | --- | --- |
| Orders (immutable input), checks, decisions, transactions | `shift.js` | Domain facts. Raw readings are never overwritten by saved labels; record origin is kept separate from verification method; eligibility derives from history. |
| Current order progress: selection, scanned, paid, heated, bagged, busy, phase | `checkout.js` `state` | Reset per order. |
| What is on screen: product positions, customer pose, fixtures, extras, mood, cues | `checkout.js` `scene` | Presentation only. Cues are recomputed every frame. |
| Speech bubble text, its queue and input lock | `dialogue.js` | Lines queue; `remaining()` is how long until everything waiting has been typed and read. |
| Frequency, dial open, caption, queue | `radio.js` | Plays what it is given; frequencies are hundredths of a MHz. |
| What plays when; what 87.7 and the signals between say | `broadcast.js` | Reads game state through `attach(controller)`. |
| Record view open/draft/focus | `records.js` | Its model is derived from the engine on every draw. |
| Phone open/frame/screen/selected row | `phone.js` | Levels and silent mode live in `audio.js`; the phone saves them to localStorage. |
| Phase (title → signin → shift → report → ending → clockout → end) | `checkout.js` `state` | |
| The store's clock and the sky's colours | `night.js` | Derived from the phase and the order; the ending's dawn runs on the game clock. The sky is a slot remap of the back wall's night, sea and lamp colours. |
| The clerk's name, the sheet's draft | `signin.js` | |
| Which panel is open, and whether it pauses | `overlay.js` | One at a time. Pausing panels stop the game clock and hold the radio (`radio.hold`/`release`); the dial is exclusive but live. |
| The action queue, click feedback, hover target | `checkout.js` `state` | `queuedActions`, `feedback`, `flash`, `hoverTarget`; presentation of them is in `world.js` and `ui.js`. |
| Texts received, the text sent and when it was read on air, the call made | `messages.js` | Arrivals and the open lines derive from the order reached. |

Rule: one source of truth per fact. Derive, don't copy.

## Rendering

- The world is 480×270 pixels, drawn at 2× onto a 960×540 canvas. UI text uses the
  960×540 grid with baked bitmap glyphs, so nothing anti-aliases.
- The canvas fills the window and snaps to an exact whole or half scale when within 4%
  of one; `image-rendering: pixelated` keeps edges hard.
- Sprites are palette indices. `sprites.get()` builds and caches a canvas per
  (sprite, slot colours, mood, outline). Customers remap the skin, hair, cloth, under
  and accent slots; moods (`echo`, `dim`) transform the whole palette.
- Customers are layers on a shared 176×210 canvas (`docs/character-assets.md`).
  `customers.parts(id, pose)` names them in two passes: `behind` the counter and
  `counter` over its top. Head, hair and face parts follow the figure's height. A
  customer stays in their own authored pose (`poses.js`) for the whole sale; money and
  goods move through the change tray, the terminal's slot and the basket, never a hand.
  Code never generates limbs.

## Art and font pipeline

```text
art/src/*.cjs + art/palette.cjs + art/tools/pixel.cjs
  → node art/tools/build-art.cjs
  → assets/sprite-data.js (+ art/palette.gpl, review sheets; --png for Aseprite)
art/overrides/<name>.png replaces a generated sprite (palette colours only).

js/content/strings.js + art/font/*.ttf
  → python3 art/tools/build-font.py
  → assets/font-data.js (only the glyphs the strings use)

art/voice/<string key>.wav (+ art/voice/lines.json: the text each was recorded from)
  → node art/tools/build-voice.cjs
  → assets/voice-data.js (8-bit mono 11025 Hz WAVs, base64, with their lengths)
```

Recordings are embedded rather than loaded as files because the game is opened from
disk, where scripts may not read local files; base64 in a script is the one way in.

The radio's voice is chosen in `voice.js`: a recorded clip of the line if one matches its
current text (`audio.playClip`, through the radio's speaker), otherwise the formant
murmur (`audio.radioSpeech`, a decaying harmonic source with broad formants and a
1800 Hz low-pass filter), or clear browser speech for runtime-variable lines that cannot
be pre-recorded. The browser's speech synthesis is also available through READ ALOUD
(it can't be routed through Web Audio, so it skips the radio's sound). A recorded line's
length sets its time on air.

`assets/` is build output that is committed so players need no build. Tests rebuild it
and fail if the committed copy is stale.

### First-person store

`js/content/space.js` holds the room in metres and the one camera (projection, rays,
the customer canvas). The art build renders from it and the runtime derives screen
positions from it (`layout.js`), so what is drawn and what is clicked agree. Rendered
sprites carry their top-left as anchor `at`. Two renderers use it:

- `art/tools/raycast.cjs` ray-casts boxes and quads with a depth buffer and outlines
  (room, counter, devices; `art/src/store3d.cjs`). Device faces are drawn at their
  on-screen size and laid across box faces.
- `art/tools/sculpt.cjs` ray-marches signed-distance fields (goods in
  `art/src/goods.cjs`; customers' bodies and held props in `art/src/people.cjs`, the
  scanner gun). A figure is a skeleton in metres; arms are solved by two-bone IK
  against the counter; each pose is rendered into depth layers (`back`, `front`,
  `counter`) that interleave with the head sprite, hair and counter devices.
  Hands are simple sculpted forms (palm, one finger block, thumb) whose frame follows
  anatomy and the wrist's range. Only the parts the cast uses are built.

`build-art.cjs --preview store3d` composes these into review sheets.

## Audio

All sound is synthesised with Web Audio: room tone, the fridge's compressor, machines,
the door chime, cars outside, the phone, dialogue ticks, the radio bed, the radio's voices
(a formant synthesiser murmuring each line's syllables, `radioSpeech`), Night Ferry's ident,
time signal and music bed, Night
Ferry's songs (sequenced from the notes in `story.js`), and gulls at dawn. There are no audio files. Everything plays through a `sounds` or a
`radio` bus into `master`; the phone's settings set their levels. `master` feeds a +6 dB
output gain and a limiter. The room and the radio bed are built the first time sound is
available after the shift asks for them (so also when silent mode is turned off). Ambient drift uses real timers on
purpose; it is texture, not game state. Everything else waits on `NSF.time`.

## Randomness

Order generation and the customer lineup come from the shift seed (`?seed=`, or the
current time). Drift is planned from the seed too. Sound, flicker timing and rain use `Math.random()` and never affect play. The
seed is printed to the console, exposed as `NSF.debug.seed` and shown on the closing
card.

## Tests

`node tests/run-all.cjs` runs the list and judges each by its exit code. The counter, radio
and audio checks are suites of cases, each in a fresh page (`suite()` in
`tests/browser-helpers.cjs`).

| Test | Covers |
| --- | --- |
| `shift-engine.test.cjs` | Generation across 500 seeds, the four record branches, immutability, idempotent settlement |
| `content.test.cjs` | Every referenced string exists, no orphaned strings, story keys, endings, glyph coverage; songs and frequencies the night refers to exist; the dial hint and its repeat come when the frequencies can be heard; guidance, feedback and the record-conflict lines fit the POS; the voice bundle matches its recordings and the WAV conversion is right |
| `art.test.cjs` | The bundle matches its sources, palette bounds, PNG round-trip, every sprite used, layout and anchors |
| `browser-flow.cjs` | Real pointer input through the whole night on all four branches: sign-in with a typed or default name, eight orders, a text and a call to Night Ferry, listening to all three frequencies and being recognised, lost and found, the report, the dawn clock only moving forward, sign-out; audio smoke for every sound; recovery from a failing action; dragging the dial; the phone's settings; seed; narrow viewport |
| `counter.test.cjs` | Keyboard focus, Enter, Escape and the live announcement; touch tap and hold; first-sale guidance with its outline; refused clicks and their reasons; the action queue (dedupe, held by a panel, stale dropped quietly, carried to the next customer); the scanner past a selected scanned item; customers' speech queued, never cut or swallowed |
| `radio.test.cjs` | The live dial and another frequency across an order change; reception off a station's centre; the clerk's call kept on air; a pausing panel holding the radio; Night Ferry carried across orders, unstarted songs let go, on-time segments first, the story kept at the closing; the tuning nudge only when nothing was found |
| `audio.test.cjs` | Rendered murmur levels and high-frequency energy for all three profiles; which voice a line gets (murmured, recorded, a stale recording ignored, read aloud and the setting saved) and that it stops on tuning away; the room and radio bed after a silent start (#1) |
| `visual.cjs` | Screenshots of key moments for human review |
| `radio-pacing.cjs` (optional) | The first order at normal speed: the second order's dial hint, introduction and song in sequence, and the taxi found with the dial's keys |

Optional probes in `tests/probes/` (a whole night at normal speed, speech, chaos,
recordings and levels) share a player who knows the counter (`common.cjs`); see
CONTRIBUTING.md.

Not covered by the checks: a whole night at normal speed, the audio mix and how voices sound (no test listens), accessibility beyond keyboard focus and the live region.

## Where new systems go

New systems get their own module in `js/game/` instead of growing `checkout.js`. The
checkout reports shift progress; other modules decide what happens around it. The
phone, the night's clock, drift, texts and the view outside follow this pattern.

## Deliberately not done

| Not done | Why | Revisit when |
| --- | --- | --- |
| ES modules / a bundler | Would break opening `index.html` from disk | The game needs online hosting with a build step |
| Compressing the sprite bundle | About 1.1 MB is fine for a one-shot download | It grows past a few MB (run-length encoding would shrink it a lot) |
| Saving | One shift per session by design (only the phone's settings persist); per-night content is already in `story.nights` | A second night is written |
| Phone-size UI text | Dense panels use a 1.15–1.2× text scale on narrow screens; a layout that scales properly would mean reworking every panel, and the desktop comes first for now | Phones become a target again |
| One declaration for drawing and clicking world objects | Low risk today; the radio's dial is a UI panel, not world parts | More world objects become interactive |

## Counter input feedback

Checkout owns the bounded, deduplicated action queue. Updates discard entries from
older orders, wait through locked dialogue and modal inspection, and check current
checkout prerequisites before dispatching an entry. The action handlers still
validate their own payment and record rules. Rejected queued actions are discarded
with feedback; they are not promises to perform a future transaction.

Failure reasons appear briefly in the POS's status field. The object under the pointer
(or held on a touch screen) and a just-queued machine get a pixel outline with the
object (`world.js`); `ui.js` draws only the name label over it. Labels for physical
products use their visible identity; register observations remain on the POS. Feedback
expiry uses the UI clock.
