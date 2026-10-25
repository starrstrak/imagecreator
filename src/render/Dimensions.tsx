// Cotes et annotations en mode plan CAD : lignes de cote avec repères, valeurs en texte
// (toile 2D hors ligne), taille constante à l'écran.
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { getPart } from '@/core/registry'
import { resolveNode } from '@/core/resolve'
import { objectRegistry } from '@/scene/objects'
import { textTexture } from '@/parts/common'
import { dimMat } from './outline'
import { extraPoints, labelHooks } from '@/export/bridge'

interface WorldDim {
  a: THREE.Vector3
  b: THREE.Vector3
  a2: THREE.Vector3
  b2: THREE.Vector3
  label: string
}

const TEXT_PX = 17 // hauteur du texte à l'écran, en pixels CSS

function Label({ text, at }: { text: string; at: THREE.Vector3 }) {
  const ref = useRef<THREE.Sprite>(null)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const { tex, aspect } = useMemo(() => textTexture(text, 48, 10, false), [text])
  useEffect(() => () => tex.dispose(), [tex])
  /** Taille constante à l'écran : textPx / hauteur de rendu de la hauteur visible dans la scène */
  const fit = (cam: THREE.Camera, textPx: number, heightPx: number) => {
    const sp = ref.current
    if (!sp) return
    const ortho = (cam as THREE.OrthographicCamera).isOrthographicCamera
    const oc = cam as THREE.OrthographicCamera
    const visibleH = ortho ? (oc.top - oc.bottom) / (oc.zoom || 1) : 2 * at.distanceTo(cam.position) * Math.tan(((cam as THREE.PerspectiveCamera).fov * Math.PI) / 360)
    const h = (textPx * visibleH) / heightPx
    sp.scale.set(h * aspect, h, 1)
  }
  useEffect(() => {
    labelHooks.add(fit)
    return () => {
      labelHooks.delete(fit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, at])
  useFrame(() => fit(camera, TEXT_PX, size.height))
  return (
    <sprite ref={ref} position={at} renderOrder={60}>
      <spriteMaterial map={tex} depthTest={false} transparent />
    </sprite>
  )
}

export function Dimensions() {
  const show = useUi((s) => s.showDims)
  const rev = useScene((s) => s.rev)
  const selectedId = useScene((s) => s.selectedId)
  const planMode = useUi((s) => s.planMode)
  const [dims, setDims] = useState<WorldDim[]>([])

  useEffect(() => {
    if (!show) {
      setDims([])
      extraPoints.current = []
      return
    }
    const t = setTimeout(() => {
      const st = useScene.getState().scene
      const out: WorldDim[] = []
      for (const id of st.order) {
        const res = resolveNode(st.nodes, id)
        const def = res && getPart(res.node.type)
        const obj = objectRegistry.get(id)
        if (!res || !def?.dims || !obj || res.node.hidden) continue
        if (def.dimsSelectedOnly && id !== selectedId) continue
        if (planMode && def.planHide) continue
        obj.updateWorldMatrix(true, false)
        const m = obj.matrixWorld
        for (const d of def.dims(res.params)) {
          // en plan (vue du dessus) les cotes verticales n'ont pas de sens
          if (planMode && Math.abs(d.b[1] - d.a[1]) > 0.5 * Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1], d.b[2] - d.a[2])) continue
          const a = new THREE.Vector3(...d.a).applyMatrix4(m)
          const b = new THREE.Vector3(...d.b).applyMatrix4(m)
          const dir = new THREE.Vector3(...d.dir).transformDirection(m).multiplyScalar(d.offset)
          out.push({ a, b, a2: a.clone().add(dir), b2: b.clone().add(dir), label: d.label })
        }
      }
      setDims(out)
      extraPoints.current = out.flatMap((d) => [d.a, d.b, d.a2, d.b2])
    }, 60)
    return () => clearTimeout(t)
  }, [show, rev, selectedId, planMode])

  const geo = useMemo(() => {
    if (!dims.length) return null
    const pts: number[] = []
    const push = (p: THREE.Vector3, q: THREE.Vector3) => pts.push(p.x, p.y, p.z, q.x, q.y, q.z)
    for (const d of dims) {
      const dirv = d.b2.clone().sub(d.a2)
      const len = dirv.length() || 1
      dirv.divideScalar(len)
      const ext = d.a2.clone().sub(d.a).normalize().multiplyScalar(0.12)
      push(d.a, d.a2.clone().add(ext)) // ligne d'attache
      push(d.b, d.b2.clone().add(ext))
      push(d.a2, d.b2) // ligne de cote
      // repères obliques aux extrémités
      const tick = dirv.clone().add(ext.clone().normalize()).normalize().multiplyScalar(0.18)
      for (const e of [d.a2, d.b2]) push(e.clone().sub(tick), e.clone().add(tick))
    }
    const g = new LineSegmentsGeometry()
    g.setPositions(pts)
    return g
  }, [dims])
  useEffect(() => () => geo?.dispose(), [geo])
  const line = useMemo(() => {
    if (!geo) return null
    const l = new LineSegments2(geo, dimMat)
    l.raycast = () => {}
    l.renderOrder = 40
    return l
  }, [geo])

  if (!show || !line) return null
  return (
    <group>
      <primitive object={line} />
      {dims.map((d, i) => (
        <Label key={i} text={d.label} at={d.a2.clone().lerp(d.b2, 0.5)} />
      ))}
    </group>
  )
}
