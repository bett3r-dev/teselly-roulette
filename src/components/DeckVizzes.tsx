import './DeckVizzes.css'

/**
 * LAS MAQUETAS DEL MAZO DE LA LANDING.
 *
 * Puerto directo de `landing/src/components/FeaturesDeck.astro`: mismo markup,
 * mismos viewBox de 400×300, mismas clases `.fd-*`, mismos keyframes. Los textos
 * salen del diccionario `i18n/es/featuresDeck.ts` y acá van escritos, porque este
 * repo no tiene i18n y la pieza es sólo en español.
 *
 * Lo que cambia respecto del original está anotado en `DeckVizzes.css`: las
 * medidas pasan a `em`, se saca el prefijo `.fd-card.is-active` y no hay fondo.
 *
 * El RECORTE. En el mazo, el tercio de abajo de cada pantalla lo ocupa el
 * epígrafe (título del módulo + párrafo sobre un degradado). Acá no va: el título
 * ya está arriba de la franja y las bajadas se sacaron de la pieza. Sin él queda
 * mucho más aire abajo que arriba, así que cada ficha declara cuántas de las 300
 * unidades del viewBox se ven — sin estirar nada, lo de adentro conserva su 4:3 y
 * sobra por abajo.
 *
 * Los números salen de medir el dibujo en el navegador, no de estimarlo: la regla
 * es `crop = borde superior + borde inferior`, que deja el mismo aire arriba que
 * abajo. Medido: stock 30/180, facturación 61/171, logística 30/193,
 * alertas 33/201.
 */

/** Envoltorio común: acento, proporción visible y recorte. */
function Viz({
  accent,
  crop,
  children,
}: {
  accent: string
  crop: number
  children: React.ReactNode
}) {
  return (
    <div
      className="dv"
      style={{ ['--accent' as string]: accent, aspectRatio: `400 / ${crop}` }}
    >
      <div className="dv-inner fd-viz" style={{ ['--crop' as string]: crop }} aria-hidden="true">
        {children}
      </div>
    </div>
  )
}

const HOUSE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V9l9-6 9 6v12" />
    <path d="M3 21h18M9 21v-6h6v6" />
  </svg>
)

/* ═══ STOCK MULTIDEPÓSITO Y KITS ═══════════════════════════════════════════════
   Se vende UN kit, pero adentro lleva varios componentes, y cada componente vive
   en varios depósitos: la regla descuenta el que corresponde. */

const STOCK_COLS = [
  { comp: 'Vaso', qty: '×1', hit: 'Central', a: 128, b: 127, alt: 'Palermo', altN: 40, left: '4%' },
  { comp: 'Plato', qty: '×2', hit: 'Palermo', a: 64, b: 62, alt: 'MELI Full', altN: 88, left: '36.5%' },
  { comp: 'Copa', qty: '×1', hit: 'MELI Full', a: 210, b: 209, alt: 'Central', altN: 15, left: '69%' },
]

export function StockViz() {
  return (
    <Viz accent="#62c39a" crop={210}>
      <div className="fd-stock-sale">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4l1-3h14l1 3zM4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
          <path d="M9 11h6" />
        </svg>
        <span>Venta de</span>
        <b>Kit «Combo&nbsp;Bazar»</b>
        <em>×1</em>
      </div>

      {/* Un pulso sale de la venta, llega al nodo que la parte, y recién ahí se
          abre uno hacia cada depósito. */}
      <svg className="fd-stock-bus" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none">
        <path className="fd-stock-wire" d="M200 56 V99 M70 99 H330 M70 99 V114 M200 99 V114 M330 99 V114" />
        <path className="fd-stock-flow fd-stock-trunk" pathLength="100" d="M200 56 V99" />
        <path className="fd-stock-flow fd-stock-branch" pathLength="100" d="M200 99 H70 V114" />
        <path className="fd-stock-flow fd-stock-branch" pathLength="100" d="M200 99 V114" />
        <path className="fd-stock-flow fd-stock-branch" pathLength="100" d="M200 99 H330 V114" />
        <circle className="fd-stock-node" cx="200" cy="99" r="3.2" />
      </svg>

      {STOCK_COLS.map((r, i) => (
        <div className="fd-stock-col" data-c={i} style={{ left: r.left }} key={r.comp}>
          <div className="fd-stock-comp">
            <span className="fd-stock-cdot" />
            <span className="fd-stock-cname">{r.comp}</span>
            <span className="fd-stock-cqty">{r.qty}</span>
          </div>
          <div className="fd-stock-dep fd-stock-dep--hit">
            {HOUSE}
            <span className="fd-stock-dep-n">{r.hit}</span>
            <span className="fd-stock-num">
              <b className="fd-stock-a">{r.a}</b>
              <b className="fd-stock-b">{r.b}</b>
            </span>
          </div>
          <div className="fd-stock-dep fd-stock-dep--alt">
            {HOUSE}
            <span className="fd-stock-dep-n">{r.alt}</span>
            <span className="fd-stock-alt-n">{r.altN}</span>
          </div>
        </div>
      ))}
    </Viz>
  )
}

