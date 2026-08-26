import { useEffect, useRef } from 'react'
import { CICLOS } from '../lib/content'
import gsap from 'gsap'
import './MigrationSwitch.css'

/**
 * MIGRÁ SIN RIESGO — tres pantallas, una detrás de otra.
 *
 * No es una composición: son tres momentos que se turnan en el mismo lugar, como
 * los cortes de un promo.
 *
 *   1. SÓLO LECTURA — Teselly ya calculó 1.482 cambios y aplicó cero. Los canales
 *      están conectados pero apagados.
 *   2. EL INTERRUPTOR — solo y grande, sin nada más en pantalla. Es el momento.
 *   3. EN VIVO — el mismo contador subiendo hasta 1.482 y los canales
 *      encendiéndose de a uno.
 *
 * El antes y el después son LA MISMA IMAGEN. Eso es lo que hace que el cambio se
 * entienda de un vistazo desde el fondo del salón: no hay que leer nada, se ve
 * que lo que estaba en gris ahora está encendido.
 *
 * Sin tarjeta de fondo, sin pastillas y sin bajada: los canales son el nombre y
 * un punto, y el estado es una palabra arriba a la izquierda.
 */

const CHANNELS = ['MercadoLibre', 'Tienda Nube', 'Shopify', 'ARCA'] as const

/** Los cambios que Teselly dejó calculados mientras miraba sin tocar. */
const TOTAL = 1482

/** Lo que dura una vuelta. La ficha del bucle dura el doble, así se ve dos veces. */
const CYCLE = CICLOS.migration

export function MigrationSwitch() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const q = <T extends Element>(s: string) => el.querySelector<T>(s)
      const qa = <T extends Element>(s: string) => gsap.utils.toArray<T>(s, el)

      const acts = qa<HTMLElement>('.mgs-act')
      const fill = q<HTMLElement>('.mgs-fill')
      const knob = q<HTMLElement>('.mgs-knob')
      const track = q<HTMLElement>('.mgs-track')
      const off = q<HTMLElement>('.mgs-lbl--off')
      const on = q<HTMLElement>('.mgs-lbl--on')
      const counter = q<HTMLElement>('.mgs-n--live')
      const liveDots = qa<HTMLElement>('.mgs-act--live .mgs-ch')

      gsap.set(acts, { autoAlpha: 0, y: 22 })
      gsap.set(fill, { scaleX: 0, transformOrigin: '0% 50%' })
      /* El recorrido se mide: riel menos pomo menos los dos márgenes. Estaba
         puesto a ojo (`xPercent: 246`) y se pasaba casi un rem del borde, así que
         el `overflow:hidden` del riel le comía un cacho al pomo justo cuando
         quedaba encendido. */
      const travel = knob && track ? track.offsetWidth - knob.offsetWidth - knob.offsetLeft * 2 : 0
      gsap.set(knob, { x: 0 })
      gsap.set(off, { color: '#ffffff' })
      gsap.set(on, { color: 'rgba(255,255,255,0.3)' })
      gsap.set(liveDots, { '--lit': 0 })

      /* Dos vueltas y para, con la última pantalla puesta. La ficha se desmonta
         al cambiar de beat, así que no hace falta repetir para siempre — y con
         `repeat: -1` arrancaba una tercera vuelta que el pase cortaba a la mitad.
         El `ms` de la ficha sale de este mismo ciclo (`content.ts`). */
      const tl = gsap.timeline({ repeat: 1 })
      const show = (i: number, at: number) =>
        tl.to(acts[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, at)
      const hide = (i: number, at: number) =>
        tl.to(acts[i], { autoAlpha: 0, y: -22, duration: 0.45, ease: 'power2.in' }, at)

      /* ── 1 · sólo lectura ── */
      show(0, 0)
      hide(0, 2.9)

      /* ── 2 · el interruptor ── */
      show(1, 3.1)
      tl.to(fill, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 4.2)
        .to(knob, { x: travel, duration: 0.5, ease: 'power2.inOut' }, 4.2)
        .to(off, { color: 'rgba(255,255,255,0.3)', duration: 0.3 }, 4.3)
        .to(on, { color: '#9fe8d8', duration: 0.3 }, 4.45)
      hide(1, 5.9)

      /* ── 3 · en vivo ── */
      show(2, 6.1)
      if (counter) {
        // El número se tweenea de verdad y se escribe formateado. Contar es lo que
        // lo hace leerse como un número y no como un cartel.
        const n = { v: 0 }
        counter.textContent = '0'
        tl.to(
          n,
          {
            v: TOTAL,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              counter.textContent = Math.round(n.v).toLocaleString('es-AR')
            },
          },
          6.3,
        )
      }
      // Los canales se encienden de a uno, detrás del contador.
      tl.to(liveDots, { '--lit': 1, duration: 0.35, stagger: 0.16 }, 6.9)
      /* La pantalla 3 NO se esconde: se queda hasta que la franja cambie de
         ficha. Antes se iba sola y dejaba la franja vacía justo antes del pase.
         El tween vacío clava el largo del ciclo en el número exacto. */
      tl.to({}, { duration: 0 }, CYCLE)

      return () => tl.kill()
    }, el)

    return () => ctx.revert()
  }, [])

  /** El antes y el después comparten markup: sólo cambia el estado. */
  const Board = ({ live }: { live: boolean }) => (
    <div className="mgs-board">
      <p className="mgs-cap">{TOTAL.toLocaleString('es-AR')} cambios calculados</p>
      <p className={`mgs-n ${live ? 'mgs-n--hot mgs-n--live' : 'mgs-n--dim'}`}>{live ? '' : '0'}</p>
      <p className="mgs-cap mgs-cap--under">aplicados</p>
      <div className="mgs-chs">
        {CHANNELS.map((name) => (
          <span className="mgs-ch" key={name}>
            <i />
            {name}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mgs" ref={root}>
      <div className="sc-grid" aria-hidden="true" />

      <div className="mgs-act">
        <Board live={false} />
      </div>

      <div className="mgs-act mgs-act--switch">
        <div className="mgs-sw">
          <span className="mgs-lbl mgs-lbl--off">Sólo lectura</span>
          <span className="mgs-track">
            <span className="mgs-fill" />
            <span className="mgs-knob">
              <svg viewBox="0 0 104.44 120.6" fill="currentColor" aria-hidden="true">
                <polygon points="104.44 71.8 86.79 81.56 87.46 100.25 104.44 90.45 104.44 71.8" />
                <polygon points="80.59 51.06 59 64.12 59 97.47 36.51 111.53 52.22 120.6 74.17 107.93 72.94 73.73 97.24 60.29 80.59 51.06" />
                <polygon points="0 30.15 0 56.25 30.13 72.45 30.13 99.53 45.44 89.96 45.44 64.17 16.57 47.09 16.57 20.58 0 30.15" />
                <polygon points="0 71.64 0 90.45 16.57 100.02 16.57 80.55 0 71.64" />
                <polygon points="52.22 18.13 67.69 8.93 52.22 0 36.76 8.93 52.22 18.13" />
                <polygon points="104.44 48.79 104.44 30.15 81.14 16.7 52.22 33.9 30.13 20.76 30.13 39.36 52.18 52.4 80.29 35.39 104.44 48.79" />
              </svg>
            </span>
          </span>
          <span className="mgs-lbl mgs-lbl--on">En vivo</span>
        </div>
      </div>

      <div className="mgs-act mgs-act--live">
        <Board live />
      </div>
    </div>
  )
}
