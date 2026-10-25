// Roues complètes (pneus + jantes) : toutes les roues du véhicule en une pièce,
// ou une roue isolée. Les jantes suivent le pneu ; les essieux suivent la carrosserie.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { buildWheel } from './rim'
import type { Body } from './body'

const PN = 'Pneu'
const TR = 'Sculpture du pneu'
const JA = 'Jante'
const BR = 'Branches'
const MY = 'Moyeu et boulons'
const ES = 'Essieux et position'

const rimVariant = (id: string, label: string, icon: string, params: ParamValues): PartVariant => ({ id, label, icon, params })
export const RIMS: PartVariant[] = [
  rimVariant('sport5', '5 branches', '⚙️', { spokeShape: 'droite', spokeCount: 5, spokeWidth: 0.05, spokeTwist: 0, boltCount: 5 }),
  rimVariant('multi', 'Multi-branches', '🕸️', { spokeShape: 'droite', spokeCount: 16, spokeWidth: 0.018, spokeTwist: 0, boltCount: 5 }),
  rimVariant('courbe', 'Branches courbes', '🌀', { spokeShape: 'courbe', spokeCount: 7, spokeWidth: 0.035, spokeTwist: 40 }),
  rimVariant('y', 'Branches en Y', '🔱', { spokeShape: 'y', spokeCount: 5, spokeWidth: 0.045, spokeTwist: 0 }),
  rimVariant('double', 'Doubles branches', '〓', { spokeShape: 'double', spokeCount: 6, spokeWidth: 0.04 }),
  rimVariant('etoile', 'Étoile', '⭐', { spokeShape: 'etoile', spokeCount: 6, spokeWidth: 0.045 }),
  rimVariant('turbine', 'Turbine', '🌪️', { spokeShape: 'turbine', spokeCount: 12, spokeWidth: 0.05, spokeTwist: 35 }),
  rimVariant('spirale', 'Spirale', '🐚', { spokeShape: 'spirale', spokeCount: 5, spokeWidth: 0.04, spokeTwist: 50 }),
  rimVariant('pleine', 'Pleine à trous', '🥏', { spokeShape: 'pleine', holeCount: 6, holeSize: 0.09 }),
  rimVariant('grille', 'Grille', '#️⃣', { spokeShape: 'grille', spokeCount: 8, spokeWidth: 0.03 }),
]

