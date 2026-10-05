# Eight-order build: implementation and testing

Updated: 2026-09-28

## Pixel World

The scene now renders inside one 640x360 logical stage. Fixtures, products and
moving props use integer world coordinates; resizing changes only the common
stage scale. Desktop and mobile therefore share the same layout. Fractional
viewport scales remain supported, so this is a logical pixel grid, not a promise
that every world pixel occupies an integer number of physical screen pixels.

`js/pixel-world.js` owns native sprite dimensions, target heights, foot anchors,
fixture boxes and stepped movement. Products keep their aspect ratio, rounded
to world pixels. Four-pixel gaps separate items; a single bounded fit adjustment
is allowed only if a combination exceeds the lane. Orders beyond that capacity
are rejected rather than silently crushed. The current generator still caps
physical items at two; this does not add unlimited tabletop capacity.

Card/phone payment uses three authored poses per customer: extraction, presentation
and contact, then reverses through those poses to idle. Props follow fixed hand
anchors and use the same customer reference scale. There are no generated limbs,
continuous rotations or prop fades. Contact still triggers payment audio.
Scan, heating, bagging, handoff and cash movement now use snapped displacement;
customer entry/exit uses fixed stepped positions. Existing operation durations
and the investigation/decision model are preserved.

Removed the superseded ten payment sprites, skeletal animation implementation,
product depth/pose scale rules, bag transform variables and unused bag ghost CSS.
Fixed stale transparency on heated items and hidden bags during extraction.

Additional tests: `pixel-world.test.cjs` checks 500 generated shifts, native ratios,
integer lane geometry and held keyframes. `pixel-world-browser.cjs` checks desktop,
odd-sized and mobile viewports, all payment phases and resizing during payment.
Natural-speed motion remains a human playtest question, not an automated assertion.

2026-09-28 verification: engine and pixel-world unit tests passed (500 seeds
each); all four eight-order browser paths completed; 4,584 desktop/mobile product
checks passed; payment phase/resize and visual suites passed. Phone-contact and
mobile quantity screenshots were inspected. The narrow portrait layout preserves
the scene but makes text small; this change does not introduce a separate mobile UI.

## POS Evidence View

- Removed the external records toolbar and shift counter; restored the original
  full-viewport shell and 16:9 scene. The POS screen is now the records hit target.
- The dialog remains keyboard-accessible, with a lighter unblurred backdrop,
  terminal typography, pixel-square radio controls and selective conflict color.
- Before a real countertop rescan, no choices or preview are rendered. Only
  evidence and RETURN TO COUNTER TO RE-SCAN appear. A selected action previews
  LABEL / ORIGIN / VERIFY; a saved entry stays separate from raw observations.
- Orders are deeply frozen. Check history determines rescan eligibility and
  decision history determines completion; there are no duplicated
  confirmedMismatch or mismatchRescans UI fields.
- Decisions and transactions use recordOrigin (REGISTER or MANUAL) and
  verificationMode (AUTO, CURRENT_SCAN or LINKED_HISTORY). A linked manual
  record retains MANUAL origin without counting as another manual correction.
- The domain owns both action previews and commits. Saved-label projections feed
  POS/receipts without changing original item.pos. Checks derive their result
  from the item; records derive identities and labels from the checked item.

## Maintenance Pass

Only the current build is retained. Removed the six-order executable archive,
22 superseded customer SVGs and the unused duplicate engine `js/shift.js`.
Removed the old polygon-placement algorithm, footprint debug DOM, hidden surface
editor and its listeners/styles. Product rendering now calls the lane placement
function directly. The actual tabletop clipping polygon remains in use.
Future substantial updates follow the review and regression checklist in
`../AGENTS.md`.

## Counter interaction upgrade

- Products now occupy separate incoming/scanned rows within a device-free lane.
  Layout tests check physical overlap with the scanner, tray, terminal and printer,
  not just whether a small part of the hitbox is reachable.
- Identical purchases retain unique physical-unit IDs and share a SKU. Each unit
  must be scanned; POS and receipts aggregate quantities and extended prices.
  Order seven includes a repeat drink purchase. Quantity aggregation is not capped
  at two, although this eight-order slice still generates at most two physical items.
- Three card SVGs and two phone SVGs accompany connected extraction, reach,
  terminal contact and retrieval motions. Payment sounds occur at terminal contact,
  not at the initial click. Cash timing is unchanged.
- Ten customers have new side-arm idle, receiving and payment poses. Original
  sprites supersede the removed six-order assets.
