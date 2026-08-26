import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { CICLOS } from '../lib/content'
import './pillars/PillarViz.css'
import './RulesEngine.css'

/**
 * MOTOR DE REGLAS PROGRAMABLES — tres pantallas en secuencia.
 *
 *   1. Escribís la regla en castellano, tal cual la dirías.
 *   2. El evento se dispara y Teselly lo escucha.
 *   3. El circuito la ejecuta.
 *
 * La tercera es la ESCENA 2 de `landing/src/components/Pillar1Viz.astro`: mismo
 * markup, mismas coordenadas del viewBox 505×351, mismas clases `.p1-*`, y el
 * mismo orden de la coreografía que `landing/src/scripts/pillar1.ts`. Lo que se
 * dibujó a mano acá antes tenía el gesto pero no era ESTA, y al lado de la
 * landing se notaba.
 *
 * Lo que cambia respecto del original:
 *
 * — No hay escena 1. Allá los cuatro eventos giran alrededor de la tesela y uno
 *   se prende por vuelta; acá eso lo cuenta la pantalla 2, con el número grande,
 *   que se lee desde el fondo del salón. Los chips de 11px de la landing no.
 *
 * — No hay tarjeta. Allá el viz vive sobre `bg-[#0f4a52]` con su grilla; acá la
 *   placa de la franja YA es esa superficie, y dos tramas encimadas peleaban.
 *
 * — Se mantiene la PROPORCIÓN 505/351 aunque el marco no se vea: la geometría de
 *   los cables vive en ese viewBox, y estirarlo aplana las curvas y convierte
 *   los puertos (`r=3.5`) en elipses.
 *
 * — Los nodos son más anchos y las filas no llevan icono. Los anchos son
 *   porcentajes de una tarjeta de 505px y las etiquetas de acá son más largas,
 *   así que caían en el `ellipsis` de `.p1-node-title`: la columna del nombre
 *   quedaba en 47px útiles, donde no entra ningún nombre de producto. Allá el
 *   corte pasa desapercibido; en una pantalla que se mira de lejos, un texto
 *   cortado es un error.
 *
 * Lo importante de la coreografía es el ORDEN: al entrar la escena TODAS las
 * cajas ya están, apagadas. Lo único que viaja es la luz, y va prendiendo lo que
 * toca. Nada aparece.
 */

/** El ciclo entero, en segundos. De `content.ts`, que es quien calcula el beat. */
const RULES_CYCLE = CICLOS.rules

/* Prendido y apagado, calcados de las constantes de `pillar1.ts` pero en `em`:
   `.pviz` define la escala de la maqueta y así el resplandor la acompaña. */
const NODE_ON =
  '0 0 0 0.125em rgba(153,195,200,0.85), 0 0.833em 2.5em -0.833em rgba(153,195,200,0.5)'
const NODE_OFF = '0 0 0 0em rgba(153,195,200,0), 0 0em 0em rgba(0,0,0,0)'
const ROW_ON = 'inset 0 0 0 0.083em rgba(153,195,200,0.45)'
const ROW_OFF = 'inset 0 0 0 0em rgba(153,195,200,0)'
const BORDER_ON = 'rgba(153,195,200,0.55)'
const BORDER_OFF = 'rgba(255,255,255,0.12)'
const DOT_ON = '#a9ece0'
const DOT_OFF = 'rgba(153,195,200,0.5)'

/** La regla escrita, partida en los renglones en los que se teclea. */
const PROMPT = [
  'Si el dólar sube más de 5%,',
  'actualizá el precio de todas',
  'mis publicaciones y avisame.',
]

