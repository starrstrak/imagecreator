// Éclairage et face avant : phares, feux arrière, calandre, barre de leds, plaques.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { cylinder, extrude, ellipseShape, mk, roundPoly, roundedBox, shapeFromPts, xf } from '@/parts/primitives/geo'
import { clamp } from '@/utils/math'
import { asBody } from './util'

const FO = 'Forme'
const PO = 'Position'
const IN = 'Détails'

/** Contour d'un phare / feu dans le plan (x, y), centré. */
export function lampOutline(shape: string, w: number, h: number, q: number): [number, number][] {
  switch (shape) {
    case 'rond':
    case 'retractable': {
      const pts: [number, number][] = []
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2
        pts.push([Math.cos(a) * w / 2, Math.sin(a) * h / 2])
      }
      return pts
    }
    case 'amande':
      return roundPoly([[-w / 2, -h * 0.1], [-w * 0.1, -h / 2], [w / 2, -h * 0.28], [w * 0.3, h / 2], [-w * 0.4, h * 0.38]], 0.3, 2)
    case 'led': // barre fine
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 0.4, 2)
    case 'carre':
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], Math.min(0.15, q), 1)
    case 'coin': // feu en L
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, -h * 0.1], [-w * 0.1, -h * 0.1], [-w * 0.1, h / 2], [-w / 2, h / 2]], 0.18, 2)
    default: // rectangle arrondi
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - w * 0.08, h / 2], [-w / 2 + w * 0.08, h / 2]], q, 2)
  }
}

const lampSchema = (rear: boolean) => [
  choice('shape', 'Forme', rear ? 'rect' : 'rond', rear
    ? [['rect', 'Rectangle', '▭'], ['led', 'Barre LED', '➖'], ['coin', 'En L', '⅃'], ['rond', 'Rond', '⚪'], ['amande', 'Amande', '🥜'], ['carre', 'Carré', '⬜']]
    : [['rond', 'Rond', '⚪'], ['amande', 'Amande', '🥜'], ['rect', 'Rectangle', '▭'], ['led', 'Barre LED', '➖'], ['carre', 'Carré', '⬜'], ['retractable', 'Rétractable', '🔦']], { group: FO, level: 'easy' }),
  pos('w', 'Largeur', rear ? 0.36 : 0.3, [0.04, 1.6], { group: FO, level: 'easy', unit: 'm' }),
  pos('h', 'Hauteur', rear ? 0.14 : 0.16, [0.02, 0.8], { group: FO, level: 'easy', unit: 'm' }),
  num('round', 'Arrondi des coins', 0.25, [0.03, 0.45], { group: FO, step: 0.005, showIf: (p: ParamValues) => ['rect', 'carre'].includes(p.shape as string) }),
  num('tilt', 'Inclinaison', rear ? 0 : 12, [-90, 90], { group: FO, step: 1, unit: '°', tip: 'Fait pivoter le phare dans son plan.' }),
  pos('depth', 'Épaisseur', 0.05, [0.01, 0.3], { group: FO, unit: 'm' }),
  num('lat', 'Distance au centre', rear ? 0.7 : 0.62, [0, 2], { group: PO, level: 'easy', unit: 'm', tip: 'Écart par rapport à l’axe de la voiture.' }),
  num('hgt', 'Hauteur du centre', rear ? 0.78 : 0.7, [0.1, 4], { group: PO, level: 'easy', unit: 'm' }),
  int('rings', 'Cercles intérieurs', rear ? 0 : 2, [0, 5], { group: IN, tip: 'Optiques concentriques à l’intérieur du phare.' }),
  bool('lid', 'Paupière', false, { group: IN, tip: 'Une arête au-dessus du phare.' }),
  int('bars', 'Segments', rear ? 3 : 0, [0, 8], { group: IN, showIf: (p: ParamValues) => (p.shape === 'led' || rear) as boolean }),
]

