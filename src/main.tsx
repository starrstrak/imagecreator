import { createRoot } from 'react-dom/client'
import './index.css'
import './modules'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)

// Fonctionnement hors ligne : le service worker met l'application en cache (production uniquement)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js').catch(() => undefined))
}

// Aide au débogage et aux tests en développement uniquement
if (import.meta.env.DEV) {
  void import('./store/sceneStore').then((m) => ((window as unknown as Record<string, unknown>).__scene = m.useScene))
  void import('./store/uiStore').then((m) => ((window as unknown as Record<string, unknown>).__ui = m.useUi))
}
