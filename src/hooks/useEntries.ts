import { useCallback, useMemo, useState } from 'react'
import { autoColors, cycleColor, nextColor } from '../lib/palette'
import { makeId, shuffle } from '../lib/random'
import type { Entry } from '../types'

export const MAX_ENTRIES = 60
export const MAX_LABEL = 40

/**
 * Los premios del stand y sus chances, en porcentaje.
 *
 * Van hardcodeados a propósito: antes se guardaban en el navegador y una lista
 * vieja de la máquina del stand le ganaba a ésta, así que la pantalla arrancaba
 * con premios que ya no existían y no había forma de notarlo mirándola.
 *
 * OJO con la relación entre el `pct` y lo que se ve: la rueda dibuja SIETE GAJOS
 * IGUALES y el ganador se sortea con estos pesos. Quien gira ve un séptimo de
 * rueda para el iPhone —14%— cuando en realidad tiene 5%. Es una decisión
 * tomada, no un descuido: así las etiquetas entran grandes en el televisor y los
 * porcentajes se cambian acá sin tocar el dibujo.
 *
 * Los `pct` no necesitan sumar 100: el sorteo los normaliza. Suman 100 porque
 * así se leen de una.
 */
const STARTER: { label: string; pct: number }[] = [
  { label: 'iPhone 17 Pro Max', pct: 10 },
  { label: '1 mes gratis', pct: 15 },
  { label: '3 meses gratis', pct: 15 },
  { label: 'Seguí participando', pct: 20 },
  { label: '15% descuento un año', pct: 20 },
  { label: 'Camiseta Argentina', pct: 10 },
  { label: '25% descuento 6 meses', pct: 10 },
]

function seed(): Entry[] {
  const colors = autoColors(STARTER.length)
  return STARTER.map((p, i) => ({ id: makeId(), label: p.label, color: colors[i], weight: p.pct }))
}

/** Trim, drop blanks, cap the length, and keep the wheel under its ceiling. */
function clean(labels: string[]): string[] {
  return labels
    .map((l) => l.trim().slice(0, MAX_LABEL))
    .filter(Boolean)
    .slice(0, MAX_ENTRIES)
}

export function useEntries() {
  /*
   * Los premios NO se guardan en el navegador.
   *
   * Antes se persistían, y una lista vieja guardada en la máquina del stand le
   * ganaba a la de acá: la pantalla arrancaba con premios que ya no existían y no
   * había forma de darse cuenta mirándola. Ahora cada arranque sale de `STARTER`,
   * que es la fuente única. El panel (tecla E) sigue sirviendo para retocar algo
   * en el momento, pero eso dura lo que dura la sesión.
   */
  const [entries, setEntries] = useState<Entry[]>(seed)

  const add = useCallback(
    (label: string) => {
      const [clean1] = clean([label])
      if (!clean1) return false
      let added = false
      setEntries((current) => {
        if (current.length >= MAX_ENTRIES) return current
        added = true
        return [
          ...current,
          {
            id: makeId(),
            label: clean1,
            color: nextColor(current.map((e) => e.color)),
            // Un premio agregado a mano entra con las chances promedio de los
            // que ya están: es lo único que no sorprende a quien lo agrega.
            weight: current.length ? current.reduce((a, e) => a + e.weight, 0) / current.length : 100,
          },
        ]
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
              : {
                  id: makeId(),
                  label,
                  color: nextColor(out.map((e) => e.color)),
                  weight: 100 / Math.max(1, out.length + 1),
                },
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
