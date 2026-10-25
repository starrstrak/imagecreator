// Inspecteur : réglages de la pièce sélectionnée (schéma de la pièce + paramètres communs).
import { useMemo, useState } from 'react'
import { useScene } from '@/store/sceneStore'
import { useUi } from '@/store/uiStore'
import { allParts, getPart } from '@/core/registry'
import { resolveNode } from '@/core/resolve'
import { commonSchema, getCommon } from '@/core/common'
import { fr } from '@/ui/i18n/fr'
import { ParamPanel } from './ParamPanel'

function IconBtn({ label, onClick, children, active, danger }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl transition active:scale-90 ${
        active ? 'border-brand-500 bg-brand-50' : danger ? 'border-red-200 bg-white hover:bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export function Inspector() {
  const selectedId = useScene((s) => s.selectedId)
  const nodes = useScene((s) => s.scene.nodes)
  const st = useScene.getState
  const mode = useUi((s) => s.mode)
  const [showReplace, setShowReplace] = useState(false)

  const res = selectedId ? resolveNode(nodes, selectedId) : null
  const node = res?.node
  const def = node ? getPart(node.type) : undefined

  const commonValues = useMemo(() => {
    const v: Record<string, number | boolean | string> = {}
    if (node) for (const s of commonSchema) v[s.key] = getCommon(node, s.key)
    return v
  }, [node])

  if (!node || !def || !res || !selectedId) {
    return <div className="p-6 text-center text-slate-500">👆 {fr.noSelection}</div>
  }
  const id = selectedId
  const parent = node.parentId ? nodes[node.parentId] : null
  const canFollow = !!def.fit && !!parent
  const sameCategory = allParts().filter((p) => p.category === def.category && p.module === def.module && p.type !== def.type)

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{def.icon}</span>
        <input
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 text-lg font-bold hover:border-slate-300 focus:border-brand-500"
          value={node.name}
          onChange={(e) => st().rename(id, e.target.value)}
          aria-label="Nom de la pièce"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <IconBtn label={fr.duplicate} onClick={() => st().duplicateNode(id)}>📑</IconBtn>
        <IconBtn label={node.hidden ? fr.show : fr.hide} onClick={() => st().setFlag(id, 'hidden', !node.hidden)} active={node.hidden}>{node.hidden ? '🙈' : '👁️'}</IconBtn>
        <IconBtn label={node.locked ? fr.unlock : fr.lock} onClick={() => st().setFlag(id, 'locked', !node.locked)} active={node.locked}>{node.locked ? '🔒' : '🔓'}</IconBtn>
        {sameCategory.length > 0 && (
          <IconBtn label={fr.replace} onClick={() => setShowReplace(!showReplace)} active={showReplace}>🔁</IconBtn>
        )}
        <IconBtn label={fr.reset} onClick={() => st().resetParams(id)}>↺</IconBtn>
        <IconBtn label={fr.remove} onClick={() => st().removeNode(id)} danger>🗑️</IconBtn>
      </div>

      {showReplace && (
        <div className="animate-pop rounded-xl border border-slate-200 bg-white p-2">
          <div className="mb-1 text-xs font-semibold text-slate-500">{fr.replace}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {sameCategory.map((p) => (
              <button
                key={p.type}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-left text-sm hover:bg-brand-50"
                onClick={() => {
                  st().replaceType(id, p.type)
                  setShowReplace(false)
                }}
              >
                <span className="text-xl">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {node.locked && <div className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">🔒 Pièce verrouillée : déverrouille-la pour la modifier.</div>}

      {canFollow && (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium" title={fr.followTip}>
          <span>🔗 {fr.follow}</span>
          <input type="checkbox" className="h-5 w-5 accent-brand-500" checked={node.follow} onChange={(e) => st().setFlag(id, 'follow', e.target.checked)} />
        </label>
      )}

      {def.variants && (
        <div>
          <div className="mb-1 text-sm font-bold text-slate-700">Choisir un type</div>
          <div className="grid grid-cols-3 gap-1.5">
            {def.variants.map((v) => (
              <button
                key={v.id}
                disabled={node.locked}
                title={v.label}
                onClick={() => st().setParams(id, v.params)}
                className="flex flex-col items-center rounded-xl border-2 border-slate-200 bg-white px-1 py-1.5 text-center text-xs font-semibold leading-tight transition hover:border-brand-500 hover:bg-brand-50 active:scale-95"
              >
                <span className={mode === 'easy' ? 'text-3xl' : 'text-2xl'}>{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ParamPanel
        schema={def.schema}
        values={res.params}
        linked={res.linked}
        disabled={node.locked}
        onChange={(k, v) => st().setParam(id, k, v)}
        openGroups={[def.schema[0]?.group ?? '']}
      />

      <div className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{mode === 'easy' ? 'Placer la pièce' : 'Transformation'}</div>
      <ParamPanel schema={commonSchema} values={commonValues} disabled={node.locked} onChange={(k, v) => st().setCommon(id, k, v)} openGroups={['Position']} />
    </div>
  )
}
