// Châssis / carrosserie : un seul solide lissé (capot + habitacle + coffre) piloté par ~30 curseurs.
import { registerPart } from '@/core/registry'
import { bool, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { mk } from '@/parts/primitives/geo'
import { buildBodyGeometry, makeBody } from './body'

const GAB = 'Gabarit'
const PRO = 'Profil'
const ARR = 'Arrondis et flancs'
const ESS = 'Essieux et passages de roue'

/** Valeurs de base d'une berline : chaque type de véhicule n'en change que quelques-unes. */
export const CHASSIS_BASE: ParamValues = {
  length: 4.7, width: 1.82, height: 1.45, wheelbase: 2.8, axleShift: 0, clearance: 0.15,
  axleCount: 2, axleGap: 1.3, wheelDia: 0.66, archGap: 0.06, arches: true,
  noseH: 0.62, deckH: 0.8, tailH: 0.84, wsBase: 0.3, roofFront: 0.44, roofRear: 0.68, rearBase: 0.8,
  roofCrown: 0.03, hoodCrown: 0.03, cornerRound: 0.25, tumble: 0.08, cabinRatio: 0.88, cabinTumble: 0.3,
  noseWidth: 0.88, tailWidth: 0.9, bulge: 0.03, noseRound: 0.35, tailRound: 0.3, sill: 0.04,
}

const v = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params: { ...CHASSIS_BASE, ...params } })

export const CHASSIS_VARIANTS: PartVariant[] = [
  v('berline', 'Berline', '🚗', {}),
  v('citadine', 'Citadine', '🚙', { length: 3.7, width: 1.68, height: 1.5, wheelbase: 2.45, wheelDia: 0.58, noseH: 0.66, deckH: 0.86, tailH: 0.9, wsBase: 0.27, roofFront: 0.38, roofRear: 0.8, rearBase: 0.9, noseRound: 0.25, tailRound: 0.15 }),
  v('suv', 'SUV', '🚘', { length: 4.6, width: 1.9, height: 1.7, wheelbase: 2.75, clearance: 0.22, wheelDia: 0.74, noseH: 0.8, deckH: 0.98, tailH: 1.0, wsBase: 0.27, roofFront: 0.4, roofRear: 0.78, rearBase: 0.9, tailRound: 0.12, cabinRatio: 0.9 }),
  v('pickup', 'Pick-up', '🛻', { length: 5.3, width: 1.95, height: 1.8, wheelbase: 3.2, clearance: 0.24, wheelDia: 0.78, noseH: 0.85, deckH: 1.0, tailH: 0.82, wsBase: 0.24, roofFront: 0.34, roofRear: 0.5, rearBase: 0.58, tailRound: 0.08, cabinRatio: 0.9 }),
  v('sportive', 'Sportive', '🏎️', { length: 4.5, width: 1.95, height: 1.2, wheelbase: 2.7, clearance: 0.1, wheelDia: 0.68, noseH: 0.5, deckH: 0.66, tailH: 0.7, wsBase: 0.33, roofFront: 0.5, roofRear: 0.66, rearBase: 0.8, cabinRatio: 0.84, cabinTumble: 0.45, tumble: 0.1, bulge: 0.05 }),
  v('coupe', 'Coupé', '🚖', { length: 4.4, width: 1.85, height: 1.3, wheelbase: 2.65, clearance: 0.12, noseH: 0.56, deckH: 0.74, tailH: 0.8, wsBase: 0.32, roofFront: 0.5, roofRear: 0.62, rearBase: 0.78, cabinTumble: 0.4 }),
  v('break', 'Break', '🚐', { length: 4.8, height: 1.5, wsBase: 0.29, roofFront: 0.42, roofRear: 0.86, rearBase: 0.93, tailH: 0.9, tailRound: 0.12 }),
  v('monospace', 'Monospace', '🚌', { length: 4.5, height: 1.7, deckH: 0.88, noseH: 0.7, tailH: 0.92, wsBase: 0.24, roofFront: 0.36, roofRear: 0.85, rearBase: 0.94, tailRound: 0.15 }),
  v('fourgon', 'Fourgon', '🚚', { length: 5.4, width: 2.0, height: 2.5, wheelbase: 3.4, clearance: 0.2, wheelDia: 0.72, noseH: 0.78, deckH: 1.0, tailH: 1.0, wsBase: 0.2, roofFront: 0.27, roofRear: 0.93, rearBase: 0.97, cabinRatio: 0.98, cabinTumble: 0.04, tailRound: 0.05, cornerRound: 0.18 }),
  v('bus', 'Bus', '🚍', { length: 11, width: 2.55, height: 3.3, wheelbase: 5.6, clearance: 0.35, wheelDia: 1.0, noseH: 1.6, deckH: 1.2, tailH: 1.3, wsBase: 0.015, roofFront: 0.04, roofRear: 0.96, rearBase: 0.985, cabinRatio: 0.99, cabinTumble: 0.02, tumble: 0.02, noseRound: 0.08, tailRound: 0.08, cornerRound: 0.14, noseWidth: 0.97, tailWidth: 0.97, bulge: 0 }),
  v('camion', 'Camion', '🚛', { length: 8.2, width: 2.5, height: 3.1, wheelbase: 4.4, clearance: 0.45, axleCount: 3, axleGap: 1.4, wheelDia: 1.0, noseH: 1.15, deckH: 1.6, tailH: 1.1, wsBase: 0.06, roofFront: 0.1, roofRear: 0.2, rearBase: 0.22, cabinRatio: 1, cabinTumble: 0.02, tumble: 0.02, noseRound: 0.06, tailRound: 0.05, cornerRound: 0.12, noseWidth: 0.96, tailWidth: 0.96, bulge: 0 }),
  v('cabriolet', 'Cabriolet', '🏖️', { length: 4.2, width: 1.82, height: 1.12, wheelbase: 2.5, clearance: 0.13, noseH: 0.58, deckH: 0.78, tailH: 0.8, wsBase: 0.34, roofFront: 0.4, roofRear: 0.42, rearBase: 0.44, cabinTumble: 0.5 }),
  v('buggy', 'Buggy', '🏁', { length: 3.4, width: 1.8, height: 0.95, wheelbase: 2.2, clearance: 0.3, wheelDia: 0.82, noseH: 0.5, deckH: 0.62, tailH: 0.66, wsBase: 0.34, roofFront: 0.42, roofRear: 0.6, rearBase: 0.66, noseRound: 0.25, tailRound: 0.2, cabinRatio: 0.8, cabinTumble: 0.1, archGap: 0.12 }),
]

