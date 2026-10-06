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

- Select an item, then click the scanner. Identical items scan one by one and group as
  quantities on the POS and receipt.
- Payment matches what the customer says: card or phone on the terminal, cash on the
  coin tray. The wrong device gets a reaction, not a penalty.
- Heating happens after payment; the bento must be heated before bagging.
- No-bag orders are handed over directly.
- Early or wrong actions get a short reaction ("These first.", "Not yet.", "Hot first.").

Guidance: from order 3, next-action outlines appear after a 780 ms delay. During a
record conflict all outlines disappear; the POS screen itself blinks for attention.
A few lines lock input until read (the first order's opening, the first re-scan
reaction in a record order).

## The shift: eight orders, 02:12–03:04

| Order | Time | Content | Role |
| --- | --- | --- | --- |
| 1 | 02:12 | Coffee and onigiri, card, bagged, quiet customer | Learn scan, pay, bag |
| 2 | 02:18 | Cash, no bag; sometimes two of one drink | Cash and direct hand-over |
| 3 | 02:24 | Bento and tea, heating requested after payment | Service order |
| 4 | 02:30 | Coffee and bread, phone payment; fully normal | The system is usually right |
| 5 | 02:41 | **Record order A**: one cola, cash | First accountable record |
| 6 | 02:46 | One random item | Recover the rhythm |
| 7 | 02:52 | Two of one drink | Memory gap |
| 8 | 02:58 | **Record order B**: one cola, cash; links to #005 | History becomes evidence |
| — | 03:04 | Print the shift report; the radio reads the ending | One of four endings |

Ordinary orders (2, 3, 4, 6, 7) are generated from the shift seed under hard
constraints: one catalogue for products, prices and heatability; payment types that
always have a completable path; no repeated small talk within a shift; the first order
adds no service variation. Soft constraints avoid repeating the previous payment type,
the last three orders' main products and back-to-back no-bag orders. The same seed and
the same decisions reproduce the same shift.

## Order 5: notice, check, decide

- The item is a cola (COLA 500ML); the register reads SPARE KEY. Same price; only
  identity is in dispute.
- The POS shows the mismatch. The record view (click the POS screen) shows the evidence
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

- 87.6 *Night Ferry*: an intro and one segment per order; missed lines replay when the
  player tunes back.
- 87.7, the echo: static early; from order 5 it reads register records, and after order
  5 is decided it reads the record the player did **not** save.
- Clicking the radio switches stations.

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
radio signs off, free tuning, a flip phone for texting, a named clerk and drift that
grows through the night. The record rules in this document stay as they are.
