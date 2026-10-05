# Build notes: pixel-world rewrite

Updated: 2026-10-05. Replaces the SVG/DOM eight-order build (git baseline `d72b93b`).

## What changed

- **Rendering.** One `<canvas>`: the world is 480x270 indexed pixel art drawn at 2x
  onto 960x540; UI text uses the 960x540 grid with baked Fusion Pixel 12px glyphs, so
  nothing anti-aliases. The canvas fills the window, snapping to an exact whole or
  half scale when the window is within 4% of one. The DOM layout, 1,500 lines of CSS and the
  per-element placement code are gone.
- **Art pipeline.** Sprites are authored as palette-indexed sources in `art/src`
  (pixel primitives, normal-based lighting, hand-placed details) and built by
  `art/tools/build-art.cjs` into a runtime bundle; `--png` exports indexed PNGs for
  Aseprite (`art/palette.gpl`).
  `art/overrides/<name>.png` replaces a generated sprite. Runtime palette remapping
  provides per-customer colours and scene moods (`echo`, `dim`) without copies.
- **Customers.** Paper-doll parts on a shared 120x120 canvas: 4 outfits, 3 heads,
  8 hairstyles, 6 accessories (incl. rain on Wen's coat), 4 right-arm poses (idle,
  reach, low, phone). Ten
  regulars plus Wen and her mirrored counterpart. Poses switch; props attach at
  authored hand anchors.
- **Code ownership.** `js/engine/shift.js` keeps the previous rules and tests (orders
  frozen; observations, saved labels, origin and verification kept separate). Content
  moved to `js/content`. The 3,165-line controller became `js/game/checkout.js`
  (actions and scene model) plus dialogue, radio, records and audio modules.
  `js/core/time.js` is the single clock for waits and stepped motion.
- **Story.** Worldview in `docs/worldview.md`: Lowtide, Harbor Mart, Night Ferry
  radio (87.6) and the echo frequency (87.7). Orders 5 and 8 carry the spare-key story;
  the four decision combinations end with different radio letters and a closing card.
- **Bilingual.** Every string is `[zh, en]` in `js/content/strings.js`; language
  switches live (top-right chip or L) and is remembered per browser.

## Art refinement (480x270)

- World resolution raised from 320x180 to 480x270; every sprite was redrawn, not
  scaled. Faces are ~20 px wide with lash lines, irises, lit lips and ears.
- Palette rebuilt as material ramps (5-8 tones) generated with hue shifting:
  shadows lean blue, highlights warm. Customer cloth and accent ramps use the same
  generator (`js/content/colors.js`); skin and hair ramps are hand-picked.
- New shading tools in `art/tools/pixel.cjs`: `volume` (edge lighting), `light`
  (normal-based cel shading for heads, limbs, torsos and hair), `glow` (Bayer
  dithered light for the street lamp, microwave and radio window), `outlineBy`
  (each material outlined in its own darkest tone).
- Scene additions: two-layer hills and town lights, a guyed relay tower, a bicycle
  at the railing, wet-road lamp reflection, mirrored neon with glow, ceiling vent,
  tide table, light switch, pegboard shelving with price strips, detailed fridge
  stock, cabinet scuffs, a paper-bag cubby, staff sticker and bin. Runtime adds
  contact shadows under everything resting on the counter.

## Behaviour carried over

Scan → pay → heat when required → bag or hand over. Independent scanning of identical
units with aggregated quantities. Cash vs terminal payments, payment sounds at contact.
Customer reactions to early or wrong actions. Locked lines for deliberate beats.
Delayed next-action cues from order 3, and no cues while a record conflict is open.
Order 5 choices appear only after a physical re-scan; order 8 references the saved
order-5 record. Closing totals derive from the ledger.

## New behaviour

- Scanning a record-order item briefly shows a spare key and shifts the scene to the
  echo palette.
- The radio can be retuned between 87.6 and 87.7; missed Night Ferry lines replay
  when tuning back. 87.7 reads the record you did not save.
- Customers walk in and out; goods appear once they reach the counter. The cash
  drawer opens; receipts print from the printer.
- Shift report prints as a receipt, then the radio reads the ending and the closing
  card summarises both saved records.

## Verification (2026-10-05, after the 480x270 pass)

- `shift-engine.test.cjs`: 500 seeds, four decision paths, immutability, idempotent
  settlement, lineup — pass.
- `content.test.cjs`: 151 bilingual strings, referenced keys across 200 seeds, story
  keys, four endings, glyph coverage — pass.
- `art.test.cjs`: 60 sprites rebuilt identically, indices inside the palette, PNG
  export round-trips, every sprite referenced, fixtures on the counter, hand anchors
  reach counter and terminal — pass.
- `browser-flow.cjs`: real pointer clicks through all eight orders on all four
  branches, report, ending, language toggle, narrow viewport, no page errors — pass.
- `visual.cjs`: card contact, cash hand-off, heating, scanner bleed, echo caption,
  English record view, landscape phone — pass; screenshots reviewed.

## Not verified / known limits

- No human playtest yet: natural-speed pacing, whether the radio is noticed, and
  whether players recognise order 8's link without hints.
- Audio mix only reasoned about, not checked on speakers or headphones. The radio
  voice is synthesised murmur, not recorded speech.
- Portrait phones show the whole scene at a small size; landscape is recommended.
- Keyboard support covers the title screen and the record view; counter actions
  need a pointer.
