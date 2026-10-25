// Utilitaires communs aux pièces du véhicule.
import * as THREE from 'three'
import type { Body } from './body'

/** Test de type : l'objet fourni par le parent est-il une carrosserie ? */
export function asBody(parent: unknown): Body | undefined {
  const b = parent as Body | undefined
  return b && typeof b.sideZ === 'function' && Array.isArray(b.axleXs) ? b : undefined
}

/** Abscisse x de la fraction `t` (0 = avant du pare-brise, 1 = arrière de la lunette) le long de l'habitacle. */
export function cabinX(b: Body, t: number): number {
  return b.xWsBase + (b.xRearBase - b.xWsBase) * t
}

/** Repère d'un plan latéral à (x, y) côté +Z : retourne position, base (X avant, Y haut, Z extérieur). */
export function sidePlane(b: Body, x: number, y: number): { z: number; slope: number; euler: [number, number, number] } {
  const z = b.sideZ(x, y)
  const s = b.sideSlope(x, y)
  const Y = new THREE.Vector3(0, 1, s).normalize()
  const X = new THREE.Vector3(1, 0, 0)
  const Z = new THREE.Vector3().crossVectors(X, Y)
  const m = new THREE.Matrix4().makeBasis(X, Y, Z)
  const e = new THREE.Euler().setFromRotationMatrix(m, 'XYZ')
  const r = 180 / Math.PI
  return { z, slope: s, euler: [e.x * r, e.y * r, e.z * r] }
}
