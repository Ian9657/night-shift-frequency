# Night Shift Frequency Scope Questions

## 1. Target Feeling

The player should feel a clear emotional progression:

1. At first, the game feels ordinary and procedural, like doing a regular shift at work. A useful reference is the worklike routine of *Papers, Please*.
2. In the middle, the routine starts becoming absurd, then lightly unsettling.
3. Near the end, the feeling should gather into loneliness: goosebumps, cold sweat, a quiet sense of being alone with the system.
4. The ending should return everything to normal, like sunlight coming back into the store.

This should not be a constant horror escalation. The shape is:

```text
ordinary work -> absurd drift -> quiet unease -> loneliness -> normal daylight
```

## 2. Core Player Position

The player is a convenience-store clerk seen from a fixed or lightly movable clerk viewpoint inside a pixel or 8-bit convenience-store world.

The POS is central, but the game should not be only a POS machine interface. The world should include the checkout counter environment around the player.

The early ordinary-work feeling should come from repeated cashier and counter actions:

- scanning items
- checking names and prices
- confirming or cancelling suspicious entries
- printing receipts
- occasionally reading system prompts
- placing items in a scan area
- taking payment
- bagging items
- turning slightly toward nearby work equipment

The player should not freely walk around the store in the first scoped version. Instead, the first version should focus on a clerk-side checkout environment with clear anchors and a small amount of head/view turning.

Scope direction:

```text
cashier routine + clerk checkout viewpoint
```

Preferred combination:

```text
process customers/products
perceive the convenience store from behind the counter
keep the POS as the main work tool, not the whole scene
```

## 4. Checkout Scene Layout

The intended presentation is a pixel or 8-bit first-person convenience-store clerk view.

The checkout counter should be treated as a small working environment, not just a UI frame. The scene can be broken into these parts:

### Front: Main Work Counter

First priority. The player sees a counter in the lower part of the view, roughly 90cm high and 60-80cm deep.

Core objects:

- POS register / touch screen
- barcode scanner or scanner area
- temporary item placement area
- payment terminal
- receipt printer
- cash drawer
- plastic or paper bags

The most important design requirement is empty working space. Leave about 40 x 50cm for:

```text
product -> scan -> scanned product
```

Do not fill the whole counter with props.

### Opposite Side: Customer Area

Even if the full store is not built yet, show at least 1-1.5m beyond the counter.

Three anchor points are essential:

- NPC standing point
- product placement point
- player standing point

These anchors will support future NPC animation, handoff, payment, scanning, and dialogue.

### Left Side: Frequent Work Equipment

The player may need to turn slightly left for high-frequency convenience-store tasks.

Possible equipment:

- microwave
- hot food display
- coffee machine

For the first version, microwave + hot food display is enough.

This allows simple work routines such as:

```text
customer buys bento
-> scan item
-> customer asks for heating
-> turn left
-> open microwave
-> put item in
-> set time
-> return to checkout
```

### Behind / Right Side: Clerk-Only Area

This area adds realism without requiring complex interaction.

Possible objects:

- cigarette display shelf
- spare bags
- spare receipt rolls
- cabinet or drawer
- tape
- scissors
- marker
- cardboard box
- employee cup
- cleaning cloth
- cleaning spray

These objects should make the counter feel used, not newly exported from a 3D scene.

### Above The Counter

The upper view should not be empty.

Possible objects:

- promotional hanging signs
- cigarette ads
- CCTV monitor
- electronic clock
- employee notices

The CCTV monitor is especially valuable because it suggests a larger store without requiring the full store to be built.

Example:

```text
CAM01 shelves
CAM02 entrance
CAM03 freezer
CAM04 stock room

02:47 AM
```

### Counter Clutter Layer

Add cheap, semi-useful, semi-annoying real counter details after the main layout works:

- crooked QR payment sticker
- faded promotion sticker
- taped cable
- curled employee notice
- coin in a corner
- number note
- half-open cardboard box
- used transparent tape
- small note beside POS: "レジ袋確認！"

