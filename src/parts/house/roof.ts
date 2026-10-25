// Toits : plat, 2 pans, 4 pans, pyramide, mansarde, monopente, papillon, dents de scie, dôme, terrasse.
// Ils suivent les ailes du volume (maisons en L, U, T…) et exposent leurs pentes (velux, panneaux solaires).
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant, Provided } from '@/core/types'
import { extrude, mk, roundedBox, shapeFromPts } from '@/parts/primitives/geo'
import { deg } from '@/utils/math'
import { hashOf } from '@/utils/hash'
import type { HouseVolume, Wing } from './model'

const FO = 'Forme du toit'
const DE = 'Détails'

export interface RoofWing {
  cx: number
  cz: number
  span: number
  len: number
  ridgeX: boolean
  baseY: number
  rise: number
  pitch: number
  type: string
}
export interface RoofModel extends Provided {
  kind: 'roof'
  wings: RoofWing[]
  topY: number
}

const rv = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })

function wingsOf(parent: unknown, p: ParamValues): Wing[] {
  const v = parent as HouseVolume | undefined
  if (v?.kind === 'volume') return v.wings
  return [{ cx: 0, cz: 0, w: (p.width as number) ?? 10, d: (p.depth as number) ?? 8 }]
}

export function makeRoofModel(p: ParamValues, parent?: unknown): RoofModel {
  const type = p.type as string
  const wings: RoofWing[] = wingsOf(parent, p).map((w) => {
    const ridgeX = p.ridge === 'x' ? true : p.ridge === 'z' ? false : w.w >= w.d
    const span = ridgeX ? w.d : w.w
    const len = ridgeX ? w.w : w.d
    const pitch = ['plat', 'terrasse', 'dome'].includes(type) ? 0 : (p.pitch as number)
    let rise = Math.tan(deg(pitch)) * (span / 2)
    if (type === 'shed') rise = Math.tan(deg(pitch)) * span
    if (type === 'mansarde') {
      const f = p.breakFrac as number
      rise = Math.tan(deg(p.lowerPitch as number)) * (span / 2) * f + Math.tan(deg(p.upperPitch as number)) * (span / 2) * (1 - f)
    }
    return { cx: w.cx, cz: w.cz, span, len, ridgeX, baseY: 0, rise, pitch, type }
  })
  return { key: hashOf([p, (parent as Provided | undefined)?.key]), kind: 'roof', wings, topY: Math.max(...wings.map((w) => w.rise), 0.2) }
}

