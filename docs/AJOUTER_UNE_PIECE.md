# Ajouter une nouvelle pièce ou un nouveau module

Tout est **déclaratif** : on décrit la pièce (paramètres + géométrie), le reste (curseurs, historique, sauvegarde,
gizmo, poignées, symétrie, export) vient gratuitement.

## 1. Une nouvelle pièce dans un module existant (5 minutes)

1. Créer `src/parts/vehicle/ma-piece.ts` (ou `house/`) :

```ts
import * as THREE from 'three'
import { registerPart } from '@/core/registry'
import { bool, choice, int, num, pos } from '@/core/paramSchema'
import { cylinder, mk } from '@/parts/primitives/geo'

registerPart({
  type: 'vehicule.klaxon',           // identifiant unique : « module.nom »
  label: 'Klaxon',                   // nom affiché (français)
  category: 'equipements',           // une catégorie du module (voir modules/*/module.ts)
  icon: '📯',
  module: 'vehicule',
  schema: [                          // → génère automatiquement les curseurs
    pos('rayon', 'Rayon', 0.08, [0.02, 0.4], { group: 'Forme', level: 'easy', unit: 'm', tip: 'Taille du pavillon.' }),
    pos('longueur', 'Longueur', 0.2, [0.05, 1], { group: 'Forme', unit: 'm' }),
    int('spires', 'Spires', 2, [0, 6], { group: 'Détails' }),
    bool('chrome', 'Chromé', true, { group: 'Détails' }),
    choice('type', 'Type', 'trompe', [['trompe', 'Trompe', '📯'], ['disque', 'Disque', '💿']], { group: 'Forme', level: 'easy' }),
  ],
  build: (p) => {                    // fonction PURE : paramètres → objet 3D (repère local, mètres, Y vers le haut)
    const g = new THREE.Group()
    g.add(mk(cylinder(p.rayon as number, 0.02, p.longueur as number, 24), p.chrome ? 'metal' : 'body'))
    return g
  },
})
```

2. L'enregistrer : ajouter `import './ma-piece'` dans `src/parts/vehicle/index.ts`. C'est tout : la pièce apparaît
   dans le catalogue, avec ses curseurs, ses réglages Facile/Expert, l'annulation, la sauvegarde et l'export.

### Outils de `registerPart`

| Champ | Rôle |
|---|---|
| `schema` | `num(clé, nom, défaut, [min_conf, max_conf], options)` · `pos` (≥ 0) · `int` · `bool` · `choice` · `text`. `level: 'easy'` = visible en mode Facile. `showIf` masque un réglage selon les autres. Les bornes de sécurité sont très larges par défaut. |
| `variants` | boutons « Choisir un type » : chaque variante règle plusieurs paramètres d'un coup |
| `build(p, ctx)` | géométrie. Utiliser `mk(géométrie, 'teinte', {edgeAngle})` pour que le maillage soit tracé au trait (`edgeAngle` : angle en ° au-delà duquel une arête est dessinée) ; `roundedBox`, `extrude`, `lathe`, `loft`, `cylinder*`, `mergeGeos`… sont dans `parts/primitives/geo.ts` |
| `handles(p)` | poignées 3D qui étirent un paramètre (`{position, axis, param, ratio}`) |
| `animate` + `root.userData.pose = (racine, t) => …` | animation 0→1 (porte, hayon, portail…) sans reconstruire la géométrie |
| `dims(p)` | lignes de cote affichées en mode plan |
| `planHide` / `dimsSelectedOnly` | masquer en mode plan / cotes seulement si sélectionnée |

### Faire « suivre » une pièce à sa pièce parente

```ts
registerPart({
  type: 'vehicule.klaxon',
  followsParent: ['vehicule.chassis'],
  // le parent expose ses données…   (dans vehicule.chassis : provide: (p) => makeBody(p))
  // …l'enfant les lit :
  fit: (parent, own) => {
    const body = parent as Body
    return {
      pos: [body.noseX(0) + 0.02, 0.5, 0],            // pose (relative au parent)
      rot: [0, 0, 0],
      params: { rayon: body.W * 0.05 },               // paramètres IMPOSÉS : curseur grisé 🔗
    }
  },
  build: (p, ctx) => { /* ctx.parent = données du parent (seulement si la pièce le suit) */ },
  …
})
```

