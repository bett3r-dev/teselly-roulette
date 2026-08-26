# Ruleta Teselly

A prize wheel built as **signage**: it runs unattended on a 65" 4K TV turned to
portrait (2160 × 3840) at a stand. The screen loops on its own; the only human
gesture is the space bar, which spins the wheel.

React + TypeScript + Vite, with **GSAP** for the scene choreography (same as the
landing). No backend. The wheel is plain SVG and the sound is synthesised in the
browser.

```bash
yarn install
yarn dev         # http://localhost:5173
yarn test        # spin, landing, the space bar, and the loading panel
yarn build       # static files in dist/, host them anywhere
```

## The three bands

The screen is one non-scrolling 9:16 canvas divided into three, and the split is
the design rather than a consequence of it:

| Band | Height | What it is |
|---|---|---|
| **Teselly** | 11% | Logo left, a blinking fairground sign right |
| **La ruleta** | rest | The protagonist. Sized to whatever the other two leave |
| **Qué hacemos** | 36% | A ten-card loop plus two marquees (below) |

The top band is two columns with all the slack in the middle: stacked and centred
they sat on top of each other, two things saying different things — who owns the
screen, and what to do with it — fighting for one axis. "Girá y ganá" is a
**feria sign**: a pill rimmed with bulbs that chase, and the whole thing flickers
every few seconds like a tube starting up. It's the one place the brand lets
itself do that, and it's the right one — it's the part whose job is to make
somebody cross the aisle.

The middle band is `1fr` and not a percentage: on a panel that is not exactly
9:16, what gives is the wheel — it is square and adapts — rather than the type
above and below it, which would stop being readable.

`Qué hacemos` is three stacked pieces with air between them: a **card** — the
animated scene on the left, its caption on the right — and under it the
**capabilities marquee** and the **integrations marquee**, neither of which ever
stops. The card is two columns rather than stacked because stacked, the scene and
its caption read as two unrelated blocks that happened to land on top of each
other, and everything had to fit in the band's height, which is what left the
section cramped. Side by side the scene can be tall and the text wide at the same
time, and it reads as one thing.

Ten cards, each an animated scene, in the landing's own order: how you get in (migrate with
zero risk), then why (the three pillars), then what's inside (the product, module
by module). Each card runs for as long as it needs — the migration one walks four
steps and takes nearly twice as long as the rest.

**The three pillars are the landing's own vizzes, copied.** `components/pillars/`
holds `Pillar1Viz`, `Pillar2Viz` and `Pillar3Viz` ported verbatim — same markup,
same `data-*` hooks, same CSS (lifted straight out of `global.css` into
`PillarViz.css`), same GSAP scripts in `src/lib/pillar1|2|3.ts`. They were
redrawn by hand for a while — "same gesture, bigger" — and it wasn't good enough:
next to the originals the timings, proportions and states were all visibly
different. If they're the landing's pillars, they have to *be* the landing's
pillars.

Three deliberate differences in the scripts, none of them taste:

- **Text is inlined.** The originals resolve every label through the i18n
  dictionary; this repo has no i18n and the piece is Spanish-only, so `txt()`
  reads a local object with the same key tree (`viz1.*`) and the rest of the file
  is untouched.
- **They take their root as a parameter and return a teardown.** On the landing
  each viz mounts once per page; here the loop mounts and unmounts it every time
  it comes round, so a module-level `initialized` guard and a `document`-wide
  query would both be wrong, and a timeline left running on removed nodes leaks.
- **Pillar 3 is driven differently.** Its original has no timeline: it hangs off
  the GSAP ticker and reads the element's rect each frame to get two things out
  of *scroll* — how fast it moved (to speed the stream up) and where it sits (to
  pick the thinking word). There is no scroll here. So the mechanism is kept —
  the stream is still the CSS animation and the script still only nudges its
  `playbackRate` — and what feeds it changes: a slow self-driven pulse and a
  timer. Same adaptation the landing already made for Pillar 1.

The remaining cards (migration, channels, stock, billing, shipping, alerts, API)
have no original to copy: on the landing those are features-deck cards with dense
mockups — full CUITs, inventory rows — built for a monitor at half a metre, and
at five metres none of it resolves. Those are drawn for this distance, with the
same vocabulary and choreographed in `src/lib/sceneTimelines.ts`.

