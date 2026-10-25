// État global de la création : nœuds + historique illimité (patches immer) + sélection.
import { create } from 'zustand'
import { enablePatches, applyPatches, produceWithPatches, type Patch } from 'immer'
import { getModule, getPart } from '@/core/registry'
import { defaultsOf, normalizeParams } from '@/core/paramSchema'
import { COMMON_KEYS, setCommon as setCommonOn } from '@/core/common'
import type { ParamValue, Preset, PresetNode, SceneNode, SceneState, Vec3 } from '@/core/types'
import { migrateScene, SCENE_VERSION } from '@/core/migrate'

enablePatches()

interface HistoryEntry {
  patches: Patch[]
  inverse: Patch[]
  key?: string
  t: number
}

interface SceneStore {
  scene: SceneState
  selectedId: string | null
  past: HistoryEntry[]
  future: HistoryEntry[]
  /** Incrémenté à chaque changement : sert à déclencher l'autosave */
  rev: number

  select: (id: string | null) => void
  newScene: (moduleId: string, preset?: Preset) => void
  loadScene: (s: SceneState) => void
  applyPreset: (preset: Preset, replace?: boolean) => void
  addPart: (type: string, opts?: { parentId?: string | null; params?: Record<string, ParamValue>; follow?: boolean; pos?: Vec3 }) => string | null
  removeNode: (id: string) => void
  duplicateNode: (id: string) => string | null
  replaceType: (id: string, type: string) => void
  setParam: (id: string, key: string, v: ParamValue) => void
  setCommon: (id: string, key: string, v: ParamValue) => void
  setTransform: (id: string, t: { pos?: Vec3; rot?: Vec3; scale?: Vec3 }) => void
  setFlag: (id: string, flag: 'locked' | 'hidden' | 'follow', v: boolean) => void
  rename: (id: string, name: string) => void
  resetParams: (id: string) => void
  undo: () => void
  redo: () => void
}

let counter = 0
const newId = (): string => `n${Date.now().toString(36)}${(counter++).toString(36)}`

export function emptyScene(moduleId: string): SceneState {
  return { version: SCENE_VERSION, name: 'Ma création', module: moduleId, nodes: {}, order: [] }
}

/** Crée un nœud avec les valeurs par défaut de sa pièce. */
export function makeNode(type: string, over: Partial<SceneNode> = {}): SceneNode {
  const def = getPart(type)
  return {
    id: newId(),
    type,
    name: def?.label ?? type,
    params: def ? defaultsOf(def.schema) : {},
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    scale: [1, 1, 1],
    uniformScale: true,
    mirror: 'none',
    repeatCount: 1,
    repeatStep: [1, 0, 0],
    repeatRot: [0, 0, 0],
    parentId: null,
    follow: false,
    locked: false,
    hidden: false,
    ...over,
  }
}

/** Instancie les nœuds d'un modèle de départ. */
function instantiate(preset: PresetNode[]): SceneNode[] {
  const ids: Record<string, string> = {}
  const out: SceneNode[] = []
  for (const pn of preset) {
    const def = getPart(pn.type)
    if (!def) continue
    const node = makeNode(pn.type, {
      name: pn.name ?? def.label,
      params: normalizeParams(def.schema, { ...defaultsOf(def.schema), ...(pn.params ?? {}) }),
      pos: pn.pos ? [...pn.pos] : [0, 0, 0],
      rot: pn.rot ? [...pn.rot] : [0, 0, 0],
      scale: pn.scale ? [...pn.scale] : [1, 1, 1],
      mirror: pn.mirror ?? 'none',
      repeatCount: pn.repeatCount ?? 1,
      repeatStep: pn.repeatStep ? [...pn.repeatStep] : [1, 0, 0],
      follow: pn.follow ?? false,
      parentId: pn.parent ? (ids[pn.parent] ?? null) : null,
    })
    ids[pn.key] = node.id
    out.push(node)
  }
  return out
}

/** Identifiants d'un nœud et de tous ses descendants. */
function subtree(nodes: Record<string, SceneNode>, id: string): string[] {
  const out = [id]
  for (const n of Object.values(nodes)) if (n.parentId === id) out.push(...subtree(nodes, n.id))
  return out
}

