// Export PDF A4 (jsPDF) et PNG haute résolution.
import type { jsPDF } from 'jspdf'
import { composePage, pageSize, type PageOpts } from './compose'

function safeName(s: string): string {
  return (s || 'creation').replace(/[^\w\-]+/g, '_')
}

function download(blob: Blob, name: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/** Construit le PDF A4 (vectoriel pour la page, image haute résolution pour le dessin). */
export async function buildPdf(o: PageOpts, dpi: number): Promise<jsPDF> {
  // jsPDF est chargé à la demande : l'application démarre plus vite
  const { jsPDF } = await import('jspdf')
  const { w, h } = pageSize(o.orientation)
  const canvas = composePage(o, dpi)
  const pdf = new jsPDF({ orientation: o.orientation === 'portrait' ? 'portrait' : 'landscape', unit: 'mm', format: 'a4', compress: true })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h, undefined, 'FAST')
  pdf.setProperties({ title: o.title || 'Ma création', creator: 'Atelier 3D à colorier' })
  return pdf
}

export async function exportPdf(o: PageOpts, dpi: number): Promise<void> {
  ;(await buildPdf(o, dpi)).save(`${safeName(o.title)}.pdf`)
}

/** Ouvre le PDF dans un nouvel onglet pour l'imprimer. */
export async function openPdfForPrint(o: PageOpts, dpi: number): Promise<void> {
  const url = (await buildPdf(o, dpi)).output('bloburl')
  window.open(url as unknown as string, '_blank')
}

export async function exportPng(o: PageOpts, dpi: number): Promise<void> {
  const canvas = composePage(o, dpi)
  await new Promise<void>((res) =>
    canvas.toBlob((b) => {
      if (b) download(b, `${safeName(o.title)}.png`)
      res()
    }, 'image/png'),
  )
}
