import * as THREE from 'three'
import type { ViewPreset } from '@/store/uiStore'

/** Direction de la caméra (depuis le centre) pour chaque vue. Avant du véhicule = +X. */
export const VIEW_DIRS: Record<ViewPreset, THREE.Vector3> = {
  front: new THREE.Vector3(1, 0.04, 0),
  side: new THREE.Vector3(0, 0.04, 1),
  top: new THREE.Vector3(0, 1, 0.0005),
  'three-quarter': new THREE.Vector3(0.75, 0.42, 0.85),
}