/** Solide quelconque à partir de sommets et de faces polygonales convexes. */
function polyhedron(verts: number[][], faces: number[][]): THREE.BufferGeometry {
  const pos: number[] = []
  const c = new THREE.Vector3()
  for (const v of verts) c.add(new THREE.Vector3(...v))
  c.divideScalar(verts.length)
  for (const f of faces) {
    // Oriente chaque face vers l'extérieur du solide (normale opposée au centre)
    const [a, b, d] = [0, 1, 2].map((i) => new THREE.Vector3(...verts[f[i]]))
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), d.clone().sub(a))
    const mid = new THREE.Vector3()
    for (const i of f) mid.add(new THREE.Vector3(...verts[i]))
    mid.divideScalar(f.length).sub(c)
    const idx = n.dot(mid) < 0 ? f.slice().reverse() : f
    for (let i = 1; i < idx.length - 1; i++) {
      for (const k of [0, i, i + 1]) pos.push(...verts[idx[k]])
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

/** Prisme dont la section (z, y) est extrudée sur la longueur (axe x). */
function prism(section: [number, number][], len: number): THREE.BufferGeometry {
  const g = extrude(shapeFromPts(section), len)
  g.rotateY(Math.PI / 2)
  return g
}

function buildWing(p: ParamValues, w: RoofWing): THREE.Object3D {
  const g = new THREE.Group()
  const o = p.overhang as number
  const t = p.thick as number
  const S = w.span
  const L = w.len
  const th = Math.tan(deg(w.pitch))
  const dy = th * o
  const Ss = S + 2 * o
  const Ls = L + 2 * o
  const type = w.type
  const add = (geo: THREE.BufferGeometry) => {
    const m = mk(geo, 'roof', { edgeAngle: 25 })
    m.userData.roofPart = true
    g.add(m)
    return m
  }
  switch (type) {
    case 'plat':
    case 'terrasse': {
      const slab = add(roundedBox(Ls, t, Ss, Math.min(0.03, t / 3)))
      slab.position.y = t / 2
      if (type === 'terrasse') {
        const ph = p.parapetH as number
        const pt = 0.15
        const rail = p.railing as string
        const wall = (lx: number, lz: number, px: number, pz: number) => {
          const m = mk(roundedBox(lx, ph, lz, 0.01), 'wall', { edgeAngle: 30 })
          m.position.set(px, t + ph / 2, pz)
          g.add(m)
        }
        if (rail === 'muret') {
          wall(Ls, pt, 0, Ss / 2 - pt / 2)
          wall(Ls, pt, 0, -Ss / 2 + pt / 2)
          wall(pt, Ss - 2 * pt, Ls / 2 - pt / 2, 0)
          wall(pt, Ss - 2 * pt, -Ls / 2 + pt / 2, 0)
        } else {
          const post = (px: number, pz: number) => {
            const m = mk(new THREE.BoxGeometry(0.05, ph, 0.05), 'metal', { edgeAngle: 40 })
            m.position.set(px, t + ph / 2, pz)
            g.add(m)
          }
          const bar = (lx: number, lz: number, px: number, pz: number, y: number) => {
            const m = mk(new THREE.BoxGeometry(lx, 0.035, lz), 'metal', { edgeAngle: 40 })
            m.position.set(px, t + y, pz)
            g.add(m)
          }
          const sides: [number, number, number, number][] = [[Ls, 0.04, 0, Ss / 2 - 0.05], [Ls, 0.04, 0, -Ss / 2 + 0.05], [0.04, Ss, Ls / 2 - 0.05, 0], [0.04, Ss, -Ls / 2 + 0.05, 0]]
          for (const [lx, lz, px, pz] of sides) {
            bar(lx, lz, px, pz, ph)
            if (rail === 'barreaux') {
              const along = lx > lz
              const n = Math.max(2, Math.round((along ? lx : lz) / 0.26))
              for (let i = 0; i <= n; i++) {
                const k = -0.5 + i / n
                post(along ? k * lx : px, along ? pz : k * lz)
              }
            } else if (rail === 'verre') {
              const pane = mk(new THREE.BoxGeometry(lx > lz ? lx : 0.02, ph * 0.9, lx > lz ? 0.02 : lz), 'glass', { edgeAngle: 40 })
              pane.position.set(px, t + ph * 0.5, pz)
              g.add(pane)
            }
          }
          for (const [px, pz] of [[-Ls / 2 + 0.05, -Ss / 2 + 0.05], [Ls / 2 - 0.05, -Ss / 2 + 0.05], [Ls / 2 - 0.05, Ss / 2 - 0.05], [-Ls / 2 + 0.05, Ss / 2 - 0.05]]) post(px, pz)
        }
      }
      break
    }
    case 'deux-pans': {
      add(prism([[-Ss / 2, -dy], [Ss / 2, -dy], [0, w.rise]], Ls))
      break
    }
    case 'quatre-pans':
    case 'pyramide': {
      const rl = type === 'pyramide' ? 0 : Math.max(0, (L - S) / 2)
      const hx = Ls / 2
      const hz = Ss / 2
      const V = [
        [-hx, -dy, -hz], [hx, -dy, -hz], [hx, -dy, hz], [-hx, -dy, hz],
        [-rl, w.rise, 0], [rl, w.rise, 0],
      ]
      const faces = rl > 0
        ? [[0, 1, 5, 4], [1, 2, 5], [2, 3, 4, 5], [3, 0, 4], [3, 2, 1, 0]]
        : [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [3, 2, 1, 0]]
      add(polyhedron(V, faces))
      break
    }
    case 'mansarde': {
      const f = p.breakFrac as number
      const yb = Math.tan(deg(p.lowerPitch as number)) * (S / 2) * f
      add(prism([[-Ss / 2, -0.05], [Ss / 2, -0.05], [S / 2, 0], [S / 2 * (1 - f), yb], [0, w.rise], [-S / 2 * (1 - f), yb], [-S / 2, 0]], Ls))
      break
    }
    case 'shed': {
      const R = th * Ss
      add(prism([[-Ss / 2, 0], [Ss / 2, 0], [Ss / 2, R], [-Ss / 2, th * 0.0]], Ls))
      break
    }
    case 'papillon': {
      const Rb = th * (S / 2)
      add(prism([[-Ss / 2, -t], [Ss / 2, -t], [Ss / 2, Rb], [0, 0.05], [-Ss / 2, Rb]], Ls))
      break
    }
    case 'dents': {
      const n = Math.max(1, Math.round(p.saw as number))
      const tw = Ss / n
      const hh = Math.max(0.2, th * tw)
      const pts: [number, number][] = [[-Ss / 2, -t]]
      for (let i = 0; i < n; i++) {
        const x0 = -Ss / 2 + i * tw
        pts.push([x0, 0], [x0 + tw, hh], [x0 + tw, 0])
      }
      pts.pop()
      pts.push([Ss / 2, -t])
      add(prism(pts, Ls))
      break
    }
    case 'dome': {
      const r = Math.max(0.1, p.domeRise as number)
      const geo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2)
      geo.scale(Ls / 2, r, Ss / 2)
      add(geo)
      break
    }
  }
  return g
}

