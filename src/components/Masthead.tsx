import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TesellyLogo } from './TesellyLogo'
import './Masthead.css'

/** Cuántas bombitas bordean el cartel. */
const BULBS = 34

/**
 * Los patrones que rota el cartel. Cada uno decide, dado el número de bombita y
 * el paso del reloj, si esa bombita está encendida.
 *
 * Rotarlos es lo que hace que el cartel no se lea como un GIF: un solo patrón,
 * por bueno que sea, a los veinte segundos ya es previsible. Van del más
 * ordenado al más nervioso y vuelven a empezar.
 */
const PATTERNS: { name: string; ms: number; on: (i: number, step: number, n: number) => boolean }[] =
  [
    // La ronda clásica: tres encendidas girando.
    { name: 'ronda', ms: 90, on: (i, step) => (i + step) % 3 === 0 },
    // Pares e impares alternándose.
    { name: 'alterna', ms: 380, on: (i, step) => (i + step) % 2 === 0 },
    // Todas juntas, como un cartel de neón que late.
    { name: 'latido', ms: 300, on: (_i, step) => step % 2 === 0 },
    // Dos frentes que salen del medio hacia los costados.
    {
      name: 'apertura',
      ms: 110,
      on: (i, step, n) => Math.abs(((i + n / 2) % n) - n / 2) % 8 === step % 8,
    },
    // Chispazo: casi todas prendidas, algunas cayéndose.
    { name: 'chispa', ms: 140, on: (i, step) => (i * 7 + step * 3) % 11 > 2 },
  ]

/** Cuánto dura cada patrón antes de pasar al siguiente. */
const PATTERN_MS = 5200

/**
 * Reparte `count` puntos por el perímetro de una pastilla de `w × h`.
 *
 * Se calcula acá y no en CSS porque una pastilla es dos rectas más dos
 * semicírculos, y ubicar algo sobre ese contorno necesita trigonometría de
 * verdad. La primera versión ponía bombitas sólo en los dos cantos rectos
 * justamente para esquivar esta cuenta; hacerla bien es media pantalla de código
 * y el cartel queda bordeado entero, que es como es un cartel de feria.
 */
function pillPoints(w: number, h: number, count: number) {
  const r = h / 2
  const straight = Math.max(w - h, 0) // el largo de cada canto recto
  const arc = Math.PI * r // media vuelta de cada extremo
  const total = 2 * straight + 2 * arc
  if (total <= 0) return []

  return Array.from({ length: count }, (_, i) => {
    // Se arranca en la esquina superior izquierda y se recorre en sentido horario.
    let d = (i / count) * total
    if (d < straight) return { x: r + d, y: 0 } // canto de arriba
    d -= straight
    if (d < arc) {
      // Extremo derecho: de las 12 a las 6, pasando por las 3.
      const a = (d / arc) * Math.PI - Math.PI / 2
      return { x: w - r + r * Math.cos(a), y: r + r * Math.sin(a) }
    }
    d -= arc
    if (d < straight) return { x: w - r - d, y: h } // canto de abajo
    d -= straight
    // Extremo izquierdo: de las 6 a las 12, pasando por las 9.
    const a = (d / arc) * Math.PI + Math.PI / 2
    return { x: r + r * Math.cos(a), y: r + r * Math.sin(a) }
  })
}

/**
 * FRANJA 1 — la marca a la izquierda, la invitación a la derecha.
 *
 * "Girá y ganá" es un CARTEL DE FERIA: bombitas por todo el borde y el letrero
 * titilando cada tanto como un tubo que arranca. Es el único lugar de la pieza
 * donde la marca se permite eso, y es el correcto: es la parte que tiene que
 * hacer que alguien cruce el pasillo.
 *
 * `memo` por lo mismo que HexField: la rueda re-renderiza `App` en cada cuadro
 * del giro, y esta franja no depende de nada de eso.
 */
export const Masthead = memo(function Masthead() {
  const sign = useRef<HTMLDivElement>(null)
  const bulbs = useRef<HTMLSpanElement>(null)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])

  // El contorno depende del tamaño real del cartel, que cambia con la escala de
  // la pieza (`rem` atado al viewport). Se remide con ResizeObserver en vez de
  // calcularlo una vez: en el televisor esto se monta antes de que las fuentes
  // terminen de cargar, y el cartel crece cuando llegan.
  useLayoutEffect(() => {
    const el = sign.current
    if (!el) return

    /**
     * El tamaño anterior, para NO volver a medir si no cambió.
     *
     * Sin esta guarda esto es un bucle infinito y de los caros: medir llama a
     * `setPoints`, `setPoints` re-renderiza, el re-render dispara al
     * ResizeObserver otra vez —alcanza una diferencia de un subpíxel— y vuelta a
     * empezar, con el hilo principal al mango. Redondear antes de comparar es lo
     * que corta la realimentación.
     */
    let last = ''

    const measure = () => {
      // `offsetWidth/Height` y no `getBoundingClientRect`: el rect viene con
      // todos los `transform` de los ancestros aplicados, y estas medidas se
      // vuelven a escribir como `left`/`top` en px SIN escalar. Con un ancestro
      // escalado las bombitas se amontonaban en una esquina. El offset es la
      // medida de layout, que es la que corresponde.
      const width = el.offsetWidth
      const height = el.offsetHeight
      const key = `${Math.round(width)}x${Math.round(height)}`
      if (key === last || width < 1) return
      last = key
      setPoints(pillPoints(width, height, BULBS))
    }

    measure()
    if (typeof ResizeObserver !== 'function') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // El reloj de las luces. Toca clases directo sobre el DOM y no estado de React:
  // son 34 nodos cambiando varias veces por segundo, y hacerlo por render sería
  // re-renderizar la franja entera diez veces por segundo para nada.
  useEffect(() => {
    const host = bulbs.current
    if (!host || !points.length) return

    let step = 0
    let pattern = 0
    let tick: ReturnType<typeof setInterval>

    const run = () => {
      const p = PATTERNS[pattern]
      clearInterval(tick)
      tick = setInterval(() => {
        step += 1
        const els = host.children
        for (let i = 0; i < els.length; i++) {
          els[i].classList.toggle('is-on', p.on(i, step, els.length))
        }
      }, p.ms)
    }

    run()
    const swap = setInterval(() => {
      pattern = (pattern + 1) % PATTERNS.length
      step = 0
      run()
    }, PATTERN_MS)

    return () => {
      clearInterval(tick)
      clearInterval(swap)
    }
  }, [points.length])

  return (
    <header className="masthead">
      <TesellyLogo className="masthead__logo" />

      <div className="sign" ref={sign}>
        <span className="sign__bulbs" ref={bulbs} aria-hidden="true">
          {points.map((p, i) => (
            <span className="sign__bulb" key={i} style={{ left: p.x, top: p.y }} />
          ))}
        </span>
        <p className="sign__text">
          Girá y <em className="sign__win">ganá</em>
        </p>
      </div>
    </header>
  )
})