function buildLamp(p: ParamValues, rear: boolean): THREE.Object3D {
  const w = p.w as number
  const h = p.h as number
  const d = p.depth as number
  const out = lampOutline(p.shape as string, w, h, p.round as number)
  const root = new THREE.Group()
  const inner = new THREE.Group()
  const bezel = mk(extrude(shapeFromPts(out), d), 'dark', { edgeAngle: 30 })
  inner.add(bezel)
  // Verre : contour réduit en relief
  const cx = out.reduce((s, q) => s + q[0], 0) / out.length
  const cy = out.reduce((s, q) => s + q[1], 0) / out.length
  const sc = (k: number) => out.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k] as [number, number])
  const lens = mk(extrude(shapeFromPts(sc(0.82)), d * 0.5), rear ? 'red' : 'light', { edgeAngle: 30 })
  lens.position.z = d * 0.4
  inner.add(lens)
  const rings = Math.round(p.rings as number)
  for (let i = 0; i < rings; i++) {
    const k = 0.6 - (i * 0.5) / Math.max(1, rings)
    const r = mk(extrude(ellipseShape(w * k, h * k), d * 0.3), 'metal', { edgeAngle: 40 })
    r.position.set(cx, cy, d * 0.75 + i * d * 0.12)
    inner.add(r)
  }
  const bars = Math.round(p.bars as number)
  for (let i = 1; i <= bars; i++) {
    const g = new THREE.BoxGeometry(0.012, h * 0.8, d * 0.2)
    const m = mk(g, 'dark', { edgeAngle: 40 })
    m.position.set(-w / 2 + (w * i) / (bars + 1), cy, d * 0.95)
    inner.add(m)
  }
  if (p.lid) {
    const lid = mk(roundedBox(w * 1.05, h * 0.16, d * 1.2, 0.02), 'body', { edgeAngle: 40 })
    lid.position.set(cx, cy + h * 0.52, d * 0.4)
    inner.add(lid)
  }
  inner.rotation.z = ((p.tilt as number) * Math.PI) / 180 * (rear ? -1 : 1)
  // La pièce regarde vers +X (avant) ou -X (arrière) : l'axe d'extrusion Z devient X
  inner.rotation.y = rear ? -Math.PI / 2 : Math.PI / 2
  root.add(inner)
  return root
}

registerPart({
  type: 'vehicule.headlight',
  label: 'Phare',
  category: 'eclairage',
  icon: '💡',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'rond', label: 'Ronds', icon: '⚪', params: { shape: 'rond', w: 0.2, h: 0.2, rings: 2, tilt: 0 } },
    { id: 'amande', label: 'Amande', icon: '🥜', params: { shape: 'amande', w: 0.36, h: 0.16, rings: 1, tilt: 8 } },
    { id: 'led', label: 'Barre LED', icon: '➖', params: { shape: 'led', w: 0.5, h: 0.05, rings: 0, bars: 4 } },
    { id: 'carre', label: 'Carrés', icon: '⬜', params: { shape: 'carre', w: 0.24, h: 0.2, rings: 1, tilt: 0 } },
    { id: 'retract', label: 'Rétractables', icon: '🔦', params: { shape: 'retractable', w: 0.22, h: 0.22, rings: 0, lid: true } },
  ] as PartVariant[],
  schema: lampSchema(false),
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const z = own.lat as number
    return { pos: [b.noseX(z) - (own.depth as number) * 0.6, own.hgt as number, z] }
  },
  build: (p) => buildLamp(p, false),
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [0.05, 0, -(p.w as number) / 2], axis: [0, 0, -1], param: 'w', ratio: 2 }],
})

registerPart({
  type: 'vehicule.taillight',
  label: 'Feu arrière',
  category: 'eclairage',
  icon: '🔴',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'rect', label: 'Rectangulaire', icon: '▭', params: { shape: 'rect', w: 0.36, h: 0.14, bars: 3 } },
    { id: 'led', label: 'Barre LED', icon: '➖', params: { shape: 'led', w: 0.7, h: 0.05, bars: 6 } },
    { id: 'coin', label: 'En L', icon: '⅃', params: { shape: 'coin', w: 0.3, h: 0.3, bars: 0 } },
    { id: 'rond', label: 'Ronds', icon: '⚪', params: { shape: 'rond', w: 0.16, h: 0.16, bars: 0, rings: 2 } },
  ] as PartVariant[],
  schema: lampSchema(true),
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const z = own.lat as number
    return { pos: [b.tailX(z) + (own.depth as number) * 0.6, own.hgt as number, z] }
  },
  build: (p) => buildLamp(p, true),
})

