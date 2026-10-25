// Modèles de départ du module maison + création aléatoire. Les ouvertures sont posées
// automatiquement sur chaque mur d'après le modèle géométrique du volume.
import type { ParamValues, Preset, PresetNode } from '@/core/types'
import { makeVolume } from '@/parts/house/model'
import { chance, pick, rand } from '@/utils/random'

interface HouseOpts {
  id: string
  label: string
  icon: string
  description: string
  volume: ParamValues
  roof?: ParamValues | null
  /** étages (hors rez) qui reçoivent des fenêtres */
  windowStyle?: ParamValues
  door?: ParamValues
  extras?: PresetNode[]
  garden?: boolean
  noWindows?: boolean
  balcony?: boolean
}

const VOL_DEFAULT: ParamValues = { shape: 'rect', width: 10, depth: 8, floors: 2, floorH: 2.7 }

/** Fabrique une maison complète : volume, toit, porte, fenêtres sur tous les murs, jardin. */
export function buildHouse(o: HouseOpts): Preset {
  const vol: ParamValues = { ...VOL_DEFAULT, armW: 4.5, wallT: 0.3, basement: false, cap: true, ...o.volume }
  const nodes: PresetNode[] = [{ key: 'v', type: 'house.volume', name: o.label, params: vol }]
  const model = makeVolume({ ...vol, floors: vol.floors, floorH: vol.floorH, basement: false })
  if (o.roof !== null) nodes.push({ key: 'r', type: 'house.roof', name: 'Toit', parent: 'v', follow: true, params: { type: 'deux-pans', pitch: 35, ...(o.roof ?? {}) } })
  let k = 0
  const win = { kind: 'fenetre', shape: 'rect', w: 1.1, h: 1.3, hgt: 0.9, barsV: 1, barsH: 1, ...(o.windowStyle ?? {}) }
  if (!o.noWindows && !model.round) {
    let doorDone = false
    for (const e of model.edges) {
      if (e.len < 2.2) continue
      const n = Math.max(1, Math.floor((e.len - 1.0) / 3))
      const pitch = (e.len - 1.0) / n
      for (let f = 0; f < model.floors; f++) {
        const isFront = e.face === 'devant' && e.seg === (model.edges.filter((x) => x.face === 'devant').length > 1 ? 1 : 0)
        // façade avant : colonne centrale = porte au rez-de-chaussée (nombre impair de colonnes)
        const cols = isFront && n % 2 === 0 ? n + 1 : n
        const colPitch = (e.len - 1.0) / cols
        for (let i = 0; i < cols; i++) {
          const u = (i - (cols - 1) / 2) * colPitch
          if (isFront && f === 0 && i === (cols - 1) / 2 && !doorDone) {
            nodes.push({ key: `d${k++}`, type: 'house.opening', name: 'Porte d’entrée', parent: 'v', follow: true, params: { kind: 'porte', shape: 'rect', w: 0.95, h: 2.1, hgt: 0, barsV: 0, barsH: 0, style: 'pleine', face: e.face, seg: e.seg, floor: 0, u, ...(o.door ?? {}) } })
            doorDone = true
            continue
          }
          nodes.push({ key: `w${k++}`, type: 'house.opening', name: f === 0 ? 'Fenêtre' : `Fenêtre étage ${f}`, parent: 'v', follow: true, params: { ...win, face: e.face, seg: e.seg, floor: f, u, w: Math.min(win.w as number, pitch * 0.7) } })
        }
      }
    }
  }
  if (o.balcony && !model.round) {
    nodes.push({ key: 'bal', type: 'house.balcony', name: 'Balcon', parent: 'v', follow: true, params: { face: 'devant', seg: 0, floor: 1, u: 0, w: Math.min(4, model.W * 0.4) } })
  }
  if (o.garden !== false) {
    nodes.push({ key: 'g', type: 'house.ground', name: 'Jardin', params: { w: model.W + 20, d: model.D + 18, pathFrom: model.D / 2 + 0.2 }, pos: [0, 0, 1] })
    nodes.push({ key: 't1', type: 'house.tree', name: 'Arbre', pos: [-model.W / 2 - 4, 0, model.D / 2 + 2], params: { kind: 'feuillu' } })
    nodes.push({ key: 't2', type: 'house.tree', name: 'Sapin', pos: [model.W / 2 + 4.5, 0, -2], params: { kind: 'conifere', height: 6, crownR: 1.5, trunkH: 1 } })
  }
  nodes.push(...(o.extras ?? []))
  return { id: o.id, label: o.label, icon: o.icon, description: o.description, nodes }
}

