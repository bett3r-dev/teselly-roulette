import { memo, useEffect, useMemo, useRef } from 'react'
import './HexField.css'

/**
 * EL CAMPO HEXAGONAL — el fondo de la marca.
 *
 * Es el mosaico de /nosotros y /roadmap (`landing/src/scripts/hexField.ts`):
 * misma geometría, mismos tres estratos de profundidad, mismo adelgazamiento
 * radial, y el MISMO encendido de tesela — los valores de `HOT_*` y `GLOW_PEAK`
 * están copiados de allá tal cual.
 *
 * Lo único que cambia es qué lo dispara. En la landing la tesela se enciende
 * bajo el puntero; acá no hay puntero: es un televisor a cinco metros. Así que
 * el mismo encendido lo dispara un temporizador que elige una tesela al azar,
 * de a una por vez. Como apagarse tarda mucho más que encenderse (0.13 s contra
 * 0.85 s), a los pocos segundos hay siempre unas cuantas enfriándose detrás de
 * la que acaba de prender, y el fondo queda titilando despacio en vez de
 * parpadeando.
 */

/** Los tres estratos. Difieren en signo además de magnitud, así el mosaico se
 *  abre en profundidad en vez de limitarse a arrastrarse. */
const BANDS = [
  { alpha: 0.3, drift: 9, dur: 17 },
  { alpha: 0.2, drift: -14, dur: 23 },
  { alpha: 0.13, drift: 21, dur: 29 },
]

/**
 * El color que toma una tesela encendida. El borde va pleno y el relleno a media
 * caña: así se lee como una tesela TEÑIDA y no como una placa de color.
 * (Idéntico a hexField.ts.)
 */
const HOT_STROKE = 'rgba(159,232,216,0.9)'
const HOT_FILL = 'rgba(159,232,216,0.7)'
/** EL dial de cuánto grita el encendido. Ver la nota larga en hexField.ts. */
const GLOW_PEAK = 0.2

/** Cada cuánto prende una tesela nueva. */
const IGNITE_MS = 420
/** Encender es inmediato; enfriarse es largo. Ese contraste ES el efecto. */
const LIGHT_MS = 130
const COOL_MS = 850

/** Lienzo de diseño + sobrebarrido, para que la deriva nunca muestre un borde. */
const VIEW_W = 1080
const VIEW_H = 1920
const OVERSCAN_X = 300
const OVERSCAN_Y = 400
const HEX_R = 54

/** Hexágono de punta arriba, la misma geometría que usa toda la marca. */
function hexPoints(cx: number, cy: number, r: number): string {
  const p: string[] = []
  for (let a = 0; a < 6; a++) {
    const ang = (Math.PI / 180) * (60 * a - 30)
    p.push(`${(cx + r * Math.cos(ang)).toFixed(2)},${(cy + r * Math.sin(ang)).toFixed(2)}`)
  }
  return p.join(' ')
}

/**
 * Pseudoaleatorio determinístico en [0,1). `Math.random()` se evita a propósito
 * para ARMAR el mosaico: tiene que ser idéntico en cada carga, o el "las piezas
 * encajando" se lee como ruido. Para ELEGIR qué tesela prende sí se usa azar
 * real — ahí lo que se quiere es justamente que no se repita.
 */
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

type Cell = {
  points: string
  opacity: number
  fill: string
  /** Vector de dispersión: cada pieza entra desde su propio ángulo y distancia. */
  dx: number
  dy: number
  rot: number
  delay: number
}

function buildField(): Cell[][] {
  const stepX = Math.sqrt(3) * HEX_R
  const stepY = 1.5 * HEX_R
  const midX = VIEW_W / 2
  const midY = VIEW_H / 2
  const maxDist = Math.hypot(midX, midY)

  const rows = Math.ceil((VIEW_H + OVERSCAN_Y) / stepY)
  const cols = Math.ceil((VIEW_W + OVERSCAN_X) / stepX)

  const bands: Cell[][] = [[], [], []]
  let i = 0

  for (let row = -4; row <= rows; row++) {
    for (let col = -2; col <= cols; col++) {
      i++
      const cx = col * stepX + (Math.abs(row % 2) === 1 ? stepX / 2 : 0)
      const cy = row * stepY
      const d = Math.min(1, Math.hypot(cx - midX, cy - midY) / maxDist)

      // Adelgazamiento radial suave: tiene que seguir leyéndose COMO teselación.
      if (rnd(i * 7.31) < 0.16 + d * 0.34) continue

      const b = Math.min(2, Math.floor(rnd(i * 4.73) * 3))
      // Unas pocas teselas plenas cerca del centro — el mosaico "prendiendo".
      const solid = b === 0 && d < 0.42 && rnd(i * 3.17) > 0.9
      const ang = rnd(i * 5.77) * Math.PI * 2
      const rad = 90 + rnd(i * 9.13) * 220

      bands[b].push({
        points: hexPoints(cx, cy, HEX_R - 1.4),
        opacity: (solid ? 0.62 : 1) * BANDS[b].alpha * (1 - d * 0.45),
        fill: solid ? 'rgba(153,195,200,0.5)' : 'rgba(159,232,216,0)',
        dx: Math.cos(ang) * rad,
        dy: Math.sin(ang) * rad,
        rot: (rnd(i * 2.29) - 0.5) * 70,
        delay: d * 0.8,
      })
    }
  }

  return bands
}

