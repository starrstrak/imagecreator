// Modèles de départ du module véhicule et générateur « Surprise ».
import type { ParamValues, Preset, PresetNode } from '@/core/types'
import { CHASSIS_BASE, CHASSIS_VARIANTS } from '@/parts/vehicle/chassis'
import { RIMS } from '@/parts/vehicle/wheels'
import { pick, rand, chance } from '@/utils/random'

interface Opts {
  variant: string
  label: string
  icon: string
  description: string
  /** nombre de portes latérales de chaque côté (0, 1 ou 2) */
  doors?: 0 | 1 | 2
  chassis?: ParamValues
  wheels?: ParamValues
  extras?: PresetNode[]
  /** pas de vitres latérales divisées (bus, camion) */
  windows?: boolean
  spoiler?: boolean
  lightShape?: string
}

const variantParams = (id: string): ParamValues => CHASSIS_VARIANTS.find((v) => v.id === id)?.params ?? CHASSIS_BASE

/** Assemble une voiture complète : châssis, roues, portes, vitres, éclairage, accessoires. */
export function buildVehicle(o: Opts): Preset {
  const cp: ParamValues = { ...variantParams(o.variant), ...(o.chassis ?? {}) }
  const L = cp.length as number
  const cabLen = Math.max(0.5, L * ((cp.rearBase as number) - (cp.wsBase as number)))
  const doors = o.doors ?? 2
  const nodes: PresetNode[] = [
    { key: 'c', type: 'vehicule.chassis', name: o.label, params: cp },
    { key: 'w', type: 'vehicule.wheels', name: 'Roues', parent: 'c', follow: true, params: o.wheels ?? {} },
  ]
  const lowH = (cp.deckH as number) - (cp.clearance as number)
  if (doors === 1) {
    nodes.push({ key: 'd1', type: 'vehicule.door', name: 'Porte', parent: 'c', follow: true, mirror: 'z', params: { along: 0.4, width: Math.min(1.2, cabLen * 0.6) } })
  } else if (doors === 2) {
    const dw = Math.min(1.1, cabLen * 0.42)
    nodes.push(
      { key: 'd1', type: 'vehicule.door', name: 'Porte avant', parent: 'c', follow: true, mirror: 'z', params: { along: 0.27, width: dw } },
      { key: 'd2', type: 'vehicule.door', name: 'Porte arrière', parent: 'c', follow: true, mirror: 'z', params: { along: 0.72, width: dw * 0.92 } },
    )
  }
  if (o.windows !== false) {
    nodes.push(
      { key: 'ws', type: 'vehicule.window', name: 'Pare-brise', parent: 'c', follow: true, params: { role: 'pare-brise', shape: 'trapeze' } },
      { key: 'rw', type: 'vehicule.window', name: 'Lunette arrière', parent: 'c', follow: true, params: { role: 'lunette', shape: 'trapeze' } },
    )
    if (doors === 2) {
      nodes.push(
        { key: 's1', type: 'vehicule.window', name: 'Vitre avant', parent: 'c', follow: true, mirror: 'z', params: { role: 'laterale', spanFrom: 0.02, spanTo: 0.47 } },
        { key: 's2', type: 'vehicule.window', name: 'Vitre arrière', parent: 'c', follow: true, mirror: 'z', params: { role: 'laterale', spanFrom: 0.52, spanTo: 0.98 } },
      )
    } else {
      nodes.push({ key: 's1', type: 'vehicule.window', name: 'Vitres latérales', parent: 'c', follow: true, mirror: 'z', params: { role: 'laterale', spanFrom: 0.02, spanTo: 0.98, bars: doors === 1 ? 1 : 0 } })
    }
  }
  const hgtFront = Math.max(0.35, Math.min((cp.noseH as number) - 0.12, 1.4))
  const hgtRear = Math.max(0.45, Math.min((cp.tailH as number) - 0.1, 1.5))
  nodes.push(
    { key: 'h', type: 'vehicule.headlight', name: 'Phares', parent: 'c', follow: true, mirror: 'z', params: { hgt: hgtFront, lat: (cp.width as number) * 0.32, shape: o.lightShape ?? 'amande', w: 0.32, h: 0.15 } },
    { key: 't', type: 'vehicule.taillight', name: 'Feux arrière', parent: 'c', follow: true, mirror: 'z', params: { hgt: hgtRear, lat: (cp.width as number) * 0.36 } },
    { key: 'g', type: 'vehicule.grille', name: 'Calandre', parent: 'c', follow: true, params: { hgt: Math.max(0.3, hgtFront - 0.12), w: (cp.width as number) * 0.38 } },
    { key: 'bf', type: 'vehicule.bumper', name: 'Pare-chocs avant', parent: 'c', follow: true, params: { side: 'avant', hgt: (cp.clearance as number) + 0.03, h: Math.min(0.3, lowH * 0.35) } },
    { key: 'br', type: 'vehicule.bumper', name: 'Pare-chocs arrière', parent: 'c', follow: true, params: { side: 'arriere', hgt: (cp.clearance as number) + 0.03, h: Math.min(0.3, lowH * 0.35) } },
    { key: 'm', type: 'vehicule.mirror', name: 'Rétroviseurs', parent: 'c', follow: true, mirror: 'z' },
    { key: 'pf', type: 'vehicule.plate', name: 'Plaque avant', parent: 'c', follow: true, params: { side: 'avant', hgt: (cp.clearance as number) + 0.2 } },
    { key: 'pr', type: 'vehicule.plate', name: 'Plaque arrière', parent: 'c', follow: true, params: { side: 'arriere', hgt: hgtRear - 0.05 } },
  )
  if (o.spoiler) nodes.push({ key: 'sp', type: 'vehicule.spoiler', name: 'Aileron', parent: 'c', follow: true, params: { kind: 'aileron', yOff: 0 } })
  nodes.push(...(o.extras ?? []))
  return { id: o.variant, label: o.label, icon: o.icon, description: o.description, nodes }
}

