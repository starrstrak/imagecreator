// Mise en page : barre du haut, banque de pièces à gauche, vue 3D au centre, inspecteur à droite.
// Sur petit écran (tablette / téléphone), les panneaux deviennent des tiroirs.
import { useEffect, useState } from 'react'
import { Viewport } from '@/scene/Viewport'
import { Toolbar } from '@/ui/layout/Toolbar'
import { ViewBar } from '@/ui/layout/ViewBar'
import { Gallery, Toast } from '@/ui/layout/Overlays'
import { Catalog } from '@/ui/catalog/Catalog'
import { Inspector } from '@/ui/inspector/Inspector'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { getModule } from '@/core/registry'
import { loadAuto, startAutosave } from '@/store/persist'
import { PrintDialog } from '@/ui/print/PrintDialog'

function useShortcuts() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      const st = useScene.getState()
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? st.redo() : st.undo()
      } else if (ctrl && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        st.redo()
      } else if (ctrl && e.key.toLowerCase() === 'd' && st.selectedId) {
        e.preventDefault()
        st.duplicateNode(st.selectedId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && st.selectedId) {
        st.removeNode(st.selectedId)
      } else if (e.key === 'Escape') st.select(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
}

export function App() {
  const [ready, setReady] = useState(false)
  const [left, setLeft] = useState(false)
  const [right, setRight] = useState(false)
  const selectedId = useScene((s) => s.selectedId)
  const moduleId = useUi((s) => s.moduleId)
  useShortcuts()

  // Démarrage : reprise de la sauvegarde automatique, sinon nouvelle création du module
  useEffect(() => {
    void (async () => {
      const saved = await loadAuto()
      const st = useScene.getState()
      if (saved && Object.keys(saved.nodes).length > 0) {
        try {
          st.loadScene(saved)
          useUi.getState().set({ moduleId: saved.module })
        } catch {
          st.newScene(moduleId)
        }
      } else {
        st.newScene(moduleId)
        // Premier lancement : on propose les modèles de départ
        useUi.getState().set({ showGallery: true })
      }
      startAutosave()
      setReady(true)
      useUi.getState().goView(getModule(useScene.getState().scene.module)?.defaultView ?? 'three-quarter')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sur petit écran, sélectionner une pièce ouvre le tiroir des réglages
  useEffect(() => {
    if (selectedId && window.innerWidth < 1280) setRight(true)
  }, [selectedId])

  return (
    <div className="flex h-full flex-col">
      <Toolbar />
      <div className="relative flex min-h-0 flex-1">
        <aside
          className={`absolute inset-y-0 left-0 z-20 w-72 border-r border-slate-200 bg-white shadow-xl transition-transform xl:static xl:translate-x-0 xl:shadow-none ${
            left ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Catalog />
        </aside>

        <main className="relative min-w-0 flex-1">
          {ready && <Viewport />}
          <ViewBar />
          <div className="absolute right-3 top-3 flex gap-1.5 xl:hidden">
            <button className="h-11 rounded-xl bg-white px-3 text-sm font-bold shadow ring-1 ring-slate-200" onClick={() => { setLeft(!left); setRight(false) }}>🧩 Pièces</button>
            <button className="h-11 rounded-xl bg-white px-3 text-sm font-bold shadow ring-1 ring-slate-200" onClick={() => { setRight(!right); setLeft(false) }}>⚙️ Réglages</button>
          </div>
        </main>

        <aside
          className={`absolute inset-y-0 right-0 z-20 w-80 overflow-y-auto border-l border-slate-200 bg-slate-50 shadow-xl transition-transform xl:static xl:translate-x-0 xl:shadow-none ${
            right ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <Inspector />
        </aside>
      </div>
      <Gallery />
      <PrintDialog />
      <Toast />
    </div>
  )
}
