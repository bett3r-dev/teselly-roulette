import { memo } from 'react'
import { polar, slicePath } from '../lib/geometry'
import { inkOn } from '../lib/palette'
import type { Entry } from '../types'
import './Wheel.css'

const FACE = 100 // enamel face radius, in viewBox units
const PEG = 104 // pegs sit on the brass rim
const BULB_RING = 115
const BULB_COUNT = 36
const BULB_GAP = 12 // degrees kept clear at the top for the pointer bracket
const MAX_DEFLECT = 17 // degrees the flapper is pushed before it slips off a peg

/** Bulbs skip the arc under the pointer bracket, the way a real marquee does. */
const BULBS = Array.from({ length: BULB_COUNT }, (_, i) => (i * 360) / BULB_COUNT).filter(
  (a) => Math.min(a, 360 - a) > BULB_GAP,
)

const RUN = FACE - 12 - 21 // radial space for a label: rim inset to hub
const CHAR = 0.42 // average glyph width of the condensed label face, in ems

/**
 * Type as large as its neighbours allow, then shrunk (not cut) to fit the
 * radial run — a long name loses size before it loses letters.
 */
function fitLabel(label: string, segmentAngle: number) {
  const arc = (segmentAngle * Math.PI * 55) / 180
  let size = Math.max(3.2, Math.min(9.4, arc * 0.6))

  const needed = label.length * size * CHAR
  if (needed > RUN) size = Math.max(size * 0.6, RUN / (label.length * CHAR))

  const maxChars = Math.floor(RUN / (size * CHAR))
  const text =
    label.length > maxChars ? `${label.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : label
  return { size, text }
}

const Face = memo(function Face({ entries, winnerId }: { entries: Entry[]; winnerId: string | null }) {
  const segment = 360 / entries.length

  return (
    <g>
      {entries.map((entry, i) => {
        const start = i * segment
        const middle = start + segment / 2
        const { size, text } = fitLabel(entry.label, segment)
        const won = entry.id === winnerId
        // Labels past 6 o'clock are turned over so every one of them reads upright.
        const flipped = middle > 180
        return (
          <g key={entry.id} className={won ? 'seg seg--won' : 'seg'}>
            <path d={slicePath(start, start + segment, FACE)} fill={entry.color} />
            <path d={slicePath(start, start + segment, FACE)} fill="url(#sheen)" />
            <g transform={`rotate(${middle - 90 + (flipped ? 180 : 0)})`}>
              <text
                className="seg__label"
                x={flipped ? -(FACE - 12) : FACE - 12}
                y={0}
                fontSize={size}
                fill={inkOn(entry.color)}
                textAnchor={flipped ? 'start' : 'end'}
                dominantBaseline="central"
              >
                {text}
              </text>
            </g>
          </g>
        )
      })}

      {/* Hairlines between segments, drawn after the fills so they stay crisp. */}
      {entries.length > 1 &&
        entries.map((entry, i) => {
          const p = polar(i * segment, FACE)
          return <line key={`r${entry.id}`} className="seg__rule" x1={0} y1={0} x2={p.x} y2={p.y} />
        })}

      {/* Pegs — what the flapper counts. */}
      {entries.map((entry, i) => {
        const p = polar(i * segment, PEG)
        return <circle key={`p${entry.id}`} className="peg" cx={p.x} cy={p.y} r={2.6} />
      })}
    </g>
  )
})

type Props = {
  entries: Entry[]
  rotation: number
  velocity: number
  spinning: boolean
  winnerId: string | null
  celebrating: boolean
  onSpin: () => void
}

export function Wheel({ entries, rotation, velocity, spinning, winnerId, celebrating, onSpin }: Props) {
  const count = Math.max(entries.length, 1)
  const segment = 360 / count

  // Where the wheel sits between two pegs: 0 is a peg passing, 1 is the next one arriving.
  const phase = (((rotation / segment) % 1) + 1) % 1
  const speed = Math.min(Math.abs(velocity) / 700, 1)
  const push = phase > 0.72 ? (phase - 0.72) / 0.28 : 0
  const rebound = -Math.sin(phase * 42) * Math.exp(-phase * 13) * speed * 5
  const deflection = push * MAX_DEFLECT + rebound

  // The chase is read straight off the wheel's own rotation, so it slows with it.
  const chase = Math.floor(rotation / 9)

  return (
    <div className={`wheel${celebrating ? ' wheel--celebrating' : ''}`}>
      <svg className="wheel__svg" viewBox="-134 -134 268 268" role="img" aria-label={`Wheel with ${entries.length} entries`}>
        <defs>
          <radialGradient id="sheen" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="62%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.24" />
          </radialGradient>
          <radialGradient id="hub" cx="0.36" cy="0.3" r="0.85">
            <stop offset="0%" stopColor="#FBE3A8" />
            <stop offset="55%" stopColor="#CE9A2F" />
            <stop offset="100%" stopColor="#7A5312" />
          </radialGradient>
        </defs>

        <g className={`bulbs${spinning ? '' : ' bulbs--idle'}`}>
          {BULBS.map((angle, i) => {
            const p = polar(angle, BULB_RING)
            const lit = spinning ? (i + chase) % 3 === 0 : false
            return (
              <circle
                key={angle}
                className={`bulb${lit ? ' bulb--lit' : ''}`}
                style={{ animationDelay: `${(i / BULBS.length) * -1.8}s` }}
                cx={p.x}
                cy={p.y}
                r={3.6}
              />
            )
          })}
        </g>

        <circle className="wheel__rim" r={(FACE + PEG + 4) / 2} strokeWidth={PEG + 4 - FACE} />
        <circle className="wheel__shadow" r={FACE} />

        <g className="wheel__face" transform={`rotate(${rotation})`}>
          {entries.length > 0 ? (
            <Face entries={entries} winnerId={winnerId} />
          ) : (
            <circle className="wheel__blank" r={FACE} />
          )}
        </g>

        <circle className="wheel__hubplate" r={21} fill="url(#hub)" />

        <g className="pointer" transform={`rotate(${deflection}, 0, -124)`}>
          <path
            className="pointer__blade"
            d="M -9 -126 L 9 -126 L 5 -106 L 0 -94 L -5 -106 Z"
            fill="url(#hub)"
          />
          <circle className="pointer__pin" cx="0" cy="-125" r="5.4" fill="url(#hub)" />
        </g>
      </svg>

      <button
        className="spin"
        type="button"
        onClick={onSpin}
        disabled={spinning || entries.length === 0}
        aria-label={spinning ? 'Spinning' : 'Spin the wheel'}
      >
        <span className="spin__word">{spinning ? '···' : 'Spin'}</span>
      </button>
    </div>
  )
}
