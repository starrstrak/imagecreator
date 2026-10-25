// Vérifie que l'exemple du guide « Ajouter un module » fonctionne vraiment.
import { describe, expect, it } from 'vitest'
import '@/modules'
import '../../docs/exemples/avion'
import { allParts, getModule } from '@/core/registry'
import { defaultsOf } from '@/core/paramSchema'
import { resolveNode } from '@/core/resolve'
import { useScene } from '@/store/sceneStore'

describe('exemple : module avion', () => {
  it('se construit et l’aile suit le fuselage', () => {
    for (const p of allParts().filter((x) => x.module === 'avion')) expect(() => p.build(defaultsOf(p.schema), {})).not.toThrow()
    useScene.getState().newScene('avion', getModule('avion')!.presets[0])
    const sc = useScene.getState().scene
    const wing = sc.order.find((i) => sc.nodes[i].type === 'avion.wing')!
    const r = resolveNode(sc.nodes, wing)!
    expect(r.pos[2]).toBeGreaterThan(0.1)
    // élargir le fuselage éloigne l'aile
    const fus = sc.order.find((i) => sc.nodes[i].type === 'avion.fuselage')!
    useScene.getState().setParam(fus, 'radius', 2)
    const r2 = resolveNode(useScene.getState().scene.nodes, wing)!
    expect(r2.pos[2]).toBeGreaterThan(r.pos[2])
  })
})
