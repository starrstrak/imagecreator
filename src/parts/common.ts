// Pièces communes à tous les modules : annotation (note de texte avec flèche).
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { num, pos, text } from '@/core/paramSchema'
import { mk } from '@/parts/primitives/geo'

/** Texture de texte (canvas, polices système : fonctionne hors ligne). */
export function textTexture(label: string, px = 64, pad = 14, border = true): { tex: THREE.CanvasTexture; aspect: number } {
  // Hors navigateur (tests) : texture vide
  if (typeof document === 'undefined') return { tex: new THREE.CanvasTexture(undefined as unknown as HTMLCanvasElement), aspect: 3 }
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const font = `bold ${px}px "Trebuchet MS","Segoe UI",system-ui,sans-serif`
  ctx.font = font
  const w = Math.ceil(ctx.measureText(label).width) + pad * 2
  const h = px + pad * 2
  c.width = w
  c.height = h
  ctx.font = font
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  if (border) {
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 5
    ctx.strokeRect(2.5, 2.5, w - 5, h - 5)
  }
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, pad, h / 2 + 2)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  return { tex, aspect: w / h }
}

registerPart({
  type: 'commun.note',
  label: 'Annotation',
  category: 'formes',
  icon: '📝',
  module: 'commun',
  schema: [
    text('label', 'Texte', 'Note', { group: 'Texte', level: 'easy', tip: 'Le texte qui s’affiche sur le dessin.', maxLength: 60 }),
    pos('size', 'Taille du texte', 0.5, [0.1, 3], { group: 'Texte', level: 'easy', unit: 'm' }),
    pos('stem', 'Longueur de la flèche', 1, [0, 6], { group: 'Texte', level: 'easy', unit: 'm', tip: 'La flèche descend vers l’objet annoté.' }),
    num('tilt', 'Inclinaison', 0, [-45, 45], { group: 'Texte', step: 1, unit: '°' }),
  ],
  build: (p) => {
    const root = new THREE.Group()
    const { tex, aspect } = textTexture(String(p.label || ' '))
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: false })
    const sp = new THREE.Sprite(mat)
    const h = p.size as number
    sp.scale.set(h * aspect, h, 1)
    sp.position.y = (p.stem as number) + h / 2
    sp.renderOrder = 50
    sp.raycast = THREE.Sprite.prototype.raycast
    root.add(sp)
    if ((p.stem as number) > 0.02) {
      const line = mk(new THREE.CylinderGeometry(0.01, 0.01, p.stem as number, 6), 'dark', { edgeAngle: 70, noOutline: true })
      line.position.y = (p.stem as number) / 2
      ;(line.material as THREE.Material) = new THREE.MeshBasicMaterial({ color: 0x000000 })
      line.userData.fill = false
      root.add(line)
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      tip.rotation.x = Math.PI
      tip.position.y = 0.07
      root.add(tip)
    }
    root.rotation.z = ((p.tilt as number) * Math.PI) / 180
    return root
  },
})
