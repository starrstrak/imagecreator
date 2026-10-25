// Équipements : rétroviseurs, antenne, spoiler, échappements, barres de toit, marchepieds,
// pare-chocs, élargisseurs d'ailes, jupes, prises d'air, arceau, capote, roue de secours, intérieur.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { cylinder, cylinderX, cylinderZ, extrude, mergeGeos, mk, polyShape, roundPoly, roundedBox, shapeFromPts, torus, xf } from '@/parts/primitives/geo'
import { asBody } from './util'
import { buildWheel } from './rim'

const FO = 'Forme'
const PO = 'Position'
const DE = 'Détails'

// ---------------------------------------------------------------- Rétroviseur
registerPart({
  type: 'vehicule.mirror',
  label: 'Rétroviseur',
  category: 'equipements',
  icon: '🪞',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'classique', label: 'Classique', icon: '🪞', params: { shape: 'ovale', w: 0.2, h: 0.13, armLen: 0.1 } },
    { id: 'sport', label: 'Sport', icon: '🏎️', params: { shape: 'aile', w: 0.2, h: 0.1, armLen: 0.05 } },
    { id: 'camion', label: 'Camion (grand)', icon: '🚛', params: { shape: 'rect', w: 0.18, h: 0.4, armLen: 0.3 } },
  ] as PartVariant[],
  schema: [
    choice('shape', 'Forme', 'ovale', [['ovale', 'Ovale', '🥚'], ['rect', 'Rectangle', '▭'], ['aile', 'Aile', '🪽']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur du boîtier', 0.2, [0.04, 0.6], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur du boîtier', 0.13, [0.03, 0.8], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Épaisseur', 0.07, [0.02, 0.3], { group: FO, unit: 'm' }),
    pos('armLen', 'Longueur du bras', 0.1, [0, 0.6], { group: FO, unit: 'm' }),
    num('fold', 'Repliage', 0, [0, 1], { group: FO, step: 0.01, tip: 'Rabat le rétroviseur contre la portière.' }),
    num('along', 'Position le long du capot', 0.1, [-0.5, 1], { group: PO, level: 'easy', unit: 'm', tip: 'Recule (+) ou avance (−) depuis le pare-brise.' }),
    num('hgt', 'Hauteur au-dessus de la ceinture', 0.12, [-0.3, 1], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xWsBase - (own.along as number)
    const y = b.deckY(x) + (own.hgt as number)
    return { pos: [x, y, b.sideZ(x, y) - 0.02] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const d = p.d as number
    const arm = p.armLen as number
    const root = new THREE.Group()
    const pivot = new THREE.Group()
    pivot.rotation.y = -(p.fold as number) * 1.3
    root.add(pivot)
    if (arm > 0.005) {
      const a = mk(roundedBox(0.05, 0.035, arm + 0.02, 0.012), 'dark', { edgeAngle: 40 })
      a.position.z = arm / 2
      pivot.add(a)
    }
    let g: THREE.BufferGeometry
    if (p.shape === 'rect') g = roundedBox(w, h, d, Math.min(w, h, d) * 0.3)
    else if (p.shape === 'aile') {
      g = extrude(shapeFromPts(roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w * 0.2, h / 2], [-w / 2, h * 0.1]], 0.2, 2)), d)
    } else {
      g = new THREE.SphereGeometry(0.5, 20, 14)
      g.scale(w, h, d)
    }
    const body = mk(g, 'body', { edgeAngle: 45 })
    body.position.set(0, 0, arm + d / 2)
    pivot.add(body)
    const glass = mk(new THREE.BoxGeometry(w * 0.82, h * 0.8, 0.006), 'glass', { edgeAngle: 40 })
    glass.position.set(w * 0.02, 0, arm + d + (p.shape === 'ovale' ? -d * 0.4 : 0.004))
    glass.rotation.y = Math.PI
    pivot.add(glass)
    return root
  },
})

