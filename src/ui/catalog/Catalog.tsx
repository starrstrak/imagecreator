// Banque de pièces (catalogue par catégorie) + arbre de la création.
import { useState } from 'react'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { getModule, getPart, partsOfModule } from '@/core/registry'
import { fr } from '@/ui/i18n/fr'

function Tree() {
  const nodes = useScene((s) => s.scene.nodes)
  const order = useScene((s) => s.scene.order)
  const selectedId = useScene((s) => s.selectedId)
  const select = useScene((s) => s.select)
  const setFlag = useScene((s) => s.setFlag)

  const row = (id: string, depth: number): React.ReactNode => {
    const n = nodes[id]
    const def = getPart(n.type)
    return (
      <div key={id}>
        <div
          className={`flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm ${selectedId === id ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-100'}`}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          <button className="flex min-w-0 flex-1 items-center gap-1.5 text-left" onClick={() => select(id)}>
            <span>{def?.icon ?? '❓'}</span>
            <span className={`truncate ${n.hidden ? 'line-through opacity-50' : ''}`}>{n.name}</span>
          </button>
          <button className="px-1 opacity-60 hover:opacity-100" title={n.hidden ? fr.show : fr.hide} onClick={() => setFlag(id, 'hidden', !n.hidden)}>
            {n.hidden ? '🙈' : '👁️'}
          </button>
          {n.locked && <span title="verrouillée">🔒</span>}
        </div>
        {order.filter((k) => nodes[k]?.parentId === id).map((k) => row(k, depth + 1))}
      </div>
    )
  }
  const roots = order.filter((k) => nodes[k]?.parentId === null)
  return <div className="space-y-0.5">{roots.map((k) => row(k, 0))}</div>
}

export function Catalog() {
  const moduleId = useUi((s) => s.moduleId)
  const category = useUi((s) => s.category)
  const set = useUi((s) => s.set)
  const mode = useUi((s) => s.mode)
  const addPart = useScene((s) => s.addPart)
  const mod = getModule(moduleId)
  const [tab, setTab] = useState<'parts' | 'tree'>('parts')
  if (!mod) return null

  const parts = partsOfModule(moduleId)
  const cats = [...mod.categories, { id: 'formes', label: 'Formes de base', icon: '🧱' }].filter((c) => parts.some((p) => p.category === c.id))
  const active = category && cats.some((c) => c.id === category) ? category : cats[0]?.id

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-slate-200 p-2">
        {(['parts', 'tree'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-2 py-2 text-sm font-bold transition ${tab === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t === 'parts' ? `🧩 ${fr.catalog}` : `🌳 ${fr.yourParts}`}
          </button>
        ))}
      </div>
      {tab === 'tree' ? (
        <div className="flex-1 overflow-y-auto p-2">
          <Tree />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-[4.4rem] shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-200 p-1.5">
            {cats.map((c) => (
              <button
                key={c.id}
                title={c.label}
                onClick={() => set({ category: c.id })}
                className={`flex flex-col items-center rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight transition active:scale-95 ${
                  active === c.id ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-2">
            <div className={`grid gap-2 ${mode === 'easy' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {parts
                .filter((p) => p.category === active)
                .map((p) => (
                  <button
                    key={p.type}
                    onClick={() => addPart(p.type)}
                    title={`Ajouter : ${p.label}`}
                    className="group flex animate-pop flex-col items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white p-2 text-center transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md active:scale-95"
                  >
                    <span className={mode === 'easy' ? 'text-5xl' : 'text-3xl'}>{p.icon}</span>
                    <span className="text-xs font-bold leading-tight text-slate-700">{p.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