registerPart({
  type: 'vehicule.wheels',
  handles: (p): Handle[] => [{ id: 'd', label: 'Diamètre', position: [p.frontX as number, p.tireDia as number, (p.trackFront as number) / 2 + (p.tireWidth as number) / 2], axis: [0, 1, 0], param: 'tireDia', ratio: 1 }, { id: 'w', label: 'Largeur du pneu', position: [p.frontX as number, (p.tireDia as number) / 2, (p.trackFront as number) / 2 + (p.tireWidth as number)], axis: [0, 0, 1], param: 'tireWidth', ratio: 1 }],
  label: 'Roues et jantes',
  category: 'roues',
  icon: '🛞',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: RIMS,
  schema: [
    pos('tireDia', 'Diamètre du pneu', 0.66, [0.2, 1.6], { group: PN, level: 'easy', unit: 'm', tip: 'Taille totale de la roue.' }),
    pos('tireWidth', 'Largeur du pneu', 0.215, [0.05, 0.6], { group: PN, level: 'easy', unit: 'm' }),
    num('profile', 'Hauteur du flanc', 0.55, [0.1, 1.2], { group: PN, level: 'easy', step: 0.005, tip: 'Petit = pneu fin (sportif), grand = pneu épais (tout-terrain).' }),
    num('shoulder', 'Arrondi de l’épaule', 0.5, [0, 1], { group: PN, step: 0.01 }),
    num('bulge', 'Galbe du flanc', 0.012, [-0.05, 0.1], { group: PN, step: 0.001, unit: 'm' }),
    choice('tread', 'Sculpture', 'lisse', [['lisse', 'Lisse', '⚪'], ['rainures', 'Rainures', '〰️'], ['blocs', 'Blocs', '▦'], ['chevron', 'Chevrons', '⌃'], ['cross', 'Tout-terrain', '⛰️'], ['neige', 'Neige', '❄️']], { group: TR }),
    int('treadCount', 'Nombre de motifs', 28, [8, 80], { group: TR, showIf: (p) => p.tread !== 'lisse' && p.tread !== 'rainures' }),
    pos('treadDepth', 'Profondeur', 0.012, [0, 0.05], { group: TR, unit: 'm', showIf: (p) => p.tread !== 'lisse' }),

    num('rimAdjust', 'Taille de la jante', 1, [0.5, 1.15], { group: JA, level: 'easy', step: 0.005, tip: 'La jante suit le pneu automatiquement ; ce réglage l’agrandit ou la rapetisse.' }),
    num('rimWidth', 'Largeur de la jante', 0.8, [0.3, 1.2], { group: JA, step: 0.005 }),
    pos('rimLip', 'Épaisseur du bord', 0.025, [0.005, 0.1], { group: JA, unit: 'm' }),
    num('rimDepth', 'Creux de la jante', 0.03, [-0.05, 0.2], { group: JA, unit: 'm', tip: 'Négatif = jante bombée, positif = jante creuse.' }),
    bool('brake', 'Disque et étrier de frein', true, { group: JA }),

    choice('spokeShape', 'Forme des branches', 'droite', [['droite', 'Droites', '⚙️'], ['courbe', 'Courbes', '🌀'], ['y', 'En Y', '🔱'], ['double', 'Doubles', '〓'], ['etoile', 'Étoile', '⭐'], ['turbine', 'Turbine', '🌪️'], ['spirale', 'Spirale', '🐚'], ['pleine', 'Pleine', '🥏'], ['grille', 'Grille', '#️⃣']], { group: BR }),
    int('spokeCount', 'Nombre de branches', 5, [2, 24], { group: BR, level: 'easy', max: 60, showIf: (p) => p.spokeShape !== 'pleine' }),
    pos('spokeWidth', 'Largeur des branches', 0.045, [0.008, 0.15], { group: BR, unit: 'm', showIf: (p) => p.spokeShape !== 'pleine' }),
    pos('spokeThick', 'Épaisseur des branches', 0.018, [0.005, 0.08], { group: BR, unit: 'm' }),
    num('spokeTwist', 'Torsion des branches', 30, [-90, 90], { group: BR, step: 1, unit: '°', showIf: (p) => ['courbe', 'spirale', 'turbine', 'y'].includes(p.spokeShape as string) }),
    num('spokeTaper', 'Affinement vers l’extérieur', 0.5, [0, 1], { group: BR, step: 0.01, showIf: (p) => ['droite', 'courbe', 'spirale', 'etoile'].includes(p.spokeShape as string) }),
    int('holeCount', 'Nombre de trous', 6, [0, 16], { group: BR, showIf: (p) => p.spokeShape === 'pleine' }),
    num('holeSize', 'Taille des trous', 0.09, [0.02, 0.25], { group: BR, step: 0.005, showIf: (p) => p.spokeShape === 'pleine' }),
    num('rimRot', 'Rotation de la jante', 0, [-180, 180], { group: BR, step: 1, unit: '°' }),

    pos('hubDia', 'Diamètre du moyeu', 0.14, [0.04, 0.4], { group: MY, unit: 'm' }),
    bool('hubCap', 'Cache central', true, { group: MY }),
    int('boltCount', 'Nombre de boulons', 5, [0, 12], { group: MY, level: 'easy' }),
    num('boltCircle', 'Cercle de perçage', 0.7, [0.3, 0.95], { group: MY, step: 0.01, showIf: (p) => (p.boltCount as number) > 0 }),
    pos('boltSize', 'Taille des boulons', 0.011, [0.003, 0.03], { group: MY, unit: 'm', showIf: (p) => (p.boltCount as number) > 0 }),
    choice('boltShape', 'Forme des boulons', 'rond', [['rond', 'Ronds', '⚫'], ['hexagone', 'Hexagones', '⬢'], ['etoile', 'Pentagones', '⬟']], { group: MY, showIf: (p) => (p.boltCount as number) > 0 }),
    bool('centerNut', 'Écrou central', false, { group: MY }),

    int('axleCount', 'Nombre d’essieux', 2, [1, 5], { group: ES, level: 'easy', tip: 'Combien de paires de roues.' }),
    pos('frontX', 'Position de l’essieu avant', 1.5, [-6, 6], { group: ES, unit: 'm' }),
    pos('wheelbase', 'Écart entre essieux', 2.8, [0.3, 8], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 1 }),
    pos('axleGap', 'Écart des essieux arrière', 1.3, [0.5, 3], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 2 }),
    pos('trackFront', 'Voie avant', 1.55, [0.3, 3.5], { group: ES, unit: 'm', tip: 'Distance entre les roues avant gauche et droite.' }),
    pos('trackRear', 'Voie arrière', 1.55, [0.3, 3.5], { group: ES, unit: 'm' }),
    num('wheelOut', 'Saillie des roues', 0, [-0.2, 0.3], { group: ES, unit: 'm', tip: 'Fait dépasser les roues de la carrosserie.' }),
    num('steer', 'Braquage des roues avant', 0, [-40, 40], { group: ES, step: 1, unit: '°' }),
    bool('dual', 'Roues jumelées à l’arrière', false, { group: ES, tip: 'Deux roues côte à côte (camion).' }),
    num('axle0', 'Essieu 1 : décalage', 0, [-1, 1], { group: ES, unit: 'm' }),
    num('axle1', 'Essieu 2 : décalage', 0, [-1, 1], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 1 }),
    num('axle2', 'Essieu 3 : décalage', 0, [-1, 1], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 2 }),
    num('axle3', 'Essieu 4 : décalage', 0, [-1, 1], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 3 }),
    num('axle4', 'Essieu 5 : décalage', 0, [-1, 1], { group: ES, unit: 'm', showIf: (p) => (p.axleCount as number) > 4 }),
  ],
  /** La roue s'adapte à la carrosserie : diamètre, essieux, voie. */
  fit: (parent, own) => {
    const b = parent as Body
    if (!b || !b.axleXs) return {}
    const R = b.wheelDia / 2
    const w = own.tireWidth as number
    const out = (own.wheelOut as number) ?? 0
    const zOf = (x: number): number => b.sideZ(x, R) - w / 2 + out
    const xs = b.axleXs
    return {
      params: {
        tireDia: b.wheelDia,
        axleCount: xs.length,
        frontX: xs[0],
        wheelbase: xs.length > 1 ? xs[0] - xs[1] : (own.wheelbase as number),
        trackFront: 2 * zOf(xs[0]),
        trackRear: 2 * zOf(xs[xs.length - 1]),
      },
    }
  },
  build: (p) => {
    const R = (p.tireDia as number) / 2
    const proto = buildWheel(p)
    proto.rotation.z = (((p.rimRot as number) ?? 0) * Math.PI) / 180
    // La rotation de jante ne doit pas tourner le pneu : on applique sur l'ensemble (pneu symétrique)
    const root = new THREE.Group()
    const n = Math.max(1, Math.round(p.axleCount as number))
    const w = p.tireWidth as number
    for (let i = 0; i < n; i++) {
      let x = (p.frontX as number)
      if (i >= 1) x -= p.wheelbase as number
      if (i >= 2) x -= (p.axleGap as number) * (i - 1)
      x += (p[`axle${i}`] as number) ?? 0
      const track = (i === 0 ? p.trackFront : p.trackRear) as number
      const steer = i === 0 ? ((p.steer as number) * Math.PI) / 180 : 0
      for (const side of [1, -1]) {
        const mount = (z: number) => {
          const g = proto.clone()
          const holder = new THREE.Group()
          holder.add(g)
          holder.position.set(x, R, z * side)
          holder.rotation.y = side === 1 ? steer : Math.PI + steer
          root.add(holder)
        }
        mount(track / 2)
        if (p.dual && i >= 1) mount(track / 2 - w * 1.02)
      }
    }
    return root
  },
})
