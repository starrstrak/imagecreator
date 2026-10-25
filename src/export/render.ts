// Rendu hors écran d'une vue (contours noirs sur fond blanc) à n'importe quelle résolution.
import * as THREE from 'three'
import { sceneBounds } from '@/scene/objects'
import { updateLineMaterials } from '@/render/outline'
import type { ViewPreset } from '@/store/uiStore'
import { VIEW_DIRS } from '@/scene/views'
import { extraPoints, labelHooks, renderApi } from './bridge'

export interface ViewOpts {
  preset: ViewPreset
  projection: 'persp' | 'ortho'
  /** taille en pixels */
  width: number
  height: number
  /** épaisseur de trait en pixels du rendu */
  linePx: number
  hidden: boolean
  /** marge autour du dessin (fraction) */
  margin?: number
}

/** Boîte englobante de la création (+ cotes éventuelles). */
function fitBox(withDims: boolean): THREE.Box3 {
  const box = sceneBounds()
  if (box.isEmpty()) box.set(new THREE.Vector3(-2, 0, -1), new THREE.Vector3(2, 1.5, 1))
  if (withDims) for (const p of extraPoints.current) box.expandByPoint(p)
  return box
}

/** Caméra cadrant exactement la création pour un rapport largeur / hauteur donné. */
export function fittedCamera(preset: ViewPreset, projection: 'persp' | 'ortho', aspect: number, withDims: boolean, margin = 1.06): THREE.Camera {
  const box = fitBox(withDims)
  const center = box.getCenter(new THREE.Vector3())
  const dir = VIEW_DIRS[preset].clone().normalize()
  const corners: THREE.Vector3[] = []
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z))
  // Repère caméra
  const back = dir
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), back).normalize()
  const up = new THREE.Vector3().crossVectors(back, right).normalize()
  if (preset === 'top') {
    // vue du dessus : l'avant du véhicule vers la droite
    right.set(1, 0, 0)
    up.copy(new THREE.Vector3().crossVectors(back, right)).normalize()
  }
  const rel = corners.map((c) => c.clone().sub(center))
  if (projection === 'ortho') {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const c of rel) {
      const x = c.dot(right), y = c.dot(up)
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    const w = (maxX - minX) * margin
    const h = (maxY - minY) * margin
    let hw = w / 2
    let hh = h / 2
    if (hw / hh > aspect) hh = hw / aspect
    else hw = hh * aspect
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cam = new THREE.OrthographicCamera(cx - hw, cx + hw, cy + hh, cy - hh, -1000, 1000)
    const radius = box.getSize(new THREE.Vector3()).length()
    cam.position.copy(center).addScaledVector(back, radius * 2)
    cam.up.copy(up)
    cam.lookAt(center)
    cam.near = 0.01
    cam.far = radius * 6
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld()
    return cam
  }
  const fov = 35
  const tanV = Math.tan((fov * Math.PI) / 360)
  const tanH = tanV * aspect
  let dist = 0.5
  for (const c of rel) {
    const br = c.dot(back)
    dist = Math.max(dist, br + (Math.abs(c.dot(right)) * margin) / tanH, br + (Math.abs(c.dot(up)) * margin) / tanV)
  }
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.05, dist * 8 + 100)
  cam.position.copy(center).addScaledVector(back, dist)
  cam.up.copy(up)
  cam.lookAt(center)
  cam.updateMatrixWorld()
  return cam
}

/** Rend une vue dans un canvas 2D (fond blanc opaque). */
export function renderView(o: ViewOpts, withDims: boolean): HTMLCanvasElement {
  const api = renderApi.current
  if (!api) throw new Error('Rendu indisponible')
  const { gl, scene } = api
  const maxTex = Math.min(gl.capabilities.maxTextureSize, 8192)
  let w = Math.round(o.width)
  let h = Math.round(o.height)
  let k = 1
  if (Math.max(w, h) > maxTex) {
    k = maxTex / Math.max(w, h)
    w = Math.round(w * k)
    h = Math.round(h * k)
  }
  const cam = fittedCamera(o.preset, o.projection, w / h, withDims, o.margin ?? 1.06)
  updateLineMaterials(o.linePx * k, w, h, 1)
  labelHooks.forEach((fn) => fn(cam, h * 0.03, h))

  // Lignes cachées : on mémorise et on rétablit
  const hiddenObjs: [THREE.Object3D, boolean][] = []
  scene.traverse((ob) => {
    if (ob.userData.outline === 'hidden') {
      hiddenObjs.push([ob, ob.visible])
      ob.visible = o.hidden
    }
  })

  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, colorSpace: THREE.SRGBColorSpace })
  const prevRT = gl.getRenderTarget()
  const prevClear = gl.getClearColor(new THREE.Color())
  const prevAlpha = gl.getClearAlpha()
  const prevAuto = gl.autoClear
  gl.setRenderTarget(rt)
  gl.setClearColor(0xffffff, 1)
  gl.autoClear = true
  gl.clear()
  gl.render(scene, cam)
  const buf = new Uint8Array(w * h * 4)
  gl.readRenderTargetPixels(rt, 0, 0, w, h, buf)
  gl.setRenderTarget(prevRT)
  gl.setClearColor(prevClear, prevAlpha)
  gl.autoClear = prevAuto
  rt.dispose()
  for (const [ob, v] of hiddenObjs) ob.visible = v

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  // Retourne l'image verticalement (WebGL part du bas)
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * 4
    img.data.set(buf.subarray(src, src + w * 4), y * w * 4)
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}
