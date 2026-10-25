// Types du moteur : schéma de paramètres déclaratif, pièces, nœuds de scène.
import type * as THREE from 'three'

export type Vec3 = [number, number, number]
export type Level = 'easy' | 'expert'
export type ParamValue = number | boolean | string
export type ParamValues = Record<string, ParamValue>

// ---------------------------------------------------------------------------
// Schéma de paramètres (génère automatiquement les curseurs de l'interface)
// ---------------------------------------------------------------------------
interface ParamBase {
  key: string
  label: string
  /** Infobulle en langage simple */
  tip?: string
  /** Groupe de l'inspecteur (repliable) */
  group: string
  /** « easy » = visible en mode Facile ; « expert » = uniquement en mode Expert */
  level: Level
  /** Condition d'affichage selon les autres valeurs */
  showIf?: (p: ParamValues) => boolean
}

export interface NumberParam extends ParamBase {
  kind: 'number'
  /** Bornes de sécurité très larges (valeur saisissable au clavier) */
  min: number
  max: number
  step: number
  default: number
  /** Plage confortable du curseur (par défaut min..max) */
  soft?: [number, number]
  unit?: string
}
export interface BoolParam extends ParamBase {
  kind: 'bool'
  default: boolean
}
export interface ChoiceOption {
  value: string
  label: string
  icon?: string
}
export interface ChoiceParam extends ParamBase {
  kind: 'choice'
  options: ChoiceOption[]
  default: string
}
export interface TextParam extends ParamBase {
  kind: 'text'
  default: string
  maxLength?: number
}
export type ParamSchema = NumberParam | BoolParam | ChoiceParam | TextParam

// ---------------------------------------------------------------------------
// Pièces
// ---------------------------------------------------------------------------
/** Poignée 3D qui pilote directement un paramètre (étirer, élargir…) */
export interface Handle {
  id: string
  label: string
  /** Position locale de la poignée */
  position: Vec3
  /** Axe local de glisser */
  axis: Vec3
  /** Clé du paramètre piloté */
  param: string
  /** Unités de paramètre par mètre de glisser (1 = direct, 2 = diamètre pour un rayon…) */
  ratio: number
}

/** Données exposées par une pièce à ses enfants. `key` change quand les données changent. */
export interface Provided {
  key: string
}

/** Description d'un enfant, transmise aux pièces qui en ont besoin (ex. mur percé par ses fenêtres). */
export interface ChildInfo {
  type: string
  params: ParamValues
  pos: Vec3
  rot: Vec3
}

/** Cote affichée en mode plan CAD : repère local de la pièce. */
export interface DimLine {
  a: Vec3
  b: Vec3
  /** Décalage de la ligne de cote (perpendiculaire à a→b, direction `dir`) */
  offset: number
  dir: Vec3
  label: string
}

export interface BuildContext {
  /** Données exposées par la pièce parente (uniquement si la pièce la « suit ») */
  parent?: unknown
  /** Enfants directs visibles (seulement si la pièce déclare `consumesChildren`) */
  children?: ChildInfo[]
}

/** Résultat de l'adaptation d'une pièce à sa pièce parente */
export interface FitResult {
  /** Valeurs de paramètres imposées par le parent (curseurs « liés ») */
  params?: ParamValues
  /** Position / rotation imposées (local au parent) */
  pos?: Vec3
  rot?: Vec3
}

export interface PartDefinition {
  type: string
  label: string
  category: string
  icon: string
  /** Module d'appartenance : 'vehicule' | 'maison' | 'commun' */
  module: string
  schema: ParamSchema[]
  /** Type(s) de parent auquel la pièce s'adapte (« Suivre le parent ») */
  followsParent?: string[]
  /** Pièce sans enfant adaptables ? (par défaut false) */
  /** Données exposées aux enfants (fonctions de surface, ancrages…) */
  provide?: (p: ParamValues, parentProvided?: unknown) => unknown
  /** Adaptation à la pièce parente (ex. jante qui suit la roue) */
  fit?: (parentProvided: unknown, own: ParamValues, parentParams: ParamValues) => FitResult
  /** Variantes prêtes à l'emploi : un clic règle plusieurs paramètres d'un coup */
  variants?: PartVariant[]
  /** La géométrie dépend des enfants (ex. murs percés par les ouvertures) */
  consumesChildren?: boolean
  /** Pièce masquée en mode plan (toit, jardin…) */
  planHide?: boolean
  /** Les cotes de cette pièce ne s'affichent que lorsqu'elle est sélectionnée */
  dimsSelectedOnly?: boolean
  /** Cotes automatiques (mode plan CAD) */
  dims?: (p: ParamValues) => DimLine[]
  /** Construit la géométrie paramétrique (repère local, mètres, Y vers le haut) */
  build: (p: ParamValues, ctx: BuildContext) => THREE.Object3D
  /** Poignées 3D */
  handles?: (p: ParamValues) => Handle[]
  /** Animation : clé d'un paramètre 0..1 animable (ex. ouverture de porte) */
  animate?: { param: string; label: string; from: number; to: number }
}

export interface PartVariant {
  id: string
  label: string
  icon: string
  params: ParamValues
}

export interface ModuleDefinition {
  id: string
  label: string
  icon: string
  /** Catégories affichées dans le catalogue, dans l'ordre */
  categories: { id: string; label: string; icon: string }[]
  /** Pièce à poser comme racine d'une nouvelle création */
  rootType: string
  presets: Preset[]
  /** Création aléatoire « Surprise » */
  surprise: (rng: () => number) => Preset
  /** Vues de départ proposées */
  defaultView: 'three-quarter' | 'front' | 'side' | 'top'
}

// ---------------------------------------------------------------------------
// Scène
// ---------------------------------------------------------------------------
export type MirrorMode = 'none' | 'x' | 'y' | 'z'

export interface SceneNode {
  id: string
  type: string
  name: string
  params: ParamValues
  pos: Vec3
  /** Degrés */
  rot: Vec3
  scale: Vec3
  uniformScale: boolean
  mirror: MirrorMode
  repeatCount: number
  repeatStep: Vec3
  /** Rotation ajoutée à chaque répétition (degrés) */
  repeatRot: Vec3
  parentId: string | null
  /** La pièce suit la pièce parente (jante ↔ roue, porte ↔ carrosserie) */
  follow: boolean
  locked: boolean
  hidden: boolean
}

export interface SceneState {
  version: number
  name: string
  module: string
  nodes: Record<string, SceneNode>
  /** Ordre d'affichage (liste plate, parents avant enfants) */
  order: string[]
}

/** Modèle de départ : liste de nœuds décrits sans identifiant */
export interface PresetNode {
  /** Clé locale pour référencer le parent */
  key: string
  type: string
  name?: string
  parent?: string
  params?: ParamValues
  pos?: Vec3
  rot?: Vec3
  scale?: Vec3
  mirror?: MirrorMode
  repeatCount?: number
  repeatStep?: Vec3
  follow?: boolean
}
export interface Preset {
  id: string
  label: string
  icon: string
  description?: string
  nodes: PresetNode[]
}
