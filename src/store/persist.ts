// Sauvegarde automatique (IndexedDB, repli localStorage) + export / import de fichiers JSON.
import type { SceneState } from '@/core/types'
import { useScene } from './sceneStore'

const DB = 'atelier3d'
const STORE = 'kv'
const KEY = 'autosave'

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}

async function idbSet(value: unknown): Promise<void> {
  const db = await openDb()
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, KEY)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
  db.close()
}
async function idbGet(): Promise<SceneState | undefined> {
  const db = await openDb()
  const v = await new Promise<SceneState | undefined>((res, rej) => {
    const tx = db.transaction(STORE, 'readonly')
    const q = tx.objectStore(STORE).get(KEY)
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
  db.close()
  return v
}

export async function saveAuto(scene: SceneState): Promise<void> {
  try {
    await idbSet(scene)
  } catch {
    try {
      localStorage.setItem('atelier3d.autosave', JSON.stringify(scene))
    } catch {
      /* quota ou mode privé : on abandonne en silence */
    }
  }
}

export async function loadAuto(): Promise<SceneState | undefined> {
  try {
    const v = await idbGet()
    if (v) return v
  } catch {
    /* repli */
  }
  try {
    const s = localStorage.getItem('atelier3d.autosave')
    return s ? (JSON.parse(s) as SceneState) : undefined
  } catch {
    return undefined
  }
}

/** Branche l'autosave (anti-rebond 500 ms) sur le store. */
export function startAutosave(): void {
  let t: ReturnType<typeof setTimeout> | undefined
  let last = useScene.getState().rev
  useScene.subscribe((s) => {
    if (s.rev === last) return
    last = s.rev
    clearTimeout(t)
    t = setTimeout(() => void saveAuto(useScene.getState().scene), 500)
  })
}

/** Télécharge le projet en JSON. */
export function downloadProject(scene: SceneState): void {
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${scene.name.replace(/[^\w\-]+/g, '_') || 'creation'}.atelier3d.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/** Lit un fichier projet choisi par l'utilisateur. */
export async function readProjectFile(file: File): Promise<SceneState> {
  return JSON.parse(await file.text()) as SceneState
}