/** Las publicaciones que toca la regla: nombre, precio viejo, precio nuevo. */
const ROWS = [
  ['Remera', '$18.900', '$21.700'],
  ['Buzo', '$52.000', '$59.800'],
  ['Campera', '$74.000', '$85.100'],
]

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 104.44 120.6" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="104.44 71.8 86.79 81.56 87.46 100.25 104.44 90.45 104.44 71.8" />
      <polygon points="80.59 51.06 59 64.12 59 97.47 36.51 111.53 52.22 120.6 74.17 107.93 72.94 73.73 97.24 60.29 80.59 51.06" />
      <polygon points="0 30.15 0 56.25 30.13 72.45 30.13 99.53 45.44 89.96 45.44 64.17 16.57 47.09 16.57 20.58 0 30.15" />
      <polygon points="0 71.64 0 90.45 16.57 100.02 16.57 80.55 0 71.64" />
      <polygon points="52.22 18.13 67.69 8.93 52.22 0 36.76 8.93 52.22 18.13" />
      <polygon points="104.44 48.79 104.44 30.15 81.14 16.7 52.22 33.9 30.13 20.76 30.13 39.36 52.18 52.4 80.29 35.39 104.44 48.79" />
    </svg>
  )
}

/** Los cuatro cables del grafo. Se declaran una vez: base, trazo y corriente
    comparten exactamente el mismo `d`, que es lo que hace que se superpongan. */
const WIRES = [
  'M120,176 C160,176 152,80 190,80',
  'M120,176 C160,176 152,272 190,272',
  'M312,80 C340,80 342,80 360,80',
  'M312,272 C340,272 342,272 360,272',
]