registerPart({
  type: 'vehicule.grille',
  label: 'Calandre',
  category: 'eclairage',
  icon: '🔲',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('shape', 'Forme', 'trapeze', [['rect', 'Rectangle', '▭'], ['trapeze', 'Trapèze', '⏢'], ['ovale', 'Ovale', '🥚'], ['hexagone', 'Hexagone', '⬡'], ['double', 'Doublé (reins)', '▯▯']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 0.9, [0.1, 2.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.28, [0.04, 1.2], { group: FO, level: 'easy', unit: 'm' }),
    num('topRatio', 'Largeur du haut', 0.85, [0.3, 1.3], { group: FO, step: 0.005, showIf: (p) => p.shape === 'trapeze' }),
    num('round', 'Arrondi', 0.2, [0.03, 0.45], { group: FO, step: 0.005 }),
    choice('bars', 'Motif', 'horizontal', [['aucun', 'Plein', '⬛'], ['horizontal', 'Barres horizontales', '☰'], ['vertical', 'Barres verticales', '|||'], ['grille', 'Quadrillage', '#️⃣'], ['nid', 'Nid d’abeille', '🐝']], { group: IN, level: 'easy' }),
    int('barCount', 'Nombre de barres', 5, [1, 20], { group: IN, showIf: (p) => ['horizontal', 'vertical', 'grille'].includes(p.bars as string) }),
    pos('barW', 'Épaisseur des barres', 0.018, [0.004, 0.08], { group: IN, unit: 'm', showIf: (p) => ['horizontal', 'vertical', 'grille', 'nid'].includes(p.bars as string) }),
    pos('depth', 'Épaisseur de la calandre', 0.05, [0.01, 0.3], { group: IN, unit: 'm' }),
    bool('badge', 'Écusson central', true, { group: IN }),
    num('lat', 'Décalage latéral', 0, [-1, 1], { group: PO, unit: 'm' }),
    num('hgt', 'Hauteur du centre', 0.5, [0.1, 3], { group: PO, level: 'easy', unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    return { pos: [b.noseX(own.lat as number) - (own.depth as number) * 0.5, own.hgt as number, own.lat as number] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const d = p.depth as number
    const tw = w * (p.topRatio as number)
    let out: [number, number][]
    switch (p.shape) {
      case 'ovale': out = lampOutline('rond', w, h, 0); break
      case 'hexagone': out = roundPoly([[-w / 2, 0], [-w / 2 + h * 0.5, -h / 2], [w / 2 - h * 0.5, -h / 2], [w / 2, 0], [w / 2 - h * 0.5, h / 2], [-w / 2 + h * 0.5, h / 2]], 0.15, 2); break
      case 'trapeze': out = roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [tw / 2, h / 2], [-tw / 2, h / 2]], p.round as number, 2); break
      default: out = roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], p.round as number, 2)
    }
    const root = new THREE.Group()
    const g = new THREE.Group()
    g.add(mk(extrude(shapeFromPts(out), d), 'body', { edgeAngle: 30 }))
    const bw = p.barW as number
    const count = Math.round(p.barCount as number)
    const mode = p.bars as string
    const front = d * 0.6
    if (mode === 'horizontal' || mode === 'grille') {
      for (let i = 1; i <= count; i++) {
        const m = mk(new THREE.BoxGeometry(w * 0.94, bw, d * 0.5), 'dark', { edgeAngle: 40 })
        m.position.set(0, -h / 2 + (h * i) / (count + 1), front)
        g.add(m)
      }
    }
    if (mode === 'vertical' || mode === 'grille') {
      for (let i = 1; i <= count; i++) {
        const m = mk(new THREE.BoxGeometry(bw, h * 0.92, d * 0.5), 'dark', { edgeAngle: 40 })
        m.position.set(-w / 2 + (w * i) / (count + 1), 0, front)
        g.add(m)
      }
    }
    if (mode === 'nid') {
      const cell = Math.max(bw * 4, 0.05)
      const geos: THREE.BufferGeometry[] = []
      for (let yy = -h / 2 + cell; yy < h / 2 - cell / 2; yy += cell * 0.9) {
        const row = Math.round((yy + h / 2) / (cell * 0.9))
        for (let xx = -w / 2 + cell; xx < w / 2 - cell / 2; xx += cell) {
          geos.push(xf(cylinder(cell * 0.4, cell * 0.4, d * 0.4, 6), xx + (row % 2 ? cell / 2 : 0), yy, front, 90))
        }
      }
      if (geos.length) {
        const merged = new THREE.Group()
        for (const gg of geos) merged.add(mk(gg, 'dark', { edgeAngle: 40 }))
        g.add(merged)
      }
    }
    if (p.shape === 'double') {
      const bar = mk(new THREE.BoxGeometry(w * 0.06, h * 1.0, d * 0.7), 'body', { edgeAngle: 40 })
      bar.position.set(0, 0, front)
      g.add(bar)
    }
    if (p.badge) {
      const b = mk(extrude(ellipseShape(h * 0.34, h * 0.34), d * 0.3), 'metal', { edgeAngle: 40 })
      b.position.z = d * 0.95
      g.add(b)
    }
    g.rotation.y = Math.PI / 2
    root.add(g)
    return root
  },
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [0.05, 0, -(p.w as number) / 2], axis: [0, 0, -1], param: 'w', ratio: 2 }],
})

