# Night Shift Frequency: Greybox Plan

Historical planning record. For the next implementation, use
[八单玩法验证蓝图](gameplay-blueprint-v2.md). This document does not describe the current runtime.

Purpose:

```text
Turn the locked vertical-slice script into a playable ugly prototype before making final pixel art.
```

Core rule:

```text
Make it feel like a usable checkout counter first.
Make it feel like a real convenience-store checkout counter second.
```

## 1. Locked Inputs

Reference documents:

- `docs/scope-questions.md`
- `docs/vertical-slice-script.md`

Current locked direction:

```text
fixed 16:9 pixel-art checkout counter
nighttime throughout
6 short checkout events
click-based cashier flow
POS is central, but not the whole world
```

Design pillar:

```text
The convenience-store workflow still runs normally,
but the reality being processed by that workflow is no longer stable.
```

## 2. Greybox Questions To Resolve

### Frame

- Logical canvas size
- Browser scaling behavior
- Pixel scale rule

### Composition

- Counter area size
- Customer standing point
- Product placement point
- Scan area
- Bag / finished item area
- POS screen location
- Payment terminal location
- Receipt printer location
- Microwave anchor
- Trash can anchor

### Interaction

- Click order
- Valid / invalid click feedback
- Selected product state
- Scanned product state
- Payment state
- Bagging / completion state
- Rescan behavior for Event 5

### Event States

- Event 1 normal register
- Event 2 bento heating
- Event 3 dialogue timing
- Event 4 subtle `5 ITEMS -> 2 ITEMS`
- Event 5 POS mismatch + rescan + `CONFIRM ITEMS`
- Event 6 shift report + negative sales

### Asset Strategy

- Greybox rectangles
- Temporary labels
- Later pixel sprite responsibilities
- Which current POS assets to archive / pause / reuse

## 3. First Greybox Object Limit

Limit the first greybox to 12 objects:

1. player standing point
2. counter
3. customer standing point
4. POS
5. scanner
6. payment terminal
7. cash drawer
8. receipt printer
9. shopping bags
10. product
11. microwave
12. trash can

## 4. Not For Greybox

Do not build these yet:

- final pixel art
- detailed clutter
- full store map
- free movement
- camera turning
- complex payment logic
- inventory system
- multiple endings
- explicit horror effects

## 5. Next Decisions

Start with:

```text
logical canvas size
counter composition
first-click workflow
```

## 6. One-Screen Layout Direction

The first greybox should not feel like a clean checkout counter floor plan or a symmetrical UI layout. It should feel like one frame from the clerk's point of view.

Composition principle:

```text
asymmetric cashier-view frame
left-lower POS anchor
center-left product / scan work area
center-right customer
right-lower payment / bagging area
partial side equipment at the edge
```

The main visual/workflow diagonal:

```text
left-lower POS
-> center-left product / scan area
-> center-right customer
-> right-lower payment terminal / bags
```

### Object Placement

POS:

```text
left-lower frame
heavy visual anchor
may be slightly cropped by the screen edge
does not need to be fully visible
```

Product / scan area:

```text
near center, slightly left
center point around 5-10% left of the screen middle
must remain the clearest interaction space
```

Customer:

```text
slightly right of center
body occupies mid-right area
product placement extends toward the customer's front-left
```

Microwave:

```text
visible only partially
left middle-background or left-upper edge
show about 1/3 to 1/2 of the object
suggests adjacent store equipment without taking focus
```

Dialogue:

```text
small bubble near the customer
not a bottom visual-novel text box
can float slightly and avoid perfect alignment
```

Payment terminal / bags:

```text
right-lower counter area
separate from POS
supports final pay -> bag step
```

Avoid:

- centered POS
- perfectly symmetrical object layout
- all objects fully visible
- clean grid feeling
- bottom dialogue box as the default

Desired first-read:

```text
I am standing behind a convenience-store counter,
not looking at a diagram of a checkout counter.
```

## 7. Spatial Proportions / Visual Center

Hard composition metrics:

```text
counter height: about 33% of the screen
customer visibility: head to upper body, waist hidden by counter
product area capacity: 4 items maximum, 2-3 items comfortable
```

Counter:

```text
from bottom edge to roughly one third of the frame
avoid going above 40%, or the camera feels like it is looking down at a table
avoid going below 25%, or the work objects become cramped
```

Customer:

```text
visible from head to upper body
waist blocked by the counter
slightly right of center
head has roughly 10-15% top breathing room
not a full-body character sprite
```

Product / scan area:

```text
main visual center
center-left position
supports up to 4 items at once
comfortable default is 2-3 items
```

Visual priority:

```text
primary visual center: product / scan area
secondary visual center: left-lower POS screen
narrative attention: center-right customer / dialogue
workflow exit: right-lower payment terminal / bags
```

Approximate attention weights:

```text
product / scan area: 40%
POS: 25%
customer / dialogue: 25%
payment / bags: 10%
```

Reason:

```text
The game is not mainly about looking at the POS.
The game is about real objects entering a work process,
then being described differently by that process.
```

The POS should be important and heavy, but it should not swallow the whole frame.

## 8. Greybox Interaction State Machine

Base order state:

```text
WAIT_CUSTOMER
ITEM_PLACED
ITEM_SELECTED
ITEM_SCANNED
PAYMENT_READY
COMPLETE_ORDER
```

State meanings:

```text
WAIT_CUSTOMER: waiting for the next customer and products
ITEM_PLACED: products are on the counter and can be clicked
ITEM_SELECTED: one product has been selected and moved/snapped to the scan area
ITEM_SCANNED: selected product has been recorded by the POS
PAYMENT_READY: all required products/actions are complete, waiting for payment
COMPLETE_ORDER: payment, receipt, bagging, and customer exit sequence
```

Base player loop:

```text
customer appears
-> products appear
-> click product
-> product snaps to scan area
-> click scanner
-> POS records item
-> repeat until products complete
-> click payment terminal
-> click bag / finished area
-> customer leaves
```

The prototype should use click-based interaction with short snap movement, not free dragging.

Product click behavior:

```text
click product
-> product becomes selected
-> product moves or pops toward scan area
-> scan area highlights briefly
-> scanner becomes the next obvious target
```

Product visual states:

```text
unhandled product: has a subtle color overlay / tint
selected product: overlay removed, product looks active
scanned product: moves to scanned / finished side or receives a checked state
completed product: no longer asks for attention
```

Reason:

```text
The color overlay tells the player which items still need handling.
Removing the overlay on click creates a clear before/after state without relying on text.
```

Event-specific branches:

```text
Event 2:
HEAT_REQUIRED -> HEATING -> HEAT_DONE

Event 5:
MISMATCH_REVEALED -> RESCAN_ALLOWED -> CONFIRM_REQUIRED
```

Event 2 heating should be compressed in real time even if the UI displays a longer heating value.

Event 5 rescan should keep the same wrong POS record:

```text
rescan COLA 500ML -> SPARE KEY remains
rescan TUNA ONIGIRI -> ELEVATOR SOUND remains
```

## 9. Implementation Reset Strategy

Current code state:

```text
index.html redirects to the current greybox.
dev/archive/legacy-pos-direction/index.html is the old POS hardware assembly test.
dev/archive/legacy-pos-direction/components/screen/* contains reusable POS screen ideas.
dev/archive/legacy-pos-direction/components/game/game.js contains an older POS-only event prototype.
dev/archive/legacy-pos-direction/js/* and css/* contain older gameplay code and styling.
```

Do not continue by adding the new checkout-counter game on top of the current POS assembly page. That would keep the project trapped in the old POS-image direction.

Recommended next implementation:

```text
create a separate greybox prototype entry
```

Suggested files:

```text
greybox.html
css/greybox.css
js/greybox.js
```

Purpose:

- build the fixed 16:9 checkout-counter scene from scratch
- use simple rectangles and labels first
- test the 6-event cashier flow
- keep the old POS assembly page available as reference
- avoid deleting or rewriting current asset work too early

Reuse from existing work only when helpful:

- POS screen table logic ideas from `dev/archive/legacy-pos-direction/components/screen/screen.js`
- text rhythm ideas from `dev/archive/legacy-pos-direction/components/game/game.js`
- current documents as design source

Pause for now:

- large POS PNG layer assembly
- keyboard calibration system
- current 1536 x 1024 POS-only coordinate system
- old CSS-heavy gameplay screen

Greybox success criterion:

```text
A player can complete Events 1-6 using the fixed counter view,
understand where to click,
notice at least some anomalies,
and feel the work rhythm before any final pixel art exists.
```

## 10. Rhythm Pass 1

Implemented first greybox rhythm pass:

```text
product click -> snap / selected feedback
scanner click -> short READING state
payment click -> short PAYMENT state
receipt prints after payment
cash drawer opens and closes briefly
bag click -> short packing feedback
then next customer enters
```

Timing targets:

```text
scan feedback: about 280ms
payment feedback: about 360ms
bagging feedback: about 460ms
Event 2 heating: visually 00:20, real time about 900ms
Event 4 status correction: about 900ms
```

Reason:

```text
The greybox should not feel like instant UI state changes.
It should feel like a cashier workflow with small machine beats.
```

Verified:

- Event 1 advances to Event 2.
- Event 2 heating does not block for real 20 seconds.
- Event 4 shows `5 ITEMS`, then corrects to `2 ITEMS`.
- Event 5 survives rescan, then requires `CONFIRM ITEMS`.
- Event 6 can show the negative sales report.

## 11. Visual Blockout Correction

Problem found:

```text
The first greybox read too much like a low-quality Flash animation:
smooth vector rectangles, soft gradients, browser-like labels,
and polished UI boxes without pixel-art discipline.
```

Correction:

```text
The greybox is still ugly,
but it must use a pixel-game blockout language.
```

Rules:

- limited palette
- hard 4px / 8px edges
- no soft gradients
- no smooth animation curves
- no viewport-scaled font sizes
- stepped motion only
- blocky silhouettes before detailed sprites
- labels should feel like temporary debug markings, not web UI copy
- objects should read as pixel-art placeholders, not vector app widgets

This does not replace final pixel art. It only prevents the prototype from teaching the wrong visual language.

## 12. Sprite Pass 1

Implemented a first modular sprite test:

```text
assets/pixel-sprites/
```

Replaced the main CSS-drawn objects with independent sprite assets:

- customer
- POS shell
- scanner
- payment terminal
- bag
- receipt printer
- microwave edge
- product sprites

This is still not final pixel art. It is a pipeline test:

```text
CSS positions objects.
Sprites define object appearance.
HTML remains for POS text, receipt text, dialogue, and hit areas.
JavaScript controls state.
```

Result:

```text
The scene reads more like a game object layout and less like CSS rectangles.
The product labels and counter surface still need a better pixel-art pass.
```

See:

```text
docs/pixel-asset-brief.md
```

## 13. Debug Overlay Reduction

Implemented:

- removed always-visible `PRODUCT AREA` / `SCAN AREA` debug labels
- hid product names by default
- hid machine labels by default
- made product and machine labels appear only on hover or current active target
- hid decorative trash label
- lowered the customer so the counter occludes more of the body

Rule:

```text
World objects should explain themselves through shape and placement.
Labels are hover feedback, not permanent UI.
POS text remains visible because it is diegetic machine UI.
```

Result:

```text
The default scene is quieter and closer to a game screenshot.
Interactive text still exists when the player explores with the cursor.
```

Follow-up correction:

- hid labels with visibility, not only opacity
- removed visible cash-drawer and trash-can text from the world
- kept product/device names as hover or active feedback
- added cache-busting query strings to the local CSS/JS references
- fixed final report state so it records `data-state="report"`

Regression checked:

```text
Event 4 after payment: 5 ITEMS appears as a transient POS status.
Event 5 before confirm: SPARE KEY / ELEVATOR SOUND + ITEM MATCH: VALID.
Event 5 receipt: COLA 500ML / TUNA ONIGIRI remains normal.
Event 6 report: TODAY SALES: -¥430, REGISTER: NORMAL, SHIFT: OPEN.
```

## 14. Layout Proportion Pass

Direction:

```text
The screen should read as a first-person clerk view, not a flat checkout diagram.
The camera is close to the counter.
The customer stands behind the counter edge and is partly occluded by it.
The POS remains the left-lower visual anchor, but it should not feel crushed by the screen edge.
```

Implemented:

- increased the maximum game frame size for desktop preview
- raised the counter share from one-third to roughly 38% of the frame
- lowered and enlarged the customer so the body sits behind the counter
- moved upper wall props slightly down to reduce empty-stage feeling
- pulled the work area closer to the player
- adjusted POS, bag, and trash proportions so the lower corners feel less cramped

Current hard targets:

```text
Counter: about 38% frame height.
Customer: upper body visible, lower body heavily occluded by counter.
POS: left-lower anchor, partly cropped but still readable.
Work area: central-left, close enough to feel reachable.
Payment terminal / bag: right side support, lower visual weight than POS.
```

## 15. Scale Correction Pass

Reason:

```text
After the debug labels were removed, the underlying scale problem became clearer:
the counter read like a wall, the customer read like a small background icon,
and the POS still dominated the lower-left like a HUD element.
```

Implemented as a constrained four-part pass:

- counter reduced from roughly 38% to roughly 28% frame height
- customer enlarged and lowered so the upper body is visible behind the counter
- customer horizontal center moved to roughly 62% of the frame
- POS reduced to roughly 20% frame width and moved inward from the left edge

Measured after implementation:

```text
Counter height: about 27.5% of frame.
Customer center X: about 62.1% of frame.
Customer visible box: about 26.4% wide and 77.8% high.
POS width: about 19.8% of frame.
```

Note:

```text
The smaller POS makes screen text denser. Keep the machine size stable for now;
if readability is too low, tune screen typography before changing the world scale again.
```