- Quiet customers may only announce payment; brief and chatty customers use
  different opening lengths and reactions. Departures may be silent.
- The review panel shows RE-SCAN PENDING, then the actual second scan result.
  BACK TO COUNTER only closes the panel: select the physical item and use the
  scanner again. KEEP REGISTER ENTRY and CORRECT TO ITEM appear only after a check.
  Paid history is hidden during order five and available for the order-eight link.

Payment motion lives in `js/payment-motion.js`. Visual regression captures:
`node tests/payment-visual.cjs` (same Playwright setup as below).
On 2026-09-24, 500 seeds and all four full eight-order decision paths passed.
4,584 layout checks passed across desktop/mobile; x2 and payment-contact
screenshots were inspected. Natural-speed feel still needs a human playthrough.

## Play

Open `../greybox.html` directly in a browser and click START SHIFT. This build
does not require a server. Only the current eight-order build is retained.

Use `greybox.html?seed=review-01` to replay a particular generated shift. Seeds
control ordinary orders and the customer lineup; sound variation remains separate.
Reload starts a new shift; there is no persistence across refreshes.

## Implemented

- Eight orders, including guaranteed card, cash/no-bag, and heating introductions.
- Ordinary orders use constrained product/payment/service combinations and a
  nonrepeating pool of opening conversations. Orders five and eight are authored.
- Fifth order: rescan provides evidence; separate KEEP REGISTER ENTRY and
  CORRECT TO ITEM choices require an explicit SAVE RECORD. No choice is preselected.
- Eighth order: the POS and review panel reference sale-005's saved entry and
  source. USE LINKED ENTRY references that source; USE CURRENT SCAN saves the current
  scan independently. Both routes complete the transaction.
- The green POS key and POS screen open the review panel. It includes
  current evidence, the linked transaction, and paid-transaction history.
- Receipts contain the saved name, source, and any transaction link. Closing
  totals, manual override counts, and link counts derive from the actual ledger.
- The engine returns copies of history and freezes order input. Displayed labels
  are projections. Repeat submission/settlement cannot duplicate records.
- Normal orders do not inherit the old demo's index-based environmental anomalies.
- Completed bagging stops the bag hitbox from blocking the report printer.
- Incoming and scanned products use reserved rows away from equipment.

## Code boundaries

`js/shift-engine.js`: seeded generation, checks, decisions, settlement and report.
Pure logic shared by the browser and Node tests; independent from audio and DOM.

`js/register-ui.js`: evidence/archive panel and draft choice interaction.

`js/greybox.js`: existing scene, animation, dialogue and checkout controller.
Its `state` remains current-order state; `shiftState` owns the cross-order history.

`css/register-review.css`: secondary POS evidence view and in-scene hit target.

## Verification

Run `node tests/shift-engine.test.cjs` for 500 deterministic seeds and all four
decision combinations. Tests check valid service combinations, ordinary dialogue
uniqueness, rescan prerequisites, isolated history, totals and idempotency.

Run `node tests/browser-flow.cjs` with Playwright installed and Chrome available.
An absolute Playwright module path can be supplied as `PLAYWRIGHT_MODULE`.
The browser suite clicks through all eight orders on all four branches, using
accelerated timers and animation playback. It checks report counts, runtime errors,
loaded images and narrow-screen overflow; screenshots go to `tests/artifacts/`.
This is functional regression coverage, not evidence that natural pacing feels good.

Latest results (2026-09-27): 500 generation seeds passed; all four full browser
paths completed eight transactions with no page errors or broken images.
Tests additionally cover immutable orders, preserved raw observations, action
preview/commit agreement, origin versus verification semantics, delayed choice
disclosure, keyboard opening/Escape focus return and removal of the external HUD.
`tests/product-layout.cjs` passed 4,584 checks across 60 generated shifts at
1440px and 390px, including device overlap and incoming/scanned hitboxes.
Payment/quantity visual checks passed. Desktop and narrow-screen terminal
screenshots were visually inspected.

## Still requires human validation

- Whether both fifth-order choices feel defensible.
- Whether players recognize the eighth-order link without facilitator hints.
- Whether independent verification becomes an automatic default.
- Natural-speed dialogue, waiting, and eight-order fatigue.
- Whether the record panel should become a more spatially integrated POS view.

No added financial penalties, countdowns, new scenes, invented accounting anomalies,
or fifteen-order expansion. The eight-order build is a playable mechanism test;
the design blueprint's audience acceptance gate remains open.
