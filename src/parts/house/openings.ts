// Ouvertures : portes, fenêtres, baies vitrées, portes de garage, velux.
// Elles se posent sur un mur (face, rang, position libre) et PERCENT le mur automatiquement.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { DimLine, Handle, ParamValues, PartVariant } from '@/core/types'
import { eulerFromBasis, extrude, mk, roundPoly, roundedBox, shapeFromPts } from '@/parts/primitives/geo'
import { clamp, deg } from '@/utils/math'
import type { Face, HouseVolume } from './model'
import type { RoofModel } from './roof'

const FO = 'Forme'
const PO = 'Position sur le mur'
const CA = 'Cadre et détails'
const OU = 'Ouverture'

const ov = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })

/** Contour de l'ouverture : y = 0 en bas, x centré. Fermé, sens trigonométrique. */
export function openingOutline(p: ParamValues): [number, number][] {
  const w = p.w as number
  const h = p.h as number
  const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 18): [number, number][] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n
      return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number]
    })
  switch (p.shape as string) {
    case 'arche': {
      const r = w / 2
      const top = Math.max(0, h - r)
      return [[-w / 2, 0], [w / 2, 0], ...arc(0, top, r, Math.min(r, h), 0, Math.PI), ] as [number, number][]
    }
    case 'cintre': {
      const rise = Math.min(h * 0.3, w * 0.25)
      const pts: [number, number][] = [[-w / 2, 0], [w / 2, 0], [w / 2, h - rise]]
      for (let i = 1; i < 16; i++) {
        const t = i / 16
        pts.push([w / 2 - w * t, h - rise + rise * Math.sin(Math.PI * t)])
      }
      pts.push([-w / 2, h - rise])
      return pts
    }
    case 'ronde':
      return arc(0, h / 2, w / 2, h / 2, 0, Math.PI * 2, 36).slice(0, -1)
    case 'ovale':
      return arc(0, h / 2, w / 2, h / 2, 0, Math.PI * 2, 36).slice(0, -1)
    case 'triangle':
      return [[-w / 2, 0], [w / 2, 0], [0, h]]
    case 'trapeze':
      return [[-w / 2, 0], [w / 2, 0], [w * 0.32, h], [-w * 0.32, h]]
    case 'hexagone':
      return [[-w * 0.3, 0], [w * 0.3, 0], [w / 2, h / 2], [w * 0.3, h], [-w * 0.3, h], [-w / 2, h / 2]]
    default:
      return [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]]
  }
}

/** Centres des copies d'une ouverture : u (m) par rapport au centre du groupe. */
export function openingOffsets(p: ParamValues): number[] {
  const n = Math.max(1, Math.round(p.count as number))
  const pitch = (p.w as number) + (p.gap as number)
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * pitch)
}

