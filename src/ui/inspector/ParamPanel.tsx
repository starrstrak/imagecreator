// Panneau de réglages généré AUTOMATIQUEMENT à partir d'un schéma de paramètres.
import { useState } from 'react'
import type { ChoiceParam, NumberParam, ParamSchema, ParamValue, ParamValues, TextParam } from '@/core/types'
import { useUi } from '@/store/uiStore'
import { fr } from '@/ui/i18n/fr'

interface PanelProps {
  schema: ParamSchema[]
  values: ParamValues
  onChange: (key: string, v: ParamValue) => void
  linked?: Set<string>
  /** Groupes ouverts par défaut */
  openGroups?: string[]
  disabled?: boolean
}

function fmt(v: number, step: number): string {
  const d = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3
  return (Math.round(v * 10 ** d) / 10 ** d).toString()
}

function Slider({ s, value, onChange, linked, disabled }: { s: NumberParam; value: number; onChange: (v: number) => void; linked: boolean; disabled?: boolean }) {
  const [lo, hi] = s.soft ?? [s.min, s.max]
  // Le curseur s'élargit si la valeur dépasse la plage confortable (aucune limite artificielle)
  const a = Math.min(lo, value)
  const b = Math.max(hi, value)
  return (
    <div className={`py-1.5 ${linked ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <label className="font-medium text-ink" title={s.tip}>
          {s.label}
          {linked && <span className="ml-1 rounded bg-sun/30 px-1 text-[10px] font-semibold text-amber-800">🔗 {fr.linked}</span>}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5 text-right text-sm"
            value={Number.isFinite(value) ? fmt(value, s.step) : ''}
            step={s.step}
            min={s.min}
            max={s.max}
            disabled={disabled || linked}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              if (Number.isFinite(n)) onChange(Math.min(s.max, Math.max(s.min, n)))
            }}
          />
          {s.unit && <span className="w-4 text-xs text-slate-500">{s.unit}</span>}
        </div>
      </div>
      <input
        type="range"
        className="mt-1 h-7 w-full cursor-pointer accent-brand-500"
        min={a}
        max={b}
        step={s.step >= 1 ? s.step : (b - a) / 1000}
        value={value}
        title={s.tip}
        disabled={disabled || linked}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={() => onChange(s.default)}
      />
    </div>
  )
}

function Choice({ s, value, onChange, big, disabled }: { s: ChoiceParam; value: string; onChange: (v: string) => void; big: boolean; disabled?: boolean }) {
  return (
    <div className="py-1.5">
      <div className="mb-1 text-sm font-medium text-ink" title={s.tip}>
        {s.label}
      </div>
      <div className={`grid gap-1.5 ${big ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {s.options.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center justify-center rounded-xl border-2 px-1 py-1.5 text-center leading-tight transition active:scale-95 ${
              big ? 'min-h-[3.4rem] text-sm' : 'min-h-[2.4rem] text-xs'
            } ${value === o.value ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700' : 'border-slate-200 bg-white hover:border-brand-100 hover:bg-slate-50'}`}
          >
            {o.icon && <span className={big ? 'text-xl' : 'text-base'}>{o.icon}</span>}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TextField({ s, value, onChange, disabled }: { s: TextParam; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="py-1.5">
      <div className="mb-1 text-sm font-medium text-ink" title={s.tip}>{s.label}</div>
      <input
        type="text"
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        value={value}
        maxLength={s.maxLength ?? 80}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function Toggle({ label, tip, value, onChange, disabled }: { label: string; tip?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5 text-sm font-medium text-ink" title={tip}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-brand-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function ParamPanel({ schema, values, onChange, linked, openGroups = [], disabled }: PanelProps) {
  const mode = useUi((s) => s.mode)
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const easy = mode === 'easy'
  const visible = schema.filter((s) => (!easy || s.level === 'easy') && (!s.showIf || s.showIf(values)))
  const groups: string[] = []
  for (const s of visible) if (!groups.includes(s.group)) groups.push(s.group)

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        // Mode facile : tout est ouvert. Mode expert : seuls les groupes principaux sont ouverts.
        const defaultOpen = easy || openGroups.includes(g)
        const open = closed[g] === undefined ? defaultOpen : !closed[g]
        return (
          <section key={g} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-100"
              onClick={() => setClosed({ ...closed, [g]: open })}
            >
              <span>{g}</span>
              <span className={`transition ${open ? 'rotate-90' : ''}`}>▸</span>
            </button>
            {open && (
              <div className="animate-pop px-3 pb-2">
                {visible
                  .filter((s) => s.group === g)
                  .map((s) =>
                    s.kind === 'number' ? (
                      <Slider key={s.key} s={s} value={values[s.key] as number} onChange={(v) => onChange(s.key, v)} linked={!!linked?.has(s.key)} disabled={disabled} />
                    ) : s.kind === 'choice' ? (
                      <Choice key={s.key} s={s} value={values[s.key] as string} onChange={(v) => onChange(s.key, v)} big={easy} disabled={disabled} />
                    ) : s.kind === 'text' ? (
                      <TextField key={s.key} s={s} value={values[s.key] as string} onChange={(v) => onChange(s.key, v)} disabled={disabled} />
                    ) : (
                      <Toggle key={s.key} label={s.label} tip={s.tip} value={values[s.key] as boolean} onChange={(v) => onChange(s.key, v)} disabled={disabled} />
                    ),
                  )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
