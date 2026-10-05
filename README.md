# Night Shift Frequency

2 a.m. at Harbor Mart, a convenience store in the seaside town of Lowtide. You work an
eight-order night shift at the register: scan, take payment, heat, bag.
The radio on the counter is playing FM 87.6, *Night Ferry*. Across the bay, a relay
tower that went dark twelve years ago is blinking red.
Tonight the scanner reads a bottle of cola as a **spare key**, and the record you keep
decides what happens to the customer who comes for it later.

A 480×270 pixel-art browser game. Open it and play; no install, no build.

## How to play

Open `index.html` in a browser and click **START SHIFT**. No server or build step needed.

- Click an item, then the scanner. When everything is scanned, take payment the way the
  customer asks: card or phone on the card terminal, cash on the coin tray.
- Bentos are heated after payment: click the microwave. Click the bags to bag an order.
- Click the register screen to see the transaction record. When the register and the
  item disagree, scan the item again at the counter before the record choices appear.
- Click the radio to switch between 87.6 and 87.7.
- The top-right button toggles sound.

`index.html?seed=review-01` replays the same shift. Reloading starts a new one; nothing
is saved.

## What's in it

- Eight orders: six ordinary ones (randomised items, payment, bagging and small talk)
  and two story orders, #5 and #8.
- Order 5: Wen, in a yellow raincoat and on the phone, buys a cola that the register
  calls a SPARE KEY. After a re-scan you keep the register entry or correct it.
- Order 8: someone who looks almost exactly like her, hair parted the other way, comes
  to collect the key. You reuse the #005 record or record this scan.
- The two choices lead to four endings, read out by Night Ferry after the shift.
  87.7, the echo frequency, reads back the record you did *not* save.
- Ten regulars built from pixel parts (heads, hair, outfits, accessories) with their
  own colour ramps.

Setting and story: [docs/worldview.md](docs/worldview.md). Implementation and
verification: [docs/build-notes.md](docs/build-notes.md).

## Project layout

- `index.html` — the only entry point; loads classic scripts in order (works from `file://`).
- `js/content/` — layout, strings, colour ramps, customer looks, story and radio script.
- `js/engine/shift.js` — order generation, re-scans, record decisions and the ledger
  (pure logic, tested in Node).
- `js/core/time.js` — the single game clock that drives every wait and animation.
- `js/game/` — checkout controller, dialogue, radio, record view, synthesised audio.
- `js/render/` — sprite cache and recolouring, bitmap text, world and UI layers.
- `art/` — everything about the pixel art: sources (`src/`), palette, hand-drawn
  overrides (`overrides/`), font source and build scripts (`tools/`).
- `assets/` — generated runtime data (sprites and glyphs). Do not edit by hand.

## Changing art and text

Sprite sources live in `art/src/*.cjs` and use palette colour names. After a change:

```sh
node art/tools/build-art.cjs                      # assets/sprite-data.js, art/palette.gpl, review sheets in tests/artifacts
node art/tools/build-art.cjs --png                # also export indexed PNGs to art/png/ (untracked)
node art/tools/build-art.cjs --preview customers  # contact sheet of one source file
```

To hand-paint a sprite in Aseprite: export with `--png`, open `art/png/<name>.png`, load
`art/palette.gpl` and use only palette colours. Save the result as
`art/overrides/<name>.png` and run `build-art` again; it replaces the generated sprite.

All text is in `js/content/strings.js`. After adding new characters, rebake the glyphs
(needs Python and Pillow):

```sh
python3 art/tools/build-font.py
```

The font is a Latin subset of [Fusion Pixel 12px](https://github.com/TakWolf/fusion-pixel-font)
(SIL OFL 1.1, see `art/font/OFL.txt`).

## Tests

```sh
node tests/shift-engine.test.cjs   # 500 seeds, four record branches, immutable ledger
node tests/content.test.cjs        # string references, no orphans, endings, glyph coverage
node tests/art.test.cjs            # sprites match sources, palette, references, layout, anchors
node tests/browser-flow.cjs        # real clicks through all four branches, report, ending, narrow screen
node tests/visual.cjs              # key frames: card, cash, heating, scanner bleed, echo radio, phone
```

Browser tests need Chrome and Playwright. If Playwright isn't installed locally, point
`PLAYWRIGHT_MODULE` at its absolute path. Screenshots go to `tests/artifacts/` and are
disposable.
