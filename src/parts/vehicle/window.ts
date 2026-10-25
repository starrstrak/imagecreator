// Vitres : pare-brise, lunette arrière, vitres latérales, toit ouvrant. 6 formes, cadre réglable,
// montants, et pose automatique sur la carrosserie (ou libre quand on ne suit pas le parent).
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { eulerFromBasis, extrude, mk, roundPoly, shapeFromPts } from '@/parts/primitives/geo'
import { clamp } from '@/utils/math'
import { asBody, cabinX } from './util'
import type { Body } from './body'

const FO = 'Forme'
const PO = 'Position sur la carrosserie'
const CA = 'Cadre et montants'

const wv = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })

/** Contour extérieur de la vitre, centré, dans le plan (x, y). */
export function windowOutline(p: ParamValues): [number, number][] {
  const w = p.w as number
  const h = p.h as number
  const shape = p.shape as string
  const q = clamp(p.round as number, 0.03, 0.45)
  const tw = w * (p.topRatio as number)
  const sh = p.slantTop as number
  switch (shape) {
    case 'ovale': {
      const pts: [number, number][] = []
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2
        pts.push([Math.cos(a) * (w / 2), Math.sin(a) * (h / 2)])
      }
      return pts
    }
    case 'panoramique':
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - tw * 0.03, h / 2], [-w / 2 + tw * 0.03, h / 2]], 0.3, 2)
    case 'goutte': {
      const pts: [number, number][] = []
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2
        const s = Math.sin(a)
        const k = s > 0 ? 0.55 + 0.45 * (1 - s) : 1 // plus étroit en haut
        pts.push([Math.cos(a) * (w / 2) * k + sh * Math.max(0, s), s * (h / 2)])
      }
      return pts
    }
    case 'hexagone':
      return roundPoly([[-w / 2, 0], [-w / 4, -h / 2], [w / 4, -h / 2], [w / 2, 0], [w / 4, h / 2], [-w / 4, h / 2]], q * 0.6, 2)
    default: // rectangle / trapèze
      return roundPoly([[-w / 2, -h / 2], [w / 2, -h / 2], [tw / 2 + sh, h / 2], [-tw / 2 + sh, h / 2]], q, 2)
  }
}

interface Frame {
  origin: THREE.Vector3
  X: THREE.Vector3
  Y: THREE.Vector3
  Z: THREE.Vector3
  auto: ParamValues
}

