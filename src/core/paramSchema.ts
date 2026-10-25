// Fabriques déclaratives pour écrire un schéma de paramètres en une ligne.
import type { BoolParam, ChoiceOption, ChoiceParam, Level, NumberParam, ParamSchema, ParamValues } from './types'

interface Opts {
  tip?: string
  group?: string
  level?: Level
  step?: number
  soft?: [number, number]
  unit?: string
  showIf?: (p: ParamValues) => boolean
}

/** Bornes de sécurité très larges autour de la plage confortable. */
const WIDE = 1000

/**
 * Curseur continu. `soft` = plage confortable du curseur ;
 * min/max = bornes de sécurité (par défaut très larges, saisie clavier libre).
 */
export function num(
  key: string,
  label: string,
  def: number,
  soft: [number, number],
  o: Opts & { min?: number; max?: number } = {},
): NumberParam {
  return {
    kind: 'number',
    key,
    label,
    tip: o.tip,
    group: o.group ?? 'Dimensions',
    level: o.level ?? 'expert',
    min: o.min ?? Math.min(soft[0] - WIDE * Math.abs(soft[1] - soft[0] || 1), -WIDE * 10),
    max: o.max ?? Math.max(soft[1] + WIDE * Math.abs(soft[1] - soft[0] || 1), WIDE * 10),
    step: o.step ?? (Math.abs(soft[1] - soft[0]) > 20 ? 1 : 0.01),
    default: def,
    soft,
    unit: o.unit,
    showIf: o.showIf,
  }
}

/** Curseur strictement positif (la borne basse de sécurité est 0 ou un epsilon). */
export function pos(key: string, label: string, def: number, soft: [number, number], o: Opts = {}): NumberParam {
  return num(key, label, def, soft, { ...o, min: 0, max: Math.max(soft[1] * 100, 1000) })
}

/** Nombre entier (nombre de branches, d'étages…). */
export function int(key: string, label: string, def: number, soft: [number, number], o: Opts & { max?: number } = {}): NumberParam {
  return num(key, label, def, soft, { ...o, step: 1, min: soft[0] < 0 ? -1000 : 0, max: o.max ?? Math.max(soft[1] * 4, 100) })
}

export function bool(key: string, label: string, def: boolean, o: Opts = {}): BoolParam {
  return { kind: 'bool', key, label, tip: o.tip, group: o.group ?? 'Options', level: o.level ?? 'expert', default: def, showIf: o.showIf }
}

export function choice(
  key: string,
  label: string,
  def: string,
  options: (ChoiceOption | [string, string] | [string, string, string])[],
  o: Opts = {},
): ChoiceParam {
  return {
    kind: 'choice',
    key,
    label,
    tip: o.tip,
    group: o.group ?? 'Forme',
    level: o.level ?? 'easy',
    default: def,
    showIf: o.showIf,
    options: options.map((x) => (Array.isArray(x) ? { value: x[0], label: x[1], icon: x[2] } : x)),
  }
}

/** Valeurs par défaut d'un schéma. */
export function defaultsOf(schema: ParamSchema[]): ParamValues {
  const out: ParamValues = {}
  for (const s of schema) out[s.key] = s.default
  return out
}

/** Valide / complète des valeurs selon le schéma (clés inconnues ignorées, manquantes = défaut). */
export function normalizeParams(schema: ParamSchema[], values: ParamValues): ParamValues {
  const out: ParamValues = {}
  for (const s of schema) {
    const v = values[s.key]
    if (v === undefined) out[s.key] = s.default
    else if (s.kind === 'number') out[s.key] = typeof v === 'number' && isFinite(v) ? Math.min(s.max, Math.max(s.min, v)) : s.default
    else if (s.kind === 'bool') out[s.key] = typeof v === 'boolean' ? v : s.default
    else out[s.key] = s.options.some((o) => o.value === v) ? v : s.default
  }
  return out
}
