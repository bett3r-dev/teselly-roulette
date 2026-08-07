import { useCallback, useRef } from 'react'

/**
 * Everything the wheel makes noise with is synthesised — no audio files, and
 * nothing starts until the first click, which is also the gesture that unlocks
 * playback in the browser.
 */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const context = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  /** The flapper hitting a peg. Faster wheel, brighter and louder click. */
  const peg = useCallback(
    (velocity: number) => {
      if (!enabled) return
      const ctx = context()
      if (!ctx) return

      const speed = Math.min(Math.abs(velocity) / 900, 1)
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const tone = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(760 + speed * 900, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05)
      tone.type = 'bandpass'
      tone.frequency.value = 1800
      tone.Q.value = 1.2
      gain.gain.setValueAtTime(0.05 + speed * 0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)

      osc.connect(tone).connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    },
    [context, enabled],
  )

  /** Four notes up, for the reveal. Short enough to talk over. */
  const fanfare = useCallback(() => {
    if (!enabled) return
    const ctx = context()
    if (!ctx) return

    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const at = now + i * 0.085
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i === 3 ? 'sawtooth' : 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(i === 3 ? 0.16 : 0.11, at + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + (i === 3 ? 0.7 : 0.24))
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 0.75)
    })
  }, [context, enabled])

  return { peg, fanfare }
}
