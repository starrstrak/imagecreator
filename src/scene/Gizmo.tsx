// Gizmo de déplacement / rotation / échelle sur la pièce sélectionnée (souris et tactile).
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { resolveNode } from '@/core/resolve'
import { objectRegistry } from './objects'

const R2D = 180 / Math.PI

export function Gizmo() {
  const selectedId = useScene((s) => s.selectedId)
  const locked = useScene((s) => (s.selectedId ? s.scene.nodes[s.selectedId]?.locked : false))
  const rev = useScene((s) => s.rev)
  const mode = useUi((s) => s.gizmo)
  const [obj, setObj] = useState<THREE.Object3D | null>(null)

  useEffect(() => {
    setObj(selectedId ? (objectRegistry.get(selectedId) ?? null) : null)
  }, [selectedId, rev])

  if (!obj || !selectedId || mode === 'none' || locked) return null

  /** Réécrit la pose dans le store en retirant la part imposée par le « suivi du parent ». */
  const commit = () => {
    const st = useScene.getState()
    const node = st.scene.nodes[selectedId]
    const res = resolveNode(st.scene.nodes, selectedId)
    if (!node || !res) return
    const dp = [res.pos[0] - node.pos[0], res.pos[1] - node.pos[1], res.pos[2] - node.pos[2]]
    const dr = [res.rot[0] - node.rot[0], res.rot[1] - node.rot[1], res.rot[2] - node.rot[2]]
    const r = (v: number) => Math.round(v * 1000) / 1000
    st.setTransform(selectedId, {
      pos: [r(obj.position.x - dp[0]), r(obj.position.y - dp[1]), r(obj.position.z - dp[2])],
      rot: [r(obj.rotation.x * R2D - dr[0]), r(obj.rotation.y * R2D - dr[1]), r(obj.rotation.z * R2D - dr[2])],
      scale: [r(obj.scale.x), r(obj.scale.y), r(obj.scale.z)],
    })
  }

  return <TransformControls object={obj} mode={mode} size={0.9} onMouseUp={commit} />
}
