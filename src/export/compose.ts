// Composition d'une page : titre, cadre, une ou plusieurs vues, cartouche. Sert à l'aperçu, au PNG et au PDF.
import type { ViewPreset } from '@/store/uiStore'
import { renderView } from './render'

export type Sheet = 'single' | 'duo' | 'trio' | 'quad'
export type Orientation = 'portrait' | 'paysage'

export interface PageOpts {
  orientation: Orientation
  sheet: Sheet
  /** vue utilisée pour « une seule vue » */
  mainView: ViewPreset
  projection: 'persp' | 'ortho'
  /** marges en mm */
  margin: number
  /** épaisseur du trait en mm */
  lineMm: number
  hidden: boolean
  showDims: boolean
  title: string
  showTitle: boolean
  showFrame: boolean
  showLabels: boolean
  author: string
}

export const A4 = { w: 210, h: 297 }

const VIEW_NAMES: Record<ViewPreset, string> = { front: 'Vue de face', side: 'Vue de côté', top: 'Vue de dessus', 'three-quarter': 'Vue 3/4' }

interface Cell {
  x: number
  y: number
  w: number
  h: number
  view: ViewPreset
}

/** Dimensions de la page en mm selon l'orientation. */
export const pageSize = (o: Orientation): { w: number; h: number } => (o === 'portrait' ? { w: A4.w, h: A4.h } : { w: A4.h, h: A4.w })

/** Découpe la zone utile en cellules selon la planche choisie. */
export function layoutCells(o: PageOpts): { cells: Cell[]; titleH: number; footH: number } {
  const { w: pw, h: ph } = pageSize(o.orientation)
  const m = o.margin
  const titleH = o.showTitle ? 12 : 0
  const footH = o.showTitle ? 9 : 0
  const x0 = m
  const y0 = m + titleH
  const W = pw - 2 * m
  const H = ph - 2 * m - titleH - footH
  const gap = 4
  const mk = (x: number, y: number, w: number, h: number, view: ViewPreset): Cell => ({ x, y, w, h, view })
  const land = o.orientation === 'paysage'
  switch (o.sheet) {
    case 'duo': {
      const views: ViewPreset[] = ['three-quarter', 'side']
      return land
        ? { cells: views.map((v, i) => mk(x0 + (i * (W + gap)) / 2, y0, (W - gap) / 2, H, v)), titleH, footH }
        : { cells: views.map((v, i) => mk(x0, y0 + (i * (H + gap)) / 2, W, (H - gap) / 2, v)), titleH, footH }
    }
    case 'trio': {
      const bigH = (H - gap) * 0.55
      const smallH = H - gap - bigH
      return land
        ? {
            cells: [
              mk(x0, y0, W * 0.55, H, 'three-quarter'),
              mk(x0 + W * 0.55 + gap, y0, W * 0.45 - gap, (H - gap) / 2, 'front'),
              mk(x0 + W * 0.55 + gap, y0 + (H - gap) / 2 + gap, W * 0.45 - gap, (H - gap) / 2, 'top'),
            ],
            titleH,
            footH,
          }
        : {
            cells: [mk(x0, y0, W, bigH, 'three-quarter'), mk(x0, y0 + bigH + gap, (W - gap) / 2, smallH, 'side'), mk(x0 + (W + gap) / 2, y0 + bigH + gap, (W - gap) / 2, smallH, 'top')],
            titleH,
            footH,
          }
    }
    case 'quad': {
      const cw = (W - gap) / 2
      const ch = (H - gap) / 2
      const views: ViewPreset[] = ['three-quarter', 'front', 'side', 'top']
      return { cells: views.map((v, i) => mk(x0 + (i % 2) * (cw + gap), y0 + Math.floor(i / 2) * (ch + gap), cw, ch, v)), titleH, footH }
    }
    default:
      return { cells: [mk(x0, y0, W, H, o.mainView)], titleH, footH }
  }
}

/** Compose la page complète dans un canvas à `dpi` points par pouce. */
export function composePage(o: PageOpts, dpi: number): HTMLCanvasElement {
  const { w: pw, h: ph } = pageSize(o.orientation)
  const px = (mm: number) => (mm / 25.4) * dpi
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(px(pw))
  canvas.height = Math.round(px(ph))
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  ctx.textBaseline = 'alphabetic'
  const { cells, titleH, footH } = layoutCells(o)
  const m = o.margin
  const lw = Math.max(1, px(0.35))

  if (o.showFrame) {
    ctx.lineWidth = lw
    ctx.strokeRect(px(m), px(m), px(pw - 2 * m), px(ph - 2 * m))
  }
  if (o.showTitle) {
    ctx.font = `bold ${px(6.2)}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`
    ctx.fillText(o.title || 'Ma création', px(m + 3), px(m + titleH - 3.5))
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(px(m), px(m + titleH))
    ctx.lineTo(px(pw - m), px(m + titleH))
    ctx.stroke()
    // Cartouche en pied de page
    const fy = ph - m - footH
    ctx.beginPath()
    ctx.moveTo(px(m), px(fy))
    ctx.lineTo(px(pw - m), px(fy))
    ctx.stroke()
    ctx.font = `${px(3.4)}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`
    const date = new Date().toLocaleDateString('fr-FR')
    ctx.fillText(`${o.author ? o.author + ' · ' : ''}Atelier 3D à colorier · ${date}`, px(m + 3), px(fy + 5.6))
    ctx.textAlign = 'right'
    ctx.fillText('Format A4 · à colorier ✎', px(pw - m - 3), px(fy + 5.6))
    ctx.textAlign = 'left'
  }

  for (const c of cells) {
    const pad = 2
    const cw = px(c.w - 2 * pad)
    const ch = px(c.h - 2 * pad)
    const view = renderView(
      { preset: c.view, projection: o.projection, width: cw, height: ch, linePx: px(o.lineMm), hidden: o.hidden },
      o.showDims,
    )
    ctx.drawImage(view, px(c.x + pad), px(c.y + pad), cw, ch)
    if (o.sheet !== 'single') {
      ctx.lineWidth = Math.max(1, px(0.2))
      ctx.setLineDash([px(1.5), px(1.2)])
      ctx.strokeRect(px(c.x), px(c.y), px(c.w), px(c.h))
      ctx.setLineDash([])
    }
    if (o.showLabels && o.sheet !== 'single') {
      ctx.font = `${px(3.2)}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`
      ctx.fillText(VIEW_NAMES[c.view], px(c.x + 3), px(c.y + 6))
    }
  }
  return canvas
}
