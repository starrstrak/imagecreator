// Formes de base communes à tous les modules : sert aussi de base aux futurs modules.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues } from '@/core/types'
import { cylinder, extrude, mk, polyShape, roundedBox, torus } from './geo'


registerPart({
  type: 'commun.box',
  label: 'Boîte',
  category: 'formes',
  icon: '🟦',
  module: 'commun',
  schema: [
    pos('w', 'Largeur', 1, [0.05, 5], { level: 'easy', tip: 'Taille de gauche à droite.', unit: 'm' }),
    pos('h', 'Hauteur', 1, [0.05, 5], { level: 'easy', tip: 'Taille de bas en haut.', unit: 'm' }),
    pos('d', 'Profondeur', 1, [0.05, 5], { level: 'easy', tip: 'Taille d’avant en arrière.', unit: 'm' }),
    pos('round', 'Arrondi des arêtes', 0, [0, 0.5], { group: 'Forme', unit: 'm', tip: 'Adoucit les coins.' }),
  ],
  build: (p) => mk(roundedBox(p.d as number, p.h as number, p.w as number, p.round as number)),
  handles: (p): Handle[] => [
    { id: 'w', label: 'Largeur', position: [0, 0, (p.w as number) / 2], axis: [0, 0, 1], param: 'w', ratio: 2 },
    { id: 'h', label: 'Hauteur', position: [0, (p.h as number) / 2, 0], axis: [0, 1, 0], param: 'h', ratio: 2 },
    { id: 'd', label: 'Profondeur', position: [(p.d as number) / 2, 0, 0], axis: [1, 0, 0], param: 'd', ratio: 2 },
  ],
})

registerPart({
  type: 'commun.cylinder',
  label: 'Cylindre / cône',
  category: 'formes',
  icon: '🥫',
  module: 'commun',
  schema: [
    pos('rTop', 'Rayon du haut', 0.5, [0, 3], { level: 'easy', unit: 'm', tip: '0 = pointe de cône.' }),
    pos('rBottom', 'Rayon du bas', 0.5, [0, 3], { level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 1, [0.05, 5], { level: 'easy', unit: 'm' }),
    int('seg', 'Nombre de côtés', 32, [3, 64], { group: 'Forme', tip: '3 = prisme triangulaire, 6 = hexagone…' }),
  ],
  build: (p) => mk(cylinder(p.rTop as number, p.rBottom as number, p.h as number, p.seg as number)),
  handles: (p): Handle[] => [
    { id: 'h', label: 'Hauteur', position: [0, (p.h as number) / 2, 0], axis: [0, 1, 0], param: 'h', ratio: 2 },
    { id: 'r', label: 'Rayon', position: [p.rBottom as number, -(p.h as number) / 2, 0], axis: [1, 0, 0], param: 'rBottom', ratio: 1 },
  ],
})

registerPart({
  type: 'commun.sphere',
  label: 'Sphère',
  category: 'formes',
  icon: '⚽',
  module: 'commun',
  schema: [
    pos('r', 'Rayon', 0.5, [0.02, 3], { level: 'easy', unit: 'm' }),
    num('squash', 'Aplatissement', 1, [0.2, 2], { group: 'Forme', min: 0.01, max: 100, tip: '< 1 : aplatie ; > 1 : allongée en hauteur.' }),
    int('seg', 'Finesse', 32, [8, 64], { group: 'Forme' }),
  ],
  build: (p) => {
    const g = new THREE.SphereGeometry(p.r as number, p.seg as number, Math.max(6, Math.round((p.seg as number) / 2)))
    g.scale(1, p.squash as number, 1)
    return mk(g, 'body', { edgeAngle: 60 })
  },
})

registerPart({
  type: 'commun.prism',
  label: 'Prisme (toit, rampe)',
  category: 'formes',
  icon: '🔺',
  module: 'commun',
  schema: [
    choice('shape', 'Forme', 'triangle', [['triangle', 'Triangle', '🔺'], ['trapeze', 'Trapèze', '🔶'], ['rampe', 'Rampe', '📐']], { group: 'Forme' }),
    pos('w', 'Largeur', 1, [0.05, 5], { level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.6, [0.05, 5], { level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 1, [0.05, 5], { level: 'easy', unit: 'm' }),
    pos('top', 'Largeur du haut', 0.3, [0, 1], { group: 'Forme', showIf: (p) => p.shape === 'trapeze', tip: 'Part de la largeur (0 à 1).' }),
  ],
  build: (p) => {
    const w = p.w as number
    const h = p.h as number
    let pts: [number, number][]
    if (p.shape === 'triangle') pts = [[-w / 2, 0], [w / 2, 0], [0, h]]
    else if (p.shape === 'trapeze') pts = [[-w / 2, 0], [w / 2, 0], [(w * (p.top as number)) / 2, h], [-(w * (p.top as number)) / 2, h]]
    else pts = [[-w / 2, 0], [w / 2, 0], [-w / 2, h]]
    // La forme est dessinée en XY ; on veut largeur sur Z, profondeur sur X
    const g = extrude(polyShape(pts), p.d as number)
    g.rotateY(Math.PI / 2)
    g.translate(0, -h / 2, 0)
    return mk(g)
  },
})

registerPart({
  type: 'commun.torus',
  label: 'Anneau',
  category: 'formes',
  icon: '🍩',
  module: 'commun',
  schema: [
    pos('R', 'Grand rayon', 0.5, [0.05, 3], { level: 'easy', unit: 'm' }),
    pos('r', 'Épaisseur du tube', 0.12, [0.01, 1], { level: 'easy', unit: 'm' }),
    int('seg', 'Finesse', 40, [8, 80], { group: 'Forme' }),
  ],
  build: (p: ParamValues) => {
    const g = torus(p.R as number, p.r as number, p.seg as number)
    g.rotateX(Math.PI / 2)
    return mk(g, 'dark', { edgeAngle: 60 })
  },
})
