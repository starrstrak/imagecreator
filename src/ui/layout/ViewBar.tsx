// Barre flottante sur la vue 3D : vues, projection, rendu, épaisseur de trait, gizmo.
import { useUi, type GizmoMode, type ViewPreset } from '@/store/uiStore'
import { fr } from '@/ui/i18n/fr'

function Pill({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-10 min-w-[2.5rem] items-center justify-center gap-1 rounded-xl px-2.5 text-sm font-bold transition active:scale-90 ${
        active ? 'bg-brand-500 text-white shadow' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export function ViewBar() {
  const u = useUi()
  const views: ViewPreset[] = ['three-quarter', 'front', 'side', 'top']
  const gizmos: [GizmoMode, string, string][] = [
    ['translate', '✥', fr.move],
    ['rotate', '⟳', fr.rotate],
    ['scale', '⤢', fr.scale],
    ['none', '🚫', 'Aucun gizmo'],
  ]
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        <div className="pointer-events-auto flex gap-1 rounded-2xl bg-white/80 p-1 backdrop-blur">
          {views.map((v) => (
            <Pill key={v} title={`Vue ${fr.views[v]}`} onClick={() => u.goView(v)}>
              {fr.views[v]}
            </Pill>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-2xl bg-white/80 p-1 backdrop-blur">
          <Pill title={fr.persp} active={u.projection === 'persp'} onClick={() => u.set({ projection: 'persp' })}>🎥</Pill>
          <Pill title={fr.ortho} active={u.projection === 'ortho'} onClick={() => u.set({ projection: 'ortho' })}>📐</Pill>
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-2xl bg-white/80 p-1 backdrop-blur">
          <Pill title={fr.trait} active={u.renderMode === 'trait'} onClick={() => u.set({ renderMode: 'trait' })}>✏️ {fr.trait}</Pill>
          <Pill title={fr.plein} active={u.renderMode === 'plein'} onClick={() => u.set({ renderMode: 'plein' })}>🎨</Pill>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-end gap-1.5">
        <div className="pointer-events-auto flex gap-1 rounded-2xl bg-white/80 p-1 backdrop-blur">
          {gizmos.map(([m, ic, t]) => (
            <Pill key={m} title={t} active={u.gizmo === m} onClick={() => u.set({ gizmo: m })}>{ic}</Pill>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-1 backdrop-blur" title={fr.lines}>
          <span className="text-sm font-bold text-slate-600">〰️</span>
          <input type="range" min={0.5} max={8} step={0.1} value={u.lineWidth} onChange={(e) => u.set({ lineWidth: parseFloat(e.target.value) })} className="w-24 accent-brand-500" />
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-2xl bg-white/80 p-1 backdrop-blur">
          <Pill title={fr.hiddenLines} active={u.hiddenLines} onClick={() => u.set({ hiddenLines: !u.hiddenLines })}>┄</Pill>
          <Pill title={fr.grid} active={u.showGrid} onClick={() => u.set({ showGrid: !u.showGrid })}>▦</Pill>
          <Pill title={fr.dims} active={u.showDims} onClick={() => u.set({ showDims: !u.showDims })}>📏</Pill>
          <Pill title={fr.handles} active={u.showHandles} onClick={() => u.set({ showHandles: !u.showHandles })}>🔵</Pill>
          <Pill title={fr.playOpen} active={u.playing} onClick={() => u.set({ playing: !u.playing })}>{u.playing ? '⏸' : '▶️'}</Pill>
        </div>
      </div>
    </>
  )
}
