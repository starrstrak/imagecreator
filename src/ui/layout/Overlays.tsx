// Fenêtres : galerie de modèles de départ, message (toast).
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { getModule } from '@/core/registry'
import { fr } from '@/ui/i18n/fr'

export function Gallery() {
  const show = useUi((s) => s.showGallery)
  const moduleId = useUi((s) => s.moduleId)
  const set = useUi((s) => s.set)
  const applyPreset = useScene((s) => s.applyPreset)
  const mod = getModule(moduleId)
  if (!show || !mod) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => set({ showGallery: false })}>
      <div className="max-h-[85vh] w-full max-w-3xl animate-pop overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-brand-700">🖼️ {fr.gallery} — {mod.label}</h2>
          <button className="h-10 w-10 rounded-full bg-slate-100 text-xl hover:bg-slate-200" onClick={() => set({ showGallery: false })} aria-label="Fermer">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {mod.presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                applyPreset(p)
                set({ showGallery: false })
                useUi.getState().goView(mod.defaultView)
              }}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 p-4 text-center transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lg active:scale-95"
            >
              <span className="text-5xl">{p.icon}</span>
              <span className="font-bold">{p.label}</span>
              {p.description && <span className="text-xs text-slate-500">{p.description}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Toast() {
  const t = useUi((s) => s.toast)
  if (!t) return null
  return <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-pop rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl">{t}</div>
}