/** Repère de pose et dimensions automatiques selon le rôle et la carrosserie. */
function frameFor(b: Body, p: ParamValues): Frame {
  const role = p.role as string
  const pillar = p.pillar as number
  const gB = p.gapBelow as number
  const gA = p.gapAbove as number
  const proud = 0.01
  if (role === 'pare-brise' || role === 'lunette') {
    const front = role === 'pare-brise'
    const S = new THREE.Vector3(front ? b.xWsBase : b.xRearBase, b.deck, 0)
    const E = new THREE.Vector3(front ? b.xRoofFront : b.xRoofRear, b.roof, 0)
    const d = E.clone().sub(S)
    const len = d.length()
    const Y = d.clone().normalize()
    let X = new THREE.Vector3(0, 0, 1)
    let Z = new THREE.Vector3().crossVectors(X, Y)
    if (Z.x * Y.x > 0) {
      X = new THREE.Vector3(0, 0, -1)
      Z = new THREE.Vector3().crossVectors(X, Y)
    }
    const at = (t: number) => S.clone().lerp(E, t)
    const wAt = (t: number) => 2 * b.sideZ(at(t).x, at(t).y) - 2 * pillar
    const h = Math.max(0.05, len - gB - gA)
    const wb = Math.max(0.1, wAt(gB / len))
    const wt = Math.max(0.1, wAt(1 - gA / len))
    const origin = at(0.5).addScaledVector(Y, (gB - gA) / 2).addScaledVector(Z, proud)
    return { origin, X, Y, Z, auto: { w: wb, h, topRatio: wt / wb, slantTop: 0 } }
  }
  if (role === 'toit') {
    const xm = (b.xRoofFront + b.xRoofRear) / 2
    const X = new THREE.Vector3(1, 0, 0)
    const Y = new THREE.Vector3(0, 0, -1)
    const Z = new THREE.Vector3(0, 1, 0)
    const origin = new THREE.Vector3(xm, b.roofY(xm) + proud, 0)
    return { origin, X, Y, Z, auto: { w: Math.abs(b.xRoofFront - b.xRoofRear) * 0.7, h: 2 * b.hc(xm) * 0.6, topRatio: 1, slantTop: 0 } }
  }
  // Vitre latérale : s'étend sur une portion [spanFrom, spanTo] de l'habitacle
  const x0 = cabinX(b, p.spanFrom as number)
  const x1 = cabinX(b, p.spanTo as number)
  const xc = (x0 + x1) / 2
  const yLow = b.deck + gB
  const yHigh = Math.max(yLow + 0.05, b.roofY(xc) - gA)
  const h = yHigh - yLow
  const yc = (yLow + yHigh) / 2
  const z = b.sideZ(xc, yc)
  const s = b.sideSlope(xc, yc)
  const Y = new THREE.Vector3(0, 1, s).normalize()
  const X = new THREE.Vector3(1, 0, 0)
  const Z = new THREE.Vector3().crossVectors(X, Y)
  // Largeurs en bas et en haut : les bords extrêmes épousent l'inclinaison du pare-brise / de la lunette
  const edgeAt = (x: number, extreme: boolean, fromFront: boolean): number => {
    if (!extreme) return x
    const k = (yHigh - b.deck) / (b.roof - b.deck)
    return fromFront ? x + (b.xRoofFront - b.xWsBase) * k : x + (b.xRoofRear - b.xRearBase) * k
  }
  const frontEdge = Math.max(x0, x1)
  const rearEdge = Math.min(x0, x1)
  const fExt = (p.spanFrom as number) < 0.08
  const rExt = (p.spanTo as number) > 0.92
  const gap = pillar / 2
  const bw = frontEdge - rearEdge - 2 * gap
  const tF = edgeAt(frontEdge, fExt, true) - gap
  const tR = edgeAt(rearEdge, rExt, false) + gap
  const tw = Math.max(0.05, tF - tR)
  const origin = new THREE.Vector3(xc, yc, z).addScaledVector(Z, proud)
  return { origin, X, Y, Z, auto: { w: Math.max(0.1, bw), h, topRatio: tw / Math.max(0.1, bw), slantTop: (tF + tR) / 2 - xc } }
}

