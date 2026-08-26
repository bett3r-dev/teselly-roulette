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

/** Lo más grande que se deja crecer una etiqueta. */
const MAX_SIZE = 9.4
/** Cuántos renglones se permiten como mucho. */
const MAX_LINES = 3
/** Alto de renglón, en múltiplos del cuerpo. */
const LINE_H = 1.06

/**
 * Parte la etiqueta en `lines` renglones dejándolos lo más parejos posible.
 *
 * Prueba todos los cortes posibles y se queda con el que deja el renglón más
 * largo lo más corto posible — que es exactamente lo que decide el tamaño de
 * letra. Los premios tienen dos, tres o cuatro palabras, así que son un puñado
 * de combinaciones y no hace falta nada más astuto.
 */
function wrap(label: string, lines: number): string[] | null {
  const words = label.split(/\s+/).filter(Boolean)
  if (words.length < lines) return null
  const cortes = words.length - 1
  let best: string[] | null = null

  const elegir = (desde: number, puestos: number[]) => {
    if (puestos.length === lines - 1) {
      const partes: string[] = []
      let prev = 0
      for (const g of puestos) {
        partes.push(words.slice(prev, g + 1).join(' '))
        prev = g + 1
      }
      partes.push(words.slice(prev).join(' '))
      const largo = (ps: string[]) => Math.max(...ps.map((x) => x.length))
      if (!best || largo(partes) < largo(best)) best = partes
      return
    }
    for (let g = desde; g < cortes; g++) elegir(g + 1, [...puestos, g])
  }

  elegir(0, [])
  return best
}

/**
 * Cuánto puede medir la letra y en cuántos renglones.
 *
 * El límite NO es el ancho del gajo —con siete premios sobra— sino el RADIO: hay
 * 58 unidades entre el borde y el cubo, y en un solo renglón «25% descuento 6
 * meses» tenía que achicarse hasta que ya no entraba y terminaba con puntos
 * suspensivos. En dos o tres renglones el renglón más largo es la mitad o un
 * tercio, así que la letra queda MÁS GRANDE y entera.
 *
 * Se prueban una, dos y tres líneas y gana la que permite la letra más grande;
 * a igualdad, la de menos renglones.
 */
function fitLabel(label: string, segmentAngle: number) {
  const arc = (segmentAngle * Math.PI * 55) / 180
  let best = { size: 0, lines: [label] as string[] }

  for (let n = 1; n <= MAX_LINES; n++) {
    const parts = n === 1 ? [label] : wrap(label, n)
    if (!parts) continue
    const largest = Math.max(...parts.map((p) => p.length))
    // Por el radio disponible, y por el ancho del gajo con los renglones apilados.
    const size = Math.min(MAX_SIZE, RUN / (largest * CHAR), (arc * 0.62) / (n * LINE_H))
    if (size > best.size + 0.01) best = { size, lines: parts }
  }

  /*
   * El tope duro. `CHAR` estima, y una estimación se equivoca — por eso alguna
   * etiqueta terminaba abajo del cubo. Al renglón que queda pegado al límite se
   * le pasa además un `textLength`, que obliga al navegador a que el ancho REAL
   * sea el disponible. Deja de ser una cuenta y pasa a ser una garantía.
   *
   * Sólo a ése: aplicado a todos, `textLength` también ESTIRA los renglones
   * cortos hasta el borde del cubo, que es el defecto opuesto.
   */
  const cap = (line: string) => (line.length * best.size * CHAR > RUN * 0.92 ? RUN : undefined)

  return { size: best.size, lines: best.lines, cap }
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
        const { size, lines, cap } = fitLabel(entry.label, segment)
        const won = entry.id === winnerId
        // Las etiquetas pasadas las 6 se dan vuelta, así todas se leen derechas.
        const flipped = middle > 180
        const x = flipped ? -(FACE - 12) : FACE - 12
        return (
          <g key={entry.id} className={won ? 'seg seg--won' : 'seg'}>
            <path d={slicePath(start, start + segment, FACE)} fill={entry.color} />
            <g transform={`rotate(${middle - 90 + (flipped ? 180 : 0)})`}>
              <text
                className="seg__label"
                x={x}
                y={0}
                fontSize={size}
                fill={inkOn(entry.color)}
                textAnchor={flipped ? 'start' : 'end'}
                dominantBaseline="central"
              >
                {lines.map((line, li) => (
                  <tspan
                    key={line}
                    x={x}
                    dy={li === 0 ? `${(-(lines.length - 1) * LINE_H) / 2}em` : `${LINE_H}em`}
                    textLength={cap(line)}
                    lengthAdjust={cap(line) ? 'spacingAndGlyphs' : undefined}
                  >
                    {line}
                  </tspan>
                ))}
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