/* ═══ FACTURACIÓN AUTOMÁTICA ═══════════════════════════════════════════════════
   Una orden genera sola su factura, autorizada por ARCA con su CAE. */

export function BillingViz() {
  return (
    <Viz accent="#e0b25f" crop={232}>
      <svg className="fd-bill-wires" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none">
        <path className="fd-omni-wire" d="M136 114 H224" />
        <path className="fd-bill-flow" pathLength="100" d="M136 114 H224" />
      </svg>

      <div className="fd-bill-order">
        <div className="fd-bill-order-h">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Orden #1042</span>
        </div>
        <span className="fd-bill-total">$ 84.500</span>
      </div>

      <div className="fd-bill-doc">
        <div className="fd-bill-doc-h">
          <span className="fd-bill-doc-dot" />
          <span className="fd-bill-doc-t">Factura&nbsp;A</span>
          <span className="fd-bill-doc-pv">Pto.&nbsp;Vta.&nbsp;0001</span>
        </div>
        <span className="fd-bill-row" data-r="0" />
        <span className="fd-bill-row" data-r="1" />
        <span className="fd-bill-row" data-r="2" />
        <div className="fd-bill-doc-f">
          <span className="fd-bill-doc-amt">$ 84.500</span>
        </div>
        <div className="fd-bill-cae">
          <span>CAE</span>
          <b>7513&nbsp;0284&nbsp;9971&nbsp;02</b>
        </div>
        <span className="fd-bill-stamp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          ARCA/AFIP
        </span>
      </div>
    </Viz>
  )
}

/* ═══ LOGÍSTICA Y DESPACHO ═════════════════════════════════════════════════════
   Un lote de etiquetas reales —QR, código de seguimiento, código de barras—
   impresas de una, y un paquete recorriendo sus estados. */

/* El QR es decorativo, pero determinista: nada de azar, así el dibujo es el
   mismo en cada render. Rejilla de 21×21 con sus tres patrones de esquina. */
const QR_N = 21
const QR_FINDERS = [
  [0, 0],
  [14, 0],
  [0, 14],
]
const inFinder = (x: number, y: number) =>
  (x <= 7 && y <= 7) || (x >= 13 && y <= 7) || (x <= 7 && y >= 13)
const QR_DATA: [number, number][] = []
for (let x = 0; x < QR_N; x++) {
  for (let y = 0; y < QR_N; y++) {
    if (inFinder(x, y)) continue
    const h = ((x * 73 + 17) ^ (y * 151 + 29) ^ (x * y * 13)) >>> 0
    if (h % 10 < 3) QR_DATA.push([x, y])
  }
}

const COURIERS = ['Andreani', 'OCA', 'Correo Arg.']
const WEIGHTS = ['1.2', '0.8', '2.4']
const STOPS = ['Despachado', 'En tránsito', 'Entregado']