`provide(p, parentProvided)` doit renvoyer un objet avec une propriété `key` qui change quand les données changent
(un `hashOf(params)` suffit) : elle déclenche la reconstruction des enfants.

### Quand la géométrie d'une pièce dépend de ses enfants

`consumesChildren: true` donne à `build` la liste `ctx.children` (type, paramètres effectifs, pose). C'est ainsi que
le volume de la maison perce ses murs : chaque ouverture publie son emplacement (`_edge`, `_s`, `_y` via `fit`), le
mur les lit.

## 2. Un nouveau module (avion, bateau, robot, château…)

Un module, c'est **des pièces + une description** :

1. `src/parts/avion/*.ts` : les pièces (voir ci-dessus), avec `module: 'avion'`, plus un `index.ts` qui les importe.
2. `src/modules/avion/module.ts` :

```ts
registerModule({
  id: 'avion', label: 'Avion', icon: '✈️',
  rootType: 'avion.fuselage',                 // pièce posée au départ
  defaultView: 'three-quarter',
  categories: [{ id: 'cellule', label: 'Cellule', icon: '✈️' }, …],   // onglets du catalogue
  presets: [ …modèles de départ… ],           // galerie « Modèles »
  surprise: (rng) => /* un Preset aléatoire */,
})
```

3. `src/modules/index.ts` : ajouter `import '@/parts/avion'` et `import '@/modules/avion/module'`.

Le module apparaît dans la barre du haut, avec sa galerie, son bouton Surprise, son catalogue, son export.

**Modèle de départ (`Preset`)** : liste de nœuds `{ key, type, parent?, follow?, params?, pos?, rot?, mirror? }`.
`mirror: 'z'` crée la copie symétrique (deux ailes, deux portes) ; `follow: true` lie la pièce à son parent.

**Exemple complet et testé** : [`exemples/avion.ts`](exemples/avion.ts) (fuselage qui expose son rayon, aile qui le suit,
module, modèle de départ). Pour l'essayer : le copier dans `src/parts/avion/index.ts` et brancher les imports.

### Idées pour les prochains modules

| Module | Pièces suggérées | Ce qui « suit » quoi |
|---|---|---|
| ✈️ Avion | fuselage, aile (flèche, dièdre), dérive, stabilisateur, moteur, hublots, train d'atterrissage | l'aile sur le rayon du fuselage, les hublots sur la courbure |
| ⛵ Bateau | coque (loft), pont, cabine, mât, voiles, bastingage, hublots | la cabine sur le pont, le mât sur la largeur |
| 🤖 Robot | tronc, tête, bras articulés, jambes, mains, yeux, antenne | les membres aux ancrages du tronc, animation d'articulations (`pose`) |
| 🏰 Château | tour (≈ `house.volume` rond), muraille, créneaux (répétitions), donjon, pont-levis, porte | les créneaux sur le mur, la porte sur la muraille |

La plupart de ces pièces réutilisent `house.volume`, `house.opening` ou les primitives : n'hésitez pas à étendre les
catégories d'un module existant plutôt qu'à tout recréer.

## 3. Checklist de qualité

* Valeurs par défaut sensibles (la pièce doit être belle dès son ajout) ; plages confortables réalistes.
* 3 à 6 réglages `level: 'easy'`, le reste en expert ; regrouper par `group` (le premier groupe est ouvert par défaut).
* Éviter les motifs très denses (barreaux serrés…) : à l'impression ils deviennent des aplats noirs.
* `npm test` construit automatiquement **toutes** les pièces et variantes enregistrées : une erreur y apparaît tout de suite.
* `npm run catalogue` met à jour `docs/CATALOGUE.md`.
