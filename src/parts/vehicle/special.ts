// Pièces spéciales : hélice, chenilles, benne de pick-up, caisson, citerne, attelage, grue.
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import type { Handle } from '@/core/types'
import { cylinder, cylinderX, cylinderZ, extrude, lathe, mk, roundPoly, roundedBox, shapeFromPts } from '@/parts/primitives/geo'
import { clamp, deg } from '@/utils/math'
import { asBody } from './util'

const FO = 'Forme'
const PO = 'Position'
const DE = 'Détails'

// ---------------------------------------------------------------- Hélice
registerPart({
  type: 'vehicule.propeller',
  handles: (p): Handle[] => [{ id: 'd', label: 'Diamètre', position: [0, (p.dia as number) / 2, 0], axis: [0, 1, 0], param: 'dia', ratio: 2 }],
  label: 'Hélice',
  category: 'special',
  icon: '🌀',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'avion', label: 'Avion (2 pales)', icon: '✈️', params: { blades: 2, dia: 1.8, bladeW: 0.14 } },
    { id: 'tri', label: '3 pales', icon: '🌀', params: { blades: 3, dia: 1.5, bladeW: 0.14 } },
    { id: 'multi', label: '6 pales', icon: '🛩️', params: { blades: 6, dia: 2.2, bladeW: 0.12 } },
    { id: 'ventilo', label: 'Ventilateur', icon: '🌬️', params: { blades: 5, dia: 0.8, bladeW: 0.16, spinner: 0.05 } },
  ],
  schema: [
    int('blades', 'Nombre de pales', 3, [2, 10], { group: FO, level: 'easy' }),
    pos('dia', 'Diamètre', 1.5, [0.2, 5], { group: FO, level: 'easy', unit: 'm' }),
    pos('bladeW', 'Largeur des pales', 0.14, [0.02, 0.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.018, [0.004, 0.1], { group: FO, unit: 'm' }),
    num('pitch', 'Pas (inclinaison des pales)', 25, [-60, 60], { group: FO, step: 1, unit: '°' }),
    num('taper', 'Affinement vers le bout', 0.6, [0, 1], { group: FO, step: 0.01 }),
    pos('hub', 'Diamètre du moyeu', 0.16, [0.02, 0.6], { group: DE, unit: 'm' }),
    pos('spinner', 'Longueur du cône', 0.25, [0, 1], { group: DE, unit: 'm' }),
    num('spin', 'Rotation', 0, [0, 360], { group: DE, step: 1, unit: '°' }),
    num('x', 'Position avant / arrière', 0.05, [-6, 6], { group: PO, unit: 'm', tip: 'Distance devant le nez (+).' }),
    pos('hgt', 'Hauteur', 0.6, [0, 4], { group: PO, level: 'easy', unit: 'm' }),
    num('lat', 'Décalage latéral', 0, [-4, 4], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    return { pos: [b.noseX(own.lat as number) + (own.x as number), own.hgt as number, own.lat as number] }
  },
  build: (p) => {
    const root = new THREE.Group()
    const n = Math.round(p.blades as number)
    const R = (p.dia as number) / 2
    const hub = (p.hub as number) / 2
    const bw = p.bladeW as number
    const tp = p.taper as number
    const t = p.thick as number
    const inner = new THREE.Group()
    inner.rotation.x = deg(p.spin as number)
    root.add(inner)
    // Pale : profil (rayon, corde) extrudé, tordu autour de l'axe radial
    const prof = roundPoly([[hub * 0.7, -bw * 0.45], [R * 0.3, -bw * 0.5], [R, -bw * 0.5 * (1 - tp)], [R, bw * 0.5 * (1 - tp)], [R * 0.3, bw * 0.5], [hub * 0.7, bw * 0.45]], 0.15, 2)
    for (let i = 0; i < n; i++) {
      const g = extrude(shapeFromPts(prof), t)
      // plan (r, corde) → Y radial, Z corde, extrusion sur X
      g.rotateY(Math.PI / 2)
      g.rotateZ(Math.PI / 2)
      const blade = mk(g, 'metal', { edgeAngle: 35 })
      const holder = new THREE.Group()
      holder.add(blade)
      blade.rotation.y = deg(p.pitch as number)
      holder.rotation.x = (i / n) * Math.PI * 2
      inner.add(holder)
    }
    inner.add(mk(cylinderX(hub, hub, 0.06, 24), 'dark', { edgeAngle: 40 }))
    const sp = p.spinner as number
    if (sp > 0.01) {
      const g = lathe([[0.001, sp], [hub * 0.35, sp * 0.85], [hub * 0.85, sp * 0.4], [hub, 0]], 28)
      g.rotateZ(-Math.PI / 2)
      g.translate(0.03, 0, 0)
      inner.add(mk(g, 'body', { edgeAngle: 50 }))
    }
    return root
  },
})

