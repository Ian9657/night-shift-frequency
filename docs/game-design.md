# Game design

How the current game plays and the rules behind it. The world and the planned
direction are in [worldview.md](worldview.md); this document describes what is built.

## What the game has to prove

Ordinary orders train the player into a competent clerk. Anomalous orders make the
player decide how to handle contradictory evidence, and the order 5 decision must
change how the player weighs evidence in order 8. Success is not more content; it is a
player who can say what they judged, on what basis, and what happened afterwards.

## Principles

- What is random is the combination of valid orders; the operating rules never change.
- Checking only gathers evidence; committing decides the record. A re-scan never means
  an automatic correction.
- Every choice completes the sale. There is no wrong answer that forces a retry.
- The world may lie; the record of what the player did must be exact.
- Player history must matter to a later decision, not only to the ending.
- After a major conflict, at least one ordinary sale follows (two follow order 5).
- Customers acknowledge what the player did; they never rule on which reality is right.
- Meaning may be uncertain; what a button does, the transaction rules and state
  feedback must be clear.

## The core loop

```text
scan every item → take payment → heat if asked (after payment) → bag or hand over
```

- The customer sets a basket down on the far side of the counter and waits. Click the
  basket to take the next item out (it is selected), then click the scanner. Scanned
  items stay on the counter and can be selected again for a re-scan. Identical items
  scan one by one and group as quantities on the POS and receipt.
- Payment matches what the customer says: their card stands in the terminal's slot, or
  their note lies on the change tray and goes into the drawer under the register. The
  wrong device gets a reaction, not a penalty. At other times the drawer just opens and
  shuts when clicked. The customer keeps their own pose throughout; goods and the bag
  are handed over across the far edge of the counter.
- Heating happens after payment; the lasagne must be heated before bagging.
- No-bag orders are handed over directly.
- Early or wrong actions get a short reaction ("These first.", "Not yet.", "Hot first.").

Guidance: from order 3, next-action outlines appear after a 780 ms delay. During a
record conflict all outlines disappear; the POS screen itself blinks for attention and,
once the item has been re-scanned, the record key on the register's keypad flashes.
A few lines lock input until read (the first order's opening, the first re-scan
reaction in a record order).

## The night: 01:00–05:00, eight orders

**START SHIFT** opens the night staff sign-in sheet. The clerk types a name on
tonight's line (keyboard or the letter keys beside the sheet; empty signs as ROBIN)
and signs in at 01:00. The earlier nights on the sheet carry the same signature and
were never signed out.

| Order | Time | Content | Role |
| --- | --- | --- | --- |
| 1 | 01:14 | Coffee and sandwich, card, bagged, quiet customer | Learn scan, pay, bag |
| 2 | 01:42 | Cash, no bag; sometimes two of one drink | Cash and direct hand-over |
| 3 | 02:09 | Lasagne and tea, heating requested after payment | Service order |
| 4 | 02:27 | Coffee and bread, cash; fully normal | The system is usually right |
| 5 | 02:41 | **Record order A**: one cola, cash | First accountable record |
| 6 | 03:23 | One random item | Recover the rhythm |
| 7 | 03:58 | Two of one drink | Memory gap |
| 8 | 04:31 | **Record order B**: one cola, cash; links to #005 | History becomes evidence |
| — | 04:44 | Print the shift report; the radio reads the ending | One of four endings |
| — | 05:00 | Night Ferry signs off; the clerk signs out on the sheet | The same act on every path |

The view outside follows the clock: the night deepens toward 03:30, greys from 04:30
and is a cold dawn by five, when the street lamp and the town's windows go out. While
the closing letter is read the clock runs from 04:44 to 05:00. After the sign-off 87.6
is static; the sheet comes back, the earlier lines now read as the clerk's name, and
SIGN OUT writes 05:00 on tonight's line.

Outside, cars pass on the wet street now and then, fewer in the small hours. The rain
eases from half past three. After three the ferry, suspended according to June, crosses
the bay anyway. While the echo speaks on 87.7, the tower's light blinks with the voice.

Ordinary orders (2, 3, 4, 6, 7) are generated from the shift seed under hard
constraints: one catalogue for products, prices and heatability; payment types that
always have a completable path; no repeated small talk within a shift; the first order
adds no service variation. Card and cash alternate between ordinary orders. Soft
constraints avoid repeating the last three orders' main products and back-to-back no-bag orders. The same seed and
the same decisions reproduce the same shift.

## Drift

The later it gets, the less the store's readings can be trusted (`js/game/drift.js`).
Drift changes only what things show, never a record, and comes from the shift seed:

- Two of orders 4, 6 and 7 lose ten minutes on the wall clock once their first item is
  scanned (a run of ticks); the microwave and the POS keep the right time.
- In order 6 or 7 the POS item count reads 5 for a moment on the first scan.
- Order 6's customer leaves with Nell's last words from order 5.
- The tubes flicker more often as the night goes on; after three a flicker can show the
  echo's cold colours instead of a dip.
- At sign-out every earlier line on the sheet reads as the clerk's name.

## Order 5: notice, check, decide

- The item is a cola (COLA 500ML); the register reads SPARE KEY. Same price; only
  identity is in dispute.
