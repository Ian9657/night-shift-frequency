# Night Shift Frequency Producer Review

## Status of This Review

This is an internal assessment of the six-order prototype. Its scores are
subjective production estimates, not independently validated playtest results;
the end-to-end claims below were not established by a fresh full browser run
during the documentation update. The later external review rated the demo 6.9/10
and highlighted limited decisions despite strong presentation.

The resulting next-build priority is now the
[八单玩法验证蓝图](gameplay-blueprint-v2.md): test meaningful decisions and
cross-order consequences before further polish or expansion to fifteen orders.
The recommendations below remain historical context and do not override that scope.

Date: 2026-09-20

Scope:

- Review the active playable build in `greybox.html`, `css/greybox.css`, and `js/greybox.js`.
- Treat earlier draft documents and screenshots as historical context, not current implementation truth.
- Judge this as a short, authored browser-game vertical slice, not a general convenience-store simulator.

## Short Verdict

This is now a credible short-form game vertical slice rather than a greybox exercise. Its identity is clear: the player completes an ordinary late-night convenience-store shift while the machines, customers, and records begin disagreeing in quiet ways.

The project has two unusually strong systems for its size:

- Physical checkout actions have spatial continuity. Goods move through the scanner, cash travels from a customer hand to the tray, bags are drawn from a stack and filled, and heating happens after payment but before bagging.
- Dialogue has dramatic weight. Ambient remarks continue alongside work; a small number of important lines deliberately stop the player and remove guidance.

The slice is playable end to end, visually coherent, and already has a directed rhythm. It is not yet at commercial pixel-art finish: the art language needs a tighter authored pass, the full six-order pacing needs repeated playtesting, and the audio system needs a final balance pass on real speakers and headphones.

Current scores:

- Gameplay and interaction rhythm: 8.6/10
- Dialogue and operation integration: 9.2/10
- Audio direction and gameplay feedback: 8.6/10
- Interface readability: 8.5/10
- Pixel-art craft against strong commercial work: 7.4/10
- Overall vertical slice: 8.7/10

## Current Playable Structure

The shift consists of six authored orders:

1. **02:12 - card tutorial.** Teaches item selection, scanning, card payment, and bagging without noise.
2. **02:18 - cash and heating.** Teaches the physical cash handoff, then the deliberate rule that a paid bento is heated before it is bagged.
3. **02:27 - no bag / five.** A normal one-bottle order introduces the missing premise: `It's not five people.`
4. **02:34 - count anomaly.** A tap payment looks normal until the POS shows `5 ITEMS`, then resolves to `2 ITEMS`.
5. **02:43 - mismatch.** Physical products and POS records diverge. The player must rescan, then explicitly confirm the machine's match state before accepting cash.
6. **02:58 - report.** A nearly normal final customer leads to a deliberately quiet, contradictory sales report.

Payment has distinct behavior rather than cosmetic labels:

- **Card** uses the terminal and a slower approval response.
- **Tap** uses a shorter terminal response.
- **Cash** changes the customer pose, presents a bill, moves it through the counter space, then triggers the tray and drawer response.

The consistent operational grammar is now:

```text
scan -> pay -> heat when required -> bag or hand off
```

That rule is stable enough that Event 4 and Event 5 can violate the player's expectations without feeling like ordinary UI failure.

## What Is Working

### Operation Has Weight Without Becoming Slow

Scanning, payment, heating, bagging, handoff, and customer exit each use a different tempo. Recent overlap work matters more than raw duration reductions: bag dialogue now begins alongside bag extraction, while cash-register response begins during the bill's arrival instead of after a fully serialized animation.

Normal operations are fast enough to form a repeatable rhythm. The deliberately slower beats remain customer arrival, the cash handoff, key anomalous lines, and the final report. This is the correct hierarchy.

### Dialogue Is Now a Directing System

Dialogue defaults to ambient behavior. Important reactions carry explicit `lock: true` metadata, so the text itself owns its dramatic weight instead of inheriting it from an arbitrary action key.

The best example is Event 3:

```text
It's not five people.          locked
I didn't say five.             ambient
The bottle doesn't make it five. ambient
See? You're counting now.      locked
```

This creates an actual attention curve: the player is caught, allowed to continue working under the discomfort, then stopped once more at the handoff.

### The POS Has Become a Gameplay Object

The black screen, red type, quantities, and comparison state make the POS a focal device rather than background decoration. Event 4 uses it for an information anomaly; Event 5 uses it for a player-led reconciliation task.