export const presets: Preset[] = [
  buildHouse({
    id: 'maison', label: 'Maison de famille', icon: '🏡', description: '2 étages, toit à 2 pans, cheminée', volume: {},
    extras: [{ key: 'ch', type: 'house.chimney', name: 'Cheminée', parent: 'v', follow: true, params: { x: 3, z: 0, rise: 3.4 } }, { key: 'fe', type: 'house.fence', name: 'Clôture', params: { w: 24, d: 22 }, pos: [0, 0, 1] }],
  }),
  buildHouse({
    id: 'villa', label: 'Villa moderne', icon: '🏢', description: 'Toit-terrasse, grandes baies, piscine', volume: { width: 12, depth: 9, floors: 2, floorH: 3 },
    roof: { type: 'terrasse', overhang: 0.3 }, windowStyle: { w: 2.2, h: 1.6, hgt: 0.8, barsV: 0, barsH: 0 }, balcony: true,
    extras: [{ key: 'po', type: 'house.pool', name: 'Piscine', pos: [0, 0, 13], params: { w: 8, d: 4 } }, { key: 'te', type: 'house.terrace', name: 'Terrasse', parent: 'v', follow: true, params: { face: 'devant', w: 8, d: 3 } }],
  }),
  buildHouse({
    id: 'L', label: 'Maison en L', icon: '🅻', description: 'Deux ailes, deux toits', volume: { shape: 'L', width: 14, depth: 11, armW: 5.5, floors: 2 },
    extras: [{ key: 'pe', type: 'house.pergola', name: 'Pergola', pos: [3, 0, 8], params: { w: 4, d: 3 } }],
  }),
  buildHouse({ id: 'U', label: 'Maison en U', icon: '🅤', description: 'Avec cour intérieure', volume: { shape: 'U', width: 16, depth: 10, armW: 4.5, floors: 2 }, roof: { type: 'deux-pans', pitch: 30 } }),
  buildHouse({
    id: 'chalet', label: 'Chalet', icon: '🛖', description: 'Grand toit pentu et balcon', volume: { width: 9, depth: 8, floors: 2, floorH: 2.5 }, roof: { type: 'deux-pans', pitch: 48, overhang: 1.0 }, balcony: true,
    windowStyle: { w: 0.9, h: 1.1, shutters: true, barsV: 1, barsH: 2 }, extras: [{ key: 'ch', type: 'house.chimney', name: 'Cheminée', parent: 'v', follow: true, params: { x: -2.5, z: 0, rise: 4.8, cap: 'chapeau' } }],
  }),
  buildHouse({ id: 'mansarde', label: 'Maison mansardée', icon: '🏛️', description: 'Toit à la Mansart, 3 niveaux', volume: { width: 11, depth: 9, floors: 3, floorH: 2.8 }, roof: { type: 'mansarde' }, windowStyle: { shape: 'arche', w: 0.9, h: 1.6, hgt: 0.8, barsV: 1, barsH: 2, shutters: true } }),
  buildHouse({ id: 'octo', label: 'Pavillon octogonal', icon: '🛑', description: 'Plan à huit pans', volume: { shape: 'octogone', width: 10, depth: 10, floors: 2 }, roof: { type: 'pyramide', pitch: 38 } }),
  buildHouse({ id: 'tour', label: 'Tour de château', icon: '🏰', description: 'Tour ronde à toit pointu', volume: { shape: 'tour', width: 7, depth: 7, floors: 5, floorH: 3 }, roof: { type: 'pyramide', pitch: 62, overhang: 0.6 }, garden: false, extras: [{ key: 'po', type: 'house.opening', parent: 'v', follow: true, name: 'Porte', params: { kind: 'porte', shape: 'arche', w: 1.4, h: 2.4, hgt: 0, barsV: 0, barsH: 0, style: 'double', face: 'devant', seg: 0, floor: 0, u: 0 } }] }),
  buildHouse({ id: 'immeuble', label: 'Immeuble', icon: '🏬', description: '6 étages, toit plat', volume: { width: 18, depth: 12, floors: 6, floorH: 3 }, roof: { type: 'terrasse', railing: 'muret' }, windowStyle: { w: 1.4, h: 1.5, hgt: 0.9, barsV: 1, barsH: 0 }, garden: false }),
  buildHouse({ id: 'gratte', label: 'Gratte-ciel', icon: '🌆', description: '20 étages !', volume: { width: 18, depth: 18, floors: 20, floorH: 3.2 }, roof: { type: 'plat' }, windowStyle: { w: 2.2, h: 2.0, hgt: 0.7, barsV: 0, barsH: 0 }, garden: false }),
  buildHouse({ id: 'shed', label: 'Maison à toit mono-pente', icon: '📐', description: 'Style contemporain', volume: { width: 11, depth: 7, floors: 2 }, roof: { type: 'shed', pitch: 12, overhang: 0.5 }, windowStyle: { w: 1.8, h: 1.4, barsV: 0, barsH: 0 } }),
  buildHouse({ id: 'usine', label: 'Atelier (dents de scie)', icon: '🏭', description: 'Toit d’usine', volume: { width: 20, depth: 10, floors: 1, floorH: 4.5 }, roof: { type: 'dents', saw: 4, pitch: 35 }, windowStyle: { w: 2.5, h: 1.5, hgt: 2.2, barsV: 3, barsH: 0 }, garden: false }),
]

