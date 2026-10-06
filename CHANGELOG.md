# Changelog

What changed, and how it was checked. Newest first. Each entry lists what was
verified and what was not.

## Unreleased

### Changed — the counter's front and the cash drawer

- The clerk stands 0.25 m further back (`camera.z` in `js/content/space.js`), so the
  counter keeps its size but takes less of the view and its near edge and front show
  above the radio caption. The horizon sits lower; the room shows up to the ceiling.
  Everything is about a fifth smaller on screen: the machines' faces are redrawn at
  their new sizes, and the register is a larger CRT so the sale text still fits.
- The change tray is gone (the store is not in Japan). The cash drawer sits in the
  counter's front under the register: a cash customer's note goes into it as it
  opens and shuts; at other times a click opens or shuts it. Clicking it for a card
  customer gets the usual wrong-device reaction.
- The clerk's coffee is now an opened, half-drunk can, standing beside their phone
  at the right-hand front of the counter; the green box that read as money is gone.
- On phones the canvas is fitted again once the page has loaded: before, it was
  sized for a viewport the browser had not settled yet and lost its bottom edge.
  The phone test now checks the whole view fits.

### Verified (counter front)

- All five checks pass. The store sheet and the desktop (cash into the drawer,
  heating) and phone-landscape screenshots were reviewed.

### Not verified (counter front)

- The open drawer shows only the back of its till above the caption bar; the
  look-down view into the drawer is not made. Customers are about a fifth smaller,
  so `docs/character-assets.md`'s pixel numbers are out of date until the figures
  are redrawn. The shelves behind and beside the customer are not refined yet.

### Changed — the game plays in the first-person store

- The counter scene is now the rendered first-person store: room, counter, machines,
  goods and customers all come from `js/content/space.js` and its one camera. Screen
  positions derive from it in `js/content/layout.js`; sprites carry their place as
  anchor `at`, so drawing and clicking use the same numbers.
- Customers are the sculpted figures in three passes (behind the counter, over its
  top, over the machines). Each waits in their own pose; card or phone payments are
  shown at the terminal, cash as a note from the hand to the tray, and the receipt
  and bag go into an open palm. Poses and the action mapping live in
  `js/content/poses.js`; the old 2D customer, device, product and scene sources are
  removed. Goods are sculpted in `art/src/goods.cjs`.
- Clicks on goods and machines test opaque pixels, top-most first, so the radio no
  longer covers the printer.
- The build makes only the head, hair and accessory parts the cast uses (291
  sprites; the bundle is about half its previous size). `art.test` checks the new
  structure: every sprite referenced, machines in view, the hand and palm anchors the
  game hands things to, and the two widest goods side by side in the lane.

### Not verified (first-person store)

- The cash drawer is now sound only; the card's colour per order is no longer drawn;
  the goods are placeholders; the customers are the paused, unapproved figures below.
- Tired sway and parallax are not implemented. Natural-speed pacing was not played
  through by hand.

### Verified (first-person store)

- All five checks pass: `shift-engine`, `content`, `art`, `browser-flow` (four record
  branches, report, ending, audio smoke, failure recovery, seed, narrow viewport) and
  `visual`. Desktop, record view, phone landscape and phone portrait screenshots were
  reviewed.

### Changed (character checkpoint)

- Customer proportions measured from the reference body: shoulders about 2.5 head
  widths, neck about 0.65, the trunk at 0.87 and the arms at 0.86 of anatomical
  length, short tops ending above the hip bones; hanging arms stand a little off
  the body. A `stand` pose (both arms hanging) is the standard neutral body. The
  anchor table in docs/character-assets.md is recomputed to match.
- The counter top rises to 1.05 m and the counter deepens (near edge at 0.505 m) so
  its near edge stays at the bottom of the view: the counter now meets a standard
  customer at the navel, just below the hanging elbow, a tall one at the belt or
  lower belly and a short one at the upper belly, showing every head, neck,
  shoulders and chest. The spec separates the counter-top height on the body from
  the lower occlusion line seen from the clerk.
