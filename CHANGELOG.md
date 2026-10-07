# Changelog

What changed, and how it was checked. Newest first. Each entry lists what was
verified and what was not.

## Unreleased

### Changed — touch targeting and long-press labels

- Touch pointers now use a wider pixel hit tolerance for counter targets.
- A short touch keeps the target highlighted; holding a counter object reveals its
  existing desktop label for a moment, then clears it automatically.
- Pointer leave clears desktop hover state.

### Verified (touch targeting)

- Content, interaction, browser-flow and visual checks pass after the input-router
  change. The touch path was exercised through browser pointer events; physical
  phone hardware remains unverified.

### Changed — validated queued actions and visible selection

- Revalidate queued checkout actions against the current order. Pause queue dispatch
  during modal inspection or locked dialogue, and discard stale entries.
- Keep selected products outlined when hovering elsewhere; add desktop fixture and
  product labels without exposing record choices.
- Show specific payment, scanning, heating and packing failure reasons on the POS,
  with a longer reading interval instead of a separate bottom HUD.
- Added interaction regression coverage for duplicate clicks, modal queue suspension,
  auto scanning, stale orders and invalid queued actions.

### Verification (validated input)

- Full standard verification suite and the new interaction test passed. Desktop and
  landscape phone screenshots reviewed; font regenerated.
- Physical phone use and speaker listening were not verified. Touch long-press labels
  are not implemented in this update.


### Changed — interaction feedback and input resilience

- Added a derived POS phase hint for scanning, record checks, heating, packing and
  completion, plus visible hover outlines for counter targets.
- Counter actions now keep a small de-duplicated queue (up to three actions), show a
  short acknowledgement for queued or rejected clicks, and clear the queue when the
  customer changes.
- Added a lightweight empty-click/blocked-click response, larger phone touch rows,
  and right-click closing for modal panels while preserving keyboard Escape behavior.

### Verified (interaction)

- All five verification commands pass, including four complete browser paths and the
  visual suite at desktop and narrow landscape sizes.

### Not verified (interaction)

- Touch feedback was verified through pointer events and enlarged hit regions in
  Chrome; it was not tested on a physical phone.

### Changed — buffered counter flow and unified overlays

- Tapping the next counter action during a machine animation now queues one action
  for the current order, with an audible acknowledgement; tapping the scanner with
  no selected product takes the next item and scans it automatically during normal
  orders. Deliberate mismatch rescans remain manual.
- Phone, lost-and-found, POS records and the radio dial now share one modal pause
  owner. Only one overlay can be open, and WebAudio suspends with the game clock.
- Starting a new order replaces unfinished Night Ferry queue content, so each order's
  segment starts on time. Radio songs are capped at 15 seconds.

### Verified (counter flow)

- `shift-engine`, `content`, `art`, `browser-flow` and `visual` all pass after the
  change; desktop and narrow landscape screenshots were captured by the visual flow.

### Not verified (counter flow)

- Audio pause and the new click acknowledgement were exercised in headless Chrome,
  but not listened to on physical speakers.

### Changed — louder, and a ringtone for texts

