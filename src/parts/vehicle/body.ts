// Modèle analytique de la carrosserie : fonctions de profil (capot, toit, coffre), largeur,
// surfaces des flancs. Sert à CONSTRUIRE le châssis et à ADAPTER les pièces enfants
// (portes, vitres, phares…) à la carrosserie.
import * as THREE from 'three'
import type { ParamValues, Provided } from '@/core/types'
import { clamp, interp, lerp, smoothstep } from '@/utils/math'
import { hashOf } from '@/utils/hash'
import { loft } from '@/parts/primitives/geo'

export interface Body extends Provided {
  L: number
  W: number
  H: number
  clearance: number
  /** Abscisses des essieux (le premier est l'essieu avant) */
  axleXs: number[]
  wheelDia: number
  archR: number
  /** Hauteur du dessus de caisse (capot, plancher de cabine, coffre) */
  deckY: (x: number) => number
  /** Hauteur du toit (= deckY hors habitacle) */
  roofY: (x: number) => number
  /** Demi-largeur du bas de caisse */
  hw: (x: number) => number
  /** Demi-largeur de l'habitacle à la base des vitres */
  hc: (x: number) => number
  /** Position Z de la surface extérieure du flanc à (x, y) */
  sideZ: (x: number, y: number) => number
  /** Pente latérale du flanc (dz/dy) à (x, y) : négative = penche vers l'intérieur */
  sideSlope: (x: number, y: number) => number
  /** Abscisse de la surface avant / arrière pour un décalage latéral z donné */
  noseX: (z: number) => number
  tailX: (z: number) => number
  /** Points clés du profil (en x) */
  xWsBase: number
  xRoofFront: number
  xRoofRear: number
  xRearBase: number
  deck: number
  roof: number
  nose: number
  tail: number
  cabinTumble: number
  cabinRatio: number
  /** Position de la surface supérieure au centre (capot / toit / coffre) pour un x donné */
  topY: (x: number) => number
}

const n = (p: ParamValues, k: string): number => p[k] as number

/** Lissage par moyenne glissante d'un échantillonnage (arrondit les raccords capot/pare-brise/toit). */
function blur(a: number[], radius: number, passes: number): number[] {
  let cur = a
  for (let p = 0; p < passes; p++) {
    const out = cur.slice()
    for (let i = 0; i < cur.length; i++) {
      let s = 0
      let c = 0
      for (let j = -radius; j <= radius; j++) {
        const k = i + j
        if (k >= 0 && k < cur.length) {
          s += cur[k]
          c++
        }
      }
      out[i] = s / c
    }
    cur = out
  }
  return cur
}