These details should come after the functional layout, not before.

### First Greybox Limit

The first greybox should be limited to 12 things:

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

Second pass flavor objects:

- cigarette shelf
- CCTV monitor
- hot food display
- stickers
- cables
- cup
- cleaning supplies

Working order:

```text
first make it feel like a usable checkout counter
then make it feel like a real convenience-store checkout counter
```

## 5. Camera / View

First version camera:

```text
fixed single view
```

The player does not freely look around or move. The first build should be one composed pixel/8-bit checkout scene where the player clicks or interacts with regions inside the frame.

This keeps production scope controlled and forces the main counter layout and work rhythm to become clear first.

Possible future expansion:

- slight left view for microwave / hot food display
- slight upper view for CCTV / clock / signs
- slight right/back view for clerk-only shelf

These should not be built before the fixed-view counter works.

## 6. Item Interaction Model

First version interaction:

```text
click-based flow with believable operation feedback
```

The game should not begin with free drag-and-drop. In a pixel/8-bit first-person counter scene, drag-and-drop can easily create unclear hit areas, floaty object movement, and too much hand-feel tuning before the core rhythm is proven.

Preferred first-version flow:

1. Customer places product on the counter.
2. Player clicks product.
3. Product moves or highlights into the scan area.
4. Player clicks scanner / scan key.
5. POS screen displays product information.
6. Player clicks bag / scanned area to finish handling the item.
7. Receipt / total / customer state updates.

Design goal:

```text
discrete clicks, but feedback should feel like physical cashier work
```

Possible later upgrade:

- add drag-and-drop only for selected tactile objects such as money, receipt, or documents
- keep products click-based unless the vertical slice proves drag would add enough value

## 7. Visual Production Principle

Avoid both extremes:

```text
all CSS scene -> plastic web-component feeling
single finished background image -> locked composition / POS-image trap
```

The better production model is:

```text
greybox first
modular pixel tiles / props second
interactive layers third
polish pass last
```

The scene should not begin as one beautiful finished image. It should begin as a playable layout made of simple blocks and anchors:

- counter plane
- customer standing point
- product placement point
- scan area
- bag area
- POS screen area
- payment terminal
- receipt output
- microwave / side equipment anchor
- trash can

After the layout works, replace blocks with small modular pixel assets:

- counter top tile
- POS body sprite
- scanner sprite
- payment terminal sprite
- bag sprite
- product sprites
- microwave sprite
- small clutter decals

Keep the important interactive objects as separate sprites or layers. The background can be a pixel-art plate, but gameplay objects should remain independently movable, highlightable, hideable, or replaceable.

CSS/HTML should mainly handle:

- POS screen text and UI
- transparent hit areas
- hover / selection / disabled states
- screen flicker
- small lighting overlays
- receipt text
- debug layout outlines during development

JavaScript should handle:

- game state
- event sequence
- item flow
- customer state
- anomaly timing
- endings

Recommended expert workflow:

```text
1. Make it playable while ugly.
2. Lock anchors and object responsibilities.
3. Build a tiny reusable pixel asset kit.
4. Compose the fixed scene from modules.
5. Add mood, dirt, light, and abnormality only after the work loop feels good.
```

## 8. Screen Ratio / Composition

First version screen ratio:

```text
16:9 browser game
```

Recommended internal canvas logic:

```text
640 x 360 or 960 x 540
integer-scaled where possible
```

The game should feel like a fixed pixel-art checkout scene, not a responsive web layout made of independent panels.

Basic composition:

```text
top: hanging signs / electronic clock / CCTV
middle: customer side + product placement point
bottom: counter + POS + scan area + bags
```

The 16:9 frame gives enough horizontal room for a clerk-side checkout environment while keeping the project friendly to normal browser play.

## 9. First Greybox Composition Priority

First greybox priority:

```text
A. counter work area first
```

The lower counter area should be large and clear enough for:

- product placement
- scan area
- POS feedback
- payment terminal
- bagging / finished item area

The customer side and upper environment should support the work area instead of competing with it.

Player first-read goal:

```text
I am at work behind a convenience-store counter.
```

This makes the later absurd and unsettling changes feel like a deviation from a real routine.

## 10. Minimal Work Loop

First version loop:

```text
customer appears
-> product is placed on counter
-> player clicks product
-> player clicks scanner / scan area
-> POS displays product and price
-> player clicks payment terminal or cash drawer
-> payment feedback plays
-> player clicks bag / finished item area
-> customer leaves
-> next customer
```

Payment should exist in the first version, but stay minimal.

Do not build:

- change calculation
- payment amount validation
- complex payment choices
- receipt accounting system

Do build:

- one payment click
- payment terminal beep or cash drawer sound
- optional cash drawer open / pause / close animation

The cash drawer open-close feedback is a good small physical detail because it strengthens the convenience-store work feeling without creating a large system.

## 11. Vertical Slice Event Structure

Hard constraints:

- The environment stays nighttime throughout the playable slice.
- The vertical slice should use 6 events.
- The 6 events should be written as a small script, not only as mechanics.

The ending can restore normality without turning the scene into full daylight. "Sunlight coming back" can be interpreted as emotional relief, the store returning to ordinary behavior, the night shift ending soon, or the world feeling safe again.

The event flow should communicate the game's style:

```text
mundane work procedure carries the game
small absurd changes disturb the procedure
the POS/counter routine becomes a storytelling device
loneliness comes from being the only person who notices
normality returns quietly rather than through a dramatic reveal
```

## 12. Script Format

Each vertical-slice event should be written with the same fields:

```text
event number
customer / state
product
player operation
normal POS display
abnormal change
sound / visual feedback
event ending
```

This keeps every strange moment grounded in cashier work.

## 13. Event 1 Baseline

Event 1 should be extremely ordinary.

Recommended first customer / product:

```text
late-night customer buys coffee + rice ball
```

Purpose:

- teach the basic flow
- establish the convenience-store night shift rhythm
- create a plain baseline before any absurdity appears

The event should contain no supernatural or abnormal feedback.

## 14. Event 2 Baseline With Future Hook

Event 2 should still be normal, but it should introduce a small convenience-store task that can support future expansion.

Chosen direction:

```text
bento heating request
```

Example:

```text
customer buys bento
customer asks for heating
player scans bento
player clicks microwave / heating action
POS or microwave shows short heating state
player completes payment
player hands off / bags item
```

Purpose:

- reinforce ordinary work
- show that the job is more than just scanning
- introduce microwave / side equipment as a future expansion point
- keep the fixed-view first version expandable

First implementation can simplify the microwave interaction:

- visible microwave anchor if composition allows
- otherwise a small "heat item" action region or UI prompt
- no detailed cooking timer system yet

No abnormal feedback in this event.

## 15. Event 3 First Absurd Drift

Event 3 should begin the absurd phase through customer behavior, not through obvious supernatural effects.

Chosen direction:

```text
customer speaks nonsense
```

Reason:

- nonsense speech can still feel human and plausible at night
- the player can initially explain it as tiredness, drunkenness, stress, or ordinary strangeness
- it avoids making the system feel haunted too early
- it creates a bridge from normal work to quiet unease

Possible structure:

```text
customer places ordinary item
player scans item normally
customer says something grammatically simple but semantically wrong
POS remains mostly normal
player completes payment and bagging
customer leaves as if nothing happened
```

The line should be strange but not dramatic. It should not sound like a horror slogan.

Example tone:

```text
"The freezer is louder when no one is buying ice."
"Please don't scan the second one."
"I left this here yesterday, tomorrow."
```

Refined writing principle:

```text
90% reality + 10% unexplained
```

The customer should not feel like "a weird person saying weird lines." The better tone is a normal, calm, polite customer saying something that makes the player pause for half a second.

Avoid:

- random surreal nonsense
- obvious riddle dialogue
- horror-slogan lines
- everyone speaking strangely
- jokes that feel like punchlines

Prefer:

- nonexistent rules treated as common sense
- implied backstory the player does not know
- ordinary goods understood through wrong logic
- quietly impossible facts
- small time problems
- wrong but internally coherent causality

Key rule:

```text
do not make the nonsense random;
make it follow a logic whose premise is missing
```

Event 3 dialogue should prefer broken-but-coherent phrasing over lines that explain their own structure.

Preferred adjustment:

```text
"The bottle doesn't make it five."
```

This is better than a more explanatory line such as:

```text
"One bottle has nothing to do with five people."
```

Strong example tone:

```text
Customer: "Are you new?"
Clerk: "No, I have worked here for a month."
Customer: "Oh."
pause
Customer: "Then maybe it has not been your turn yet."
```

Another useful pattern:

```text
price -> memory of old price -> memory of old self -> impossible building detail -> normal request
```

Example:

```text
"How much is this?"
"Six yen."
"Six..."
"It wasn't six before."
"I wasn't like this before either."
"I lived upstairs then."
"There is no sixth floor upstairs."
"They added it later."
"After that I came down."
"Give me a bag."
```

The player may not need dialogue choices. It can be stronger if the customer talks while the player continues scanning items, as if the clerk accidentally overhears a stranger's internal logic.

## 16. Event 4 First System Residue

Event 4 should use:

```text
A. POS quietly echoes residue from the previous customer's nonsense
```

Do not combine this with a stronger system contradiction yet.

Reason:

- Event 4 should not prove that the store is haunted.
- It should create the first "wait, why is that here?" moment.
- The anomaly should still be explainable as a bug, fatigue, coincidence, or a normal system glitch.
- Some players may miss it, which is acceptable and even desirable.

Preferred example:

Event 3 customer mentions "not five people" / "five has nothing to do with the total."

Event 4 customer is completely normal:

```text
customer buys water + sandwich
POS scans both normally
payment completes normally
customer leaves
status bar briefly flickers:

5 ITEMS

after a short pause:

2 ITEMS
```

This is stronger than having the POS print an obvious phrase like "not your turn" because it does not feel like the author speaking directly to the player.

The power of the moment is uncertainty:

```text
did the previous customer's nonsense matter,
or is the POS just broken?
```

Escalation order:

```text
A. subtle system residue
D. system denies reality
C. receipt / drawer becomes active
B. CCTV contradicts visible reality
```

CCTV contradiction should be saved for later because it clearly announces a supernatural layer.

## 17. Event 5 Machine-Dimension Uncanny

Design principle:

```text
the machines behave as if they are operating on a slightly different layer of reality;
the job still requires the player to continue
```

Event 5 should not be about the system claiming the customer is absent.

Rejected direction:

```text
CUSTOMER NOT PRESENT
```

Reason:

- it pushes the anomaly too directly onto the customer's existence
- it risks making the scene read as a ghost-customer moment
- the intended unease should come from the checkout machines themselves

Preferred direction:

```text
machine-dimension uncanny
```

Possible machine-centered anomalies:

```text
ALREADY SOLD
receipt prints before payment
cash drawer opens to the wrong rhythm
scanner reads an item before the player scans it
payment terminal approves a payment amount that differs from the POS total
microwave timer starts from a time that was never set
POS briefly shows a register number / lane / machine state that should not exist
POS item record differs completely from the real item
POS display talks nonsense while the printed receipt remains normal
```

Do not stack too many errors. Too many machine faults make the player read the moment as "the POS is broken" instead of "the machines are touching another layer."

Possible structure:

```text
normal customer arrives
customer places cola + tuna onigiri
cola scans normally
before the player scans the onigiri, the scanner beeps once by itself
POS adds TUNA ONIGIRI with a timestamp a few seconds ahead
customer behaves normally and does not react
player continues payment
receipt printer starts before the payment click, then stops
player clicks payment terminal
terminal approves normally
cash drawer opens half a beat too late, then closes
customer leaves normally
```

