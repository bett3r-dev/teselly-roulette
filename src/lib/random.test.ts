import { describe, expect, it } from 'vitest'
import { weightedInt } from './random'

/**
 * El sorteo por peso es lo ÚNICO que decide qué premio sale, y no se ve en
 * pantalla: la rueda dibuja siete gajos iguales. Si esto se rompe, la pieza
 * sigue andando y repartiendo mal, que es la peor forma de romperse.
 */
describe('the weighted draw behind the wheel', () => {
  /** Los premios del stand, con sus chances en porcentaje. */
  const PESOS = [5, 25, 15, 20, 15, 5, 15]
  const TIRADAS = 60_000

  const repartir = (weights: number[], n: number) => {
    const cuenta = new Array<number>(weights.length).fill(0)
    for (let i = 0; i < n; i++) cuenta[weightedInt(weights)] += 1
    return cuenta
  }

  it('reparte según los pesos, no parejo', () => {
    const cuenta = repartir(PESOS, TIRADAS)
    const total = PESOS.reduce((a, w) => a + w, 0)

    cuenta.forEach((veces, i) => {
      const esperado = (PESOS[i] / total) * TIRADAS
      // Un punto porcentual de margen: con 60.000 tiradas el ruido es mucho
      // menor, pero el test no puede depender de la suerte del día.
      expect(Math.abs(veces - esperado) / TIRADAS).toBeLessThan(0.01)
    })
  })

  it('nunca devuelve un índice que no existe', () => {
    for (let i = 0; i < 2000; i++) {
      const n = weightedInt(PESOS)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(PESOS.length)
    }
  })

  it('con todos los pesos iguales reparte parejo', () => {
    const cuenta = repartir([1, 1, 1, 1], 20_000)
    cuenta.forEach((veces) => expect(Math.abs(veces - 5000) / 20_000).toBeLessThan(0.01))
  })

  it('no se cuelga si los pesos no sirven', () => {
    // Cero, negativos o todo en cero: antes que quedarse sin premio, sortea
    // parejo. Una rueda que no gira es peor que una que reparte de más.
    expect(weightedInt([0, 0, 0])).toBeGreaterThanOrEqual(0)
    expect(weightedInt([0, 0, 0])).toBeLessThan(3)
    const cuenta = repartir([0, 10, -5], 3000)
    expect(cuenta[0]).toBe(0)
    expect(cuenta[2]).toBe(0)
    expect(cuenta[1]).toBe(3000)
  })
})
