// Modèle géométrique de la maison : emprise (plan), murs (arêtes), ailes rectangulaires, niveaux.
// Partagé par le volume (qui construit les murs), le toit, les ouvertures et l'extérieur.
import * as THREE from 'three'
import type { ParamValues, Provided, Vec3 } from '@/core/types'
import { hashOf } from '@/utils/hash'
import { clamp, deg } from '@/utils/math'
import { eulerFromBasis } from '@/parts/primitives/geo'

export type Face = 'devant' | 'derriere' | 'gauche' | 'droite'

export interface Edge {
  a: [number, number]
  b: [number, number]
  len: number
  /** direction a → b (sens trigonométrique du plan x,z) */
  dir: [number, number]
  /** normale sortante */
  out: [number, number]
  face: Face
  /** rang parmi les murs de même orientation (de gauche à droite pour un spectateur) */
  seg: number
  /** le sommet d'arrivée est rentrant (angle > 180°) : le mur est prolongé d'une épaisseur */
  concaveEnd: boolean
}

export interface Wing {
  cx: number
  cz: number
  w: number
  d: number
}

export interface HouseVolume extends Provided {
  kind: 'volume'
  shape: string
  poly: [number, number][]
  edges: Edge[]
  wings: Wing[]
  W: number
  D: number
  floors: number
  floorH: number
  /** hauteur totale hors-sol */
  H: number
  wallT: number
  basementH: number
  round: boolean
  /** hauteur de la dalle de plancher de l'étage f (0 = rez-de-chaussée) */
  levelY: (f: number) => number
  /** Position et repère d'un point d'un mur : u (m, + vers la droite du spectateur), y (m, absolu) */
  onWall: (face: Face, seg: number, u: number, y: number) => { pos: Vec3; rot: Vec3; edge: Edge; s: number } | null
}

const areaSign = (pts: [number, number][]): number => {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a
}

/** Emprise au sol (sens trigonométrique en x,z) et ailes rectangulaires selon la forme. */
export function footprint(p: ParamValues): { poly: [number, number][]; wings: Wing[]; round: boolean } {
  const W = Math.max(0.5, p.width as number)
  const D = Math.max(0.5, p.depth as number)
  const a = clamp(p.armW as number, 0.5, Math.min(W, D) * 0.95)
  const hw = W / 2
  const hd = D / 2
  switch (p.shape as string) {
    case 'L':
      return {
        poly: [[-hw, -hd], [hw, -hd], [hw, -hd + a], [-hw + a, -hd + a], [-hw + a, hd], [-hw, hd]],
        wings: [{ cx: 0, cz: -hd + a / 2, w: W, d: a }, { cx: -hw + a / 2, cz: a / 2, w: a, d: D - a }],
        round: false,
      }
    case 'U':
      return {
        poly: [[-hw, -hd], [hw, -hd], [hw, hd], [hw - a, hd], [hw - a, -hd + a], [-hw + a, -hd + a], [-hw + a, hd], [-hw, hd]],
        wings: [{ cx: 0, cz: -hd + a / 2, w: W, d: a }, { cx: -hw + a / 2, cz: a / 2, w: a, d: D - a }, { cx: hw - a / 2, cz: a / 2, w: a, d: D - a }],
        round: false,
      }
    case 'T':
      return {
        poly: [[-hw, -hd], [hw, -hd], [hw, -hd + a], [a / 2, -hd + a], [a / 2, hd], [-a / 2, hd], [-a / 2, -hd + a], [-hw, -hd + a]],
        wings: [{ cx: 0, cz: -hd + a / 2, w: W, d: a }, { cx: 0, cz: a / 2, w: a, d: D - a }],
        round: false,
      }
    case 'croix':
      return {
        poly: [[-a / 2, -hd], [a / 2, -hd], [a / 2, -a / 2], [hw, -a / 2], [hw, a / 2], [a / 2, a / 2], [a / 2, hd], [-a / 2, hd], [-a / 2, a / 2], [-hw, a / 2], [-hw, -a / 2], [-a / 2, -a / 2]],
        wings: [{ cx: 0, cz: 0, w: W, d: a }, { cx: 0, cz: 0, w: a, d: D }],
        round: false,
      }
    case 'octogone': {
      const pts: [number, number][] = []
      for (let k = 0; k < 8; k++) {
        const t = (k * Math.PI) / 4 + Math.PI / 8
        pts.push([(hw * Math.cos(t)) / Math.cos(Math.PI / 8), (hd * Math.sin(t)) / Math.cos(Math.PI / 8)])
      }
      return { poly: pts, wings: [{ cx: 0, cz: 0, w: W, d: D }], round: false }
    }
    case 'tour': {
      const pts: [number, number][] = []
      for (let k = 0; k < 36; k++) {
        const t = (k * Math.PI * 2) / 36
        pts.push([hw * Math.cos(t), hd * Math.sin(t)])
      }
      return { poly: pts, wings: [{ cx: 0, cz: 0, w: W, d: D }], round: true }
    }
    default:
      return { poly: [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]], wings: [{ cx: 0, cz: 0, w: W, d: D }], round: false }
  }
}