registerPart({
  type: 'house.opening',
  dimsSelectedOnly: true,
  label: 'Porte / fenêtre',
  category: 'ouvertures',
  icon: '🪟',
  module: 'maison',
  followsParent: ['house.volume', 'house.roof'],
  animate: { param: 'open', label: 'Ouverture', from: 0, to: 1 },
  variants: [
    ov('fenetre', 'Fenêtre', '🪟', { kind: 'fenetre', shape: 'rect', w: 1.1, h: 1.3, hgt: 0.9, barsV: 1, barsH: 1 }),
    ov('fenetre2', 'Fenêtre ronde', '⭕', { kind: 'fenetre', shape: 'ronde', w: 0.8, h: 0.8, hgt: 1.4, barsV: 0, barsH: 0 }),
    ov('fenetre3', 'Fenêtre arrondie', '🏛️', { kind: 'fenetre', shape: 'arche', w: 0.9, h: 1.5, hgt: 0.9, barsV: 1, barsH: 1 }),
    ov('porte', 'Porte d’entrée', '🚪', { kind: 'porte', shape: 'rect', w: 0.95, h: 2.1, hgt: 0, barsV: 0, barsH: 0, style: 'pleine' }),
    ov('porte2', 'Porte double', '🚪', { kind: 'porte', shape: 'arche', w: 1.6, h: 2.3, hgt: 0, barsV: 0, barsH: 0, style: 'double' }),
    ov('baie', 'Baie vitrée', '🏞️', { kind: 'baie', shape: 'rect', w: 2.6, h: 2.1, hgt: 0, barsV: 0, barsH: 0 }),
    ov('garage', 'Porte de garage', '🚘', { kind: 'garage', shape: 'rect', w: 2.6, h: 2.1, hgt: 0, style: 'sectionnelle' }),
    ov('velux', 'Velux', '🔆', { kind: 'velux', shape: 'rect', w: 0.78, h: 1.18, barsV: 0, barsH: 0 }),
  ],
  schema: [
    choice('kind', 'Type', 'fenetre', [['fenetre', 'Fenêtre', '🪟'], ['porte', 'Porte', '🚪'], ['baie', 'Baie vitrée', '🏞️'], ['garage', 'Garage', '🚘'], ['velux', 'Velux (toit)', '🔆']], { group: FO, level: 'easy' }),
    choice('shape', 'Forme', 'rect', [['rect', 'Rectangle', '▭'], ['arche', 'Arche', '🏛️'], ['cintre', 'Cintrée', '🌈'], ['ronde', 'Ronde', '⭕'], ['ovale', 'Ovale', '🥚'], ['triangle', 'Triangle', '🔺'], ['trapeze', 'Trapèze', '⏢'], ['hexagone', 'Hexagone', '⬡']], { group: FO, level: 'easy', showIf: (p) => p.kind !== 'garage' }),
    pos('w', 'Largeur', 1.1, [0.2, 6], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 1.3, [0.2, 5], { group: FO, level: 'easy', unit: 'm' }),
    int('count', 'Nombre', 1, [1, 8], { group: FO, level: 'easy', tip: 'Plusieurs ouvertures identiques côte à côte.' }),
    num('gap', 'Écart entre deux', 0.6, [0, 4], { group: FO, unit: 'm', showIf: (p) => (p.count as number) > 1 }),

    choice('face', 'Mur', 'devant', [['devant', 'Façade', '⬆️'], ['derriere', 'Arrière', '⬇️'], ['gauche', 'Gauche', '⬅️'], ['droite', 'Droite', '➡️']], { group: PO, level: 'easy', showIf: (p) => p.kind !== 'velux' }),
    int('seg', 'Quel pan de mur ?', 0, [0, 4], { group: PO, tip: 'Pour les maisons en L, U, T : numéro du pan de mur (0 = le premier).', showIf: (p) => p.kind !== 'velux' }),
    int('floor', 'Étage', 0, [-1, 12], { group: PO, level: 'easy', tip: '0 = rez-de-chaussée, −1 = sous-sol.', showIf: (p) => p.kind !== 'velux' }),
    num('hgt', 'Hauteur du bas', 0.9, [0, 4], { group: PO, level: 'easy', unit: 'm', tip: 'Distance entre le sol de l’étage et le bas de l’ouverture.', showIf: (p) => p.kind !== 'velux' }),
    num('u', 'Position le long du mur', 0, [-12, 12], { group: PO, level: 'easy', unit: 'm', tip: 'Glisse l’ouverture vers la droite (+) ou la gauche (−).' }),
    int('wing', 'Pan de toit (velux)', 0, [0, 3], { group: PO, showIf: (p) => p.kind === 'velux' }),
    choice('side', 'Versant (velux)', 'a', [['a', 'Versant A', '◀️'], ['b', 'Versant B', '▶️']], { group: PO, showIf: (p) => p.kind === 'velux' }),
    num('v', 'Hauteur sur le versant (velux)', 0.5, [0.05, 0.95], { group: PO, step: 0.005, showIf: (p) => p.kind === 'velux' }),

    pos('frame', 'Épaisseur du cadre', 0.06, [0.01, 0.3], { group: CA, level: 'easy', unit: 'm' }),
    int('barsV', 'Petits-bois verticaux', 1, [0, 8], { group: CA, showIf: (p) => p.kind === 'fenetre' || p.kind === 'porte' || p.kind === 'baie' || p.kind === 'velux' }),
    int('barsH', 'Petits-bois horizontaux', 1, [0, 8], { group: CA, showIf: (p) => p.kind === 'fenetre' || p.kind === 'porte' || p.kind === 'baie' || p.kind === 'velux' }),
    choice('style', 'Style', 'pleine', [['pleine', 'Pleine', '⬛'], ['vitree', 'Vitrée', '🪟'], ['double', 'Double', '🚪'], ['sectionnelle', 'Sectionnelle', '☰'], ['enroulable', 'Enroulable', '🎞️'], ['battante', 'Battante', '↔️']], { group: CA, level: 'easy', showIf: (p) => p.kind === 'porte' || p.kind === 'garage' }),
    bool('sill', 'Appui de fenêtre', true, { group: CA, showIf: (p) => p.kind === 'fenetre' }),
    bool('lintel', 'Linteau', false, { group: CA, showIf: (p) => p.kind !== 'velux' }),
    bool('shutters', 'Volets', false, { group: CA, showIf: (p) => p.kind === 'fenetre' || p.kind === 'baie' }),
    bool('step', 'Seuil / marche', true, { group: CA, showIf: (p) => p.kind === 'porte' }),
    bool('handle', 'Poignée', true, { group: CA, showIf: (p) => p.kind === 'porte' || p.kind === 'fenetre' }),
    num('open', 'Ouverture', 0, [0, 1], { group: OU, level: 'easy', step: 0.01, tip: 'Ouvre la porte ou la fenêtre (animation avec le bouton ▶).' }),
  ],
  fit: (parent, own) => {
    const par = parent as { kind?: string }
    if (par?.kind === 'volume' && own.kind !== 'velux') {
      const v = parent as HouseVolume
      const floor = Math.round(own.floor as number)
      const yBottom = v.levelY(floor) + (own.hgt as number)
      const r = v.onWall(own.face as Face, own.seg as number, own.u as number, yBottom)
      if (!r) return {}
      const edgeIdx = v.edges.indexOf(r.edge)
      return { pos: r.pos, rot: r.rot, params: { _t: v.round ? 0.02 : v.wallT, _edge: edgeIdx, _s: r.s, _y: yBottom - -v.basementH } }
    }
    if (par?.kind === 'roof' && own.kind === 'velux') {
      const m = parent as RoofModel
      const w = m.wings[Math.min(m.wings.length - 1, Math.round(own.wing as number))]
      if (!w || w.pitch < 1) return {}
      return roofPlacement(w, own.side as string, own.v as number, own.u as number, own.h as number)
    }
    return {}
  },
  build: (p) => buildOpening(p),
  dims: (p): DimLine[] => [
    { a: [-(p.w as number) / 2, 0, 0.05], b: [(p.w as number) / 2, 0, 0.05], offset: -0.2, dir: [0, -1, 0], label: `${(p.w as number).toFixed(2)} m` },
    { a: [(p.w as number) / 2, 0, 0.05], b: [(p.w as number) / 2, p.h as number, 0.05], offset: 0.25, dir: [1, 0, 0], label: `${(p.h as number).toFixed(2)} m` },
  ],
  handles: (p): Handle[] => [
    { id: 'w', label: 'Largeur', position: [(p.w as number) / 2, (p.h as number) / 2, 0.05], axis: [1, 0, 0], param: 'w', ratio: 2 },
    { id: 'h', label: 'Hauteur', position: [0, p.h as number, 0.05], axis: [0, 1, 0], param: 'h', ratio: 1 },
  ],
})