export const presets: Preset[] = [
  buildVehicle({ variant: 'berline', label: 'Berline', icon: '🚗', description: 'Une voiture familiale à 4 portes', doors: 2 }),
  buildVehicle({ variant: 'citadine', label: 'Citadine', icon: '🚙', description: 'Petite et maligne pour la ville', doors: 1, lightShape: 'rond', wheels: { tireDia: 0.58 } }),
  buildVehicle({
    variant: 'suv', label: 'SUV', icon: '🚘', description: 'Haut sur roues, prêt pour l’aventure', doors: 2, lightShape: 'rect',
    wheels: { tread: 'cross', treadDepth: 0.02, profile: 0.7 },
    extras: [{ key: 'rk', type: 'vehicule.rack', name: 'Barres de toit', parent: 'c', follow: true, params: { kind: 'barres', along: 0.5 } }, { key: 'sk', type: 'vehicule.sideskirt', name: 'Marchepieds', parent: 'c', follow: true, mirror: 'z', params: { kind: 'marchepied', len: 1.6 } }],
  }),
  buildVehicle({
    variant: 'pickup', label: 'Pick-up', icon: '🛻', description: 'Une grande benne pour tout transporter', doors: 1, lightShape: 'rect',
    wheels: { tread: 'cross', treadDepth: 0.025, profile: 0.75 },
    extras: [{ key: 'bd', type: 'vehicule.bed', name: 'Benne', parent: 'c', follow: true }, { key: 'bb', type: 'vehicule.bumper', name: 'Pare-buffle', parent: 'c', follow: true, params: { kind: 'buffle', side: 'avant', h: 0.5, hgt: 0.25 } }],
  }),
  buildVehicle({ variant: 'sportive', label: 'Sportive', icon: '🏎️', description: 'Basse, large, rapide !', doors: 1, spoiler: true, lightShape: 'led', wheels: { profile: 0.35, tireWidth: 0.27, spokeShape: 'turbine', spokeCount: 12, tread: 'chevron' }, extras: [{ key: 'ex', type: 'vehicule.exhaust', name: 'Échappements', parent: 'c', follow: true, params: { count: 2, lat: 0.4 } }] }),
  buildVehicle({ variant: 'coupe', label: 'Coupé', icon: '🚖', description: 'Élégant, avec 2 portes', doors: 1, lightShape: 'amande', wheels: { spokeShape: 'courbe', spokeCount: 7 } }),
  buildVehicle({ variant: 'cabriolet', label: 'Cabriolet', icon: '🏖️', description: 'Cheveux au vent !', doors: 1, windows: false, lightShape: 'rond', extras: [{ key: 'ws', type: 'vehicule.window', name: 'Pare-brise', parent: 'c', follow: true, params: { role: 'pare-brise', shape: 'trapeze' } }, { key: 'in', type: 'vehicule.interior', name: 'Sièges', parent: 'c', follow: true, params: { along: 0.5, rows: 1, seats: 2 } }, { key: 'sf', type: 'vehicule.softtop', name: 'Capote pliée', parent: 'c', follow: true, params: { along: 0.85 } }] }),
  buildVehicle({ variant: 'break', label: 'Break', icon: '🚐', description: 'Un grand coffre pour les vacances', doors: 2, extras: [{ key: 'rk', type: 'vehicule.rack', name: 'Galerie', parent: 'c', follow: true, params: { kind: 'galerie', along: 0.55, len: 1.4 } }] }),
  buildVehicle({ variant: 'monospace', label: 'Monospace', icon: '🚌', description: 'De la place pour toute la famille', doors: 2, lightShape: 'rect' }),
  buildVehicle({
    variant: 'fourgon', label: 'Fourgon', icon: '🚚', description: 'Pour déménager', doors: 1, lightShape: 'rect', wheels: { tireDia: 0.72 },
    extras: [{ key: 'dr', type: 'vehicule.door', name: 'Porte coulissante', parent: 'c', follow: true, params: { along: 0.7, width: 1.0, winH: 1.0, openType: 'coulissante' } }],
  }),
  buildVehicle({
    variant: 'bus', label: 'Bus', icon: '🚍', description: 'Beaucoup de places assises', doors: 0, windows: false, lightShape: 'rect', wheels: { tireDia: 1.0, tireWidth: 0.3 },
    extras: [
      { key: 'ws', type: 'vehicule.window', name: 'Pare-brise', parent: 'c', follow: true, params: { role: 'pare-brise', shape: 'rect', frame: 0.05 } },
      { key: 'sw', type: 'vehicule.window', name: 'Vitres latérales', parent: 'c', follow: true, mirror: 'z', params: { role: 'laterale', shape: 'rect', spanFrom: 0.1, spanTo: 0.92, bars: 6, gapBelow: 0.2, gapAbove: 0.45, round: 0.1 } },
      { key: 'dr', type: 'vehicule.door', name: 'Porte', parent: 'c', follow: true, params: { along: 0.1, width: 0.9, winH: 1.5, openType: 'coulissante' } },
    ],
  }),
  buildVehicle({
    variant: 'camion', label: 'Camion', icon: '🚛', description: 'Une grosse cabine et un grand caisson', doors: 1, lightShape: 'rect', wheels: { tireDia: 1.0, tireWidth: 0.3, tread: 'blocs', treadDepth: 0.025, dual: true },
    extras: [{ key: 'cg', type: 'vehicule.cargo', name: 'Caisson', parent: 'c', follow: true, params: { kind: 'caisson', h: 2.5 } }, { key: 'ex', type: 'vehicule.exhaust', name: 'Cheminée', parent: 'c', follow: true, params: { place: 'cheminee', len: 1.4, count: 1, dia: 0.14 } }],
  }),
  buildVehicle({
    variant: 'buggy', label: 'Buggy', icon: '🏁', description: 'Tout-terrain, sans toit', doors: 0, windows: false, lightShape: 'rond', wheels: { tread: 'cross', treadDepth: 0.03, profile: 0.8, tireWidth: 0.3 },
    extras: [
      { key: 'rb', type: 'vehicule.rollbar', name: 'Cage de sécurité', parent: 'c', follow: true, params: { kind: 'cage', along: 0.5, h: 0.75, w: 1.3 } },
      { key: 'in', type: 'vehicule.interior', name: 'Sièges', parent: 'c', follow: true, params: { rows: 1, seats: 2, along: 0.4 } },
      { key: 'ws', type: 'vehicule.window', name: 'Pare-brise', parent: 'c', follow: true, params: { role: 'pare-brise', shape: 'rect', frame: 0.03 } },
    ],
  }),
]

