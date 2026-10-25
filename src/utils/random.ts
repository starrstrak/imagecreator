// Générateur pseudo-aléatoire reproductible (mulberry32) pour le bouton « Surprise ».
export function makeRng(seed = Date.now()): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const rand = (rng: () => number, a: number, b: number): number => a + (b - a) * rng()
export const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
export const chance = (rng: () => number, p: number): boolean => rng() < p