Important:

- no jump scare
- no sudden light flicker
- no dramatic sound drop
- no monster reveal
- no visible customer transformation

The uncomfortable contradiction should be machine-centered:

```text
the machines complete parts of the work before the player does
```

Chosen structure:

```text
normal customer arrives
customer places ordinary real items on the counter
player scans each item
POS item list records completely different objects or phrases
POS calmly treats those wrong records as valid
player must confirm the wrong item records to continue the checkout
payment total may remain plausible enough to continue
player finishes payment
receipt prints the correct real-world items and normal total
customer leaves normally
```

This creates a split inside the machine layer:

```text
POS screen = unstable / speaking nonsense
receipt paper = normal / records reality
```

The player sees that not every machine is equally wrong. The printed receipt can act like a physical witness that the real checkout still happened normally.

The key interaction is that the player must participate in the anomaly:

```text
the counter shows real items
the POS lists impossible items
the workflow asks for confirmation
the player may rescan, but the impossible records remain unchanged
the player confirms the wrong machine reality to keep the job moving
```

The rescan is important because the anomaly should survive player verification. The player should feel:

```text
I checked again.
The machine still says this.
Now I have to decide whether to continue the work.
```

Do not punish rescanning or add extra horror text during rescans. Let the same wrong record remain calmly valid.

Example:

```text
real item: COLA 500ML
POS screen: SPARE KEY

real item: TUNA ONIGIRI
POS screen: ELEVATOR SOUND

POS status: ITEM MATCH: VALID

printed receipt:
COLA 500ML
TUNA ONIGIRI
TOTAL: normal
```

## 18. Event 6 Quiet Return With Residual Trace

Chosen direction:

```text
B. surface normality returns, but one tiny business-system trace remains
```

Event 6 should not continue escalating into louder horror. The checkout work returns to normal, the night remains visually nighttime, and the player can feel that the strange layer has closed or gone quiet.

Core residual trace:

```text
when checking today's sales, the total is negative
```

Possible structure:

```text
final customer arrives
ordinary item
scan is normal
payment is normal
receipt is normal
customer leaves normally
player checks end-of-shift / today's sales
POS shows a negative sales total
everything else remains calm
```

This keeps the ending inside the commercial/work system:

```text
the store looks normal,
the job flow is normal,
but the account of the night is impossible
```

The negative sales number should be presented quietly, as a report value, not as a dramatic warning.

Example:

```text
TODAY SALES: -¥430
```

Avoid for this slice unless deliberately chosen later:

```text
empty counter -> product appears by itself -> payment succeeds
```

That crosses into confirmed supernatural behavior and may shift the player's question from "what is happening?" to "when will the next ghost appear?"

## 3. First Version Size

Target final first version:

```text
6 to 8 minute short game
```

This version should have a readable beginning, middle, late-night unease, and daylight return.

Near-term production target:

```text
3 minute vertical slice
```

The vertical slice should prove the core feeling before expanding the game:

- ordinary cashier rhythm
- first absurd/system anomaly
- one quiet unsettling moment
- a small return to normal or pause point

This keeps the final ambition meaningful while preventing the current build from becoming too large too early.

## 19. Vertical Slice Script Draft

Working title:

```text
Night Shift Frequency: Counter Slice
```

Format:

```text
fixed 16:9 pixel-art checkout counter
nighttime throughout
6 short checkout events
click-based cashier flow
```

### Event 1: Normal Register

Customer / state:

A quiet late-night customer enters. They are ordinary, tired, and not memorable. They place two items on the counter without special dialogue.

Product:

```text
BOSS BLACK COFFEE
TUNA ONIGIRI
```

Player operation:

```text
click coffee -> click scanner -> POS records coffee
click onigiri -> click scanner -> POS records onigiri
click payment terminal
click bag / finished area
```

Normal POS display:

```text
02:12:08  BOSS BLACK COFFEE   1   ¥148
02:12:15  TUNA ONIGIRI        1   ¥132
TOTAL: ¥280
PAYMENT: WAITING
```

Dialogue:

```text
Customer: "Card, please."
Customer: "Thank you."
```

Sound / visual feedback:

```text
soft door chime
scanner beep x2
payment beep
bag rustle
door chime as customer leaves
```

Event ending:

The customer leaves normally. The player has learned the basic loop.

Purpose:

```text
teach the work rhythm
make the counter feel functional
establish a plain baseline
```

### Event 2: Bento Heating

Customer / state:

A second normal customer comes in with a bento. They ask for heating in a routine, polite way.

Product:

```text
KARAAGE BENTO
GREEN TEA
```

Player operation:

```text
click bento -> click scanner -> POS records bento
click heat / microwave anchor
short heating state completes
click tea -> click scanner -> POS records tea
click payment terminal
click bag / finished area
```

Normal POS display:

```text
02:18:42  KARAAGE BENTO       1   ¥498
HEAT: 00:20
02:19:10  GREEN TEA           1   ¥128
TOTAL: ¥626
PAYMENT: WAITING
```

Dialogue:

```text
Customer: "Could you heat this, please?"
Customer: "That's enough, thank you."
```

Sound / visual feedback:

```text
scanner beep
microwave hum or short progress indicator
payment beep
bag rustle
```

Event ending:

The customer leaves normally. The player sees that the job is more than scanning.

Purpose:

```text
reinforce normal work
introduce side equipment without expanding the camera
prepare future convenience-store tasks
```

### Event 3: Wrongly Coherent Customer

Customer / state:

A customer who looks completely normal places one item on the counter. Their voice is calm. Their words are not random, but the premise of their logic is missing.

Product:

```text
MINERAL WATER 500ML
```

Player operation:

```text
click water -> click scanner -> POS records water normally
click payment terminal
click bag / finished area
```

Normal POS display:

```text
02:27:03  MINERAL WATER 500ML 1   ¥120
TOTAL: ¥120
PAYMENT: WAITING
```

Dialogue draft:

```text
Customer: "Just this."
Customer: "No bag."
pause
Customer: "It's not five people."
Customer: "I never said five people."
Customer: "The bottle doesn't make it five."
payment beep
Customer: "You see, you started counting too."
Customer: "Good night."
```

Abnormal change:

None in the system. The strangeness is only in the customer's calm, wrongly coherent speech.

Sound / visual feedback:

```text
normal scanner beep
normal payment beep
normal door chime
no lighting change
```

Event ending:

The customer leaves as if the exchange was normal.

Purpose:

```text
start absurd drift through human behavior
keep the world physically normal
plant the number five without explaining it
```

### Event 4: Five Items

Customer / state:

A fully normal customer arrives. This event should feel like a return to ordinary work after a strange person.

Product:

```text
SANDWICH
ORANGE JUICE
```

Player operation:

```text
click sandwich -> click scanner -> POS records sandwich
click juice -> click scanner -> POS records juice
click payment terminal
click bag / finished area
```

Normal POS display:

```text
02:34:21  EGG SANDWICH        1   ¥298
02:34:29  ORANGE JUICE        1   ¥158
TOTAL: ¥456
PAYMENT: WAITING
```

Dialogue:

```text
Customer: "Card is fine."
Customer: "Thanks."
```

Abnormal change:

After payment, the POS status line quietly flickers:

```text
5 ITEMS
```

After a short pause, it corrects itself:

```text
2 ITEMS
```

Sound / visual feedback:

```text
normal scanner beep x2
normal payment beep
status text flicker only
no dramatic sound
no character reaction
```

Event ending:

The customer leaves normally. The player may notice the connection to Event 3, or may only think the POS glitched.

Purpose:

```text
move the absurd residue from a person into the POS
keep the anomaly subtle
preserve uncertainty: bug, fatigue, coincidence, or something else
```