/**
 * `memo` no es una optimización de más acá: la rueda anima cuadro a cuadro y
 * hace re-renderizar a `App` unas sesenta veces por segundo mientras gira. Sin
 * esto, cada uno de esos cuadros vuelve a construir el JSX de las ~1200 teselas
 * del fondo — que no dependen de nada y no cambian nunca. El componente no
 * recibe props, así que memo lo deja renderizando exactamente una vez.
 */
export const HexField = memo(function HexField() {
  // Determinístico y sin dependencias: se arma una vez por montaje y no vuelve.
  const bands = useMemo(() => buildField(), [])
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = host.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<SVGPolygonElement>('.hexfield__cell'))
    if (!nodes.length) return
    // El encendido usa Web Animations, que es lo correcto para pisar el reposo de
    // una tesela sin tocar su CSS — pero no está en todas partes. El reproductor
    // de un televisor puede ser un WebView viejo, y ahí esto reventaría dentro de
    // un `setInterval`, o sea una vez cada 420 ms para siempre. Sin `animate` el
    // mosaico se queda quieto, que es exactamente como se veía antes de existir
    // este efecto: se pierde el titileo, no el fondo.
    if (typeof nodes[0].animate !== 'function') return

    // Los polígonos se rinden en orden de estrato, que es exactamente el orden
    // de `bands.flat()`. Emparejarlos así permite leer el reposo de cada tesela
    // de su DATO y no del estilo computado: computado devolvería el valor a
    // mitad de animación si la tesela ya estaba enfriándose, y el encendido
    // siguiente arrancaría desde ahí.
    const rest = bands.flat()

    // Web Animations y no clases: el encendido no cambia el reposo de la tesela
    // —que es distinto en cada una— sino que lo pisa un momento y se retira. Sin
    // `fill`, al terminar vuelve sola a lo que declara el CSS: cero bookkeeping.
    const ignite = () => {
      const i = Math.floor(Math.random() * nodes.length)
      const cell = nodes[i]
      const at = rest[i]
      if (!cell || !at) return
      const cold = { fill: at.fill, stroke: 'rgba(153,195,200,0.75)', opacity: at.opacity }

      cell.animate(
        [
          { offset: 0, ...cold },
          // Sube rápido y en `ease-out`: casi todo el viaje pasa en los primeros
          // cuadros, así que la tesela prende de golpe.
          //
          // `max()` y no GLOW_PEAK a secas: con el pico tan bajo, las teselas del
          // estrato de adelante (que descansan hasta en 0.3) se APAGARÍAN al
          // encenderse. Prender nunca puede restar.
          {
            offset: LIGHT_MS / (LIGHT_MS + COOL_MS),
            fill: HOT_FILL,
            stroke: HOT_STROKE,
            opacity: Math.max(at.opacity, GLOW_PEAK),
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          },
          // Y baja largo y suave: la tesela se ENFRÍA, no se apaga.
          { offset: 1, ...cold },
        ],
        { duration: LIGHT_MS + COOL_MS, easing: 'ease-out' },
      )
    }

    let timer: ReturnType<typeof setInterval> | undefined

    // El mosaico tarda ~2 s en terminar de armarse; prender antes sería encender
    // teselas que todavía están volando hacia su lugar.
    const start = setTimeout(() => {
      ignite()
      timer = setInterval(ignite, IGNITE_MS)
    }, 2200)

    return () => {
      clearTimeout(start)
      clearInterval(timer)
    }
  }, [bands])

  return (
    <div className="hexfield" aria-hidden="true" ref={host}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {bands.map((cells, b) => (
          <g
            key={b}
            className="hexfield__band"
            style={
              {
                '--drift': `${BANDS[b].drift}px`,
                '--dur': `${BANDS[b].dur}s`,
              } as React.CSSProperties
            }
          >
            {cells.map((c, i) => (
              <polygon
                key={i}
                className="hexfield__cell"
                points={c.points}
                fill={c.fill}
                stroke="rgba(153,195,200,0.75)"
                strokeWidth="1.15"
                style={
                  {
                    '--o': c.opacity,
                    '--dx': `${c.dx}px`,
                    '--dy': `${c.dy}px`,
                    '--rot': `${c.rot}deg`,
                    animationDelay: `${c.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
})
