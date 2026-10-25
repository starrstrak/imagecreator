// Registre central : pièces et modules s'y enregistrent, l'UI et le moteur le lisent.
import type { ModuleDefinition, PartDefinition } from './types'

const parts = new Map<string, PartDefinition>()
const modules = new Map<string, ModuleDefinition>()

export function registerPart(def: PartDefinition): PartDefinition {
  if (parts.has(def.type)) console.warn(`Pièce déjà enregistrée : ${def.type}`)
  parts.set(def.type, def)
  return def
}
export function registerModule(def: ModuleDefinition): ModuleDefinition {
  modules.set(def.id, def)
  return def
}
export const getPart = (type: string): PartDefinition | undefined => parts.get(type)
export const getModule = (id: string): ModuleDefinition | undefined => modules.get(id)
export const allParts = (): PartDefinition[] => [...parts.values()]
export const allModules = (): ModuleDefinition[] => [...modules.values()]
/** Pièces d'un module (+ pièces communes), regroupées par catégorie. */
export function partsOfModule(moduleId: string): PartDefinition[] {
  return allParts().filter((p) => p.module === moduleId || p.module === 'commun')
}
