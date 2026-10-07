# Changelog

What changed, and how it was checked. Newest first. Each entry lists what was
verified and what was not.

## Unreleased

### Changed — a real POS keypad

- The register's keypad is a beige wedge matching the monitor, low at the clerk's edge
  and high at the back, with raised key caps (lit tops, shaded edges, gaps): a 4x4
  block of product keys with coloured paper labels, a dark number pad with a double 0,
  and a function column with VOID, CLEAR, the amber record key and a double-height
  TOTAL. A card-reader groove runs along the back; the mode lock and brass key sit at
  the back left. The monitor's badge, label tape and vents move up two pixels.
- The record key's position is a point on the keypad's slope (`space.js`), shared by
  the art and the keypad layout.

### Verified (keypad)

- All five checks pass. A close-up of the keypad and the record-pending screenshot were
  reviewed.

### Not verified (keypad)

- The card-reader groove is mostly hidden by the back row; worn tops are one or two
  pixels. The mode marks and key ring were dropped as too small. Phone screenshots were
  not looked at.

### Changed — a bolder record key; the right of the counter moves right

- The record key is larger and twice as tall, a bright amber cap with a highlight in a
  black well; lit, its cap turns white.
- The card terminal, gum rack, lighters, charity box, radio and the clerk's rota,
  receipts, coffee can, phone and magazine all sit 10 cm further right. The card
  customer's reach follows the terminal.
- The art preview composite no longer lists the removed monitor and now includes the
  record key and the receipt spike.

### Verified (key, right side)

- All five checks pass. Desktop card-sale and record-pending screenshots were
  reviewed; the lit and unlit key were compared close up.

### Not verified (key, right side)

- Phone screenshots were not looked at. Card poses of customers other than the one in
  the card-sale screenshot were not reviewed.

### Changed — the register: a record key, a livelier screen and keypad

- The screen no longer opens the record view. A yellow record key on the keypad (between
  the number pad and TOTAL) does; it flashes while a re-scanned record waits, and the
  screen's prompt reads PRESS REC KEY. The register itself is now drawn as decor.
