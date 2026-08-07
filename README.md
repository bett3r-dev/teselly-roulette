# Prize Wheel

A spinning prize wheel you fill with your own entries. Type in the names or prizes,
hit spin, and the wheel slows to a stop on one of them.

React + TypeScript + Vite. No backend, no dependencies beyond React — the wheel is
plain SVG and the sound is synthesised in the browser.

Yarn Berry (4.x) with the `node-modules` linker — `corepack enable` once, and the
pinned version in `packageManager` is used automatically.

```bash
yarn install
yarn dev         # http://localhost:5173
yarn test        # spin, landing and editing behaviour
yarn build       # static files in dist/, host them anywhere
```

## Using it

- **Add entries** one at a time, or click **Edit as list** to paste a whole list,
  one entry per line. Entries are saved in the browser, so they survive a reload.
- **Click the hub** to spin, or press **space** from anywhere — handy when the
  wheel is up on a projector and you are not near the keyboard.
- Click an entry's colour swatch to cycle it through the palette.
- **Take the winner off the wheel** turns it into a raffle: each winner is removed
  once you dismiss the reveal, so the next spin draws from who is left.

Up to 60 entries. Every entry gets an equal slice, so the odds are always even.

## How the spin works

`useSpin` animates frame by frame rather than with a CSS transition, because two
other things read the wheel's live angular velocity:

- The **pointer** is deflected by each peg it passes and springs back when the peg
  slips by — so it flutters at speed and visibly clicks over one peg at a time at
  the end.
- The **marquee bulbs** chase around the rim at a rate taken from the rotation
  itself, so the light slows down exactly as the wheel does.

The winner is chosen first, with a rejection-sampled `crypto` random so every entry
is equally likely, and the final angle is computed backwards from it — landing the
chosen segment under the pointer with a small random offset so the wheel does not
always stop dead centre. `yarn test` checks that what the reveal announces is always
the segment actually sitting under the pointer.

## Layout

```
src/
  components/   Wheel (SVG face, marquee, pointer), EntryEditor, WinnerReveal
  hooks/        useSpin (the frame loop), useEntries, useSound, usePersisted
  lib/          geometry (angles and slice paths), palette, random
```

Reduced-motion is respected: the spin shortens and the ambient animations stop.