export const useScene = create<SceneStore>((set, get) => {
  /** Applique une modification via immer et l'inscrit à l'historique (avec fusion par clé). */
  const apply = (recipe: (d: SceneState) => void, key?: string, keepSelection = true): void => {
    const [next, patches, inverse] = produceWithPatches(get().scene, recipe)
    if (patches.length === 0) return
    const now = Date.now()
    set((s) => {
      const past = s.past.slice()
      const last = past[past.length - 1]
      if (key && last && last.key === key && now - last.t < 900) {
        past[past.length - 1] = { patches: [...last.patches, ...patches], inverse: [...inverse, ...last.inverse], key, t: now }
      } else {
        past.push({ patches, inverse, key, t: now })
      }
      let selectedId = s.selectedId
      if (!keepSelection || (selectedId && !next.nodes[selectedId])) selectedId = null
      return { scene: next, past, future: [], rev: s.rev + 1, selectedId }
    })
  }

  return {
    scene: emptyScene('vehicule'),
    selectedId: null,
    past: [],
    future: [],
    rev: 0,

    select: (id) => set({ selectedId: id }),

    newScene: (moduleId, preset) => {
      const mod = getModule(moduleId)
      const nodes = instantiate(preset?.nodes ?? (mod ? [{ key: 'root', type: mod.rootType }] : []))
      const scene = emptyScene(moduleId)
      for (const n of nodes) {
        scene.nodes[n.id] = n
        scene.order.push(n.id)
      }
      scene.name = preset ? preset.label : 'Ma création'
      set((s) => ({ scene, past: [], future: [], selectedId: null, rev: s.rev + 1 }))
    },

    loadScene: (sc) => set((s) => ({ scene: migrateScene(sc), past: [], future: [], selectedId: null, rev: s.rev + 1 })),

    applyPreset: (preset, replace = true) => {
      const nodes = instantiate(preset.nodes)
      apply((d) => {
        if (replace) {
          d.nodes = {}
          d.order = []
        }
        for (const n of nodes) {
          d.nodes[n.id] = n
          d.order.push(n.id)
        }
        d.name = preset.label
      }, undefined, false)
    },

    addPart: (type, opts = {}) => {
      const def = getPart(type)
      if (!def) return null
      const sc = get().scene
      // Parent par défaut : pièce sélectionnée si la pièce sait la suivre, sinon la racine
      let parentId = opts.parentId
      if (parentId === undefined) {
        const sel = get().selectedId
        const selType = sel ? sc.nodes[sel]?.type : undefined
        if (def.followsParent && selType && def.followsParent.includes(selType)) parentId = sel
        else if (def.followsParent) {
          parentId = sc.order.find((i) => sc.nodes[i] && sc.nodes[i].parentId === null && def.followsParent!.includes(sc.nodes[i].type)) ?? null
        } else parentId = null
      }
      const node = makeNode(type, {
        parentId: parentId ?? null,
        follow: opts.follow ?? (!!def.fit && !!parentId),
        params: normalizeParams(def.schema, { ...defaultsOf(def.schema), ...(opts.params ?? {}) }),
        pos: opts.pos ?? [0, 0, 0],
      })
      apply((d) => {
        d.nodes[node.id] = node
        d.order.push(node.id)
      })
      set({ selectedId: node.id })
      return node.id
    },

    removeNode: (id) => {
      const ids = new Set(subtree(get().scene.nodes, id))
      apply((d) => {
        for (const i of ids) delete d.nodes[i]
        d.order = d.order.filter((i) => !ids.has(i))
      })
    },

    duplicateNode: (id) => {
      const sc = get().scene
      const src = sc.nodes[id]
      if (!src) return null
      const ids = subtree(sc.nodes, id)
      const map: Record<string, string> = {}
      for (const i of ids) map[i] = newId()
      apply((d) => {
        for (const i of ids) {
          const n = structuredClone(sc.nodes[i]) as SceneNode
          n.id = map[i]
          n.parentId = i === id ? src.parentId : map[sc.nodes[i].parentId as string]
          n.locked = false
          if (i === id) {
            n.name = `${src.name} (copie)`
            // Petit décalage pour voir la copie
            n.pos = [n.pos[0] + 0.3, n.pos[1], n.pos[2] + 0.3]
          }
          d.nodes[n.id] = n
          d.order.push(n.id)
        }
      })
      set({ selectedId: map[id] })
      return map[id]
    },

    replaceType: (id, type) => {
      const def = getPart(type)
      if (!def) return
      apply((d) => {
        const n = d.nodes[id]
        if (!n) return
        const old = n.params
        n.type = type
        n.name = def.label
        // Conserve les réglages qui portent le même nom dans la nouvelle pièce
        n.params = normalizeParams(def.schema, { ...defaultsOf(def.schema), ...Object.fromEntries(Object.entries(old).filter(([k]) => def.schema.some((s) => s.key === k))) })
        n.follow = !!def.fit && !!n.parentId
      })
    },

    setParam: (id, key, v) =>
      apply((d) => {
        const n = d.nodes[id]
        if (n && !n.locked) n.params[key] = v
      }, `p:${id}:${key}`),

    setCommon: (id, key, v) =>
      apply((d) => {
        const n = d.nodes[id]
        if (n && !n.locked && COMMON_KEYS.has(key)) setCommonOn(n, key, v)
      }, `c:${id}:${key}`),

    setTransform: (id, t) =>
      apply((d) => {
        const n = d.nodes[id]
        if (!n || n.locked) return
        if (t.pos) n.pos = t.pos
        if (t.rot) n.rot = t.rot
        if (t.scale) n.scale = t.scale
      }),

    setFlag: (id, flag, v) =>
      apply((d) => {
        const n = d.nodes[id]
        if (n) n[flag] = v
      }),

    rename: (id, name) =>
      apply((d) => {
        if (d.nodes[id]) d.nodes[id].name = name
      }, `r:${id}`),

    resetParams: (id) =>
      apply((d) => {
        const n = d.nodes[id]
        const def = n && getPart(n.type)
        if (n && def && !n.locked) n.params = defaultsOf(def.schema)
      }),

    undo: () => {
      const { past, future, scene } = get()
      const e = past[past.length - 1]
      if (!e) return
      set((s) => ({
        scene: applyPatches(scene, e.inverse),
        past: past.slice(0, -1),
        future: [...future, e],
        rev: s.rev + 1,
        selectedId: s.selectedId && applyPatches(scene, e.inverse).nodes[s.selectedId] ? s.selectedId : null,
      }))
    },
    redo: () => {
      const { past, future, scene } = get()
      const e = future[future.length - 1]
      if (!e) return
      set((s) => ({ scene: applyPatches(scene, e.patches), past: [...past, e], future: future.slice(0, -1), rev: s.rev + 1 }))
    },
  }
})
