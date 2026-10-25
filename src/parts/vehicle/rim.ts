// Jante et pneu paramétriques : branches de 9 formes, creux, bords, boulons, disque de frein.
import * as THREE from 'three'
import type { ParamValues } from '@/core/types'
import { cylinderZ, extrude, lathe, mergeGeos, mk, xf } from '@/parts/primitives/geo'
import { clamp } from '@/utils/math'

const n = (p: ParamValues, k: string): number => p[k] as number

/** Polygone d'une ligne épaissie (largeur variable) autour d'une polyligne. */
function thickLine(pts: [number, number][], width: (t: number) => number): [number, number][] {
  const L: [number, number][] = []
  const R: [number, number][] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    let dx = b[0] - a[0]
    let dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    dx /= l
    dy /= l
    const w = width(i / (pts.length - 1)) / 2
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w])
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w])
  }
  return [...L, ...R.reverse()]
}

const shapeOf = (poly: [number, number][]): THREE.Shape => new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)))

/** Centre de ligne d'une branche : du rayon a au rayon b, avec torsion (rad) en t^power. */
function spokeLine(a: number, b: number, twist: number, power = 1, steps = 14): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = a + (b - a) * t
    const ph = twist * Math.pow(t, power)
    out.push([r * Math.cos(ph), r * Math.sin(ph)])
  }
  return out
}

/** Géométrie d'UNE branche (plan XY, dirigée vers +X) selon la forme choisie. */
function oneSpoke(p: ParamValues, a: number, b: number, depth: number): THREE.BufferGeometry[] {
  const w = n(p, 'spokeWidth')
  const tw = (n(p, 'spokeTwist') * Math.PI) / 180
  const shape = p.spokeShape as string
  const polys: [number, number][][] = []
  switch (shape) {
    case 'droite':
      polys.push(thickLine(spokeLine(a, b, 0, 1, 2), (t) => w * (1 - 0.35 * t * n(p, 'spokeTaper'))))
      break
    case 'courbe':
      polys.push(thickLine(spokeLine(a, b, tw || 0.5, 1.4), (t) => w * (1 - 0.3 * t * n(p, 'spokeTaper'))))
      break
    case 'spirale':
      polys.push(thickLine(spokeLine(a, b, (tw || 0.5) * 2.2, 1.1, 22), (t) => w * (1 - 0.4 * t * n(p, 'spokeTaper'))))
      break
    case 'y': {
      const split = a + (b - a) * 0.5
      polys.push(thickLine(spokeLine(a, split, 0, 1, 3), () => w * 1.15))
      const spread = 0.28 + Math.abs(tw) * 0.2
      for (const s of [-1, 1]) {
        const pts: [number, number][] = []
        for (let i = 0; i <= 8; i++) {
          const t = i / 8
          const r = split + (b - split) * t
          pts.push([r, s * spread * (b - split) * t * 0.55])
        }
        polys.push(thickLine(pts, () => w * 0.8))
      }
      break
    }
    case 'double': {
      const g = w * 0.75
      for (const s of [-1, 1]) {
        const pts = spokeLine(a, b, 0, 1, 2).map(([x, y]) => [x, y + s * g] as [number, number])
        polys.push(thickLine(pts, () => w * 0.55))
      }
      break
    }
    case 'etoile':
      polys.push(thickLine(spokeLine(a, b, 0, 1, 2), (t) => w * (2.4 - 2.1 * t * (0.5 + 0.5 * n(p, 'spokeTaper')))))
      break
    case 'turbine':
      polys.push(thickLine(spokeLine(a, b, (tw || 0.7) * 1.5, 2, 18), (t) => w * (0.5 + 1.1 * t)))
      break
    case 'grille': {
      polys.push(thickLine(spokeLine(a, b, 0, 1, 2), () => w * 0.6))
      break
    }
    default:
      polys.push(thickLine(spokeLine(a, b, 0, 1, 2), () => w))
  }
  return polys.map((pl) => extrude(shapeOf(pl), depth))
}

