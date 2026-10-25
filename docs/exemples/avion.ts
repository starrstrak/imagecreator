// EXEMPLE : un module « Avion » complet en ~120 lignes (fuselage + aile qui suit le fuselage + dérive).
// Pour l'activer : copier ce fichier dans src/parts/avion/index.ts et src/modules/avion/module.ts,
// puis ajouter deux lignes d'import dans src/modules/index.ts (voir docs/AJOUTER_UNE_PIECE.md).
import * as THREE from 'three'
import { registerModule, registerPart } from '@/core/registry'
import { int, num, pos } from '@/core/paramSchema'
import type { Provided } from '@/core/types'
import { extrude, lathe, mk, roundPoly, shapeFromPts } from '@/parts/primitives/geo'

/** Ce que le fuselage « offre » aux pièces qui le suivent. */
interface Fuselage extends Provided {
  length: number
  radius: number
  /** rayon du fuselage à l'abscisse x (le nez est en +x) */
  radiusAt: (x: number) => number
}

// 1) Une pièce = un schéma de paramètres + une fonction qui construit la géométrie.
registerPart({
  type: 'avion.fuselage',
  label: 'Fuselage',
  category: 'cellule',
  icon: '🛩️',
  module: 'avion',
  schema: [
    pos('length', 'Longueur', 10, [2, 40], { group: 'Dimensions', level: 'easy', unit: 'm' }),
    pos('radius', 'Rayon', 0.7, [0.2, 3], { group: 'Dimensions', level: 'easy', unit: 'm' }),
    num('nose', 'Pointe du nez', 0.6, [0.05, 1], { group: 'Forme', step: 0.01, level: 'easy' }),
    num('tail', 'Finesse de la queue', 0.25, [0.02, 1], { group: 'Forme', step: 0.01 }),
  ],
  // 2) `provide` : données exposées aux pièces enfants (ici, le rayon en tout point).
  provide: (p): Fuselage => {
    const L = p.length as number
    const R = p.radius as number
    const nose = p.nose as number
    const tail = p.tail as number
    const radiusAt = (x: number): number => {
      const t = (x + L / 2) / L // 0 = queue, 1 = nez
      if (t > 0.75) return R * Math.sqrt(Math.max(0, 1 - ((t - 0.75) / 0.25) ** 2 * (1 - nose * 0.2)))
      if (t < 0.7) return R * (tail + (1 - tail) * Math.min(1, t / 0.7))
      return R
    }
    return { key: JSON.stringify(p), length: L, radius: R, radiusAt }
  },
  build: (p) => {
    const L = p.length as number
    const R = p.radius as number
    const pts: [number, number][] = []
    for (let i = 0; i <= 30; i++) {
      const x = -L / 2 + (L * i) / 30
      const t = i / 30
      const r = t > 0.75 ? R * Math.sqrt(Math.max(0, 1 - ((t - 0.75) / 0.25) ** 2)) : t < 0.7 ? R * ((p.tail as number) + (1 - (p.tail as number)) * (t / 0.7)) : R
      pts.push([Math.max(r, 0.001), x])
    }
    const g = lathe(pts, 32)
    g.rotateZ(-Math.PI / 2) // l'axe du fuselage devient X
    return mk(g, 'body')
  },
})

// 3) Une pièce qui SUIT une autre : `followsParent` + `fit`.
registerPart({
  type: 'avion.wing',
  label: 'Aile',
  category: 'cellule',
  icon: '✈️',
  module: 'avion',
  followsParent: ['avion.fuselage'],
  schema: [
    pos('span', 'Envergure (une aile)', 5, [1, 20], { group: 'Dimensions', level: 'easy', unit: 'm' }),
    pos('chord', 'Largeur de l’aile', 1.6, [0.3, 6], { group: 'Dimensions', level: 'easy', unit: 'm' }),
    num('sweep', 'Flèche', 15, [-20, 60], { group: 'Forme', step: 1, unit: '°', level: 'easy' }),
    num('dihedral', 'Dièdre', 3, [-15, 20], { group: 'Forme', step: 1, unit: '°' }),
    num('along', 'Position sur le fuselage', 0.1, [-0.4, 0.4], { group: 'Position', step: 0.005, level: 'easy' }),
    int('engines', 'Moteurs sur l’aile', 0, [0, 3], { group: 'Détails' }),
  ],
  fit: (parent, own) => {
    const f = parent as Fuselage | undefined
    if (!f?.radiusAt) return {}
    const x = (own.along as number) * f.length
    // l'aile s'accroche sur le flanc du fuselage, quelle que soit sa forme
    return { pos: [x, 0, f.radiusAt(x) * 0.9] }
  },
  build: (p) => {
    const span = p.span as number
    const c = p.chord as number
    const sweep = Math.tan(((p.sweep as number) * Math.PI) / 180) * span
    const shape = shapeFromPts(roundPoly([[0, 0], [-sweep - c * 0.4, span], [-sweep - c * 0.8, span], [-c, 0]], 0.1, 1))
    const g = extrude(shape, 0.08)
    g.rotateX(Math.PI / 2) // l'aile est couchée : x = avant/arrière, z = vers l'extérieur
    const m = mk(g, 'body')
    m.rotation.x = (p.dihedral as number) * (Math.PI / 180)
    const root = new THREE.Group()
    root.add(m)
    return root
  },
})

// 4) Le module : catégories du catalogue, modèles de départ, « Surprise ».
registerModule({
  id: 'avion',
  label: 'Avion',
  icon: '✈️',
  rootType: 'avion.fuselage',
  defaultView: 'three-quarter',
  categories: [{ id: 'cellule', label: 'Cellule', icon: '✈️' }],
  presets: [
    {
      id: 'petit',
      label: 'Petit avion',
      icon: '🛩️',
      nodes: [
        { key: 'f', type: 'avion.fuselage' },
        { key: 'w', type: 'avion.wing', parent: 'f', follow: true, mirror: 'z' },
      ],
    },
  ],
  surprise: () => ({ id: 's', label: 'Avion', icon: '🛩️', nodes: [{ key: 'f', type: 'avion.fuselage' }, { key: 'w', type: 'avion.wing', parent: 'f', follow: true, mirror: 'z' }] }),
})
