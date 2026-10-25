// Portes : formes variées, suivent le flanc de la carrosserie (plan bas + plan de vitre incliné),
// 7 types d'ouverture avec animation douce.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { choice, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { clipPolyY, extrude, mk, roundPoly, roundedBox, shapeFromPts } from '@/parts/primitives/geo'
import { clamp, deg } from '@/utils/math'
import { asBody, cabinX, sidePlane } from './util'
import type { Body } from './body'

const FO = 'Forme'
const PO = 'Position'
const PU = 'Poignée'
const OU = 'Ouverture'

const dv = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })

/** Contour de la porte dans le plan (u, y) : y est relatif au dessus de caisse. */
export function doorOutline(p: ParamValues, yBot: number): [number, number][] {
  const w = p.width as number
  const yTop = Math.max(0.0, p.winH as number)
  const slope = p.topSlope as number
  const arch = p.topArch as number
  const inset = p.topInset as number
  const cut = p.cutRear as number
  const pts: [number, number][] = []
  pts.push([w / 2, yBot])
  pts.push([-w / 2 + cut, yBot])
  if (cut > 0.001) pts.push([-w / 2, yBot + cut])
  const yRear = yTop - slope
  pts.push([-w / 2, yRear * 0.98])
  const K = 14
  for (let i = 0; i <= K; i++) {
    const s = i / K
    const u = -w / 2 + inset + (w - inset * 1.3) * s
    pts.push([u, yRear + (yTop - yRear) * s + arch * Math.sin(Math.PI * s)])
  }
  pts.push([w / 2, yTop - 0.02])
  return roundPoly(pts, clamp(p.roundness as number, 0.03, 0.45), 2)
}