/** Roue complète : pneu + jante. Axe = Z, face extérieure vers +Z, centrée à l'origine. */
export function buildWheel(p: ParamValues): THREE.Group {
  const D = n(p, 'tireDia')
  const w = n(p, 'tireWidth')
  const R = D / 2
  const sideH = clamp(w * n(p, 'profile'), 0.005, R * 0.85)
  const rimR = (R - sideH) * n(p, 'rimAdjust')
  const shoulder = clamp((n(p, 'shoulder') * w) / 2, 0.003, Math.min(w / 2.2, sideH * 0.95))
  const bulge = n(p, 'bulge')

  const group = new THREE.Group()

  // ---------- Pneu : solide de révolution + sculpture ----------
  const prof: [number, number][] = []
  const NSW = 6
  const yBead = w * 0.4
  prof.push([rimR, yBead])
  for (let i = 1; i <= NSW; i++) {
    const t = i / NSW
    prof.push([rimR + (R - shoulder - rimR) * t, yBead + (w / 2 - yBead) * t + bulge * Math.sin(Math.PI * t)])
  }
  for (let i = 1; i <= 5; i++) {
    const a = ((i / 5) * Math.PI) / 2
    prof.push([R - shoulder + shoulder * Math.sin(a), w / 2 - shoulder + shoulder * Math.cos(a)])
  }
  const treadStart = prof.length
  const NT = 24
  const treadY: number[] = []
  for (let i = 1; i < NT; i++) {
    const y = w / 2 - shoulder - ((w - 2 * shoulder) * i) / NT
    prof.push([R, y])
    treadY.push(y / ((w - 2 * shoulder) / 2))
  }
  const treadEnd = prof.length
  for (let i = 0; i <= 5; i++) {
    const a = Math.PI / 2 - ((i / 5) * Math.PI) / 2
    prof.push([R - shoulder + shoulder * Math.sin(a), -(w / 2 - shoulder + shoulder * Math.cos(a))])
  }
  for (let i = NSW; i >= 0; i--) {
    const t = i / NSW
    prof.push([rimR + (R - shoulder - rimR) * t, -(yBead + (w / 2 - yBead) * t + bulge * Math.sin(Math.PI * t))])
  }
  prof.push([rimR - 0.012, -yBead], [rimR - 0.012, yBead], [rimR, yBead])
  const treadType = p.tread as string
  const count = Math.max(4, Math.round(n(p, 'treadCount')))
  const SEG = treadType === 'lisse' || treadType === 'rainures' ? 72 : clamp(count * 6, 96, 480)
  // Le profil est parcouru du haut vers le bas de la bande de roulement : on l'inverse pour que les faces regardent vers l'extérieur
  prof.reverse()
  const tireGeo = lathe(prof, SEG)
  const depth = n(p, 'treadDepth')
  if (treadType !== 'lisse' && depth > 0) {
    const pos = tireGeo.getAttribute('position') as THREE.BufferAttribute
    const np = prof.length
    const tStart = np - treadEnd
    const tEnd = np - treadStart
    const inGroove = (th: number, yn: number): boolean => {
      const ay = Math.abs(yn)
      switch (treadType) {
        case 'rainures':
          return Math.sin(yn * Math.PI * 2.5) > 0.82 && ay < 0.92
        case 'blocs':
          return Math.sin(th * count) > 0.4
        case 'chevron':
          return Math.sin(th * count + ay * 5.5) > 0.45 && ay > 0.08
        case 'cross':
          return ay > 0.3 && Math.sin(th * count + (yn > 0 ? 0 : Math.PI)) > 0.1
        case 'neige':
          return Math.sin(th * count * 1.6 + yn * 3) > 0.62 && ay < 0.94
        default:
          return false
      }
    }
    for (let i = 0; i <= SEG; i++) {
      const th = (i / SEG) * Math.PI * 2
      for (let j = tStart; j < tEnd; j++) {
        if (!inGroove(th, treadY[np - 1 - j - treadStart])) continue
        const idx = i * np + j
        const x = pos.getX(idx)
        const z = pos.getZ(idx)
        const k = (R - depth) / R
        pos.setX(idx, x * k)
        pos.setZ(idx, z * k)
      }
    }
    pos.needsUpdate = true
    tireGeo.computeVertexNormals()
  }
  tireGeo.rotateX(Math.PI / 2)
  group.add(mk(tireGeo, 'dark', { edgeAngle: treadType === 'lisse' ? 50 : 30 }))

  // ---------- Jante ----------
  const rimW = Math.max(0.02, w * n(p, 'rimWidth'))
  const lip = Math.max(0.008, n(p, 'rimLip'))
  const zFace = rimW / 2 // plan de la face extérieure
  const concave = clamp(n(p, 'rimDepth'), -0.1, rimW * 1.2)
  const zPlate = zFace - concave
  const r1 = Math.max(0.02, rimR - lip)
  const barrel = lathe(
    [
      [rimR, -rimW / 2],
      [rimR, rimW / 2],
      [r1, rimW / 2],
      [r1, -rimW / 2],
      [rimR, -rimW / 2],
    ],
    64,
  )
  barrel.rotateX(Math.PI / 2)
  group.add(mk(barrel, 'metal', { edgeAngle: 40 }))

  const hubR = clamp(n(p, 'hubDia') / 2, 0.01, r1 * 0.9)
  const thick = Math.max(0.006, n(p, 'spokeThick'))
  const count2 = Math.max(2, Math.round(n(p, 'spokeCount')))
  const shape = p.spokeShape as string
  const spokeGeos: THREE.BufferGeometry[] = []
  if (shape === 'pleine') {
    const disc = new THREE.Shape()
    disc.absarc(0, 0, r1 * 0.995, 0, Math.PI * 2, false)
    const holes = Math.round(n(p, 'holeCount'))
    const hr = n(p, 'holeSize') * r1
    for (let i = 0; i < holes; i++) {
      const a = (i / holes) * Math.PI * 2
      const h = new THREE.Path()
      h.absarc(Math.cos(a) * r1 * 0.62, Math.sin(a) * r1 * 0.62, hr, 0, Math.PI * 2, true)
      disc.holes.push(h)
    }
    spokeGeos.push(extrude(disc, thick))
  } else {
    const proto = oneSpoke(p, hubR * 0.7, r1 * 0.99, thick)
    for (let i = 0; i < count2; i++) {
      for (const g of proto) spokeGeos.push(xf(g, 0, 0, 0, 0, 0, (360 * i) / count2))
    }
    if (shape === 'grille') {
      const ring = new THREE.Shape()
      ring.absarc(0, 0, r1 * 0.66, 0, Math.PI * 2, false)
      const hole = new THREE.Path()
      hole.absarc(0, 0, r1 * 0.66 - n(p, 'spokeWidth') * 0.7, 0, Math.PI * 2, true)
      ring.holes.push(hole)
      spokeGeos.push(extrude(ring, thick))
    }
  }
  const spokes = mergeGeos(spokeGeos)
  spokes.translate(0, 0, zPlate - thick / 2)
  const spokeMesh = mk(spokes, 'metal', { edgeAngle: 35 })
  group.add(spokeMesh)

  // Fond sombre derrière les branches (on voit « à travers » la jante)
  const back = cylinderZ(r1 * 0.985, r1 * 0.985, 0.01, 48)
  back.translate(0, 0, zPlate - thick - 0.012)
  group.add(mk(back, 'dark', { edgeAngle: 40 }))

  // Moyeu, cache, écrou, boulons
  const hub = cylinderZ(hubR, hubR, thick * 1.6, 40)
  hub.translate(0, 0, zPlate)
  group.add(mk(hub, 'metal', { edgeAngle: 40 }))
  if (p.hubCap) {
    const cap = cylinderZ(hubR * 0.62, hubR * 0.7, 0.012, 32)
    cap.translate(0, 0, zPlate + thick * 0.8 + 0.006)
    group.add(mk(cap, 'metal', { edgeAngle: 40 }))
  }
  const bolts = Math.round(n(p, 'boltCount'))
  if (bolts > 0) {
    const bg: THREE.BufferGeometry[] = []
    const bc = hubR * n(p, 'boltCircle')
    const br = Math.max(0.004, n(p, 'boltSize'))
    const sides = p.boltShape === 'hexagone' ? 6 : p.boltShape === 'etoile' ? 5 : 20
    for (let i = 0; i < bolts; i++) {
      const a = (i / bolts) * Math.PI * 2
      const c = cylinderZ(br, br, 0.012, sides)
      c.translate(Math.cos(a) * bc, Math.sin(a) * bc, zPlate + thick * 0.8 + (p.hubCap ? 0.012 : 0.006))
      bg.push(c)
    }
    group.add(mk(mergeGeos(bg), 'dark', { edgeAngle: 40 }))
  }
  if (p.centerNut) {
    const nut = cylinderZ(hubR * 0.28, hubR * 0.28, 0.018, 6)
    nut.translate(0, 0, zPlate + thick * 0.8 + 0.02)
    group.add(mk(nut, 'dark', { edgeAngle: 40 }))
  }
  if (p.brake) {
    const disc = cylinderZ(r1 * 0.78, r1 * 0.78, 0.018, 48)
    disc.translate(0, 0, zPlate - thick - 0.06)
    group.add(mk(disc, 'metal', { edgeAngle: 40 }))
    const cal = new THREE.BoxGeometry(r1 * 0.34, r1 * 0.5, 0.06)
    cal.translate(r1 * 0.58, 0, zPlate - thick - 0.04)
    group.add(mk(cal, 'red', { edgeAngle: 40 }))
  }
  return group
}
