// Hash rapide et stable d'un objet JSON (clés de cache géométrie).
export function hashOf(value: unknown): string {
  const s = JSON.stringify(value)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36) + s.length.toString(36)
}
