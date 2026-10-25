// Module VÉHICULE : catégories du catalogue, modèles de départ, création aléatoire.
import { registerModule } from '@/core/registry'
import type { ModuleDefinition } from '@/core/types'
import { presets, surprise } from './presets'

export const vehicleModule: ModuleDefinition = registerModule({
  id: 'vehicule',
  label: 'Véhicule',
  icon: '🚗',
  rootType: 'vehicule.chassis',
  defaultView: 'three-quarter',
  categories: [
    { id: 'chassis', label: 'Châssis', icon: '🚗' },
    { id: 'roues', label: 'Roues', icon: '🛞' },
    { id: 'carrosserie', label: 'Carrosserie', icon: '🧰' },
    { id: 'portes', label: 'Portes', icon: '🚪' },
    { id: 'vitres', label: 'Vitres', icon: '🪟' },
    { id: 'eclairage', label: 'Lumières', icon: '💡' },
    { id: 'equipements', label: 'Accessoires', icon: '🔧' },
    { id: 'special', label: 'Spécial', icon: '🚀' },
  ],
  presets,
  surprise,
})
