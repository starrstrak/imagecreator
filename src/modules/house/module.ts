// Module MAISON (style CAD) : catégories du catalogue, modèles de départ, création aléatoire.
import { registerModule } from '@/core/registry'
import type { ModuleDefinition } from '@/core/types'
import { presets, surprise } from './presets'

export const houseModule: ModuleDefinition = registerModule({
  id: 'maison',
  label: 'Maison',
  icon: '🏠',
  rootType: 'house.volume',
  defaultView: 'three-quarter',
  categories: [
    { id: 'volume', label: 'Volumes', icon: '🏠' },
    { id: 'toit', label: 'Toit', icon: '🏘️' },
    { id: 'ouvertures', label: 'Portes et fenêtres', icon: '🪟' },
    { id: 'exterieur', label: 'Balcon, escalier', icon: '🏙️' },
    { id: 'jardin', label: 'Jardin', icon: '🌳' },
  ],
  presets,
  surprise,
})
