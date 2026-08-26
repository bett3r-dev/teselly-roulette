import { useEffect } from 'react'
import type { Entry } from '../types'
import './WinnerReveal.css'

/**
 * Cuánto se queda el anuncio si nadie aprieta nada.
 *
 * La pieza corre sola en un stand: si el anuncio esperara para siempre, la
 * primera persona que gira y se va con su premio deja la pantalla congelada en
 * una ficha hasta que alguien la toque. Veinte segundos alcanzan para entregar
 * el premio y sacar la foto, y después la pantalla vuelve sola a su reposo.
 */
const AUTO_DISMISS_MS = 20_000

type Props = {
  winner: Entry
  removed: boolean
  onClose: () => void
}

/**
 * El anuncio del ganador. Es un CARTEL, no un diálogo: no tiene botones ni
 * instrucciones.
 *
 * La barra espaciadora ya es el único gesto de toda la pieza —gira la rueda— y
 * acá hace lo mismo: cierra el anuncio y vuelve a girar, en un solo movimiento.
 * Poner además un "Cerrar", un "Girar de nuevo" y un cartelito explicando la
 * tecla era ofrecer tres caminos para lo que ya se hace con el pulgar, en una
 * pantalla que nadie puede tocar porque está a cinco metros y colgada.
 */
export function WinnerReveal({ winner, removed, onClose }: Props) {
  useEffect(() => {
    const id = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className="reveal" role="status" aria-live="assertive">
      <div className="reveal__scrim" />
      <div className="reveal__card" style={{ '--won': winner.color } as React.CSSProperties}>
        <p className="reveal__eyebrow">
          <span className="hexdot" aria-hidden="true" />
          La ruleta se detuvo en
        </p>
        <p className="reveal__name">{winner.label}</p>
        {removed && <p className="reveal__note">Se retiró de la ruleta.</p>}

        {/* La barra drena en los mismos `AUTO_DISMISS_MS` que el temporizador,
            así que el anuncio no se cierra "de la nada": se ve venir. */}
        <span
          className="reveal__timer"
          aria-hidden="true"
          style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
        />
      </div>
    </div>
  )
}
