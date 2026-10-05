# Night Shift Frequency: Pixel Asset Brief

Purpose:

```text
Define the first modular pixel sprite direction for the checkout-counter prototype.
```

Current status:

```text
First test sprites exist.
They are not final art.
They are proof that the scene can move away from CSS rectangles.
```

## Current Test Sprite Folder

```text
assets/pixel-sprites/
```

Current files:

- `countertop.svg`
- `clock.svg`
- `cctv-monitor.svg`
- `hanging-sign.svg`
- `customer-01.svg`
- `customer-02.svg`
- `customer-03.svg`
- `pos-register.svg`
- `scanner.svg`
- `payment-terminal.svg`
- `bag.svg`
- `receipt-printer.svg`
- `microwave-edge.svg`
- `products/coffee.svg`
- `products/onigiri.svg`
- `products/bento.svg`
- `products/drink.svg`
- `products/sandwich.svg`
- `products/bread.svg`
- `products/cup-noodles.svg`
- `products/chips.svg`
- `products/canned-drink.svg`
- `clutter/note.svg`
- `clutter/crumpled-receipt.svg`

## Production Direction

Use modular sprites, not one finished background image and not CSS-drawn props.

Layer model:

```text
background plate: wall, counter base, distant store hints
sprite layer: customer, products, POS, scanner, payment terminal, bag, receipt printer
HTML layer: POS text, receipt text, dialogue, click regions
effect layer: scanline, small highlights, anomaly overlays
```

## What The Test Proves

The first sprite pass is already better than pure CSS rectangles because:

- objects read as game pieces
- customer is a character, not a UI block
- products can be swapped independently
- POS shell can be replaced without rewriting POS screen logic
- the scene is no longer tied to one large POS image

## What Is Still Weak

- sprites are still too rough to carry final mood
- product text labels feel like debug labels
- POS / receipt / scanner area is visually crowded
- the counter surface still feels like patterned CSS, not a drawn counter
- current SVG sprites should be considered placeholder pixel-block assets, not final hand-painted pixel art

## Next Asset Pass

Do not polish every sprite equally.

Priority order:

1. `customer-01`
2. `pos-register`
3. product set
4. counter base / background plate
5. scanner / payment / bag

## Environment Pass 1

Added the first "convenience-store现场感" assets:

- counter top / counter body
- electronic clock shell
- CCTV monitor
- hanging sign
- customer variants
- cup noodles
- chips
- canned drink
- employee note
- crumpled receipt

Purpose:

```text
move the scene from checkout-system diagram
toward a first-person convenience-store counter frame
```

Current issue to watch:

```text
Do not keep adding machines.
Use counter, customers, products, signs, and clutter to create place.
```

Reason:

```text
The player reads the scene through:
customer presence,
POS screen,
real products on the counter.
```

## Asset Rules

- keep assets independently replaceable
- keep products separate from the counter
- keep POS shell separate from POS screen text
- keep receipt paper separate from receipt printer
- avoid soft gradients
- use hard pixel clusters
- avoid over-detailing before the 6-event flow feels right

## Open Decision

Next visual step:

```text
replace only customer + products + counter base with stronger art,
then judge whether the direction feels like a pixel game.
```