registerPart({
  type: 'vehicule.window',
  label: 'Vitre',
  category: 'vitres',
  icon: '🪟',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    wv('ws', 'Pare-brise', '🌅', { role: 'pare-brise', shape: 'trapeze' }),
    wv('rw', 'Lunette arrière', '🌇', { role: 'lunette', shape: 'trapeze' }),
    wv('side', 'Vitres latérales', '🪟', { role: 'laterale', shape: 'trapeze', spanFrom: 0.02, spanTo: 0.98, bars: 1 }),
    wv('roof', 'Toit ouvrant', '☀️', { role: 'toit', shape: 'rect' }),
    wv('pano', 'Panoramique', '🏞️', { shape: 'panoramique' }),
    wv('oval', 'Ovale', '🥚', { shape: 'ovale' }),
  ],
  schema: [
    choice('role', 'Emplacement', 'laterale', [['pare-brise', 'Pare-brise', '🌅'], ['lunette', 'Lunette arrière', '🌇'], ['laterale', 'Latérale', '🪟'], ['toit', 'Toit', '☀️']], { group: PO, level: 'easy' }),
    num('spanFrom', 'Début le long de l’habitacle', 0.02, [0, 1], { group: PO, level: 'easy', step: 0.005, showIf: (p) => p.role === 'laterale', tip: '0 = côté pare-brise, 1 = côté lunette arrière.' }),
    num('spanTo', 'Fin le long de l’habitacle', 0.98, [0, 1], { group: PO, level: 'easy', step: 0.005, showIf: (p) => p.role === 'laterale' }),
    num('u', 'Glisser horizontalement', 0, [-1, 1], { group: PO, unit: 'm', tip: 'Fait glisser la vitre sur la carrosserie.' }),
    num('v', 'Glisser verticalement', 0, [-1, 1], { group: PO, unit: 'm' }),
    bool('autoSize', 'Taille automatique', true, { group: PO, level: 'easy', tip: 'La vitre épouse la carrosserie. Décoche pour la régler à la main.' }),
    pos('gapBelow', 'Marge en bas', 0.04, [0, 0.4], { group: PO, unit: 'm' }),
    pos('gapAbove', 'Marge en haut', 0.04, [0, 0.4], { group: PO, unit: 'm' }),

    choice('shape', 'Forme', 'trapeze', [['rect', 'Rectangle', '▭'], ['trapeze', 'Trapèze', '⏢'], ['ovale', 'Ovale', '🥚'], ['panoramique', 'Panoramique', '🏞️'], ['goutte', 'Goutte', '💧'], ['hexagone', 'Hexagone', '⬡']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 1.2, [0.1, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.4, [0.05, 2], { group: FO, level: 'easy', unit: 'm' }),
    num('topRatio', 'Largeur du haut', 0.8, [0.1, 1.5], { group: FO, step: 0.005, tip: '1 = rectangle, < 1 = trapèze.' }),
    num('slantTop', 'Inclinaison du haut', 0, [-1, 1], { group: FO, unit: 'm' }),
    num('round', 'Arrondi des coins', 0.2, [0.03, 0.45], { group: FO, step: 0.005 }),
    num('tilt', 'Rotation dans le plan', 0, [-90, 90], { group: FO, step: 1, unit: '°' }),

    pos('frame', 'Épaisseur du cadre', 0.04, [0.005, 0.2], { group: CA, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur de la vitre', 0.02, [0.004, 0.1], { group: CA, unit: 'm' }),
    int('bars', 'Montants intérieurs', 0, [0, 4], { group: CA, tip: 'Barres verticales qui séparent la vitre en plusieurs parties.' }),
    pos('barW', 'Épaisseur des montants', 0.045, [0.01, 0.2], { group: CA, unit: 'm', showIf: (p) => (p.bars as number) > 0 }),
    pos('pillar', 'Largeur des montants de carrosserie', 0.07, [0, 0.3], { group: CA, unit: 'm', tip: 'Espace laissé autour de la vitre en pose automatique.' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const f = frameFor(b, own)
    const off = f.X.clone().multiplyScalar(own.u as number).add(f.Y.clone().multiplyScalar(own.v as number))
    const o = f.origin.clone().add(off)
    const res: { params?: ParamValues; pos: [number, number, number]; rot: [number, number, number] } = {
      pos: [o.x, o.y, o.z],
      rot: eulerFromBasis(f.X, f.Y, f.Z),
    }
    if (own.autoSize) {
      const a = f.auto
      res.params = { w: a.w, h: a.h, topRatio: a.topRatio, slantTop: a.slantTop }
    }
    return res
  },
  build: (p) => {
    const outer = windowOutline(p)
    const f = p.frame as number
    const w = p.w as number
    const h = p.h as number
    const sx = Math.max(0.05, (w - 2 * f) / w)
    const sy = Math.max(0.05, (h - 2 * f) / h)
    // Contour de la vitre : homothétie du contour extérieur autour de son centre
    const cx = outer.reduce((s, q) => s + q[0], 0) / outer.length
    const cy = outer.reduce((s, q) => s + q[1], 0) / outer.length
    const inner = outer.map(([x, y]) => [cx + (x - cx) * sx, cy + (y - cy) * sy] as [number, number])
    const t = p.thick as number
    const root = new THREE.Group()
    const holder = new THREE.Group()
    holder.rotation.z = ((p.tilt as number) * Math.PI) / 180
    root.add(holder)

    // Cadre : anneau (contour extérieur percé de la vitre)
    const frameGeo = extrude(shapeFromPts(outer, [inner.slice().reverse()]), t)
    holder.add(mk(frameGeo, 'dark', { edgeAngle: 30 }))
    // Vitre : plaque légèrement en retrait
    const glass = extrude(shapeFromPts(inner), t * 0.45)
    glass.translate(0, 0, -t * 0.12)
    holder.add(mk(glass, 'glass', { edgeAngle: 30 }))
    // Montants verticaux régulièrement répartis
    const bars = Math.round(p.bars as number)
    if (bars > 0) {
      const bw = p.barW as number
      for (let i = 1; i <= bars; i++) {
        const fx = -0.5 + i / (bars + 1)
        const bg = new THREE.BoxGeometry(bw, h * sy * 1.001, t * 1.05)
        const m = mk(bg, 'dark', { edgeAngle: 30 })
        m.position.set(cx + fx * w * sx, cy, 0)
        holder.add(m)
      }
    }
    return root
  },
  handles: (p): Handle[] => [
    { id: 'w', label: 'Largeur', position: [(p.w as number) / 2, 0, 0.03], axis: [1, 0, 0], param: 'w', ratio: 2 },
    { id: 'h', label: 'Hauteur', position: [0, (p.h as number) / 2, 0.03], axis: [0, 1, 0], param: 'h', ratio: 2 },
  ],
})