registerPart({
  type: 'house.roof',
  planHide: true,
  label: 'Toit',
  category: 'toit',
  icon: '🏠',
  module: 'maison',
  followsParent: ['house.volume'],
  variants: [
    rv('2p', 'Deux pans', '🏠', { type: 'deux-pans', pitch: 35 }),
    rv('4p', 'Quatre pans', '🏡', { type: 'quatre-pans', pitch: 30 }),
    rv('mans', 'Mansarde', '🏛️', { type: 'mansarde' }),
    rv('plat', 'Toit plat', '⬜', { type: 'plat' }),
    rv('terrasse', 'Toit-terrasse', '🌇', { type: 'terrasse' }),
    rv('shed', 'Monopente', '📐', { type: 'shed', pitch: 15 }),
    rv('papillon', 'Papillon', '🦋', { type: 'papillon', pitch: 14 }),
    rv('pyr', 'Pyramide', '🔺', { type: 'pyramide', pitch: 45 }),
    rv('dents', 'Dents de scie', '⚙️', { type: 'dents', pitch: 30 }),
    rv('dome', 'Dôme', '🕌', { type: 'dome' }),
  ],
  schema: [
    choice('type', 'Type de toit', 'deux-pans', [['deux-pans', 'Deux pans', '🏠'], ['quatre-pans', 'Quatre pans', '🏡'], ['pyramide', 'Pyramide', '🔺'], ['mansarde', 'Mansarde', '🏛️'], ['plat', 'Plat', '⬜'], ['terrasse', 'Terrasse', '🌇'], ['shed', 'Monopente', '📐'], ['papillon', 'Papillon', '🦋'], ['dents', 'Dents de scie', '⚙️'], ['dome', 'Dôme', '🕌']], { group: FO, level: 'easy' }),
    num('pitch', 'Pente', 35, [3, 75], { group: FO, level: 'easy', step: 0.5, unit: '°', tip: 'Inclinaison du toit. Aucune limite : tu peux choisir une pente très forte.', showIf: (p) => !['plat', 'terrasse', 'dome', 'mansarde'].includes(p.type as string) }),
    num('lowerPitch', 'Pente du bas (mansarde)', 70, [40, 85], { group: FO, step: 0.5, unit: '°', showIf: (p) => p.type === 'mansarde' }),
    num('upperPitch', 'Pente du haut (mansarde)', 25, [5, 60], { group: FO, step: 0.5, unit: '°', showIf: (p) => p.type === 'mansarde' }),
    num('breakFrac', 'Hauteur de la cassure', 0.55, [0.2, 0.9], { group: FO, step: 0.01, showIf: (p) => p.type === 'mansarde' }),
    pos('overhang', 'Débord du toit', 0.4, [0, 2], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.2, [0.04, 0.8], { group: FO, unit: 'm', showIf: (p) => ['plat', 'terrasse', 'papillon', 'dents'].includes(p.type as string) }),
    choice('ridge', 'Sens du faîtage', 'auto', [['auto', 'Automatique', '🔄'], ['x', 'Le long de la façade', '↔️'], ['z', 'Vers l’avant', '↕️']], { group: FO, showIf: (p) => !['plat', 'terrasse', 'dome'].includes(p.type as string) }),
    int('saw', 'Nombre de dents', 4, [1, 14], { group: DE, showIf: (p) => p.type === 'dents' }),
    pos('domeRise', 'Hauteur du dôme', 2.5, [0.3, 12], { group: FO, level: 'easy', unit: 'm', showIf: (p) => p.type === 'dome' }),
    pos('parapetH', 'Hauteur du garde-corps', 1.0, [0.3, 2], { group: DE, unit: 'm', showIf: (p) => p.type === 'terrasse' }),
    choice('railing', 'Garde-corps', 'barre', [['muret', 'Muret', '🧱'], ['barreaux', 'Barreaux', '▥'], ['verre', 'Verre', '🪟'], ['barre', 'Barre simple', '➖']], { group: DE, showIf: (p) => p.type === 'terrasse' }),
    pos('width', 'Largeur (si libre)', 10, [1, 30], { group: DE, unit: 'm', tip: 'Utilisé quand le toit ne suit pas un volume.' }),
    pos('depth', 'Profondeur (si libre)', 8, [1, 30], { group: DE, unit: 'm' }),
    bool('gutter', 'Gouttière', false, { group: DE, showIf: (p) => !['plat', 'terrasse', 'dome', 'pyramide'].includes(p.type as string) }),
  ],
  provide: (p, parent) => makeRoofModel(p, parent),
  fit: (parent) => {
    const v = parent as HouseVolume
    if (v?.kind !== 'volume') return {}
    return { pos: [0, v.H, 0] }
  },
  build: (p, ctx) => {
    const model = makeRoofModel(p, ctx.parent)
    const root = new THREE.Group()
    for (const w of model.wings) {
      const g = buildWing(p, w)
      const holder = new THREE.Group()
      holder.add(g)
      // orientation du faîtage : le prisme est construit faîtage le long de x ; sinon on pivote d'un quart de tour
      if (!w.ridgeX) holder.rotation.y = Math.PI / 2
      const outer = new THREE.Group()
      outer.add(holder)
      outer.position.set(w.cx, 0, w.cz)
      root.add(outer)
      if (p.gutter && !['plat', 'terrasse', 'dome', 'pyramide'].includes(w.type)) {
        const o = p.overhang as number
        for (const s of [-1, 1]) {
          const gt = mk(new THREE.CylinderGeometry(0.05, 0.05, w.len + 2 * o, 12), 'metal', { edgeAngle: 50 })
          gt.rotation.z = Math.PI / 2
          const dyy = Math.tan(deg(w.pitch)) * o
          gt.position.set(0, -dyy - 0.04, s * (w.span / 2 + o))
          holder.add(gt)
        }
      }
    }
    return root
  },
  handles: (p): Handle[] => [{ id: 'o', label: 'Débord', position: [(p.width as number) / 2 + (p.overhang as number), 0, 0], axis: [1, 0, 0], param: 'overhang', ratio: 1 }],
})