export function ShippingViz() {
  return (
    <Viz accent="#e08f7f" crop={223}>
      {/* El QR se declara una vez y cada etiqueta lo reusa con <use>. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <g id="fd-qr">
            {QR_FINDERS.map(([ox, oy]) => (
              <g key={`${ox}-${oy}`}>
                <path fillRule="evenodd" d={`M${ox} ${oy}h7v7h-7z M${ox + 1} ${oy + 1}v5h5v-5z`} />
                <rect x={ox + 2} y={oy + 2} width="3" height="3" />
              </g>
            ))}
            {QR_DATA.map(([x, y]) => (
              <rect x={x} y={y} width="1" height="1" key={`${x}-${y}`} />
            ))}
          </g>
        </defs>
      </svg>

      <div className="fd-ship-labels">
        {COURIERS.map((courier, li) => (
          <div className="fd-ship-label" data-l={li} key={courier}>
            <div className="fd-ship-lb-top">
              <span className="fd-ship-lb-courier">{courier}</span>
              <span className="fd-ship-lb-wt">{WEIGHTS[li]} kg</span>
            </div>
            <div className="fd-ship-lb-mid">
              <svg className="fd-ship-qr-svg" viewBox="0 0 21 21" fill="#0a2c32" aria-hidden="true">
                <use href="#fd-qr" />
              </svg>
              <span className="fd-ship-lb-meta">
                <i>Envío</i>
                <b>#TS-482{li + 1}</b>
                <span className="fd-ship-lb-zip">CABA · C142{li + 3}</span>
              </span>
            </div>
            <span className="fd-ship-barcode" />
            <span className="fd-ship-lb-code">7 79 812 04{li}</span>
          </div>
        ))}
      </div>

      <div className="fd-ship-track">
        <span className="fd-ship-rail" />
        <span className="fd-ship-fill" />
        {STOPS.map((st, si) => (
          <div className="fd-ship-stop" data-s={si} style={{ left: `${[13, 50, 87][si]}%` }} key={st}>
            <span className="fd-ship-node" />
            <em>{st}</em>
          </div>
        ))}
        <span className="fd-ship-pkg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 3 8v8l9 5 9-5V8z" />
            <path d="M3 8l9 5 9-5" />
            <path d="M12 13v8" />
          </svg>
        </span>
      </div>
    </Viz>
  )
}

/* ═══ ALERTAS PERSONALIZADAS ═══════════════════════════════════════════════════
   Suena la campana y entran los avisos. Sin cables: las alertas se explican
   solas.

   El acento va en MENTA y no en el rosa del mazo. Acá la campana es lo único que
   lleva el acento —el punto del badge y el resplandor del repique— y en rosa
   sumaba un cuarto color a una escena que ya tiene tres avisos de colores
   distintos. En menta, además, dice quién es el que avisa. */

const ALERTS = [
  {
    c: '#e6a53a',
    title: 'Quiebre de stock',
    sub: 'SKU-88 · 0 unidades',
    path: (
      <>
        <path d="M12 3 3 8v8l9 5 9-5V8z" />
        <path d="M3 8l9 5 9-5" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    c: '#6fa8e6',
    title: 'Precio de competencia',
    sub: 'MELI · bajó 12%',
    path: (
      <>
        <path d="M22 17l-8.5-8.5-5 5L2 7" />
        <path d="M16 17h6v-6" />
      </>
    ),
  },
  {
    c: '#e07a7a',
    title: 'Error operativo',
    sub: 'Reintentando…',
    path: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </>
    ),
  },
]

export function AlertsViz() {
  return (
    <Viz accent="#9fe8d8" crop={234}>
      <div className="fd-notif-bell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="fd-notif-badge" />
      </div>
      {ALERTS.map((a, ai) => (
        <div
          className="fd-notif-toast"
          data-t={ai}
          style={{ top: `${[11, 33, 55][ai]}%`, ['--c' as string]: a.c }}
          key={a.title}
        >
          <span className="fd-notif-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {a.path}
            </svg>
          </span>
          <span className="fd-notif-body">
            <b>{a.title}</b>
            <i>{a.sub}</i>
          </span>
        </div>
      ))}
    </Viz>
  )
}