**Colour rule:** all *text* is white, at varying opacity for hierarchy. Mint is
reserved for what isn't text — dots, wires, current, live borders, the loop's
progress ticks. On teal, mint text loses exactly the contrast that at five metres
is the difference between reading it and not.

**The motion lives in `src/lib/sceneTimelines.ts`, not in CSS.** This was CSS
`@keyframes` for a while and it looked wrong for a structural reason: with no
timeline, nothing is *sequenced*. A wire finished drawing because its `delay`
came up, not because the node before it had lit; on loop, every animation
restarted on its own clock. The landing's vizzes are GSAP timelines
(`scripts/pillar1.ts` and friends) with labels, relative offsets (`'<'`,
`'fire+=0.05'`), `stagger` and `yoyo` — that grammar is what got ported, along
with its state constants (`NODE_ON`, `CORE_ON`, `BORDER_ON`…). The one difference
is what drives them: several of the landing's hang off ScrollTrigger, and there
is no scroll here, so every one is `repeat: -1` and self-running — which is what
`initPillar1` already does over there, for the same reason.

Scene CSS is now resting state only. The two must not both animate the same
property: GSAP writes *inline* styles, so a CSS animation on the same property
wins or loses depending on which ran last.

## Scaling

The whole layout is composed on a **1080 × 1920 canvas** and then stretched:
`html { font-size: min(1.481vw, 0.833dvh) }` makes `1rem` = 16 canvas px, so on
the 4K panel `1rem` becomes 32 px and nothing moves relative to anything else.
It is `min()` and not plain `vh` so a screen that is not exactly 9:16 shrinks on
the side that has slack instead of cropping.

Everything is sized in `rem` for that reason. The one deliberate exception is
`EntryEditor.css`, which is in `px` — that panel is operated from a laptop at
half a metre, not read from across a room, so doubling it on a 4K screen would
be wrong.

## Brand

The design system is ported from the landing (`teselly/src/apps/landing`), not
reinvented:

- **Colour tokens** in `src/index.css` carry the same values as the landing's
  `@theme` block in `styles/global.css`. If a teal changes there, change it here.
- **Fonts** — Inter Variable (`@fontsource-variable/inter`) and Aktiv Grotesk
  600/700, self-hosted from `public/fonts/`, same as the landing.
- **`HexField`** is the landing's hexagonal lattice (`scripts/hexField.ts`) —
  same geometry, same three depth bands, same radial thinning, and the same tile
  ignition (`HOT_*` and `GLOW_PEAK` are copied verbatim). Rewritten without GSAP
  because there is no scroll here to drive it; the bands drift on `@keyframes`.
  What differs is the *trigger*: on the landing a tile lights under the pointer,
  and here there is no pointer, so a timer picks one at random, one at a time.
  Because cooling takes far longer than lighting (0.85 s against 0.13 s), within
  seconds there are always a few fading behind the one that just caught, and the
  field twinkles slowly rather than blinking.
- **Copy** in `src/lib/content.ts` comes from the landing's Spanish dictionary
  (`i18n/es/`), shortened to one line per card because it is read from five
  metres and out of the corner of the eye. It is **copied, not imported** —
  separate repo, separate bundle. That is the one manual sync in the piece.
  Sources: `whereWeShine.pillars`, `migration`, `featuresDeck.modules`,
  `whereWeShine.viz3.thinking`. Art: `public/howitworks/step*.png` and
  `public/brands/*` come straight from the landing.
- **The wheel is the one thing that does *not* use the app palette**, and that's
  deliberate. Everything else is Teselly teal because everything else is the
  brand talking. The wheel isn't: it's a fairground game on a stand competing for
  the attention of someone walking past. Painted in the app's teal ramp it was
  correct, sober and completely invisible at five metres — eight shades of one
  colour on a background of that same colour read as a grey disc. So it uses the
  landing's *warm accents* (`#ffae40`, `#ffd27a`, `#ff6a1e`, `#ffa593` — the same
  ones that mark states and alerts over there) alternating with the light teals.
  Still brand colours; what changes is the proportion. The hub is white with the
  tesela cut out of it in `#1C5D65`.

## Running it

- **Space** spins, from anywhere — the TV is metres away and nobody is going to
  hit a button. Space also dismisses the winner straight into the next spin.
  There is no on-screen prompt for it: the button still exists on the hub for
  keyboard and screen-reader users, but it is invisible.
