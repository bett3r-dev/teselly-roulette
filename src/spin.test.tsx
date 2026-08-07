import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { indexAtPointer } from './lib/geometry'

let clock = 0
let frames: FrameRequestCallback[] = []

beforeEach(() => {
  localStorage.clear()
  clock = 0
  frames = []
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Element.prototype.scrollTo = () => {}
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Step the fake clock, draining one frame per tick. */
function runFrames(ms: number, step = 50) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    if (!frames.length) return
    const due = frames
    frames = []
    clock += step
    act(() => due.forEach((cb) => cb(clock)))
  }
}

const rotation = () => {
  const transform = document.querySelector('.wheel__face')!.getAttribute('transform')!
  return Number.parseFloat(/rotate\(([-\d.]+)\)/.exec(transform)![1])
}

const labels = () =>
  [...document.querySelectorAll<HTMLInputElement>('.row__label')].map((input) => input.value)

/** Entry labels leak into button names ("Remove Spin again"), so target the hub itself. */
const spinButton = () => document.querySelector<HTMLButtonElement>('.spin')!
const spin = () => fireEvent.click(spinButton())
const announced = () => document.querySelector('.reveal__name')?.textContent
const closeReveal = () => fireEvent.click(screen.getByRole('button', { name: /^close$/i }))

describe('spinning the wheel', () => {
  it('announces the entry that is actually under the pointer', () => {
    render(<App />)
    const entries = labels()
    expect(spinButton()).toHaveProperty('ariaLabel', 'Spin the wheel')

    spin()
    runFrames(8000)

    const landed = entries[indexAtPointer(rotation(), entries.length)]
    expect(announced()).toBe(landed)
  })

  it('turns clockwise the whole way, for at least four full turns', () => {
    render(<App />)
    spin()

    // Sample only while it is turning: on settle the angle is normalised back
    // under 360°, which renders identically but is not a reading of movement.
    const seen: number[] = []
    while (seen.length < 200) {
      runFrames(100, 50)
      if (screen.queryByRole('dialog')) break
      seen.push(rotation())
    }

    const reversals = seen.filter((r, i) => i > 0 && r < seen[i - 1])
    expect(reversals).toEqual([])
    expect(Math.max(...seen)).toBeGreaterThan(4 * 360)
  })

  it('lands on every entry over many spins, and only on real entries', { timeout: 30_000 }, () => {
    render(<App />)
    const entries = labels()
    const hits = new Set<string>()

    for (let i = 0; i < 80; i++) {
      spin()
      runFrames(8000, 400)
      const landed = entries[indexAtPointer(rotation(), entries.length)]
      expect(entries).toContain(landed)
      hits.add(landed)
      closeReveal()
    }

    expect(hits.size).toBe(entries.length)
  })

  it('cannot be started again while it is still turning', () => {
    render(<App />)
    spin()
    runFrames(1000)

    expect(spinButton().disabled).toBe(true)
    const midSpin = rotation()
    spin() // ignored — a second spin must not stack on the first
    runFrames(8000)

    expect(rotation()).not.toBe(midSpin)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(spinButton().disabled).toBe(false)
  })
})

describe('taking the winner off the wheel', () => {
  it('leaves the winner on screen until the reveal is dismissed, then removes it', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText(/take the winner off the wheel/i))
    const before = labels()

    spin()
    runFrames(8000)

    const landed = before[indexAtPointer(rotation(), before.length)]
    expect(announced()).toBe(landed)
    expect(labels()).toEqual(before) // still on the wheel while everyone is looking

    closeReveal()
    expect(labels()).toEqual(before.filter((l) => l !== landed))
  })

  it('spins again against the shortened list', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText(/take the winner off the wheel/i))

    spin()
    runFrames(8000)
    fireEvent.click(screen.getByRole('button', { name: /^spin again$/i }))

    const remaining = labels()
    expect(remaining).toHaveLength(7)

    runFrames(8000)
    const landed = remaining[indexAtPointer(rotation(), remaining.length)]
    expect(remaining).toContain(landed)
  })
})

describe('editing entries', () => {
  it('adds, renames and removes entries', () => {
    render(<App />)
    const start = labels().length

    fireEvent.change(screen.getByLabelText('New entry'), { target: { value: 'Front row seat' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(labels()).toContain('Front row seat')
    expect(labels()).toHaveLength(start + 1)

    fireEvent.change(screen.getAllByLabelText('Entry')[0], { target: { value: 'Renamed' } })
    expect(labels()[0]).toBe('Renamed')

    fireEvent.click(screen.getByRole('button', { name: /remove renamed/i }))
    expect(labels()).toHaveLength(start)
    expect(labels()).not.toContain('Renamed')
  })

  it('replaces the whole list from pasted text, keeping colours of entries that stayed', () => {
    render(<App />)
    const keptColor = document.querySelector<HTMLElement>('.row__swatch')!.style.background
    const kept = labels()[0]

    fireEvent.click(screen.getByRole('button', { name: /edit as list/i }))
    fireEvent.change(screen.getByLabelText(/one entry per line/i), {
      target: { value: `${kept}\n  Padded  \n\n\nSecond\n` },
    })
    fireEvent.click(screen.getByRole('button', { name: /use these entries/i }))

    expect(labels()).toEqual([kept, 'Padded', 'Second'])
    expect(document.querySelector<HTMLElement>('.row__swatch')!.style.background).toBe(keptColor)
  })

  it('survives a reload, and shrugs off a corrupt saved wheel', () => {
    const { unmount } = render(<App />)
    fireEvent.change(screen.getByLabelText('New entry'), { target: { value: 'Persisted' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    unmount()

    render(<App />)
    expect(labels()).toContain('Persisted')
    cleanup()

    localStorage.setItem('teselly-wheel.entries', '{"not":"a list"}')
    render(<App />)
    expect(labels().length).toBeGreaterThan(0)
  })
})
