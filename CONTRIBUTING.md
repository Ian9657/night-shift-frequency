# Contributing

How to change the game and check that it still works. For how the code is organised,
read [docs/architecture.md](docs/architecture.md) first. AI coding agents also follow
[AGENTS.md](AGENTS.md).

## Requirements

- A browser. The game is plain HTML and classic scripts; open `index.html` directly.
- Node.js 20+ for the art build and the tests.
- Python 3 with the packages in `art/tools/requirements.txt`, only when changing text
  (the font build).
- Chrome and Playwright for the browser tests.

```sh
python3 -m pip install -r art/tools/requirements.txt
```

## Project layout

- `index.html` — the only entry point; loads classic scripts in order.
- `js/content/` — layout, strings, colour ramps, customer looks, story and radio script.
- `js/engine/shift.js` — order generation, re-scans, record decisions, the ledger.
- `js/core/time.js` — the game clock.
- `js/game/` — checkout, dialogue, radio player, broadcast schedule, record view, audio.
- `js/render/` — sprites, bitmap text, world and UI layers.
- `js/main.js` — canvas, frame loop, input routing, test hooks.
- `art/` — pixel art sources, palette, hand-drawn overrides, font source, build tools.
- `assets/` — generated runtime data. Never edit by hand.
- `tests/` — Node and browser tests; `tests/artifacts/` holds disposable screenshots.

## Changing art

Sprites are authored in `art/src/*.cjs` with palette colour names and the shading tools
in `art/tools/pixel.cjs`. The store and camera are in metres in `js/content/space.js`;
`js/content/layout.js` derives screen positions from them. Customer poses are named in
`js/content/poses.js` and drawn by `art/src/people.cjs`.

```sh
node art/tools/build-art.cjs                      # rebuild assets/sprite-data.js and art/palette.gpl
node art/tools/build-art.cjs --preview goods      # contact sheet of one source file
node art/tools/build-art.cjs --png                # export indexed PNGs to art/png/ (untracked)
```

Every build writes review sheets to `tests/artifacts/art-*.png`. Look at them.

### Hand-painting in Aseprite

1. Export with `--png` and open `art/png/<name>.png`.
2. Load `art/palette.gpl` and use only palette colours.
3. Save as `art/overrides/<name>.png` and rebuild. The override replaces the generated
   sprite; the build fails if it uses a colour outside the palette.

## Changing text

All player-facing text is in `js/content/strings.js` (English only). Story order,
radio schedule and endings are in `js/content/story.js`. After adding characters,
rebake the glyphs:

```sh
python3 art/tools/build-font.py
```

The build stops if a character is missing from the font subset in `art/font/`.

## Running the tests

```sh
node tests/shift-engine.test.cjs   # 500 seeds, four record branches, immutable ledger
node tests/content.test.cjs        # string references, no orphans, endings, glyph coverage
node tests/art.test.cjs            # bundle matches sources, palette, references, layout, anchors
node tests/browser-flow.cjs        # real clicks through all four branches, audio smoke, recovery, seed
node tests/interaction.test.cjs    # buffered clicks, panels and pausing, the radio across orders
node tests/visual.cjs              # key frames for review: card, cash, heating, echo radio, phone
```

If Playwright isn't installed locally, set `PLAYWRIGHT_MODULE` to its absolute path.
Run all five after any change to interaction, art or text, and look at the screenshots
in `tests/artifacts/` when the presentation changes.

## Recording a change

- Add an entry to [CHANGELOG.md](CHANGELOG.md): what changed, and how it was verified,
  including anything you could not verify.
- Update [docs/architecture.md](docs/architecture.md) if module boundaries, state
  ownership or the pipeline changed, and [docs/game-design.md](docs/game-design.md) if
  the rules of play changed.
- Story changes must agree with [docs/worldview.md](docs/worldview.md).
- Keep only the current version. Old versions live in git history, not in copies.

For changes to Night Ferry's pacing, also run the optional
`node tests/radio-pacing.cjs` with the same Playwright setup. It plays the first
order at normal speed, checks the second order's hint, introduction and song in
sequence, and finds the taxi signal using the dial's keyboard controls. It saves
desktop and landscape-phone hint screenshots under `tests/artifacts/`.
This is a short pacing probe, not a full-night normal-speed playthrough.
