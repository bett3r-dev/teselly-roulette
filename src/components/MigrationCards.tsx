import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './MigrationCards.css'

/**
 * MIGRÁ SIN RIESGO — los cuatro pasos, de a UNO.
 *
 * Antes los cuatro estaban en una grilla 2×2 y lo único que pasaba era que se
 * turnaban las opacidades. Eso no cuenta una secuencia: cuenta que hay cuatro
 * cosas y que una está más clara. Un paso de una migración es un MOMENTO, y para
 * que se lea como momento tiene que estar solo en pantalla.
 *
 * Así que ahora es un mazo: una tarjeta a la vez, la que entra viene desde la
 * derecha y la que sale se va hacia la izquierda — el mismo gesto que las
 * tarjetas de `Migration.astro` en la landing, que también pasan de a una. El
 * riel de abajo marca en cuál va, que es lo que reemplaza a verlos todos.
 */

const STEPS = [
  {
    art: '/howitworks/step1.png',
    title: 'Conectá todo en Solo Lectura',
    line: 'Teselly mapea tu operación en tiempo real sin modificar un solo dato.',
  },
  {
    art: '/howitworks/step2.png',
    title: 'Reflejá tus reglas',
    line: 'Configurás tu lógica y ves qué decisiones tomaría ante cada cosa que pase.',
  },
  {
    art: '/howitworks/step3.png',
    title: 'Auditá, resolvé y reparás',
    line: 'La IA detecta los conflictos de SKU y desvíos que tus sistemas ignoran.',
  },
  {
    art: '/howitworks/step4.png',
    title: 'Hacé el cambio definitivo',
    line: 'Apagás lo anterior y con un botón activás Teselly. Sin un evento perdido.',
  },
] as const

/** Cuánto se queda cada paso. Cuatro × esto = lo que dura la ficha en el bucle. */
const HOLD = 3.25

export function MigrationCards() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.mig-card', el)
      const marks = gsap.utils.toArray<HTMLElement>('.mig-seg span', el)
      if (!cards.length) return

      // Todas fuera de cuadro a la derecha; la primera ya en su lugar.
      gsap.set(cards, { xPercent: 110, opacity: 0 })
      gsap.set(cards[0], { xPercent: 0, opacity: 1 })
      gsap.set(marks, { scaleX: 0, transformOrigin: '0% 50%' })

      const tl = gsap.timeline({ repeat: -1 })

      cards.forEach((card, i) => {
        const at = i * HOLD
        // El riel del paso activo se llena mientras la tarjeta está en pantalla.
        if (marks[i]) tl.to(marks[i], { scaleX: 1, duration: HOLD, ease: 'none' }, at)

        const next = cards[(i + 1) % cards.length]
        const out = at + HOLD - 0.55
        // La que sale se va a la izquierda y la que entra llega desde la derecha,
        // solapadas: es un pase, no un corte.
        tl.to(card, { xPercent: -110, opacity: 0, duration: 0.55, ease: 'power2.in' }, out)
        // `immediateRender: false` NO es opcional: por defecto `fromTo` pinta su
        // estado inicial en cuanto se construye el timeline, aunque el tween
        // arranque a los doce segundos. Sin esto, la tarjeta 1 quedaba en
        // `opacity: 0` desde el arranque — o sea, la pantalla en blanco.
        tl.fromTo(
          next,
          { xPercent: 110, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', immediateRender: false },
          out + 0.18,
        )
        // El riel de los pasos ya vistos se vacía cuando el ciclo vuelve a empezar.
        if (i === cards.length - 1) {
          tl.to(marks, { scaleX: 0, duration: 0.35, ease: 'none' }, out + 0.55)
        }
      })

      return () => tl.kill()
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div className="mig" ref={root}>
      <div className="mig-stage">
        {STEPS.map((step, i) => (
          <article className="mig-card" key={step.art}>
            <div className="mig-art">
              <span style={{ '--art': `url(${step.art})` } as React.CSSProperties} />
            </div>
            <div className="mig-body">
              <p className="mig-step">Paso {i + 1} de {STEPS.length}</p>
              <h3 className="mig-title">{step.title}</h3>
              <p className="mig-line">{step.line}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mig-rail" aria-hidden="true">
        {STEPS.map((step) => (
          <span className="mig-seg" key={step.art}>
            <span />
          </span>
        ))}
      </div>
    </div>
  )
}
