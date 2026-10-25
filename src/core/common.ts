// Paramètres communs à TOUTES les pièces : position, rotation, échelle non uniforme,
// symétrie, répétitions. Exposés dans l'inspecteur avec le même mécanisme de schéma.
import type { MirrorMode, NumberParam, ParamSchema, SceneNode, Vec3 } from './types'
import { bool, choice, int, num } from './paramSchema'

const G_MOVE = 'Position'
const G_ROT = 'Rotation'
const G_SCALE = 'Échelle'
const G_SYM = 'Symétrie et répétitions'

export const commonSchema: ParamSchema[] = [
  num('posX', 'Avant / arrière (X)', 0, [-6, 6], { group: G_MOVE, level: 'easy', tip: 'Déplace la pièce vers l’avant ou l’arrière.', unit: 'm' }),
  num('posY', 'Hauteur (Y)', 0, [-3, 6], { group: G_MOVE, level: 'easy', tip: 'Monte ou descend la pièce.', unit: 'm' }),
  num('posZ', 'Gauche / droite (Z)', 0, [-4, 4], { group: G_MOVE, level: 'easy', tip: 'Déplace la pièce sur le côté.', unit: 'm' }),
  num('rotX', 'Rotation X', 0, [-180, 180], { group: G_ROT, step: 1, unit: '°', tip: 'Fait basculer la pièce d’un côté.' }),
  num('rotY', 'Rotation Y', 0, [-180, 180], { group: G_ROT, level: 'easy', step: 1, unit: '°', tip: 'Fait tourner la pièce à plat.' }),
  num('rotZ', 'Rotation Z', 0, [-180, 180], { group: G_ROT, step: 1, unit: '°', tip: 'Incline la pièce vers l’avant ou l’arrière.' }),
  bool('uniform', 'Échelle uniforme', true, { group: G_SCALE, tip: 'Agrandit la pièce de la même façon dans tous les sens.' }),
  num('scaleX', 'Échelle X', 1, [0.1, 4], { group: G_SCALE, level: 'easy', min: 0.001, max: 1000, tip: 'Étire en longueur.' }),
  num('scaleY', 'Échelle Y', 1, [0.1, 4], { group: G_SCALE, min: 0.001, max: 1000, tip: 'Étire en hauteur.' }),
  num('scaleZ', 'Échelle Z', 1, [0.1, 4], { group: G_SCALE, min: 0.001, max: 1000, tip: 'Étire en largeur.' }),
  choice(
    'mirror',
    'Symétrie',
    'none',
    [
      ['none', 'Aucune', '⛔'],
      ['z', 'Gauche ↔ droite', '↔️'],
      ['x', 'Avant ↔ arrière', '↕️'],
      ['y', 'Haut ↔ bas', '🔃'],
    ],
    { group: G_SYM, level: 'easy', tip: 'Crée automatiquement une copie en miroir.' },
  ),
  int('repeatCount', 'Nombre de répétitions', 1, [1, 12], { group: G_SYM, tip: 'Répète la pièce plusieurs fois.', max: 500 }),
  num('repStepX', 'Pas de répétition X', 1, [-5, 5], { group: G_SYM, showIf: (p) => (p.repeatCount as number) > 1, unit: 'm' }),
  num('repStepY', 'Pas de répétition Y', 0, [-5, 5], { group: G_SYM, showIf: (p) => (p.repeatCount as number) > 1, unit: 'm' }),
  num('repStepZ', 'Pas de répétition Z', 0, [-5, 5], { group: G_SYM, showIf: (p) => (p.repeatCount as number) > 1, unit: 'm' }),
  num('repRotY', 'Rotation par copie (Y)', 0, [-180, 180], { group: G_SYM, step: 1, unit: '°', showIf: (p) => (p.repeatCount as number) > 1 }),
]

/** Lit une valeur commune depuis un nœud. */
export function getCommon(n: SceneNode, key: string): number | boolean | string {
  switch (key) {
    case 'posX': return n.pos[0]
    case 'posY': return n.pos[1]
    case 'posZ': return n.pos[2]
    case 'rotX': return n.rot[0]
    case 'rotY': return n.rot[1]
    case 'rotZ': return n.rot[2]
    case 'uniform': return n.uniformScale
    case 'scaleX': return n.scale[0]
    case 'scaleY': return n.scale[1]
    case 'scaleZ': return n.scale[2]
    case 'mirror': return n.mirror
    case 'repeatCount': return n.repeatCount
    case 'repStepX': return n.repeatStep[0]
    case 'repStepY': return n.repeatStep[1]
    case 'repStepZ': return n.repeatStep[2]
    case 'repRotY': return n.repeatRot[1]
  }
  return 0
}

/** Écrit une valeur commune dans un nœud (mutation sur brouillon immer). */
export function setCommon(n: SceneNode, key: string, v: number | boolean | string): void {
  const num = v as number
  switch (key) {
    case 'posX': n.pos[0] = num; break
    case 'posY': n.pos[1] = num; break
    case 'posZ': n.pos[2] = num; break
    case 'rotX': n.rot[0] = num; break
    case 'rotY': n.rot[1] = num; break
    case 'rotZ': n.rot[2] = num; break
    case 'uniform': n.uniformScale = v as boolean; break
    case 'scaleX':
    case 'scaleY':
    case 'scaleZ': {
      const i = key === 'scaleX' ? 0 : key === 'scaleY' ? 1 : 2
      if (n.uniformScale) {
        const f = num / (n.scale[i] || 1)
        n.scale = [n.scale[0] * f, n.scale[1] * f, n.scale[2] * f]
      }
      n.scale[i] = num
      break
    }
    case 'mirror': n.mirror = v as MirrorMode; break
    case 'repeatCount': n.repeatCount = Math.max(1, Math.round(num)); break
    case 'repStepX': n.repeatStep[0] = num; break
    case 'repStepY': n.repeatStep[1] = num; break
    case 'repStepZ': n.repeatStep[2] = num; break
    case 'repRotY': n.repeatRot[1] = num; break
  }
}

export const COMMON_KEYS = new Set(commonSchema.map((s) => s.key))
export type { NumberParam, Vec3 }
