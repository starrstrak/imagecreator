// Pont entre la scène R3F (rendu à l'écran) et le module d'export (rendu hors écran).
import type * as THREE from 'three'

export interface RenderApi {
  gl: THREE.WebGLRenderer
  scene: THREE.Scene
}
export const renderApi: { current: RenderApi | null } = { current: null }

/** Fonctions qui recalent la taille des étiquettes de cotes pour une caméra et une hauteur de rendu données. */
export const labelHooks = new Set<(camera: THREE.Camera, textPx: number, heightPx: number) => void>()

/** Points supplémentaires à inclure dans le cadrage (lignes de cote). */
export const extraPoints: { current: THREE.Vector3[] } = { current: [] }
