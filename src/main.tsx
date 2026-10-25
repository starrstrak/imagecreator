import { createRoot } from 'react-dom/client'
import './index.css'
import './modules'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)

// Aide au débogage et aux tests en développement uniquement
if (import.meta.env.DEV) {
  void import('./store/sceneStore').then((m) => ((window as unknown as Record<string, unknown>).__scene = m.useScene))
  void import('./store/uiStore').then((m) => ((window as unknown as Record<string, unknown>).__ui = m.useUi))
}