- The screen has a status bar (REG#02 and the shift clock), a blinking cursor after the
  last line, darker curved-glass corners and a faint glare.
- The keypad has a mode lock with a brass key turned to REG and a ring, a worn 0 key and
  TOTAL, dots on the number keys, and the well of the record key. The monitor bezel
  carries a REG2 label tape.

### Verified (register)

- All five checks pass. The record flow now asserts that the screen is not a click
  target and that the key is pending after the re-scan. Desktop sale and record-pending
  screenshots were reviewed; the lit and unlit key were compared close up. The phone
  landscape screenshot was glanced at: the layout holds, the screen text is small.

### Not verified (register)

- The worn keys, number dots and mode-position marks are below a pixel or two at
  native size. A coiled keypad cord was tried and dropped: the printer hides it.

### Removed — the security monitor

- The CAM1 monitor on the microwave is gone (its data, sprite and decor entry); the
  shelves behind now show above the microwave.

### Verified (monitor)

- All five checks pass. The desktop card-sale screenshot was reviewed.

### Not verified (monitor)

- Phone screenshots were not looked at.

### Changed — the sign-in clipboard leans with some life

- The board is turned a little so one corner rests on the printer, with visible
  hardboard edges, a raised steel clip with a hanging hole, and a shadow on the
  printer's front beside the raised corner.
- The sheet has a header, a name column and a time column. Every row carries the same
  signature except the bottom one, which is still blank tonight.
- A blue biro lies by the board's foot, tied to the clip by a bead chain.

### Verified (clipboard)

- All five checks pass. The desktop card-sale screenshot was reviewed close up.

### Not verified (clipboard)

- At native size the signatures read as short blue strokes, not handwriting. Phone
  screenshots were not looked at.

### Changed — printer, sign-in sheet and charity box swap places

- The receipt printer is smaller and sits at the clerk's left, in front of the
  register's keyboard. The shift report still prints from its top slot.
- The sign-in sheet stands on its board, its foot on the counter, leaning back on the
  printer's front. Its angle comes from the printer's size and position.
- The charity box takes the printer's old place by the card terminal and is larger.

### Verified (printer, sign-in, charity box)

- All five checks pass. Desktop card-sale, shift-report and phone-landscape
  screenshots were reviewed.

### Not verified (printer, sign-in, charity box)

- The board covers most of the printer's front, so only the power light shows there.

### Changed — bags in view, a readable magazine

- The radio caption bar is only as wide as its text instead of the full screen, and the
  bag bundle hangs further right, under the packing place: the whole bundle and its
  logo show beside a typical caption, and a new bag rises straight up into place.
- The magazine's cover is a cover star (dark hair, face, blue top) on a yellow ground
  under a red masthead, with cover lines and a barcode.

### Verified (bags, magazine)

- All five checks pass. Desktop heating and card-sale screenshots were reviewed.

### Not verified (bags, magazine)

- Two-line captions still reach across the bags.

### Changed — the drinks fridge is a lit glass-door cabinet

- The bottles and shelves used to stand outside the fridge's solid body, on the room
  side of its glass, so they read as binders on an open shelf. The fridge is now a
  cabinet: an end panel with an ICE COLD cola poster, a canopy with the brand band, a
  kick plate, and behind tinted glass doors (frames, rails, long handles, a diagonal
  sheen) a glowing interior with light strips behind the frames and bottles on four
  shelves. The light strips and frames come from one list of door positions.

### Verified (fridge)

- All five checks pass. The desktop screenshot was reviewed close up.

### Not verified (fridge)

- The screen edge cuts the poster's right side; ICE COLD and the bottle stay visible.
  Phone-landscape screenshot not looked at.

### Changed — the shop is bright under its tubes

- The wall ramp in `art/palette.cjs` is near-white and slightly blue-green when lit
  (it was a dim green-grey, which kept the whole room murky whatever the light did);
  its dark end stays dark for shadows and outlines. The tube colour is brighter.
- The ceiling is white tiles with a glow round each tube; side walls and the back wall
  are a step lighter.
- The tube reflections in the window have a bright core and read against the night.

### Verified (bright shop)

- All five checks pass. Desktop card-sale and 87.7 echo screenshots were reviewed:
  bright interior, dark street, visible reflections.

### Not verified (bright shop)

- Phone-landscape screenshot was captured but not looked at. The drinks fridge's end
  panel is unchanged and now stands out more (next step).

### Added — playable on the web

- GitHub Pages serves the repository's `main` branch at
  <https://ian9657.github.io/night-shift-frequency/>; every push to `main` republishes
  it. The README links to it.

### Verified (web)

- The Pages build succeeded. In Chrome against the live URL: the page and sprite
  bundle load (HTTP 200), no page errors or failed requests, the shift starts and the
  phone opens.

### Not verified (web)

- Other browsers (Safari, Firefox) and real phones against the live URL. The whole
  repository (docs, art sources, tests) is reachable on the site, not only the game.

### Changed — reversed sign, visible tide table, one clock

- The OPEN 24H neon faces the street again and reads reversed from the counter, as
  `docs/worldview.md` describes; it keeps the brighter pink and the word gap.
- The tide table, which the register hid completely, is a small card pinned under
  the calendar: navy header, the tide curve, two rows of times.
- The receipt spike moved to the counter's front left, in front of the microwave:
  on screen it sat where the customer's resting hand lands.
- The microwave's display shows the shift clock (the same time as the wall clock and
  the phone) instead of a fixed 3:47; heating still counts down.

### Verified (sign, tide table, spike, clock)

- All five checks pass. The desktop screenshot was reviewed: reversed sign, tide card,
  spike clear of the customer, microwave and wall clock both at 2:12.

### Not verified (sign, tide table, spike, clock)

- The tide card is small (24×11 px) and only suggests times.

### Changed — readable neon and unobscured calendar

- The double-sided window sign reads OPEN 24H from the counter, with brighter
  pink lettering and a space between the words.
- Moved the calendar into the exposed wall below the clock and made its sheet
  narrower, with OCT and 2005 on separate lines. Shelving and equipment no longer
  hide its date grid.

### Verified (sign and calendar)

- Rebuilt 251 sprites; all five AGENTS.md checks pass. Browser tests used the
  bundled Playwright via PLAYWRIGHT_MODULE and installed Chrome.
- Reviewed desktop card-contact and 844×390 phone landscape screenshots: sign
  reads forward and the calendar header and date grid are visible.
- Reviewed affected art code and callers; no unused sprite variants added.

### Not verified (sign and calendar)

- Physical phone display readability and portrait-phone layout were not reviewed.

### Changed — denser shelf packs and price strips

