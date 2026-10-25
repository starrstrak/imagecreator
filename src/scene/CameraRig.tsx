// Caméra perspective / orthographique, vues prédéfinies (face, côté, dessus, 3/4) et cadrage automatique.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { VIEW_DIRS } from './views'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { useUi, type ViewPreset } from '@/store/uiStore'
import { useScene } from '@/store/sceneStore'
import { sceneBounds } from './objects'
import { fittedCamera } from '@/export/render'
export { VIEW_DIRS } from './views'

export interface CamPose {
  pos: THREE.Vector3
  target: THREE.Vector3
  zoom?: number
}

/** Pose de caméra (position, cible, zoom) qui cadre exactement la création dans la fenêtre. */
export function computePose(camera: THREE.Camera, preset: ViewPreset, size: { width: number; height: number }, margin = 1.12): CamPose {
  const box = sceneBounds()
  if (box.isEmpty()) box.set(new THREE.Vector3(-2, 0, -1), new THREE.Vector3(2, 1.5, 1))
  const center = box.getCenter(new THREE.Vector3())
  const persp = camera as THREE.PerspectiveCamera
  // Même calcul de cadrage que l'export : la création remplit exactement la fenêtre
  const fit = fittedCamera(preset, persp.isPerspectiveCamera ? 'persp' : 'ortho', size.width / Math.max(1, size.height), useUi.getState().showDims, margin)
  if (persp.isPerspectiveCamera) return { pos: fit.position.clone(), target: center }
  const f = fit as THREE.OrthographicCamera
  const r = box.getSize(new THREE.Vector3()).length()
  // recentre sur le milieu de l'emprise projetée
  const off = new THREE.Vector3((f.left + f.right) / 2, (f.top + f.bottom) / 2, 0).applyQuaternion(f.quaternion)
  const target = center.clone().add(off)
  return { pos: target.clone().addScaledVector(VIEW_DIRS[preset].clone().normalize(), r * 2), target, zoom: size.height / (f.top - f.bottom) }
}

/** Applique une pose immédiatement. */
export function applyPose(camera: THREE.Camera, controls: { target: THREE.Vector3; update: () => void } | null, pose: CamPose): void {
  camera.position.copy(pose.pos)
  controls?.target.copy(pose.target)
  const o = camera as THREE.OrthographicCamera
  if (pose.zoom !== undefined && o.isOrthographicCamera) {
    o.zoom = pose.zoom
    const r = 500
    o.near = -r
    o.far = r
    o.updateProjectionMatrix()
  }
  camera.lookAt(pose.target)
  controls?.update()
}

export function CameraRig() {
  const projection = useUi((s) => s.projection)
  const viewRequest = useUi((s) => s.viewRequest)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const moduleId = useScene((s) => s.scene.module)
  const anim = useRef<{ from: CamPose; to: CamPose; t: number } | null>(null)
  const last = useRef({ projection, moduleId, cam: camera })

  // Cadrage à chaque demande de vue, changement de projection ou de création (transition douce entre deux vues)
  useEffect(() => {
    const t = setTimeout(() => {
      const to = computePose(camera, viewRequest.preset, size)
      const smooth = last.current.projection === projection && last.current.moduleId === moduleId && last.current.cam === camera && controls
      last.current = { projection, moduleId, cam: camera }
      if (!smooth) {
        applyPose(camera, controls, to)
        invalidate()
        return
      }
      anim.current = { from: { pos: camera.position.clone(), target: controls!.target.clone(), zoom: (camera as THREE.OrthographicCamera).zoom }, to, t: 0 }
      invalidate()
    }, 30)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRequest.id, projection, controls, camera, moduleId])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / 0.5)
    const k = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2
    const pos = a.from.pos.clone().lerp(a.to.pos, k)
    const target = a.from.target.clone().lerp(a.to.target, k)
    const zoom = a.to.zoom !== undefined && a.from.zoom !== undefined ? a.from.zoom + (a.to.zoom - a.from.zoom) * k : undefined
    applyPose(camera, controls, { pos, target, zoom })
    if (a.t >= 1) anim.current = null
    invalidate()
  })

  return (
    <>
      {projection === 'persp' ? (
        <PerspectiveCamera makeDefault position={[6, 3.5, 6]} fov={35} near={0.05} far={500} />
      ) : (
        <OrthographicCamera makeDefault position={[6, 3.5, 6]} zoom={80} near={-200} far={200} />
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={0.3} maxDistance={300} maxPolarAngle={Math.PI} />
    </>
  )
}