// ---------------------------------------------------------------- Chenilles
registerPart({
  type: 'vehicule.tracks',
  handles: (p): Handle[] => [{ id: 'l', label: 'Longueur', position: [(p.len as number) / 2, (p.h as number) / 2, p.lat as number], axis: [1, 0, 0], param: 'len', ratio: 2 }, { id: 'h', label: 'Hauteur', position: [0, p.h as number, p.lat as number], axis: [0, 1, 0], param: 'h', ratio: 1 }],
  label: 'Chenilles',
  category: 'special',
  icon: '⛓️',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    pos('len', 'Longueur', 3.0, [0.5, 12], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 0.9, [0.2, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('width', 'Largeur de la chenille', 0.5, [0.1, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    int('pads', 'Nombre de patins', 40, [8, 120], { group: FO, tip: 'Les barrettes de la chenille.' }),
    pos('padH', 'Hauteur des patins', 0.04, [0.005, 0.2], { group: FO, unit: 'm' }),
    int('wheels', 'Galets', 5, [0, 12], { group: DE }),
    pos('sprocket', 'Rayon du pignon / de la roue', 0.3, [0.05, 1.5], { group: DE, unit: 'm' }),
    num('lat', 'Distance au centre', 0.9, [0, 4], { group: PO, level: 'easy', unit: 'm' }),
    num('x', 'Position avant / arrière', 0, [-6, 6], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const L = (b.axleXs[0] - b.axleXs[b.axleXs.length - 1]) + b.wheelDia
    return { params: { len: Math.max(L, 0.5), h: b.wheelDia * 1.1, lat: b.hw(0) - (own.width as number) / 2 + 0.05 }, pos: [(b.axleXs[0] + b.axleXs[b.axleXs.length - 1]) / 2 + (own.x as number), 0, 0] }
  },
  build: (p) => {
    const L = p.len as number
    const H = p.h as number
    const W = p.width as number
    const r = H / 2
    const padH = p.padH as number
    const root = new THREE.Group()
    const side = new THREE.Group()
    side.position.set(0, r, p.lat as number)
    root.add(side)
    // Trajet en stade : deux demi-cercles reliés par des segments
    const half = Math.max(0, L / 2 - r)
    const pathPt = (s: number): { pos: THREE.Vector2; ang: number } => {
      const per = 2 * half * 2 + 2 * Math.PI * r
      let d = (s % 1) * per
      // dessus (de l'arrière vers l'avant)
      if (d < 2 * half) return { pos: new THREE.Vector2(-half + d, r), ang: 0 }
      d -= 2 * half
      const arc = Math.PI * r
      if (d < arc) {
        const a = Math.PI / 2 - d / r
        return { pos: new THREE.Vector2(half + Math.cos(a) * r, Math.sin(a) * r), ang: a - Math.PI / 2 }
      }
      d -= arc
      if (d < 2 * half) return { pos: new THREE.Vector2(half - d, -r), ang: Math.PI }
      d -= 2 * half
      const a = -Math.PI / 2 - d / r
      return { pos: new THREE.Vector2(-half + Math.cos(a) * r, Math.sin(a) * r), ang: a - Math.PI / 2 }
    }
    const n = Math.round(p.pads as number)
    const perim = 4 * half + 2 * Math.PI * r
    const padLen = (perim / n) * 0.9
    for (let i = 0; i < n; i++) {
      const { pos, ang } = pathPt(i / n)
      const m = mk(roundedBox(padLen, padH, W, Math.min(padH, padLen) * 0.3), 'dark', { edgeAngle: 40 })
      m.position.set(pos.x, pos.y, 0)
      m.rotation.z = ang
      side.add(m)
    }
    const sr = Math.min(p.sprocket as number, r - padH)
    for (const x of [-half, half]) {
      const w = mk(cylinderZ(sr, sr, W * 0.85, 28), 'metal', { edgeAngle: 40 })
      w.position.x = x
      side.add(w)
    }
    const k = Math.round(p.wheels as number)
    for (let i = 0; i < k; i++) {
      const x = k === 1 ? 0 : -half + (2 * half * i) / (k - 1)
      const w = mk(cylinderZ(r * 0.34, r * 0.34, W * 0.8, 20), 'metal', { edgeAngle: 40 })
      w.position.set(x, -r + padH + r * 0.34, 0)
      side.add(w)
    }
    return root
  },
})

// ---------------------------------------------------------------- Benne de pick-up
registerPart({
  type: 'vehicule.bed',
  label: 'Benne',
  category: 'special',
  icon: '🛻',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  animate: { param: 'gate', label: 'Hayon', from: 0, to: 1 },
  schema: [
    pos('len', 'Longueur', 1.6, [0.3, 6], { group: FO, level: 'easy', unit: 'm' }),
    pos('w', 'Largeur', 1.7, [0.3, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('wall', 'Hauteur des bords', 0.4, [0.05, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur des parois', 0.05, [0.01, 0.2], { group: FO, unit: 'm' }),
    num('gate', 'Hayon ouvert', 0, [0, 1], { group: FO, level: 'easy', step: 0.01 }),
    bool('ribs', 'Nervures du plancher', true, { group: DE }),
    bool('cover', 'Bâche fermée', false, { group: DE }),
    bool('arch', 'Arceau', false, { group: DE }),
    num('x', 'Décalage avant / arrière', 0, [-3, 3], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const front = b.xRearBase
    const back = b.tailX(0)
    return { params: { len: Math.max(0.3, front - back - 0.05), w: Math.max(0.3, 2 * b.hw((front + back) / 2) * 0.9) }, pos: [(front + back) / 2 + (own.x as number), b.deckY((front + back) / 2) - 0.02, 0] }
  },
  build: (p) => {
    const L = p.len as number
    const W = p.w as number
    const H = p.wall as number
    const t = p.thick as number
    const root = new THREE.Group()
    const floor = mk(roundedBox(L, t * 0.6, W, 0.01), 'dark', { edgeAngle: 40 })
    floor.position.y = t * 0.3
    root.add(floor)
    const wallZ = (s: number) => {
      const w = mk(roundedBox(L, H, t, 0.01), 'body', { edgeAngle: 40 })
      w.position.set(0, H / 2, s * (W / 2 - t / 2))
      root.add(w)
    }
    wallZ(1)
    wallZ(-1)
    const front = mk(roundedBox(t, H, W - 2 * t, 0.01), 'body', { edgeAngle: 40 })
    front.position.set(L / 2 - t / 2, H / 2, 0)
    root.add(front)
    // Hayon articulé en bas
    const gate = new THREE.Group()
    gate.name = 'pivot'
    gate.position.set(-L / 2 + t / 2, 0, 0)
    const g = mk(roundedBox(t, H, W - 2 * t, 0.01), 'body', { edgeAngle: 40 })
    g.position.y = H / 2
    gate.add(g)
    root.add(gate)
    root.userData.pose = (r: THREE.Object3D, o: number) => {
      const pv = r.getObjectByName('pivot')
      if (pv) pv.rotation.z = clamp(o, 0, 1) * (Math.PI / 2) * 0.98
    }
    root.userData.pose(root, p.gate as number)
    if (p.ribs) {
      const n = Math.max(2, Math.round(L / 0.2))
      for (let i = 0; i < n; i++) {
        const r = mk(new THREE.BoxGeometry(0.03, 0.012, W - 2 * t), 'dark', { edgeAngle: 40 })
        r.position.set(-L / 2 + (L * (i + 0.5)) / n, t * 0.6 + 0.006, 0)
        root.add(r)
      }
    }
    if (p.cover) {
      const c = mk(roundedBox(L - t, 0.03, W - 2 * t, 0.012), 'dark', { edgeAngle: 40 })
      c.position.set(0, H + 0.02, 0)
      root.add(c)
    }
    if (p.arch) {
      for (const s of [-1, 1]) {
        const bar = mk(cylinderZ(0.02, 0.02, 0.02, 8), 'metal', { edgeAngle: 40 })
        bar.position.set(L / 2 - 0.1, H + 0.2, s * (W / 2 - 0.05))
        root.add(bar)
      }
      const tube = mk(cylinderZ(0.022, 0.022, W - 0.1, 12), 'metal', { edgeAngle: 40 })
      tube.position.set(L / 2 - 0.1, H + 0.4, 0)
      root.add(tube)
      for (const s of [-1, 1]) {
        const v = mk(cylinder(0.022, 0.022, 0.4, 12), 'metal', { edgeAngle: 40 })
        v.position.set(L / 2 - 0.1, H + 0.2, s * (W / 2 - 0.05))
        root.add(v)
      }
    }
    return root
  },
  handles: (p): Handle[] => [{ id: 'l', label: 'Longueur', position: [-(p.len as number) / 2, 0.05, 0], axis: [-1, 0, 0], param: 'len', ratio: 2 }],
})

// ---------------------------------------------------------------- Caisson / remorque / citerne
registerPart({
  type: 'vehicule.cargo',
  handles: (p): Handle[] => [{ id: 'l', label: 'Longueur', position: [(p.len as number) / 2, (p.h as number) / 2, 0], axis: [1, 0, 0], param: 'len', ratio: 2 }, { id: 'w', label: 'Largeur', position: [0, (p.h as number) / 2, (p.w as number) / 2], axis: [0, 0, 1], param: 'w', ratio: 2 }, { id: 'h', label: 'Hauteur', position: [0, (p.h as number) + 0.05, 0], axis: [0, 1, 0], param: 'h', ratio: 1 }],
  label: 'Caisson de camion',
  category: 'special',
  icon: '📦',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  variants: [
    { id: 'caisson', label: 'Fourgon', icon: '📦', params: { kind: 'caisson' } },
    { id: 'citerne', label: 'Citerne', icon: '🛢️', params: { kind: 'citerne' } },
    { id: 'plateau', label: 'Plateau', icon: '🪵', params: { kind: 'plateau' } },
    { id: 'benne', label: 'Benne', icon: '🏗️', params: { kind: 'benne' } },
  ],
  animate: { param: 'tip', label: 'Basculer', from: 0, to: 1 },
  schema: [
    choice('kind', 'Type', 'caisson', [['caisson', 'Caisson', '📦'], ['citerne', 'Citerne', '🛢️'], ['plateau', 'Plateau', '🪵'], ['benne', 'Benne basculante', '🏗️']], { group: FO, level: 'easy' }),
    pos('len', 'Longueur', 5, [0.5, 14], { group: FO, level: 'easy', unit: 'm' }),
    pos('w', 'Largeur', 2.4, [0.5, 3.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('h', 'Hauteur', 2.4, [0.1, 5], { group: FO, level: 'easy', unit: 'm' }),
    pos('round', 'Arrondi', 0.08, [0, 1], { group: FO, unit: 'm' }),
    int('ribs', 'Nervures', 6, [0, 20], { group: DE, showIf: (p) => p.kind === 'caisson' || p.kind === 'benne' }),
    int('bands', 'Cerclages', 4, [0, 12], { group: DE, showIf: (p) => p.kind === 'citerne' }),
    bool('door', 'Porte arrière', true, { group: DE, showIf: (p) => p.kind === 'caisson' }),
    num('tip', 'Bascule', 0, [0, 1], { group: FO, level: 'easy', step: 0.01, showIf: (p) => p.kind === 'benne' }),
    num('x', 'Décalage avant / arrière', 0, [-4, 4], { group: PO, unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const front = b.xRearBase - 0.1
    const back = b.tailX(0) + 0.02
    const len = Math.max(0.5, front - back)
    const xm = (front + back) / 2 + (own.x as number)
    return { params: { len, w: b.W * 0.98 }, pos: [xm, b.tail + 0.02, 0] }
  },
  build: (p) => {
    const L = p.len as number
    const W = p.w as number
    const H = p.h as number
    const root = new THREE.Group()
    const kind = p.kind as string
    if (kind === 'citerne') {
      const r = Math.min(W, H) / 2
      const g = cylinderX(r, r, L, 40)
      const tank = mk(g, 'metal', { edgeAngle: 50 })
      tank.position.y = r + 0.1
      root.add(tank)
      for (const s of [-1, 1]) {
        const cap = new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2)
        cap.scale(0.35 * r / r, 1, 1)
        cap.rotateZ(-s * Math.PI / 2)
        cap.scale(1, 1, 1)
        const c = mk(cap, 'metal', { edgeAngle: 50 })
        c.position.set(s * L / 2, r + 0.1, 0)
        root.add(c)
      }
      const n = Math.round(p.bands as number)
      for (let i = 0; i < n; i++) {
        const band = mk(cylinderX(r * 1.015, r * 1.015, 0.05, 40), 'dark', { edgeAngle: 50 })
        band.position.set(-L / 2 + (L * (i + 1)) / (n + 1), r + 0.1, 0)
        root.add(band)
      }
      const hatch = mk(cylinder(0.25, 0.25, 0.08, 20), 'dark', { edgeAngle: 40 })
      hatch.position.set(0, 2 * r + 0.1, 0)
      root.add(hatch)
      return root
    }
    if (kind === 'plateau') {
      const f = mk(roundedBox(L, 0.12, W, 0.02), 'body', { edgeAngle: 40 })
      f.position.y = 0.06
      root.add(f)
      const rail = H > 0.15 ? Math.min(H, 0.5) : 0.2
      for (const s of [-1, 1]) {
        const w = mk(roundedBox(L, rail, 0.04, 0.01), 'body', { edgeAngle: 40 })
        w.position.set(0, rail / 2 + 0.12, s * (W / 2 - 0.02))
        root.add(w)
      }
      return root
    }
    const pivot = new THREE.Group()
    pivot.name = 'pivot'
    pivot.position.set(-L / 2, 0, 0)
    const box = mk(roundedBox(L, H, W, p.round as number), 'body', { edgeAngle: 40 })
    box.position.set(L / 2, H / 2 + 0.05, 0)
    pivot.add(box)
    const n = Math.round(p.ribs as number)
    for (let i = 0; i < n; i++) {
      const rib = mk(new THREE.BoxGeometry(0.04, H * 0.96, W * 1.01), 'body', { edgeAngle: 40 })
      rib.position.set((L * (i + 1)) / (n + 1), H / 2 + 0.05, 0)
      pivot.add(rib)
    }
    if (kind === 'caisson' && p.door) {
      const d = mk(new THREE.BoxGeometry(0.03, H * 0.9, W * 0.92), 'dark', { edgeAngle: 40 })
      d.position.set(0.01, H / 2 + 0.05, 0)
      pivot.add(d)
    }
    root.add(pivot)
    root.userData.pose = (r: THREE.Object3D, o: number) => {
      const pv = r.getObjectByName('pivot')
      if (pv) pv.rotation.z = kind === 'benne' ? clamp(o, 0, 1) * 0.9 : 0
    }
    root.userData.pose(root, p.tip as number)
    return root
  },
})

// ---------------------------------------------------------------- Attelage
registerPart({
  type: 'vehicule.hitch',
  label: 'Attelage',
  category: 'special',
  icon: '🔗',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    pos('len', 'Longueur', 0.3, [0.05, 1.5], { group: FO, level: 'easy', unit: 'm' }),
    pos('ball', 'Taille de la boule', 0.025, [0.01, 0.1], { group: FO, unit: 'm' }),
    pos('hgt', 'Hauteur', 0.45, [0.1, 2], { group: PO, level: 'easy', unit: 'm' }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    return { pos: [b.tailX(0), own.hgt as number, 0] }
  },
  build: (p) => {
    const L = p.len as number
    const r = p.ball as number
    const root = new THREE.Group()
    const bar = mk(roundedBox(L, 0.05, 0.05, 0.01), 'metal', { edgeAngle: 40 })
    bar.position.x = -L / 2
    root.add(bar)
    const neck = mk(cylinder(r * 0.5, r * 0.5, r * 2, 12), 'metal', { edgeAngle: 40 })
    neck.position.set(-L, r, 0)
    root.add(neck)
    const ball = mk(new THREE.SphereGeometry(r, 16, 12), 'metal', { edgeAngle: 60 })
    ball.position.set(-L, r * 2.4, 0)
    root.add(ball)
    return root
  },
})

// ---------------------------------------------------------------- Grue / bras
registerPart({
  type: 'vehicule.crane',
  handles: (p): Handle[] => [{ id: 'm', label: 'Mât', position: [0, (p.base as number) + 0.06, 0], axis: [0, 1, 0], param: 'base', ratio: 1 }],
  label: 'Grue / bras articulé',
  category: 'special',
  icon: '🏗️',
  module: 'vehicule',
  followsParent: ['vehicule.chassis'],
  schema: [
    pos('base', 'Hauteur du mât', 0.6, [0.1, 3], { group: FO, level: 'easy', unit: 'm' }),
    pos('l1', 'Longueur du bras 1', 3, [0.5, 12], { group: FO, level: 'easy', unit: 'm' }),
    pos('l2', 'Longueur du bras 2', 2.4, [0, 10], { group: FO, level: 'easy', unit: 'm' }),
    pos('thick', 'Épaisseur', 0.22, [0.05, 0.8], { group: FO, unit: 'm' }),
    num('a1', 'Angle du bras 1', 50, [0, 90], { group: FO, level: 'easy', step: 1, unit: '°' }),
    num('a2', 'Angle du bras 2', -30, [-170, 90], { group: FO, step: 1, unit: '°' }),
    num('swing', 'Rotation de la grue', 0, [-180, 180], { group: FO, step: 1, unit: '°' }),
    bool('hook', 'Crochet et câble', true, { group: DE }),
    num('along', 'Position sur le châssis', 0.6, [0, 1.2], { group: PO, level: 'easy', step: 0.005 }),
  ],
  fit: (parent, own) => {
    const b = asBody(parent)
    if (!b) return {}
    const x = b.xRoofRear + (b.tailX(0) - b.xRoofRear) * (own.along as number)
    return { pos: [x, b.deckY(x), 0] }
  },
  build: (p) => {
    const t = p.thick as number
    const root = new THREE.Group()
    const turret = new THREE.Group()
    turret.rotation.y = deg(p.swing as number)
    root.add(turret)
    turret.add(mk(cylinder(t * 1.4, t * 1.6, 0.12, 24), 'dark', { edgeAngle: 40 }))
    const mast = mk(roundedBox(t, p.base as number, t, 0.02), 'body', { edgeAngle: 40 })
    mast.position.y = (p.base as number) / 2 + 0.06
    turret.add(mast)
    const joint = new THREE.Group()
    joint.position.y = (p.base as number) + 0.06
    turret.add(joint)
    const a1 = deg(p.a1 as number)
    const arm1 = new THREE.Group()
    arm1.rotation.z = a1
    joint.add(arm1)
    const b1 = mk(roundedBox(p.l1 as number, t * 0.8, t * 0.8, 0.02), 'body', { edgeAngle: 40 })
    b1.position.x = (p.l1 as number) / 2
    arm1.add(b1)
    const elbow = new THREE.Group()
    elbow.position.x = p.l1 as number
    elbow.rotation.z = deg(p.a2 as number)
    arm1.add(elbow)
    if ((p.l2 as number) > 0.05) {
      const b2 = mk(roundedBox(p.l2 as number, t * 0.6, t * 0.6, 0.02), 'body', { edgeAngle: 40 })
      b2.position.x = (p.l2 as number) / 2
      elbow.add(b2)
    }
    elbow.add(mk(cylinderZ(t * 0.45, t * 0.45, t * 0.9, 20), 'metal', { edgeAngle: 40 }))
    if (p.hook) {
      const tip = new THREE.Group()
      tip.position.x = p.l2 as number
      elbow.add(tip)
      const rope = mk(cylinder(0.008, 0.008, 1.0, 6), 'dark', { edgeAngle: 40 })
      rope.position.y = -0.5
      tip.add(rope)
      const hk = mk(new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI * 1.4), 'metal', { edgeAngle: 50 })
      hk.position.y = -1.05
      tip.add(hk)
      // le câble reste vertical : on contre-tourne
      tip.rotation.z = -(a1 + deg(p.a2 as number))
    }
    return root
  },
})
void lathe
