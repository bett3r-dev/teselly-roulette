import { useEffect, useRef } from 'react'
import { initPillar2 } from '../../lib/pillar2'
import './PillarViz.css'

/**
 * PILAR 2 — Métricas.
 *
 * Puerto directo de `landing/src/components/Pillar2Viz.astro`: mismo markup,
 * mismos `data-w`, mismas posiciones en línea (el script las lee para calcular
 * a dónde viaja el cursor, así que no son decorativas). El movimiento lo pone
 * `lib/pillar2.ts`, traído igual de literal.
 *
 * Acá SÍ se conservan el cursor y la barra de herramientas, que en la versión
 * dibujada a mano se habían sacado por chicos: son justamente lo que cuenta que
 * el tablero se está ARMANDO y no que apareció solo.
 */
export function PillarTwo() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    return initPillar2(root.current)
  }, [])

  return (
    <div className="pviz" data-pilar2 ref={root}>
      {/* Grid backdrop */}

      {/* Widget 1 — bar chart (left column) */}
      <div data-w="1" className="p2-widget" style={{ left: '5%', top: '8%', width: '42%', height: '84%' }}>
        <div className="p2-head">
          <span className="p2-dot" />
          <span className="p2-hline" style={{ width: '44%' }} />
        </div>
        <div className="p2-bars">
          {[48, 72, 58, 88, 66, 80].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <span className="p2-handle" />
      </div>

      {/* Widget 2 — line chart (top-right) */}
      <div data-w="2" className="p2-widget" style={{ left: '52%', top: '8%', width: '43%', height: '38%' }}>
        <div className="p2-head">
          <span className="p2-dot" />
          <span className="p2-hline" style={{ width: '52%' }} />
        </div>
        <svg className="p2-line" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,33 16,22 32,27 50,11 68,17 84,7 100,13" fill="none" />
        </svg>
        <span className="p2-handle" />
      </div>

      {/* Widget 3 — donut (bottom-mid) */}
      <div
        data-w="3"
        className="p2-widget p2-widget--center"
        style={{ left: '52%', top: '52%', width: '20%', height: '40%' }}
      >
        <div className="p2-donut" />
        <span className="p2-handle" />
      </div>

      {/* Widget 4 — number tile (bottom-right) */}
      <div data-w="4" className="p2-widget" style={{ left: '74%', top: '52%', width: '21%', height: '40%' }}>
        <span className="p2-num">+24%</span>
        <span className="p2-hline" style={{ width: '62%' }} />
        <span className="p2-hline p2-hline--dim" style={{ width: '44%' }} />
        <span className="p2-handle" />
      </div>

      {/* Floating contextual toolbar (Illustrator-style) — pops above the selected widget */}
      <div data-pilar2-toolbar className="p2-toolbar" aria-hidden="true">
        <span className="p2-tool" data-tool="move">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v16M4 12h16" />
            <path d="M9 7l3-3 3 3M9 17l3 3 3-3M7 9l-3 3 3 3M17 9l3 3-3 3" />
          </svg>
        </span>
        <span className="p2-tool" data-tool="resize">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 8V4h-4M4 16v4h4M20 4l-6 6M10 14l-6 6" />
          </svg>
        </span>
        <span className="p2-tool-sep" />
        <span className="p2-tool" data-tool="duplicate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </span>
        <span className="p2-tool" data-tool="color">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7" fill="currentColor" />
          </svg>
        </span>
      </div>

      {/* Cursor */}
      <svg data-pilar2-cursor className="p2-cursor" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3l14 7-6 2-2 6z" fill="#ffffff" stroke="#0f4a52" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
