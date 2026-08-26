import { useCallback, useMemo } from 'react'
import { autoColors, cycleColor, nextColor } from '../lib/palette'
import { makeId, shuffle } from '../lib/random'
import type { Entry } from '../types'
import { usePersisted } from './usePersisted'

export const MAX_ENTRIES = 60
export const MAX_LABEL = 40

/**
 * Los premios del stand. Se editan desde el panel (tecla E).
 *
 * Cada premio aparece tantas veces como se quiera que salga: iPhone 1, camiseta
 * 1, tres meses 3, un mes 5, 15% 3, 25% 3 y «seguí participando» 4 — veinte
 * gajos en total.
 *
 * El ORDEN está entreverado a propósito. Puestos en bloques —los cinco «1 mes
 * gratis» juntos— la rueda muestra a simple vista dónde está cada cosa y deja de
 * tener gracia; y dos gajos iguales pegados se leen como uno solo del doble de
 * ancho. Acá no hay dos iguales que se toquen, contando la vuelta del último al
 * primero.
 */
const STARTER = [
  'iPhone 17 Pro Max',
  '1 mes gratis',
  '15% descuento un año',
  'Seguí participando',
  '3 meses gratis',
  '1 mes gratis',
  '25% descuento 6 meses',
  'Seguí participando',
  '1 mes gratis',
  '15% descuento un año',
  'Camiseta Argentina',
  'Seguí participando',
  '1 mes gratis',
  '25% descuento 6 meses',
  '3 meses gratis',
  'Seguí participando',
  '1 mes gratis',
  '15% descuento un año',
  '3 meses gratis',
  '25% descuento 6 meses',
]

function seed(): Entry[] {
  const colors = autoColors(STARTER.length)
  return STARTER.map((label, i) => ({ id: makeId(), label, color: colors[i] }))
}

/** Trim, drop blanks, cap the length, and keep the wheel under its ceiling. */
function clean(labels: string[]): string[] {
  return labels
    .map((l) => l.trim().slice(0, MAX_LABEL))
    .filter(Boolean)
    .slice(0, MAX_ENTRIES)
}

const isEntryList = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every(
    (e) => e && typeof e.id === 'string' && typeof e.label === 'string' && typeof e.color === 'string',
  )

export function useEntries() {
  const [entries, setEntries] = usePersisted<Entry[]>('teselly-wheel.entries.v2', seed, isEntryList)

  const add = useCallback(
    (label: string) => {
      const [clean1] = clean([label])
      if (!clean1) return false
      let added = false
      setEntries((current) => {
        if (current.length >= MAX_ENTRIES) return current
        added = true
        return [...current, { id: makeId(), label: clean1, color: nextColor(current.map((e) => e.color)) }]
      })
      return added
    },
    [setEntries],
  )

  const remove = useCallback(
    (id: string) => setEntries((current) => current.filter((e) => e.id !== id)),
    [setEntries],
  )

  const rename = useCallback(
    (id: string, label: string) =>
      setEntries((current) =>
        current.map((e) => (e.id === id ? { ...e, label: label.slice(0, MAX_LABEL) } : e)),
      ),
    [setEntries],
  )

  const recolor = useCallback(
    (id: string) =>
      setEntries((current) =>
        current.map((e) => (e.id === id ? { ...e, color: cycleColor(e.color) } : e)),
      ),
    [setEntries],
  )

  /** Bulk edit: one label per line, reusing the colour of any label that stayed. */
  const replaceAll = useCallback(
    (text: string) => {
      setEntries((current) => {
        const known = new Map(current.map((e) => [e.label, e]))
        const out: Entry[] = []
        for (const label of clean(text.split('\n'))) {
          const kept = known.get(label)
          out.push(
            kept && !out.some((e) => e.id === kept.id)
              ? kept
              : { id: makeId(), label, color: nextColor(out.map((e) => e.color)) },
          )
        }
        return out
      })
    },
    [setEntries],
  )

  const shuffleEntries = useCallback(() => setEntries((current) => shuffle(current)), [setEntries])

  const reset = useCallback(() => setEntries(seed()), [setEntries])

  const clear = useCallback(() => setEntries([]), [setEntries])

  const asText = useMemo(() => entries.map((e) => e.label).join('\n'), [entries])

  return { entries, add, remove, rename, recolor, replaceAll, shuffleEntries, reset, clear, asText }
}
