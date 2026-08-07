import { useCallback, useMemo } from 'react'
import { autoColors, cycleColor, nextColor } from '../lib/palette'
import { makeId, shuffle } from '../lib/random'
import type { Entry } from '../types'
import { usePersisted } from './usePersisted'

export const MAX_ENTRIES = 60
export const MAX_LABEL = 40

const STARTER = [
  'Coffee for a week',
  'Free lunch',
  'Extra day off',
  'Gift card',
  'Mystery box',
  'Movie night',
  'Spin again',
  'Better luck next time',
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
  const [entries, setEntries] = usePersisted<Entry[]>('teselly-wheel.entries', seed, isEntryList)

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
