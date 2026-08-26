import { memo } from 'react'
import { polar, slicePath } from '../lib/geometry'
import { inkOn } from '../lib/palette'
import type { Entry } from '../types'
import './Wheel.css'

const FACE = 100 // radio de la cara esmaltada, en unidades del viewBox
const PEG = 104 // las clavijas van sobre el aro
const BULB_RING = 115
const BULB_COUNT = 36
const BULB_GAP = 12 // grados que se dejan libres arriba para el soporte del puntero
const MAX_DEFLECT = 17 // grados que el puntero es empujado antes de zafar de una clavija
const HUB = 24 // radio del cubo — algo más grande que antes, para que entre la tesela

/** Las luces saltean el arco de abajo del puntero, como una marquesina real. */
const BULBS = Array.from({ length: BULB_COUNT }, (_, i) => (i * 360) / BULB_COUNT).filter(
  (a) => Math.min(a, 360 - a) > BULB_GAP,
)

/** Aire entre el final de una etiqueta y el borde del cubo. */
const HUB_CLEAR = 6
const RUN = FACE - 12 - HUB - HUB_CLEAR // espacio radial para una etiqueta
/**
 * Ancho medio de glifo de Inter 700, en ems. Estaba en 0.5, que es el promedio
 * de una minúscula: cualquier premio con mayúsculas o con "M"/"W" medía más de
 * lo estimado y se metía abajo del cubo. 0.58 es el promedio real de texto mixto
 * — y como sigue siendo una ESTIMACIÓN, abajo hay además un tope duro.
 */
const CHAR = 0.58

/**
 * Tipografía tan grande como la dejen sus vecinas, y después encogida (no
 * cortada) para entrar en el radio — un nombre largo pierde tamaño antes que
 * letras.
 */
