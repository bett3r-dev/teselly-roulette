/**
 * Hand-painted enamel colours, the kind a fairground sign painter would keep on
 * the bench. Deliberately not a rainbow — they are chosen to sit next to each
 * other without vibrating.
 */
export const ENAMEL = [
  '#B23A34', // oxblood
  '#2C7A8C', // teal
  '#D9A227', // mustard
  '#3B5A9D', // indigo
  '#2E6B4F', // forest
  '#C97B84', // dusty rose
  '#6C3A66', // plum
  '#E3D5B4', // cream
] as const

const DARK_INK = '#1A1410'
const LIGHT_INK = '#F7F1E4'

/** Relative luminance, so labels stay readable on every enamel colour. */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return l > 0.38 ? DARK_INK : LIGHT_INK
}

/** Next colour for a new entry: on-palette, and never the same as its neighbour. */
export function nextColor(existing: string[]): string {
  const last = existing[existing.length - 1]
  const first = existing[0]
  const counts = new Map<string, number>(ENAMEL.map((c) => [c, 0]))
  for (const c of existing) counts.set(c, (counts.get(c) ?? 0) + 1)

  const candidates = ENAMEL.filter((c) => c !== last && (existing.length < 2 || c !== first))
  const pool = candidates.length ? candidates : ENAMEL.filter((c) => c !== last)
  return [...pool].sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0))[0]
}

/** Colours for a whole list at once, keeping neighbours (and the wrap) distinct. */
export function autoColors(count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(nextColor(out))
  return out
}

export function cycleColor(current: string): string {
  const i = ENAMEL.indexOf(current as (typeof ENAMEL)[number])
  return ENAMEL[(i + 1) % ENAMEL.length]
}
