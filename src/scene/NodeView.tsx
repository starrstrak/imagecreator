// Rend un nœud de la scène : géométrie paramétrique, symétrie, répétitions, enfants.
import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { getPart } from '@/core/registry'
import { resolveNode } from '@/core/resolve'
import { hashOf } from '@/utils/hash'
import { deg } from '@/utils/math'
import { addOutlines, applyFill, applyHidden, disposeObject } from '@/render/outline'
import { objectRegistry } from './objects'
import { HandleDots } from './HandleDots'

const noRaycast = () => {}

/** Clone partageant géométries et matériaux, en conservant les contours non cliquables. */
function cloneInstance(src: THREE.Object3D): THREE.Object3D {
  const c = src.clone(true)
  c.traverse((o) => {
    if (o.userData.outline) o.raycast = noRaycast
  })
  return c
}

interface Props {
  id: string
  /** Copie miroir : ne s'enregistre pas (gizmo) */
  ghost?: boolean
}

function NodeViewImpl({ id, ghost = false }: Props) {
  const nodes = useScene((s) => s.scene.nodes)
  const order = useScene((s) => s.scene.order)
  const selected = useScene((s) => s.selectedId === id)
  const select = useScene((s) => s.select)
  const renderMode = useUi((s) => s.renderMode)
  const hiddenLines = useUi((s) => s.hiddenLines)
  const showHandles = useUi((s) => s.showHandles)
  const playing = useUi((s) => s.playing)

  const res = resolveNode(nodes, id)
  const def = res ? getPart(res.node.type) : undefined
  const paramsKey = res ? hashOf(res.params) : ''

  // Construction de la géométrie : uniquement quand les paramètres effectifs changent
  const built = useMemo(() => {
    if (!res || !def) return null
    try {
      const obj = def.build(res.params, { parent: res.parentProvided })
      addOutlines(obj)
      return obj
    } catch (err) {
      console.error('Erreur de construction', def.type, err)
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, paramsKey])

  useEffect(
    () => () => {
      if (built) disposeObject(built)
    },
    [built],
  )

  const count = res ? Math.max(1, Math.min(500, res.node.repeatCount)) : 1
  const instances = useMemo(() => {
    if (!built) return []
    return Array.from({ length: count }, (_, i) => (i === 0 ? built : cloneInstance(built)))
  }, [built, count])

  // Mode de rendu, lignes cachées, pose d'animation
  useEffect(() => {
    for (const inst of instances) {
      applyFill(inst, renderMode)
      applyHidden(inst, hiddenLines)
    }
  }, [instances, renderMode, hiddenLines])

  const animParam = def?.animate?.param
  const animValue = res && animParam ? (res.params[animParam] as number) : 0
  useEffect(() => {
    if (playing && animParam) return
    const pose = built?.userData.pose as ((r: THREE.Object3D, t: number) => void) | undefined
    if (pose) for (const inst of instances) pose(inst, animValue)
  }, [instances, built, animValue, playing, animParam])
  useFrame(({ clock }) => {
    if (!playing || !animParam) return
    const pose = built?.userData.pose as ((r: THREE.Object3D, t: number) => void) | undefined
    if (!pose) return
    const t = 0.5 - 0.5 * Math.cos(clock.elapsedTime * 1.6)
    for (const inst of instances) pose(inst, t)
  })

  const groupRef = useRef<THREE.Group>(null)
  useEffect(() => {
    const g = groupRef.current
    if (!g || ghost) return
    objectRegistry.set(id, g)
    return () => {
      if (objectRegistry.get(id) === g) objectRegistry.delete(id)
    }
  }, [id, ghost, !!built])

  if (!res || !def) return null
  const n = res.node
  const kids = order.filter((k) => nodes[k]?.parentId === id)
  const s: [number, number, number] = [n.scale[0], n.scale[1], n.scale[2]]

  const content = (
    <group
      ref={ghost ? undefined : groupRef}
      position={res.pos}
      rotation={[deg(res.rot[0]), deg(res.rot[1]), deg(res.rot[2])]}
      scale={s}
      visible={!n.hidden}
      onClick={(e) => {
        if (e.delta > 4) return
        e.stopPropagation()
        select(id)
      }}
    >
      {instances.map((inst, i) => (
        <group
          key={i}
          position={[n.repeatStep[0] * i, n.repeatStep[1] * i, n.repeatStep[2] * i]}
          rotation={[deg(n.repeatRot[0] * i), deg(n.repeatRot[1] * i), deg(n.repeatRot[2] * i)]}
        >
          <primitive object={inst} />
        </group>
      ))}
      {kids.map((k) => (
        <NodeView key={k} id={k} ghost={ghost} />
      ))}
      {selected && !ghost && showHandles && !n.locked && def.handles && <HandleDots nodeId={id} handles={def.handles(res.params)} />}
    </group>
  )

  if (n.mirror === 'none' || ghost) return content
  const mv: [number, number, number] = [n.mirror === 'x' ? -1 : 1, n.mirror === 'y' ? -1 : 1, n.mirror === 'z' ? -1 : 1]
  return (
    <>
      {content}
      <group scale={mv} visible={!n.hidden}>
        <NodeGhost id={id} />
      </group>
    </>
  )
}

/** Copie miroir : même rendu, sans gizmo ni poignées, enfants inclus. */
function NodeGhost({ id }: { id: string }) {
  return <NodeViewImpl id={id} ghost />
}

export const NodeView = memo(NodeViewImpl)