### Event 5: POS Screen Lies, Receipt Tells The Truth

Customer / state:

A normal customer places two ordinary items on the counter. The customer does not behave strangely and does not react to the POS display.

Product:

Real counter items:

```text
COLA 500ML
TUNA ONIGIRI
```

Player operation:

```text
click cola -> click scanner
click onigiri -> click scanner
read POS screen if noticed
click payment terminal
receipt prints
click bag / finished area
```

POS screen display:

```text
02:43:08  SPARE KEY           1   ¥180
02:43:17  ELEVATOR SOUND      1   ¥250
TOTAL: ¥430
STATUS: PRICE IS NOT WHERE THE ITEM IS.
```

Printed receipt:

```text
COLA 500ML                    ¥180
TUNA ONIGIRI                  ¥250
TOTAL                         ¥430
```

Dialogue:

```text
Customer: "Can I pay by card?"
payment beep
Customer: "Thank you."
```

Abnormal change:

The screen records a different reality from the physical items. The POS status line speaks in wrong but coherent logic. The paper receipt remains completely normal.

Sound / visual feedback:

```text
scanner beep x2
brief low screen refresh noise, if any
receipt printer sounds normal
payment beep normal
no jump scare
no visible customer change
```

Event ending:

The customer leaves. The player has a normal receipt that contradicts the POS screen they just saw.

Purpose:

```text
make the machine layer unstable
split the machine into screen as unreliable and paper as witness
avoid turning the customer into the source of horror
```

### Event 6: Negative Sales

Customer / state:

The final customer is ordinary. This should feel like the night has gone quiet again.

Product:

```text
MILK BREAD
```

Player operation:

```text
click bread -> click scanner -> POS records bread normally
click payment terminal
receipt prints normally
click bag / finished area
customer leaves
click today's sales / shift report
```

Normal POS display:

```text
02:58:56  MILK BREAD          1   ¥168
TOTAL: ¥168
PAYMENT: WAITING
```

Printed receipt:

```text
MILK BREAD                    ¥168
TOTAL                         ¥168
```

Dialogue:

```text
Customer: "Long night?"
Customer: "Almost morning."
Customer: "Thanks."
```

Abnormal change:

When the player checks today's sales, the report is impossible but presented calmly:

```text
TODAY SALES: -¥430
REGISTER: NORMAL
SHIFT: OPEN
```

Sound / visual feedback:

```text
normal scanner beep
normal payment beep
normal receipt printer
quiet report screen
store ambience remains nighttime
```

Event ending:

No explanation is given. The machines are calm again, but the business record of the night is impossible.

Purpose:

```text
restore surface normality
leave one cold accounting trace
end on loneliness rather than spectacle
```

### Slice Rhythm Check

Emotional movement:

```text
Event 1: work
Event 2: work with small task
Event 3: person is wrong
Event 4: POS remembers the wrongness
Event 5: POS screen describes another layer; receipt keeps reality
Event 6: normal work returns; the sales report is impossible
```

Production movement:

```text
Events 1-2 prove the cashier loop.
Event 3 adds dialogue timing.
Event 4 adds subtle status flicker.
Event 5 adds alternate POS item text and normal receipt text.
Event 6 adds shift report screen.
```

Risk notes:

- Event 3 dialogue must stay calm and grounded, or it becomes comedy.
- Event 4 must be easy to miss, or it becomes too explanatory.
- Event 5 should not stack extra machine failures beyond the screen/receipt split.
- Event 6's negative sales number should be quiet, not a warning screen.

## 20. Demo Restrictions

For the vertical slice, do not use:

- explicit ghosts
- monsters
- jump scares
- blood
- sudden power outage
- direct threat text
- dramatic horror stingers
- visible customer transformation

The slice should prove this identity:

```text
the convenience-store workflow still runs normally,
but the reality being processed by that workflow is no longer stable
```

Primary materials for unease:

- customers
- products
- POS records
- receipts
- payments
- sales reports
- cashier procedure