/** Pose d'un velux sur un versant du toit. */
export function roofPlacement(w: RoofModel['wings'][number], side: string, v: number, u: number, h: number) {
  const sgn = side === 'a' ? 1 : -1
  const half = w.span / 2
  const off = half * (1 - v) // distance depuis le faîtage… v = 0 près du faîtage, 1 près de l'égout
  const lat = half * v
  void off
  const yRidge = w.baseY + w.rise
  const slope = Math.tan(deg(w.pitch))
  const y = yRidge - slope * lat
  // repère : X le long du faîtage, Y dans la pente (vers le haut), Z normale sortante
  const along = new THREE.Vector3(w.ridgeX ? 1 : 0, 0, w.ridgeX ? 0 : 1)
  const across = new THREE.Vector3(w.ridgeX ? 0 : 1, 0, w.ridgeX ? 1 : 0).multiplyScalar(sgn)
  const upSlope = across.clone().multiplyScalar(-1).multiplyScalar(Math.cos(deg(w.pitch))).add(new THREE.Vector3(0, Math.sin(deg(w.pitch)), 0))
  const normal = new THREE.Vector3().crossVectors(along, upSlope)
  if (normal.y < 0) normal.multiplyScalar(-1)
  const X = along.clone()
  const Z = normal.clone().normalize()
  const Y = new THREE.Vector3().crossVectors(Z, X)
  const centre = new THREE.Vector3(w.cx, y, w.cz).add(across.clone().multiplyScalar(lat)).add(along.clone().multiplyScalar(u)).addScaledVector(Y, -h / 2).addScaledVector(Z, 0.04)
  void clamp
  return { pos: [centre.x, centre.y, centre.z] as [number, number, number], rot: eulerFromBasis(X, Y, Z) }
}