function fitLabel(label: string, segmentAngle: number) {
  const arc = (segmentAngle * Math.PI * 55) / 180
  let size = Math.max(3.2, Math.min(9.4, arc * 0.6))

  const needed = label.length * size * CHAR
  const tight = needed > RUN
  if (tight) size = Math.max(size * 0.6, RUN / (label.length * CHAR))

  const maxChars = Math.floor(RUN / (size * CHAR))
  const text =
    label.length > maxChars ? `${label.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : label

  /**
   * El tope duro. `CHAR` estima, y una estimación se equivoca — por eso el texto
   * terminaba a veces abajo del cubo. Cuando hubo que encoger (o sea, cuando el
   * premio ya venía largo) se le pasa además un `textLength`, que obliga al
   * navegador a que el ancho REAL sea exactamente el disponible. Deja de ser una
   * cuenta y pasa a ser una garantía.
   *
   * Sólo en ese caso: aplicado siempre, `textLength` también ESTIRA los nombres
   * cortos hasta el borde del cubo, que es el defecto opuesto.
   */
  return { size, text, cap: tight ? RUN : undefined }
}

const Face = memo(function Face({
  entries,
  winnerId,
}: {
  entries: Entry[]
  winnerId: string | null
}) {
  const segment = 360 / entries.length

  return (
    <g>
      {entries.map((entry, i) => {
        const start = i * segment
        const middle = start + segment / 2
        const { size, text, cap } = fitLabel(entry.label, segment)
        const won = entry.id === winnerId
        // Las etiquetas pasadas las 6 se dan vuelta, así todas se leen derechas.
        const flipped = middle > 180
        return (
          <g key={entry.id} className={won ? 'seg seg--won' : 'seg'}>
            <path d={slicePath(start, start + segment, FACE)} fill={entry.color} />
            <g transform={`rotate(${middle - 90 + (flipped ? 180 : 0)})`}>
              <text
                className="seg__label"
                x={flipped ? -(FACE - 12) : FACE - 12}
                y={0}
                fontSize={size}
                fill={inkOn(entry.color)}
                textAnchor={flipped ? 'start' : 'end'}
                dominantBaseline="central"
                textLength={cap}
                lengthAdjust={cap ? 'spacingAndGlyphs' : undefined}
              >
                {text}
              </text>
            </g>
          </g>
        )
      })}

      {/* Los filos entre gajos, dibujados después de los rellenos para que queden limpios. */}
      {entries.length > 1 &&
        entries.map((entry, i) => {
          const p = polar(i * segment, FACE)
          return <line key={`r${entry.id}`} className="seg__rule" x1={0} y1={0} x2={p.x} y2={p.y} />
        })}

      {/* Clavijas — lo que cuenta el puntero. */}
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

export function Wheel({
  entries,
  rotation,
  velocity,
  spinning,
  winnerId,
  celebrating,
  onSpin,
}: Props) {
  const count = Math.max(entries.length, 1)
  const segment = 360 / count

  // Dónde está la rueda entre dos clavijas: 0 es una pasando, 1 es la próxima llegando.
  const phase = (((rotation / segment) % 1) + 1) % 1
  const speed = Math.min(Math.abs(velocity) / 700, 1)
  const push = phase > 0.72 ? (phase - 0.72) / 0.28 : 0
  const rebound = -Math.sin(phase * 42) * Math.exp(-phase * 13) * speed * 5
  const deflection = push * MAX_DEFLECT + rebound

  // La persecución se lee de la rotación misma, así que frena junto con ella.
  const chase = Math.floor(rotation / 9)

  return (
    <div className={`wheel${celebrating ? ' wheel--celebrating' : ''}`}>
      <svg
        className="wheel__svg"
        viewBox="-134 -134 268 268"
        role="img"
        aria-label={`Ruleta con ${entries.length} premios`}
      >
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

        <circle className="wheel__hubplate" r={HUB} />

        {/* La tesela de Teselly en el cubo. Fuera del grupo que rota: la marca se
            queda firme mientras la rueda gira alrededor. El viewBox del logo es
            104.44 × 120.6, así que se escala por el alto y se centra a mano. */}
        <g
          className="wheel__mark"
          transform={`translate(${-(HUB * 1.06 * 104.44) / 120.6 / 2}, ${-(HUB * 1.06) / 2}) scale(${(HUB * 1.06) / 120.6})`}
        >
          <polygon
            fill="#1C5D65"
            points="104.44 71.8 86.79 81.56 87.46 100.25 104.44 90.45 104.44 71.8"
          />
          <polygon
            fill="#1C5D65"
            points="80.59 51.06 59 64.12 59 97.47 36.51 111.53 52.22 120.6 74.17 107.93 72.94 73.73 97.24 60.29 80.59 51.06"
          />
          <polygon
            fill="#1C5D65"
            points="0 30.15 0 56.25 30.13 72.45 30.13 99.53 45.44 89.96 45.44 64.17 16.57 47.09 16.57 20.58 0 30.15"
          />
          <polygon fill="#1C5D65" points="0 71.64 0 90.45 16.57 100.02 16.57 80.55 0 71.64" />
          <polygon fill="#1C5D65" points="52.22 18.13 67.69 8.93 52.22 0 36.76 8.93 52.22 18.13" />
          <polygon
            fill="#1C5D65"
            points="104.44 48.79 104.44 30.15 81.14 16.7 52.22 33.9 30.13 20.76 30.13 39.36 52.18 52.4 80.29 35.39 104.44 48.79"
          />
        </g>

        <g className="pointer" transform={`rotate(${deflection}, 0, -124)`}>
          <path className="pointer__blade" d="M -9 -126 L 9 -126 L 5 -106 L 0 -94 L -5 -106 Z" />
          <circle className="pointer__pin" cx="0" cy="-125" r="5.4" />
        </g>
      </svg>

      {/* Sigue existiendo como control real (teclado, lector de pantalla) aunque
          en el televisor no lo apriete nadie: ahí se gira con la barra. */}
      <button
        className="spin"
        type="button"
        onClick={onSpin}
        disabled={spinning || entries.length === 0}
        aria-label={spinning ? 'Girando' : 'Girar la ruleta'}
      >
        Girar
      </button>
    </div>
  )
}