- **E** opens the loading panel, where the prizes are set up before the event.
  Escape closes it. While it is open the space bar does not spin, because
  somebody is typing.
- The winner announcement is a **sign, not a dialog** — no buttons, no key hint.
  Space closes it and re-spins in one gesture, which is the same gesture that
  spins the wheel; offering a Cerrar, a Girar de nuevo and a caption explaining
  the key was three routes to something already done with a thumb, on a screen
  nobody can reach. It also **returns to rest on its own after 20 seconds**: the
  first person who wins and walks off would otherwise leave the screen frozen on
  a card until somebody touched it.
- Up to 60 prizes, saved in the browser. Every prize gets an equal slice, so the
  odds are always even. Long names shrink, then ellipsize, and are finally capped
  with SVG `textLength` so they can never run under the hub — the character-width
  estimate alone is an estimate, and it was wrong often enough to matter.

## How the spin works

The wheel takes a **run-up**: it rolls back 17° over the first 12% of the spin,
then accelerates from a standstill, then decays over a long tail — 9.4 s in
total. The old curve was `1 - (1-t)^3.7`, whose derivative is *highest* at t=0,
so the wheel snapped to full speed between one frame and the next. That is what
felt instantaneous: not the duration, the missing start. The acceleration segment
integrates a linear velocity ramp (`w²/2L` while accelerating, `w - L/2` after),
which joins with a continuous derivative so there is no jolt where it stops
accelerating. Both ends stay pinned at `ease(0) = 0` and `ease(1) = 1` — that
isn't cosmetic, since the final angle was computed backwards to put the winning
segment under the pointer, and a curve that doesn't land exactly on 1 stops
somewhere else and makes the announcement a lie. The run-up is *subtracted from
the position*, not folded into the curve, for the same reason.

`useSpin` animates frame by frame rather than with a CSS transition, because two
other things read the wheel's live angular velocity:

- The **pointer** is deflected by each peg it passes and springs back when the
  peg slips by — so it flutters at speed and visibly clicks over one peg at a
  time at the end.
- The **marquee bulbs** chase around the rim at a rate taken from the rotation
  itself, so the light slows down exactly as the wheel does.

The wheel is drawn **flat** — solid colour and one-pixel edges. It used to carry
the fairground version's radial-gradient hub and pointer, drop shadows, and a
varnish sheen over each segment: three relief tricks stuck onto a face that is
flat and a brand that is flat, and that clash is what read as fake.

The winner is chosen first, with a rejection-sampled `crypto` random so every
prize is equally likely, and the final angle is computed backwards from it —
landing the chosen segment under the pointer with a small random offset so the
wheel does not always stop dead centre. `yarn test` checks that what the
announcement says is always the segment actually sitting under the pointer.

Because the wheel repaints ~60×/second, the three bands that do **not** depend on
the spin (`HexField`, `Masthead`, `Showreel`) are wrapped in `memo`. Without it
every frame rebuilds the ~1200-tile background.

## Layout

```
src/
  components/   Masthead · Wheel (SVG face, marquee, pointer)
                Showreel (the loop) · Scenes (the ten animated cards)
                HexField (brand background) · WinnerReveal · EntryEditor
                TesellyLogo (inline mark + wordmark)
  hooks/        useSpin (the frame loop), useEntries, useSound, usePersisted
  lib/          geometry (angles and slice paths), palette, random, content
public/         fonts/ · brands/ · howitworks/ · logo-horizontal.svg  (from the landing)
```

## Reduced motion

This piece deliberately does **not** carry the usual blanket
`animation-duration: 1ms !important` override. On a page that sweep is right:
animation decorates content that reads fine standing still. Here the motion *is*
the content — the bottom band is a video, the mosaic breathes, the wheel spins.
With the sweep in place all of it freezes on its last frame: scenes appear
already finished, the AI lanes stick mid-travel, and the thinking phrases land on
their final keyframe, which is invisible. It doesn't look calmer, it looks
broken — and it only takes the TV's player shipping with the preference on (a
number of kiosk builds do) for that to be what runs all day. The landing made the
same call for its brand marquee.

What reduced motion *does* still switch off is what the preference exists for:
the winner celebration's bulb flash (~4 Hz, photosensitivity territory) and the
long spin, which `useSpin` already shortens to 900 ms on its own. See the note at
the bottom of `src/index.css`.
