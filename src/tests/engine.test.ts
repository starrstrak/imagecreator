import { describe, expect, it } from 'vitest'
import '@/modules'
import { allModules, allParts, getModule } from '@/core/registry'
import { defaultsOf, normalizeParams } from '@/core/paramSchema'
import { useScene } from '@/store/sceneStore'
import { resolveNode } from '@/core/resolve'
import { migrateScene } from '@/core/migrate'
import { makeBody } from '@/parts/vehicle/body'
import { makeVolume } from '@/parts/house/model'

describe('schémas de paramètres', () => {
  it('chaque pièce a des valeurs par défaut valides et ses bornes sont cohérentes', () => {
    for (const def of allParts()) {
      const d = defaultsOf(def.schema)
      for (const s of def.schema) {
        expect(d[s.key], `${def.type}.${s.key}`).toBeDefined()
        if (s.kind === 'number') {
          expect(s.min, `${def.type}.${s.key} min`).toBeLessThanOrEqual(s.default)
          expect(s.max, `${def.type}.${s.key} max`).toBeGreaterThanOrEqual(s.default)
        }
      }
    }
  })

  it('normalizeParams borne les valeurs et complète les manquantes', () => {
    const chassis = allParts().find((p) => p.type === 'vehicule.chassis')!
    const n = normalizeParams(chassis.schema, { length: -5, foo: 3 })
    expect(n.length).toBeGreaterThanOrEqual(0)
    expect(n.foo).toBeUndefined()
    expect(n.width).toBe(1.82)
  })
})

describe('construction de toutes les pièces', () => {
  it('chaque pièce se construit avec ses valeurs par défaut et chacune de ses variantes', () => {
    for (const def of allParts()) {
      const base = defaultsOf(def.schema)
      const o = def.build(base, {})
      expect(o, def.type).toBeTruthy()
      for (const v of def.variants ?? []) {
        const p = normalizeParams(def.schema, { ...base, ...v.params })
        expect(() => def.build(p, {}), `${def.type}/${v.id}`).not.toThrow()
      }
    }
  })

  it('chaque modèle de départ référence des pièces existantes et se construit', () => {
    for (const mod of allModules()) {
      for (const pr of mod.presets) {
        for (const n of pr.nodes) expect(allParts().some((p) => p.type === n.type), `${pr.id}:${n.type}`).toBe(true)
        useScene.getState().newScene(mod.id, pr)
        const sc = useScene.getState().scene
        for (const id of sc.order) {
          const r = resolveNode(sc.nodes, id)!
          const def = allParts().find((p) => p.type === sc.nodes[id].type)!
          expect(() => def.build(r.params, { parent: sc.nodes[id].follow ? r.parentProvided : undefined })).not.toThrow()
        }
      }
    }
  })

  it('« Surprise » produit des créations valides', () => {
    for (const mod of allModules()) {
      for (let i = 0; i < 5; i++) {
        let s = 1234 + i
        const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647)
        const pr = mod.surprise(rng)
        useScene.getState().newScene(mod.id, pr)
        expect(Object.keys(useScene.getState().scene.nodes).length).toBeGreaterThan(1)
      }
    }
  })
})

describe('adaptation entre pièces', () => {
  it('la roue suit le diamètre et la voie de la carrosserie', () => {
    const st = useScene.getState()
    st.newScene('vehicule', getModule('vehicule')!.presets[0])
    const sc = useScene.getState().scene
    const chassisId = sc.order.find((i) => sc.nodes[i].type === 'vehicule.chassis')!
    const wheelsId = sc.order.find((i) => sc.nodes[i].type === 'vehicule.wheels')!
    useScene.getState().setParam(chassisId, 'wheelDia', 0.9)
    const sc2 = useScene.getState().scene
    const r = resolveNode(sc2.nodes, wheelsId)!
    expect(r.params.tireDia).toBeCloseTo(0.9)
    expect(r.linked.has('tireDia')).toBe(true)
    // le flanc dépend bien de la largeur
    const body = makeBody(sc2.nodes[chassisId].params)
    expect(body.sideZ(0, 0.5)).toBeGreaterThan(0.5)
  })

  it('les murs de la maison sont percés : les ouvertures publient leur emplacement', () => {
    useScene.getState().newScene('maison', getModule('maison')!.presets[0])
    const sc = useScene.getState().scene
    const door = sc.order.find((i) => sc.nodes[i].type === 'house.opening' && sc.nodes[i].params.kind === 'porte')!
    const r = resolveNode(sc.nodes, door)!
    expect(r.params._edge).toBeTypeOf('number')
    expect(r.linked.has('_t')).toBe(true)
    const vol = makeVolume(sc.nodes[sc.order[0]].params)
    expect(vol.edges.length).toBe(4)
  })
})

describe('historique illimité', () => {
  it('annuler / rétablir restaure l’état exact et fusionne les glissements rapides', () => {
    const st = useScene.getState()
    st.newScene('maison')
    const id = useScene.getState().scene.order[0]
    const before = useScene.getState().scene.nodes[id].params.width
    for (let i = 0; i < 20; i++) useScene.getState().setParam(id, 'width', 11 + i)
    expect(useScene.getState().past.length).toBe(1) // fusionné en une seule étape
    st.undo()
    expect(useScene.getState().scene.nodes[id].params.width).toBe(before)
    st.redo()
    expect(useScene.getState().scene.nodes[id].params.width).toBe(30)
  })

  it('dupliquer, verrouiller et supprimer fonctionnent', () => {
    const st = useScene.getState()
    st.newScene('maison')
    const id = useScene.getState().scene.order[0]
    const copy = st.duplicateNode(id)!
    expect(useScene.getState().scene.nodes[copy]).toBeDefined()
    st.setFlag(copy, 'locked', true)
    st.setParam(copy, 'width', 99)
    expect(useScene.getState().scene.nodes[copy].params.width).not.toBe(99)
    st.removeNode(copy)
    expect(useScene.getState().scene.nodes[copy]).toBeUndefined()
  })
})

describe('format de projet', () => {
  it('rejette un fichier invalide et répare les références orphelines', () => {
    expect(() => migrateScene({} as never)).toThrow()
    useScene.getState().newScene('maison')
    const sc = structuredClone(useScene.getState().scene)
    sc.nodes[sc.order[0]].parentId = 'inexistant'
    expect(migrateScene(sc).nodes[sc.order[0]].parentId).toBeNull()
  })
})
