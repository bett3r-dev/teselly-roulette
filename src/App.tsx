import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { EntryEditor } from './components/EntryEditor'
import { Wheel } from './components/Wheel'
import { WinnerReveal } from './components/WinnerReveal'
import { useEntries } from './hooks/useEntries'
import { usePersisted } from './hooks/usePersisted'
import { useSound } from './hooks/useSound'
import { useSpin } from './hooks/useSpin'
import type { Entry } from './types'

export default function App() {
  const store = useEntries()
  const [sound, setSound] = usePersisted('teselly-wheel.sound', true)
  const [removeWinner, setRemoveWinner] = usePersisted('teselly-wheel.remove-winner', false)
  const [winner, setWinner] = useState<Entry | null>(null)
  const [queuedSpin, setQueuedSpin] = useState(false)

  const { peg, fanfare } = useSound(sound)

  // Read at settle time, so a spin always resolves against the list it started with.
  const latest = useRef({ entries: store.entries, removeWinner })
  latest.current = { entries: store.entries, removeWinner }

  const onSettle = useCallback(
    (index: number) => {
      const won = latest.current.entries[index]
      if (!won) return
      setWinner(won)
      fanfare()
    },
    [fanfare],
  )

  const { rotation, velocity, spinning, spin } = useSpin({ onPeg: peg, onSettle })

  const startSpin = useCallback(() => {
    setWinner(null)
    spin(latest.current.entries.length)
  }, [spin])

  /** The winner only leaves the wheel once the reveal is dismissed, so the
   *  result stays on screen while everyone is still looking at it. */
  const dismiss = useCallback(
    (thenSpin: boolean) => {
      if (winner && latest.current.removeWinner) store.remove(winner.id)
      setWinner(null)
      if (thenSpin) setQueuedSpin(true)
    },
    [store, winner],
  )

  useEffect(() => {
    if (!queuedSpin) return
    setQueuedSpin(false)
    startSpin()
  }, [queuedSpin, startSpin])

  // Space spins from anywhere, for when the wheel is up on a projector.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, button, [contenteditable]')) return
      event.preventDefault()
      if (winner) dismiss(true)
      else startSpin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss, startSpin, winner])

  const count = store.entries.length

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__mark">
          <span className="masthead__eyebrow">Teselly</span>
          <h1 className="masthead__title">Prize Wheel</h1>
        </div>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => setSound((s) => !s)}
          aria-pressed={sound}
        >
          <svg className="icon" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 7.5h3l4-3v11l-4-3H4z" />
            {sound ? (
              <path d="M14 7c1.3 1.6 1.3 5.4 0 7M16.6 5c2.2 2.6 2.2 7.4 0 10" />
            ) : (
              <path d="M14.5 7.5l4 5M18.5 7.5l-4 5" />
            )}
          </svg>
          {sound ? 'Sound on' : 'Sound off'}
        </button>
      </header>

      <main className="stage">
        <div className="stage__wheel">
          <Wheel
            entries={store.entries}
            rotation={rotation}
            velocity={velocity}
            spinning={spinning}
            winnerId={winner?.id ?? null}
            celebrating={winner !== null}
            onSpin={startSpin}
          />
          <p className="stage__meta">
            {count === 0 ? (
              'Add entries to fill the wheel'
            ) : (
              <>
                {count} {count === 1 ? 'entry' : 'entries'} <span className="dot">·</span> even odds{' '}
                <span className="dot">·</span> press space to spin
              </>
            )}
          </p>
        </div>

        <EntryEditor
          store={store}
          disabled={spinning}
          removeWinner={removeWinner}
          onRemoveWinnerChange={setRemoveWinner}
        />
      </main>

      {winner && (
        <WinnerReveal
          winner={winner}
          removed={removeWinner}
          onSpinAgain={() => dismiss(true)}
          onClose={() => dismiss(false)}
        />
      )}
    </div>
  )
}