function buildOpening(p: ParamValues): THREE.Object3D {
  const root = new THREE.Group()
  const kind = p.kind as string
  const w = p.w as number
  const h = p.h as number
  const t = (p._t as number) ?? 0.3
  const fr = Math.min(p.frame as number, w * 0.3, h * 0.3)
  const outline = openingOutline(p)
  const offsets = openingOffsets(p)
  const open = clamp(p.open as number, 0, 1)

  const cx = outline.reduce((s, q) => s + q[0], 0) / outline.length
  const cy = outline.reduce((s, q) => s + q[1], 0) / outline.length
  const sx = Math.max(0.05, (w - 2 * fr) / w)
  const sy = Math.max(0.05, (h - 2 * fr) / h)
  const inner = outline.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy] as [number, number])
  const zMid = -t * 0.45 // le cadre se place dans l'épaisseur du mur

  const unit = (off: number): THREE.Group => {
    const g = new THREE.Group()
    g.position.x = off
    const fd = Math.min(t * 0.7, 0.14)
    // Cadre (anneau)
    if (kind === 'garage') {
      // Pas de cadre fin : simple encadrement
    }
    const ring = mk(extrude(shapeFromPts(outline, [inner.slice().reverse()]), fd), 'dark', { edgeAngle: 30 })
    ring.position.z = zMid - fd / 2
    g.add(ring)

    const leafGroup = new THREE.Group()
    leafGroup.name = 'leaf'
    g.add(leafGroup)

    if (kind === 'garage') {
      const style = p.style as string
      const door = new THREE.Group()
      door.name = 'garage'
      const panel = mk(extrude(shapeFromPts(inner), 0.05), 'body', { edgeAngle: 30 })
      panel.position.z = zMid - 0.02
      door.add(panel)
      const n = style === 'enroulable' ? Math.max(8, Math.round(h / 0.07)) : style === 'battante' ? 0 : 4
      for (let i = 1; i < n; i++) {
        const l = mk(new THREE.BoxGeometry(w * sx * 0.995, style === 'enroulable' ? 0.008 : 0.016, 0.02), 'dark', { edgeAngle: 40 })
        l.position.set(0, fr + ((h - 2 * fr) * i) / n, zMid + 0.035)
        door.add(l)
      }
      if (style === 'battante') {
        const l = mk(new THREE.BoxGeometry(0.02, h - 2 * fr, 0.02), 'dark', { edgeAngle: 40 })
        l.position.set(0, h / 2, zMid + 0.035)
        door.add(l)
      }
      leafGroup.add(door)
    } else if (kind === 'porte') {
      const style = p.style as string
      const leaf = new THREE.Group()
      leaf.name = 'swing'
      const hingeX = -w * sx / 2
      const mkLeaf = (x0: number, width: number, flip: boolean) => {
        const lp = new THREE.Group()
        lp.name = flip ? 'swingR' : 'swingL'
        const poly = inner.map(([x, y]) => [x, y] as [number, number])
        const body = mk(extrude(shapeFromPts(poly), 0.05), 'body', { edgeAngle: 30 })
        body.position.z = zMid - 0.02
        // pour une porte double, chaque battant est la moitié de la largeur
        if (style === 'double') {
          body.scale.x = 0.5
          body.position.x = (flip ? 1 : -1) * w * sx * 0.25
        }
        lp.add(body)
        void x0
        void width
        if (style === 'vitree' || style === 'double') {
          const panelW = (style === 'double' ? 0.5 : 1) * w * sx * 0.55
          const glass = mk(roundedBox(panelW, h * sy * 0.4, 0.02, 0.01), 'glass', { edgeAngle: 40 })
          glass.position.set(style === 'double' ? (flip ? 1 : -1) * w * sx * 0.25 : 0, h * 0.62, zMid + 0.03)
          lp.add(glass)
        } else {
          // panneaux moulurés
          const pw = w * sx * 0.55
          for (const [yy, hh] of [[h * 0.3, h * 0.28], [h * 0.7, h * 0.28]] as [number, number][]) {
            const pn = mk(roundedBox(pw, hh, 0.02, 0.01), 'body', { edgeAngle: 40 })
            pn.position.set(0, yy, zMid + 0.03)
            lp.add(pn)
          }
        }
        if (p.handle) {
          const hd = mk(roundedBox(0.12, 0.02, 0.04, 0.008), 'metal', { edgeAngle: 40 })
          hd.position.set((flip ? -1 : 1) * (style === 'double' ? 0.05 : w * sx * 0.38), h * 0.48, zMid + 0.06)
          if (style === 'double') hd.position.x = flip ? -0.07 : 0.07
          lp.add(hd)
        }
        return lp
      }
      if (style === 'double') {
        const l = mkLeaf(0, 0.5, false)
        const r = mkLeaf(0, 0.5, true)
        // charnières sur les bords extérieurs
        for (const [m, sgn] of [[l, -1], [r, 1]] as [THREE.Group, number][]) {
          const pv = new THREE.Group()
          pv.name = sgn < 0 ? 'pivL' : 'pivR'
          pv.position.x = sgn * w * sx / 2
          m.position.x = -pv.position.x
          pv.add(m)
          leaf.add(pv)
        }
      } else {
        const pv = new THREE.Group()
        pv.name = 'pivL'
        pv.position.x = hingeX
        const lp = mkLeaf(0, 1, false)
        lp.position.x = -hingeX // le battant est centré : on le décale pour que la charnière soit à gauche
        pv.add(lp)
        leaf.add(pv)
      }
      leafGroup.add(leaf)
    } else {
      // Fenêtre / baie / velux : vitre(s) + petits-bois. Chaque battant est un groupe pivotant.
      const panes = kind === 'baie' ? 2 : 1
      const hx = -(w * sx) / 2 // charnière à gauche (fenêtre)
      for (let k = 0; k < panes; k++) {
        const content = new THREE.Group()
        const glassPoly = inner.map(([x, y]) => {
          const xx = panes === 2 ? (x - cx) * 0.5 + (k === 0 ? -1 : 1) * (w * sx) * 0.25 + cx : x
          return [xx, y] as [number, number]
        })
        const zOff = k === 1 ? 0.02 : 0
        const glass = mk(extrude(shapeFromPts(glassPoly), 0.02), 'glass', { edgeAngle: 30 })
        glass.position.z = zMid - 0.01 + zOff
        content.add(glass)
        const minX = Math.min(...glassPoly.map((q) => q[0]))
        const maxX = Math.max(...glassPoly.map((q) => q[0]))
        const gw = maxX - minX
        const bv = Math.round(p.barsV as number)
        const bh = Math.round(p.barsH as number)
        for (let i = 1; i <= bv; i++) {
          const bar = mk(new THREE.BoxGeometry(0.022, (h - 2 * fr) * 0.98, 0.03), 'dark', { edgeAngle: 40 })
          bar.position.set(minX + (gw * i) / (bv + 1), cy, zMid + 0.02 + zOff)
          content.add(bar)
        }
        for (let i = 1; i <= bh; i++) {
          const bar = mk(new THREE.BoxGeometry(gw * 0.98, 0.022, 0.03), 'dark', { edgeAngle: 40 })
          bar.position.set((minX + maxX) / 2, fr + ((h - 2 * fr) * i) / (bh + 1), zMid + 0.02 + zOff)
          content.add(bar)
        }
        if (p.handle && kind === 'fenetre') {
          const hd = mk(roundedBox(0.03, 0.1, 0.03, 0.008), 'metal', { edgeAngle: 40 })
          hd.position.set(w * sx * 0.38, h * 0.5, zMid + 0.04)
          content.add(hd)
        }
        const sash = new THREE.Group()
        if (panes === 2) sash.name = k === 0 ? 'slideA' : 'slideB'
        else if (kind === 'fenetre') {
          sash.name = 'sash'
          sash.position.x = hx
          content.position.x = -hx
        }
        sash.add(content)
        leafGroup.add(sash)
      }
    }

    // Appui, linteau, seuil
    if (p.sill && kind === 'fenetre') {
      const s = mk(roundedBox(w + 0.14, 0.05, 0.1 + 0.02, 0.012), 'body', { edgeAngle: 40 })
      s.position.set(0, -0.025, 0.04)
      g.add(s)
    }
    if (p.lintel && kind !== 'velux') {
      const l = mk(roundedBox(w + 0.28, 0.14, 0.06, 0.012), 'body', { edgeAngle: 40 })
      l.position.set(0, h + 0.07, 0.01)
      g.add(l)
    }
    if (p.step && kind === 'porte') {
      const s = mk(roundedBox(w + 0.3, 0.06, 0.34, 0.012), 'body', { edgeAngle: 40 })
      s.position.set(0, 0.0, 0.14)
      g.add(s)
    }
    if (p.shutters && (kind === 'fenetre' || kind === 'baie')) {
      for (const sgn of [-1, 1]) {
        const sh = new THREE.Group()
        sh.name = sgn < 0 ? 'shutL' : 'shutR'
        sh.position.set(sgn * (w / 2 + 0.02), 0, 0.02)
        const leaf = mk(roundedBox(w / 2, h, 0.03, 0.006), 'wood', { edgeAngle: 40 })
        leaf.position.set(-sgn * w / 4, h / 2, 0.015)
        sh.add(leaf)
        const n = Math.max(3, Math.round(h / 0.1))
        for (let i = 1; i < n; i++) {
          const sl = mk(new THREE.BoxGeometry(w / 2 - 0.06, 0.008, 0.012), 'dark', { edgeAngle: 40 })
          sl.position.set(-sgn * w / 4, (h * i) / n, 0.036)
          sh.add(sl)
        }
        // Les volets sont rabattus contre le mur : ils pivotent autour du bord extérieur
        sh.rotation.y = sgn * deg(-110) * 0.0
        g.add(sh)
      }
    }
    return g
  }
  for (const off of offsets) root.add(unit(off))

  root.userData.pose = (r: THREE.Object3D, o: number) => {
    const k = clamp(o, 0, 1)
    r.traverse((n) => {
      switch (n.name) {
        case 'pivL': n.rotation.y = -deg(95) * k; break
        case 'pivR': n.rotation.y = deg(95) * k; break
        case 'sash': n.rotation.y = -deg(80) * k; break
        case 'slideB': n.position.x = k * (w * 0.5 - fr); break
        case 'garage': n.position.y = k * (h - 0.12); break
      }
    })
  }
  void kind
  root.userData.pose(root, open)
  return root
}
