/**
 * EL BUCLE — el guion de la franja de abajo.
 *
 * Todo sale del diccionario español de la landing (`landing/src/i18n/es/`):
 * `whereWeShine.pillars`, `migration` y `featuresDeck.modules`. Está COPIADO, no
 * importado: la ruleta es un repo aparte y no comparte el bundle. Si allá se
 * reescribe un módulo, se reescribe acá — es la única sincronización manual.
 *
 * Lo que sí se reescribió es el LARGO. En la landing cada módulo tiene tres o
 * cuatro renglones de copy de venta, pensados para leerse sentado. Acá se leen
 * desde cinco metros, de reojo y en seis segundos, así que cada uno quedó en una
 * línea. La idea es la misma; el texto, no.
 *
 * El orden es el de la landing —primero cómo se entra (migración), después por
 * qué (los pilares), y al final qué hay adentro (el producto)— porque es el
 * único orden en el que las fichas se explican solas si alguien mira el bucle
 * entero de una sentada.
 */

/** Qué escena dibuja cada ficha. Ver `components/scenes/`. */
export type SceneKind =
  | 'migration'
  | 'rules'
  | 'metrics'
  | 'ai'
  | 'channels'
  | 'stock'
  | 'billing'
  | 'shipping'
  | 'alerts'

export type Beat = {
  id: string
  scene: SceneKind
  title: string
  line: string
  /**
   * Cuánto se queda en pantalla.
   *
   * Los tres pilares son los más largos (12 s) porque no son fichas: son las
   * maquetas de la landing, y cada una cuenta una historia entera —el Pilar 1
   * pasa por dos escenas antes de volver a empezar—. Con los 7.5 s que tenían
   * las demás se cortaban por la mitad, que es de lo que menos se entiende.
   */
  ms: number
}

/**
 * Cuánto dura UNA VUELTA de cada animación que se repite sola, en segundos.
 *
 * Vive acá y no en cada componente para que el `ms` de la ficha y el largo de su
 * animación no puedan separarse: si se cambia la coreografía, se cambia este
 * número y el beat se recalcula solo.
 */
export const CICLOS = {
  migration: 9,
  rules: 12.5,
  /** El bucle de la maqueta `omni` del mazo. */
  channels: 2.7,
} as const

/** Lo que tarda una ficha en terminar de entrar (`reel-cut`, en Showreel.css). */
export const PASE = 0.9

/**
 * Fichas cuya animación cuenta algo y TERMINA: migración y reglas.
 *
 * No alcanzaba con que el beat fuera múltiplo del ciclo. A las dos vueltas justas
 * el timeline arrancaba una TERCERA, y esa es la que se veía cortada por el pase.
 * Así que esas dos corren un número fijo de vueltas (`repeat: 1`) y terminan con
 * su última pantalla PUESTA: el pase se cruza por encima de un cuadro quieto y no
 * de una animación empezando.
 *
 * De ahí la cuenta: las vueltas enteras más el pase.
 */
const conFinal = (ciclo: number, vueltas = 2) => Math.round((ciclo * vueltas + PASE) * 1000)

/**
 * Fichas cuyo bucle es continuo y no tiene principio ni final: la maqueta de
 * multicanal es una corriente que va pasando. Cortarla en cualquier punto no se
 * nota, así que alcanza con un múltiplo del bucle.
 */
const beatContinuo = (ciclo: number, vueltas: number) => Math.round(ciclo * vueltas * 1000)

export const BEATS: Beat[] = [
  {
    id: 'migration',
    scene: 'migration',
    title: 'Migrá a Teselly sin riesgo',
    line: 'Conectás en Solo Lectura y no se modifica un solo dato hasta que vos lo actives.',
    ms: conFinal(CICLOS.migration),
  },
  {
    id: 'rules',
    scene: 'rules',
    title: 'Motor de reglas programables',
    line: 'Cada evento dispara tu propia lógica. Teselly se adapta a tu negocio, no al revés.',
    ms: conFinal(CICLOS.rules),
  },
  {
    id: 'metrics',
    scene: 'metrics',
    title: 'Trazabilidad operativa total',
    line: 'Analíticas nativas y personalizables. Detectás desvíos antes de que rompan tus números.',
    ms: 12_000,
  },
  {
    id: 'ai',
    scene: 'ai',
    title: 'IA orientada a la resolución',
    line: 'Más que un asistente: un agente que opera tus canales en lenguaje natural.',
    ms: 12_000,
  },
  {
    id: 'channels',
    scene: 'channels',
    title: 'Gestión multicanal y multiempresa',
    line: 'Todos tus marketplaces y tiendas, cada uno bajo su CUIT, en un solo panel.',
    ms: beatContinuo(CICLOS.channels, 4),
  },
  {
    id: 'stock',
    scene: 'stock',
    title: 'Stock multidepósito y kits',
    line: 'Stock unificado en tiempo real entre depósitos. Cero chances de overselling.',
    ms: 7000,
  },
  {
    id: 'billing',
    scene: 'billing',
    title: 'Facturación automática',
    line: 'De la orden a ARCA sin tocar un botón, en cuanto la regla de negocio lo indica.',
    ms: 7000,
  },
  {
    id: 'shipping',
    scene: 'shipping',
    title: 'Logística y despacho centralizado',
    line: 'Envíos en lote, etiquetas masivas y el tracking de todos tus canales en una pantalla.',
    ms: 7000,
  },
  {
    id: 'alerts',
    scene: 'alerts',
    title: 'Alertas personalizadas',
    line: 'Un quiebre de stock o una caída de posicionamiento: te avisa con tus propias reglas.',
    ms: 7000,
  },
]

/** Los cuatro pasos de la migración, con su ilustración. Copy de `migration.steps`. */
export const MIGRATION_STEPS = [
  { art: '/howitworks/step1.png', title: 'Conectá todo en Solo Lectura' },
  { art: '/howitworks/step2.png', title: 'Reflejá tus reglas' },
  { art: '/howitworks/step3.png', title: 'Auditá y repará' },
  { art: '/howitworks/step4.png', title: 'Hacé el cambio' },
] as const

/** Los canales que conecta. Los archivos vienen de `landing/public/brands/`. */
export const CANALES = [
  { file: 'mercadolibre.svg', h: 2.9 },
  { file: 'tiendanube.svg', h: 2.6 },
  { file: 'shopify.svg', h: 2.9 },
  { file: 'amazon.svg', h: 2.6 },
  { file: 'vtex.png', h: 2.4 },
  { file: 'woocommerce.png', h: 1.8 },
  { file: 'odoo.png', h: 2.0 },
] as const

/**
 * La cinta de capacidades. Son las cuatro frases de `hero.cycle` de la landing
 * más las capacidades en seco: la cinta no explica, enumera.
 */
export const RIBBON: string[] = [
  'Sincronización real',
  'Reglas que automatizan tu operación',
  'IA que hace el trabajo manual por vos',
  'Migrá con riesgo cero',
  'Stock unificado',
  'Facturación automática',
  'Multicanal y multiempresa',
  'Analíticas en tiempo real',
  'Publicador masivo',
  'Logística centralizada',
  'Alertas a medida',
  'API y MCP nativo',
]
