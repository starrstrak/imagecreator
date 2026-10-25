// Caméra perspective / orthographique, vues prédéfinies (face, côté, dessus, 3/4) et cadrage automatique.
import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { useUi, type ViewPreset } from '@/store/uiStore'
import { useScene } from '@/store/sceneStore'
import { sceneBounds } from './objects'

/** Direction de la caméra (depuis le centre) pour chaque vue. Avant du véhicule = +X. */
export const VIEW_DIRS: Record<ViewPreset, THREE.Vector3> = {
  front: new THREE.Vector3(1, 0.04, 0),
  side: new THREE.Vector3(0, 0.04, 1),
  top: new THREE.Vector3(0, 1, 0.0005),
  'three-quarter': new THREE.Vector3(0.75, 0.42, 0.85),
}

export function frameCamera(
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  preset: ViewPreset,
  size: { width: number; height: number },
  margin = 1.15,
): void {
  const box = sceneBounds()
  if (box.isEmpty()) box.set(new THREE.Vector3(-2, 0, -1), new THREE.Vector3(2, 1.5, 1))
  const center = box.getCenter(new THREE.Vector3())
  const radius = Math.max(0.5, box.getSize(new THREE.Vector3()).length() / 2)
  const dir = VIEW_DIRS[preset].clone().normalize()
  const persp = camera as THREE.PerspectiveCamera
  const ortho = camera as THREE.OrthographicCamera
  if (persp.isPerspectiveCamera) {
    // demi-angle de champ limitant (vertical ou horizontal selon le format de la fenêtre)
    const tanV = Math.tan((persp.fov * Math.PI) / 360)
    const tanH = tanV * (size.width / Math.max(1, size.height))
    const half = Math.atan(Math.min(tanV, tanH))
    const dist = (radius / Math.sin(half)) * margin * 0.62
    camera.position.copy(center).addScaledVector(dir, dist)
  } else {
    camera.position.copy(center).addScaledVector(dir, radius * 4)
    ortho.zoom = (Math.min(size.width, size.height) / (2 * radius * margin)) * 1.05
    ortho.near = -radius * 20
    ortho.far = radius * 20
    ortho.updateProjectionMatrix()
  }
  controls?.target.copy(center)
  camera.lookAt(center)
  controls?.update()
}

export function CameraRig() {
  const projection = useUi((s) => s.projection)
  const viewRequest = useUi((s) => s.viewRequest)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const moduleId = useScene((s) => s.scene.module)

  // Cadrage à chaque demande de vue, changement de projection ou de création
  useEffect(() => {
    const t = setTimeout(() => frameCamera(camera, controls, viewRequest.preset, size), 30)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRequest.id, projection, controls, camera, moduleId])

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
