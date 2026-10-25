// Barre supérieure : fichier, historique, module, mode Facile / Expert, surprise, modèles, impression.
import { useRef } from 'react'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { allModules, getModule } from '@/core/registry'
import { downloadProject, readProjectFile } from '@/store/persist'
import { makeRng } from '@/utils/random'
import { fr } from '@/ui/i18n/fr'

function Btn({ children, label, onClick, disabled, strong }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; strong?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition active:scale-95 disabled:opacity-40 ${
        strong ? 'bg-sun text-ink shadow hover:brightness-105' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export function Toolbar() {
  const fileRef = useRef<HTMLInputElement>(null)
  const scene = useScene((s) => s.scene)
  const canUndo = useScene((s) => s.past.length > 0)
  const canRedo = useScene((s) => s.future.length > 0)
  const { undo, redo, newScene, loadScene, applyPreset } = useScene.getState()
  const mode = useUi((s) => s.mode)
  const moduleId = useUi((s) => s.moduleId)
  const set = useUi((s) => s.set)
  const notify = useUi((s) => s.notify)

  const switchModule = (id: string) => {
    set({ moduleId: id, category: null })
    newScene(id)
    useUi.getState().goView(getModule(id)?.defaultView ?? 'three-quarter')
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur">
      <div className="mr-1 flex items-center gap-2">
        <span className="text-3xl">🎨</span>
        <div className="hidden leading-tight lg:block">
          <div className="text-base font-extrabold text-brand-700">{fr.appName}</div>
          <div className="text-xs text-slate-500">{fr.tagline}</div>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {allModules().map((m) => (
          <button
            key={m.id}
            onClick={() => moduleId !== m.id && switchModule(m.id)}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition ${moduleId === m.id ? 'bg-white text-brand-700 shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="text-lg">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <Btn label={fr.undo} onClick={undo} disabled={!canUndo}>↩️<span className="hidden xl:inline">{fr.undo}</span></Btn>
        <Btn label={fr.redo} onClick={redo} disabled={!canRedo}>↪️<span className="hidden xl:inline">{fr.redo}</span></Btn>
      </div>

      <div className="flex gap-1">
        <Btn label={fr.new} onClick={() => window.confirm(fr.confirmNew) && newScene(moduleId)}>📄<span className="hidden xl:inline">{fr.new}</span></Btn>
        <Btn label={fr.open} onClick={() => fileRef.current?.click()}>📂<span className="hidden xl:inline">{fr.open}</span></Btn>
        <Btn label={fr.save} onClick={() => downloadProject(scene)}>💾<span className="hidden xl:inline">{fr.save}</span></Btn>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const s = await readProjectFile(f)
              loadScene(s)
              set({ moduleId: s.module })
              notify('Projet chargé ✔')
            } catch {
              notify('Ce fichier n’est pas un projet valide.')
            }
          }}
        />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1" title={mode === 'easy' ? fr.easyTip : fr.expertTip}>
          {(['easy', 'expert'] as const).map((m) => (
            <button
              key={m}
              onClick={() => set({ mode: m })}
              className={`h-9 rounded-xl px-3 text-sm font-bold transition ${mode === m ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
            >
              {m === 'easy' ? `😀 ${fr.easy}` : `🛠️ ${fr.expert}`}
            </button>
          ))}
        </div>
        <Btn label={fr.surpriseTip} strong onClick={() => { const mod = getModule(moduleId); if (mod) applyPreset(mod.surprise(makeRng())) }}>🎲 {fr.surprise}</Btn>
        <Btn label={fr.galleryTip} onClick={() => set({ showGallery: true })}>🖼️ {fr.gallery}</Btn>
        <Btn label={fr.printTip} onClick={() => set({ showPrint: true })}>🖨️ {fr.print}</Btn>
      </div>
    </header>
  )
}
