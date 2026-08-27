import { useEffect } from 'react'

/**
 * Las dos cosas que hacen que la pieza deje de parecer una página web en el
 * televisor del stand:
 *
 *  1. FULLSCREEN. Los navegadores no dejan entrar en pantalla completa al
 *     cargar —tiene que haber un gesto del usuario—, así que se engancha al
 *     PRIMER toque/click/tecla que reciba la pieza, sea cual sea: el primero
 *     que se acerque a girar la ruleta la pone en pantalla completa sin
 *     enterarse, y no hace falta un botón de "entrar" que nadie del público
 *     entendería. Después de ese gesto el listener se desarma.
 *
 *     Si la pieza ya viene sin chrome —instalada como PWA (`display:
 *     fullscreen`) o abierta con `chrome --kiosk`— no hay nada que hacer y no
 *     se toca nada.
 *
 *  2. WAKE LOCK. Un evento dura horas y la ruleta pasa la mayor parte del
 *     tiempo quieta: sin esto la tablet apaga la pantalla sola. El bloqueo se
 *     pierde cada vez que la pestaña se va a segundo plano, así que se vuelve
 *     a pedir al volver.
 *
 * Todo es best-effort: cada API puede no existir o fallar (Safari en iPhone no
 * tiene Fullscreen API sobre `documentElement`, por ejemplo) y en ese caso la
 * pieza sigue funcionando igual, sólo que con el chrome del navegador a la
 * vista.
 */
export function useKiosk() {
  useEffect(() => {
    /** Ya está sin chrome: instalada como PWA o levantada en modo kiosco.
     *  (`matchMedia` puede no existir bajo jsdom, de ahí el opcional.) */
    const standalone = ['fullscreen', 'standalone'].some(
      (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
    )

    let disposed = false

    // ---- 1. pantalla completa al primer gesto -----------------------------
    const enterFullscreen = () => {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) {
        // Puede rechazar (permisos, iOS): no es motivo para romper nada.
        el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
      }
      teardownGesture()
    }
    const teardownGesture = () => {
      document.removeEventListener('pointerdown', enterFullscreen)
      document.removeEventListener('keydown', enterFullscreen)
    }
    if (!standalone) {
      document.addEventListener('pointerdown', enterFullscreen)
      document.addEventListener('keydown', enterFullscreen)
    }

    // ---- 2. mantener la pantalla despierta --------------------------------
    let lock: WakeLockSentinel | null = null
    const acquireLock = () => {
      if (disposed || document.visibilityState !== 'visible') return
      navigator.wakeLock
        ?.request('screen')
        .then((sentinel) => {
          if (disposed) {
            sentinel.release().catch(() => {})
            return
          }
          lock = sentinel
        })
        .catch(() => {})
    }
    const onVisibility = () => acquireLock()
    acquireLock()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      teardownGesture()
      document.removeEventListener('visibilitychange', onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])
}