export function RulesEngine() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const q = (s: string) => gsap.utils.toArray<HTMLElement>(s)
      const one = (s: string) => el.querySelector<HTMLElement>(s)

      const acts = q('.rules-act')
      const lines = q('.rules-ln')
      const [n1, n2, n3, n4, n5] = ['.n1', '.n2', '.n3', '.n4', '.n5'].map(one)
      const rules = [n2, n3]
      const outs = [n4, n5]
      const dotsRule = q('.n2 .p1-node-dot, .n3 .p1-node-dot')
      const flowsA = q('.f1, .f2')
      const flowsB = q('.f3, .f4')
      const cursA = q('.c1, .c2')
      const cursB = q('.c3, .c4')
      const rows = q('.p1-inv-row')

      /* Estado inicial. Las cajas del grafo arrancan VISIBLES y apagadas: lo que
         se anima es el resplandor, no la opacidad. */
      const reset = () => {
        gsap.set(acts, { autoAlpha: 0 })
        gsap.set(lines, { clipPath: 'inset(0 100% 0 0)' })
        gsap.set('.rules-old, .rules-arrow, .rules-new', { autoAlpha: 0, y: 8 })
        gsap.set('.rules-echo', { autoAlpha: 0 })
        gsap.set([n1, n2, n3, n4, n5], {
          boxShadow: NODE_OFF,
          borderColor: BORDER_OFF,
          scale: 1,
        })
        gsap.set('.p1-node-dot', { backgroundColor: DOT_OFF })
        /* El largo real de cada cable, medido por el navegador. Un dasharray
           aproximado deja el último tramo del barrido sin dibujar nada. */
        gsap.set('.p1-flow', {
          strokeDasharray: (_i, t) => (t as SVGPathElement).getTotalLength?.() ?? 200,
          strokeDashoffset: (_i, t) => (t as SVGPathElement).getTotalLength?.() ?? 200,
          opacity: 1,
        })
        gsap.set('.p1-current', { opacity: 0 })
        gsap.set(rows, { backgroundColor: 'rgba(153,195,200,0)', boxShadow: ROW_OFF })
        gsap.set('.p1-inv-num--b, .p1-state--b', { autoAlpha: 0, y: 4 })
        gsap.set('.p1-inv-num:not(.p1-inv-num--b), .p1-state:not(.p1-state--b)', {
          autoAlpha: 1,
          y: 0,
        })
      }

      /* Dos vueltas y para, con la última pantalla puesta. Con `repeat: -1`
         arrancaba una tercera que el pase cortaba a la mitad. */
      const tl = gsap.timeline({ repeat: 1, onRepeat: reset })
      reset()

      /* ═══ 1 · la regla, escrita a mano ═══ */
      tl.to(acts[0], { autoAlpha: 1, duration: 0.3 }, 0)
      lines.forEach((ln, i) => {
        tl.to(ln, { clipPath: 'inset(0 -0.4em 0 0)', duration: 0.9, ease: 'steps(26)' }, 0.35 + i * 0.9)
      })
      tl.to(acts[0], { autoAlpha: 0, duration: 0.4 }, 3.95)

      /* ═══ 2 · el evento se dispara y Teselly escucha ═══ */
      tl.to(acts[1], { autoAlpha: 1, duration: 0.4 }, 4.15)
        .to('.rules-old', { autoAlpha: 1, y: 0, duration: 0.45 }, 4.45)
        .to('.rules-arrow', { autoAlpha: 1, y: 0, duration: 0.3 }, 5.35)
        .to('.rules-new', { autoAlpha: 1, y: 0, duration: 0.45 }, 5.6)
        .to(acts[1], { autoAlpha: 0, duration: 0.4 }, 7.1)

      /* ═══ 3 · el circuito la ejecuta ═══
         Mismo orden que `pillar1.ts`: se prende el disparador, se dibujan los
         cables, entra la corriente, se prende lo que el cable alcanzó, y recién
         al final cambian los valores. */
      tl.to(acts[2], { autoAlpha: 1, duration: 0.4 }, 7.3)
        .to('.rules-echo', { autoAlpha: 1, duration: 0.4 }, 7.45)
        .to(n1, { boxShadow: NODE_ON, borderColor: BORDER_ON, duration: 0.3 }, 7.8)
        .to('.n1 .p1-node-dot', { backgroundColor: DOT_ON, duration: 0.2 }, 7.8)
        .to(flowsA, { strokeDashoffset: 0, duration: 0.75, ease: 'power1.inOut' }, 8.2)
        .to(cursA, { opacity: 0.9, duration: 0.35 }, 8.6)
        .to(flowsA, { opacity: 0.5, duration: 0.4 }, 8.75)
        .to(rules, { boxShadow: NODE_ON, borderColor: BORDER_ON, duration: 0.3 }, 8.9)
        .to(dotsRule, { backgroundColor: DOT_ON, duration: 0.2 }, 8.9)
        .to(rules, { scale: 1.04, duration: 0.16, yoyo: true, repeat: 1 }, 8.9)
        .to(flowsB, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut' }, 9.35)
        .to(cursB, { opacity: 0.9, duration: 0.3 }, 9.65)
        .to(flowsB, { opacity: 0.5, duration: 0.35 }, 9.75)
        .to(outs, { boxShadow: NODE_ON, borderColor: BORDER_ON, duration: 0.3 }, 9.9)
        .to(outs, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1 }, 9.9)

      /* 'fire': se marcan las filas afectadas y el precio cambia. */
      rows.forEach((r, i) => {
        const at = 9.9 + i * 0.09
        tl.to(
          r,
          { backgroundColor: 'rgba(153,195,200,0.14)', boxShadow: ROW_ON, duration: 0.3 },
          at,
        )
          .to(r.querySelector('.p1-inv-num:not(.p1-inv-num--b)'), { autoAlpha: 0, y: -4, duration: 0.3 }, at)
          .to(r.querySelector('.p1-inv-num--b'), { autoAlpha: 1, y: 0, duration: 0.36 }, at + 0.05)
      })
      tl.to('.p1-state:not(.p1-state--b)', { autoAlpha: 0, y: -4, duration: 0.3 }, 10.05)
        .to('.p1-state--b', { autoAlpha: 1, y: 0, duration: 0.36 }, 10.1)

      /* El circuito NO se apaga al final: se queda hasta que la franja cambie de
         ficha. El tween vacío clava el largo del ciclo en el número exacto. */
      tl.to({}, { duration: 0 }, RULES_CYCLE)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div className="rules" ref={root}>
      {/* ── 1 · escribís la regla ─────────────────────────────────────────── */}
      <div className="rules-act rules-act--prompt">
        <div className="rules-field">
          <Mark className="rules-mark" />
          <p className="rules-txt">
            {PROMPT.map((ln, i) => (
              <span className="rules-ln" key={ln}>
                {ln}
                {i === PROMPT.length - 1 && <i className="rules-caret" />}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* ── 2 · el evento se dispara ──────────────────────────────────────── */}
      <div className="rules-act rules-act--event">
        <div className="rules-quote">
          <p className="rules-cap">Dólar oficial</p>
          <p className="rules-n">
            <span className="rules-old">$1.482</span>
            <span className="rules-arrow">→</span>
            <span className="rules-new">$1.559</span>
          </p>
        </div>
      </div>

      {/* ── 3 · el circuito ───────────────────────────────────────────────── */}
      <div className="rules-act rules-act--graph">
        <div className="rules-echo">
          <Mark className="rules-echo-mark" />
          <p>{PROMPT.join(' ')}</p>
        </div>

        <div className="pviz">
          <div className="pviz-abs">
            <svg className="p1-wires" viewBox="0 0 505 351" fill="none" aria-hidden="true">
              {WIRES.map((d) => (
                <path className="p1-wire" d={d} key={`w${d}`} />
              ))}
              {WIRES.map((d, i) => (
                <path className={`p1-flow f${i + 1}`} d={d} key={`f${d}`} />
              ))}
              {WIRES.map((d, i) => (
                <path className={`p1-current c${i + 1}`} d={d} key={`c${d}`} />
              ))}
              <circle className="p1-port" cx="120" cy="176" r="3.5" />
              <circle className="p1-port" cx="190" cy="80" r="3.5" />
              <circle className="p1-port" cx="312" cy="80" r="3.5" />
              <circle className="p1-port" cx="360" cy="80" r="3.5" />
              <circle className="p1-port" cx="190" cy="272" r="3.5" />
              <circle className="p1-port" cx="312" cy="272" r="3.5" />
              <circle className="p1-port" cx="360" cy="272" r="3.5" />
            </svg>

            {/* Disparador */}
            <div className="p1-node n1" style={{ left: '0%', top: '39.9%', width: '23.8%', height: '20.5%' }}>
              <div className="p1-node-head">
                <span className="p1-node-dot" />
                <span className="p1-node-title">Cotización USD</span>
              </div>
              <div className="p1-node-sub">EN TIEMPO REAL</div>
            </div>

            {/* Reglas */}
            <div className="p1-node n2" style={{ left: '37.6%', top: '12.5%', width: '24.2%', height: '20.5%' }}>
              <div className="p1-node-head">
                <span className="p1-node-dot" />
                <span className="p1-node-title">Regla · Precio</span>
              </div>
              <div className="p1-node-line" style={{ width: '72%' }} />
              <div className="p1-node-line p1-node-line--dim" style={{ width: '48%' }} />
            </div>
            <div className="p1-node n3" style={{ left: '37.6%', top: '67.2%', width: '24.2%', height: '20.5%' }}>
              <div className="p1-node-head">
                <span className="p1-node-dot" />
                <span className="p1-node-title">Regla · Mensaje</span>
              </div>
              <div className="p1-node-line" style={{ width: '66%' }} />
              <div className="p1-node-line p1-node-line--dim" style={{ width: '44%' }} />
            </div>

            {/* Salida 1 — las publicaciones que cambian de precio */}
            <div
              className="p1-node p1-node--inv n4"
              style={{ left: '71.3%', top: '9.1%', width: '28.7%', height: '39.9%' }}
            >
              <span className="p1-chip-label">Publicaciones</span>
              <div className="p1-inv-list">
                {ROWS.map(([name, a, b]) => (
                  <div className="p1-inv-row" key={name}>
                    <span className="p1-inv-name">{name}</span>
                    <span className="p1-inv-val">
                      <span className="p1-inv-num">{a}</span>
                      <span className="p1-inv-num p1-inv-num--b">{b}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Salida 2 — el aviso */}
            <div
              className="p1-node p1-node--chip n5"
              style={{ left: '71.3%', top: '70.1%', width: '26.5%', height: '17.1%' }}
            >
              <span className="p1-chip-label">Mensaje</span>
              <span className="p1-chip-val">
                <span className="p1-state">Pendiente</span>
                <span className="p1-state p1-state--b">Enviado</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
