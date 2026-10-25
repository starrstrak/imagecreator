# Journal de la conversation — Atelier 3D à colorier

Résumé fidèle des échanges et des décisions (pas une transcription mot à mot).

## 1. Demande initiale

Rôle demandé : lead développeur front-end/3D (React, TypeScript, Three.js) et designer UX.
Objectif : application web de modélisation 3D ludique, tous âges, où l'on assemble des **pièces paramétriques**
(générées par code, jamais des images ou modèles figés) pour créer un **véhicule** ou une **maison (style CAD)**,
puis imprimer un **dessin au trait A4** à colorier.

Exigences principales :
- Chaque pièce : curseurs continus pour tous les paramètres (dimensions, arrondi, inclinaison, position, rotation,
  échelle non uniforme, symétrie, répétitions), poignées 3D, variantes de forme, verrouiller/dupliquer/masquer/
  supprimer/remplacer, annuler/rétablir illimité, sauvegarde automatique, projets JSON.
- Module véhicule (châssis, roues/jantes, carrosserie, portes animées, vitres, équipements) et module maison
  (volumes, toits, ouvertures, extérieur, mode plan CAD avec cotes).
- Rendu en contours (traits noirs, fond blanc, lignes cachées en option), export PNG haute résolution et PDF A4,
  planche multi-vues, aperçu avant impression.
- UX : 100 % français, modes Facile/Expert, souris et tactile, bouton Surprise, galerie de modèles.
- Stack imposée : Vite, React, TypeScript, React Three Fiber + drei, Zustand, Tailwind, jsPDF. Hors ligne, sans
  clé d'API. Code commenté en français, README, guide d'ajout de pièce/module.
- Méthode : proposer d'abord architecture + catalogue, attendre l'accord, puis générer le projet.

## 2. Étape 1 — Proposition (validée par « ok »)

Architecture, arborescence (`core`, `parts`, `modules`, `scene`, `render`, `export`, `store`, `ui`, `utils`),
catalogue des pièces et paramètres, stratégie en phases. Points proposés par défaut : livraison phase par phase
avec commits, murs percés par extrusion avec trous, lignes cachées en pointillé, IndexedDB avec repli localStorage,
PWA hors ligne.

## 3. Étape 2 — Réalisation

| Phase | Contenu | Commit |
|---|---|---|
| 1 | Socle : schémas déclaratifs, registre, store avec historique par patches, rendu au trait (arêtes + silhouette + lignes cachées), inspecteur auto-généré, gizmo, poignées 3D, autosave | `1420132` |
| 2 | Module véhicule : carrosserie lissée (13 types), roues/jantes, portes animées, vitres, éclairage, accessoires, pièces spéciales, 13 modèles + Surprise | `57cc2f8` |
| 3-4 | Module maison (murs percés, toits, ouvertures, extérieur, plan CAD + cotes) ; export PNG/PDF avec aperçu | `02a8ce6` |
| 5 | README, guide d'ajout, PWA, tests, catalogue généré | `2b37614` |
| 6 | Cadrage exact des vues, transitions de caméra, poignées supplémentaires, panneaux en tiroir < 1280 px | `2fa8b08` |

Problèmes rencontrés et corrigés en route : orientation des faces (lathe du pneu, loft de la carrosserie, polyèdres
de toit), rendu des silhouettes, épaisseur de trait cohérente, portes posées sur deux plans (flanc + habitacle),
densité des motifs (barreaux, lames) virant au noir, cadrage de caméra, verrouillage empêchant la suppression.

## 4. État final

- 49 types de pièces, 13 modèles de véhicules, 12 modèles de maisons.
- Tests : 11 passent (construction de toutes les pièces/variantes/modèles, adaptation entre pièces, historique,
  format de projet, exemple avion). Build de production OK.
- Branche : `claude/3d-parametric-configurator-1awtzf` (aucune PR créée).

Limites connues : découpe uniquement pour les murs ; noues de toit non tracées sur plans en L/U/T ; motifs très
denses → aplats à l'impression ; préréglage « Gratte-ciel » non vérifié visuellement ; tactile vérifié par tap
simulé seulement ; 60 fps non mesuré (rendu logiciel dans l'environnement de test).

## 5. Fichiers de référence

- `README.md` : installation, usage, architecture, limites
- `docs/CATALOGUE.md` : catalogue complet généré (`npm run catalogue`)
- `docs/AJOUTER_UNE_PIECE.md` : guide d'extension (avion, bateau, robot, château)
- `docs/exemples/avion.ts` : exemple de module exécutable et testé
