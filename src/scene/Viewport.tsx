// Vue 3D principale : fond blanc, scène, caméra, gizmo, sélection, grille.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { updateLineMaterials } from '@/render/outline'
import { NodeView } from './NodeView'
import { CameraRig } from './CameraRig'
import { Gizmo } from './Gizmo'
import { objectRegistry, sceneRoot } from './objects'
import { Dimensions } from '@/render/Dimensions'

/** Met à jour l'épaisseur de trait et la résolution à chaque image. */
function LineUpdater() {
  const gl = useThree((s) => s.gl)
  const width = useUi((s) => s.lineWidth)
  useFrame(() => {
    const v = gl.getDrawingBufferSize(new THREE.Vector2())
    updateLineMaterials(width, v.x, v.y, gl.getPixelRatio())
  })
  return null
}

/** Cadre de sélection autour de la pièce active. */
function SelectionBox() {
  const selectedId = useScene((s) => s.selectedId)
  const box = useRef<THREE.Box3Helper>(null)
  const b = useRef(new THREE.Box3())
  useFrame(() => {
    const h = box.current
    const o = selectedId ? objectRegistry.get(selectedId) : undefined
    if (!h) return
    if (!o) {
      h.visible = false
      return
    }
    b.current.makeEmpty()
    o.updateWorldMatrix(true, true)
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.isMesh && m.userData.fill && m.geometry.boundingBox === null) m.geometry.computeBoundingBox()
      if (m.isMesh && m.userData.fill && m.geometry.boundingBox) b.current.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld))
    })
    h.visible = !b.current.isEmpty()
    if (h.visible) {
      h.box.copy(b.current)
    }
  })
  return <box3Helper ref={box} args={[new THREE.Box3(), new THREE.Color('#2f7df6')]} />
}

function Root() {
  const order = useScene((s) => s.scene.order)
  const nodes = useScene((s) => s.scene.nodes)
  const select = useScene((s) => s.select)
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    sceneRoot.current = ref.current
    return () => {
      sceneRoot.current = null
    }
  }, [])
  const roots = order.filter((id) => nodes[id] && nodes[id].parentId === null)
  return (
    <group ref={ref} onPointerMissed={() => select(null)}>
      {roots.map((id) => (
        <NodeView key={id} id={id} />
      ))}
    </group>
  )
}

function Lights() {
  const mode = useUi((s) => s.renderMode)
  if (mode === 'trait') return null
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 4]} intensity={1.4} />
      <directionalLight position={[-4, 3, -5]} intensity={0.5} />
    </>
  )
}

export function Viewport() {
  const showGrid = useUi((s) => s.showGrid)
  const select = useScene((s) => s.select)
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ touchAction: 'none', background: '#fff' }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={['#ffffff']} />
      <CameraRig />
      <LineUpdater />
      <Lights />
      {showGrid && <gridHelper args={[60, 60, '#c9d3e3', '#e4eaf3']} position={[0, -0.001, 0]} />}
      <Root />
      <SelectionBox />
      <Dimensions />
      <Gizmo />
    </Canvas>
  )
}
