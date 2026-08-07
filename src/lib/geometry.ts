/**
 * Wheel geometry. Every angle in this file is measured in degrees, clockwise
 * from 12 o'clock — the same place the pointer sits — so segment index 0 starts
 * under the pointer when the wheel is at rest.
 */

export type Point = { x: number; y: number }

export function polar(angle: number, radius: number): Point {
  const rad = (angle * Math.PI) / 180
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) }
}

/** Pie slice from `start` to `end`, drawn from the wheel centre at (0, 0). */
export function slicePath(start: number, end: number, radius: number): string {
  const sweep = end - start
  if (sweep >= 360) {
    // A single entry owns the whole wheel: two arcs, because one can't close a circle.
    return `M 0 ${-radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 ${-radius} Z`
  }
  const a = polar(start, radius)
  const b = polar(end, radius)
  const largeArc = sweep > 180 ? 1 : 0
  return `M 0 0 L ${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} Z`
}

export const mod360 = (deg: number): number => ((deg % 360) + 360) % 360

/**
 * How far the wheel must turn, clockwise, to bring `index` under the pointer.
 * `jitter` (-0.5…0.5) offsets the landing within the segment so the wheel does
 * not always stop dead centre.
 */
export function rotationForIndex(
  index: number,
  count: number,
  from: number,
  turns: number,
  jitter: number,
): number {
  const segment = 360 / count
  const centre = index * segment + segment / 2
  const target = mod360(-(centre + jitter * segment * 0.7))
  return from + turns * 360 + mod360(target - from)
}

/** Which segment currently sits under the pointer at rotation `deg`. */
export function indexAtPointer(deg: number, count: number): number {
  const segment = 360 / count
  return Math.floor(mod360(-deg) / segment) % count
}