- Reworked the left-wall shelf stock into smaller, denser package groups and
  added narrow customer-facing price strips with sparse printed marks. Shelf
  positions, palette, room layout and interactions are unchanged.

### Verified (shelves)

- Rebuilt the indexed sprite bundle; `shift-engine`, `content` and `art` pass.
- Inspected the native-pixel store preview.

### Not verified (shelves)

- Browser-flow and visual screenshot checks remain unavailable because Playwright
  is not installed in this environment.

### Changed — drinks fridge glass and stock

- Reworked the drink fridge's visible stock into narrower, denser bottles with
  caps, shoulders and label bands. Added cold interior light strips, a glass-door
  reflection pattern and clearer door seams while keeping its position, palette,
  click bounds and room layout unchanged.

### Verified (drinks fridge)

- Rebuilt the indexed sprite bundle; `shift-engine`, `content` and `art` pass.
- Inspected the native-pixel store preview.

### Not verified (drinks fridge)

- `browser-flow` and `visual` could not run because Playwright is not installed;
  desktop and phone browser screenshots remain unverified.

### Changed — cold fluorescent lighting and counter wear

- Strengthened the cold fluorescent ceiling light, added broken tube reflections
  in the shop window, and added restrained reflected light bands plus
  deterministic wear marks to the counter top. The room, customer, fixture
  layout and interaction rules are unchanged.

### Verified (lighting)

- Rebuilt the indexed sprite bundle; `shift-engine`, `content` and `art` pass.
- Inspected the store preview at native pixel scale.

### Not verified (lighting)

- `browser-flow` and `visual` could not run because Playwright is not installed
  in this environment; desktop and phone browser screenshots remain unverified.

### Changed — impulse buys on the customer's edge

- The flat strip of colours is a two-tier gum rack: packs built one by one, each with a
  white wrapper band. Beside it, a tray of disposable lighters; at the far edge left of
  the lane, a clear charity box with coins and a paper label. None is clickable.

### Verified (impulse buys)

- All five checks pass. The desktop screenshot was reviewed close up.

### Not verified (impulse buys)

- Goods waiting at the far lane and the customer's hands can hide the charity box.

### Added — months of night shifts on the counter

- On the clerk's right: the staff rota on a clipboard (the same signature in every
  night's box), two loose receipts and an old magazine; a receipt spike with the
  night's receipts sits in front of the lane. A sticky note is stuck to the
  register's bezel. None is clickable.

### Verified (counter props)

- All five checks pass. Desktop screenshots (card sale, heating) were reviewed close up.

### Not verified (counter props)

- The magazine's cover photo reads only as colour blocks at this size. Nothing on the
  rota or sticky note is legible text yet; the clerk's name comes with naming.

### Changed — the card terminal faces the customer

- The card terminal stands on a swivel stand turned toward the customer, as a 2005
  chip-and-PIN terminal would: the clerk sees its back (sticker, vents, status lights
  that turn green on approval, a coiled cable), the card slot on top and the glow of
  the customer-facing screen along its far edge. The customer's card goes into the top
  slot as before.

### Verified (terminal)

- All five checks pass. Idle and in-use desktop screenshots were reviewed close up.

### Not verified (terminal)

- The terminal's own screen is no longer visible to the player; approval shows only
  as the green light and the sound.

### Changed — carrier bags hang under the counter

- The stack of bags on the counter top is gone. White carrier bags now hang in a
  bundle on the clerk's side of the counter, their handles hooked over the near lip;
  clicking them pulls one off and opens it at the packing place on the counter.

### Verified (bags)

- All five checks pass (the browser flow bags every bagged order). The desktop
  screenshot was reviewed close up.

### Not verified (bags)

- Most of the bundle sits behind the radio caption bar; only the handles, the bundle's
  tops and the logo's upper edge show. The new bag rises from below the lip straight
  onto the counter, not out of the bundle frame by frame.

### Added — the flip phone as the settings menu

- Clicking the clerk's flip phone flips it open close up (closed, half, open frames
  drawn in `art/src/handset.cjs`) and pauses the shift: `NSF.time.paused` stops the
  game clock while `uiNow` keeps the phone animating, and the radio drops back.
- Its screen lists VOLUME, RADIO and SOUNDS (0–5, drawn as signal bars) and SILENT
  MODE, with a status bar showing the shift clock. Rows, bars and the handset's keys
  are clickable; arrow keys, Enter and Escape work too. A click outside, BACK or the
  end key puts it away. Settings are kept in localStorage.
