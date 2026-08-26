/**
 * LA PALETA DE LA RUEDA.
 *
 * Ésta es la única parte de la pieza que NO usa la paleta de la aplicación, y es
 * a propósito. Todo lo demás —el fondo, las maquetas, la tipografía— es el teal
 * de Teselly, porque todo lo demás es la marca hablando. La rueda no: la rueda
 * es un juego de feria en un stand, compitiendo por la atención de alguien que
 * está pasando. Pintada con la rampa de teales de la app quedaba correcta,
 * sobria y absolutamente invisible a cinco metros: ocho tonos del mismo color
 * sobre un fondo de ese mismo color se leen como un disco gris.
 *
 * Así que acá entran los ACENTOS CÁLIDOS de la landing —los mismos `#ffd27a`,
 * `#ffae40`, `#ff6a1e` y `#ffa593` que allá marcan estados y avisos— alternados
 * con los teales claros. Siguen siendo colores de la marca; lo que cambia es la
 * proporción, que acá está al servicio de que la rueda se vea desde la otra
 * punta del salón.
 *
 * El orden tampoco es un degradé: alterna cálido y frío, y claro y oscuro. Cada
 * gajo corta contra sus dos vecinos, que es lo que hace que a la distancia se
 * lea una RUEDA y no una mancha.
 */
export const ENAMEL = [
  '#FFAE40', // ámbar
  '#0E7C8A', // teal profundo
  '#FFD27A', // dorado
  '#12464D', // teal oscuro
  '#FF6A1E', // naranja
  '#9FE8D8', // menta
  '#FFA593', // coral
  '#006974', // brand-deep
  '#D6FFF2', // menta clara
  '#1A5D66', // primary
] as const

const DARK_INK = '#08262b'
const LIGHT_INK = '#ffffff'

/** Luminancia relativa, para que la etiqueta se lea sobre cualquier gajo. */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return l > 0.38 ? DARK_INK : LIGHT_INK
}

/** Próximo color para una entrada nueva: en paleta, y nunca igual a su vecina. */
export function nextColor(existing: string[]): string {
  const last = existing[existing.length - 1]
  const first = existing[0]
  const counts = new Map<string, number>(ENAMEL.map((c) => [c, 0]))
  for (const c of existing) counts.set(c, (counts.get(c) ?? 0) + 1)

  const candidates = ENAMEL.filter((c) => c !== last && (existing.length < 2 || c !== first))
  const pool = candidates.length ? candidates : ENAMEL.filter((c) => c !== last)
  return [...pool].sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0))[0]
}

/** Colores para una lista entera, manteniendo distintos los vecinos (y el cierre). */
export function autoColors(count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(nextColor(out))
  return out
}

export function cycleColor(current: string): string {
  const i = ENAMEL.indexOf(current as (typeof ENAMEL)[number])
  return ENAMEL[(i + 1) % ENAMEL.length]
}
