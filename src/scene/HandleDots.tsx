// Poignées 3D : glisser une pastille étire / déplace directement un paramètre de la pièce.
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useScene } from '@/store/sceneStore'
import { getPart } from '@/core/registry'
import type { Handle } from '@/core/types'

const _v = new THREE.Vector3()

/** Paramètre t du point de la droite (p, d) le plus proche du rayon. */
function closestOnAxis(ray: THREE.Ray, p: THREE.Vector3, d: THREE.Vector3): number | null {
  const w0 = ray.origin.clone().sub(p)
  const a = ray.direction.dot(ray.direction)
  const b = ray.direction.dot(d)
  const c = d.dot(d)
  const dd = ray.direction.dot(w0)
  const e = d.dot(w0)
  const den = a * c - b * b
  if (Math.abs(den) < 1e-6) return null
  return (a * e - b * dd) / den
}

function Dot({ nodeId, h }: { nodeId: string; h: Handle }) {
  const ref = useRef<THREE.Mesh>(null)
  const drag = useRef<{ t0: number; v0: number; len: number; origin: THREE.Vector3; dir: THREE.Vector3 } | null>(null)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null

  // Taille constante à l'écran, quelle que soit la distance et l'échelle de la pièce
  useFrame(() => {
    const m = ref.current
    if (!m || !m.parent) return
    m.getWorldPosition(_v)
    const ortho = (camera as THREE.OrthographicCamera).isOrthographicCamera
    const px = ortho ? 10 / (camera as THREE.OrthographicCamera).zoom : _v.distanceTo(camera.position) * 0.02
    const ws = m.parent.getWorldScale(new THREE.Vector3())
    m.scale.set(px / (ws.x || 1), px / (ws.y || 1), px / (ws.z || 1))
  })

  const axisWorld = (): { origin: THREE.Vector3; dir: THREE.Vector3; len: number } | null => {
    const m = ref.current
    if (!m?.parent) return null
    const origin = m.getWorldPosition(new THREE.Vector3())
    const raw = new THREE.Vector3(...h.axis).transformDirection(m.parent.matrixWorld)
    // longueur monde d'une unité locale le long de l'axe
    const len = new THREE.Vector3(...h.axis).applyMatrix4(m.parent.matrixWorld).sub(m.parent.getWorldPosition(new THREE.Vector3())).length()
    return { origin, dir: raw.normalize(), len: len || 1 }
  }

  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const ax = axisWorld()
    if (!ax) return
    const t0 = closestOnAxis(e.ray, ax.origin, ax.dir)
    if (t0 === null) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (controls) controls.enabled = false
    const n = useScene.getState().scene.nodes[nodeId]
    drag.current = { t0, v0: (n.params[h.param] as number) ?? 0, len: ax.len, origin: ax.origin.clone(), dir: ax.dir.clone() }
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    const dr = drag.current
    if (!dr) return
    e.stopPropagation()
    // Repère fixé au début du glisser : insensible au déplacement de la poignée elle-même
    const t = closestOnAxis(e.ray, dr.origin, dr.dir)
    if (t === null) return
    const n = useScene.getState().scene.nodes[nodeId]
    const schema = getPart(n.type)?.schema.find((s) => s.key === h.param)
    let v = dr.v0 + ((t - dr.t0) / dr.len) * h.ratio
    if (schema && schema.kind === 'number') v = Math.min(schema.max, Math.max(schema.min === 0 ? 0.001 : schema.min, v))
    useScene.getState().setParam(nodeId, h.param, Math.round(v * 1000) / 1000)
    invalidate()
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    drag.current = null
    if (controls) controls.enabled = true
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  return (
    <mesh ref={ref} position={h.position} renderOrder={999} onPointerDown={down} onPointerMove={move} onPointerUp={up}>
      <sphereGeometry args={[0.5, 16, 12]} />
      <meshBasicMaterial color="#2f7df6" depthTest={false} transparent opacity={0.95} />
    </mesh>
  )
}

export function HandleDots({ nodeId, handles }: { nodeId: string; handles: Handle[] }) {
  return (
    <>
      {handles.map((h) => (
        <Dot key={h.id} nodeId={nodeId} h={h} />
      ))}
    </>
  )
}
