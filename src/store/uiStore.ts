// État de l'interface (hors création) : mode, rendu, caméra, panneaux. Réglages mémorisés localement.
import { create } from 'zustand'

export type ViewPreset = 'front' | 'side' | 'top' | 'three-quarter'
export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none'

interface UiState {
  mode: 'easy' | 'expert'
  renderMode: 'trait' | 'plein'
  lineWidth: number
  hiddenLines: boolean
  projection: 'persp' | 'ortho'
  showGrid: boolean
  showDims: boolean
  showHandles: boolean
  /** Mode « plan CAD » : vue du dessus orthographique, toit masqué, cotes affichées */
  planMode: boolean
  gizmo: GizmoMode
  moduleId: string
  category: string | null
  showGallery: boolean
  showPrint: boolean
  /** Demande de changement de vue (id incrémenté pour redéclencher) */
  viewRequest: { preset: ViewPreset; id: number }
  /** Animations d'ouverture (porte…) pilotées globalement */
  playing: boolean
  toast: string | null
  set: (p: Partial<UiState>) => void
  goView: (preset: ViewPreset) => void
  togglePlan: () => void
  notify: (msg: string) => void
}

const KEY = 'atelier3d.ui'
function load(): Partial<UiState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}
const saved = load()

export const useUi = create<UiState>((set, get) => ({
  mode: 'easy',
  renderMode: 'trait',
  lineWidth: 2.2,
  hiddenLines: false,
  projection: 'persp',
  showGrid: true,
  showDims: false,
  showHandles: true,
  planMode: false,
  gizmo: 'translate',
  moduleId: 'vehicule',
  category: null,
  showGallery: false,
  showPrint: false,
  viewRequest: { preset: 'three-quarter', id: 0 },
  playing: false,
  toast: null,
  ...saved,
  set: (p) => set(p),
  goView: (preset) => set({ viewRequest: { preset, id: get().viewRequest.id + 1 } }),
  togglePlan: () => {
    const on = !get().planMode
    if (on) set({ planMode: true, projection: 'ortho', showDims: true, hiddenLines: false })
    else set({ planMode: false, showDims: false })
    get().goView(on ? 'top' : 'three-quarter')
  },
  notify: (msg) => {
    set({ toast: msg })
    setTimeout(() => get().toast === msg && set({ toast: null }), 2600)
  },
}))

useUi.subscribe((s) => {
  try {
    const { mode, renderMode, lineWidth, hiddenLines, projection, showGrid, showDims, showHandles, gizmo, moduleId } = s
    localStorage.setItem(KEY, JSON.stringify({ mode, renderMode, lineWidth, hiddenLines, projection, showGrid, showDims, showHandles, gizmo, moduleId }))
  } catch {
    /* stockage indisponible : on ignore */
  }
})