/** Création aléatoire : type de carrosserie, jantes, pneus et accessoires tirés au hasard. */
export function surprise(rng: () => number): Preset {
  const v = pick(rng, CHASSIS_VARIANTS.filter((c) => c.id !== 'buggy'))
  const base = presets.find((p) => p.id === v.id) ?? presets[0]
  const rim = pick(rng, RIMS)
  const jitter = (x: number, amt: number) => x * (1 + rand(rng, -amt, amt))
  const chassis = { ...(variantParams(v.id)) }
  for (const k of ['length', 'width', 'height', 'noseH', 'tailH', 'deckH']) chassis[k] = jitter(chassis[k] as number, 0.08)
  chassis.cornerRound = rand(rng, 0.12, 0.38)
  chassis.bulge = rand(rng, 0, 0.08)
  const wheels: ParamValues = { ...rim.params, tread: pick(rng, ['lisse', 'rainures', 'blocs', 'chevron', 'cross', 'neige']), profile: rand(rng, 0.3, 0.75), spokeCount: Math.round(rand(rng, 4, 10)) }
  const doors = pick(rng, [1, 2] as const)
  const shapes = ['rond', 'amande', 'rect', 'led', 'carre']
  const extras: PresetNode[] = []
  if (chance(rng, 0.45)) extras.push({ key: 'sp', type: 'vehicule.spoiler', parent: 'c', follow: true, params: { span: rand(rng, 1.1, 1.8), chord: rand(rng, 0.15, 0.35), angle: rand(rng, 0, 20), height: rand(rng, 0.1, 0.4) } })
  if (chance(rng, 0.4)) extras.push({ key: 'rk', type: 'vehicule.rack', parent: 'c', follow: true, params: { kind: pick(rng, ['barres', 'galerie', 'coffre']) } })
  if (chance(rng, 0.35)) extras.push({ key: 'ex', type: 'vehicule.exhaust', parent: 'c', follow: true, params: { count: Math.round(rand(rng, 1, 4)), shape: pick(rng, ['rond', 'ovale', 'carre']) } })
  if (chance(rng, 0.3)) extras.push({ key: 'ant', type: 'vehicule.antenna', parent: 'c', follow: true, params: { kind: pick(rng, ['fouet', 'requin']) } })
  if (chance(rng, 0.25)) extras.push({ key: 'vt', type: 'vehicule.vent', parent: 'c', follow: true, params: { place: 'capot', shape: pick(rng, ['rect', 'fentes', 'naca']) } })
  if (chance(rng, 0.25)) extras.push({ key: 'lb', type: 'vehicule.lightbar', parent: 'c', follow: true, params: { kind: pick(rng, ['barre', 'gyro', 'rampe']) } })
  const out = buildVehicle({ variant: v.id, label: `${v.label} surprise`, icon: '🎲', description: 'Créée au hasard', doors, chassis, wheels, lightShape: pick(rng, shapes), extras, spoiler: false })
  void base
  return out
}