registerPart({
  type: 'vehicule.lightbar',
  label: 'Barre de leds / gyrophare',
  category: 'eclairage',
  icon: '🚨',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('kind', 'Type', 'barre', [['barre', 'Barre de leds', '➖'], ['gyro', 'Gyrophare', '🚨'], ['rampe', 'Rampe de police', '🚓']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 0.9, [0.1, 2.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.08, [0.02, 0.4], { group: FO, unit: 'm' }),
    pos('d', 'Profondeur', 0.12, [0.03, 0.4], { group: FO, unit: 'm' }),
    int('cells', 'Nombre de leds', 8, [1, 20], { group: IN, showIf: (p) => p.kind === 'barre' }),
    num('along', 'Position sur le toit', 0.5, [0, 1], { group: PO, level: 'easy', step: 0.005, tip: '0 = devant du toit, 1 = arrière.' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofFront + (b.xRoofRear - b.xRoofFront) * (own.along as number)
    return { pos: [x, b.roofY(x), 0] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const d = p.d as number
    const root = new THREE.Group()
    if (p.kind === 'gyro') {
      root.add(mk(cylinder(d * 0.5, d * 0.6, h * 0.4, 24), 'dark', { edgeAngle: 40 }))
      const dome = new THREE.SphereGeometry(d * 0.45, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)
      dome.translate(0, h * 0.2, 0)
      root.add(mk(dome, 'red', { edgeAngle: 50 }))
      return root
    }
    const base = mk(roundedBox(d, h * 0.45, w, 0.01), 'dark', { edgeAngle: 40 })
    base.position.y = h * 0.22
    root.add(base)
    const n = p.kind === 'rampe' ? 2 : Math.round(p.cells as number)
    for (let i = 0; i < n; i++) {
      const cw = p.kind === 'rampe' ? w * 0.42 : (w * 0.92) / n - 0.01
      const z = p.kind === 'rampe' ? (i === 0 ? -1 : 1) * w * 0.25 : -w * 0.46 + (w * 0.92 * (i + 0.5)) / n
      const m = mk(roundedBox(d * 0.8, h * 0.6, cw, Math.min(0.03, h * 0.25)), p.kind === 'rampe' ? (i === 0 ? 'red' : 'glass') : 'light', { edgeAngle: 40 })
      m.position.set(0, h * 0.6, z)
      root.add(m)
    }
    return root
  },
})

registerPart({
  type: 'vehicule.plate',
  label: 'Plaque',
  category: 'eclairage',
  icon: '🔢',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('side', 'Où ?', 'avant', [['avant', 'Avant', '⬆️'], ['arriere', 'Arrière', '⬇️']], { group: PO, level: 'easy' }),
    pos('w', 'Largeur', 0.52, [0.1, 1], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.11, [0.03, 0.4], { group: FO, level: 'easy', unit: 'm' }),
    int('chars', 'Nombre de caractères', 6, [0, 10], { group: IN }),
    num('hgt', 'Hauteur du centre', 0.45, [0.1, 3], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const front = own.side === 'avant'
    return { pos: [(front ? b.noseX(0) : b.tailX(0)) + (front ? 0.012 : -0.012), own.hgt as number, 0] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const g = new THREE.Group()
    g.add(mk(extrude(shapeFromPts(roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 0.12, 1)), 0.012), 'body', { edgeAngle: 30 }))
    const n = Math.round(p.chars as number)
    for (let i = 0; i < n; i++) {
      const c = mk(new THREE.BoxGeometry((w * 0.8) / n - 0.008, h * 0.5, 0.004), 'dark', { edgeAngle: 40 })
      c.position.set(-w * 0.4 + ((i + 0.5) * w * 0.8) / n, 0, 0.007)
      g.add(c)
    }
    g.rotation.y = p.side === 'avant' ? Math.PI / 2 : -Math.PI / 2
    return g
  },
})
void clamp
