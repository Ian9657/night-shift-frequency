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

## Recording radio lines

Night Ferry's lines are voiced by a synthesiser until someone records them. To record a
line, save it as `art/voice/<string key>.wav` (for example `art/voice/radio.o4.wav`; any
PCM or float WAV, any rate, mono or stereo) and rebuild:

```sh
node art/tools/build-voice.cjs
```

The build converts each recording to 8-bit mono at 11025 Hz and bundles it into
`assets/voice-data.js`; the game then plays it instead of the synthesised voice, for as
long as it lasts. `art/voice/lines.json` remembers the text each recording was made of.
If a recorded line's text changes, the build stops until it is recorded again and
accepted with `--accept <key>`. Lines with a `{variable}` (June reading the clerk's
name) can't be recorded. The content test fails if the bundle is out of date.

## Running the tests

```sh
node tests/run-all.cjs             # everything below, judged by exit code; --pacing adds the radio probe
node tests/run-all.cjs radio       # only checks whose name contains "radio"

node tests/shift-engine.test.cjs   # 500 seeds, four record branches, immutable ledger
node tests/content.test.cjs        # string references, no orphans, endings, glyph coverage, voice bundle
node tests/art.test.cjs            # bundle matches sources, palette, references, layout, anchors
node tests/counter.test.cjs        # keyboard, touch, guidance, refusals, the action queue, customer speech
node tests/radio.test.cjs          # the dial, reception, Night Ferry across orders, calls, pausing
node tests/audio.test.cjs          # which voice a line gets and when it stops; ambience after silent mode
node tests/browser-flow.cjs        # real clicks through the whole night on all four branches
node tests/visual.cjs              # key frames for review: card, cash, heating, echo radio, phone
```

If Playwright isn't installed locally, set `PLAYWRIGHT_MODULE` to its absolute path.
Run them all after any change to interaction, art or text, and look at the screenshots
in `tests/artifacts/` when the presentation changes.

The counter, radio and audio checks are suites (`suite()` in `tests/browser-helpers.cjs`):
each case gets a fresh, signed-in page, so no case inherits another's radio queue or
feedback; a failing case is named and the others still run. Add a case to the suite it
belongs to rather than continuing an earlier case's page.

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

## Probes

`tests/probes/` holds optional tools for looking at the game the way a person would,
for what the checks can't see. They are not in the verification list. Set
`BASE=<folder>` to point one at a copy of the game, for example a previous version from
`git archive <commit> | tar -x -C <folder>`, to compare before and after a change.

```sh
node tests/probes/pacing.cjs [seed]       # a practised player at normal speed, the whole night:
                                          #   time spent waiting, Night Ferry heard line by line,
                                          #   how long each action keeps the counter busy (~1.5 min)
node tests/probes/speech.cjs [seed ...]   # whole nights at a quick pace; any customer line cut
                                          #   off or never shown fails it
node tests/probes/chaos.cjs [seed ...]    # random input before each order, then a player finishes
                                          #   it; page errors or a stuck order fail it
node tests/probes/record.cjs june         # record what the game plays to tests/artifacts/june.webm
                                          #   (presets: june, voices, opening, song)
node tests/probes/levels.cjs              # peak and RMS of the main sounds at the output
```

Run `pacing` after changing Night Ferry or the counter's timing, `speech` after changing
how customers talk, `chaos` after changing input or panels, and `record` / `levels`
after changing a sound, then listen.