/** Création aléatoire : forme, étages, toit, ouvertures et jardin tirés au hasard. */
export function surprise(rng: () => number): Preset {
  const shape = pick(rng, ['rect', 'rect', 'L', 'U', 'T', 'croix', 'octogone'] as const)
  const floors = Math.round(rand(rng, 1, 4))
  const roofType = pick(rng, ['deux-pans', 'quatre-pans', 'mansarde', 'terrasse', 'shed', 'papillon', 'pyramide'] as const)
  const W = rand(rng, 8, 14)
  const D = rand(rng, 7, 12)
  const extras: PresetNode[] = []
  if (chance(rng, 0.5)) extras.push({ key: 'ch', type: 'house.chimney', parent: 'v', follow: true, params: { x: rand(rng, -3, 3), z: 0, rise: 3 + floors * 1.2 } })
  if (chance(rng, 0.4)) extras.push({ key: 'po', type: 'house.pool', pos: [0, 0, D / 2 + 9], params: { shape: pick(rng, ['rect', 'haricot', 'ronde', 'L']) } })
  if (chance(rng, 0.4)) extras.push({ key: 'pe', type: 'house.pergola', pos: [rand(rng, -4, 4), 0, D / 2 + 3] })
  if (chance(rng, 0.5)) extras.push({ key: 'fe', type: 'house.fence', params: { w: W + 14, d: D + 12, style: pick(rng, ['lattes', 'barreaux', 'grillage', 'mur']) }, pos: [0, 0, 1] })
  const roofPitch = rand(rng, 20, 55)
  return buildHouse({
    id: 'surprise', label: 'Maison surprise', icon: '🎲', description: 'Créée au hasard',
    volume: { shape, width: W, depth: D, floors, floorH: rand(rng, 2.5, 3.2), armW: rand(rng, 4, 6) },
    roof: { type: roofType, pitch: roofPitch, overhang: rand(rng, 0.2, 0.9), railing: pick(rng, ['muret', 'barreaux', 'verre']) },
    windowStyle: { shape: pick(rng, ['rect', 'rect', 'arche', 'cintre']), w: rand(rng, 0.9, 1.6), h: rand(rng, 1.1, 1.6), shutters: chance(rng, 0.3), barsV: Math.round(rand(rng, 0, 2)), barsH: Math.round(rand(rng, 0, 2)) },
    balcony: chance(rng, 0.4) && floors > 1,
    extras,
  })
}
