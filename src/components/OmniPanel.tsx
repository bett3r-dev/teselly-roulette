import './OmniPanel.css'

/**
 * GESTIÓN MULTICANAL Y MULTIEMPRESA.
 *
 * Puerto directo de la maqueta `omni` del mazo de la landing
 * (`FeaturesDeck.astro`, el bloque `m.key === "omni"`): mismo markup, mismas
 * coordenadas del viewBox 400×300, mismas clases `.fd-*`, mismos keyframes.
 *
 * Elige a propósito DOS cuentas de MercadoLibre con CUIT distinto más una Tienda
 * Nube: es la única forma de decir «multicanal Y multiempresa» en una sola
 * imagen. Una lista de canales cualesquiera sólo diría lo primero — y además ya
 * la usa la pantalla «En vivo» de migración.
 *
 * Lo único que cambia respecto del original:
 *
 * — Las medidas van en `em` contra el `font-size` de `.omni`, que es la escala de
 *   la maqueta. Allá está dibujada para una carta de 400 px de ancho con texto de
 *   10,5 px; acá la ficha mide ~687 px de lienzo, así que 1em = 10,5 × 687/400 ≈
 *   18 px. Se mueve ese número y la maqueta entera acompaña.
 *
 * — No hay estado `.is-active`: en el mazo las animaciones sólo corren en la
 *   carta del frente; acá la ficha está sola y corre siempre.
 *
 * — No hay fondo. En el mazo la pantalla lleva su degradado teal MÁS la grilla de
 *   líneas de `.fd-grid`: acá eran dos fondos encimados sobre una placa que ya es
 *   la superficie, y se leía como una tarjeta dentro de otra.
 */

/** Los tres cables, declarados una vez: base y cometa comparten el mismo `d`. */
const WIRES = [
  'M148 54 C170 54 170 114 184 114',
  'M148 114 H184',
  'M148 174 C170 174 170 114 184 114',
]

/** Las cuentas conectadas. Dos MELI con CUIT distinto, y una Tienda Nube. */
const CHIPS = [
  { icon: '/brands/ml-icon.png', name: 'MercadoLibre', account: 'cuenta 1', cuit: 'CUIT 30‑71.508.229‑4', top: '18%' },
  { icon: '/brands/ml-icon.png', name: 'MercadoLibre', account: 'cuenta 2', cuit: 'CUIT 27‑33.204.117‑9', top: '38%' },
  { icon: '/brands/tn-icon.png', name: 'Tienda Nube', account: null, cuit: 'CUIT 30‑52.914.660‑3', top: '58%' },
]

/** Las filas del panel unificado, con lo que entró por cada canal. */
const ROWS = [
  { w: '70%', v: '+3' },
  { w: '58%', v: '+7' },
  { w: '64%', v: '+2' },
]

export function OmniPanel() {
  return (
    <div className="omni">
      <div className="fd-screen">

        <div className="fd-viz fd-omni" aria-hidden="true">
          {/* cables canal → panel, con una corriente viajando por cada uno */}
          <svg className="fd-omni-wires" viewBox="0 0 400 300" fill="none" preserveAspectRatio="none">
            {WIRES.map((d) => (
              <path className="fd-omni-wire" d={d} key={`w${d}`} />
            ))}
            {WIRES.map((d, i) => (
              <path className="fd-omni-flow" data-f={i} pathLength="100" d={d} key={`f${d}`} />
            ))}
            <circle className="fd-omni-merge" cx="184" cy="114" r="3.4" />
          </svg>

          {CHIPS.map((c, i) => (
            <div className="fd-omni-chip" data-c={i} style={{ left: '5%', top: c.top }} key={c.cuit}>
              <img className="fd-omni-logo" src={c.icon} alt="" aria-hidden="true" />
              <span className="fd-omni-chip-txt">
                <b>
                  {c.name}
                  {c.account && <em>{c.account}</em>}
                </b>
                <i>{c.cuit}</i>
              </span>
            </div>
          ))}

          {/* el ÚNICO panel */}
          <div className="fd-omni-panel">
            <div className="fd-omni-head">
              <span className="fd-omni-mark" />
              <span className="fd-omni-htxt">Panel unificado</span>
            </div>
            {ROWS.map((r, i) => (
              <div className="fd-omni-row" data-r={i} key={r.v}>
                <span className="fd-omni-dot" />
                <span className="fd-omni-ln" style={{ width: r.w }} />
                <span className="fd-omni-v">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