export function makeBody(p: ParamValues): Body {
  const L = Math.max(0.5, n(p, 'length'))
  const W = Math.max(0.3, n(p, 'width'))
  const clearance = Math.max(0, n(p, 'clearance'))
  const wb = n(p, 'wheelbase')
  const shift = n(p, 'axleShift')
  const axleCount = Math.max(1, Math.round(n(p, 'axleCount')))
  const gap = n(p, 'axleGap')
  const wheelDia = n(p, 'wheelDia')
  const archGap = n(p, 'archGap')
  const archR = wheelDia / 2 + archGap

  const xF = L / 2 - ((L - wb) / 2 - shift)
  const axleXs: number[] = [xF]
  if (axleCount >= 2) axleXs.push(xF - wb)
  for (let i = 2; i < axleCount; i++) axleXs.push(xF - wb - gap * (i - 1))

  const noseH = n(p, 'noseH')
  const deck = Math.max(clearance + 0.2, n(p, 'deckH'))
  const tailH = n(p, 'tailH')
  const fWs = n(p, 'wsBase')
  const fRf = Math.max(fWs, n(p, 'roofFront'))
  const fRr = Math.max(fRf, n(p, 'roofRear'))
  const fRb = Math.max(fRr, n(p, 'rearBase'))
  const roof = Math.max(deck + 0.12, n(p, 'height'))
  const tumble = n(p, 'tumble')
  const cabinTumble = n(p, 'cabinTumble')
  const cabinRatio = n(p, 'cabinRatio')
  const noseW = n(p, 'noseWidth')
  const tailW = n(p, 'tailWidth')
  const bulge = n(p, 'bulge')
  const endFront = Math.max(0.02, n(p, 'noseRound'))
  const endRear = Math.max(0.02, n(p, 'tailRound'))

  const xOf = (f: number): number => L / 2 - f * L
  const fOf = (x: number): number => (L / 2 - x) / L

  // Profil du dessus de caisse
  const deckPts: [number, number][] = [
    [0, noseH],
    [fWs, deck],
    [fRb, deck],
    [1, tailH],
  ]
  const deckY = (x: number): number => interp(deckPts, clamp(fOf(x), 0, 1))

  // Profil du toit : échantillonné puis lissé (raccords arrondis)
  const NS = 240
  const roofLin: number[] = []
  const roofPts: [number, number][] = [
    [fWs, 0],
    [fRf, 1],
    [fRr, 1],
    [fRb, 0],
  ]
  for (let i = 0; i <= NS; i++) {
    const f = i / NS
    let h = 0
    if (f > fWs && f < fRb) {
      if (f < fRf) h = (f - fWs) / Math.max(1e-6, fRf - fWs)
      else if (f > fRr) h = (fRb - f) / Math.max(1e-6, fRb - fRr)
      else h = 1
    }
    roofLin.push(h * (roof - deck))
  }
  const roofH = blur(roofLin, Math.max(2, Math.round(NS * 0.012)), 3)
  void roofPts
  const cabH = (x: number): number => {
    const t = clamp(fOf(x), 0, 1) * NS
    const i = Math.min(NS - 1, Math.floor(t))
    return lerp(roofH[i], roofH[i + 1], t - i)
  }
  const roofY = (x: number): number => deckY(x) + cabH(x)

  // Largeur : arrondi des extrémités + évasement des flancs
  const endE = (x: number): number => {
    const dN = L / 2 - x
    const dT = x + L / 2
    let e = 1
    if (dN < endFront) e *= Math.sqrt(Math.max(0, 1 - ((endFront - dN) / endFront) ** 2))
    if (dT < endRear) e *= Math.sqrt(Math.max(0, 1 - ((endRear - dT) / endRear) ** 2))
    return Math.max(0.02, e)
  }
  const hw = (x: number): number => {
    const f = clamp(fOf(x), 0, 1)
    const taper = f < 0.3 ? lerp(noseW, 1, smoothstep(0, 0.3, f)) : f > 0.7 ? lerp(1, tailW, smoothstep(0.7, 1, f)) : 1
    return (W / 2) * taper * (1 + bulge * Math.sin(Math.PI * f)) * Math.pow(endE(x), 0.55)
  }
  const zAt = (x: number, y: number): number => hw(x) * (1 - tumble * Math.max(0, y - clearance))
  const hc = (x: number): number => {
    const k = smoothstep(0, 0.15, cabH(x))
    return zAt(x, deckY(x)) * lerp(1, cabinRatio, k)
  }
  const sideZ = (x: number, y: number): number => {
    const d = deckY(x)
    if (y <= d) return zAt(x, y)
    return Math.max(0.02, hc(x) - cabinTumble * (y - d))
  }
  const sideSlope = (x: number, y: number): number => (y <= deckY(x) ? -hw(x) * tumble : -cabinTumble)

  const noseX = (z: number): number => {
    for (let d = 0; d <= endFront; d += endFront / 60) if (hw(L / 2 - d) >= Math.abs(z)) return L / 2 - d
    return L / 2 - endFront
  }
  const tailX = (z: number): number => {
    for (let d = 0; d <= endRear; d += endRear / 60) if (hw(-L / 2 + d) >= Math.abs(z)) return -L / 2 + d
    return -L / 2 + endRear
  }
  const topY = (x: number): number => roofY(x)

  return {
    key: hashOf(p),
    L, W, H: roof, clearance, axleXs, wheelDia, archR,
    deckY, roofY, hw, hc, sideZ, sideSlope, noseX, tailX,
    xWsBase: xOf(fWs), xRoofFront: xOf(fRf), xRoofRear: xOf(fRr), xRearBase: xOf(fRb),
    deck, roof, nose: noseH, tail: tailH, cabinTumble, cabinRatio, topY,
  }
}

