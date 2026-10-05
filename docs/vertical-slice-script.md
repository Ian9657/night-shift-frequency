# Night Shift Frequency: Vertical Slice Script Draft

Historical script draft. Current six-order dialogue lives in `js/greybox.js`.
The next gameplay and narrative structure is defined in
[八单玩法验证蓝图](gameplay-blueprint-v2.md); the first eight-order implementation
is documented in [build notes](eight-order-build.md).

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

## Event 1: Normal Register

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

## Event 2: Bento Heating

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

## Event 3: Wrongly Coherent Customer

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

## Event 4: Five Items

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

## Event 5: POS Screen Lies, Receipt Tells The Truth

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
read POS screen
optionally rescan cola / onigiri to verify the mismatch
click CONFIRM ITEMS even though the POS records are wrong
click payment terminal
receipt prints
click bag / finished area
```

POS screen display:

```text
02:43:08  SPARE KEY           1   ¥180
02:43:17  ELEVATOR SOUND      1   ¥250
TOTAL: ¥430
2 ITEMS
ITEM MATCH: VALID
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

The screen records a different reality from the physical items. The POS does not behave as if this is an error. It calmly asks the player to confirm the item records. The paper receipt remains completely normal.

Player pressure:

```text
The player knows the POS list is wrong.
The customer is waiting.
The player may rescan once or more, but the same wrong records remain.
The workflow cannot continue until CONFIRM ITEMS is clicked.
The player confirms the wrong machine reality to keep the job moving.
```

Rescan behavior:

```text
rescan COLA 500ML -> SPARE KEY remains
rescan TUNA ONIGIRI -> ELEVATOR SOUND remains
no new horror text appears
no punishment occurs
the anomaly simply withstands checking
```

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
make the player participate in the anomaly instead of only watching it
```

## Event 6: Negative Sales

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

## Slice Rhythm Check

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
- Event 5's mismatch should survive a rescan so the player can verify it instead of feeling railroaded.
- Event 6's negative sales number should be quiet, not a warning screen.

## Demo Restrictions

For this vertical slice, do not use:

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
The convenience-store workflow still runs normally,
but the reality being processed by that workflow is no longer stable.
```

Primary materials for unease:

- customers
- products
- POS records
- receipts
- payments
- sales reports
- cashier procedure
