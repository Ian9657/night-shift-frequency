# Night Shift Frequency: eight-order gameplay blueprint

Version 2.0 · 2026-09-20

Status: mechanics baseline. The eight-order mechanics are implemented; human playtesting
has not been done. The 2026-10-05 pixel-world rebuild keeps this document's record rules
(the order 5 and 8 choices, and the separation of origin from verification), but the
narrative layer now follows [the worldview](worldview.md): the spare key has a full
story, a radio echo and four endings, so section 6's "no key backstory" limit no longer
applies. Button labels below are the original candidates; the shipped labels are in
`js/content/strings.js`. Implementation and verification: [build notes](build-notes.md).

## 1. What this has to prove

Ordinary orders train the player into a competent clerk; anomalous orders make the
player decide how to handle contradictory evidence. The order 5 decision must change how
the player weighs evidence in order 8.

The earlier demo was strong on scene, operation feedback and staged anomalies; its main
weakness was decision space. Success is not more orders. It is a player who can explain
what they judged, on what basis, and what happened afterwards.

Scope of this round: order generation, checking and committing, cross-order history,
consequence callbacks, conditional dialogue and playtest validation. Reuse existing
products and devices. Only UI changes needed to express choices and records are allowed;
no upgrades to scene, art, music or other systems.

Fifteen orders is a later goal. Until the eight-order core is validated: no business
scoring, inventory management, time pressure, complex change-making, multiple endings,
freely generated dialogue or dispute holding areas.

## 2. Core principles

- What is random is the combination of valid orders; the basic operating rules stay fixed.
- Checking only gathers evidence; committing decides the record. A re-scan never means
  an automatic manual correction.
- Both keeping the register entry and correcting it complete the sale; there is no
  wrong choice that forces a retry.
- The world may lie; the game's record of player behaviour must be exact.
- Player history must affect the next working judgement, not just be an ending easter egg.
- At least one ordinary sale follows any major conflict; here, two follow order 5.
- Customers acknowledge what the player did, never ruling on which reality is correct.
- Meaning may be uncertain; button purpose, transaction rules and state feedback must be clear.

## 3. Eight-order structure

| Order | Type | Content and constraints | Design role |
| --- | --- | --- | --- |
| 1 | Fixed or lightly random | 1–2 items, card, normal bagging, no heating | Teach scan, pay, hand-off |
| 2 | Constrained random | Guaranteed cash; items and bag need vary | Teach payment and hand-off differences |
| 3 | Constrained random | One heatable item, heating requested after payment | Teach service order |
| 4 | Constrained random | Fully normal; may include a clearly reasonable internal short name | Reinforce that the system is usually reliable |
| 5 | Authored conflict A | Cola vs register name; after checking, an explicit either/or | First accountable record |
| 6 | Constrained random | Short ordinary order, no explanation of the last | Restore rhythm |
| 7 | Constrained random | Ordinary sale, no new notable anomaly | Memory gap |
| 8 | Authored callback A | References the actual order 5 record; resolve this sale's link | History becomes evidence |

The shift report follows order 8 and is not an order. The old six-order "five" dialogue,
count flicker and negative sales are not carried over automatically; reuse depends on
whether they support this experiment. No old executable copy is kept.

## 4. Ordinary order generation

Generate an order recipe first, then matching products and hand-written dialogue, e.g.:

```text
itemCount: 2
payment: cash
bag: yes
service: heat_one
customerContext: after_work
dialogueDensity: low
```

Order: shift slot constraints → valid recipe → product set → customer context →
conditional dialogue. Orders 5 and 8 are fixed and never drawn from the random pool.

Hard constraints:

- Products, prices and heatability come from one catalogue; ordinary register entries
  must match it.
- heat_one names exactly one heatable item in the order; payment comes before heating.
- Every payment / no-bag combination has a completable interaction path.
- Each small-talk line appears at most once per shift; necessary operating prompts may
  be reviewed or repeated.
- The first order adds no service variation; the first three introduce rules gradually.
- No missing dependencies between story orders, callbacks and random orders.

Soft constraints: down-weight repeated payment types, the main products of the last
three orders, adjacent heating orders and frequent no-bag orders. Small pools may
repeat; never generate an invalid order to avoid repetition.