// ---------------------------------------------------------------- Antenne
registerPart({
  type: 'vehicule.antenna',
  label: 'Antenne',
  category: 'equipements',
  icon: '📡',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('kind', 'Type', 'fouet', [['fouet', 'Fouet', '📏'], ['requin', 'Aileron de requin', '🦈'], ['parabole', 'Parabole', '📡'], ['cb', 'Radio CB (2 brins)', '📻']], { group: FO, level: 'easy' }),
    pos('len', 'Longueur', 0.5, [0.05, 2.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('rad', 'Épaisseur', 0.006, [0.002, 0.1], { group: FO, unit: 'm' }),
    num('tilt', 'Inclinaison', 0, [-60, 60], { group: FO, step: 1, unit: '°' }),
    num('along', 'Position sur le toit', 0.85, [0, 1.2], { group: PO, level: 'easy', step: 0.005 }),
    num('lat', 'Décalage latéral', 0, [-1.5, 1.5], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofFront + (b.xRoofRear - b.xRoofFront) * (own.along as number)
    return { pos: [x, b.roofY(x) - 0.01, own.lat as number] }
  },
  build: (p) => {
    const L = p.len as number
    const r = p.rad as number
    const root = new THREE.Group()
    const inner = new THREE.Group()
    inner.rotation.z = -((p.tilt as number) * Math.PI) / 180
    root.add(inner)
    if (p.kind === 'requin') {
      const s = extrude(shapeFromPts(roundPoly([[-L * 0.5, 0], [L * 0.5, 0], [L * 0.1, L * 0.28]], 0.18, 2)), Math.max(0.02, L * 0.08))
      inner.add(mk(s, 'dark', { edgeAngle: 40 }))
    } else if (p.kind === 'parabole') {
      const dish = new THREE.SphereGeometry(L * 0.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3)
      dish.rotateZ(Math.PI / 5)
      dish.translate(0, L * 0.45, 0)
      inner.add(mk(dish, 'metal', { edgeAngle: 50 }))
      const g = cylinder(r * 2.5, r * 3, L * 0.45, 12)
      g.translate(0, L * 0.22, 0)
      inner.add(mk(g, 'dark', { edgeAngle: 40 }))
    } else {
      const strands = p.kind === 'cb' ? [-1, 1] : [0]
      for (const s of strands) {
        const g = cylinder(r * 0.4, r, L, 10)
        g.translate(s * 0.05, L / 2, 0)
        inner.add(mk(g, 'dark', { edgeAngle: 40 }))
      }
      const base = cylinder(r * 3, r * 3.6, 0.03, 16)
      base.translate(0, 0.015, 0)
      inner.add(mk(base, 'dark', { edgeAngle: 40 }))
    }
    return root
  },
})

// ---------------------------------------------------------------- Spoiler
registerPart({
  type: 'vehicule.spoiler',
  label: 'Spoiler / aileron',
  category: 'equipements',
  icon: '🏁',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'gt', label: 'Aileron GT', icon: '🏁', params: { kind: 'aileron', span: 1.5, chord: 0.28, angle: 8, height: 0.28, planes: 1 } },
    { id: 'double', label: 'Double plan', icon: '🛩️', params: { kind: 'aileron', span: 1.7, chord: 0.3, angle: 12, height: 0.4, planes: 2 } },
    { id: 'becquet', label: 'Béquet', icon: '〰️', params: { kind: 'becquet', span: 1.4, chord: 0.12, angle: 14, height: 0.04, planes: 1 } },
    { id: 'canard', label: 'Lame avant', icon: '🔻', params: { kind: 'lame', span: 1.8, chord: 0.3, angle: 0, height: 0.04, planes: 1 } },
  ] as PartVariant[],
  schema: [
    choice('kind', 'Type', 'aileron', [['aileron', 'Aileron', '🏁'], ['becquet', 'Béquet', '〰️'], ['lame', 'Lame', '🔻']], { group: FO, level: 'easy' }),
    pos('span', 'Largeur', 1.5, [0.3, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('chord', 'Profondeur de l’aile', 0.28, [0.03, 1], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.025, [0.005, 0.15], { group: FO, unit: 'm' }),
    num('angle', 'Inclinaison de l’aile', 8, [-30, 60], { group: FO, step: 1, unit: '°' }),
    pos('height', 'Hauteur des supports', 0.28, [0, 1.2], { group: FO, level: 'easy', unit: 'm', showIf: (p) => p.kind === 'aileron' }),
    int('planes', 'Nombre de plans', 1, [1, 3], { group: FO, showIf: (p) => p.kind === 'aileron' }),
    int('supports', 'Supports', 2, [0, 5], { group: DE, showIf: (p) => p.kind === 'aileron' }),
    bool('endplates', 'Plaques latérales', true, { group: DE, showIf: (p) => p.kind === 'aileron' }),
    num('xOff', 'Position le long (avant ↔ arrière)', 0.25, [-1, 1], { group: PO, level: 'easy', unit: 'm', tip: 'Distance depuis l’arrière du véhicule.' }),
    pos('yOff', 'Hauteur de la base', 0, [0, 1], { group: PO, unit: 'm', tip: 'Ajoute à la hauteur du coffre.' }),
    bool('front', 'À l’avant', false, { group: PO }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const front = !!own.front
    const x = front ? b.noseX(0) - (own.xOff as number) : b.tailX(0) + (own.xOff as number)
    return { pos: [x, b.deckY(x) + (own.yOff as number) - 0.02, 0] }
  },
  build: (p) => {
    const span = p.span as number
    const c = p.chord as number
    const t = p.thick as number
    const H = p.kind === 'aileron' ? (p.height as number) : 0
    const root = new THREE.Group()
    const planes = p.kind === 'aileron' ? Math.round(p.planes as number) : 1
    const a = ((p.angle as number) * Math.PI) / 180
    for (let i = 0; i < planes; i++) {
      const prof = roundPoly([[-c / 2, -t / 2], [c / 2, -t / 2], [c / 2 + 0.01, t], [-c / 2, t / 2]], 0.2, 2)
      const g = extrude(shapeFromPts(prof), span)
      g.rotateY(Math.PI / 2)
      const m = mk(g, 'body', { edgeAngle: 35 })
      m.position.set(0, H + i * (c * 0.55), 0)
      m.rotation.z = -a
      root.add(m)
      if (p.kind === 'aileron' && p.endplates) {
        for (const s of [-1, 1]) {
          const ep = mk(extrude(shapeFromPts(roundPoly([[-c * 0.6, 0], [c * 0.6, 0], [c * 0.55, c * 0.4], [-c * 0.6, c * 0.25]], 0.15, 2)), 0.01), 'body', { edgeAngle: 35 })
          ep.rotation.y = Math.PI / 2
          ep.position.set(0, H + i * (c * 0.55) - c * 0.1, s * span / 2)
          root.add(ep)
        }
      }
    }
    if (p.kind === 'aileron') {
      const n = Math.round(p.supports as number)
      for (let i = 0; i < n; i++) {
        const z = n === 1 ? 0 : -span * 0.3 + (span * 0.6 * i) / (n - 1)
        const s = mk(roundedBox(0.04, H + 0.02, 0.025, 0.008), 'dark', { edgeAngle: 40 })
        s.position.set(0, (H + 0.02) / 2 - 0.02, z)
        root.add(s)
      }
    }
    return root
  },
  handles: (p): Handle[] => [{ id: 's', label: 'Largeur', position: [0, p.kind === 'aileron' ? (p.height as number) : 0, (p.span as number) / 2], axis: [0, 0, 1], param: 'span', ratio: 2 }],
})

// ---------------------------------------------------------------- Échappement
registerPart({
  type: 'vehicule.exhaust',
  label: 'Échappement',
  category: 'equipements',
  icon: '💨',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('place', 'Emplacement', 'arriere', [['arriere', 'Arrière', '⬇️'], ['lateral', 'Sur le côté', '↔️'], ['cheminee', 'Cheminée (camion)', '🏭']], { group: PO, level: 'easy' }),
    choice('shape', 'Forme', 'rond', [['rond', 'Rond', '⚫'], ['ovale', 'Ovale', '🥚'], ['carre', 'Carré', '⬛']], { group: FO }),
    int('count', 'Nombre de sorties', 2, [1, 6], { group: FO, level: 'easy' }),
    pos('dia', 'Diamètre', 0.07, [0.02, 0.4], { group: FO, level: 'easy', unit: 'm' }),
    pos('len', 'Longueur', 0.18, [0.03, 3], { group: FO, unit: 'm', tip: 'Pour une cheminée : hauteur du tuyau.' }),
    pos('gap', 'Écart entre sorties', 0.14, [0.03, 0.8], { group: FO, unit: 'm', showIf: (p) => (p.count as number) > 1 }),
    num('lat', 'Décalage latéral', 0.45, [-1.5, 1.5], { group: PO, level: 'easy', unit: 'm' }),
    pos('hgt', 'Hauteur', 0.3, [0.05, 3], { group: PO, unit: 'm' }),
    bool('tip', 'Embout chromé', true, { group: DE }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const z = own.lat as number
    if (own.place === 'lateral') {
      const x = b.axleXs.length > 1 ? (b.axleXs[0] + b.axleXs[1]) / 2 : 0
      return { pos: [x, own.hgt as number, b.sideZ(x, own.hgt as number) - 0.02] }
    }
    if (own.place === 'cheminee') return { pos: [b.xRearBase + 0.35, b.deckY(b.xRearBase), b.hc(b.xRearBase) * 0.95] }
    return { pos: [b.tailX(z) + 0.02, own.hgt as number, z] }
  },
  build: (p) => {
    const root = new THREE.Group()
    const n = Math.round(p.count as number)
    const r = (p.dia as number) / 2
    const L = p.len as number
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * (p.gap as number)
      let g: THREE.BufferGeometry
      if (p.shape === 'carre') g = new THREE.BoxGeometry(r * 2, L, r * 2)
      else {
        g = cylinder(r, r, L, 24)
        if (p.shape === 'ovale') g.scale(1.5, 1, 0.8)
      }
      const m = mk(g, 'metal', { edgeAngle: 40 })
      const holder = new THREE.Group()
      m.position.y = L / 2
      holder.add(m)
      if (p.tip) {
        const tip = mk(cylinder(r * 1.12, r * 1.12, 0.03, 24), 'metal', { edgeAngle: 40 })
        tip.position.y = L
        holder.add(tip)
      }
      if (p.place === 'cheminee') {
        holder.position.set(0, 0, off)
      } else {
        // tuyau horizontal : dirigé vers l'arrière (−X) ou le long du flanc
        holder.rotation.z = Math.PI / 2
        holder.position.set(0, 0, off)
        if (p.place === 'lateral') holder.rotation.x = Math.PI / 2
      }
      root.add(holder)
    }
    return root
  },
})

// ---------------------------------------------------------------- Galerie de toit
registerPart({
  type: 'vehicule.rack',
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [0, (p.h as number) + 0.03, (p.w as number) / 2], axis: [0, 0, 1], param: 'w', ratio: 2 }, { id: 'l', label: 'Longueur', position: [(p.len as number) / 2, (p.h as number) + 0.03, 0], axis: [1, 0, 0], param: 'len', ratio: 2 }],
  label: 'Barres / galerie de toit',
  category: 'equipements',
  icon: '🧳',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('kind', 'Type', 'barres', [['barres', 'Barres', '═'], ['galerie', 'Galerie', '🧰'], ['coffre', 'Coffre de toit', '🧳']], { group: FO, level: 'easy' }),
    int('bars', 'Nombre de barres', 2, [1, 8], { group: FO, level: 'easy', showIf: (p) => p.kind !== 'coffre' }),
    pos('w', 'Largeur', 1.1, [0.2, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('len', 'Longueur', 1.0, [0.2, 6], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.06, [0.01, 0.8], { group: FO, unit: 'm', tip: 'Pour le coffre de toit : épaisseur du coffre.' }),
    pos('thick', 'Épaisseur des barres', 0.03, [0.01, 0.1], { group: FO, unit: 'm' }),
    bool('rails', 'Rails longitudinaux', true, { group: DE, showIf: (p) => p.kind !== 'coffre' }),
    num('along', 'Position sur le toit', 0.5, [0, 1], { group: PO, level: 'easy', step: 0.005 }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofFront + (b.xRoofRear - b.xRoofFront) * (own.along as number)
    return { pos: [x, b.roofY(x) - 0.005, 0] }
  },
  build: (p) => {
    const root = new THREE.Group()
    const w = p.w as number
    const L = p.len as number
    const h = p.h as number
    const t = p.thick as number
    if (p.kind === 'coffre') {
      const box = mk(roundedBox(L, h, w, h * 0.45), 'body', { edgeAngle: 40 })
      box.position.y = h / 2 + 0.04
      root.add(box)
      for (const s of [-1, 1]) {
        const f = mk(new THREE.BoxGeometry(0.05, 0.05, 0.03), 'dark', { edgeAngle: 40 })
        f.position.set(s * L * 0.3, 0.02, 0)
        root.add(f)
      }
      return root
    }
    const n = Math.round(p.bars as number)
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : -L / 2 + (L * i) / (n - 1)
      const bar = mk(roundedBox(t, t, w, t * 0.4), 'metal', { edgeAngle: 40 })
      bar.position.set(x, h, 0)
      root.add(bar)
      for (const s of [-1, 1]) {
        const foot = mk(new THREE.BoxGeometry(t * 1.4, h, t * 1.4), 'dark', { edgeAngle: 40 })
        foot.position.set(x, h / 2, s * (w / 2 - t))
        root.add(foot)
      }
    }
    if (p.rails) {
      for (const s of [-1, 1]) {
        const r = mk(roundedBox(L + t, t * 0.8, t * 0.8, t * 0.3), 'metal', { edgeAngle: 40 })
        r.position.set(0, h + t * 0.8, s * (w / 2 - t * 0.5))
        root.add(r)
      }
    }
    if (p.kind === 'galerie') {
      const rim = new THREE.Shape()
      void rim
      for (const s of [-1, 1]) {
        const wall = mk(roundedBox(L + t, 0.06, t * 0.6, 0.01), 'metal', { edgeAngle: 40 })
        wall.position.set(0, h + 0.07, s * (w / 2 - t * 0.3))
        root.add(wall)
      }
      for (const s of [-1, 1]) {
        const wall = mk(roundedBox(t * 0.6, 0.06, w, 0.01), 'metal', { edgeAngle: 40 })
        wall.position.set(s * (L / 2), h + 0.07, 0)
        root.add(wall)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Marchepied / jupe
registerPart({
  type: 'vehicule.sideskirt',
  handles: (p): Handle[] => [{ id: 'l', label: 'Longueur', position: [(p.len as number) / 2, 0, (p.d as number) / 2], axis: [1, 0, 0], param: 'len', ratio: 2 }],
  label: 'Marchepied / jupe latérale',
  category: 'carrosserie',
  icon: '▬',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('kind', 'Type', 'jupe', [['jupe', 'Jupe (bas de caisse)', '▬'], ['marchepied', 'Marchepied', '🪜'], ['tube', 'Tube chromé', '➖']], { group: FO, level: 'easy' }),
    pos('len', 'Longueur', 1.7, [0.2, 6], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.12, [0.02, 0.6], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Saillie', 0.08, [0.01, 0.5], { group: FO, unit: 'm' }),
    num('x', 'Position le long de la voiture', 0, [-5, 5], { group: PO, level: 'easy', unit: 'm', tip: '0 = entre les essieux.' }),
    num('hgt', 'Hauteur du bas', 0.18, [0, 1], { group: PO, unit: 'm' }),
    bool('treads', 'Antidérapant', true, { group: DE, showIf: (p) => p.kind === 'marchepied' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const xc = (b.axleXs.length > 1 ? (b.axleXs[0] + b.axleXs[1]) / 2 : 0) + (own.x as number)
    const y = (own.hgt as number) + (own.h as number) / 2
    return { pos: [xc, y, b.sideZ(xc, y) - 0.02] }
  },
  build: (p) => {
    const root = new THREE.Group()
    const L = p.len as number
    const h = p.h as number
    const d = p.d as number
    if (p.kind === 'tube') {
      const g = cylinderX(h / 2, h / 2, L, 20)
      g.translate(0, 0, d)
      root.add(mk(g, 'metal', { edgeAngle: 40 }))
      for (const x of [-L * 0.4, L * 0.4]) {
        const s = mk(cylinder(0.012, 0.012, d, 8), 'metal', { edgeAngle: 40 })
        s.rotation.x = Math.PI / 2
        s.position.set(x, 0, d / 2)
        root.add(s)
      }
      return root
    }
    const m = mk(roundedBox(L, h, d, Math.min(h, d) * 0.3), p.kind === 'jupe' ? 'body' : 'dark', { edgeAngle: 40 })
    m.position.z = d / 2
    root.add(m)
    if (p.kind === 'marchepied' && p.treads) {
      const n = Math.max(2, Math.round(L / 0.12))
      for (let i = 0; i < n; i++) {
        const t = mk(new THREE.BoxGeometry(0.012, 0.006, d * 0.8), 'metal', { edgeAngle: 40 })
        t.position.set(-L / 2 + (L * (i + 0.5)) / n, h / 2 + 0.003, d / 2)
        root.add(t)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Pare-chocs
registerPart({
  type: 'vehicule.bumper',
  label: 'Pare-chocs',
  category: 'carrosserie',
  icon: '🛡️',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'classique', label: 'Classique', icon: '🛡️', params: { kind: 'classique', h: 0.22, d: 0.12 } },
    { id: 'sport', label: 'Sport (lèvre)', icon: '🏎️', params: { kind: 'sport', h: 0.2, d: 0.16 } },
    { id: 'buffle', label: 'Pare-buffle', icon: '🦬', params: { kind: 'buffle', h: 0.6, d: 0.12 } },
    { id: 'tube', label: 'Tubulaire', icon: '⭕', params: { kind: 'tube', h: 0.25, d: 0.15 } },
  ] as PartVariant[],
  schema: [
    choice('side', 'Où ?', 'avant', [['avant', 'Avant', '⬆️'], ['arriere', 'Arrière', '⬇️']], { group: PO, level: 'easy' }),
    choice('kind', 'Type', 'classique', [['classique', 'Classique', '🛡️'], ['sport', 'Sport', '🏎️'], ['buffle', 'Pare-buffle', '🦬'], ['tube', 'Tubulaire', '⭕']], { group: FO, level: 'easy' }),
    num('wRatio', 'Largeur (part de la voiture)', 0.96, [0.3, 1.3], { group: FO, level: 'easy', step: 0.005 }),
    pos('h', 'Hauteur', 0.22, [0.03, 1], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 0.12, [0.02, 0.6], { group: FO, unit: 'm' }),
    pos('round', 'Arrondi', 0.05, [0, 0.3], { group: FO, unit: 'm' }),
    pos('hgt', 'Hauteur du bas', 0.2, [0, 1.5], { group: PO, unit: 'm' }),
    bool('fogs', 'Antibrouillards', false, { group: DE }),
    int('slats', 'Fentes', 0, [0, 8], { group: DE, showIf: (p) => p.kind === 'classique' || p.kind === 'sport' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const front = own.side === 'avant'
    const x = front ? b.noseX(0) : b.tailX(0)
    return { pos: [x, own.hgt as number, 0], params: { w: 2 * b.hw(front ? x - 0.3 : x + 0.3) * (own.wRatio as number) } }
  },
  build: (p) => {
    const w = (p.w as number) ?? 1.7
    const h = p.h as number
    const d = p.d as number
    const root = new THREE.Group()
    const inner = new THREE.Group()
    if (p.kind === 'tube') {
      const g = cylinderZ(h / 2.4, h / 2.4, w, 24)
      inner.add(mk(g, 'metal', { edgeAngle: 40 }))
      for (const s of [-1, 1]) {
        const e = mk(new THREE.SphereGeometry(h / 2.4, 14, 10), 'metal', { edgeAngle: 50 })
        e.position.z = s * w / 2
        inner.add(e)
      }
    } else if (p.kind === 'buffle') {
      for (const s of [-1, 1]) {
        const post = mk(cylinder(0.025, 0.025, h, 12), 'metal', { edgeAngle: 40 })
        post.position.set(0, h / 2, s * w * 0.4)
        inner.add(post)
      }
      for (const y of [0.1, 0.5, 0.9]) {
        const bar = mk(cylinderZ(0.022, 0.022, w * 0.82, 12), 'metal', { edgeAngle: 40 })
        bar.position.y = h * y
        inner.add(bar)
      }
      const base = mk(roundedBox(d, 0.08, w, 0.02), 'dark', { edgeAngle: 40 })
      base.position.y = 0.04
      inner.add(base)
    } else {
      const m = mk(roundedBox(d, h, w, p.round as number), 'body', { edgeAngle: 40 })
      m.position.y = h / 2
      inner.add(m)
      if (p.kind === 'sport') {
        const lip = mk(roundedBox(d * 1.4, 0.03, w * 0.96, 0.01), 'dark', { edgeAngle: 40 })
        lip.position.set(d * 0.2, 0.015, 0)
        inner.add(lip)
      }
      const sl = Math.round(p.slats as number)
      for (let i = 0; i < sl; i++) {
        const s = mk(new THREE.BoxGeometry(0.006, 0.014, w * 0.5), 'dark', { edgeAngle: 40 })
        s.position.set(d / 2 + 0.002, h * 0.25 + (h * 0.5 * i) / Math.max(1, sl - 1 || 1), 0)
        inner.add(s)
      }
    }
    if (p.fogs) {
      for (const s of [-1, 1]) {
        const disc = new THREE.Shape()
        disc.absarc(0, 0, h * 0.2, 0, Math.PI * 2, false)
        const f = mk(extrude(disc, 0.03), 'light', { edgeAngle: 40 })
        f.rotation.y = Math.PI / 2
        f.position.set(d / 2, h * 0.5, s * w * 0.36)
        inner.add(f)
      }
    }
    inner.rotation.y = p.side === 'avant' ? 0 : Math.PI
    inner.position.x = p.side === 'avant' ? -d / 2 + 0.02 : d / 2 - 0.02
    root.add(inner)
    return root
  },
})

// ---------------------------------------------------------------- Élargisseur d'aile
registerPart({
  type: 'vehicule.flare',
  label: 'Passage de roue (aile)',
  category: 'carrosserie',
  icon: '🌓',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    int('axle', 'Essieu', 1, [1, 5], { group: PO, level: 'easy', tip: '1 = essieu avant, 2 = suivant…' }),
    pos('lip', 'Largeur du bourrelet', 0.05, [0.01, 0.3], { group: FO, level: 'easy', unit: 'm' }),
    pos('out', 'Saillie', 0.06, [0.005, 0.4], { group: FO, level: 'easy', unit: 'm', tip: 'Dépasse du flanc : effet élargisseur d’aile.' }),
    pos('gap', 'Jeu autour de la roue', 0.07, [0, 0.4], { group: FO, unit: 'm' }),
    num('arc', 'Étendue de l’arc', 200, [90, 360], { group: FO, step: 1, unit: '°' }),
    pos('wheelDia', 'Diamètre de la roue', 0.66, [0.2, 1.6], { group: FO, unit: 'm', tip: 'Se règle tout seul quand la pièce suit la carrosserie.' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const i = Math.min(b.axleXs.length - 1, Math.max(0, Math.round(own.axle as number) - 1))
    const x = b.axleXs[i]
    return { pos: [x, b.wheelDia / 2, b.sideZ(x, b.wheelDia / 2)], params: { wheelDia: b.wheelDia } }
  },
  build: (p) => {
    const R = (p.wheelDia as number) / 2 + (p.gap as number)
    const lip = p.lip as number
    const out = p.out as number
    const arc = ((p.arc as number) * Math.PI) / 180
    // Anneau partiel (demi-couronne) extrudé vers l'extérieur
    const sh = new THREE.Shape()
    const a0 = Math.PI / 2 - arc / 2
    const a1 = Math.PI / 2 + arc / 2
    sh.absarc(0, 0, R + lip, a0, a1, false)
    sh.absarc(0, 0, R, a1, a0, true)
    const g = extrude(sh, out)
    g.translate(0, 0, out / 2)
    const m = mk(g, 'body', { edgeAngle: 35 })
    const root = new THREE.Group()
    root.add(m)
    return root
  },
})

// ---------------------------------------------------------------- Prises d'air / aérations
registerPart({
  type: 'vehicule.vent',
  label: 'Prise d’air / aération',
  category: 'carrosserie',
  icon: '🌬️',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('place', 'Emplacement', 'capot', [['capot', 'Capot', '⬆️'], ['aile', 'Aile avant', '◀️'], ['flanc', 'Flanc', '↔️'], ['toit', 'Toit', '☀️']], { group: PO, level: 'easy' }),
    choice('shape', 'Forme', 'rect', [['rect', 'Rectangle', '▭'], ['ovale', 'Ovale', '🥚'], ['fentes', 'Fentes', '☰'], ['naca', 'NACA', '▽']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 0.4, [0.05, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Longueur / hauteur', 0.2, [0.03, 1], { group: FO, level: 'easy', unit: 'm' }),
    pos('relief', 'Relief', 0.04, [0, 0.2], { group: FO, unit: 'm', tip: '0 = simple creux dessiné, > 0 = bosse (écope).' }),
    int('slats', 'Nombre de fentes', 4, [1, 14], { group: FO, showIf: (p) => p.shape === 'fentes' }),
    num('along', 'Position le long', 0.5, [0, 1], { group: PO, level: 'easy', step: 0.005 }),
    num('lat', 'Décalage latéral', 0, [-1.5, 1.5], { group: PO, unit: 'm', showIf: (p) => p.place === 'capot' || p.place === 'toit' }),
    num('hgt', 'Hauteur', 0.6, [0.1, 2], { group: PO, unit: 'm', showIf: (p) => p.place === 'flanc' || p.place === 'aile' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const a = own.along as number
    if (own.place === 'capot') {
      const x = b.L / 2 - (b.L / 2 - b.xWsBase) * (0.12 + 0.8 * a)
      return { pos: [x, b.deckY(x) + 0.015, own.lat as number] }
    }
    if (own.place === 'toit') {
      const x = b.xRoofFront + (b.xRoofRear - b.xRoofFront) * a
      return { pos: [x, b.roofY(x) + 0.005, own.lat as number] }
    }
    const x = own.place === 'aile' ? b.L / 2 - (b.L / 2 - b.axleXs[0]) * (0.2 + 1.2 * a) : b.axleXs[0] - (b.axleXs[0] - (b.axleXs[1] ?? b.axleXs[0])) * a
    return { pos: [x, own.hgt as number, b.sideZ(x, own.hgt as number) - 0.005], rot: [0, 0, 0] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const rel = p.relief as number
    const root = new THREE.Group()
    const flat = new THREE.Group()
    const outline: [number, number][] =
      p.shape === 'ovale'
        ? Array.from({ length: 32 }, (_, i) => [Math.cos((i / 32) * Math.PI * 2) * w / 2, Math.sin((i / 32) * Math.PI * 2) * h / 2] as [number, number])
        : p.shape === 'naca'
          ? roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [0, h / 2]], 0.15, 2)
          : roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 0.12, 2)
    if (p.shape === 'fentes') {
      const n = Math.round(p.slats as number)
      for (let i = 0; i < n; i++) {
        const g = roundedBox(w, 0.012, Math.max(0.015, (h / n) * 0.55), 0.004)
        const m = mk(g, 'dark', { edgeAngle: 40 })
        m.position.set(0, 0.004, -h / 2 + (h * (i + 0.5)) / n)
        flat.add(m)
      }
      flat.rotation.x = 0
    } else {
      const plate = mk(extrude(shapeFromPts(outline), 0.012 + rel), p.shape === 'naca' ? 'dark' : 'dark', { edgeAngle: 35 })
      plate.position.z = (0.012 + rel) / 2
      flat.add(plate)
    }
    root.add(flat)
    // Pour le capot et le toit la pièce est à plat ; pour les flancs elle est verticale (face vers +Z)
    if (p.place === 'capot' || p.place === 'toit') flat.rotation.x = -Math.PI / 2
    return root
  },
})

// ---------------------------------------------------------------- Arceau / capote
registerPart({
  type: 'vehicule.rollbar',
  label: 'Arceau de sécurité',
  category: 'equipements',
  icon: '⭕',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('kind', 'Type', 'arceau', [['arceau', 'Arceau simple', '∩'], ['cage', 'Cage complète', '🔲'], ['targa', 'Arceau targa', '⌓']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 1.3, [0.3, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.6, [0.1, 2], { group: FO, level: 'easy', unit: 'm' }),
    pos('len', 'Longueur (cage)', 1.2, [0.2, 4], { group: FO, unit: 'm', showIf: (p) => p.kind === 'cage' }),
    pos('tube', 'Diamètre du tube', 0.045, [0.01, 0.15], { group: FO, unit: 'm' }),
    num('along', 'Position', 0.55, [0, 1], { group: PO, level: 'easy', step: 0.005 }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofFront + (b.xRoofRear - b.xRoofFront) * (own.along as number)
    return { pos: [x, b.deckY(x) + 0.02, 0] }
  },
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    const r = (p.tube as number) / 2
    const root = new THREE.Group()
    const hoop = (x: number) => {
      const curve = new THREE.CurvePath<THREE.Vector3>()
      curve.add(new THREE.LineCurve3(new THREE.Vector3(x, 0, -w / 2), new THREE.Vector3(x, h - w * 0.12, -w / 2)))
      curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, h - w * 0.12, -w / 2), new THREE.Vector3(x, h, -w / 2), new THREE.Vector3(x, h, -w / 2 + w * 0.12)))
      curve.add(new THREE.LineCurve3(new THREE.Vector3(x, h, -w / 2 + w * 0.12), new THREE.Vector3(x, h, w / 2 - w * 0.12)))
      curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, h, w / 2 - w * 0.12), new THREE.Vector3(x, h, w / 2), new THREE.Vector3(x, h - w * 0.12, w / 2)))
      curve.add(new THREE.LineCurve3(new THREE.Vector3(x, h - w * 0.12, w / 2), new THREE.Vector3(x, 0, w / 2)))
      const g = new THREE.TubeGeometry(curve, 48, r, 10, false)
      root.add(mk(g, 'metal', { edgeAngle: 60 }))
    }
    if (p.kind === 'cage') {
      const L = p.len as number
      hoop(L / 2)
      hoop(-L / 2)
      for (const s of [-1, 1]) {
        const bar = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-L / 2, h, s * (w / 2 - w * 0.12)), new THREE.Vector3(L / 2, h, s * (w / 2 - w * 0.12))), 4, r, 10)
        root.add(mk(bar, 'metal', { edgeAngle: 60 }))
      }
      const diag = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-L / 2, 0.05, -w / 2), new THREE.Vector3(L / 2, h, w / 2)), 4, r * 0.8, 10)
      root.add(mk(diag, 'metal', { edgeAngle: 60 }))
    } else {
      hoop(0)
      if (p.kind === 'targa') {
        const roofBar = mk(roundedBox(0.12, 0.03, w * 0.95, 0.01), 'dark', { edgeAngle: 40 })
        roofBar.position.y = h
        root.add(roofBar)
      }
      for (const s of [-1, 1]) {
        const st = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, h * 0.95, s * w / 2), new THREE.Vector3(-0.5, 0, s * w / 2)), 4, r * 0.8, 10)
        root.add(mk(st, 'metal', { edgeAngle: 60 }))
      }
    }
    return root
  },
})

registerPart({
  type: 'vehicule.softtop',
  label: 'Capote',
  category: 'carrosserie',
  icon: '⛱️',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    choice('state', 'État', 'pliee', [['pliee', 'Pliée', '📦'], ['fermee', 'Fermée', '☂️']], { group: FO, level: 'easy' }),
    pos('len', 'Longueur', 0.8, [0.2, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.18, [0.03, 1], { group: FO, level: 'easy', unit: 'm' }),
    num('along', 'Position', 0.8, [0, 1], { group: PO, level: 'easy', step: 0.005 }),
    int('ribs', 'Plis', 4, [0, 10], { group: FO }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofFront + (b.xRearBase - b.xRoofFront) * (own.along as number)
    return { pos: [x, b.deckY(x) - 0.005, 0], params: { w: 2 * b.hc(x) * 0.92 } }
  },
  build: (p) => {
    const w = (p.w as number) ?? 1.5
    const L = p.len as number
    const h = p.h as number
    const root = new THREE.Group()
    const g = new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)
    g.scale(L, h * 2, w)
    root.add(mk(g, 'dark', { edgeAngle: 50 }))
    const n = Math.round(p.ribs as number)
    for (let i = 1; i <= n; i++) {
      const t = -0.5 + i / (n + 1)
      const k = Math.sqrt(Math.max(0, 1 - (2 * t) ** 2))
      const r = mk(cylinderZ(0.01, 0.01, w * k * 0.98, 8), 'dark', { edgeAngle: 50 })
      r.position.set(t * L, h * k * 0.98, 0)
      root.add(r)
    }
    return root
  },
})

// ---------------------------------------------------------------- Roue de secours
registerPart({
  type: 'vehicule.spare',
  label: 'Roue de secours',
  category: 'equipements',
  icon: '🛞',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    pos('dia', 'Diamètre', 0.7, [0.3, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('width', 'Largeur', 0.22, [0.08, 0.5], { group: FO, unit: 'm' }),
    int('spokes', 'Branches', 5, [2, 14], { group: FO }),
    num('lat', 'Décalage latéral', 0, [-1.5, 1.5], { group: PO, unit: 'm' }),
    num('hgt', 'Hauteur du centre', 0.85, [0.2, 3], { group: PO, level: 'easy', unit: 'm' }),
    bool('cover', 'Housse', false, { group: DE }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    return { pos: [b.tailX(own.lat as number) - (own.width as number) / 2, own.hgt as number, own.lat as number] }
  },
  build: (p) => {
    const d = p.dia as number
    const w = p.width as number
    const root = new THREE.Group()
    if (p.cover) {
      root.add(mk(cylinderZ(d / 2, d / 2, w, 40), 'dark', { edgeAngle: 50 }))
    } else {
      const wh = buildWheel({
        tireDia: d, tireWidth: w, profile: 0.5, shoulder: 0.5, bulge: 0.008, tread: 'lisse', treadCount: 24, treadDepth: 0,
        rimAdjust: 1, rimWidth: 0.8, rimLip: 0.02, rimDepth: 0.02, brake: false, spokeShape: 'droite', spokeCount: p.spokes, spokeWidth: 0.04, spokeThick: 0.018,
        spokeTwist: 0, spokeTaper: 0.5, holeCount: 6, holeSize: 0.09, hubDia: 0.12, hubCap: true, boltCount: 5, boltCircle: 0.7, boltSize: 0.01, boltShape: 'rond', centerNut: false, rimRot: 0,
      })
      root.add(wh)
    }
    root.rotation.y = -Math.PI / 2
    return root
  },
})

// ---------------------------------------------------------------- Intérieur (sièges, volant)
registerPart({
  type: 'vehicule.interior',
  label: 'Sièges et volant',
  category: 'equipements',
  icon: '💺',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    int('rows', 'Rangées de sièges', 1, [1, 4], { group: FO, level: 'easy' }),
    int('seats', 'Sièges par rangée', 2, [1, 4], { group: FO, level: 'easy' }),
    pos('seatW', 'Largeur d’un siège', 0.5, [0.2, 1], { group: FO, unit: 'm' }),
    pos('seatH', 'Hauteur du dossier', 0.5, [0.2, 1], { group: FO, unit: 'm' }),
    pos('pitch', 'Écart entre rangées', 0.9, [0.4, 2], { group: FO, unit: 'm' }),
    bool('wheel', 'Volant', true, { group: DE }),
    bool('dash', 'Tableau de bord', true, { group: DE }),
    num('along', 'Position', 0.3, [0, 1], { group: PO, level: 'easy', step: 0.005 }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xWsBase + (b.xRearBase - b.xWsBase) * (own.along as number)
    return { pos: [x, b.deckY(x) - 0.25, 0] }
  },
  build: (p) => {
    const root = new THREE.Group()
    const rows = Math.round(p.rows as number)
    const seats = Math.round(p.seats as number)
    const sw = p.seatW as number
    const sh = p.seatH as number
    for (let r = 0; r < rows; r++) {
      for (let s = 0; s < seats; s++) {
        const z = (s - (seats - 1) / 2) * (sw + 0.1)
        const x = -r * (p.pitch as number)
        const cushion = mk(roundedBox(0.5, 0.12, sw, 0.04), 'dark', { edgeAngle: 40 })
        cushion.position.set(x, 0.06, z)
        root.add(cushion)
        const back = mk(roundedBox(0.1, sh, sw, 0.04), 'dark', { edgeAngle: 40 })
        back.position.set(x - 0.22, sh / 2 + 0.1, z)
        back.rotation.z = 0.15
        root.add(back)
        const head = mk(roundedBox(0.08, 0.18, sw * 0.5, 0.03), 'dark', { edgeAngle: 40 })
        head.position.set(x - 0.22 - sh * 0.15, sh + 0.2, z)
        root.add(head)
      }
    }
    if (p.wheel) {
      const w = mk(torus(0.16, 0.014, 28, 8), 'dark', { edgeAngle: 50 })
      w.position.set(0.7, 0.45, (-(seats - 1) / 2) * (sw + 0.1))
      w.rotation.y = Math.PI / 2
      w.rotation.x = 0.3
      root.add(w)
    }
    if (p.dash) {
      const d = mk(roundedBox(0.3, 0.2, sw * seats + 0.2, 0.05), 'dark', { edgeAngle: 40 })
      d.position.set(0.85, 0.3, 0)
      root.add(d)
    }
    return root
  },
})

void bool
void polyShape
void mergeGeos
void xf
void int