- Everything was quiet against other audio on the same device (measured in Chrome:
  scanner peaks at −24 dBFS, songs at −38.5 dB RMS, June's voice peaking at −35 dBFS).
  The mix now has a +6 dB output gain into a limiter (−3 dB threshold) after `master`,
  and the radio voice is raised a further ~4 dB to sit with the sound effects. Measured
  after: scanner −17 dBFS peak, songs −31 dB RMS, voice −25 dBFS peak.
- A text arriving now rings as well as buzzing: bright two-partial pings in rising
  threes, played twice, through a bandpass like the phone's small speaker
  (`phoneRing`).

### Verified (volume)

- All five checks pass; levels were measured before and after by tapping the output in
  headless Chrome, and nothing reaches the limiter in those measurements.

### Not verified (volume)

- Not listened to: how loud it feels on speakers and headphones, and whether the
  ringtone is pleasant.

### Changed — each night's content in one place

- Everything that would change from one night of the week to the next now lives in one
  entry of `story.nights`: the date and earlier dates on the sheet, the times and order
  clocks, Night Ferry's segments, the frequencies between the stations, the texts that
  arrive, when the lines open, who stayed, lost and found, and the drift plan. Code reads
  `story.tonight` (the first night); the sign-in sheet's dates and `drift.js`'s plan
  come from it. Shared content (catalogue, contexts, records, songs, endings, the
  phone's presets and calls) stays where it was. Behaviour is unchanged.

### Verified (nights)

- All five checks pass; the content test checks every night has eight clocks and
  segments.

### Not verified (nights)

- No second night exists, so switching nights has not been exercised.

### Added — calling Night Ferry

- With order 6 June opens the phone lines. The phone's menu gains CALL NIGHT FERRY:
  once a night, until the report, the clerk says one of three things; when the phone
  is put down Night Ferry carries their words and June's reply, and the window across
  the bay blinks back. Before the lines open the screen says LINES CLOSED.
- If the clerk texted or called, June thanks them by name before signing off.

### Verified (call)

- All five checks pass; one browser path calls in at order 6, waits for June's reply on
  air and checks the thanks is queued; the others check it is not. Screenshots of the
  menu and the closed lines were reviewed.

### Not verified (call)

- The sign-off with the thanks was not watched at natural speed.

### Added — lost and found

- An open cardboard box in a cubby in the cabinet, between the cash drawer and the bags
  (`store-lost-found`). Through the night it collects the left yellow rain boot (order
  4), a taxi receipt from Walt, a ward wristband from Ana, a punched ferry ticket from Hal
  (whichever two came in), and by order 8 the right boot, which nobody brought in. Their
  tops peek over the rim; clicking the box shows each with its tag and pauses the shift.
- The earlier ordinary orders no longer include any of the people who stayed, who now
  come only after three.

### Verified (lost and found)

- All five checks pass; the browser flow opens the box at the end of each path and finds
  both boots and two people's things. The close-up was reviewed on desktop.

### Not verified (lost and found)

- The items peeking over the rim were not looked at close up; phone screenshots were
  not looked at.

### Added — the other window across the bay

- The far shore's lit windows are drawn at runtime (taken out of `store-back`) and go
  out one by one through the night. One window stays on all night: after two it blinks
  back twice when the store's tubes flicker or when June reads the clerk's text, and it
  goes out when Night Ferry signs off. Its light breaks up on the water like the tower's.

### Verified (window)

- All five checks pass. A desktop close-up of the bay at 01:14 was reviewed.

### Not verified (window)

- Whether players notice the window answering was not tried with anyone.

### Added — company: songs on Night Ferry, and people who know you listened

- Night Ferry plays three short synthesised songs (`playSong` in `audio.js`, notes in
  `story.radio.songs`): after order 2's request for the night clerk, after the rain eases,
  and after the clerk texts in a request. The title shows at once; tuning away stops a
  song and it starts again on tuning back.
- Orders 6 and 7 are now two of Walt, Ana and Hal (`lineup` in `shift.js`); their
  frequencies come in from orders 2–4. `js/game/company.js` remembers what the clerk
  heard: someone listened to says so as they reach the counter, and after a song the
  next ordinary customer comes in humming it.

### Verified (company)

- All five checks pass; one browser path listens to all three frequencies and checks
  the order 6 customer's first line; the engine test checks orders 6 and 7 are people
  who stayed across 500 seeds; the song caption screenshot was reviewed.

### Not verified (company)

- The songs were not listened to: their tune, level and the tape wobble are untested
  by ear.

### Changed — the counter's front is a cabinet, not a dark band

- Under the counter the clerk's side was a dithered dark plane with the cash drawer and
  an S/M/L bag rack floating on it, labelled like buttons. It is now the cabinet's front:
  dark wood-grain laminate in the top's shadow, with seams, grain and knee scuffs.
- The cash drawer loses its CASH tape and maker's plate for a pull along its lower
  edge. The bags hang in a cubby in the cabinet: three bundles of folded white bags on a
  steel rail by their handles, longer for bigger bags, the middle one with the buoy. The
  bag fixture is taller (0.13 m) so the longest bundle runs off the bottom of the view.

### Verified (cabinet)

- All five checks pass. Desktop close-ups of the shut and open drawer and the bag
  cubby, and the landscape phone screenshot, were reviewed.

### Not verified (cabinet)

- A bag being pulled off the rail was not looked at frame by frame.

### Added — the room's sounds

- A door chime as each customer comes in; the drinks fridge's compressor starting,
  humming for a minute or so and stopping with a rattle; gulls at first light before the
  sign-out. With the earlier steps the store also has tyre hiss outside, the wall
  clock's ticks when it skips, a ballast buzz on flickers, the phone's buzz and chirp,
  and the pen on the sign-in sheet.
- The echo's hiss thins as the night goes on, so 87.7 is clearer toward dawn.

### Verified (sounds)

- All five checks pass; the browser flow's audio smoke test calls every new sound
  against a real AudioContext.

### Not verified (sounds)

- None of the new sounds was listened to; levels against the room tone and the radio
  are untested by ear.

### Added — texts on the flip phone

- The phone opens on a menu: MESSAGES, TEXT NIGHT FERRY, SETTINGS (`phone.js` now has
  screens; `messages.js` holds what arrived and what was sent).
- Three texts arrive in the night: two from no number (orders 4 and 6) and, with order
  8, one from the clerk's own number, shown as their name. The phone on the counter
  buzzes and shakes, and its light blinks until they are read.
- Once a night the clerk can text Night Ferry one of three messages; June reads it with
  the clerk's name before the next segment, and someone who heard it writes back.

### Verified (texts)

- All five checks pass; one browser path sends a text and checks it is read on air and
  answered, the others that the three texts arrive. Desktop screenshots of the menu, a
  text, compose and settings were reviewed.

### Not verified (texts)

- The buzz and shake on the counter were not watched; phone screenshots were not
  looked at.

### Added — tuning the radio

- Clicking the radio opens its dial (87.5–88.1, steps of 0.05) instead of flipping
  between two stations: drag or click the needle, step keys, or arrow keys. UI regions
  can now follow a held pointer (`drag` in `ui.js`, routed by `main.js`).
- Between 87.6 and 87.7, unmarked, three people who stayed come in as the night goes
  on: a taxi dispatch calling Walt (87.85), a ward calling Ana (87.95) and a crossing
  report for the suspended ferry (88.05). Elsewhere is static, louder than the echo.
- `radio.js` is now built around a frequency and a kind (ferry, echo, signal, static);
  Night Ferry lines may carry variables; after the sign-off 87.6 is static.

### Verified (radio)

- All five checks pass; the browser flow drags the needle to the top of the band, steps
  back to 88.05 and tunes back to Night Ferry. Desktop screenshots of the echo and the
  taxi dispatch with the dial open were reviewed.

### Not verified (radio)

- The dial on a phone was not looked at; dragging on touch was not tried on a device.

### Added — drift that grows through the night

- `js/game/drift.js` plans each shift's drift from its seed and changes only readings:
  the wall clock skips ten minutes in two later orders (the microwave and POS stay
  right), the POS count flashes 5 for a moment, order 6's customer leaves with Nell's
  last words, and the tube flicker (moved here from `main.js`) comes more often as the
  night goes on, sometimes in the echo's colours after three, with a ballast buzz.

### Verified (drift)

- All five checks pass. A scripted run logged the borrowed line on order 6 and a
  desktop screenshot showed the wall clock ten minutes ahead of the microwave with the
  POS reading 5 ITEMS for one item.

### Not verified (drift)

- How noticeable the drift is at natural speed was not judged by a player.

### Added — life outside the window

- `js/game/outside.js`: cars pass on the wet street now and then (fewer in the small
  hours), headlights first, with beams and reflections on the road and a tyre hiss
  through the glass; they pass behind the door's mullion and handles.
- After three the ferry, which June says is suspended, crosses the bay anyway, lit.
- Drops hang on the glass and slide down in steps; the rain eases from half past three
  to a drizzle by five.
- While the echo on 87.7 speaks, the tower's red light blinks in time with the voice.

### Verified (outside)

- All five checks pass. Desktop close-ups of a car and the ferry were reviewed.

### Not verified (outside)

- The car sound's level against the room tone was not listened to. Phone screenshots
  were not looked at.

### Added — the night runs from sign-in at 01:00 to dawn at 05:00

- START SHIFT opens the night staff sign-in sheet: type a name (keyboard or the letter
  keys beside it; empty signs as ROBIN) on tonight's line. The earlier nights carry the
  same signature, none signed out.
- The eight orders are spread over the night (01:14 to 04:31; the report at 04:44), so
  order 5 stays at 02:41 and order 8 comes near dawn. June's intro says one a.m.
- The view outside follows the clock (`js/game/night.js`): the back wall's night, sea and
  lamp colours are remapped per two minutes of game time, deepest toward 03:30, grey
  from 04:30, a cold dawn at five with the street lamp and the town's windows out.
- The ending: while the closing letter and sign-off are read, the clock runs 04:44 →
  05:00 and the sky lightens; then 87.6 is static, the sheet comes back with every
  earlier line now reading as the clerk's name, and SIGN OUT writes 05:00. The closing
  card shows 01:00 — 05:00 and the name. The customer's basket no longer stays behind.

### Verified (night)

- All five checks pass; the browser flow signs in with a typed name on two branches and
  the default on two, and signs out on all four. Desktop screenshots of the sign-in
  sheet, order 8 at 04:31 and the dawn sign-out were reviewed.

### Not verified (night)

- Phone screenshots of the sheet were not looked at. Natural-speed timing of the dawn
  against the radio was not watched.

### Changed — a pool of light over the checkout mat

- The counter and everything on and under it are lit brightest over the checkout mat
  and fall off toward both ends (`pool` in `art/tools/raycast.cjs`, used by the ray-cast
  lighting and the sculpted objects). The laminate's hand-painted tones step down to
  match, dithered where they change. Walls, shelving and the fridge are unaffected.

### Verified (light pool)

- All five checks pass. Desktop card-sale and heating screenshots were reviewed. A
  first version also dimmed the lower wall shelves; the pool is now limited to the
  counter.

### Not verified (light pool)

- Phone screenshots were not looked at.

### Changed — the sale on a mat, the clerk's things on their own surfaces

- The counter read as one surface with the sale and the clerk's things in one row. A
  dark ribbed checkout mat with a raised rim and a printed border now runs across the
  middle, from the scanner past the basket: the basket, the goods taken out and the
  scanned goods stand on it (the lane is shifted 4 cm right to stay on it).
- On the right, an old wooden tray with two coffee rings holds the clerk's things: a
  chipped white mug of cold coffee (it replaces the can, which looked like the iced
  coffee on sale), and the magazine with the flip phone on it. On the left, a dark desk
  pad lies under the rota, the receipt spike and a receipt. The second loose receipt is
  gone.

### Verified (zones)

- All five checks pass. Desktop card-sale and cash screenshots were reviewed. A THANK
  YOU print on the mat was tried and dropped: at this angle it squashes to three
  unreadable pixels.

### Not verified (zones)

- Phone screenshots were not looked at. The pool of light over the mat is planned
  next.

### Changed — a lower PIN pad, further right

- The PIN pad's pole is 4 cm instead of 7.5 cm, and the pad stands 5 cm further right;
  the change tray moves 4 cm right to keep clear of its base.

### Verified (lower PIN pad)

- All five checks pass. Idle, card-in and approved states were reviewed close up.

### Changed — the card terminal is a PIN pad on a swivel pole

- The card terminal was an upright black box with the card lying on top. It is now a
  light grey 2005 PIN pad on a swivel pole (round base, short pole, bracket), held at
  60 degrees with its face to the customer. The clerk sees its sloped back with the
  maker's label, vents and rim, the status lights along its top edge and a coiled cable
  to the counter. Paying by card, the customer's blue card stands half out of the slot
  in the top edge and the lights go amber; approved, they go green and the screen's
  light spills green onto the base. A handheld lying in a cradle was tried first: from
  the clerk's eye its face is almost edge-on and it read as a dark lump.
- `orientedBox` draws a box on any axes in the art build (the pad, its bracket, the card).

### Verified (PIN pad)

- All five checks pass. Idle, card-in and approved states were reviewed close up, and
  the desktop card-sale screenshot.

### Not verified (PIN pad)

- Phone screenshots were not looked at.

### Added — a clip strip of snacks at the end-cap

- A steel clip strip hangs down the end-cap's left side, in the bare gap beside the
  fridge glass, with six small snack bags one under another: crimped header, coloured
  print, a clear window and a brand line.

### Verified (clip strip)

- All five checks pass. The desktop card-sale screenshot was reviewed close up.

### Changed — an end-cap at the fridge's end

- The fridge's end panel facing the clerk was one tall poster. The poster is now a short
  ICE COLD sign with the cola bottle at the top; below it an end-cap of three wire
  shelves over the counter's end: film, a disposable camera and the charity box on top,
  a magazine rack with three covers in the middle, and battery cards, phone cards and
  the lighters just above the counter.
- The charity box and the lighters leave the counter's customer edge, which keeps the
  gum rack and the change tray.

### Verified (end-cap)

- All five checks pass. Desktop card-sale and phone-landscape screenshots were reviewed.

### Not verified (end-cap)

- The radio hides most of the bottom shelf (battery cards, lighters) from the clerk's eye.

### Changed — the clerk's things gather at the two ends of the counter

- The middle of the counter is left to the sale. On the right, the clerk's corner: the
  magazine beside the radio with the flip phone lying on it, the half-finished coffee
  and a loose receipt. On the left, the paperwork: the rota on its clipboard moves
  beside the receipt spike, with a receipt by the sign-in sheet.
- Flat paperwork (rota, receipts, magazine) is drawn in the counter layer, under the
  machines, so the phone shows on the magazine and the spike over the rota.

### Verified (clerk's corners)

- All five checks pass; the phone still opens settings. The desktop card-sale
  screenshot was reviewed.

### Not verified (clerk's corners)

- The left corner is busy (rota, spike, receipt, sign-in board). Phone screenshots were
  not looked at.

### Changed — checkout from a basket; customers keep their pose

- The customer sets a red shopping basket down right of the scanner and waits in their
  own pose for the whole sale. Clicking the basket takes the next item out to stand in
  front of it, selected, ready for the scanner; the basket shows empty after the last
  and goes back on the stack when the customer leaves. Scanned items stay on the counter
  for re-scans.
- Card payments show the customer's card standing in the terminal's slot, then the
  approval; cash is a note left on a new change tray, which goes into the drawer. Goods
  and the bag are handed over across the far edge of the counter.
- The reaching poses (`card`, `cash`, `card-reader`, `receive`), their arm modes
  (`reach`, `swipe`, `take`), the held card and note, the `downRight` gaze and the
  customers' `over` layer are removed (252 → 104 sprites). The rig sheet shows the
  waiting poses.
- README and game-design describe the basket, the tray and the REC key (the README
  still said to click the register screen).

### Verified (basket checkout)

- All five checks pass with the flows updated to take items from the basket. Desktop
  card, cash and heating screenshots, a full basket and the first item out were
  reviewed.

### Not verified (basket checkout)

- A both-rest customer's right hand lies behind the basket. Phone screenshots were not
  looked at. The personal items and the fridge end-cap (steps 2 and 3) are not done.

### Changed — carrier bags in a pocket rack under the counter

- The recessed bag bundle sat behind the counter's fascia, where the clerk cannot see,
  yet was drawn over the counter's edge as a beige block. The bags now stand folded in
  a steel pocket rack hung under the counter on the clerk's side, beside the cash
  drawer's plane: three pockets with S, M and L tapes, bigger bags standing taller, their
  tops and handle loops above the rims, the brand buoy on the middle stack. A bag is
  still pulled from the rack's top to the packing place.

### Verified (bag rack)

- All five checks pass. Desktop card-sale and phone-landscape screenshots were reviewed.

### Not verified (bag rack)

- The moment a bag is pulled out was not looked at frame by frame. The rack's lower edge
  meets the bottom of the screen.

### Fixed — carrier bag static silhouette · 2026-10-07

- Removed the full bag body from the idle `store-bags` sprite. The recessed
  counter fixture now renders only two handles, the folded mouth and a short
  shadow; `bag-open` still supplies the full bag after interaction.

### Verified (carrier bag silhouette)

- Rebuilt 252 sprites; all five checks pass with bundled Playwright and Chrome.
- Reviewed the native-pixel preview and browser visual screenshots.

### Changed — recessed carrier bag bundle · 2026-10-07

- Moved the carrier bag bundle behind the clerk-side counter fascia, reduced its
  footprint, and left only a small handle and bag-mouth detail visible below the
  edge. The click target, packing destination and bag interaction remain intact.

### Verified (carrier bag presentation)

- Rebuilt 252 sprites; all five checks pass with bundled Playwright and Chrome.
- Reviewed the native-pixel store preview and browser visual screenshots.

### Not verified (carrier bag presentation)

- No physical-device view was available; the 844×390 landscape browser check passed.

### Changed — narrow-screen text readability · 2026-10-07

- Added a narrow-viewport text pass for the POS, customer speech bubble and
  radio caption. Bitmap text scales to 1.15–1.2× below 900 CSS pixels, with
  local wrapping and line spacing recalculated so the existing UI regions stay
  inside the 960×540 canvas.

### Verified (narrow-screen text)

- `shift-engine`, `content`, `art`, `browser-flow` and `visual` pass using the
  bundled Playwright and Chrome.
- Reviewed the 844×390 landscape screenshot; the POS and caption remain inside
  the canvas and are more readable.

### Not verified (narrow-screen text)

- Portrait phone layout and physical device font readability were not reviewed.

### Fixed — the CASH label fits its tape

- The drawer's CASH tape was as wide as the word, so the last letter ran off its edge.
  The tape is now 19 px wide with the word centred, two pixels clear on each side.

### Verified (CASH label)

- All five checks pass. The closed drawer was reviewed close up.

### Changed — caption at the top, machines in depth order, a finished cash drawer

- The radio caption sits at the top left, over the shelves, so the counter, the bags and
  the open drawer stay in view.
- The register is a fixture again, drawn between the microwave and the scanner, but
  inert (not a click target): the monitor now hides the microwave's right side instead
  of being drawn under it. The microwave moves 4 cm left, leaving a gap.
- The cash drawer hangs in a dark steel housing; its front gains corner screws, a
  maker's plate, a finger recess and shading toward the floor. Open, the notes are
  stacks with layered edges, a border, portrait and value under real spring clips, and
  the cups hold round copper, silver and gold coins.

### Verified (caption, depth, drawer)

- All five checks pass. Desktop card-sale, heating and cash-drawer screenshots and the
  phone-landscape screenshot were reviewed.

### Not verified (caption, depth, drawer)

- A long caption at the top can reach across the window; the speech bubble was not seen
  to collide with it in the screenshots.

### Changed — a used keypad

- Grime speckles the keypad between its keys, and a row of old price-gun labels is stuck
  on its back edge.

### Verified (used keypad)

- All five checks pass. A close-up of the keypad was reviewed.

### Not verified (used keypad)

- The contact shadow under the keypad was left as it was. Phone screenshots were not
  looked at.

### Changed — monitor and cash drawer get real build detail

- The register's monitor is a deep bezel with the CRT housing stepping in toward the
  back and vent slots down its side; the chin has brightness and contrast knobs and a
  power button beside its light (the light was hidden under the sticky note).
- The cash drawer's front has folded steel edges, a bevelled check slot, a round key
  lock with its keyway, a CASH label tape and knee scuffs. Open, the till is a black
  insert with notes under four spring clips and five coin cups of mixed coins; the open
  drawer shares the same front.

### Verified (monitor, drawer)

- All five checks pass. Desktop card-sale and cash-drawer screenshots were reviewed.

### Not verified (monitor, drawer)

- From the clerk's eye the monitor's stepped housing shows mainly at its right side;
  the swivel base would sit behind the keypad and was not drawn. The radio caption
  covers the front of the open till. Phone screenshots were not looked at.

### Changed — printer and microwave get real build detail

- The receipt printer is a two-tone thermal printer: a charcoal base with a brand line,
  FEED button and power and paper lights; a lighter lid set in from the base's edges,
  with a tear bar, the exit slot and the hinge; the last receipt standing out of the
  slot and bending toward the clerk. The printer moves 3 cm right and the sign-in board
  3.5 cm left, so the board rests on the printer's left corner and the front shows.
  The shift report rises from the new exit slot (`exit` on the printer in `space.js`).
- The microwave is brushed stainless steel: the door's gap and frame, a perforated
  window onto a dim cavity with the turntable, old splashes and a glare, a handle bar on
  stand-offs, raised keys, START and STOP, and a laminated heating-time card on its
  side. Heating keeps the warm glow, now behind the mesh.

### Verified (printer, microwave)

- All five checks pass. Close-ups of both and the desktop heating screenshot were
  reviewed.

### Not verified (printer, microwave)

- Brushed lines on the microwave's top barely show from this angle. Phone screenshots
  were not looked at.

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