Randomness uses a shift seed, kept separate from sound and decoration randomness. The
same seed and the same player decisions reproduce the same orders and consequences.
Use bounded candidate filtering and weighted picks; with no candidates, fall back to a
verified simple recipe and log why, rather than re-rolling forever.

Ordinary orders must change the actual operating rhythm (quantity, payment, heating,
hand-off); swapping product names alone is not variation. Hurrying is only a social
reaction for now; no hidden patience penalty.

## 5. Order 5: notice, check, understand, decide

Initially visible facts: the item is COLA 500ML, first registered as SPARE KEY, same
price. Only the item's identity is in dispute this round, to avoid also raising amount
and change problems.

The player can re-scan, compare item and register, and read limited customer
reactions. The first re-scan confirms the name did not recover; later re-scans change
nothing and do not produce endless new lines. Waiting is not the only way to unlock
required evidence.

Both commit actions become available together after the check, as clear, equally
weighted controls on the POS:

- `KEEP REGISTER RECORD`: this sale's final entry stays SPARE KEY.
- `CORRECT TO ITEM`: this sale's final entry becomes COLA 500ML, saved with a manual
  correction origin.

Show what will be saved before committing; the choice can change until committed. The
commit writes once; both paths then pay, bag and leave normally. The scanner only
checks; click counts never secretly decide the branch.

Both rationales must hold up in the world. Keeping relies on the system's past
reliability, a matching amount and possible internal naming; correcting relies on the
packaging and repeated checks. Order 4 can establish background with a reasonable short
name like COFFEE vs BOSS BLACK COFFEE, but that must not justify SPARE KEY, and no
invented penalties (docked pay) should force hesitation.

Candidate customer reactions only acknowledge the action: after keeping, "That what it
says?"; after correcting, "You can change those?". Final wording waits for playtests.

## 6. Order 8: let history take part in a new judgement

Order 8 reuses the cola. The POS shows order 5's transaction number, the name saved
then and its origin, in the same record format as ordinary sales, so no sudden story
popup. The link must be clearly inspectable; hiding the source is not difficulty.

| Order 5 decision | History seen in order 8 | The question now |
| --- | --- | --- |
| Kept register | SPARE KEY, origin REGISTER, citing order 5 | Should an uncorrected old entry stand as this sale's basis? |
| Manual correction | COLA 500ML, origin MANUAL, citing order 5 | Is a matching name just reusing your own earlier correction rather than independent verification? |

Order 8 asks whether this sale's record reuses the old transaction, which differs from
order 5's identity correction:

- `USE LINKED ENTRY`: accept the shown old record as this sale's basis and save the link.
- `VERIFY THIS SALE`: re-check this sale's item and scan, then save an independent record
  for this sale; order 5 is not overwritten.

The current item can still be checked before deciding. Button text is a candidate and
must fit the POS; operations must never be hidden in unknown hotspots for immersion.

The independent scan still reads SPARE KEY. The correction branch then faces "my past
edit" versus "the machine now"; the keep branch faces "the old record agrees with the
machine, but is that independent evidence?". The customer may say "Same one as
before.", but gives no ruling on the facts.

Both paths check out normally. The receipt shows the final entry and origin; the report
counts manual corrections and links exactly. Validate a believable consequence chain
first, then consider one deliberately designed report anomaly. Never distort all
evidence at once.

Risk to validate: VERIFY THIS SALE may become the always-safer default. Observe the
reasons first; do not add timers or penalties to balance pick rates. If there is no
real judgement, change the evidence structure and retest.

## 7. State and record contract

`orderState` holds the current selection, scanned items, payment, heating, bagging and
the pending decision. `shiftState` holds the seed, order schedule, used dialogue,
transactions and decision history. Rendering derives separately from facts and explicit
anomaly rules.

```js
const decisionRecord = {
  orderId: 'sale-005',
  itemId: 'cola',
  physicalLabel: 'COLA 500ML',
  initialRegisterLabel: 'SPARE KEY',
  checks: [{ type: 'rescan', result: 'SPARE KEY' }],
  decision: 'correct',
  finalRecordedLabel: 'COLA 500ML',
  recordOrigin: 'MANUAL',
  verificationMode: 'CURRENT_SCAN',
  linkedOrderId: null,
};
```

