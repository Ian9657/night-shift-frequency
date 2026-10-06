# Night Shift Frequency

2 a.m. at Harbor Mart, a convenience store in the seaside town of Lowtide. You work an
eight-order night shift at the register: scan, take payment, heat, bag.
The radio on the counter is playing FM 87.6, *Night Ferry*. Across the bay, a relay
tower that went dark years ago is blinking red.
Tonight the scanner reads a bottle of cola as a **spare key**, and the record you keep
decides what happens to the customer who comes for it later.

A 480×270 pixel-art browser game. Download it, open it, play. No install, no build.

## How to play

Open `index.html` in a browser and click **START SHIFT**.

- Click an item, then the scanner. When everything is scanned, take payment the way the
  customer asks: card or phone on the card terminal, cash into the drawer under the register.
- Ready meals are heated after payment: click the microwave. Click the bags to bag an order.
- Click the register screen to see the transaction record. When the register and the
  item disagree, scan the item again at the counter before the record choices appear.
- Click the radio to switch between 87.6 and 87.7.
- The top-right button toggles sound. A landscape window works best.

`index.html?seed=review-01` replays the same shift. The current shift's seed is shown
on the closing card and printed to the browser console. Reloading starts a new shift;
nothing is saved.

## What's in it

- Eight orders: six ordinary ones (randomised items, payment, bagging and small talk)
  and two story orders, #5 and #8.
- Order 5: a woman in a yellow raincoat, on the phone, buys a cola that the register
  calls a SPARE KEY. After a re-scan you keep the register entry or correct it.
- Order 8: someone who looks almost exactly like her, hair parted the other way, comes
  to collect the key. You reuse the #005 record or record this scan.
- The two choices lead to four endings, read out by *Night Ferry* after the shift.
  87.7, the echo frequency, reads back the record you did *not* save.
- Ten regulars built from pixel parts, each with their own colours.

## Documents

| Document | For |
| --- | --- |
| [docs/worldview.md](docs/worldview.md) | The world and story, including what is planned next |
| [docs/game-design.md](docs/game-design.md) | How the current game works and the rules behind the records |
| [docs/architecture.md](docs/architecture.md) | How the code is organised and why |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Changing art, text and code; running the tests |
| [CHANGELOG.md](CHANGELOG.md) | What changed, when, and how it was verified |
| [AGENTS.md](AGENTS.md) | Working rules for AI coding agents on this repository |

## License

The code is MIT-licensed. The artwork, characters, story and text are all rights
reserved. The pixel font is Fusion Pixel Font under the SIL Open Font License. See
[LICENSE](LICENSE) for exactly which files fall under which part.