function faceOf(out: [number, number]): Face {
  if (Math.abs(out[0]) > Math.abs(out[1])) return out[0] > 0 ? 'droite' : 'gauche'
  return out[1] > 0 ? 'devant' : 'derriere'
}

export function makeVolume(p: ParamValues): HouseVolume {
  const { poly: raw, wings, round } = footprint(p)
  const poly = areaSign(raw) < 0 ? raw.slice().reverse() : raw
  const n = poly.length
  const edges: Edge[] = []
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const c = poly[(i + 2) % n]
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const len = Math.hypot(dx, dz)
    const dir: [number, number] = [dx / len, dz / len]
    const out: [number, number] = [dir[1], -dir[0]]
    const cross = dx * (c[1] - b[1]) - dz * (c[0] - b[0])
    edges.push({ a, b, len, dir, out, face: faceOf(out), seg: 0, concaveEnd: cross < -1e-6 })
  }
  // Rang des murs de même orientation, de gauche à droite pour un spectateur placé en face
  for (const f of ['devant', 'derriere', 'gauche', 'droite'] as Face[]) {
    const same = edges.filter((e) => e.face === f)
    same.sort((e1, e2) => {
      const m1 = [(e1.a[0] + e1.b[0]) / 2, (e1.a[1] + e1.b[1]) / 2]
      const m2 = [(e2.a[0] + e2.b[0]) / 2, (e2.a[1] + e2.b[1]) / 2]
      // « gauche du spectateur » = direction −right = +d
      return (m1[0] * e1.dir[0] + m1[1] * e1.dir[1]) - (m2[0] * e1.dir[0] + m2[1] * e1.dir[1])
    })
    same.forEach((e, i) => (e.seg = i))
  }
  const floors = Math.max(1, Math.round(p.floors as number))
  const floorH = Math.max(0.5, p.floorH as number)
  const basementH = p.basement ? Math.max(0.5, p.basementH as number) : 0
  const levelY = (f: number): number => (f < 0 ? -basementH : f * floorH)

  const onWall = (face: Face, seg: number, u: number, y: number) => {
    const same = edges.filter((e) => e.face === face).sort((x, z) => x.seg - z.seg)
    if (!same.length) return null
    const e = same[clamp(Math.round(seg), 0, same.length - 1)]
    const mx = (e.a[0] + e.b[0]) / 2 - e.dir[0] * u
    const mz = (e.a[1] + e.b[1]) / 2 - e.dir[1] * u
    const X = new THREE.Vector3(-e.dir[0], 0, -e.dir[1])
    const Y = new THREE.Vector3(0, 1, 0)
    const Z = new THREE.Vector3(e.out[0], 0, e.out[1])
    return { pos: [mx, y, mz] as Vec3, rot: eulerFromBasis(X, Y, Z), edge: e, s: e.len / 2 - u }
  }

  return {
    key: hashOf(p),
    kind: 'volume',
    shape: p.shape as string,
    poly,
    edges,
    wings,
    W: p.width as number,
    D: p.depth as number,
    floors,
    floorH,
    H: floors * floorH,
    wallT: clamp(p.wallT as number, 0.02, Math.min(p.width as number, p.depth as number) / 2.2),
    basementH,
    round,
    levelY,
    onWall,
  }
}

export { deg }