Item identity uses stable IDs; labels are for display. History is append-only; a later
correction is a new event referencing the original. Repeated clicks, animation
callbacks or renders must never commit twice. Moving to the next order resets only
orderState.

Orders are immutable input; raw readings are never overwritten by the final saved
label. Re-scan and commit eligibility derive from history, not from separate UI
counters or flags. recordOrigin is where the label came from; verificationMode is what
it was checked against. Reusing an old manual record is MANUAL + LINKED_HISTORY and does
not count as a new manual correction.

The report derives from real transactions. If an extra correction is ever shown, it
uses a separate presentation-anomaly rule that records its trigger; real counts are
never altered. Amounts and record origin are kept separately; a name change never
changes sales.

This round needs only in-shift memory, no save across reloads. Playtest logs record
seed, orders, checks, decisions and callbacks, stored locally, with no external telemetry.

## 8. Dialogue and fluent operation

Dialogue uses hand-written conditional fragments, each tagged with context, trigger, use
count, required information and read protection. Key evidence can be reviewed again.
Ordinary small talk and feedback can be read while working; the protection lock is only
for moments that truly need the player to stop.

Measure waiting in ordinary orders first, then open limited input buffering (e.g.
remembering the next item selection as a scan finishes). Buffering never crosses
orders, never queues branch commits and never skips required checks; legality is
re-checked on execution. Avoid a global speed-up or two customers sharing one order state.

During anomalies, reduce next-step outlines, but both valid choices must be equally
discoverable. No "recommended answer" highlight.

## 9. Implementation order and exit criteria

1. Maintain the current build and run notes; tidy order reset boundaries with regression tests.
2. Build shift history and separate display derivation; first verify a sale commits once
   and history survives order changes.
3. Implement both order 5 paths and both order 8 follow-ups in fixed orders; run all combinations.
4. Add recipe generation, seeds and constraint fallbacks for the six ordinary slots,
   leaving the two key slots unchanged.
5. Adjust necessary POS operations, record viewing and conditional dialogue, then test
   the full eight-order rhythm.
6. After unguided playtests, decide whether to expand to fifteen orders or keep revising
   the core choice.

Engineering cleanup follows the real needs of state, generator and record derivation; a
full refactor or art upgrade is not a prerequisite for validation.

## 10. Validation plan

Functional validation covers keep/correct (order 5) × link/independent (order 8): all
four pay, hand off and close; original history is unchanged; current origin, receipt
and report agree. Test repeated clicks, repeated re-scans, input during animation and
stale callbacks after changing orders.

Generation validation covers a fixed batch of seeds: exactly eight orders, key slots
fixed, products compatible with services, correct ordinary prices, required rules
taught, no repeated small talk, fallbacks completable. Soft-constraint statistics are
reviewed separately and are not hard failures.

First user tests: 5–8 people, directional rather than statistical. Core observations:

- Understanding the choice: can say what keep and correct each save.
- Recognising the consequence: notices order 8 references the earlier handling before
  being prompted.
- Forming reasons: explains the decision with the item, scan, origin or past reliability.
- Continuing to work: completes both decisions without facilitator help.

A majority choosing the same path is not a failure, and long hesitation is not success.
Record checking behaviour and decision time only to judge, with interviews, whether
players were thinking or lost.

Interview full-run players afterwards, so questions at order 5 don't reveal the
callback. Run a few separate UI-comprehension tests that may ask questions after order
5. Count spontaneous reactions and prompted answers separately.

Expansion gate: most first-time players independently understand the choices,
recognise the reference and state evidence-based reasons, with no blocking issues. If
the only reaction is "just another glitch", fix the order 5–8 link and consequences
before adding orders.

## 11. Toward fifteen orders

Once eight orders validate, consider about ten orders that build and restore rhythm and
five that change the state of the evidence; exact numbers come from length and fatigue
tests. Key beats stay hand-placed within phases, ordinary orders stay constrained
random, and normal sales follow major anomalies.

Next round, collaborators should study: whether both decisions make sense; whether the
correction branch clearly has more content than the keep branch; whether order 8 really
needs to deal with record provenance; whether fifteen orders keep the work rhythm
without fatigue.

Success this round means the player can tell what happened on this shift using the
evidence they left behind. Only then is it worth growing the content.
