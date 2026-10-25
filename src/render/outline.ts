// Rendu « dessin au trait » : arêtes vives + silhouette (coque inversée à épaisseur constante
// en pixels) + lignes cachées optionnelles. Aucun aplat : fond blanc, pièces blanches.
import * as THREE from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Réglages partagés par tous les contours (mis à jour à chaque image). */
export const lineSettings = { width: 2.2, hidden: false, pixelRatio: 1, resolution: new THREE.Vector2(1, 1) }

export const edgeMat = new LineMaterial({ color: 0x000000, linewidth: 2, worldUnits: false })
export const hiddenMat = new LineMaterial({
  color: 0x555555,
  linewidth: 1,
  worldUnits: false,
  dashed: true,
  dashSize: 0.05,
  gapSize: 0.05,
  depthFunc: THREE.GreaterDepth,
  depthWrite: false,
  transparent: true,
  opacity: 0.8,
})

/** Coque de silhouette : gonflée dans l'espace écran, noire, faces arrière uniquement. */
export const hullMat = new THREE.ShaderMaterial({
  uniforms: { uWidth: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: /* glsl */ `
    uniform float uWidth;
    uniform vec2 uRes;
    void main() {
      vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      vec2 dir = (projectionMatrix * vec4(n, 0.0)).xy * uRes;
      float l = length(dir);
      dir = l > 1e-6 ? dir / l : vec2(0.0);
      clip.xy += dir / uRes * 2.0 * uWidth * clip.w;
      gl_Position = clip;
    }`,
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.0,0.0,0.0,1.0); }',
  side: THREE.BackSide,
})

/** Matériaux de remplissage : blanc pur (mode trait) ou ombré (mode plein). */
export const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
const TONES: Record<string, string> = {
  body: '#e8eef7',
  glass: '#bfe3f5',
  dark: '#3b4150',
  metal: '#c9ced6',
  light: '#fff3b0',
  red: '#f08a8a',
  green: '#a8d8a0',
  wood: '#d9b88a',
  wall: '#f3ead9',
  roof: '#c97b63',
  water: '#8fd0f0',
}
const shaded = new Map<string, THREE.MeshStandardMaterial>()
export function shadedMat(tone: string): THREE.MeshStandardMaterial {
  let m = shaded.get(tone)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: TONES[tone] ?? tone, roughness: 0.8, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
    shaded.set(tone, m)
  }
  return m
}

const noRaycast = () => {}
const edgeCache = new WeakMap<THREE.BufferGeometry, Map<number, LineSegmentsGeometry | null>>()
const hullCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

/** angle en degrés : seuil au-delà duquel une arête est tracée */
function edgesFor(geo: THREE.BufferGeometry, angle: number): LineSegmentsGeometry | null {
  let byAngle = edgeCache.get(geo)
  if (!byAngle) edgeCache.set(geo, (byAngle = new Map()))
  if (byAngle.has(angle)) return byAngle.get(angle)!
  const e = new THREE.EdgesGeometry(geo, angle)
  const pos = e.getAttribute('position')
  let out: LineSegmentsGeometry | null = null
  if (pos && pos.count > 0) {
    out = new LineSegmentsGeometry()
    out.setPositions(pos.array as Float32Array)
  }
  e.dispose()
  byAngle.set(angle, out)
  return out
}

function hullFor(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  let h = hullCache.get(geo)
  if (!h) {
    // Normales lissées : on soude les sommets pour que la coque ne se déchire pas aux arêtes vives.
    const g = geo.clone()
    g.deleteAttribute('normal')
    g.deleteAttribute('uv')
    const merged = mergeVertices(g, 1e-4)
    merged.computeVertexNormals()
    g.dispose()
    h = merged
    hullCache.set(geo, h)
  }
  return h
}

/**
 * Ajoute à chaque maillage « fill » de l'arbre ses contours (arêtes, silhouette, lignes cachées).
 * À appeler UNE fois après la construction d'une pièce.
 */
export function addOutlines(root: THREE.Object3D): void {
  const meshes: THREE.Mesh[] = []
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.userData.fill) meshes.push(o as THREE.Mesh)
  })
  for (const m of meshes) {
    if (m.userData.noOutline) continue
    const geo = m.geometry
    const edges = edgesFor(geo, (m.userData.edgeAngle as number) ?? 28)
    if (edges) {
      const l = new LineSegments2(edges, edgeMat)
      l.raycast = noRaycast
      l.userData.outline = 'edge'
      l.renderOrder = 2
      m.add(l)
      const hd = new LineSegments2(edges, hiddenMat)
      hd.computeLineDistances()
      hd.raycast = noRaycast
      hd.userData.outline = 'hidden'
      hd.visible = lineSettings.hidden
      hd.renderOrder = 1
      m.add(hd)
    }
    if (!m.userData.open) {
      const hull = new THREE.Mesh(hullFor(geo), hullMat)
      hull.raycast = noRaycast
      hull.userData.outline = 'hull'
      m.add(hull)
    }
  }
}

/** Bascule le matériau de remplissage selon le mode de rendu. */
export function applyFill(root: THREE.Object3D, mode: 'trait' | 'plein'): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.userData.fill) m.material = mode === 'trait' ? whiteMat : shadedMat(m.userData.tone as string)
  })
}

/** Affiche / masque les lignes cachées. */
export function applyHidden(root: THREE.Object3D, on: boolean): void {
  root.traverse((o) => {
    if (o.userData.outline === 'hidden') o.visible = on
  })
}

/** Met à jour matériaux de ligne (épaisseur en pixels du tampon, résolution). */
export function updateLineMaterials(width: number, resW: number, resH: number, pixelRatio: number): void {
  lineSettings.resolution.set(resW, resH)
  lineSettings.pixelRatio = pixelRatio
  edgeMat.linewidth = width * pixelRatio
  edgeMat.resolution.set(resW, resH)
  hiddenMat.linewidth = Math.max(1, width * 0.6) * pixelRatio
  hiddenMat.resolution.set(resW, resH)
  hiddenMat.dashSize = 6 * pixelRatio
  hiddenMat.gapSize = 5 * pixelRatio
  hullMat.uniforms.uWidth.value = width * pixelRatio
  hullMat.uniforms.uRes.value.set(resW, resH)
}

/** Libère les géométries propres à un objet (pas celles du cache partagé). */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.userData.fill) {
      edgeCache.get(m.geometry)?.forEach((e) => e?.dispose())
      edgeCache.delete(m.geometry)
      hullCache.get(m.geometry)?.dispose()
      hullCache.delete(m.geometry)
      m.geometry.dispose()
    }
  })
}
