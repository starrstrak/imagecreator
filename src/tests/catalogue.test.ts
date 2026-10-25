// Génère docs/CATALOGUE.md (liste complète des pièces et paramètres) : `npm run catalogue`.
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import '@/modules'
import { allModules, allParts } from '@/core/registry'

describe('catalogue', () => {
  it.skipIf(!process.env.GEN_CATALOGUE)('écrit docs/CATALOGUE.md', () => {
    const out: string[] = ['# Catalogue des pièces', '', 'Fichier généré automatiquement (`npm run catalogue`) à partir des schémas de paramètres.', '']
    const groups = ['commun', ...allModules().map((m) => m.id)]
    for (const g of groups) {
      const mod = allModules().find((m) => m.id === g)
      out.push(`## ${mod ? `${mod.icon} Module ${mod.label}` : '🧱 Pièces communes'}`, '')
      const parts = allParts().filter((p) => p.module === g)
      for (const p of parts) {
        out.push(`### ${p.icon} ${p.label} — \`${p.type}\``, '')
        if (p.followsParent) out.push(`*S'adapte à :* ${p.followsParent.map((t) => `\`${t}\``).join(', ')}`, '')
        if (p.variants?.length) out.push(`*Variantes prêtes à l'emploi :* ${p.variants.map((v) => `${v.icon} ${v.label}`).join(' · ')}`, '')
        if (p.animate) out.push(`*Animation :* ${p.animate.label}`, '')
        out.push('| Réglage | Type | Plage du curseur | Défaut | Mode |', '|---|---|---|---|---|')
        for (const s of p.schema) {
          const range = s.kind === 'number' ? `${s.soft?.[0] ?? s.min} → ${s.soft?.[1] ?? s.max}${s.unit ? ' ' + s.unit : ''}` : s.kind === 'choice' ? s.options.map((o) => o.label).join(', ') : '—'
          const type = s.kind === 'number' ? 'curseur' : s.kind === 'bool' ? 'interrupteur' : s.kind === 'choice' ? 'choix' : 'texte'
          out.push(`| ${s.label} (${s.group}) | ${type} | ${range} | ${String(s.default)} | ${s.level === 'easy' ? 'Facile' : 'Expert'} |`)
        }
        out.push('')
      }
    }
    writeFileSync('docs/CATALOGUE.md', out.join('\n'))
  })
})
