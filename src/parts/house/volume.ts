// Volume de la maison : murs construits mur par mur (donc percés par leurs ouvertures),
// formes en rectangle, L, U, T, croix, octogone, tour ronde ; étages, sous-sol, rooftop.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { ChildInfo, DimLine, Handle, ParamValues, PartVariant } from '@/core/types'
import { mergeGeos, mk, roundedBox } from '@/parts/primitives/geo'
import { clamp } from '@/utils/math'
import { makeVolume, type Edge, type HouseVolume } from './model'
import { openingOffsets, openingOutline } from './openings'

const FO = 'Forme et taille'
const DE = 'Détails de façade'
const SO = 'Sous-sol et toit-terrasse'

const hv = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })

interface Hole {
  s: number
  y: number
  poly: [number, number][]
  notch: boolean
}

/** Trous d'un mur : issus des ouvertures enfants posées sur cette arête. */
function holesFor(edgeIdx: number, kids: ChildInfo[]): Hole[] {
  const out: Hole[] = []
  for (const k of kids) {
    if (k.type !== 'house.opening' || k.params._edge !== edgeIdx || k.params.kind === 'velux') continue
    const outline = openingOutline(k.params)
    const baseOnFloor = outline[0][1] === 0 && outline[1][1] === 0
    const s0 = k.params._s as number
    const yb = k.params._y as number
    for (const off of openingOffsets(k.params)) {
      out.push({ s: s0 - off, y: yb, poly: outline, notch: baseOnFloor && yb <= 1e-3 })
    }
  }
  return out
}

/** Géométrie d'un mur : rectangle d'élévation (longueur × hauteur) avec trous et encoches, extrudé vers l'intérieur. */
function wallGeo(e: Edge, v: HouseVolume, Hw: number, holes: Hole[]): THREE.BufferGeometry {
  const t = v.wallT
  const len = e.len + (e.concaveEnd ? t : 0)
  const m = 0.03
  const shape = new THREE.Shape()
  const notches = holes.filter((h) => h.notch).sort((a, b) => a.s - b.s)
  shape.moveTo(0, 0)
  for (const n of notches) {
    const pts = n.poly
    // sens croissant de s : indices 1, 2 … n-1, 0 (l'abscisse locale x est opposée à s)
    const order = [...pts.slice(1), pts[0]]
    const path = order.map(([x, y]) => [clamp(n.s - x, m, len - m), Math.min(Hw - m, y)] as [number, number])
    shape.lineTo(path[0][0], 0)
    for (const q of path) shape.lineTo(q[0], q[1])
    shape.lineTo(path[path.length - 1][0], 0)
  }
  shape.lineTo(len, 0)
  shape.lineTo(len, Hw)
  shape.lineTo(0, Hw)
  shape.closePath()
  for (const h of holes.filter((x) => !x.notch)) {
    const pts = h.poly.map(([x, y]) => new THREE.Vector2(clamp(h.s - x, m, len - m), clamp(h.y + y, m, Hw - m)))
    shape.holes.push(new THREE.Path(pts))
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 16 })
  // Repère du mur : X le long de a→b, Y vers le haut, Z vers l'intérieur
  const X = new THREE.Vector3(e.dir[0], 0, e.dir[1])
  const Y = new THREE.Vector3(0, 1, 0)
  const Z = new THREE.Vector3().crossVectors(X, Y)
  const mat = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(e.a[0], -v.basementH, e.a[1])
  g.applyMatrix4(mat)
  return g
}

/** Bande horizontale le long d'un mur (corniche, soubassement, garde-corps). */
function band(e: Edge, v: HouseVolume, y: number, h: number, out: number, inward: number): THREE.BufferGeometry {
  const len = e.len
  const g = roundedBox(len, h, out + inward, Math.min(0.02, h / 3))
  // boîte centrée : x le long du mur, z = épaisseur (de -inward à +out)
  g.translate(0, h / 2, (out - inward) / 2)
  const X = new THREE.Vector3(e.dir[0], 0, e.dir[1])
  const Y = new THREE.Vector3(0, 1, 0)
  const Z = new THREE.Vector3(e.out[0], 0, e.out[1])
  const mat = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition((e.a[0] + e.b[0]) / 2, y, (e.a[1] + e.b[1]) / 2)
  g.applyMatrix4(mat)
  return g
}

