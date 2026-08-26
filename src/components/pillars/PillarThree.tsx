import { useEffect, useRef } from 'react'
import { initPillar3 } from '../../lib/pillar3'
import './PillarViz.css'

/**
 * PILAR 3 — IA.
 *
 * Puerto de `landing/src/components/Pillar3Viz.astro`: mismas tarjetas, mismos
 * anchos por ítem, mismas clases `.pilar3-*`, misma ficha de vidrio con su
 * cursor parpadeando. Las utilidades de Tailwind del original se tradujeron a
 * estilos en línea, que es lo mismo que hacían.
 *
 * La diferencia real está en el script (`lib/pillar3.ts`): allá el flujo lo
 * acelera el SCROLL y la palabra que muestra la ficha depende de dónde está la
 * maqueta en la pantalla. Acá no hay scroll, así que corre a ritmo propio — la
 * misma adaptación que la landing ya le hizo al Pilar 1, por el mismo motivo.
 */

const ICONS: Record<string, React.ReactNode> = {
  order: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  stock: (
    <>
      <path d="M12 3 3 8v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  rule: <path d="M13 2 3 14h7l-1 8 10-12h-7z" />,
}

type Card = {
  type: string
  hue?: number
  w1?: number
  w2?: number
  bars?: number[]
  stock?: number
}

/** Varied "things happening": publications, orders, stock, messages, metrics, rules. */
const items: Card[] = [
  { type: 'pub', hue: 0, w1: 62, w2: 40 },
  { type: 'order', w1: 52 },
  { type: 'metric', bars: [40, 72, 52, 88, 60] },
  { type: 'chat', w1: 82, w2: 56 },
  { type: 'stock', stock: 68 },
  { type: 'pub', hue: 2, w1: 50, w2: 34 },
  { type: 'rule', w1: 60, w2: 44 },
  { type: 'order', w1: 58 },
  { type: 'metric', bars: [64, 38, 82, 50, 72] },
  { type: 'stock', stock: 42 },
  { type: 'chat', w1: 70, w2: 48 },
  { type: 'pub', hue: 3, w1: 56, w2: 38 },
]

const Ic = ({ name }: { name: string }) => (
  <svg
    className="pilar3-ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
)

function CardBody({ it }: { it: Card }) {
  switch (it.type) {
    case 'pub':
      return (
        <>
          <div className={`pilar3-thumb pilar3-thumb--${it.hue ?? 0}`} />
          <div className="pilar3-line" style={{ width: `${it.w1 ?? 55}%` }} />
          <div className="pilar3-line pilar3-line--dim" style={{ width: `${it.w2 ?? 38}%` }} />
        </>
      )
    case 'order':
      return (
        <>
          <div className="pilar3-row">
            <Ic name="order" />
            <div className="pilar3-line" style={{ width: `${it.w1 ?? 52}%` }} />
          </div>
          <span className="pilar3-pill" />
          <div className="pilar3-line pilar3-line--dim" style={{ width: '44%' }} />
        </>
      )
    case 'stock':
      return (
        <>
          <div className="pilar3-row">
            <Ic name="stock" />
            <div className="pilar3-line" style={{ width: '56%' }} />
          </div>
          <div className="pilar3-bar">
            <span style={{ width: `${it.stock ?? 60}%` }} />
          </div>
          <div className="pilar3-line pilar3-line--dim" style={{ width: '38%' }} />
        </>
      )
    case 'chat':
      return (
        <>
          <div className="pilar3-row">
            <Ic name="chat" />
            <div className="pilar3-line" style={{ width: '40%' }} />
          </div>
          <div className="pilar3-line" style={{ width: `${it.w1 ?? 78}%` }} />
          <div className="pilar3-line pilar3-line--dim" style={{ width: `${it.w2 ?? 54}%` }} />
        </>
      )
    case 'metric':
      return (
        <>
          <div className="pilar3-bars">
            {(it.bars ?? []).map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="pilar3-line pilar3-line--dim" style={{ width: '50%' }} />
        </>
      )
    default:
      return (
        <>
          <div className="pilar3-row">
            <Ic name="rule" />
            <div className="pilar3-line" style={{ width: `${it.w1 ?? 60}%` }} />
          </div>
          <div className="pilar3-line pilar3-line--dim" style={{ width: `${it.w2 ?? 44}%` }} />
        </>
      )
  }
}

export function PillarThree() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    return initPillar3(root.current)
  }, [])

  return (
    <div className="pviz" data-pilar3 ref={root}>
      {/* Streaming grid — masked so items fade as they pass ABOVE the AI card. */}
      <div className="pilar3-mask pviz-abs">
        <div data-pilar3-stream className="pilar3-stream-anim pilar3-stream">
          {/* Four identical stacked copies make translateY(-25%) a seamless wrap. */}
          {[0, 1, 2, 3].map((copy) => (
            <div className="pilar3-set" key={copy} aria-hidden={copy !== 0}>
              {items.map((it, i) => (
                <div className="pilar3-card" key={i}>
                  <CardBody it={it} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Scanner line at the AI card's level. */}
      <div className="pilar3-scan pilar3-scanline pviz-none" />

      {/* Blur band over the top half; fades out on the mid-line. */}
      <div className="pilar3-blur-top pilar3-blurband pviz-none" />

      {/* Glassy "Spotlight AI" card. */}
      <div data-pilar3-ai className="pilar3-ai">
        <span className="pilar3-ai-icon pilar3-ai-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2z" />
            <path
              d="M19 13.5l.9 2.6L22.5 17l-2.6.9L19 20.5l-.9-2.6L15.5 17l2.6-.9L19 13.5z"
              opacity="0.75"
            />
          </svg>
        </span>
        <span className="pilar3-ai-body">
          <span className="pilar3-ai-kicker">Spotlight AI</span>
          <span className="pilar3-ai-line">
            <span data-pilar3-text className="pilar3-ai-word">
              Cavilando…
            </span>
            <span className="pilar3-caret pilar3-ai-caret">▍</span>
          </span>
        </span>
      </div>
    </div>
  )
}