registerPart({
  type: 'vehicule.chassis',
  label: 'Carrosserie',
  category: 'chassis',
  icon: '🚗',
  module: 'vehicule',
  variants: CHASSIS_VARIANTS,
  schema: [
    pos('length', 'Longueur', 4.7, [2, 12], { group: GAB, level: 'easy', unit: 'm', tip: 'Longueur totale du véhicule.' }),
    pos('width', 'Largeur', 1.82, [1, 3], { group: GAB, level: 'easy', unit: 'm', tip: 'Largeur totale, rétroviseurs exclus.' }),
    pos('height', 'Hauteur totale', 1.45, [0.6, 4], { group: GAB, level: 'easy', unit: 'm', tip: 'Hauteur du toit.' }),
    pos('wheelbase', 'Empattement', 2.8, [1.2, 8], { group: GAB, unit: 'm', tip: 'Distance entre l’essieu avant et l’essieu arrière.' }),
    num('axleShift', 'Décalage des essieux', 0, [-1, 1], { group: GAB, unit: 'm', tip: 'Pousse les roues vers l’avant (+) ou l’arrière (−).' }),
    pos('clearance', 'Garde au sol', 0.15, [0, 0.6], { group: GAB, level: 'easy', unit: 'm', tip: 'Espace entre le sol et le dessous.' }),

    pos('noseH', 'Hauteur du nez', 0.62, [0.2, 2.5], { group: PRO, level: 'easy', unit: 'm', tip: 'Hauteur du capot à l’avant.' }),
    pos('deckH', 'Hauteur du capot / ceinture', 0.8, [0.3, 2.5], { group: PRO, level: 'easy', unit: 'm', tip: 'Hauteur du bas des vitres.' }),
    pos('tailH', 'Hauteur du coffre', 0.84, [0.3, 2.5], { group: PRO, level: 'easy', unit: 'm', tip: 'Hauteur à l’arrière.' }),
    num('wsBase', 'Longueur du capot', 0.3, [0.01, 0.6], { group: PRO, level: 'easy', step: 0.005, tip: 'Où commence le pare-brise (0 = tout devant, 1 = tout derrière).' }),
    num('roofFront', 'Début du toit', 0.44, [0.02, 0.8], { group: PRO, level: 'easy', step: 0.005, tip: 'Plus c’est petit, plus le pare-brise est redressé.' }),
    num('roofRear', 'Fin du toit', 0.68, [0.1, 0.98], { group: PRO, level: 'easy', step: 0.005, tip: 'Où le toit commence à descendre vers l’arrière.' }),
    num('rearBase', 'Bas de la lunette arrière', 0.8, [0.1, 1], { group: PRO, step: 0.005, tip: 'Où la lunette arrière rejoint le coffre.' }),
    num('roofCrown', 'Bombé du toit', 0.03, [-0.1, 0.3], { group: PRO, unit: 'm' }),
    num('hoodCrown', 'Bombé du capot', 0.03, [-0.1, 0.3], { group: PRO, unit: 'm' }),

    num('cornerRound', 'Arrondi des arêtes', 0.25, [0.04, 0.45], { group: ARR, level: 'easy', step: 0.005, tip: 'Petit = carrosserie anguleuse, grand = galet.' }),
    pos('noseRound', 'Arrondi de l’avant', 0.35, [0.02, 1.5], { group: ARR, unit: 'm', tip: 'Petit = avant plat (camion), grand = museau arrondi.' }),
    pos('tailRound', 'Arrondi de l’arrière', 0.3, [0.02, 1.5], { group: ARR, unit: 'm' }),
    num('noseWidth', 'Largeur du museau', 0.88, [0.4, 1.1], { group: ARR, step: 0.005, tip: 'Finesse de l’avant par rapport au milieu.' }),
    num('tailWidth', 'Largeur de l’arrière', 0.9, [0.4, 1.1], { group: ARR, step: 0.005 }),
    num('bulge', 'Galbe des flancs', 0.03, [-0.1, 0.2], { group: ARR, step: 0.005, tip: 'Rend les flancs plus ou moins ventrus.' }),
    num('tumble', 'Rentrée de caisse', 0.08, [-0.1, 0.4], { group: ARR, step: 0.005, tip: 'Les flancs se resserrent vers le haut.' }),
    num('cabinRatio', 'Largeur de l’habitacle', 0.88, [0.5, 1.1], { group: ARR, step: 0.005 }),
    num('cabinTumble', 'Inclinaison des vitres latérales', 0.3, [-0.2, 1], { group: ARR, step: 0.005 }),
    num('sill', 'Rentrée du bas de caisse', 0.04, [0, 0.3], { group: ARR, step: 0.005 }),

    int('axleCount', 'Nombre d’essieux', 2, [1, 5], { group: ESS, level: 'easy', tip: '2 pour une voiture, 3 ou plus pour un camion.' }),
    pos('axleGap', 'Écart entre essieux arrière', 1.3, [0.6, 3], { group: ESS, unit: 'm', showIf: (p) => (p.axleCount as number) > 2 }),
    pos('wheelDia', 'Diamètre des roues', 0.66, [0.3, 1.4], { group: ESS, level: 'easy', unit: 'm', tip: 'Les roues suivent ce diamètre quand elles sont liées à la carrosserie.' }),
    bool('arches', 'Passages de roue', true, { group: ESS, tip: 'Creuse la carrosserie autour des roues.' }),
    pos('archGap', 'Jeu autour des roues', 0.06, [0, 0.4], { group: ESS, unit: 'm', showIf: (p) => !!p.arches }),
  ],
  provide: (p) => makeBody(p),
  dims: (p) => {
    const L = p.length as number
    const W = p.width as number
    const H = p.height as number
    const b = makeBody(p)
    return [
      { a: [-L / 2, 0, W / 2], b: [L / 2, 0, W / 2], offset: 0.6, dir: [0, 0, 1], label: `${L.toFixed(2)} m` },
      { a: [L / 2, 0, -W / 2], b: [L / 2, 0, W / 2], offset: 0.6, dir: [1, 0, 0], label: `${W.toFixed(2)} m` },
      { a: [-L / 2, 0, W / 2], b: [-L / 2, b.H, W / 2], offset: 0.6, dir: [-1, 0, 0], label: `${H.toFixed(2)} m` },
      { a: [b.axleXs[0], 0, -W / 2], b: [b.axleXs[1] ?? b.axleXs[0], 0, -W / 2], offset: 0.6, dir: [0, 0, -1], label: `empattement ${((p.wheelbase as number)).toFixed(2)} m` },
    ]
  },
  build: (p) => {
    const body = makeBody(p)
    return mk(buildBodyGeometry(p, body), 'body', { edgeAngle: 38 })
  },
  handles: (p): Handle[] => {
    const L = p.length as number
    const W = p.width as number
    const H = p.height as number
    return [
      { id: 'len', label: 'Longueur', position: [L / 2, (p.noseH as number) * 0.8, 0], axis: [1, 0, 0], param: 'length', ratio: 2 },
      { id: 'wid', label: 'Largeur', position: [0, (p.deckH as number) * 0.7, W / 2], axis: [0, 0, 1], param: 'width', ratio: 2 },
      { id: 'hei', label: 'Hauteur', position: [-(L / 2) * ((p.roofFront as number) + (p.roofRear as number) - 1) * 0 + L / 2 - L * (((p.roofFront as number) + (p.roofRear as number)) / 2), H, 0], axis: [0, 1, 0], param: 'height', ratio: 1 },
    ]
  },
})
