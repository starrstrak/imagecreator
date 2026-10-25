// Briques géométriques paramétriques réutilisées par toutes les pièces.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { deg } from '@/utils/math'

/** Matériau provisoire : le moteur de rendu le remplace (contours / plein). */
export const PLACEHOLDER = new THREE.MeshBasicMaterial({ color: 0xffffff })

export interface MeshOpts {
  /** Teinte du mode « plein » */
  tone?: string
  /** Surface ouverte (pas de coque de silhouette) */
  open?: boolean
  /** Angle (°) au-delà duquel une arête est tracée */
  edgeAngle?: number
  /** Ne pas tracer de contour */
  noOutline?: boolean
}

/** Crée un maillage « traçable » (le rendu contours le détecte via userData). */
export function mk(geom: THREE.BufferGeometry, tone = 'body', o: MeshOpts = {}): THREE.Mesh {
  const m = new THREE.Mesh(geom, PLACEHOLDER)
  m.userData = { fill: true, tone, open: !!o.open, edgeAngle: o.edgeAngle ?? 28, noOutline: !!o.noOutline }
  return m
}

export function grp(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group()
  for (const c of children) g.add(c)
  return g
}

/** Place un objet (position, rotation en degrés) et le renvoie. */
export function at<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z)
  o.rotation.set(deg(rx), deg(ry), deg(rz))
  return o
}

/** Boîte aux arêtes arrondies. r = rayon d'arrondi (borné automatiquement). */
export function roundedBox(w: number, h: number, d: number, r = 0, seg = 4): THREE.BufferGeometry {
  const m = Math.min(w, h, d) / 2
  const rr = Math.max(0, Math.min(r, m - 1e-4))
  if (rr < 1e-4) return new THREE.BoxGeometry(w, h, d)
  return new RoundedBoxGeometry(w, h, d, seg, rr)
}

/** Extrusion d'une forme 2D (plan XY) sur l'axe Z, centrée sur Z. */
export function extrude(shape: THREE.Shape, depth: number, bevel = 0): THREE.BufferGeometry {
  const b = Math.min(bevel, depth / 2 - 1e-4)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, depth - (b > 0 ? 2 * b : 0)),
    bevelEnabled: b > 1e-4,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 24,
  })
  g.translate(0, 0, -(depth - (b > 0 ? 2 * b : 0)) / 2)
  return g
}

/** Rectangle à coins arrondis, centré, dans le plan XY. */
export function roundedRectShape(w: number, h: number, r = 0): THREE.Shape {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  if (rr < 1e-5) {
    s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath()
    return s
  }
  s.moveTo(x + rr, y)
  s.lineTo(x + w - rr, y)
  s.quadraticCurveTo(x + w, y, x + w, y + rr)
  s.lineTo(x + w, y + h - rr)
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  s.lineTo(x + rr, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - rr)
  s.lineTo(x, y + rr)
  s.quadraticCurveTo(x, y, x + rr, y)
  return s
}

/** Polygone fermé (liste de points XY) avec coins arrondis optionnels. */
export function polyShape(pts: [number, number][], r = 0): THREE.Shape {
  const s = new THREE.Shape()
  const n = pts.length
  if (r < 1e-5) {
    s.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < n; i++) s.lineTo(pts[i][0], pts[i][1])
    s.closePath()
    return s
  }
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1])
    const k1 = Math.min(r, d1 / 2) / (d1 || 1)
    const k2 = Math.min(r, d2 / 2) / (d2 || 1)
    const a: [number, number] = [p1[0] + (p0[0] - p1[0]) * k1, p1[1] + (p0[1] - p1[1]) * k1]
    const b: [number, number] = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2]
    if (i === 0) s.moveTo(a[0], a[1])
    else s.lineTo(a[0], a[1])
    s.quadraticCurveTo(p1[0], p1[1], b[0], b[1])
  }
  s.closePath()
  return s
}

/** Ellipse dans le plan XY. */
export function ellipseShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape()
  s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0)
  return s
}

/** Cylindre le long de l'axe Y (rayon, hauteur), éventuellement conique. */
export function cylinder(rTop: number, rBottom: number, h: number, seg = 32): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(Math.max(rTop, 1e-4), Math.max(rBottom, 1e-4), Math.max(h, 1e-4), seg)
}