- An acceptance sample (`build-art.cjs --preview sample`, `art-sample.png`): one
  average customer in a plain T-shirt resting both hands on the counter, shown as a
  structure view with skeleton lines, shaded without the counter, and in the store.
  Towards it: the trapezius slopes from high on the neck to a lower, rounder
  shoulder; the upper chest sits under it; the waist tapers; the chest's underside
  turns darker; resting hands sit about shoulder width apart with the elbows hanging
  by the body, and press a tight shadow into the counter.
- Character work is paused here as a checkpoint: the sample is not approved yet. A
  hand-drawn five-heads-tall study of Nell (kept outside the repository) suggests the
  final figures should be drawn by hand, with the rig only placing joints.

### Verified

- The standard body compared side by side with the reference at equal head size;
  every customer still reaches the counter in their poses; the store and the people
  sheet re-rendered with the raised counter.

### Not verified

- `art.test` failed by design at this checkpoint; it passes again with the store
  integration above.
- The acceptance sample is not approved; the other customers were not re-reviewed
  after the shoulder changes; faces keep the earlier style.

## 2026-10-06 · Character asset contract (`f293341`)

- Added docs/character-assets.md: native authoring grid, standard front anchors,
  body presets, layering/occlusion, palette and naming rules, reserved animation
  interface, timings and acceptance criteria. It explicitly distinguishes the
  contract and generated reference images from the playable runtime.
- Added the target implementation phases to worldview.md; classified the new
  character specification as reserved art/design text in LICENSE; listed its role
  in AGENTS.md.
- Revised to the first-person counter scale: the 96 × 128 grid (about 5.3 heads,
  squatter than its own reference images at about 6.8) became the customer canvas
  in space.js (176 × 210, 151.5 px per metre, a 1.68 m figure about 7 heads tall);
  the anchor table is computed from the rig; builds, per-person heights, arms and
  hands follow people.cjs and customers.js; layers map to the rig's back, front,
  counter and over; naming fields are camelCase so the hyphen-joined keys split
  unambiguously. The generated lineup is a style reference only and is not assigned
  to the cast.
- Verified: cross-checked current customer layers, hand-anchor caller, palette
  pipeline and time ownership against the specification; documentation links and
  whitespace reviewed; the revised anchor table matches the rig's joints. No code,
  sprite bundle or reference image changed by this document.
- Not verified: native sprite authoring, runtime adapter, animation clips, walk
  pacing and device screenshots. Full gameplay/art/browser tests were not run for
  this documentation-only change.

## 2026-10-06 · Customers on the sculpted body (`74c8f4f`)

### Changed (in progress — built by the art tools, not yet used by the game)

- **Every customer rebuilt on the sculpted body.** Garments can add shapes (a hood,
  a tall collar) and paint by position on the body and along the sleeves: Kit's
  hoodie, Hal's quilted vest over a flannel shirt, Dana's blazer, Tess's scrubs over a
  long-sleeved top with pen and ID badge, Walt's cardigan with shirt and tie, Ana's
  peacoat, Dex's windbreaker with a red band, Bonnie's cable sweater, Sam's open denim
  jacket, Edie's blouse under a fringed shawl, and Nell's raincoat. Each customer has a
  main pose and a variant (`person.poses`); the people sheet shows all of them.
- Sleeves are slimmer (thinner arms, less cloth than the body). Hands are sculpted
  again, kept simple (palm, one finger block with painted partings, thumb), at their
  true size and per-person length and width (`person.hands`); the drawn hand sprites
  are gone.
- Below the hips: short garments end in a hem over a pelvis and legs in trousers
  (`person.legs`), long coats carry on as a skirt, so taller people show their
  hips and thighs above the counter instead of a longer trunk.
- Character-sprite proportions against the fixed head: the shoulders' outline about
  two head widths across, a slender neck about half a head wide with the neck clear
  between chin and collar, a defined waist, hips no wider than the shoulders, slim
  arms; a near-level shoulder line out to the point of the shoulder with smaller
  deltoids. Bodies are shaded by planes (lit side, front, shadow side, undersides) instead
  of per-pixel light, so no blotches cross the trunk.
