export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a || 1), 0, 1)
  return t * t * (3 - 2 * t)
}
export const deg = (d: number): number => (d * Math.PI) / 180
/** Interpolation de points (x croissant) avec lissage de Catmull-Rom monotone simple. */
export function interp(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0 || 1)
      const s = t * t * (3 - 2 * t)
      return y0 + (y1 - y0) * s
    }
  }
  return last[1]
}