- The POS shows the mismatch. The record view (press the record key on the register's keypad) shows the evidence
  but **no choices until the item has physically been re-scanned** at the counter.
- After a re-scan, two equally weighted choices appear, with a preview of what will be
  saved; the choice can change until **SAVE RECORD**:
  - `KEEP REGISTER ENTRY`: saved as SPARE KEY, origin REGISTER, verified by current scan.
  - `CORRECT TO ITEM`: saved as COLA 500ML, origin MANUAL, verified by current scan.
- The commit happens once; both paths then pay, bag and leave normally. The customer
  reacts to what was done ("It says... key?" / "You can change those?").

## Order 8: let history take part

- The same cola, read as SPARE KEY again. The POS and record view show sale #005's saved
  entry, its origin and how it was verified, in the ordinary record format.
- After a re-scan, the choices are:
  - `USE ENTRY FROM #005`: reuse the old record as this sale's basis and save the link
    (origin copied from #005, verified by LINKED HISTORY).
  - `USE THIS SCAN`: save an independent record of this scan (SPARE KEY, origin
    REGISTER, verified by CURRENT SCAN). Order 5 is never overwritten.

| Order 5 | What order 8 shows | The question |
| --- | --- | --- |
| Kept | SPARE KEY, origin REGISTER | Should an uncorrected old entry stand as this sale's basis? |
| Corrected | COLA 500ML, origin MANUAL | Is a matching name just your own earlier correction, not independent evidence? |

The four combinations lead to four letters read by *Night Ferry* after the shift (see
[worldview.md](worldview.md)). None is a punishment.

## The radio

- Clicking the radio opens its dial over it: a scale from 87.5 to 88.1 in steps of 0.05.
  Drag or click the needle, use the step keys, or the arrow keys; × or Escape puts it
  away. The counter stays live while it is open.
- 87.6 *Night Ferry*: an intro and one segment per order; missed lines replay when the
  player tunes back. After the sign-off it is static.
- 87.7, the echo: static early; from order 5 it reads register records, and after order
  5 is decided it reads the record the player did **not** save.
- Between them, unmarked, three people who stayed, each from a point in the night:
  a taxi dispatch calling Walt's car (87.85, from order 2), a ward calling Ana
  (87.95, from order 4) and a crossing report for the suspended ferry (88.05, from
  order 6). Their lines repeat in turn. Everything else is static.

## The phone

- Clicking the clerk's flip phone on the counter flips it open close up and pauses the
  shift (the game clock stops; the radio drops back). A click outside puts it away;
  BACK, the red key or Escape go back a screen, and from the menu put it away.
- The menu: MESSAGES, TEXT NIGHT FERRY, SETTINGS. Click a row to select it and again to
  open it, or use the arrow keys and Enter.
- Texts arrive with orders 4 and 6 from no number ("your light's the only one on the
  front", "the ferry's running. don't tell june.") and with order 8 from the clerk's own
  number, shown as their name: "Door's unlocked. Come home when the radio stops." The
  phone on the counter buzzes and its light blinks until they are read.
- Once a night the clerk can text Night Ferry one of three messages (a request, anyone
  up?, the rain). June reads it with the clerk's name before the next segment (before
  the closing letter if no order is left), and the order after that someone who heard
  it writes back.
- SETTINGS: VOLUME, RADIO and SOUNDS levels (0–5) and SILENT MODE. The browser
  remembers them.

## Record contract

```js
{
  orderId: 'sale-005', itemId: 'cola',
  physicalLabel: 'item.cola', initialRegisterLabel: 'item.spareKey',
  checks: [{ type: 'rescan', result: 'item.spareKey' }],
  decision: 'correct', finalRecordedLabel: 'item.cola',
  recordOrigin: 'MANUAL', verificationMode: 'CURRENT_SCAN', linkedOrderId: null,
}
```

- Orders are immutable input; raw readings are never overwritten by saved labels.
- Re-scan and commit eligibility derive from history, never from UI flags.
- `recordOrigin` is where the label came from; `verificationMode` is what it was checked
  against. Reusing an old manual record is MANUAL + LINKED_HISTORY and does not count
  as a new manual correction.
- The report derives from real transactions: sales, transactions, manual edits, linked
  entries, current scans. Amounts never change with labels.
- Repeated clicks, animation callbacks or redraws never commit or settle twice.

## Validation plan (not yet run)

First playtests: 5–8 people, directional rather than statistical. Watch for:

- Understanding: can they say what keep and correct each save?
- Recognition: do they notice order 8 refers to their earlier choice before being told?
- Reasons: do they explain decisions with the item, the scan, the origin or past
  reliability?
- Flow: do they complete both decisions without help?

A majority choosing the same path is not failure; long hesitation is not success.
Interview full-run players afterwards so questions at order 5 don't reveal the callback.
If the only reaction is "just another glitch", strengthen the link between orders 5 and
8 before adding content. Risk to watch: `USE THIS SCAN` may become the always-safe default.

## Where this goes next

[worldview.md](worldview.md) describes the target: a 01:00–05:00 night ending when the
radio signs off, free tuning, texting from the phone (song requests to *Night Ferry*), a named clerk and drift that
grows through the night. The record rules in this document stay as they are.
