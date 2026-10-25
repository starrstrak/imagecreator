// Résolution des liens entre pièces : une pièce qui « suit » son parent reçoit de lui
// des valeurs (la jante prend le diamètre de la roue, la porte se pose sur le flanc…).
import { getPart } from './registry'
import type { ParamValues, SceneNode, Vec3 } from './types'

export interface Resolved {
  node: SceneNode
  /** Paramètres effectifs (valeurs du nœud + valeurs imposées par le parent) */
  params: ParamValues
  /** Clés imposées par le parent (curseurs affichés « liés ») */
  linked: Set<string>
  pos: Vec3
  rot: Vec3
  /** Données exposées aux enfants */
  provided: unknown
  /** Données fournies par le parent (contexte de construction) */
  parentProvided: unknown
}

const cache = new Map<string, { node: SceneNode; parent: Resolved | null; res: Resolved }>()

/** Résout un nœud (mémoïsé : référence stable tant que le nœud et son parent ne changent pas). */
export function resolveNode(nodes: Record<string, SceneNode>, id: string): Resolved | null {
  const node = nodes[id]
  if (!node) return null
  const parentNode = node.parentId ? nodes[node.parentId] : undefined
  const parent = parentNode ? resolveNode(nodes, parentNode.id) : null
  const hit = cache.get(id)
  if (hit && hit.node === node && hit.parent === parent) return hit.res

  const def = getPart(node.type)
  let params = node.params
  let pos = node.pos
  let rot = node.rot
  const linked = new Set<string>()
  if (node.follow && parent && def?.fit && (!def.followsParent || def.followsParent.includes(parent.node.type))) {
    const f = def.fit(parent.provided, node.params, parent.params)
    if (f.params) {
      params = { ...node.params, ...f.params }
      for (const k of Object.keys(f.params)) linked.add(k)
    }
    // La pose imposée s'ajoute au décalage propre du nœud
    if (f.pos) pos = [f.pos[0] + node.pos[0], f.pos[1] + node.pos[1], f.pos[2] + node.pos[2]]
    if (f.rot) rot = [f.rot[0] + node.rot[0], f.rot[1] + node.rot[1], f.rot[2] + node.rot[2]]
  }
  const res: Resolved = {
    node,
    params,
    linked,
    pos,
    rot,
    provided: def?.provide ? def.provide(params) : undefined,
    parentProvided: parent?.provided,
  }
  cache.set(id, { node, parent, res })
  return res
}

/** Enfants directs d'un nœud, dans l'ordre d'affichage. */
export function childrenOf(nodes: Record<string, SceneNode>, order: string[], id: string | null): string[] {
  return order.filter((i) => nodes[i] && nodes[i].parentId === id)
}
