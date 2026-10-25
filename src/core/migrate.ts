// Versionnage du format JSON de projet : chaque évolution ajoute une étape de migration.
import type { SceneState } from './types'

export const SCENE_VERSION = 1

/** Valide et migre un projet chargé depuis un fichier ou la sauvegarde automatique. */
export function migrateScene(raw: SceneState): SceneState {
  if (!raw || typeof raw !== 'object' || !raw.nodes || !Array.isArray(raw.order)) throw new Error('Fichier de projet invalide')
  const s = structuredClone(raw) as SceneState
  // v0 → v1 : rien à faire pour l'instant (exemple d'étape future : if (s.version < 2) {...})
  s.version = SCENE_VERSION
  // Nettoie les références orphelines
  s.order = s.order.filter((id) => s.nodes[id])
  for (const n of Object.values(s.nodes)) if (n.parentId && !s.nodes[n.parentId]) n.parentId = null
  return s
}