- New pose `phone-one` (one hand, head down; Kit). A handed-over card is pinched by
  one narrow end, its length pointing toward the clerk.

### Verified

- `shift-engine`, `content`, `browser-flow` and `visual` pass; the people sheet was
  inspected at game scale.

### Not verified

- `art.test` still fails by design until the runtime uses the new sprites.
- A receiving hand (palm up) reads much like a resting one from the clerk's side.

## 2026-10-06 · First-person store, figure rig and devices (`20c6551`)

### Changed (in progress — built by the art tools, not yet used by the game)

- **First-person store** (`art/src/store3d.cjs`): one camera in metres
  (`js/content/space.js`: eye 1.57 m, ~100° lens, raised horizon) and a ray caster
  (`art/tools/raycast.cjs`) render the back wall and view, side shelving and fridge,
  counter and the clerk's things as layers, and each counter device as a sprite.
  Devices have hand-drawn faces at their on-screen size: green-screen register and
  keyboard, a scanner gun in its cradle (sculpted), card terminal with top slot,
  radio with a dial reading 87.7, microwave, security monitor, receipt printer,
  change tray, bags, the clerk's closed flip phone. The 3×5 sign font gained digits
  1, 3, 6–9, F, G, U, V, W, Y, `:` and `.`. Brand colours buoy orange and navy were
  added to the palette.
- **Customers at the new scale** (`art/src/people.cjs`): bodies are sculpted from
  signed-distance shapes (`art/tools/sculpt.cjs`) on a skeleton in metres, posed by
  two-bone IK and projected with the store camera, so heights, builds and per-person
  arm length and thickness change the joints rather than stretching a template.
  Shoulders blend into the arms; outlines follow the silhouette and occlusion.
  A pose library (`one-rest`, `both-rest`, `phone-call`, `phone-check`, `card`,
  `card-reader`, `receive`) sets each arm's use, gaze, shoulders and a small lean.
  Hands are drawn by hand (six kinds) and placed at the wrist, mirrored for the other
  side; props (flip phone, bank card) are sculpted. Heads have gazes and small
  expression changes. Only Nell's raincoat is rebuilt so far; the other customers'
  outfits are pending. `js/content/customers.js` gains each customer's `person`
  (height, build, arms, outfit, poses).
- Review sheets: `art-store.png`, `art-people.png`, `art-rig.png` and
  `art-rig-flat.png` (`node art/tools/build-art.cjs --preview store3d`).

### Verified

- `shift-engine`, `content`, `browser-flow` and `visual` pass; the playable game is
  unchanged.
- Review sheets inspected at game scale for every test build and pose.

### Not verified

- `art.test` fails by design until the runtime uses the new sprites
  ("sprite person-hair-back-long is never used").
- The scanner-reading, terminal-approved, microwave-heating and radio-echo variants
  were generated but not looked at.
- Sprites are stored full-canvas, so `assets/sprite-data.js` is about 3.7 MB until the
  runtime integration crops them.

## 2026-10-06 · Worldview 2.0, names, fixes (`21711d7`)

### Changed

- **Worldview 2.0** ([docs/worldview.md](docs/worldview.md)): the frequency is
  exhaustion. A clerk who has worked nights for months drifts onto another frequency
  where they went home on time; the player is the half that stayed. 87.7 connects
  everyone who stayed; *Night Ferry* on 87.6 stays ordinary. Set in 2005, 01:00–05:00,
  ending when the radio signs off. This is the target design; the game does not
  implement it yet.
- Cast renamed to English small-town names in code and text: Nell and the Nell who
  stayed (orders 5 and 8), June (the *Night Ferry* host), and the regulars Kit, Hal,
  Dana, Tess, Walt, Ana, Dex, Bonnie, Sam and Edie. Order 8's dialogue keys are now
  `say.stayed*`, separate from the 87.7 echo.