/** Cylindre couché le long de l'axe Z (pratique pour roues et essieux). */
export function cylinderZ(rTop: number, rBottom: number, len: number, seg = 32): THREE.BufferGeometry {
  const g = cylinder(rTop, rBottom, len, seg)
  g.rotateX(Math.PI / 2)
  return g
}

/** Cylindre couché le long de l'axe X. */
export function cylinderX(rTop: number, rBottom: number, len: number, seg = 32): THREE.BufferGeometry {
  const g = cylinder(rTop, rBottom, len, seg)
  g.rotateZ(Math.PI / 2)
  return g
}

/** Solide de révolution autour de Y à partir d'un profil [rayon, y]. */
export function lathe(profile: [number, number][], seg = 40): THREE.BufferGeometry {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg)
}

/** Tore dans le plan XY (axe Z). */
export function torus(R: number, r: number, seg = 40, tube = 16): THREE.BufferGeometry {
  return new THREE.TorusGeometry(R, Math.max(r, 1e-4), tube, seg)
}

/**
 * Loft : relie des sections fermées successives (même nombre de points chacune) et
 * ferme les deux extrémités. Les sections sont des listes de Vector3 déjà positionnées.
 */
export function loft(sections: THREE.Vector3[][], capStart = true, capEnd = true): THREE.BufferGeometry {
  const rings = sections.length
  const m = sections[0].length
  const pos: number[] = []
  for (const s of sections) for (const p of s) pos.push(p.x, p.y, p.z)
  const idx: number[] = []
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < m; j++) {
      const a = i * m + j
      const b = i * m + ((j + 1) % m)
      const c = (i + 1) * m + j
      const d = (i + 1) * m + ((j + 1) % m)
      idx.push(a, c, b, b, c, d)
    }
  }
  const addCap = (ring: number, flip: boolean) => {
    const c = new THREE.Vector3()
    for (const p of sections[ring]) c.add(p)
    c.divideScalar(m)
    const ci = pos.length / 3
    pos.push(c.x, c.y, c.z)
    for (let j = 0; j < m; j++) {
      const a = ring * m + j
      const b = ring * m + ((j + 1) % m)
      if (flip) idx.push(ci, b, a)
      else idx.push(ci, a, b)
    }
  }
  if (capStart) addCap(0, false)
  if (capEnd) addCap(rings - 1, true)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Section « rectangle à coins arrondis » dans le plan YZ à l'abscisse x.
 * Orientation : parcours régulier de m points. Superellipse pour des coins doux.
 */
export function roundedSection(x: number, yBottom: number, yTop: number, halfW: number, round: number, m = 28, tumble = 0, belt = 1e9): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  const h = Math.max(1e-3, yTop - yBottom)
  const hw = Math.max(1e-3, halfW)
  const r = Math.min(round, h / 2, hw)
  // Exposant de superellipse : 2 = ellipse ; grand = rectangle
  const n = r < 1e-4 ? 40 : Math.max(2.2, 2 + 12 * (1 - Math.min(1, (2 * r) / Math.min(h, 2 * hw))))
  const cy = (yTop + yBottom) / 2
  for (let j = 0; j < m; j++) {
    const t = (j / m) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const zz = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * hw
    const yy = cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * (h / 2)
    // Rentrée de caisse (tumblehome) au-dessus de la ceinture
    const z2 = zz * (1 - tumble * Math.max(0, yy - belt))
    out.push(new THREE.Vector3(x, yy, z2))
  }
  return out
}

/** Fusionne plusieurs géométries (même attributs) en une seule. */
export function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const norm = geos.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g.clone()
    ng.deleteAttribute('uv')
    if (!ng.getAttribute('normal')) ng.computeVertexNormals()
    return ng
  })
  let total = 0
  for (const g of norm) total += g.getAttribute('position').count
  const pos = new Float32Array(total * 3)
  const nor = new Float32Array(total * 3)
  let o = 0
  for (const g of norm) {
    pos.set(g.getAttribute('position').array as Float32Array, o * 3)
    nor.set(g.getAttribute('normal').array as Float32Array, o * 3)
    o += g.getAttribute('position').count
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  return out
}

/** Applique une matrice à une géométrie clonée. */
export function xf(g: THREE.BufferGeometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): THREE.BufferGeometry {
  const c = g.clone()
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(rx), deg(ry), deg(rz))),
    new THREE.Vector3(sx, sy, sz),
  )
  c.applyMatrix4(m)
  return c
}