The mismatch recovery path is also now robust: a premature confirmation does not silently dead-end. It asks the player to rescan, visually calls attention back to the scanner, and only enables the real confirmation after that condition is met.

### Audio Supports Actions and Space

The build now has diegetic sound for scanner contact, card/tap confirmation, cash paper and drawer movement, bag plastic, receipt printing, microwave start/hum/finish, and POS anomalies. A start gate satisfies browser audio permission requirements before the opening line plays.

There is also a low, living room tone: refrigeration, electrical hum, filtered air noise, and occasional distant incidents. This is a better fit than background music. The game should sound like a place that continues operating after everyone else has gone home.

### The Interface Has a Clearer Maturity Curve

Early orders teach through direct next-action outlines. Later orders delay or suppress cues, especially while the POS is behaving incorrectly. The game gradually moves from “follow the checkout procedure” to “look closely at the checkout procedure.”

## Remaining Risks

### The Six-Order Pacing Has Not Yet Had a Proper Acceptance Pass

The project has been carefully tuned locally, but it still needs full uninterrupted runs. The important question is not whether each animation looks good by itself; it is whether the player has a meaningful reason to look, move, or think during every enforced pause.

Measure these moments in a fresh run:

- Does dialogue ever feel like an unexplained disabled click?
- Can a quick player naturally form a scan-scan-pay-bag rhythm?
- Do cash and bag actions feel tactile rather than slow?
- Does Event 4 leave enough ordinary work before the count anomaly?
- Does Event 5 make the player curious before it makes them confused?
- Is the final report noticeable without looking like an explicit quest marker?

### Pixel-Art Craft Is Behind the Interaction Design

The composition, palette, and selected hero objects are working. The remaining gap is material specificity. Some assets still read as tidy pixel-styled SVG blocks instead of intentional pixel clusters.

The most valuable art-pass order is:

1. Customer hands and receiving poses
2. Product sprites and packaging variety
3. Scanner and payment-terminal material detail
4. POS casing, keyboard wear, and glass treatment
5. Counter contact shadows and object anchoring

Do not add general decoration before these. The frame already has enough information.

### Audio Needs Calibration, Not More Systems

The sound system is now broad enough. The remaining work is mix discipline:

- Check the ambience and dialogue ticks on laptop speakers, headphones, and a phone speaker.
- Keep the scanner, payment, and microwave readable without turning them into rewards.
- Keep dialogue ticks crisp and sparse enough that they do not turn natural speech into RPG chatter.
- Let late anomalies alter established sound rules sparingly: a missing scan beep or an unexpected scanner response is stronger than a new horror sting.

## Next Production Priorities

### Priority 1: Full-Run Pacing QA

Play all six orders from a fresh load at least three times: once as a cautious first-time player, once as an impatient player, and once as a player deliberately trying wrong actions. Record every wait above roughly 500ms that has neither story value nor a readable physical result.

Do not broadly speed up the game. Preserve the pauses that give the shift its weight.

### Priority 2: Small, Rare World Responses

Add only three to five authored reactions to intentional player behavior, such as lingering after a key line, repeatedly rescanning a normal item, clicking a wrong device after payment type is clear, or hesitating at the Event 5 comparison.

These should be discoveries, not a parallel hint system. The strongest feeling is that the shop briefly noticed what the player did.

### Priority 3: Focused Pixel-Art Pass

Improve the handoff poses and the most frequently clicked equipment before adding new locations, systems, customers, or endings. The operational side is currently ahead of the visual craft; this is where the build will gain the most perceived quality.

### Priority 4: Audio Mix and Late-Shift Variation

After pacing QA, tune the final mix and add only subtle late-shift deviations to existing audio behavior. Preserve the no-BGM direction. The baseline should remain: silence, machines, a brief human exchange, then silence again.

## Explicit Non-Priorities

Do not expand into these before the current slice has passed pacing and art QA:

- More checkout systems
- Random dialogue generation
- Large customer biographies
- Multiple endings
- Score chasing or time pressure
- Traditional music tracks
- Obvious jump scares or heavy visual corruption

The game works because it stays small, specific, and observant. Its most valuable escalation is not “more horror”; it is increasing doubt that the player and the register are observing the same transaction.

## Current Assessment

The project has crossed the important threshold: it is now possible to evaluate it as a game, not simply as an idea. The interaction grammar is stable, the strange elements are authored rather than random, and the scene has enough sound and physical continuity to feel inhabited.

The next pass should be disciplined: validate the complete shift, improve the objects the player touches most, and let the existing unease breathe.
