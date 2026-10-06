# Night Shift Frequency: world and story

Version 2.0 · 2026-10-05. This is the **target** world. The current build implements
part of it; see "Current build vs. this document" at the end. Story, text and art
changes must stay consistent with this document.

## The premise

Lowtide, a small seaside town, 2005. Harbor Mart is open all night.

The clerk has been working night shifts for months without a day off. Tonight they
are, again, not going home. They can't say why. They just don't want to.

**Exhaustion is a tuning dial.** Stay awake long enough, work long enough, and you
start to drift onto another frequency. On that frequency you clocked out at the end
of your eight hours and went home like a normal person. The clerk we play is the
**half that stayed**: still behind the counter, still scanning, while their other half
is asleep in their bed.

They are not the only one. All over town, people who stayed too long are drifting the
same way: a night nurse, a taxi driver, a dock worker, a student who can't sleep. Late
at night, **87.7 FM connects everyone who stayed.** They can hear each other, faintly.

The shift ends when the radio does. At 5:00 the late-night show signs off, the dial
fills with static, the sky goes grey, and the clerk finally clocks out.

### Why 2005

2005 is close enough to remember and far enough to be unreal: flip phones and text
messages, MP3 players, a beige CRT register that should have been replaced years ago,
call-in radio still mattering. It is the year the author was born, a millennium they
were born into but never really lived through. The game should feel like that: a
remembered time you were never quite present for, which is how the night feels to the
clerk.

## Tone

- **Mostly absurd and everyday.** Nothing is announced as strange. The weirdness is
  the deadpan kind that comes from being too tired: the register calls a cola a spare
  key, a customer says the line the previous customer said, the clock skips ten
  minutes, your own sticky note is in handwriting you don't recognise. The clerk keeps
  working. So does the player.
- **A little gentle sadness at the end.** Not horror, not tragedy. The feeling of
  finally being allowed to stop.
- References: the late-night companionship of *Coffee Talk* and *VA-11 Hall-A*, 1990s–
  2000s Japanese late-night radio, the text-message fate-tinkering of *Steins;Gate*,
  the routine labour of *Papers, Please*.
- Never: jump scares, gore, a monster, a spoken explanation of the frequency.

## The rules of the frequency

1. **Fatigue is the dial.** The later it gets, the further the world drifts. There is no
   fatigue meter; the player sees the drift in the world itself: the clock, colours,
   customers and machines get less reliable as the night goes on.