/** Subdivision de Chaikin d'un polygone fermé (coins arrondis, nombre de points constant). */
function chaikin(pts: [number, number][], q: number, iter: number): [number, number][] {
  let cur = pts
  for (let k = 0; k < iter; k++) {
    const out: [number, number][] = []
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i]
      const b = cur[(i + 1) % cur.length]
      out.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q])
      out.push([a[0] + (b[0] - a[0]) * (1 - q), a[1] + (b[1] - a[1]) * (1 - q)])
    }
    cur = out
  }
  return cur
}

/** Géométrie lissée de la carrosserie complète (capot + habitacle + coffre en un seul solide). */
export function buildBodyGeometry(p: ParamValues, b: Body): THREE.BufferGeometry {
  const clearance = b.clearance
  const sill = n(p, 'sill')
  const tumble = n(p, 'tumble')
  const crownRoof = n(p, 'roofCrown')
  const crownHood = n(p, 'hoodCrown')
  const q = clamp(n(p, 'cornerRound'), 0.04, 0.45)
  const archOn = p.arches as boolean

  // Abscisses des sections : répartition dense aux extrémités + parois des passages de roue
  const xs: number[] = []
  const N = 110
  for (let i = 0; i <= N; i++) xs.push(-b.L / 2 + b.L * (0.5 - 0.5 * Math.cos((Math.PI * i) / N)))
  if (archOn) {
    for (const xa of b.axleXs) {
      for (const s of [-1, 1]) {
        xs.push(xa + s * (b.archR - 0.002), xa + s * (b.archR + 0.002))
      }
      for (let k = 1; k < 14; k++) xs.push(xa - b.archR + (2 * b.archR * k) / 14)
    }
  }
  xs.sort((a, c) => a - c)
  const uniq = xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-5 || true)

  const wheelCenterY = b.wheelDia / 2
  const sections: THREE.Vector3[][] = uniq.map((x) => {
    let yb = clearance
    if (archOn) {
      for (const xa of b.axleXs) {
        const dx = Math.abs(x - xa)
        if (dx < b.archR) yb = Math.max(yb, wheelCenterY + Math.sqrt(b.archR * b.archR - dx * dx))
      }
    }
    const d = b.deckY(x)
    const ye = d
    yb = Math.min(yb, ye - 0.08)
    const hcab = Math.max(0, b.roofY(x) - d)
    const zA = (y: number) => b.hw(x) * (1 - tumble * Math.max(0, y - clearance))
    const kk = smoothstep(0, 0.15, hcab)
    const hcx = zA(ye) * lerp(1, b.cabinRatio, kk)
    const z4 = Math.max(0.03, hcx - b.cabinTumble * hcab)
    const topCenter = ye + hcab + lerp(crownHood, crownRoof, kk)
    const z1 = zA(yb) * (1 - sill)
    const half: [number, number][] = [
      [z1, yb], // coin bas
      [zA(ye), ye], // haut du flanc
      [hcx, ye], // base de l'habitacle
      [z4, ye + hcab], // coin de toit
    ]
    // Polygone fermé (z, y) : bas-centre → droite → haut-centre → gauche
    const poly: [number, number][] = [
      [0, yb],
      ...half,
      [0, topCenter],
      ...half.slice().reverse().map(([z, y]) => [-z, y] as [number, number]),
    ]
    const r = chaikin(poly, q, 2)
    return r.map(([z, y]) => new THREE.Vector3(x, y, z))
  })
  const g = loft(sections, true, true)
  return g
}