- Radio programming moved from `js/game/checkout.js` into `js/game/broadcast.js`.
- Player actions are wrapped in `guarded()`: an action that throws logs the error and
  releases input instead of locking the counter.
- The shift seed is printed to the console, exposed as `NSF.debug.seed` and shown on
  the closing card.
- Removed a redundant per-frame write of product visibility.
- `docs/architecture.md` describes how the code is organised.

### Verified

- All five suites pass on this commit's tree. New checks in `browser-flow.cjs`: every
  audio function runs against a real AudioContext; an injected failure during a scan
  releases input and the next scan succeeds; the seed is exposed.
- Closing card screenshot reviewed with the seed shown.

### Not verified

- No human playtest.

## 2026-10-06 · Documentation by role (`2f329e2`)

### Changed

- README is for players; `CONTRIBUTING.md`, `docs/game-design.md` and this changelog
  replace `docs/build-notes.md` and `docs/gameplay-blueprint-v2.md`.
- Added `LICENSE`: code MIT; artwork, story and text all rights reserved; font OFL.
- Added `art/tools/requirements.txt` for the Python font build.

## 2026-10-05 · English-only (`f2aa32b`)

### Changed

- The game and all documentation are English-only. Language switching, its storage
  and CJK text handling were removed.
- The source font became a 22 KB Latin subset of Fusion Pixel 12px (was 7 MB); the
  baked glyphs are byte-identical.
- Shortened POS labels that overflowed in English (`BOSS COFFEE`, `WATER 500ML`,
  `RECORD MISMATCH`).
- `content.test.cjs` fails on orphaned strings.

### Verified

- All five suites pass; English POS, record view and closing card screenshots reviewed.

## 2026-10-05 · Pixel-world rebuild (`f25dc3a`)

### Changed

- **Rendering**: one canvas; a 480×270 indexed pixel world drawn at 2× onto
  960×540; baked bitmap text; the canvas fills the window. The DOM layout, ~1,500
  lines of CSS and per-element placement code were removed.
- **Art pipeline**: palette-indexed sprite sources in `art/src`, built into a runtime
  bundle; Aseprite-compatible PNG export and overrides; runtime slot recolouring and
  scene moods.
- **Art**: every sprite redrawn at 480×270. Hue-shifted material ramps; shading tools
  `volume`, `light` (normal-based), `glow` (Bayer dithered) and per-material outlines.
  New scene detail: hills and town lights, a guyed relay tower, a bicycle at the
  railing, wet-road reflections, mirrored neon, fridge stock, cabinet details; contact
  shadows under everything on the counter.
- **Customers**: paper-doll parts on a 120×120 canvas: 4 outfits, 3 heads, 8
  hairstyles, 6 accessories, 4 arm poses; ten regulars plus the two record-order
  customers.
- **Code**: the 3,165-line controller became `checkout.js` plus dialogue, radio,
  records and audio modules; content moved to `js/content`; one game clock in
  `js/core/time.js`. Engine rules unchanged.
- **Story (worldview 1.0)**: Lowtide, Harbor Mart, *Night Ferry* on 87.6 and the echo
  on 87.7; the spare-key story in orders 5 and 8 with four radio letters.
- **New behaviour**: the scanner flickers a spare key on record orders; the radio can be
  retuned and replays missed lines; customers walk in and out; the cash drawer opens;
  receipts print; the shift report prints as a receipt before the radio reads the ending.
- Root tidied: build tools moved into `art/tools/`; generated PNGs untracked.

### Verified

- Engine: 500 seeds, four decision paths, immutability, idempotent settlement.
- Art: bundle matches sources, palette-only colours, every sprite referenced, anchors.
- Browser: all eight orders on all four branches with real pointer input, no page errors.
- Key-frame screenshots reviewed on desktop and a landscape phone.

### Not verified

- Natural-speed pacing; audio mix on real speakers or headphones.
- Phone sizes: on a landscape phone (~844×390) UI text is about 9 px and hard to read.

## 2026-10-05 · Baseline (`d72b93b`)

The eight-order SVG/DOM build, kept in history as the starting point.