- Audio now plays through `sounds` and `radio` buses into `master`, so the levels apply.
- The SOUND: ON/OFF chip in the corner is gone (silent mode replaces it).
- Song requests to *Night Ferry* wait for the station's music; recorded as not yet
  built in `docs/worldview.md`.
- README still said "card or phone"; fixed.

### Verified (phone)

- All five checks pass. The browser flow opens the phone, checks the game clock is
  frozen, sets silent mode and a radio level by clicking, and closes it. The new
  desktop screenshot of the open phone was reviewed.

### Not verified (phone)

- The phone on a real touch screen, and how the levels sound by ear (only that the
  gains apply without errors). The radio voice already scheduled for a line keeps
  playing, ducked, for up to a few seconds after the phone opens.

### Changed — the register keypad, printer, phone and radio dial

- The register's typing keyboard is a cash-register keypad: department keys with
  coloured caps, a number pad and tall TOTAL and CLEAR keys, on a grey body.
- The receipt printer no longer sits behind the radio as if stacked on it: it stands
  by the bags and the card terminal, and the radio moved to the clerk's right front.
- The clerk's flip phone is sculpted: silver clamshell, hinge barrel, aerial stub,
  lit outer display, the lid seam and a strap with a red bead charm.
- The radio shows its analogue dial again: the runtime LED digits over it are gone,
  the scale has ticks but no numbers, and a red needle sits at the low end (one pixel
  further right on 87.7).

### Verified (register, printer, phone, radio)

- All five checks pass. Desktop (card sale, echo radio) and phone-landscape
  screenshots were reviewed.

### Not verified (register, printer, phone, radio)

- The phone is still small on screen (about 15 px) and not clickable yet.

### Changed — Walt, Hal and Sam dressed as the worldview says

- Walt (taxi driver) wears a worn trench coat, double-breasted with wide lapels, a
  belt and buckle, and a striped burgundy scarf with one fringed end down the front;
  the cardigan and tie are gone.
- Hal (dock worker) wears a fluorescent orange hi-vis jacket with two silver bands
  round the body and sleeves, flannel at the collar; the quilted vest is gone. Orange,
  not yellow, so he doesn't echo Nell's raincoat or Bonnie's beanie.
- Sam wears Kit's wired earphones.

### Verified (Walt, Hal, Sam)

- All five checks pass. The people sheet was reviewed for all three in every pose.

### Not verified (Walt, Hal, Sam)

- The sleeve bands on Hal show only at the arms' edges in resting poses. Walt's scarf
  stripes are faint at this size. Shift screenshots were captured but not looked at.

### Changed — no phone payment; Tess and Ana dressed as the worldview says

- Phone (TAP) payment is gone: unusual for 2005 in most places, and the same action as
  a card. Ordinary orders alternate card and cash; order 4 now pays cash. The phone-tap
  pose, its arm solve, its sound and its strings are removed (291 → 247 sprites).
- Ana, the night nurse, now wears the scrubs; Tess, the student, the navy peacoat.
  Their colours, accents and trousers moved with the outfits.

### Verified (no phone payment)

- All five checks pass. The people sheet was reviewed for Tess and Ana in every pose.

### Not verified (no phone payment)

- Desktop and phone screenshots of the shift were captured but not looked at; nothing in
  the store view changed.

### Changed — Lowtide is in no particular country

- `docs/worldview.md` now says so: the 2005 feel comes from things remembered almost
  everywhere, not from one country's goods, currency or clothing.
- Prices show as plain numbers with two decimals (4.46), no `¥`; the catalogue keeps
  integer cents. The `¥` glyph is gone from the font.
- The tuna onigiri is gone; the first customer buys coffee and the egg sandwich. The
  karaage bento is a beef lasagne ready meal (foil tray, film, card sleeve) with the
  same price and heating rule. BOSS COFFEE (a real brand) is ICED COFFEE; MILK BREAD
  is SWEET ROLL.
- Tess no longer wears a paper mask, which read as post-2020; the mask part is removed.

### Verified (no particular country)

- All five checks pass. Desktop screenshots of the first sale (coffee and sandwich,
  4.46) and the lasagne heating, the goods sheet and Tess's unmasked face were reviewed.

### Not verified (no particular country)

- Phone screenshots were captured by the visual check but not looked at.

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