/** Dalle horizontale à l'emprise de la maison. */
function slab(v: HouseVolume, y: number, thick: number): THREE.BufferGeometry {
  const sh = new THREE.Shape(v.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 12 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y, 0)
  return g
}

registerPart({
  type: 'house.volume',
  label: 'Volume / bloc',
  category: 'volume',
  icon: '🏠',
  module: 'maison',
  consumesChildren: true,
  variants: [
    hv('maison', 'Maison simple', '🏠', { shape: 'rect', width: 10, depth: 8, floors: 2, floorH: 2.7 }),
    hv('L', 'Maison en L', '🅻', { shape: 'L', width: 12, depth: 10, armW: 5, floors: 2 }),
    hv('U', 'Maison en U', '🅤', { shape: 'U', width: 14, depth: 9, armW: 4, floors: 2 }),
    hv('T', 'Maison en T', '🅃', { shape: 'T', width: 14, depth: 10, armW: 5, floors: 2 }),
    hv('croix', 'En croix', '✚', { shape: 'croix', width: 12, depth: 12, armW: 5, floors: 2 }),
    hv('octo', 'Octogonale', '🛑', { shape: 'octogone', width: 10, depth: 10, floors: 2 }),
    hv('tour', 'Tour ronde', '🏰', { shape: 'tour', width: 6, depth: 6, floors: 4 }),
    hv('garage', 'Garage (bloc)', '🚘', { shape: 'rect', width: 3.6, depth: 6, floors: 1, floorH: 2.5 }),
    hv('immeuble', 'Immeuble', '🏢', { shape: 'rect', width: 18, depth: 12, floors: 6, floorH: 3 }),
    hv('tourhaute', 'Gratte-ciel', '🌆', { shape: 'rect', width: 20, depth: 20, floors: 20, floorH: 3.2 }),
  ],
  schema: [
    choice('shape', 'Forme du plan', 'rect', [['rect', 'Rectangle', '▭'], ['L', 'En L', '🅻'], ['U', 'En U', '🅤'], ['T', 'En T', '🅃'], ['croix', 'En croix', '✚'], ['octogone', 'Octogone', '🛑'], ['tour', 'Tour ronde', '🏰']], { group: FO, level: 'easy' }),
    pos('width', 'Largeur', 10, [2, 40], { group: FO, level: 'easy', unit: 'm', tip: 'De gauche à droite de la façade.' }),
    pos('depth', 'Profondeur', 8, [2, 40], { group: FO, level: 'easy', unit: 'm', tip: 'De la façade à l’arrière.' }),
    int('floors', 'Nombre d’étages', 2, [1, 20], { group: FO, level: 'easy', max: 200, tip: '1 = rez-de-chaussée seul.' }),
    pos('floorH', 'Hauteur sous plafond + dalle', 2.7, [2, 5], { group: FO, unit: 'm' }),
    pos('wallT', 'Épaisseur des murs', 0.3, [0.05, 1], { group: FO, unit: 'm' }),
    pos('armW', 'Largeur des ailes', 4.5, [2, 15], { group: FO, unit: 'm', showIf: (p) => ['L', 'U', 'T', 'croix'].includes(p.shape as string) }),

    bool('floorLines', 'Corniches entre les étages', true, { group: DE }),
    bool('plinth', 'Soubassement', true, { group: DE }),
    bool('cap', 'Dalle de toiture', true, { group: DE, tip: 'Ferme le dessus du bâtiment (indispensable sans toit).' }),

    bool('basement', 'Sous-sol', false, { group: SO, level: 'easy', tip: 'Ajoute un niveau sous le sol.' }),
    pos('basementH', 'Hauteur du sous-sol', 2.5, [1.5, 5], { group: SO, unit: 'm', showIf: (p) => !!p.basement }),
    bool('parapet', 'Rooftop (muret en haut)', false, { group: SO, level: 'easy', tip: 'Muret autour du toit plat pour une terrasse accessible.' }),
    pos('parapetH', 'Hauteur du muret', 1.0, [0.3, 2], { group: SO, unit: 'm', showIf: (p) => !!p.parapet }),
  ],
  provide: (p) => makeVolume(p),
  build: (p, ctx) => {
    const v = makeVolume(p)
    const kids = ctx.children ?? []
    const root = new THREE.Group()
    const Hw = v.H + v.basementH
    // Murs
    const walls: THREE.BufferGeometry[] = []
    if (v.round) {
      const sh = new THREE.Shape(v.poly.map(([x, z]) => new THREE.Vector2(x, -z)))
      const g = new THREE.ExtrudeGeometry(sh, { depth: Hw, bevelEnabled: false, curveSegments: 12 })
      g.rotateX(-Math.PI / 2)
      g.translate(0, -v.basementH, 0)
      root.add(mk(g, 'wall', { edgeAngle: 25 }))
    } else {
      v.edges.forEach((e, i) => walls.push(wallGeo(e, v, Hw, holesFor(i, kids))))
      root.add(mk(mergeGeos(walls), 'wall', { edgeAngle: 28 }))
    }
    // Dalle de sol
    const floor = mk(slab(v, -v.basementH, 0.15), 'wall', { edgeAngle: 28 })
    root.add(floor)
    // Dalle de toiture (masquée en mode plan)
    if (p.cap) {
      const cap = mk(slab(v, v.H - 0.2, 0.2), 'wall', { edgeAngle: 28 })
      cap.userData.planHide = true
      root.add(cap)
    }
    const bands: THREE.BufferGeometry[] = []
    if (p.floorLines && !v.round) {
      for (let f = 1; f < v.floors; f++) for (const e of v.edges) bands.push(band(e, v, f * v.floorH - 0.08, 0.16, 0.06, 0))
    }
    if (p.plinth && !v.round) for (const e of v.edges) bands.push(band(e, v, -0.02, 0.6, 0.04, 0))
    if (bands.length) root.add(mk(mergeGeos(bands), 'wall', { edgeAngle: 35 }))
    if (p.parapet && !v.round) {
      const pg = v.edges.map((e) => band(e, v, v.H, p.parapetH as number, 0, 0.18))
      const m = mk(mergeGeos(pg), 'wall', { edgeAngle: 35 })
      m.userData.planHide = true
      root.add(m)
    }
    return root
  },
  dims: (p): DimLine[] => {
    const v = makeVolume(p)
    const hw = v.W / 2
    const hd = v.D / 2
    const lines: DimLine[] = [
      { a: [-hw, 0, hd], b: [hw, 0, hd], offset: 1.0, dir: [0, 0, 1], label: `${v.W.toFixed(2)} m` },
      { a: [hw, 0, -hd], b: [hw, 0, hd], offset: 1.0, dir: [1, 0, 0], label: `${v.D.toFixed(2)} m` },
      { a: [-hw, 0, hd], b: [-hw, v.H, hd], offset: 1.0, dir: [-1, 0, 0], label: `${v.H.toFixed(2)} m` },
    ]
    if (v.floors > 1) lines.push({ a: [-hw, 0, hd], b: [-hw, v.floorH, hd], offset: 2.2, dir: [-1, 0, 0], label: `${v.floorH.toFixed(2)} m / étage` })
    lines.push({ a: [-hw, 0.02, hd], b: [-hw + v.wallT, 0.02, hd], offset: -0.5, dir: [0, 0, 1], label: `mur ${(v.wallT * 100).toFixed(0)} cm` })
    return lines
  },
  handles: (p): Handle[] => [
    { id: 'w', label: 'Largeur', position: [(p.width as number) / 2, ((p.floors as number) * (p.floorH as number)) / 2, 0], axis: [1, 0, 0], param: 'width', ratio: 2 },
    { id: 'd', label: 'Profondeur', position: [0, ((p.floors as number) * (p.floorH as number)) / 2, (p.depth as number) / 2], axis: [0, 0, 1], param: 'depth', ratio: 2 },
    { id: 'h', label: 'Hauteur (hauteur d’étage)', position: [-(p.width as number) / 2, (p.floors as number) * (p.floorH as number), 0], axis: [0, 1, 0], param: 'floorH', ratio: 1 / (p.floors as number) },
  ],
})
