import { useCallback, useEffect, useRef, useState } from 'react'
import { mod360, rotationForIndex } from '../lib/geometry'
import { randomFloat, randomInt } from '../lib/random'

const SPIN_MS = 6400
const REDUCED_MS = 900
const TURNS_MIN = 4
const TURNS_SPREAD = 3

/** Quick launch, long settle — the shape of a heavy wheel losing its momentum. */
const ease = (t: number) => 1 - (1 - t) ** 3.7

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
      const next = from + (to - from) * ease(t)
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
