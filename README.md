# 🎨 Atelier 3D à colorier

Application web de **modélisation 3D paramétrique** pour tous les âges : on assemble un véhicule ou une maison
(style CAD) à partir de pièces **générées par le code** (aucun modèle 3D figé), on règle chaque pièce avec des
curseurs continus, puis on imprime un **dessin au trait en A4** que l'on colorie à la main.

* 100 % français · fonctionne **hors ligne** · aucune clé d'API · aucun service externe
* Souris **et** tactile (tablette) · modes **Facile** et **Expert**
* Stack : Vite · React 19 · TypeScript · Three.js via React Three Fiber (+ drei) · Zustand · Tailwind · jsPDF

## Installation et lancement

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build statique dans dist/ (ouvrable sans serveur applicatif)
npm run preview      # sert dist/ en local
npm run typecheck    # vérification TypeScript (inclut docs/exemples)
npm test             # tests (schémas, adaptation entre pièces, historique, construction de TOUTES les pièces)
npm run catalogue    # régénère docs/CATALOGUE.md depuis les schémas
```

Après une première visite en ligne, un *service worker* garde l'application en cache : elle s'ouvre ensuite sans réseau
(installable comme application sur tablette). Le dossier `dist/` peut aussi être copié tel quel sur une clé USB.

## Comment ça marche pour l'utilisateur

| Je veux… | Je fais… |
|---|---|
| Commencer vite | **Modèles** (galerie) ou **🎲 Surprise !** |
| Ajouter une pièce | Onglet **Banque de pièces** à gauche → clic sur une pièce |
| Régler une pièce | La cliquer dans la scène : curseurs à droite (groupes repliables), **ou** tirer les pastilles bleues 🔵 (poignées) |
| Déplacer / pivoter / étirer | Gizmo (✥ ⟳ ⤢) en bas à gauche de la vue, ou curseurs « Position », « Rotation », « Échelle » |
| Changer de type | **Choisir un type** (variantes : berline → camion, rectangle → maison en L…) ou 🔁 **Remplacer** |
| Dupliquer / masquer / verrouiller / supprimer | Icônes en haut de l'inspecteur (raccourcis : `Ctrl+D`, `Suppr`, `Ctrl+Z`, `Ctrl+Y`) |
| Annuler / rétablir | ↩️ ↪️ — **historique illimité**, les glissements de curseur sont regroupés |
| Voir les portes / le hayon / le portail bouger | Curseur « Ouverture » ou bouton ▶️ (anime toutes les ouvertures) |
| Plan d'architecte | Bouton **📐 Plan** : vue du dessus orthographique, toit masqué, **cotes** ; 📏 pour les cotes en 3D ; pièce **Annotation** pour écrire sur le dessin |
| Imprimer | **🖨️ Imprimer** : aperçu A4, portrait/paysage, 1 à 4 vues, épaisseur du trait en mm, lignes cachées, cotes, marges, titre ; PDF, PNG (150/300/600 dpi) |
| Sauvegarder | Sauvegarde **automatique** (IndexedDB). 💾 / 📂 : fichier projet `.atelier3d.json` |

Le **mode Facile** n'affiche que les réglages essentiels (gros boutons, peu de curseurs) ; le **mode Expert** affiche
tous les paramètres (groupes repliables, saisie numérique libre, aucune limite artificielle : seules des bornes de
sécurité très larges existent), et toutes les cotes.

## Architecture

```
src/
├─ core/        moteur : types, schéma de paramètres, registre, adaptation entre pièces (resolve), migrations JSON
├─ parts/       pièces paramétriques
│  ├─ primitives/   briques géométriques (boîte arrondie, extrusion, loft, lathe…) + formes de base
│  ├─ vehicle/      carrosserie lissée, roues/jantes, portes, vitres, lumières, accessoires, pièces spéciales
│  ├─ house/        volume (murs percés), toit, ouvertures, extérieur
│  └─ common.ts     annotation (texte)
├─ modules/     véhicule, maison : catégories du catalogue, modèles de départ, « Surprise »
├─ scene/       Canvas R3F, rendu d'un nœud, caméra, gizmo, poignées 3D
├─ render/      rendu « dessin au trait » (outline.ts), cotes (Dimensions.tsx)
├─ export/      rendu hors écran haute résolution, composition de page, PDF/PNG
├─ store/       Zustand : scène + historique (patches immer), interface, sauvegarde
├─ ui/          inspecteur auto-généré, catalogue, barre d'outils, aperçu avant impression, textes FR
├─ utils/       maths, hash, aléatoire reproductible
└─ tests/       vitest
docs/           CATALOGUE.md (généré), AJOUTER_UNE_PIECE.md, exemples/avion.ts
```

### Principes clés

* **Une pièce = un schéma déclaratif + une fonction pure** (`PartDefinition`). Le schéma (`num`, `pos`, `int`, `bool`,
  `choice`, `text`) donne nom, type, min, max, pas, valeur par défaut, groupe, niveau Facile/Expert et condition
  d'affichage ; **l'inspecteur est généré automatiquement** à partir de lui.
* **Paramètres communs** à toutes les pièces (`core/common.ts`) : position X/Y/Z, rotation X/Y/Z, échelle non uniforme,
  symétrie (miroir réel), répétitions (nombre, pas, rotation par copie).
* **Adaptation entre pièces** : une pièce peut *suivre* son parent. Le parent expose des données (`provide`), l'enfant
  les lit dans `fit` et en déduit des paramètres « liés » (curseur grisé 🔗) et sa pose. Exemples réels : la roue
  prend le diamètre et la voie de la carrosserie, la jante suit le pneu, la porte et la vitre épousent le flanc
  incliné, les murs de la maison sont **percés** par leurs portes et fenêtres, le velux suit la pente du toit.
  Décocher « Suivre la pièce parente » rend la pièce libre.
* **Rendu au trait** (`render/outline.ts`) : arêtes vives (`EdgesGeometry` + lignes à épaisseur en pixels), silhouette
  (coque inversée à épaisseur constante à l'écran), lignes cachées en pointillés (option), fond blanc, aucun aplat.
  Le même moteur sert à l'écran et à l'export (l'épaisseur est alors exprimée en millimètres sur la page).
* **Historique illimité** : chaque modification est un *patch* immer (aller/retour) ; les glissements de curseur sont
  fusionnés par clé. Sauvegarde automatique anti-rebond, projets JSON versionnés (`core/migrate.ts`).
* **Performances** : la géométrie d'une pièce n'est reconstruite que si ses paramètres effectifs changent ; les copies
  (symétrie, répétitions, roues) partagent les mêmes tampons ; rendu **à la demande** (pas de boucle quand rien ne bouge).

## Catalogue (résumé — détail complet : [docs/CATALOGUE.md](docs/CATALOGUE.md))

**Véhicule** — Carrosserie (13 types : berline, citadine, SUV, pick-up, sportive, coupé, break, monospace, fourgon, bus,
camion, cabriolet, buggy ; ~30 curseurs : gabarit, profil capot/toit/coffre, arrondis, galbe, essieux, passages de roue),
Roues et jantes (pneu : diamètre, largeur, flanc, épaule, 6 sculptures ; jante : 9 formes de branches, nombre, torsion,
creux, bord, moyeu, boulons, frein ; nombre et position de chaque essieu, jumelage, braquage), Portes (5 formes,
7 ouvertures animées), Vitres (pare-brise, lunette, latérales, toit ; 6 formes, cadre, montants, pose libre ou
automatique), Phares (5 formes), Feux, Calandre, Pare-chocs (4), Rétroviseurs, Antenne (4), Spoiler (4), Échappements,
Barres/galerie/coffre de toit, Marchepieds/jupes, Passages de roue, Prises d'air, Arceau, Capote, Roue de secours,
Intérieur, Plaques, Barre de leds, Hélice, Chenilles, Benne, Caisson/citerne/plateau/benne basculante, Attelage, Grue.

**Maison** — Volume (rectangle, L, U, T, croix, octogone, tour ronde ; étages, sous-sol, rooftop, corniches,
soubassement), Toit (2 pans, 4 pans, pyramide, mansarde, monopente, papillon, dents de scie, dôme, plat, terrasse
accessible ; pente libre), Ouvertures (portes, fenêtres de 8 formes, baies, portes de garage, velux ; position libre,
répétitions, petits-bois, volets, linteau, appui, animation), Balcon, Escalier (droit, quart tournant, colimaçon, perron),
Cheminée, Panneaux solaires, Terrasse, Pergola/abri, Piscine (4 formes), Clôture/mur (5 styles), Arbres (5), Haie/buisson/
massif, Terrain avec allée, Lampadaire/boîte aux lettres. Garage et extensions : ajouter un autre **volume**.

**Communes** — boîte, cylindre/cône, sphère, prisme, anneau, annotation.

## Ajouter une pièce ou un module

Voir **[docs/AJOUTER_UNE_PIECE.md](docs/AJOUTER_UNE_PIECE.md)** (avion, bateau, robot, château…) et l'exemple
exécutable **[docs/exemples/avion.ts](docs/exemples/avion.ts)** (vérifié par un test).

## Limites connues

* Les murs sont percés par les ouvertures ; les autres assemblages (porte sur carrosserie, etc.) sont posés « en relief »
  (pas de découpe booléenne générale) : c'est voulu pour rester fluide à 60 images/s.
* Sur les plans de masse complexes (L, U, T) les toits sont construits aile par aile : les noues (jonction de deux toits)
  ne sont pas tracées.
* L'aperçu et l'export utilisent le GPU du navigateur (WebGL 2) ; très haute résolution (600 dpi, 4 vues) = quelques secondes.
