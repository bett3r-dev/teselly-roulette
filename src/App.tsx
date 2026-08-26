import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { EntryEditor } from './components/EntryEditor'
import { HexField } from './components/HexField'
import { Masthead } from './components/Masthead'
import { Wheel } from './components/Wheel'
import { Showreel } from './components/Showreel'
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
  /** El panel de carga NO es parte de la pieza: la pantalla del televisor son
   *  tres franjas y nada más. Se abre con la tecla E para cargar los premios
   *  antes del evento y se cierra con Escape. */
  const [editing, setEditing] = useState(false)

  const { peg, fanfare } = useSound(sound)

  // Se lee al frenar, así un giro siempre resuelve contra la lista con la que arrancó.
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

  /** El ganador sale de la rueda recién cuando se cierra el anuncio, así el
   *  resultado sigue en pantalla mientras todos lo están mirando. */
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

  /**
   * El único gesto humano de toda la pieza. Espacio gira desde donde sea —el
   * televisor está a varios metros y nadie va a acertarle a un botón— y E abre
   * el panel de carga, que es lo de antes del evento.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      // Escribiendo en el panel, las teclas son texto y no atajos.
      // El `instanceof` no es de más: el listener está en `window`, y el target
      // de un keydown no tiene por qué ser un elemento — sin la guarda, un
      // evento disparado sobre el propio `window` revienta acá y se lleva
      // puesto el único control de toda la pieza.
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, button, [contenteditable]')
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        // Con el panel abierto la barra no gira: se está cargando la lista.
        if (editing) return
        // Una barra, una cosa. Con el anuncio en pantalla lo único que hace es
        // cerrarlo; para volver a girar hay que apretarla otra vez. Antes cerraba
        // Y relanzaba en el mismo gesto, y eso le sacaba el control a quien está
        // entregando el premio: la rueda ya estaba girando de nuevo antes de que
        // el ganador terminara de acercarse.
        if (winner) dismiss(false)
        else startSpin()
        return
      }
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault()
        setEditing((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss, editing, startSpin, winner])

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  return (
    <div className="app">
      <HexField />

      {/* Tres franjas, en este orden y sin scroll: marca, rueda, qué hacemos. */}
      <div className="app__bands">
        <Masthead />

        <main className="stage">
          <Wheel
            entries={store.entries}
            rotation={rotation}
            velocity={velocity}
            spinning={spinning}
            winnerId={winner?.id ?? null}
            celebrating={winner !== null}
            onSpin={startSpin}
          />
        </main>

        <Showreel />
      </div>

      {winner && (
        <WinnerReveal winner={winner} removed={removeWinner} onClose={() => dismiss(false)} />
      )}

      <EntryEditor
        store={store}
        open={editing}
        disabled={spinning}
        sound={sound}
        onSoundChange={setSound}
        removeWinner={removeWinner}
        onRemoveWinnerChange={setRemoveWinner}
        onClose={() => setEditing(false)}
      />
    </div>
  )
}
