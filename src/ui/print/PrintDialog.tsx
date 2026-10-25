// Aperçu avant impression + export PNG / PDF A4 (portrait ou paysage, une vue ou planche multi-vues).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUi, type ViewPreset } from '@/store/uiStore'
import { useScene } from '@/store/sceneStore'
import { composePage, pageSize, type Orientation, type PageOpts, type Sheet } from '@/export/compose'
import { exportPdf, exportPng, openPdfForPrint } from '@/export/pdf'
import { fr } from '@/ui/i18n/fr'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string, string?][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, label, icon]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex min-h-[2.6rem] items-center gap-1.5 rounded-xl border-2 px-3 py-1 text-sm font-semibold transition active:scale-95 ${
            value === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </button>
      ))}
    </div>
  )
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
      {label}
      <input type="checkbox" className="h-5 w-5 accent-brand-500" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export function PrintDialog() {
  const show = useUi((s) => s.showPrint)
  const set = useUi((s) => s.set)
  if (!show) return null
  return <PrintBody onClose={() => set({ showPrint: false })} />
}

function PrintBody({ onClose }: { onClose: () => void }) {
  const ui = useUi.getState()
  const name = useScene((s) => s.scene.name)
  const moduleId = useScene((s) => s.scene.module)
  const [opts, setOpts] = useState<PageOpts>({
    orientation: 'paysage',
    sheet: 'single',
    mainView: 'three-quarter',
    projection: 'persp',
    margin: 10,
    lineMm: 0.5,
    hidden: false,
    showDims: moduleId === 'maison' && ui.planMode,
    title: name,
    showTitle: true,
    showFrame: true,
    showLabels: true,
    author: '',
  })
  const [dpi, setDpi] = useState(300)
  const [busy, setBusy] = useState('')
  const [preview, setPreview] = useState<string>('')
  const saved = useRef<Partial<ReturnType<typeof useUi.getState>> & { sel?: string | null }>({})
  const patch = (p: Partial<PageOpts>) => setOpts((o) => ({ ...o, ...p }))

  // Prépare la scène (sans gizmo ni sélection) pendant que la fenêtre est ouverte, puis rétablit
  useEffect(() => {
    const u = useUi.getState()
    saved.current = { gizmo: u.gizmo, showGrid: u.showGrid, showHandles: u.showHandles, showDims: u.showDims, playing: u.playing, sel: useScene.getState().selectedId }
    useUi.setState({ gizmo: 'none', showGrid: false, showHandles: false, playing: false })
    useScene.getState().select(null)
    return () => {
      const s = saved.current
      useUi.setState({ gizmo: s.gizmo, showGrid: s.showGrid, showHandles: s.showHandles, showDims: s.showDims })
      if (s.sel) useScene.getState().select(s.sel)
    }
  }, [])

  // Cotes : visibles dans l'aperçu si demandé
  useEffect(() => {
    useUi.setState({ showDims: opts.showDims })
  }, [opts.showDims])

  // Aperçu : rendu basse résolution, anti-rebond
  const key = useMemo(() => JSON.stringify(opts), [opts])
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      await wait(opts.showDims ? 200 : 60)
      if (cancelled) return
      try {
        const c = composePage(opts, 72)
        if (!cancelled) setPreview(c.toDataURL('image/jpeg', 0.9))
      } catch (e) {
        console.error(e)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const run = async (label: string, fn: () => void | Promise<void>) => {
    setBusy(label)
    await wait(80)
    try {
      await fn()
      useUi.getState().notify('Export terminé ✔')
    } catch (e) {
      console.error(e)
      useUi.getState().notify('L’export a échoué. Essaie une résolution plus basse.')
    }
    setBusy('')
  }

  const ps = pageSize(opts.orientation)
  const views: [ViewPreset, string][] = [['three-quarter', '3/4'], ['front', 'Face'], ['side', 'Côté'], ['top', 'Dessus']]
  const sheets: [Sheet, string, string][] = [['single', 'Une vue', '🖼️'], ['duo', '2 vues', '🗂️'], ['trio', '3 vues', '🧩'], ['quad', '4 vues', '🔲']]

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div className="flex w-full max-w-6xl animate-pop flex-col overflow-hidden bg-white shadow-2xl sm:rounded-3xl lg:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className="w-full shrink-0 space-y-3 overflow-y-auto border-b border-slate-200 p-4 lg:w-96 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-brand-700">🖨️ {fr.print}</h2>
            <button className="h-10 w-10 rounded-full bg-slate-100 text-xl hover:bg-slate-200" onClick={onClose} aria-label="Fermer">✕</button>
          </div>

          <div>
            <div className="mb-1 text-sm font-bold text-slate-700">Page A4</div>
            <Seg<Orientation> value={opts.orientation} onChange={(v) => patch({ orientation: v })} options={[['paysage', 'Paysage', '▭'], ['portrait', 'Portrait', '▯']]} />
          </div>
          <div>
            <div className="mb-1 text-sm font-bold text-slate-700">Planche</div>
            <Seg<Sheet> value={opts.sheet} onChange={(v) => patch({ sheet: v })} options={sheets.map(([v, l, i]) => [v, l, i] as [Sheet, string, string])} />
          </div>
          {opts.sheet === 'single' && (
            <div>
              <div className="mb-1 text-sm font-bold text-slate-700">Vue</div>
              <Seg<ViewPreset> value={opts.mainView} onChange={(v) => patch({ mainView: v })} options={views.map(([v, l]) => [v, l] as [ViewPreset, string])} />
            </div>
          )}
          <div>
            <div className="mb-1 text-sm font-bold text-slate-700">Caméra</div>
            <Seg<'persp' | 'ortho'> value={opts.projection} onChange={(v) => patch({ projection: v })} options={[['persp', 'Perspective', '🎥'], ['ortho', 'Orthographique', '📐']]} />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm font-bold text-slate-700">
              <span>Épaisseur du trait</span>
              <span>{opts.lineMm.toFixed(2)} mm</span>
            </div>
            <input type="range" min={0.15} max={1.5} step={0.05} value={opts.lineMm} onChange={(e) => patch({ lineMm: parseFloat(e.target.value) })} className="h-7 w-full accent-brand-500" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm font-bold text-slate-700">
              <span>Marges</span>
              <span>{opts.margin} mm</span>
            </div>
            <input type="range" min={4} max={30} step={1} value={opts.margin} onChange={(e) => patch({ margin: parseInt(e.target.value) })} className="h-7 w-full accent-brand-500" />
          </div>

          <div className="space-y-1.5">
            <Check label="Lignes cachées (pointillés)" value={opts.hidden} onChange={(v) => patch({ hidden: v })} />
            <Check label="Cotes (plan CAD)" value={opts.showDims} onChange={(v) => patch({ showDims: v })} />
            <Check label="Titre et cartouche" value={opts.showTitle} onChange={(v) => patch({ showTitle: v })} />
            <Check label="Cadre autour de la page" value={opts.showFrame} onChange={(v) => patch({ showFrame: v })} />
            {opts.sheet !== 'single' && <Check label="Nom des vues" value={opts.showLabels} onChange={(v) => patch({ showLabels: v })} />}
          </div>
          {opts.showTitle && (
            <div className="space-y-1.5">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={opts.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Titre" />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={opts.author} onChange={(e) => patch({ author: e.target.value })} placeholder="Ton prénom (facultatif)" />
            </div>
          )}

          <div>
            <div className="mb-1 text-sm font-bold text-slate-700">Qualité</div>
            <Seg<string> value={String(dpi)} onChange={(v) => setDpi(parseInt(v))} options={[['150', 'Rapide (150)'], ['300', 'Haute (300)'], ['600', 'Très haute (600)']]} />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button disabled={!!busy} onClick={() => run('pdf', () => exportPdf(opts, dpi))} className="h-12 rounded-xl bg-sun text-base font-extrabold text-ink shadow transition hover:brightness-105 active:scale-95 disabled:opacity-50">
              📄 Télécharger le PDF
            </button>
            <button disabled={!!busy} onClick={() => run('print', () => openPdfForPrint(opts, Math.min(dpi, 300)))} className="h-12 rounded-xl bg-brand-500 text-base font-extrabold text-white shadow transition hover:bg-brand-600 active:scale-95 disabled:opacity-50">
              🖨️ Ouvrir pour imprimer
            </button>
            <button disabled={!!busy} onClick={() => run('png', () => exportPng(opts, dpi))} className="h-11 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
              🖼️ Télécharger en PNG
            </button>
          </div>
          {busy && <div className="animate-pulse text-center text-sm font-semibold text-brand-700">Préparation du dessin…</div>}
        </div>

        <div className="flex min-h-[18rem] flex-1 items-center justify-center overflow-auto bg-slate-200 p-4">
          {preview ? (
            <img src={preview} alt="Aperçu de la page" className="max-h-full max-w-full bg-white shadow-xl" style={{ aspectRatio: `${ps.w} / ${ps.h}` }} />
          ) : (
            <div className="animate-pulse text-slate-500">Création de l’aperçu…</div>
          )}
        </div>
      </div>
    </div>
  )
}
