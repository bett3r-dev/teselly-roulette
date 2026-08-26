import { useCallback, useEffect, useRef, useState } from 'react'
import { mod360, rotationForIndex } from '../lib/geometry'
import { randomFloat, randomInt } from '../lib/random'

const SPIN_MS = 9400
const REDUCED_MS = 900
const TURNS_MIN = 4
const TURNS_SPREAD = 3

/**
 * EL CULATAZO. Antes de largar, la rueda va un poco para atrás y vuelve — el
 * gesto de tomar impulso. Son grados fijos y no una fracción del recorrido,
 * porque el recorrido cambia con la cantidad de vueltas y esto tiene que
 * sentirse igual siempre.
 */
const WIND_DEG = 17
/** Qué parte del giro se lleva el culatazo. Durante ese tramo `ease` vale 0. */
const WIND_T = 0.12
/** Y cuánto tarda en llegar a velocidad de crucero una vez que largó. */
const LAUNCH = 0.17

/**
 * La curva del giro.
 *
 * La anterior era `1 - (1-t)^3.7`: su derivada en t=0 es máxima, o sea que la
 * rueda arrancaba a plena velocidad de un fotograma al otro. Eso es lo que se
 * sentía instantáneo — no era la duración, era que no había arranque.
 *
 * Ésta tiene tres tramos: el culatazo (quieta, mientras el offset la lleva para
 * atrás), una ACELERACIÓN desde cero, y la caída larga de siempre. El truco del
 * medio es integrar una rampa lineal de velocidad — `w²/2L` mientras acelera y
 * `w - L/2` después — que empalma con derivada continua, así que no hay ningún
 * tirón en el punto donde deja de acelerar.
 *
 * Los dos extremos están clavados: `ease(0) = 0` y `ease(1) = 1`. Eso no es
 * cosmético — el ángulo final lo calculó `rotationForIndex` para dejar el gajo
 * ganador bajo el puntero, y si la curva no termina exacto en 1 la rueda para
 * en cualquier lado y el anuncio miente.
 */
const ease = (t: number) => {
  if (t <= WIND_T) return 0
  const w = (t - WIND_T) / (1 - WIND_T)
  const acc = LAUNCH / 2
  const u = w < LAUNCH ? (w * w) / (2 * LAUNCH) : w - acc
  return 1 - (1 - u / (1 - acc)) ** 3.4
}

/**
 * Cuánto se corrió para atrás en este instante. Sube y baja en medio seno, así
 * que a `WIND_T` vale exactamente 0 y el giro sigue desde donde salió.
 */
const windUp = (t: number) => (t >= WIND_T ? 0 : WIND_DEG * Math.sin((t / WIND_T) * Math.PI))

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

type Options = {
  /** Fired once per peg that passes the pointer, with the live speed in deg/s. */
  onPeg?: (velocity: number) => void
  onSettle?: (index: number) => void
}

/**
 * Drives the wheel frame by frame rather than with a CSS transition, because
 * the pointer and the marquee bulbs both read the live angular velocity.
 */
export function useSpin({ onPeg, onSettle }: Options = {}) {
  const [rotation, setRotation] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [spinning, setSpinning] = useState(false)

  const frame = useRef(0)
  const rotationRef = useRef(0)
  const spinningRef = useRef(false)
  const handlers = useRef({ onPeg, onSettle })
  handlers.current = { onPeg, onSettle }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const spin = useCallback((count: number) => {
    if (spinningRef.current || count < 1) return

    const winner = randomInt(count)
    const turns = TURNS_MIN + randomInt(TURNS_SPREAD + 1)
    const from = rotationRef.current
    const to = rotationForIndex(winner, count, from, turns, randomFloat() - 0.5)
    const segment = 360 / count
    const duration = prefersReducedMotion() ? REDUCED_MS : SPIN_MS
    const startedAt = performance.now()

    let previous = from
    let previousAt = startedAt
    spinningRef.current = true
    setSpinning(true)

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      // El culatazo se RESTA de la posición y no forma parte de `ease`: así la
      // curva sigue llegando limpia a 1 y el aterrizaje no se toca.
      const next = from + (to - from) * ease(t) - windUp(t)
      const dt = Math.max(now - previousAt, 1) / 1000
      const speed = (next - previous) / dt

      if (Math.floor(next / segment) !== Math.floor(previous / segment)) {
        handlers.current.onPeg?.(speed)
      }

      previous = next
      previousAt = now
      rotationRef.current = next
      setRotation(next)
      setVelocity(speed)

      if (t < 1) {
        frame.current = requestAnimationFrame(step)
        return
      }
      rotationRef.current = mod360(to)
      setRotation(mod360(to))
      setVelocity(0)
      spinningRef.current = false
      setSpinning(false)
      handlers.current.onSettle?.(winner)
    }

    frame.current = requestAnimationFrame(step)
  }, [])

  return { rotation, velocity, spinning, spin }
}