registerPart({
  type: 'vehicule.door',
  label: 'Porte',
  category: 'portes',
  icon: '🚪',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  animate: { param: 'open', label: 'Ouverture', from: 0, to: 1 },
  variants: [
    dv('standard', 'Classique', '🚪', { shape: 'standard', width: 0.95, winH: 0, topSlope: 0, topArch: 0.02, topInset: 0, cutRear: 0, roundness: 0.12 }),
    dv('coupe', 'Coupé (longue)', '🏎️', { shape: 'coupe', width: 1.2, winH: 0, topSlope: 0.05, topArch: 0.02, topInset: 0.1, cutRear: 0.18, roundness: 0.2 }),
    dv('arrondie', 'Arrondie', '⭕', { shape: 'arrondie', width: 0.9, winH: 0, topSlope: 0, topArch: 0.06, topInset: 0, cutRear: 0, roundness: 0.42 }),
    dv('trapeze', 'Trapèze', '🔶', { shape: 'trapeze', width: 1.0, winH: 0, topSlope: 0.06, topArch: 0, topInset: 0.18, cutRear: 0, roundness: 0.1 }),
    dv('cintree', 'Cintrée', '🌈', { shape: 'cintree', width: 0.95, winH: 0, topSlope: 0.0, topArch: 0.12, topInset: 0, cutRear: 0, roundness: 0.2 }),
    dv('haute', 'Haute (van / bus)', '🚌', { shape: 'standard', width: 0.9, winH: 1.0, topSlope: 0, topArch: 0, topInset: 0, cutRear: 0, roundness: 0.06 }),
  ],
  schema: [
    choice('shape', 'Forme', 'standard', [['standard', 'Classique', '🚪'], ['coupe', 'Coupé', '🏎️'], ['arrondie', 'Arrondie', '⭕'], ['trapeze', 'Trapèze', '🔶'], ['cintree', 'Cintrée', '🌈']], { group: FO }),
    pos('width', 'Largeur', 0.95, [0.3, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('winH', 'Hauteur au-dessus de la ceinture', 0, [0, 2.5], { group: FO, level: 'easy', unit: 'm', tip: '0 = la porte s’arrête sous les vitres. Augmente pour une porte qui englobe la vitre (van, bus).' }),
    pos('sillGap', 'Garde du bas', 0.1, [0, 0.8], { group: FO, unit: 'm', tip: 'Distance entre le bas de la porte et le sol.' }),
    num('topSlope', 'Descente vers l’arrière', 0, [-0.3, 0.6], { group: FO, unit: 'm' }),
    num('topArch', 'Bombé du haut', 0.02, [-0.1, 0.4], { group: FO, unit: 'm' }),
    num('topInset', 'Retrait du haut', 0, [0, 0.6], { group: FO, unit: 'm' }),
    num('cutRear', 'Coin arrière coupé', 0, [0, 0.6], { group: FO, unit: 'm' }),
    num('roundness', 'Arrondi des coins', 0.12, [0.03, 0.45], { group: FO, step: 0.005 }),
    pos('thick', 'Épaisseur', 0.035, [0.005, 0.2], { group: FO, unit: 'm' }),

    num('along', 'Position le long de la voiture', 0.36, [0, 1], { group: PO, level: 'easy', step: 0.005, tip: '0 = près du pare-brise, 1 = près de la lunette arrière.' }),
    pos('sideOffset', 'Distance au centre', 0.9, [0.1, 3], { group: PO, unit: 'm', tip: 'Utilisé quand la porte ne suit pas la carrosserie.' }),

    choice('handle', 'Poignée', 'barre', [['aucune', 'Aucune', '⛔'], ['barre', 'Barre', '➖'], ['plate', 'Plate', '▬'], ['bouton', 'Bouton', '⚫']], { group: PU }),
    pos('handleSize', 'Taille de la poignée', 0.15, [0.03, 0.5], { group: PU, unit: 'm' }),
    num('handleU', 'Position de la poignée', -0.32, [-0.5, 0.5], { group: PU, step: 0.005 }),
    num('handleY', 'Hauteur de la poignée', -0.06, [-0.6, 0.6], { group: PU, unit: 'm' }),

    choice('openType', 'Type d’ouverture', 'classique', [['classique', 'Classique', '🚪'], ['coulissante', 'Coulissante', '↔️'], ['papillon', 'Papillon', '🦋'], ['ciseaux', 'Ciseaux', '✂️'], ['gullwing', 'Aile de mouette', '🕊️'], ['suicide', 'Suicide', '⚰️'], ['bascule', 'À bascule', '⤴️']], { group: OU, level: 'easy' }),
    num('open', 'Ouverture', 0, [0, 1], { group: OU, level: 'easy', step: 0.01, tip: 'Glisse pour ouvrir la porte. Le bouton ▶ du bas anime toutes les portes.' }),
    num('openAngle', 'Angle d’ouverture', 60, [10, 110], { group: OU, step: 1, unit: '°' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const xc = cabinX(b, own.along as number)
    const deck = b.deckY(xc)
    return { pos: [xc, deck, b.sideZ(xc, deck)] }
  },
  build: (p, ctx) => {
    const b: Body | undefined = asBody(ctx.parent)
    const w = p.width as number
    const t = p.thick as number
    const xc = b ? cabinX(b, p.along as number) : 0
    const deck = b ? b.deckY(xc) : 0.8
    const clearance = b ? b.clearance : 0.15
    const yBot = clearance + (p.sillGap as number) - deck
    const outline = doorOutline(p, yBot)

    // Plans du flanc : bas (carrosserie) et haut (habitacle, plus étroit)
    const low = b ? sidePlane(b, xc, deck - 0.05) : { z: p.sideOffset as number, slope: 0, euler: [0, 0, 0] as [number, number, number] }
    const up = b ? sidePlane(b, xc, deck + 0.15) : { z: p.sideOffset as number, slope: 0, euler: [0, 0, 0] as [number, number, number] }
    const zRef = b ? b.sideZ(xc, deck) : 0
    const proud = 0.012
    const root = new THREE.Group()
    const panel = new THREE.Group() // contenu de la porte, origine = (xc, deck, zRef)

    const addPanel = (poly: [number, number][], plane: { z: number; slope: number; euler: [number, number, number] }, y0: number) => {
      if (poly.length < 3) return
      // Le plan passe par (y0, plane.z) ; coordonnées locales : y relatif à y0
      const local = poly.map(([u, y]) => [u, y - y0] as [number, number])
      const g = extrude(shapeFromPts(local), t)
      const m = mk(g, 'body', { edgeAngle: 30 })
      const holder = new THREE.Group()
      holder.add(m)
      holder.position.set(0, y0, plane.z - zRef + proud - t / 2)
      holder.rotation.x = Math.atan(plane.slope)
      panel.add(holder)
    }
    if (b) {
      addPanel(clipPolyY(outline, 0, true), low, -0.05)
      if ((p.winH as number) > 0.02) addPanel(clipPolyY(outline, 0, false), up, 0.15)
    } else addPanel(outline, low, 0)

    // Poignée
    const hk = p.handle as string
    if (hk !== 'aucune') {
      const hs = p.handleSize as number
      const hu = (p.handleU as number) * w
      const hy = p.handleY as number
      const geo = hk === 'barre' ? roundedBox(hs, 0.022, 0.03, 0.01) : hk === 'plate' ? roundedBox(hs, 0.05, 0.02, 0.01) : new THREE.SphereGeometry(hs / 4, 14, 10)
      const hm = mk(geo, 'metal', { edgeAngle: 40 })
      hm.position.set(hu, hy, low.z - zRef + proud + 0.008)
      hm.rotation.x = Math.atan(low.slope)
      panel.add(hm)
    }

    // Charnière et pose d'animation : on regroupe le tout dans un pivot
    const pivot = new THREE.Group()
    pivot.name = 'pivot'
    const type = p.openType as string
    const hinge = new THREE.Vector3(w / 2, 0, 0) // charnière avant
    const hTop = (p.winH as number) * 0.9
    if (type === 'suicide') hinge.set(-w / 2, 0, 0)
    else if (type === 'papillon' || type === 'ciseaux') hinge.set(w / 2, hTop, 0)
    else if (type === 'gullwing' || type === 'bascule') hinge.set(0, hTop, 0)
    else if (type === 'coulissante') hinge.set(0, 0, 0)
    panel.position.sub(hinge)
    pivot.position.copy(hinge)
    pivot.add(panel)
    root.add(pivot)

    const angle = deg(p.openAngle as number)
    root.userData.pose = (r: THREE.Object3D, o: number) => {
      const pv = r.getObjectByName('pivot')
      if (!pv) return
      pv.rotation.set(0, 0, 0)
      pv.position.copy(hinge)
      const k = clamp(o, 0, 1)
      switch (type) {
        case 'classique': pv.rotation.y = angle * k; break
        case 'suicide': pv.rotation.y = -angle * k; break
        case 'coulissante': pv.position.x = hinge.x - k * (w + 0.08); pv.position.z = hinge.z + 0.12 * Math.min(1, k * 4); break
        case 'papillon': pv.rotation.set(-angle * 0.9 * k, angle * 0.35 * k, 0, 'YXZ'); break
        case 'ciseaux': pv.rotation.z = -angle * k; break
        case 'gullwing': pv.rotation.x = -angle * 1.15 * k; break
        case 'bascule': pv.rotation.x = -angle * 0.7 * k; pv.position.z = hinge.z + 0.05 * k; break
      }
    }
    root.userData.pose(root, p.open as number)
    return root
  },
  handles: (p): Handle[] => [
    { id: 'w', label: 'Largeur', position: [(p.width as number) / 2, 0, 0.05], axis: [1, 0, 0], param: 'width', ratio: 2 },
    { id: 'h', label: 'Hauteur', position: [0, p.winH as number, 0.05], axis: [0, 1, 0], param: 'winH', ratio: 1 },
  ],
})