2. **What drifts:** time (clock jumps, receipts disagree with the wall), the clerk
   (their own notes, their name on the sign-in sheet), customers (repeated purchases,
   borrowed lines, people who think it's daytime) and machines (the scanner, register
   and receipts read things that aren't there).
3. **Who drifts:** people who stayed. Early in the night almost every customer is an
   ordinary person on their way home. Toward 3–4 a.m., more and more of the people who
   walk in are ones who stayed.
4. **87.6 never drifts.** *Night Ferry* is an ordinary radio show. It is the one
   steady thing in the night.
5. **The world may lie, but the records may not.** The ledger, receipts and shift
   report always record exactly what the player did. Drift appears only in readings,
   on the radio and in people.

## Places

**Lowtide is in no particular country.** The 2005 feel comes from things remembered
almost everywhere (fluorescent tubes, CRTs, flip phones, call-in radio), not from one
country's goods, currency or customs. Prices are plain numbers with two decimals and no
currency sign; products, packaging and clothing avoid regional signatures and real brands.

- **Harbor Mart**, by the pier. The player only ever stands behind the counter and sees
  the outside through the glass storefront: a street lamp, wet road, the seawall
  railing, black water, lit windows on the far shore and a decommissioned relay tower
  with a blinking red light. An "OPEN 24H" sign hangs in the glass, reversed from inside.
- **The counter** carries the evidence of months of night shifts: a half-finished
  coffee, a staff schedule where every night has the same name, a sign-in sheet,
  scattered receipts, a flip phone, an old magazine, and the radio.
- **The wall**: a clock (not always right) and a tide table. Tides are how the town
  keeps time.
- **The relay tower**: out of service for years. Its light still blinks. Nobody
  explains it.

## The clerk

- The player **names the clerk** on the sign-in sheet at the start of the shift. The
  name comes back later: on the staff schedule, on the radio, in a text message.
- We never see the clerk's face. We see their hands, their phone, their handwriting.
- Their **flip phone** is under the counter. It can send texts to *Night Ferry*
  (requests, messages that may be read on air) and, on 87.7, to other people who
  stayed. Sending a text is the player's way to reach out, and sometimes to change
  something, a little like sending a message into the past.
- Shortly before dawn the phone gets **one text from the clerk's own number**: their
  other half, at home, awake for a moment. ("Door's unlocked. Come home when the radio
  stops." — final wording to be written.)

## Two frequencies

- **87.6 FM, *Night Ferry*** (01:00–05:00). Host: **June**, an ordinary late-night DJ.
  Warm, a little tired, reads the weather, song requests, lost and found, and listener
  texts. She doesn't know about the frequency and never mentions it.
- **87.7 FM, the echo.** Static early in the night, getting clearer as it gets later.
  It carries the voices of people who stayed, and it reads the register's records
  back, from the other side: if you saved SPARE KEY, it reads "COLA 500ML, manual".
- **Free tuning.** The dial turns across the whole band. Between stations, faint signals
  belong to individual people who stayed: a taxi dispatch nobody answers, a ward call
  bell, a ferry weather report for a crossing that has been suspended. Listening to
  someone's frequency before they walk in helps the clerk understand them, and changes
  how the clerk might record their sale.

## People

Names are plain English small-town names; the code uses the same names as ids
(`nellStayed` for the other Nell).

| Name | Who | Stayed? |
| --- | --- | --- |
| **Nell** | Yellow raincoat, long hair, side part. Arrives on the phone. | Her other half did; see below |
| **The other Nell** | Teal raincoat, hair parted the other way. Comes for the key. | Yes |
| **June** | Host of *Night Ferry* on 87.6. Only a voice. | No |
| **Walt** | Night taxi driver, trench coat, scarf, glasses. | Yes |
| **Ana** | Night nurse on a double shift. | Yes |
| **Hal** | Older dock worker, hi-vis jacket, beard. | Yes |
| **Tess** | Student who can't sleep, bun. | Yes |
| **Dana** | Office worker off a late shift, bob, glasses. | No |
| **Kit** | Young guy in a hoodie with earphones, listens to *Night Ferry*. | No |
| **Dex** | Delivery rider in a red cap. | No |
| **Bonnie** | Dock worker in a yellow beanie. | No |
| **Sam** | Plays in a band, bleached hair, earphones. | No |
| **Edie** | An old woman, up before everyone. | No |

## The spare key (orders 5 and 8)

- **Order 5.** Nell, the half who went home on time, stops in on her way back. She's on
  the phone with her other half: "Yeah, I'm here. I'll leave the key at the shop. Just
  come get it." She buys a cola. The register records it as a SPARE KEY. After a
  re-scan the clerk either keeps the register entry or corrects it to the item.
- **Order 8.** The other Nell comes in: the half who stayed. Same face, teal coat, hair
  parted the other way. "I'm here for the key. She said she left it here." The clerk
  either reuses the #005 record or records this scan.
- On the radio, June reads the message twice: the second time it's "signed by her
  sister". Listeners assume a sister. We know better, and never say.
- This is the clerk's own story, told through someone else: somebody left a key for
  the half that stayed. The clerk's record decides whether she can get back in.

### Four letters (read by June after the shift)

| #005 | #008 | The last letter |
| --- | --- | --- |
| Keep register (key) | Use #005 | She got the key; the door was open and the other her was waiting inside. |
| Keep register (key) | Use this scan | Two keys now; one door, and someone came home on both sides. |
| Correct to item (cola) | Use #005 | Just a cola; she sat at the door till morning. Maybe there never was a key. |
| Correct to item (cola) | Use this scan | She found a key and the door opened, but it doesn't feel like hers. |

No letter is a punishment and none is correct.

## The night, 01:00–05:00

| Time | What happens | Drift |
| --- | --- | --- |
| 01:00 | *Night Ferry* starts. The clerk signs in. Ordinary customers. | Almost none |
| 01:30–02:30 | Routine orders. 87.7 is mostly static. The first person who stayed comes in. | Small: a clock skip, a misread |
| 02:41 | Nell leaves the key (order 5). | The register misreads |
| 03:00–04:00 | More people who stayed. Their frequencies are findable on the dial. Texts to and from 87.7. | Customers borrow lines, think it's daytime |
| ~04:30 | The other Nell comes for the key (order 8). A text arrives from the clerk's own number. | The clerk's own notes stop matching |
| 05:00 | June signs off. The radio fills with static. The sky lightens. The clerk clocks out. | Gone |

The ending is always the same act, **finally clocking out**. What varies is what the
player heard, sent and recorded along the way, and which letter June reads.

## Writing rules

- Quiet, specific, everyday. The weirdness is deadpan, never announced.
- Customers acknowledge what the player did; they never decide which reality is right.
- People who stayed don't know they're on another frequency. They're just tired.
- New places (stockroom, staff room, the front door) can come later, but everything
  follows the same rule: the more tired, the further the drift.

## Room to grow

- Anomalies from the old six-order build that fit the rules: a customer says "It's not
  five people", though nobody mentioned five; the POS shows "5 ITEMS" then snaps back
  to "2 ITEMS"; the POS lies but the printed receipt is right; the report shows
  negative sales.
- The yellow rain boot from lost and found (left foot) turns up later as a right foot.
- The echo's time signal runs one minute behind *Night Ferry*'s.
- One day on the tide table is drawn wrong: the day the tower went dark.

## Target: character asset pipeline

Not implemented in the playable build. The next character asset pass follows the
[Character Asset Specification](character-assets.md), which owns pixel dimensions,
anchors, layers, naming, palette constraints, animation timing and acceptance gates.
The generated lineup is a style reference only, not a runtime sprite system and not
assigned to the cast.

1. Freeze the authoring contract at the first-person counter scale and approve one
   native-pixel standard body.
2. Author shared idle and talk parts; validate outfit/body compatibility first.
3. Stress-test the paper doll with the ten approved looks and compatible parts.
4. Add counter handover and context-relevant interactions. Keep normal play at
   the counter; walk and side/back views follow only when staging needs them.
5. Add a small reusable gesture library with explicit outfit/prop compatibility.
   Start with direct character action lists; add tag-based selection only when
   there is a concrete selection requirement.
6. Expand NPCs by assembling verified parts rather than generating new whole images.

Runtime uses authored parts and integer offsets/flips, not procedural limb motion
or arbitrary sprite rotation. New views and poses must preserve the quiet, tired
2005 night-shift cast; they must not replace story identities implicitly.

## Current build vs. this document

Implemented now: Lowtide, Harbor Mart, the window view and tower; *Night Ferry* on 87.6
with June, and the echo on 87.7 (two fixed stations); the spare-key story in orders 5
and 8 with the four letters; the cast's English names; the "records may not lie" rule.

Not implemented yet:

- The 01:00–05:00 night (the build runs 02:12–03:04 in eight orders) and ending at
  the radio sign-off with clocking out.
- Free tuning across the band and per-person frequencies.
- The flip phone, texting, and the text from the clerk's own number.
- Naming the clerk on a sign-in sheet.
- Drift that grows through the night (clock jumps, borrowed lines, the clerk's own
  notes); counter props that show months of night shifts.
- Customers who stayed becoming more frequent as the night goes on.
