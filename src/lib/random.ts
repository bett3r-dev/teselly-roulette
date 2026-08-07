/** Unbiased integer in [0, max) — rejection-sampled from the crypto RNG. */
export function randomInt(max: number): number {
  if (max <= 1) return 0
  const limit = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buf)
    value = buf[0]
  } while (value >= limit)
  return value % max
}

/** Float in [0, 1). */
export function randomFloat(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 0x100000000
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function makeId(): string {
  return crypto.randomUUID?.() ?? `e${Date.now()}${randomInt(1e6)}`
}
