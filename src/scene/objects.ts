// Registre des objets 3D principaux par identifiant de nœud (gizmo, cadrage, export).
import * as THREE from 'three'

export const objectRegistry = new Map<string, THREE.Object3D>()
/** Racine de la scène (pour calculer les bornes et cadrer la caméra). */
export const sceneRoot: { current: THREE.Object3D | null } = { current: null }

/** Boîte englobante de la création (sans les objets utilitaires : grille, poignées). */
export function sceneBounds(): THREE.Box3 {
  const box = new THREE.Box3()
  const root = sceneRoot.current
  if (!root) return box
  root.updateWorldMatrix(true, true)
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.userData.fill && m.visible) {
      let visible = true
      let p: THREE.Object3D | null = m
      while (p) {
        if (!p.visible) visible = false
        p = p.parent
      }
      if (!visible) return
      m.geometry.computeBoundingBox()
      if (m.geometry.boundingBox) box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld))
    }
  })
  return box
}
