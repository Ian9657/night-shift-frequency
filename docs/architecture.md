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
| Content | `js/content/` | The store in metres and its camera (`space.js`), screen positions derived from it (`layout.js`), customer poses, strings, colour ramps, customer looks, story and radio script. Data only, plus small pure helpers. |
| Engine | `js/engine/shift.js` | The shift's domain: order generation from a seed, re-scan checks, record decisions, settlement, the report and the ending key. No DOM, audio or time. |
| Core | `js/core/time.js` | The single game clock: `wait`, `after`, stepped `path` motion. Tests speed it up. `paused` stops it while the phone is open; `uiNow` keeps running for what animates over it. |
| Game | `js/game/` | Interaction: `checkout.js` (current-order state, scene model, player actions), `dialogue.js`, `radio.js` (the player), `broadcast.js` (what is on air), `records.js` (the POS record view), `phone.js` (the flip phone as the settings menu), `audio.js` (synthesised sound), `night.js` (the clock of the night, dawn and the colours outside), `signin.js` (the sign-in sheet and the clerk's name), `outside.js` (cars, the ferry, rain and the tower's light, as functions of the game clock), `drift.js` (what the readings show as the night wears on, planned from the seed). |
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
pointerdown → redraw (so click regions match the current state)
  → ui.hitTest()      topmost UI region, if any
  → otherwise world targets from game.targets(): products, then fixtures, by opaque pixel in reverse draw order
  → game.activate(name) → the action, wrapped in guarded()
```

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
| Speech bubble text and input lock | `dialogue.js` | |
| Station, caption, queue | `radio.js` | Plays what it is given. |
| What plays when; what 87.7 says | `broadcast.js` | Reads game state through `attach(controller)`. |
| Record view open/draft/focus | `records.js` | Its model is derived from the engine on every draw. |
| Phone open/frame/selected row | `phone.js` | Levels and silent mode live in `audio.js`; the phone saves them to localStorage. |
| Phase (title → signin → shift → report → ending → clockout → end) | `checkout.js` `state` | |
| The store's clock and the sky's colours | `night.js` | Derived from the phase and the order; the ending's dawn runs on the game clock. The sky is a slot remap of the back wall's night, sea and lamp colours. |
| The clerk's name, the sheet's draft | `signin.js` | |

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
```

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

All sound is synthesised with Web Audio: room tone, machines, dialogue ticks, the
radio bed and voice. There are no audio files. Everything plays through a `sounds` or a
`radio` bus into `master`; the phone's settings set their levels. Ambient drift uses real timers on
purpose; it is texture, not game state. Everything else waits on `NSF.time`.

## Randomness

Order generation and the customer lineup come from the shift seed (`?seed=`, or the
current time). Drift is planned from the seed too. Sound, flicker timing and rain use `Math.random()` and never affect play. The
seed is printed to the console, exposed as `NSF.debug.seed` and shown on the closing
card.

## Tests

| Test | Covers |
| --- | --- |
| `shift-engine.test.cjs` | Generation across 500 seeds, the four record branches, immutability, idempotent settlement |
| `content.test.cjs` | Every referenced string exists, no orphaned strings, story keys, endings, glyph coverage |
| `art.test.cjs` | The bundle matches its sources, palette bounds, PNG round-trip, every sprite used, layout and anchors |
| `browser-flow.cjs` | Real pointer input through all eight orders on all four branches, report, ending, audio smoke, recovery from a failing action, seed, narrow viewport |
| `visual.cjs` | Screenshots of key moments for human review |

Not covered: natural-speed pacing, audio mix, accessibility beyond the record view.

## Where new systems go

New systems get their own module in `js/game/` instead of growing `checkout.js`. The
checkout reports shift progress; other modules decide what happens around it. The
phone (`phone.js`) follows this pattern; the planned night timeline, texting and radio
dial (see [worldview.md](worldview.md)) will too.

## Deliberately not done

| Not done | Why | Revisit when |
| --- | --- | --- |
| ES modules / a bundler | Would break opening `index.html` from disk | The game needs online hosting with a build step |
| Compressing the sprite bundle | ~740 KB is fine for a one-shot download | It grows past a few MB (run-length encoding would shrink it a lot) |
| Saving | One shift per session by design (only the phone's settings persist) | The game spans several nights |
| Keyboard control of counter actions | Pointer-first pixel game | Accessibility becomes a goal |
| Phone-size UI text | Requires a scalable UI layout | The radio dial and phone UI are built |
| One declaration for drawing and clicking world objects | Low risk today | The radio dial adds many small interactive parts |
