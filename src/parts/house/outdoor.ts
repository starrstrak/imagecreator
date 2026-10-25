// Extérieur : balcon, escalier, cheminée, panneaux solaires, piscine, clôture, arbres,
// jardin, terrasse, pergola, lampadaire, boîte aux lettres.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle, ParamValues, PartVariant } from '@/core/types'
import { cylinder, extrude, mk, polyShape, roundedBox, shapeFromPts } from '@/parts/primitives/geo'
import { clamp, deg } from '@/utils/math'
import { roofPlacement } from './openings'
import type { Face, HouseVolume } from './model'
import type { RoofModel } from './roof'

const FO = 'Forme'
const PO = 'Position'
const DE = 'Détails'

const wallFaceSchema = () => [
  choice('face', 'Mur', 'devant', [['devant', 'Façade', '⬆️'], ['derriere', 'Arrière', '⬇️'], ['gauche', 'Gauche', '⬅️'], ['droite', 'Droite', '➡️']], { group: PO, level: 'easy' }),
  int('seg', 'Quel pan de mur ?', 0, [0, 4], { group: PO }),
  num('u', 'Position le long du mur', 0, [-12, 12], { group: PO, level: 'easy', unit: 'm' }),
]

// ---------------------------------------------------------------- Balcon
registerPart({
  type: 'house.balcony',
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [(p.w as number) / 2, 0, (p.d as number) / 2], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'd', label: 'Profondeur', position: [0, 0, p.d as number], axis: [0, 0, 1], param: 'd', ratio: 1 }],
  label: 'Balcon',
  category: 'exterieur',
  icon: '🏙️',
  module: 'maison',
  followsParent: ['house.volume'],
  schema: [
    ...wallFaceSchema(),
    int('floor', 'Étage', 1, [1, 12], { group: PO, level: 'easy' }),
    pos('w', 'Largeur', 3, [0.6, 12], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 1.2, [0.3, 5], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur de la dalle', 0.15, [0.04, 0.6], { group: FO, unit: 'm' }),
    pos('railH', 'Hauteur du garde-corps', 1.0, [0.2, 2], { group: FO, unit: 'm' }),
    choice('rail', 'Garde-corps', 'barreaux', [['aucun', 'Aucun', '⛔'], ['barreaux', 'Barreaux', '▥'], ['plein', 'Plein', '⬜'], ['verre', 'Verre', '🪟'], ['barre', 'Barre simple', '➖']], { group: DE, level: 'easy' }),
    choice('support', 'Soutien', 'consoles', [['aucun', 'Aucun', '⛔'], ['consoles', 'Consoles', '◣'], ['poteaux', 'Poteaux', '🏛️']], { group: DE }),
    bool('roof', 'Auvent', false, { group: DE }),
  ],
  fit: (parent, own) => {
    const v = parent as HouseVolume
    if (v?.kind !== 'volume') return {}
    const r = v.onWall(own.face as Face, own.seg as number, own.u as number, v.levelY(Math.round(own.floor as number)))
    return r ? { pos: r.pos, rot: r.rot } : {}
  },
  build: (p) => {
    const w = p.w as number
    const d = p.d as number
    const t = p.thick as number
    const H = p.railH as number
    const root = new THREE.Group()
    const slab = mk(roundedBox(w, t, d, Math.min(0.02, t / 3)), 'wall', { edgeAngle: 35 })
    slab.position.set(0, -t / 2, d / 2)
    root.add(slab)
    const rail = p.rail as string
    const sides: [number, number, number, number][] = [[w, 0.05, 0, d - 0.03], [0.05, d, w / 2 - 0.03, d / 2], [0.05, d, -w / 2 + 0.03, d / 2]]
    if (rail !== 'aucun') {
      for (const [lx, lz, px, pz] of sides) {
        const along = lx >= lz
        const top = mk(new THREE.BoxGeometry(lx, 0.045, lz), 'metal', { edgeAngle: 40 })
        top.position.set(px, H, pz)
        root.add(top)
        if (rail === 'plein' || rail === 'verre') {
          const pn = mk(new THREE.BoxGeometry(along ? lx : 0.04, H, along ? 0.04 : lz), rail === 'verre' ? 'glass' : 'wall', { edgeAngle: 40 })
          pn.position.set(px, H / 2, pz)
          root.add(pn)
        } else if (rail === 'barreaux') {
          const n = Math.max(2, Math.round((along ? lx : lz) / 0.24))
          for (let i = 0; i <= n; i++) {
            const k = -0.5 + i / n
            const b = mk(new THREE.BoxGeometry(0.025, H, 0.025), 'metal', { edgeAngle: 40 })
            b.position.set(along ? k * lx : px, H / 2, along ? pz : pz + k * lz)
            root.add(b)
          }
        } else {
          const b = mk(new THREE.BoxGeometry(lx, 0.03, lz), 'metal', { edgeAngle: 40 })
          b.position.set(px, H * 0.5, pz)
          root.add(b)
        }
      }
    }
    if (p.support === 'consoles') {
      for (const x of [-w * 0.35, w * 0.35]) {
        const c = mk(extrude(shapeFromPts([[0, 0], [d * 0.9, 0], [0, -d * 0.7]]), 0.08), 'metal', { edgeAngle: 40 })
        c.rotation.y = -Math.PI / 2
        c.position.set(x, -t, 0.04)
        root.add(c)
      }
    } else if (p.support === 'poteaux') {
      for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
        const c = mk(cylinder(0.06, 0.06, 3, 12), 'wall', { edgeAngle: 40 })
        c.position.set(x, -t - 1.5, d - 0.1)
        root.add(c)
      }
    }
    if (p.roof) {
      const r = mk(roundedBox(w + 0.2, 0.06, d + 0.1, 0.02), 'roof', { edgeAngle: 40 })
      r.position.set(0, H + 1.3, d / 2)
      root.add(r)
      for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
        const c = mk(cylinder(0.03, 0.03, 1.3, 10), 'metal', { edgeAngle: 40 })
        c.position.set(x, H + 0.65, d - 0.05)
        root.add(c)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Escalier
registerPart({
  type: 'house.stairs',
  label: 'Escalier / perron',
  category: 'exterieur',
  icon: '🪜',
  module: 'maison',
  followsParent: ['house.volume'],
  variants: [
    { id: 'droit', label: 'Droit', icon: '🪜', params: { kind: 'droit' } },
    { id: 'quart', label: 'Quart tournant', icon: '↪️', params: { kind: 'quart' } },
    { id: 'helico', label: 'Colimaçon', icon: '🌀', params: { kind: 'helico', steps: 14, w: 1.0 } },
    { id: 'perron', label: 'Perron', icon: '⛩️', params: { kind: 'perron', steps: 4, w: 3 } },
  ] as PartVariant[],
  schema: [
    ...wallFaceSchema(),
    choice('kind', 'Type', 'droit', [['droit', 'Droit', '🪜'], ['quart', 'Quart tournant', '↪️'], ['helico', 'Colimaçon', '🌀'], ['perron', 'Perron', '⛩️']], { group: FO, level: 'easy' }),
    int('steps', 'Nombre de marches', 10, [1, 40], { group: FO, level: 'easy' }),
    pos('riser', 'Hauteur d’une marche', 0.17, [0.05, 0.4], { group: FO, level: 'easy', unit: 'm' }),
    pos('tread', 'Profondeur d’une marche', 0.28, [0.1, 0.6], { group: FO, unit: 'm' }),
    pos('w', 'Largeur', 1.2, [0.4, 6], { group: FO, level: 'easy', unit: 'm' }),
    num('turn', 'Sens du virage', 1, [-1, 1], { group: FO, step: 2, showIf: (p) => p.kind === 'quart' || p.kind === 'helico' }),
    num('base', 'Hauteur du départ', 0, [-3, 12], { group: PO, unit: 'm', tip: 'Hauteur à laquelle l’escalier arrive sur le mur.' }),
    bool('rail', 'Rampe', true, { group: DE }),
  ],
  fit: (parent, own) => {
    const v = parent as HouseVolume
    if (v?.kind !== 'volume') return {}
    const r = v.onWall(own.face as Face, own.seg as number, own.u as number, own.base as number)
    return r ? { pos: r.pos, rot: r.rot } : {}
  },
  build: (p) => {
    const n = Math.round(p.steps as number)
    const rh = p.riser as number
    const td = p.tread as number
    const w = p.w as number
    const root = new THREE.Group()
    const kind = p.kind as string
    // La marche i a son dessus à y = −i·hauteur (la marche 0 touche le seuil) ; le plein descend jusqu'au sol.
    const addStep = (i: number, x: number, z: number, lx: number, lz: number) => {
      const topY = -i * rh
      const full = topY + n * rh
      const m = mk(new THREE.BoxGeometry(lx, full, lz), 'wall', { edgeAngle: 35 })
      m.position.set(x, topY - full / 2, z)
      root.add(m)
    }
    if (kind === 'droit' || kind === 'perron') {
      for (let i = 0; i < n; i++) addStep(i, 0, td * i + td / 2, w, td)
    } else if (kind === 'quart') {
      const half = Math.floor(n / 2)
      for (let i = 0; i < half; i++) addStep(i, 0, td * i + td / 2, w, td)
      const turn = p.turn as number
      const zc = td * half + w / 2
      addStep(half, 0, zc, w, w)
      for (let i = half + 1; i < n; i++) addStep(i, turn * (w / 2 + td * (i - half - 0.5)), zc, td, w)
    } else {
      const R = w
      for (let i = 0; i < n; i++) {
        const a = ((i * 24 * (p.turn as number)) * Math.PI) / 180
        const topY = -i * rh
        const g = new THREE.BoxGeometry(R, 0.06, 0.32)
        const m = mk(g, 'wall', { edgeAngle: 35 })
        m.position.set(Math.cos(a) * R / 2, topY - 0.03, Math.sin(a) * R / 2 + td)
        m.rotation.y = -a
        root.add(m)
      }
      root.add(mk(cylinder(0.05, 0.05, n * rh + 1, 12), 'metal', { edgeAngle: 40 }))
      root.children[root.children.length - 1].position.set(0, -n * rh / 2 + 0.5, td)
    }
    if (p.rail && kind !== 'helico') {
      const sl = n * rh
      const len = Math.hypot(td * n, sl)
      for (const s of [-1, 1]) {
        const rail = mk(new THREE.BoxGeometry(0.04, 0.04, len), 'metal', { edgeAngle: 40 })
        rail.position.set(s * (w / 2 - 0.03), -sl / 2 + 0.9, (td * n) / 2)
        rail.rotation.x = -Math.atan2(sl, td * n)
        root.add(rail)
        for (const k of [0, 0.5, 1]) {
          const post = mk(new THREE.BoxGeometry(0.04, 0.9, 0.04), 'metal', { edgeAngle: 40 })
          post.position.set(s * (w / 2 - 0.03), -sl * (k) + 0.45, td * n * k)
          root.add(post)
        }
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Cheminée
registerPart({
  type: 'house.chimney',
  handles: (p): Handle[] => [{ id: 'h', label: 'Hauteur', position: [0, p.rise as number, 0], axis: [0, 1, 0], param: 'rise', ratio: 1 }],
  planHide: true,
  label: 'Cheminée',
  category: 'toit',
  icon: '🏭',
  module: 'maison',
  followsParent: ['house.volume'],
  schema: [
    pos('w', 'Largeur', 0.6, [0.2, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 0.6, [0.2, 3], { group: FO, unit: 'm' }),
    pos('rise', 'Hauteur au-dessus du toit', 1.8, [0.3, 8], { group: FO, level: 'easy', unit: 'm', tip: 'Compte depuis le haut du mur : ajoute la hauteur du toit.' }),
    choice('cap', 'Sommet', 'mitre', [['plat', 'Plat', '▬'], ['mitre', 'Mitre', '⛰️'], ['chapeau', 'Chapeau', '🎩'], ['pots', 'Boisseaux', '🏺']], { group: FO, level: 'easy' }),
    int('pots', 'Nombre de boisseaux', 2, [1, 6], { group: DE, showIf: (p) => p.cap === 'pots' }),
    num('x', 'Position gauche / droite', 3, [-20, 20], { group: PO, level: 'easy', unit: 'm' }),
    num('z', 'Position avant / arrière', 0, [-20, 20], { group: PO, level: 'easy', unit: 'm' }),
    bool('bands', 'Bandeaux de briques', true, { group: DE }),
  ],
  fit: (parent, own) => {
    const v = parent as HouseVolume
    if (v?.kind !== 'volume') return {}
    return { pos: [own.x as number, v.H, own.z as number] }
  },
  build: (p) => {
    const w = p.w as number
    const d = p.d as number
    const H = p.rise as number
    const root = new THREE.Group()
    const body = mk(roundedBox(w, H + 1, d, 0.02), 'wall', { edgeAngle: 35 })
    body.position.y = H / 2 - 0.5
    root.add(body)
    if (p.bands) {
      for (const y of [H * 0.35, H * 0.7]) {
        const b = mk(roundedBox(w + 0.06, 0.07, d + 0.06, 0.01), 'wall', { edgeAngle: 35 })
        b.position.y = y
        root.add(b)
      }
    }
    const cap = p.cap as string
    if (cap === 'plat') {
      const c = mk(roundedBox(w + 0.12, 0.08, d + 0.12, 0.01), 'dark', { edgeAngle: 35 })
      c.position.y = H + 0.04
      root.add(c)
    } else if (cap === 'mitre') {
      const c = mk(extrude(polyShape([[-w / 2, 0], [w / 2, 0], [0, w * 0.45]]), d + 0.05), 'dark', { edgeAngle: 35 })
      c.position.y = H
      c.rotation.y = Math.PI / 2
      root.add(c)
    } else if (cap === 'chapeau') {
      const c = mk(new THREE.ConeGeometry(Math.max(w, d) * 0.75, 0.35, 4), 'dark', { edgeAngle: 35 })
      c.position.y = H + 0.4
      c.rotation.y = Math.PI / 4
      root.add(c)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const l = mk(new THREE.BoxGeometry(0.05, 0.25, 0.05), 'dark', { edgeAngle: 35 })
        l.position.set(sx * w * 0.4, H + 0.12, sz * d * 0.4)
        root.add(l)
      }
    } else {
      const n = Math.round(p.pots as number)
      for (let i = 0; i < n; i++) {
        const c = mk(cylinder(0.1, 0.13, 0.5, 16), 'roof', { edgeAngle: 40 })
        c.position.set(-w / 2 + (w * (i + 0.5)) / n, H + 0.25, 0)
        root.add(c)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Panneaux solaires
registerPart({
  type: 'house.solar',
  planHide: true,
  label: 'Panneaux solaires',
  category: 'toit',
  icon: '☀️',
  module: 'maison',
  followsParent: ['house.roof'],
  schema: [
    int('rows', 'Rangées', 2, [1, 12], { group: FO, level: 'easy' }),
    int('cols', 'Colonnes', 4, [1, 20], { group: FO, level: 'easy' }),
    pos('pw', 'Largeur d’un panneau', 1.0, [0.3, 3], { group: FO, unit: 'm' }),
    pos('ph', 'Hauteur d’un panneau', 1.65, [0.3, 3], { group: FO, unit: 'm' }),
    pos('gap', 'Espace entre panneaux', 0.03, [0, 0.3], { group: FO, unit: 'm' }),
    int('cells', 'Cellules par panneau', 3, [0, 8], { group: DE }),
    num('wing', 'Pan de toit', 0, [0, 3], { group: PO, step: 1, level: 'easy' }),
    choice('side', 'Versant', 'a', [['a', 'Versant A', '◀️'], ['b', 'Versant B', '▶️']], { group: PO, level: 'easy' }),
    num('v', 'Hauteur sur le versant', 0.5, [0.05, 0.95], { group: PO, step: 0.005 }),
    num('u', 'Décalage le long du faîtage', 0, [-12, 12], { group: PO, unit: 'm' }),
    num('tilt', 'Inclinaison (toit plat)', 30, [0, 70], { group: PO, step: 1, unit: '°', tip: 'Utilisée seulement sur un toit plat.' }),
  ],
  fit: (parent, own) => {
    const m = parent as RoofModel
    if (m?.kind !== 'roof') return {}
    const w = m.wings[Math.min(m.wings.length - 1, Math.round(own.wing as number))]
    if (!w) return {}
    const H = (own.rows as number) * ((own.ph as number) + (own.gap as number))
    if (w.pitch < 1) return { pos: [w.cx + (own.u as number), 0.25, w.cz] }
    return roofPlacement(w, own.side as string, own.v as number, own.u as number, H)
  },
  build: (p, ctx) => {
    const root = new THREE.Group()
    const rows = Math.round(p.rows as number)
    const cols = Math.round(p.cols as number)
    const pw = p.pw as number
    const ph = p.ph as number
    const gap = p.gap as number
    const flat = (ctx.parent as RoofModel | undefined)?.wings?.[0]?.pitch !== undefined && ((ctx.parent as RoofModel).wings[Math.min((ctx.parent as RoofModel).wings.length - 1, Math.round(p.wing as number))]?.pitch ?? 0) < 1
    const panels = new THREE.Group()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const g = new THREE.Group()
        const frame = mk(roundedBox(pw, 0.035, ph, 0.01), 'metal', { edgeAngle: 40 })
        g.add(frame)
        const glass = mk(new THREE.BoxGeometry(pw - 0.08, 0.01, ph - 0.08), 'dark', { edgeAngle: 40 })
        glass.position.y = 0.02
        g.add(glass)
        const cells = Math.round(p.cells as number)
        for (let i = 1; i <= cells; i++) {
          const l = mk(new THREE.BoxGeometry(0.008, 0.004, ph - 0.1), 'metal', { edgeAngle: 40 })
          l.position.set(-pw / 2 + (pw * i) / (cells + 1), 0.027, 0)
          g.add(l)
        }
        g.position.set((c - (cols - 1) / 2) * (pw + gap), 0, (r - (rows - 1) / 2) * (ph + gap))
        panels.add(g)
      }
    }
    // Les panneaux sont posés à plat dans le plan du repère local (Y = normale)
    panels.rotation.set(0, 0, 0)
    if (flat) {
      panels.rotation.x = -deg(p.tilt as number)
      panels.position.y = Math.sin(deg(p.tilt as number)) * (ph * rows) * 0.5
    } else {
      // repère de pose : Y vers le haut de la pente, Z normale → le plan du panneau est XY : on couche les panneaux
      panels.rotation.x = Math.PI / 2
    }
    root.add(panels)
    return root
  },
})

// ---------------------------------------------------------------- Piscine
registerPart({
  type: 'house.pool',
  handles: (p): Handle[] => [{ id: 'w', label: 'Longueur', position: [(p.w as number) / 2, 0.1, 0], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'd', label: 'Largeur', position: [0, 0.1, (p.d as number) / 2], axis: [0, 0, 1], param: 'd', ratio: 2 }],
  label: 'Piscine',
  category: 'jardin',
  icon: '🏊',
  module: 'maison',
  variants: [
    { id: 'rect', label: 'Rectangulaire', icon: '🏊', params: { shape: 'rect', w: 8, d: 4 } },
    { id: 'haricot', label: 'Haricot', icon: '🫘', params: { shape: 'haricot', w: 7, d: 4 } },
    { id: 'ronde', label: 'Ronde', icon: '⭕', params: { shape: 'ronde', w: 4.5, d: 4.5 } },
    { id: 'L', label: 'En L', icon: '🅻', params: { shape: 'L', w: 8, d: 5 } },
  ] as PartVariant[],
  schema: [
    choice('shape', 'Forme', 'rect', [['rect', 'Rectangle', '▭'], ['haricot', 'Haricot', '🫘'], ['ronde', 'Ronde', '⭕'], ['L', 'En L', '🅻']], { group: FO, level: 'easy' }),
    pos('w', 'Longueur', 8, [2, 30], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Largeur', 4, [2, 20], { group: FO, level: 'easy', unit: 'm' }),
    pos('depth', 'Profondeur apparente', 0.4, [0.1, 2], { group: FO, unit: 'm', tip: 'Distance entre le bord et l’eau.' }),
    pos('coping', 'Largeur de la margelle', 0.35, [0.05, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('copingT', 'Épaisseur de la margelle', 0.08, [0.02, 0.4], { group: DE, unit: 'm' }),
    int('ladder', 'Échelles', 1, [0, 4], { group: DE }),
    bool('steps', 'Marches d’angle', true, { group: DE }),
    bool('deckBand', 'Plage autour', true, { group: DE }),
    pos('deckW', 'Largeur de la plage', 1.2, [0.2, 4], { group: DE, unit: 'm', showIf: (p) => !!p.deckBand }),
  ],
  build: (p) => {
    const w = p.w as number
    const d = p.d as number
    const root = new THREE.Group()
    const outline = (rw: number, rd: number): [number, number][] => {
      switch (p.shape) {
        case 'ronde': return Array.from({ length: 48 }, (_, i) => [Math.cos((i / 48) * Math.PI * 2) * rw / 2, Math.sin((i / 48) * Math.PI * 2) * rd / 2] as [number, number])
        case 'haricot':
          return Array.from({ length: 56 }, (_, i) => {
            const a = (i / 56) * Math.PI * 2
            return [Math.cos(a) * rw / 2, Math.sin(a) * rd / 2 * (1 - 0.28 * Math.cos(a * 1) * Math.cos(a)) - 0.25 * rd * 0.35 * Math.cos(a) * Math.cos(a) * 0.0 + Math.sin(a * 1) * 0] as [number, number]
          }).map(([x, z]) => [x, z + (rd * 0.14) * Math.cos((x / (rw / 2)) * Math.PI * 0.9)] as [number, number])
        case 'L': return [[-rw / 2, -rd / 2], [rw / 2, -rd / 2], [rw / 2, 0], [-rw / 2 + rd * 0.6, 0], [-rw / 2 + rd * 0.6, rd / 2 + rd * 0.3], [-rw / 2, rd / 2 + rd * 0.3]]
        default: return [[-rw / 2, -rd / 2], [rw / 2, -rd / 2], [rw / 2, rd / 2], [-rw / 2, rd / 2]]
      }
    }
    const cp = p.coping as number
    const ct = p.copingT as number
    const inner = outline(w, d)
    const outer = outline(w + 2 * cp, d + 2 * cp)
    const toShape = (o: [number, number][], holes: [number, number][][] = []) => {
      const s = new THREE.Shape(o.map(([x, z]) => new THREE.Vector2(x, -z)))
      for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))))
      return s
    }
    // Margelle : anneau
    const ring = new THREE.ExtrudeGeometry(toShape(outer, [inner]), { depth: ct, bevelEnabled: false, curveSegments: 12 })
    ring.rotateX(-Math.PI / 2)
    root.add(mk(ring, 'wall', { edgeAngle: 30 }))
    // Cuve : parois et fond sous la margelle, eau
    const depth = p.depth as number
    const pit = new THREE.ExtrudeGeometry(toShape(inner), { depth: 1.2, bevelEnabled: false, curveSegments: 12 })
    pit.rotateX(-Math.PI / 2)
    pit.translate(0, -1.2 - 0.001, 0)
    root.add(mk(pit, 'water', { edgeAngle: 30, noOutline: false }))
    const water = new THREE.ShapeGeometry(toShape(inner), 12)
    water.rotateX(-Math.PI / 2)
    water.translate(0, -depth, 0)
    root.add(mk(water, 'water', { open: true, edgeAngle: 30 }))
    // Parois visibles entre la margelle et l'eau
    const wallsGeo = new THREE.ExtrudeGeometry(toShape(inner), { depth: depth, bevelEnabled: false, curveSegments: 12 })
    wallsGeo.rotateX(-Math.PI / 2)
    wallsGeo.translate(0, -depth, 0)
    root.add(mk(wallsGeo, 'water', { edgeAngle: 30 }))
    if (p.deckBand) {
      const dw = p.deckW as number
      const deck = new THREE.ExtrudeGeometry(toShape(outline(w + 2 * (cp + dw), d + 2 * (cp + dw)), [outer]), { depth: 0.04, bevelEnabled: false, curveSegments: 12 })
      deck.rotateX(-Math.PI / 2)
      deck.translate(0, -0.04 + ct * 0.5, 0)
      root.add(mk(deck, 'wood', { edgeAngle: 30 }))
    }
    const lad = Math.round(p.ladder as number)
    for (let i = 0; i < lad; i++) {
      const x = -w / 2 + (w * (i + 1)) / (lad + 1)
      for (const s of [-0.2, 0.2]) {
        const rail = mk(new THREE.TorusGeometry(0.2, 0.012, 8, 16, Math.PI), 'metal', { edgeAngle: 40 })
        rail.rotation.y = Math.PI / 2
        rail.position.set(x + s, ct + 0.2, d / 2 + 0.02)
        root.add(rail)
      }
    }
    if (p.steps && p.shape !== 'ronde') {
      for (let i = 0; i < 3; i++) {
        const st = mk(new THREE.BoxGeometry(1.0 - i * 0.22, 0.06, 1.0 - i * 0.22), 'wall', { edgeAngle: 40 })
        st.position.set(-w / 2 + 0.5 - 0.0, -depth + 0.03 + i * 0.12 - 0.12, -d / 2 + 0.5)
        st.position.y = -depth * (0.2 + 0.2 * (2 - i)) + 0.03
        root.add(st)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Clôture
registerPart({
  type: 'house.fence',
  handles: (p): Handle[] => [{ id: 'w', label: 'Longueur', position: [(p.w as number) / 2, (p.h as number), p.layout === 'ligne' ? 0 : -(p.d as number) / 2], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'h', label: 'Hauteur', position: [-(p.w as number) / 2, p.h as number, p.layout === 'ligne' ? 0 : -(p.d as number) / 2], axis: [0, 1, 0], param: 'h', ratio: 1 }],
  label: 'Clôture / mur',
  category: 'jardin',
  icon: '🚧',
  module: 'maison',
  variants: [
    { id: 'lattes', label: 'Lattes bois', icon: '🪵', params: { style: 'lattes' } },
    { id: 'barreaux', label: 'Barreaux', icon: '▥', params: { style: 'barreaux' } },
    { id: 'grillage', label: 'Grillage', icon: '🕸️', params: { style: 'grillage' } },
    { id: 'mur', label: 'Muret', icon: '🧱', params: { style: 'mur', h: 1.2 } },
    { id: 'palissade', label: 'Palissade', icon: '🏰', params: { style: 'palissade', h: 2 } },
  ] as PartVariant[],
  schema: [
    choice('layout', 'Disposition', 'rectangle', [['ligne', 'Une ligne', '➖'], ['rectangle', 'Tout autour', '⬜'], ['L', 'En L', '🅻']], { group: FO, level: 'easy' }),
    pos('w', 'Longueur', 20, [1, 60], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 16, [1, 60], { group: FO, level: 'easy', unit: 'm', showIf: (p) => p.layout !== 'ligne' }),
    pos('h', 'Hauteur', 1.1, [0.2, 4], { group: FO, level: 'easy', unit: 'm' }),
    choice('style', 'Style', 'lattes', [['lattes', 'Lattes', '🪵'], ['barreaux', 'Barreaux', '▥'], ['grillage', 'Grillage', '🕸️'], ['mur', 'Muret', '🧱'], ['palissade', 'Palissade', '🏰']], { group: FO, level: 'easy' }),
    pos('step', 'Écart entre poteaux', 2.0, [0.5, 6], { group: DE, unit: 'm' }),
    pos('slat', 'Largeur des lattes', 0.09, [0.02, 0.4], { group: DE, unit: 'm', showIf: (p) => p.style === 'lattes' || p.style === 'palissade' }),
    bool('gate', 'Portail / portillon', true, { group: DE, level: 'easy' }),
    pos('gateW', 'Largeur du portail', 1.2, [0.6, 6], { group: DE, unit: 'm', showIf: (p) => !!p.gate }),
    num('open', 'Portail ouvert', 0, [0, 1], { group: DE, step: 0.01, showIf: (p) => !!p.gate }),
  ],
  animate: { param: 'open', label: 'Portail', from: 0, to: 1 },
  build: (p) => {
    const root = new THREE.Group()
    const h = p.h as number
    const style = p.style as string
    const w = p.w as number
    const d = p.d as number
    const layout = p.layout as string
    const segs: [number, number, number, number][] =
      layout === 'ligne' ? [[-w / 2, 0, w / 2, 0]]
        : layout === 'L' ? [[-w / 2, d / 2, w / 2, d / 2], [-w / 2, d / 2, -w / 2, -d / 2]]
          : [[-w / 2, -d / 2, w / 2, -d / 2], [w / 2, -d / 2, w / 2, d / 2], [w / 2, d / 2, -w / 2, d / 2], [-w / 2, d / 2, -w / 2, -d / 2]]
    const gateIdx = layout === 'ligne' ? 0 : layout === 'L' ? 0 : 2
    segs.forEach(([x0, z0, x1, z1], si) => {
      const len = Math.hypot(x1 - x0, z1 - z0)
      const ang = Math.atan2(z1 - z0, x1 - x0)
      const g = new THREE.Group()
      g.position.set(x0, 0, z0)
      g.rotation.y = -ang
      const hasGate = !!p.gate && si === gateIdx
      const gw = hasGate ? (p.gateW as number) : 0
      const gStart = (len - gw) / 2
      const pieces: [number, number][] = hasGate ? [[0, gStart], [gStart + gw, len]] : [[0, len]]
      for (const [a, b] of pieces) {
        const L = b - a
        if (L < 0.05) continue
        const n = Math.max(1, Math.round(L / (p.step as number)))
        for (let i = 0; i <= n; i++) {
          const x = a + (L * i) / n
          const post = mk(new THREE.BoxGeometry(style === 'mur' ? 0.3 : 0.1, h * 1.05, style === 'mur' ? 0.3 : 0.1), style === 'mur' ? 'wall' : 'wood', { edgeAngle: 40 })
          post.position.set(x, h * 0.525, 0)
          g.add(post)
        }
        if (style === 'mur') {
          const m = mk(roundedBox(L, h * 0.9, 0.2, 0.01), 'wall', { edgeAngle: 40 })
          m.position.set((a + b) / 2, h * 0.45, 0)
          g.add(m)
          const cap = mk(roundedBox(L, 0.06, 0.28, 0.01), 'wall', { edgeAngle: 40 })
          cap.position.set((a + b) / 2, h * 0.9 + 0.03, 0)
          g.add(cap)
        } else if (style === 'grillage') {
          const m = mk(new THREE.BoxGeometry(L, h * 0.85, 0.01), 'glass', { edgeAngle: 40 })
          m.position.set((a + b) / 2, h * 0.5, 0)
          g.add(m)
          for (const y of [0.05, 0.95]) {
            const r = mk(new THREE.BoxGeometry(L, 0.03, 0.03), 'metal', { edgeAngle: 40 })
            r.position.set((a + b) / 2, h * y, 0)
            g.add(r)
          }
        } else {
          const sw = style === 'barreaux' ? 0.03 : (p.slat as number)
          const gapw = style === 'barreaux' ? 0.12 : style === 'palissade' ? 0.006 : sw * 1.1
          const n2 = Math.floor(L / (sw + gapw))
          const tone = style === 'barreaux' ? 'metal' : 'wood'
          for (let i = 0; i < n2; i++) {
            const lh = style === 'palissade' ? h * (0.92 + 0.08 * ((i * 7) % 3) / 2) : h * 0.95
            const sl = mk(new THREE.BoxGeometry(sw, lh, 0.025), tone, { edgeAngle: 40 })
            sl.position.set(a + (i + 0.5) * (sw + gapw), lh / 2 + 0.03, 0.04)
            g.add(sl)
          }
          for (const y of [0.2, 0.8]) {
            const r = mk(new THREE.BoxGeometry(L, 0.05, 0.04), tone, { edgeAngle: 40 })
            r.position.set((a + b) / 2, h * y, 0)
            g.add(r)
          }
        }
      }
      if (hasGate) {
        const leaf = new THREE.Group()
        leaf.name = 'gate'
        leaf.position.set(gStart, 0, 0)
        const panel = mk(new THREE.BoxGeometry(gw, h * 0.85, 0.05), style === 'barreaux' ? 'metal' : 'wood', { edgeAngle: 40 })
        panel.position.set(gw / 2, h * 0.5, 0)
        leaf.add(panel)
        const n3 = Math.max(2, Math.round(gw / 0.1))
        for (let i = 1; i < n3; i++) {
          const sl = mk(new THREE.BoxGeometry(0.015, h * 0.8, 0.06), 'dark', { edgeAngle: 40 })
          sl.position.set((gw * i) / n3, h * 0.5, 0)
          leaf.add(sl)
        }
        g.add(leaf)
      }
      root.add(g)
    })
    root.userData.pose = (r: THREE.Object3D, o: number) => {
      r.traverse((n) => {
        if (n.name === 'gate') n.rotation.y = -clamp(o, 0, 1) * 1.5
      })
    }
    root.userData.pose(root, p.open as number)
    return root
  },
})

// ---------------------------------------------------------------- Arbres
registerPart({
  type: 'house.tree',
  handles: (p): Handle[] => [{ id: 'c', label: 'Couronne', position: [p.crownR as number, (p.trunkH as number) + (p.crownR as number) * 0.6, 0], axis: [1, 0, 0], param: 'crownR', ratio: 1 }, { id: 't', label: 'Tronc', position: [0, p.trunkH as number, 0], axis: [0, 1, 0], param: 'trunkH', ratio: 1 }],
  label: 'Arbre',
  category: 'jardin',
  icon: '🌳',
  module: 'maison',
  variants: [
    { id: 'feuillu', label: 'Feuillu', icon: '🌳', params: { kind: 'feuillu' } },
    { id: 'conifere', label: 'Sapin', icon: '🌲', params: { kind: 'conifere', trunkH: 1, crownR: 1.4, height: 5 } },
    { id: 'palmier', label: 'Palmier', icon: '🌴', params: { kind: 'palmier', trunkH: 4.5, crownR: 1.6 } },
    { id: 'boule', label: 'Arbre boule', icon: '🟢', params: { kind: 'boule', trunkH: 1.6, crownR: 1.0 } },
    { id: 'peuplier', label: 'Peuplier', icon: '🌿', params: { kind: 'peuplier', trunkH: 1.5, crownR: 0.8, height: 8 } },
  ] as PartVariant[],
  schema: [
    choice('kind', 'Espèce', 'feuillu', [['feuillu', 'Feuillu', '🌳'], ['conifere', 'Sapin', '🌲'], ['palmier', 'Palmier', '🌴'], ['boule', 'Boule', '🟢'], ['peuplier', 'Peuplier', '🌿']], { group: FO, level: 'easy' }),
    pos('trunkH', 'Hauteur du tronc', 2.2, [0.3, 10], { group: FO, level: 'easy', unit: 'm' }),
    pos('trunkR', 'Épaisseur du tronc', 0.18, [0.03, 1], { group: FO, unit: 'm' }),
    pos('crownR', 'Largeur de la couronne', 1.8, [0.3, 8], { group: FO, level: 'easy', unit: 'm' }),
    pos('height', 'Hauteur totale (sapin, peuplier)', 5, [1, 25], { group: FO, unit: 'm', showIf: (p) => p.kind === 'conifere' || p.kind === 'peuplier' }),
    int('tiers', 'Étages (sapin)', 4, [2, 10], { group: DE, showIf: (p) => p.kind === 'conifere' }),
    int('blobs', 'Boules de feuillage', 7, [1, 20], { group: DE, showIf: (p) => p.kind === 'feuillu' }),
    int('fronds', 'Palmes', 9, [3, 20], { group: DE, showIf: (p) => p.kind === 'palmier' }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const th = p.trunkH as number
    const tr = p.trunkR as number
    const cr = p.crownR as number
    const kind = p.kind as string
    const leaf = (r: number, x: number, y: number, z: number) => {
      const m = mk(new THREE.SphereGeometry(r, 18, 12), 'green', { edgeAngle: 70 })
      m.position.set(x, y, z)
      root.add(m)
    }
    const trunk = (h: number, r0: number, r1: number) => {
      const t = mk(cylinder(r1, r0, h, 14), 'wood', { edgeAngle: 50 })
      t.position.y = h / 2
      root.add(t)
    }
    if (kind === 'conifere') {
      const H = p.height as number
      trunk(th, tr, tr * 0.8)
      const n = Math.round(p.tiers as number)
      for (let i = 0; i < n; i++) {
        const k = i / n
        const rr = cr * (1 - k * 0.8)
        const hh = (H - th) / n * 1.6
        const c = mk(new THREE.ConeGeometry(rr, hh, 18), 'green', { edgeAngle: 45 })
        c.position.y = th + (H - th) * k + hh / 2 - 0.1
        root.add(c)
      }
    } else if (kind === 'palmier') {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, th * 0.5, 0), new THREE.Vector3(0.6, th, 0))
      root.add(mk(new THREE.TubeGeometry(curve, 16, tr, 10), 'wood', { edgeAngle: 60 }))
      const n = Math.round(p.fronds as number)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const sh = new THREE.Shape()
        sh.moveTo(0, 0)
        sh.quadraticCurveTo(cr * 0.5, cr * 0.35, cr, -cr * 0.25)
        sh.quadraticCurveTo(cr * 0.5, cr * 0.1, 0, 0)
        const g = new THREE.ShapeGeometry(sh)
        const m = mk(g, 'green', { open: true, edgeAngle: 70 })
        const holder = new THREE.Group()
        holder.position.set(0.6, th, 0)
        holder.rotation.y = a
        m.rotation.y = 0
        holder.add(m)
        root.add(holder)
      }
    } else if (kind === 'peuplier') {
      const H = p.height as number
      trunk(th, tr, tr * 0.8)
      const g = new THREE.SphereGeometry(1, 20, 14)
      g.scale(cr, (H - th) / 2, cr)
      const m = mk(g, 'green', { edgeAngle: 70 })
      m.position.y = th + (H - th) / 2
      root.add(m)
    } else if (kind === 'boule') {
      trunk(th, tr, tr * 0.8)
      leaf(cr, 0, th + cr * 0.8, 0)
    } else {
      trunk(th, tr, tr * 0.7)
      const n = Math.round(p.blobs as number)
      leaf(cr * 0.62, 0, th + cr * 0.6, 0)
      for (let i = 0; i < n - 1; i++) {
        const a = (i / Math.max(1, n - 1)) * Math.PI * 2
        leaf(cr * 0.45, Math.cos(a) * cr * 0.65, th + cr * (0.35 + 0.18 * ((i * 5) % 3)), Math.sin(a) * cr * 0.65)
      }
    }
    return root
  },
})

registerPart({
  type: 'house.bush',
  handles: (p): Handle[] => [{ id: 'l', label: 'Longueur', position: [(p.len as number) / 2, (p.h as number) / 2, 0], axis: [1, 0, 0], param: 'len', ratio: 2 }, { id: 'h', label: 'Hauteur', position: [0, p.h as number, 0], axis: [0, 1, 0], param: 'h', ratio: 1 }],
  label: 'Haie / buisson',
  category: 'jardin',
  icon: '🌿',
  module: 'maison',
  schema: [
    choice('kind', 'Type', 'haie', [['haie', 'Haie', '🌿'], ['buisson', 'Buisson', '🟢'], ['fleurs', 'Massif de fleurs', '🌷']], { group: FO, level: 'easy' }),
    pos('len', 'Longueur', 4, [0.3, 30], { group: FO, level: 'easy', unit: 'm' }),
    pos('w', 'Largeur', 0.7, [0.1, 5], { group: FO, unit: 'm' }),
    pos('h', 'Hauteur', 1.1, [0.1, 4], { group: FO, level: 'easy', unit: 'm' }),
    pos('round', 'Arrondi', 0.25, [0.01, 1], { group: FO, unit: 'm', showIf: (p) => p.kind === 'haie' }),
    int('count', 'Nombre de fleurs / boules', 18, [3, 80], { group: DE, showIf: (p) => p.kind !== 'haie' }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const L = p.len as number
    const W = p.w as number
    const H = p.h as number
    if (p.kind === 'haie') {
      const m = mk(roundedBox(L, H, W, p.round as number), 'green', { edgeAngle: 60 })
      m.position.y = H / 2
      root.add(m)
    } else if (p.kind === 'buisson') {
      const n = Math.max(3, Math.round(p.count as number / 4))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const m = mk(new THREE.SphereGeometry(H * 0.45, 14, 10), 'green', { edgeAngle: 70 })
        m.position.set(Math.cos(a) * W * 0.5, H * 0.45, Math.sin(a) * W * 0.5)
        root.add(m)
      }
      const c = mk(new THREE.SphereGeometry(H * 0.55, 14, 10), 'green', { edgeAngle: 70 })
      c.position.y = H * 0.55
      root.add(c)
    } else {
      const bed = mk(roundedBox(L, 0.15, W, 0.04), 'wood', { edgeAngle: 40 })
      bed.position.y = 0.075
      root.add(bed)
      const n = Math.round(p.count as number)
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + ((i * 0.618) % 1) * L
        const z = -W / 2 + ((i * 0.381 + 0.13) % 1) * W
        const st = mk(cylinder(0.006, 0.006, H * 0.5, 5), 'green', { edgeAngle: 70 })
        st.position.set(x, 0.15 + H * 0.25, z)
        root.add(st)
        const f = mk(new THREE.SphereGeometry(0.045, 10, 8), 'red', { edgeAngle: 70 })
        f.position.set(x, 0.15 + H * 0.5, z)
        root.add(f)
      }
    }
    return root
  },
})

// ---------------------------------------------------------------- Jardin (pelouse, allée)
registerPart({
  type: 'house.ground',
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [(p.w as number) / 2, 0.1, 0], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'd', label: 'Profondeur', position: [0, 0.1, (p.d as number) / 2], axis: [0, 0, 1], param: 'd', ratio: 2 }],
  planHide: true,
  label: 'Terrain / jardin',
  category: 'jardin',
  icon: '🟩',
  module: 'maison',
  schema: [
    pos('w', 'Largeur', 30, [4, 120], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 24, [4, 120], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.3, [0.05, 2], { group: FO, unit: 'm' }),
    pos('border', 'Bordure', 0.15, [0, 0.6], { group: FO, unit: 'm' }),
    bool('path', 'Allée', true, { group: DE, level: 'easy' }),
    pos('pathW', 'Largeur de l’allée', 1.2, [0.4, 6], { group: DE, unit: 'm', showIf: (p) => !!p.path }),
    choice('pathStyle', 'Style d’allée', 'dalles', [['continue', 'Continue', '➖'], ['dalles', 'Pas japonais', '⬜'], ['pavee', 'Pavée', '🧱']], { group: DE, showIf: (p) => !!p.path }),
    num('pathX', 'Position de l’allée', 0, [-15, 15], { group: DE, unit: 'm', showIf: (p) => !!p.path }),
    pos('pathFrom', 'Début de l’allée (depuis la maison)', 8, [0, 40], { group: DE, unit: 'm', showIf: (p) => !!p.path }),
    bool('drive', 'Allée de garage', false, { group: DE }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const w = p.w as number
    const d = p.d as number
    const t = p.thick as number
    const lawn = mk(roundedBox(w, t, d, Math.min(0.03, t / 4)), 'green', { edgeAngle: 35 })
    lawn.position.y = -t / 2 - 0.002
    root.add(lawn)
    const b = p.border as number
    if (b > 0) {
      for (const [lx, lz, px, pz] of [[w, b, 0, d / 2 - b / 2], [w, b, 0, -d / 2 + b / 2], [b, d, w / 2 - b / 2, 0], [b, d, -w / 2 + b / 2, 0]] as [number, number, number, number][]) {
        const m = mk(new THREE.BoxGeometry(lx, 0.05, lz), 'wall', { edgeAngle: 40 })
        m.position.set(px, 0.025, pz)
        root.add(m)
      }
    }
    if (p.path) {
      const pw = p.pathW as number
      const z0 = d / 2 - (p.pathFrom as number)
      const len = d / 2 - b - z0
      if (len > 0.1) {
        const x = p.pathX as number
        if (p.pathStyle === 'continue') {
          const m = mk(new THREE.BoxGeometry(pw, 0.03, len), 'wall', { edgeAngle: 40 })
          m.position.set(x, 0.015, z0 + len / 2)
          root.add(m)
        } else {
          const sz = p.pathStyle === 'pavee' ? 0.3 : 0.6
          const n = Math.floor(len / (sz * 1.15))
          for (let i = 0; i < n; i++) {
            const m = mk(roundedBox(p.pathStyle === 'pavee' ? pw : pw * 0.8, 0.03, sz, 0.01), 'wall', { edgeAngle: 40 })
            m.position.set(x, 0.015, z0 + sz / 2 + i * sz * 1.15)
            root.add(m)
          }
        }
      }
    }
    if (p.drive) {
      const m = mk(new THREE.BoxGeometry(3.4, 0.03, 8), 'wall', { edgeAngle: 40 })
      m.position.set(-w / 4, 0.015, d / 2 - 4 - b)
      root.add(m)
    }
    return root
  },
})

// ---------------------------------------------------------------- Terrasse et pergola
registerPart({
  type: 'house.terrace',
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [(p.w as number) / 2, p.raise as number, (p.d as number) / 2], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'd', label: 'Profondeur', position: [0, p.raise as number, p.d as number], axis: [0, 0, 1], param: 'd', ratio: 1 }],
  label: 'Terrasse',
  category: 'jardin',
  icon: '🪵',
  module: 'maison',
  followsParent: ['house.volume'],
  schema: [
    ...wallFaceSchema(),
    pos('w', 'Largeur', 5, [1, 20], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 3, [0.5, 12], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.12, [0.03, 1], { group: FO, unit: 'm' }),
    pos('raise', 'Hauteur au-dessus du sol', 0.2, [0, 1.5], { group: FO, unit: 'm' }),
    pos('plank', 'Largeur des lames', 0.24, [0.05, 0.4], { group: DE, unit: 'm' }),
    bool('rail', 'Garde-corps', false, { group: DE }),
    bool('steps', 'Marches', true, { group: DE }),
  ],
  fit: (parent, own) => {
    const v = parent as HouseVolume
    if (v?.kind !== 'volume') return {}
    const r = v.onWall(own.face as Face, own.seg as number, own.u as number, 0)
    return r ? { pos: r.pos, rot: r.rot } : {}
  },
  build: (p) => {
    const w = p.w as number
    const d = p.d as number
    const t = p.thick as number
    const r = p.raise as number
    const root = new THREE.Group()
    const deck = mk(roundedBox(w, t, d, 0.01), 'wood', { edgeAngle: 40 })
    deck.position.set(0, r - t / 2 + t, d / 2)
    root.add(deck)
    const n = Math.floor(w / ((p.plank as number) + 0.01))
    for (let i = 1; i < n; i++) {
      const l = mk(new THREE.BoxGeometry(0.008, 0.006, d * 0.98), 'dark', { edgeAngle: 40 })
      l.position.set(-w / 2 + (w * i) / n, r + t + 0.003, d / 2)
      root.add(l)
    }
    const legs = mk(new THREE.BoxGeometry(w * 0.96, r, d * 0.96), 'dark', { edgeAngle: 40 })
    legs.position.set(0, r / 2, d / 2)
    if (r > 0.02) root.add(legs)
    if (p.steps && r > 0.05) {
      const s = mk(new THREE.BoxGeometry(Math.min(2, w * 0.4), r * 0.5, 0.3), 'wood', { edgeAngle: 40 })
      s.position.set(0, r * 0.25, d + 0.15)
      root.add(s)
    }
    if (p.rail) {
      for (const [lx, lz, px, pz] of [[w, 0.04, 0, d], [0.04, d, w / 2, d / 2], [0.04, d, -w / 2, d / 2]] as [number, number, number, number][]) {
        const top = mk(new THREE.BoxGeometry(lx, 0.04, lz), 'wood', { edgeAngle: 40 })
        top.position.set(px, r + t + 0.95, pz)
        root.add(top)
        const nn = Math.max(2, Math.round(Math.max(lx, lz) / 0.5))
        for (let i = 0; i <= nn; i++) {
          const k = -0.5 + i / nn
          const post = mk(new THREE.BoxGeometry(0.05, 0.95, 0.05), 'wood', { edgeAngle: 40 })
          post.position.set(lx > lz ? k * lx : px, r + t + 0.475, lx > lz ? pz : pz + k * lz)
          root.add(post)
        }
      }
    }
    return root
  },
})

registerPart({
  type: 'house.pergola',
  handles: (p): Handle[] => [{ id: 'w', label: 'Largeur', position: [(p.w as number) / 2, p.h as number, 0], axis: [1, 0, 0], param: 'w', ratio: 2 }, { id: 'd', label: 'Profondeur', position: [0, p.h as number, (p.d as number) / 2], axis: [0, 0, 1], param: 'd', ratio: 2 }, { id: 'h', label: 'Hauteur', position: [0, (p.h as number) + 0.3, 0], axis: [0, 1, 0], param: 'h', ratio: 1 }],
  label: 'Pergola / abri',
  category: 'jardin',
  icon: '⛱️',
  module: 'maison',
  schema: [
    choice('kind', 'Type', 'pergola', [['pergola', 'Pergola (lattes)', '⛱️'], ['abri', 'Abri voiture', '🚘'], ['auvent', 'Auvent plein', '🏕️']], { group: FO, level: 'easy' }),
    pos('w', 'Largeur', 4, [1, 15], { group: FO, level: 'easy', unit: 'm' }),
    pos('d', 'Profondeur', 3, [1, 15], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 2.6, [1.5, 6], { group: FO, level: 'easy', unit: 'm' }),
    pos('post', 'Section des poteaux', 0.12, [0.04, 0.5], { group: FO, unit: 'm' }),
    int('slats', 'Nombre de lattes', 6, [2, 40], { group: DE, showIf: (p) => p.kind === 'pergola' }),
    num('slope', 'Pente du toit', 5, [0, 30], { group: DE, step: 1, unit: '°', showIf: (p) => p.kind !== 'pergola' }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const w = p.w as number
    const d = p.d as number
    const h = p.h as number
    const s = p.post as number
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const post = mk(new THREE.BoxGeometry(s, h, s), 'wood', { edgeAngle: 40 })
      post.position.set(sx * (w / 2 - s / 2), h / 2, sz * (d / 2 - s / 2))
      root.add(post)
    }
    for (const sz of [-1, 1]) {
      const beam = mk(new THREE.BoxGeometry(w + 0.3, s * 1.2, s), 'wood', { edgeAngle: 40 })
      beam.position.set(0, h + s * 0.6, sz * (d / 2 - s / 2))
      root.add(beam)
    }
    if (p.kind === 'pergola') {
      const n = Math.round(p.slats as number)
      for (let i = 0; i < n; i++) {
        const sl = mk(new THREE.BoxGeometry(0.06, 0.07, d + 0.4), 'wood', { edgeAngle: 40 })
        sl.position.set(-w / 2 + (w * i) / Math.max(1, n - 1), h + s * 1.2 + 0.035, 0)
        root.add(sl)
      }
    } else {
      const roof = mk(roundedBox(w + 0.4, 0.1, d + 0.4, 0.02), p.kind === 'abri' ? 'roof' : 'wood', { edgeAngle: 40 })
      roof.position.set(0, h + s * 1.2 + 0.05, 0)
      roof.rotation.x = deg(p.slope as number) * 0
      root.add(roof)
    }
    return root
  },
})

// ---------------------------------------------------------------- Mobilier d'extérieur
registerPart({
  type: 'house.lamp',
  label: 'Lampadaire / boîte aux lettres',
  category: 'jardin',
  icon: '💡',
  module: 'maison',
  schema: [
    choice('kind', 'Type', 'lampadaire', [['lampadaire', 'Lampadaire', '🏮'], ['borne', 'Borne basse', '🔦'], ['boite', 'Boîte aux lettres', '📮']], { group: FO, level: 'easy' }),
    pos('h', 'Hauteur', 3.2, [0.3, 10], { group: FO, level: 'easy', unit: 'm' }),
    pos('head', 'Taille de la lampe', 0.35, [0.05, 1.5], { group: FO, unit: 'm' }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const h = p.h as number
    if (p.kind === 'boite') {
      const post = mk(cylinder(0.03, 0.03, 1.1, 10), 'metal', { edgeAngle: 40 })
      post.position.y = 0.55
      root.add(post)
      const box = mk(roundedBox(0.38, 0.28, 0.2, 0.05), 'red', { edgeAngle: 40 })
      box.position.y = 1.2
      root.add(box)
      const slot = mk(new THREE.BoxGeometry(0.2, 0.012, 0.01), 'dark', { edgeAngle: 40 })
      slot.position.set(0, 1.25, 0.105)
      root.add(slot)
      return root
    }
    if (p.kind === 'borne') {
      const b = mk(cylinder(0.08, 0.1, h * 0.3, 14), 'metal', { edgeAngle: 40 })
      b.position.y = h * 0.15
      root.add(b)
      const l = mk(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'light', { edgeAngle: 50 })
      l.position.y = h * 0.3
      root.add(l)
      return root
    }
    root.add(mk(cylinder(0.035, 0.05, h, 12), 'dark', { edgeAngle: 40 }))
    root.children[0].position.y = h / 2
    const hd = p.head as number
    const lamp = mk(new THREE.SphereGeometry(hd / 2, 16, 12), 'light', { edgeAngle: 60 })
    lamp.position.y = h + hd / 2
    root.add(lamp)
    const cap = mk(new THREE.ConeGeometry(hd * 0.65, hd * 0.35, 14), 'dark', { edgeAngle: 50 })
    cap.position.y = h + hd + hd * 0.1
    root.add(cap)
    return root
  },
})
void (null as unknown as ParamValues)
void (null as unknown as Handle)
