# Catalogue des pièces

Fichier généré automatiquement (`npm run catalogue`) à partir des schémas de paramètres.

## 🧱 Pièces communes

### 🟦 Boîte — `commun.box`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Largeur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Hauteur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Profondeur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Arrondi des arêtes (Forme) | curseur | 0 → 0.5 m | 0 | Expert |

### 🥫 Cylindre / cône — `commun.cylinder`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Rayon du haut (Dimensions) | curseur | 0 → 3 m | 0.5 | Facile |
| Rayon du bas (Dimensions) | curseur | 0 → 3 m | 0.5 | Facile |
| Hauteur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Nombre de côtés (Forme) | curseur | 3 → 64 | 32 | Expert |

### ⚽ Sphère — `commun.sphere`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Rayon (Dimensions) | curseur | 0.02 → 3 m | 0.5 | Facile |
| Aplatissement (Forme) | curseur | 0.2 → 2 | 1 | Expert |
| Finesse (Forme) | curseur | 8 → 64 | 32 | Expert |

### 🔺 Prisme (toit, rampe) — `commun.prism`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Triangle, Trapèze, Rampe | triangle | Facile |
| Largeur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Hauteur (Dimensions) | curseur | 0.05 → 5 m | 0.6 | Facile |
| Profondeur (Dimensions) | curseur | 0.05 → 5 m | 1 | Facile |
| Largeur du haut (Forme) | curseur | 0 → 1 | 0.3 | Expert |

### 🍩 Anneau — `commun.torus`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Grand rayon (Dimensions) | curseur | 0.05 → 3 m | 0.5 | Facile |
| Épaisseur du tube (Dimensions) | curseur | 0.01 → 1 m | 0.12 | Facile |
| Finesse (Forme) | curseur | 8 → 80 | 40 | Expert |

### 📝 Annotation — `commun.note`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Texte (Texte) | texte | — | Note | Facile |
| Taille du texte (Texte) | curseur | 0.1 → 3 m | 0.5 | Facile |
| Longueur de la flèche (Texte) | curseur | 0 → 6 m | 1 | Facile |
| Inclinaison (Texte) | curseur | -45 → 45 ° | 0 | Expert |

## 🚗 Module Véhicule

### 🚗 Carrosserie — `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🚗 Berline · 🚙 Citadine · 🚘 SUV · 🛻 Pick-up · 🏎️ Sportive · 🚖 Coupé · 🚐 Break · 🚌 Monospace · 🚚 Fourgon · 🚍 Bus · 🚛 Camion · 🏖️ Cabriolet · 🏁 Buggy

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Longueur (Gabarit) | curseur | 2 → 12 m | 4.7 | Facile |
| Largeur (Gabarit) | curseur | 1 → 3 m | 1.82 | Facile |
| Hauteur totale (Gabarit) | curseur | 0.6 → 4 m | 1.45 | Facile |
| Empattement (Gabarit) | curseur | 1.2 → 8 m | 2.8 | Expert |
| Décalage des essieux (Gabarit) | curseur | -1 → 1 m | 0 | Expert |
| Garde au sol (Gabarit) | curseur | 0 → 0.6 m | 0.15 | Facile |
| Hauteur du nez (Profil) | curseur | 0.2 → 2.5 m | 0.62 | Facile |
| Hauteur du capot / ceinture (Profil) | curseur | 0.3 → 2.5 m | 0.8 | Facile |
| Hauteur du coffre (Profil) | curseur | 0.3 → 2.5 m | 0.84 | Facile |
| Longueur du capot (Profil) | curseur | 0.01 → 0.6 | 0.3 | Facile |
| Début du toit (Profil) | curseur | 0.02 → 0.8 | 0.44 | Facile |
| Fin du toit (Profil) | curseur | 0.1 → 0.98 | 0.68 | Facile |
| Bas de la lunette arrière (Profil) | curseur | 0.1 → 1 | 0.8 | Expert |
| Bombé du toit (Profil) | curseur | -0.1 → 0.3 m | 0.03 | Expert |
| Bombé du capot (Profil) | curseur | -0.1 → 0.3 m | 0.03 | Expert |
| Arrondi des arêtes (Arrondis et flancs) | curseur | 0.04 → 0.45 | 0.25 | Facile |
| Arrondi de l’avant (Arrondis et flancs) | curseur | 0.02 → 1.5 m | 0.35 | Expert |
| Arrondi de l’arrière (Arrondis et flancs) | curseur | 0.02 → 1.5 m | 0.3 | Expert |
| Largeur du museau (Arrondis et flancs) | curseur | 0.4 → 1.1 | 0.88 | Expert |
| Largeur de l’arrière (Arrondis et flancs) | curseur | 0.4 → 1.1 | 0.9 | Expert |
| Galbe des flancs (Arrondis et flancs) | curseur | -0.1 → 0.2 | 0.03 | Expert |
| Rentrée de caisse (Arrondis et flancs) | curseur | -0.1 → 0.4 | 0.08 | Expert |
| Largeur de l’habitacle (Arrondis et flancs) | curseur | 0.5 → 1.1 | 0.88 | Expert |
| Inclinaison des vitres latérales (Arrondis et flancs) | curseur | -0.2 → 1 | 0.3 | Expert |
| Rentrée du bas de caisse (Arrondis et flancs) | curseur | 0 → 0.3 | 0.04 | Expert |
| Nombre d’essieux (Essieux et passages de roue) | curseur | 1 → 5 | 2 | Facile |
| Écart entre essieux arrière (Essieux et passages de roue) | curseur | 0.6 → 3 m | 1.3 | Expert |
| Diamètre des roues (Essieux et passages de roue) | curseur | 0.3 → 1.4 m | 0.66 | Facile |
| Passages de roue (Essieux et passages de roue) | interrupteur | — | true | Expert |
| Jeu autour des roues (Essieux et passages de roue) | curseur | 0 → 0.4 m | 0.06 | Expert |

### 🛞 Roues et jantes — `vehicule.wheels`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* ⚙️ 5 branches · 🕸️ Multi-branches · 🌀 Branches courbes · 🔱 Branches en Y · 〓 Doubles branches · ⭐ Étoile · 🌪️ Turbine · 🐚 Spirale · 🥏 Pleine à trous · #️⃣ Grille

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Diamètre du pneu (Pneu) | curseur | 0.2 → 1.6 m | 0.66 | Facile |
| Largeur du pneu (Pneu) | curseur | 0.05 → 0.6 m | 0.215 | Facile |
| Hauteur du flanc (Pneu) | curseur | 0.1 → 1.2 | 0.55 | Facile |
| Arrondi de l’épaule (Pneu) | curseur | 0 → 1 | 0.5 | Expert |
| Galbe du flanc (Pneu) | curseur | -0.05 → 0.1 m | 0.012 | Expert |
| Sculpture (Sculpture du pneu) | choix | Lisse, Rainures, Blocs, Chevrons, Tout-terrain, Neige | lisse | Facile |
| Nombre de motifs (Sculpture du pneu) | curseur | 8 → 80 | 28 | Expert |
| Profondeur (Sculpture du pneu) | curseur | 0 → 0.05 m | 0.012 | Expert |
| Taille de la jante (Jante) | curseur | 0.5 → 1.15 | 1 | Facile |
| Largeur de la jante (Jante) | curseur | 0.3 → 1.2 | 0.8 | Expert |
| Épaisseur du bord (Jante) | curseur | 0.005 → 0.1 m | 0.025 | Expert |
| Creux de la jante (Jante) | curseur | -0.05 → 0.2 m | 0.03 | Expert |
| Disque et étrier de frein (Jante) | interrupteur | — | true | Expert |
| Forme des branches (Branches) | choix | Droites, Courbes, En Y, Doubles, Étoile, Turbine, Spirale, Pleine, Grille | droite | Facile |
| Nombre de branches (Branches) | curseur | 2 → 24 | 5 | Facile |
| Largeur des branches (Branches) | curseur | 0.008 → 0.15 m | 0.045 | Expert |
| Épaisseur des branches (Branches) | curseur | 0.005 → 0.08 m | 0.018 | Expert |
| Torsion des branches (Branches) | curseur | -90 → 90 ° | 30 | Expert |
| Affinement vers l’extérieur (Branches) | curseur | 0 → 1 | 0.5 | Expert |
| Nombre de trous (Branches) | curseur | 0 → 16 | 6 | Expert |
| Taille des trous (Branches) | curseur | 0.02 → 0.25 | 0.09 | Expert |
| Rotation de la jante (Branches) | curseur | -180 → 180 ° | 0 | Expert |
| Diamètre du moyeu (Moyeu et boulons) | curseur | 0.04 → 0.4 m | 0.14 | Expert |
| Cache central (Moyeu et boulons) | interrupteur | — | true | Expert |
| Nombre de boulons (Moyeu et boulons) | curseur | 0 → 12 | 5 | Facile |
| Cercle de perçage (Moyeu et boulons) | curseur | 0.3 → 0.95 | 0.7 | Expert |
| Taille des boulons (Moyeu et boulons) | curseur | 0.003 → 0.03 m | 0.011 | Expert |
| Forme des boulons (Moyeu et boulons) | choix | Ronds, Hexagones, Pentagones | rond | Facile |
| Écrou central (Moyeu et boulons) | interrupteur | — | false | Expert |
| Nombre d’essieux (Essieux et position) | curseur | 1 → 5 | 2 | Facile |
| Position de l’essieu avant (Essieux et position) | curseur | -6 → 6 m | 1.5 | Expert |
| Écart entre essieux (Essieux et position) | curseur | 0.3 → 8 m | 2.8 | Expert |
| Écart des essieux arrière (Essieux et position) | curseur | 0.5 → 3 m | 1.3 | Expert |
| Voie avant (Essieux et position) | curseur | 0.3 → 3.5 m | 1.55 | Expert |
| Voie arrière (Essieux et position) | curseur | 0.3 → 3.5 m | 1.55 | Expert |
| Saillie des roues (Essieux et position) | curseur | -0.2 → 0.3 m | 0 | Expert |
| Braquage des roues avant (Essieux et position) | curseur | -40 → 40 ° | 0 | Expert |
| Roues jumelées à l’arrière (Essieux et position) | interrupteur | — | false | Expert |
| Essieu 1 : décalage (Essieux et position) | curseur | -1 → 1 m | 0 | Expert |
| Essieu 2 : décalage (Essieux et position) | curseur | -1 → 1 m | 0 | Expert |
| Essieu 3 : décalage (Essieux et position) | curseur | -1 → 1 m | 0 | Expert |
| Essieu 4 : décalage (Essieux et position) | curseur | -1 → 1 m | 0 | Expert |
| Essieu 5 : décalage (Essieux et position) | curseur | -1 → 1 m | 0 | Expert |

### 🚪 Porte — `vehicule.door`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🚪 Classique · 🏎️ Coupé (longue) · ⭕ Arrondie · 🔶 Trapèze · 🌈 Cintrée · 🚌 Haute (van / bus)

*Animation :* Ouverture

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Classique, Coupé, Arrondie, Trapèze, Cintrée | standard | Facile |
| Largeur (Forme) | curseur | 0.3 → 3 m | 0.95 | Facile |
| Hauteur au-dessus de la ceinture (Forme) | curseur | 0 → 2.5 m | 0 | Facile |
| Garde du bas (Forme) | curseur | 0 → 0.8 m | 0.1 | Expert |
| Descente vers l’arrière (Forme) | curseur | -0.3 → 0.6 m | 0 | Expert |
| Bombé du haut (Forme) | curseur | -0.1 → 0.4 m | 0.02 | Expert |
| Retrait du haut (Forme) | curseur | 0 → 0.6 m | 0 | Expert |
| Coin arrière coupé (Forme) | curseur | 0 → 0.6 m | 0 | Expert |
| Arrondi des coins (Forme) | curseur | 0.03 → 0.45 | 0.12 | Expert |
| Épaisseur (Forme) | curseur | 0.005 → 0.2 m | 0.035 | Expert |
| Position le long de la voiture (Position) | curseur | 0 → 1 | 0.36 | Facile |
| Distance au centre (Position) | curseur | 0.1 → 3 m | 0.9 | Expert |
| Poignée (Poignée) | choix | Aucune, Barre, Plate, Bouton | barre | Facile |
| Taille de la poignée (Poignée) | curseur | 0.03 → 0.5 m | 0.15 | Expert |
| Position de la poignée (Poignée) | curseur | -0.5 → 0.5 | -0.32 | Expert |
| Hauteur de la poignée (Poignée) | curseur | -0.6 → 0.6 m | -0.06 | Expert |
| Type d’ouverture (Ouverture) | choix | Classique, Coulissante, Papillon, Ciseaux, Aile de mouette, Suicide, À bascule | classique | Facile |
| Ouverture (Ouverture) | curseur | 0 → 1 | 0 | Facile |
| Angle d’ouverture (Ouverture) | curseur | 10 → 110 ° | 60 | Expert |

### 🪟 Vitre — `vehicule.window`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🌅 Pare-brise · 🌇 Lunette arrière · 🪟 Vitres latérales · ☀️ Toit ouvrant · 🏞️ Panoramique · 🥚 Ovale

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Emplacement (Position sur la carrosserie) | choix | Pare-brise, Lunette arrière, Latérale, Toit | laterale | Facile |
| Début le long de l’habitacle (Position sur la carrosserie) | curseur | 0 → 1 | 0.02 | Facile |
| Fin le long de l’habitacle (Position sur la carrosserie) | curseur | 0 → 1 | 0.98 | Facile |
| Glisser horizontalement (Position sur la carrosserie) | curseur | -1 → 1 m | 0 | Expert |
| Glisser verticalement (Position sur la carrosserie) | curseur | -1 → 1 m | 0 | Expert |
| Taille automatique (Position sur la carrosserie) | interrupteur | — | true | Facile |
| Marge en bas (Position sur la carrosserie) | curseur | 0 → 0.4 m | 0.04 | Expert |
| Marge en haut (Position sur la carrosserie) | curseur | 0 → 0.4 m | 0.04 | Expert |
| Forme (Forme) | choix | Rectangle, Trapèze, Ovale, Panoramique, Goutte, Hexagone | trapeze | Facile |
| Largeur (Forme) | curseur | 0.1 → 3 m | 1.2 | Facile |
| Hauteur (Forme) | curseur | 0.05 → 2 m | 0.4 | Facile |
| Largeur du haut (Forme) | curseur | 0.1 → 1.5 | 0.8 | Expert |
| Inclinaison du haut (Forme) | curseur | -1 → 1 m | 0 | Expert |
| Arrondi des coins (Forme) | curseur | 0.03 → 0.45 | 0.2 | Expert |
| Rotation dans le plan (Forme) | curseur | -90 → 90 ° | 0 | Expert |
| Épaisseur du cadre (Cadre et montants) | curseur | 0.005 → 0.2 m | 0.04 | Facile |
| Épaisseur de la vitre (Cadre et montants) | curseur | 0.004 → 0.1 m | 0.02 | Expert |
| Montants intérieurs (Cadre et montants) | curseur | 0 → 4 | 0 | Expert |
| Épaisseur des montants (Cadre et montants) | curseur | 0.01 → 0.2 m | 0.045 | Expert |
| Largeur des montants de carrosserie (Cadre et montants) | curseur | 0 → 0.3 m | 0.07 | Expert |

### 💡 Phare — `vehicule.headlight`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* ⚪ Ronds · 🥜 Amande · ➖ Barre LED · ⬜ Carrés · 🔦 Rétractables

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Rond, Amande, Rectangle, Barre LED, Carré, Rétractable | rond | Facile |
| Largeur (Forme) | curseur | 0.04 → 1.6 m | 0.3 | Facile |
| Hauteur (Forme) | curseur | 0.02 → 0.8 m | 0.16 | Facile |
| Arrondi des coins (Forme) | curseur | 0.03 → 0.45 | 0.25 | Expert |
| Inclinaison (Forme) | curseur | -90 → 90 ° | 12 | Expert |
| Épaisseur (Forme) | curseur | 0.01 → 0.3 m | 0.05 | Expert |
| Distance au centre (Position) | curseur | 0 → 2 m | 0.62 | Facile |
| Hauteur du centre (Position) | curseur | 0.1 → 4 m | 0.7 | Facile |
| Cercles intérieurs (Détails) | curseur | 0 → 5 | 2 | Expert |
| Paupière (Détails) | interrupteur | — | false | Expert |
| Segments (Détails) | curseur | 0 → 8 | 0 | Expert |

### 🔴 Feu arrière — `vehicule.taillight`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* ▭ Rectangulaire · ➖ Barre LED · ⅃ En L · ⚪ Ronds

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Rectangle, Barre LED, En L, Rond, Amande, Carré | rect | Facile |
| Largeur (Forme) | curseur | 0.04 → 1.6 m | 0.36 | Facile |
| Hauteur (Forme) | curseur | 0.02 → 0.8 m | 0.14 | Facile |
| Arrondi des coins (Forme) | curseur | 0.03 → 0.45 | 0.25 | Expert |
| Inclinaison (Forme) | curseur | -90 → 90 ° | 0 | Expert |
| Épaisseur (Forme) | curseur | 0.01 → 0.3 m | 0.05 | Expert |
| Distance au centre (Position) | curseur | 0 → 2 m | 0.7 | Facile |
| Hauteur du centre (Position) | curseur | 0.1 → 4 m | 0.78 | Facile |
| Cercles intérieurs (Détails) | curseur | 0 → 5 | 0 | Expert |
| Paupière (Détails) | interrupteur | — | false | Expert |
| Segments (Détails) | curseur | 0 → 8 | 3 | Expert |

### 🔲 Calandre — `vehicule.grille`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Rectangle, Trapèze, Ovale, Hexagone, Doublé (reins) | trapeze | Facile |
| Largeur (Forme) | curseur | 0.1 → 2.5 m | 0.9 | Facile |
| Hauteur (Forme) | curseur | 0.04 → 1.2 m | 0.28 | Facile |
| Largeur du haut (Forme) | curseur | 0.3 → 1.3 | 0.85 | Expert |
| Arrondi (Forme) | curseur | 0.03 → 0.45 | 0.2 | Expert |
| Motif (Détails) | choix | Plein, Barres horizontales, Barres verticales, Quadrillage, Nid d’abeille | horizontal | Facile |
| Nombre de barres (Détails) | curseur | 1 → 20 | 5 | Expert |
| Épaisseur des barres (Détails) | curseur | 0.004 → 0.08 m | 0.018 | Expert |
| Épaisseur de la calandre (Détails) | curseur | 0.01 → 0.3 m | 0.05 | Expert |
| Écusson central (Détails) | interrupteur | — | true | Expert |
| Décalage latéral (Position) | curseur | -1 → 1 m | 0 | Expert |
| Hauteur du centre (Position) | curseur | 0.1 → 3 m | 0.5 | Facile |

### 🚨 Barre de leds / gyrophare — `vehicule.lightbar`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Barre de leds, Gyrophare, Rampe de police | barre | Facile |
| Largeur (Forme) | curseur | 0.1 → 2.5 m | 0.9 | Facile |
| Hauteur (Forme) | curseur | 0.02 → 0.4 m | 0.08 | Expert |
| Profondeur (Forme) | curseur | 0.03 → 0.4 m | 0.12 | Expert |
| Nombre de leds (Détails) | curseur | 1 → 20 | 8 | Expert |
| Position sur le toit (Position) | curseur | 0 → 1 | 0.5 | Facile |

### 🔢 Plaque — `vehicule.plate`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Où ? (Position) | choix | Avant, Arrière | avant | Facile |
| Largeur (Forme) | curseur | 0.1 → 1 m | 0.52 | Facile |
| Hauteur (Forme) | curseur | 0.03 → 0.4 m | 0.11 | Facile |
| Nombre de caractères (Détails) | curseur | 0 → 10 | 6 | Expert |
| Hauteur du centre (Position) | curseur | 0.1 → 3 m | 0.45 | Expert |

### 🪞 Rétroviseur — `vehicule.mirror`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🪞 Classique · 🏎️ Sport · 🚛 Camion (grand)

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Ovale, Rectangle, Aile | ovale | Facile |
| Largeur du boîtier (Forme) | curseur | 0.04 → 0.6 m | 0.2 | Facile |
| Hauteur du boîtier (Forme) | curseur | 0.03 → 0.8 m | 0.13 | Facile |
| Épaisseur (Forme) | curseur | 0.02 → 0.3 m | 0.07 | Expert |
| Longueur du bras (Forme) | curseur | 0 → 0.6 m | 0.1 | Expert |
| Repliage (Forme) | curseur | 0 → 1 | 0 | Expert |
| Position le long du capot (Position) | curseur | -0.5 → 1 m | 0.1 | Facile |
| Hauteur au-dessus de la ceinture (Position) | curseur | -0.3 → 1 m | 0.12 | Expert |

### 📡 Antenne — `vehicule.antenna`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Fouet, Aileron de requin, Parabole, Radio CB (2 brins) | fouet | Facile |
| Longueur (Forme) | curseur | 0.05 → 2.5 m | 0.5 | Facile |
| Épaisseur (Forme) | curseur | 0.002 → 0.1 m | 0.006 | Expert |
| Inclinaison (Forme) | curseur | -60 → 60 ° | 0 | Expert |
| Position sur le toit (Position) | curseur | 0 → 1.2 | 0.85 | Facile |
| Décalage latéral (Position) | curseur | -1.5 → 1.5 m | 0 | Expert |

### 🏁 Spoiler / aileron — `vehicule.spoiler`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🏁 Aileron GT · 🛩️ Double plan · 〰️ Béquet · 🔻 Lame avant

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Aileron, Béquet, Lame | aileron | Facile |
| Largeur (Forme) | curseur | 0.3 → 3 m | 1.5 | Facile |
| Profondeur de l’aile (Forme) | curseur | 0.03 → 1 m | 0.28 | Facile |
| Épaisseur (Forme) | curseur | 0.005 → 0.15 m | 0.025 | Expert |
| Inclinaison de l’aile (Forme) | curseur | -30 → 60 ° | 8 | Expert |
| Hauteur des supports (Forme) | curseur | 0 → 1.2 m | 0.28 | Facile |
| Nombre de plans (Forme) | curseur | 1 → 3 | 1 | Expert |
| Supports (Détails) | curseur | 0 → 5 | 2 | Expert |
| Plaques latérales (Détails) | interrupteur | — | true | Expert |
| Position le long (avant ↔ arrière) (Position) | curseur | -1 → 1 m | 0.25 | Facile |
| Hauteur de la base (Position) | curseur | 0 → 1 m | 0 | Expert |
| À l’avant (Position) | interrupteur | — | false | Expert |

### 💨 Échappement — `vehicule.exhaust`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Emplacement (Position) | choix | Arrière, Sur le côté, Cheminée (camion) | arriere | Facile |
| Forme (Forme) | choix | Rond, Ovale, Carré | rond | Facile |
| Nombre de sorties (Forme) | curseur | 1 → 6 | 2 | Facile |
| Diamètre (Forme) | curseur | 0.02 → 0.4 m | 0.07 | Facile |
| Longueur (Forme) | curseur | 0.03 → 3 m | 0.18 | Expert |
| Écart entre sorties (Forme) | curseur | 0.03 → 0.8 m | 0.14 | Expert |
| Décalage latéral (Position) | curseur | -1.5 → 1.5 m | 0.45 | Facile |
| Hauteur (Position) | curseur | 0.05 → 3 m | 0.3 | Expert |
| Embout chromé (Détails) | interrupteur | — | true | Expert |

### 🧳 Barres / galerie de toit — `vehicule.rack`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Barres, Galerie, Coffre de toit | barres | Facile |
| Nombre de barres (Forme) | curseur | 1 → 8 | 2 | Facile |
| Largeur (Forme) | curseur | 0.2 → 3 m | 1.1 | Facile |
| Longueur (Forme) | curseur | 0.2 → 6 m | 1 | Facile |
| Hauteur (Forme) | curseur | 0.01 → 0.8 m | 0.06 | Expert |
| Épaisseur des barres (Forme) | curseur | 0.01 → 0.1 m | 0.03 | Expert |
| Rails longitudinaux (Détails) | interrupteur | — | true | Expert |
| Position sur le toit (Position) | curseur | 0 → 1 | 0.5 | Facile |

### ▬ Marchepied / jupe latérale — `vehicule.sideskirt`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Jupe (bas de caisse), Marchepied, Tube chromé | jupe | Facile |
| Longueur (Forme) | curseur | 0.2 → 6 m | 1.7 | Facile |
| Hauteur (Forme) | curseur | 0.02 → 0.6 m | 0.12 | Facile |
| Saillie (Forme) | curseur | 0.01 → 0.5 m | 0.08 | Expert |
| Position le long de la voiture (Position) | curseur | -5 → 5 m | 0 | Facile |
| Hauteur du bas (Position) | curseur | 0 → 1 m | 0.18 | Expert |
| Antidérapant (Détails) | interrupteur | — | true | Expert |

### 🛡️ Pare-chocs — `vehicule.bumper`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 🛡️ Classique · 🏎️ Sport (lèvre) · 🦬 Pare-buffle · ⭕ Tubulaire

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Où ? (Position) | choix | Avant, Arrière | avant | Facile |
| Type (Forme) | choix | Classique, Sport, Pare-buffle, Tubulaire | classique | Facile |
| Largeur (part de la voiture) (Forme) | curseur | 0.3 → 1.3 | 0.96 | Facile |
| Hauteur (Forme) | curseur | 0.03 → 1 m | 0.22 | Facile |
| Profondeur (Forme) | curseur | 0.02 → 0.6 m | 0.12 | Expert |
| Arrondi (Forme) | curseur | 0 → 0.3 m | 0.05 | Expert |
| Hauteur du bas (Position) | curseur | 0 → 1.5 m | 0.2 | Expert |
| Antibrouillards (Détails) | interrupteur | — | false | Expert |
| Fentes (Détails) | curseur | 0 → 8 | 0 | Expert |

### 🌓 Passage de roue (aile) — `vehicule.flare`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Essieu (Position) | curseur | 1 → 5 | 1 | Facile |
| Largeur du bourrelet (Forme) | curseur | 0.01 → 0.3 m | 0.05 | Facile |
| Saillie (Forme) | curseur | 0.005 → 0.4 m | 0.06 | Facile |
| Jeu autour de la roue (Forme) | curseur | 0 → 0.4 m | 0.07 | Expert |
| Étendue de l’arc (Forme) | curseur | 90 → 360 ° | 200 | Expert |
| Diamètre de la roue (Forme) | curseur | 0.2 → 1.6 m | 0.66 | Expert |

### 🌬️ Prise d’air / aération — `vehicule.vent`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Emplacement (Position) | choix | Capot, Aile avant, Flanc, Toit | capot | Facile |
| Forme (Forme) | choix | Rectangle, Ovale, Fentes, NACA | rect | Facile |
| Largeur (Forme) | curseur | 0.05 → 1.5 m | 0.4 | Facile |
| Longueur / hauteur (Forme) | curseur | 0.03 → 1 m | 0.2 | Facile |
| Relief (Forme) | curseur | 0 → 0.2 m | 0.04 | Expert |
| Nombre de fentes (Forme) | curseur | 1 → 14 | 4 | Expert |
| Position le long (Position) | curseur | 0 → 1 | 0.5 | Facile |
| Décalage latéral (Position) | curseur | -1.5 → 1.5 m | 0 | Expert |
| Hauteur (Position) | curseur | 0.1 → 2 m | 0.6 | Expert |

### ⭕ Arceau de sécurité — `vehicule.rollbar`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Arceau simple, Cage complète, Arceau targa | arceau | Facile |
| Largeur (Forme) | curseur | 0.3 → 3 m | 1.3 | Facile |
| Hauteur (Forme) | curseur | 0.1 → 2 m | 0.6 | Facile |
| Longueur (cage) (Forme) | curseur | 0.2 → 4 m | 1.2 | Expert |
| Diamètre du tube (Forme) | curseur | 0.01 → 0.15 m | 0.045 | Expert |
| Position (Position) | curseur | 0 → 1 | 0.55 | Facile |

### ⛱️ Capote — `vehicule.softtop`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| État (Forme) | choix | Pliée, Fermée | pliee | Facile |
| Longueur (Forme) | curseur | 0.2 → 3 m | 0.8 | Facile |
| Hauteur (Forme) | curseur | 0.03 → 1 m | 0.18 | Facile |
| Position (Position) | curseur | 0 → 1 | 0.8 | Facile |
| Plis (Forme) | curseur | 0 → 10 | 4 | Expert |

### 🛞 Roue de secours — `vehicule.spare`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Diamètre (Forme) | curseur | 0.3 → 1.5 m | 0.7 | Facile |
| Largeur (Forme) | curseur | 0.08 → 0.5 m | 0.22 | Expert |
| Branches (Forme) | curseur | 2 → 14 | 5 | Expert |
| Décalage latéral (Position) | curseur | -1.5 → 1.5 m | 0 | Expert |
| Hauteur du centre (Position) | curseur | 0.2 → 3 m | 0.85 | Facile |
| Housse (Détails) | interrupteur | — | false | Expert |

### 💺 Sièges et volant — `vehicule.interior`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Rangées de sièges (Forme) | curseur | 1 → 4 | 1 | Facile |
| Sièges par rangée (Forme) | curseur | 1 → 4 | 2 | Facile |
| Largeur d’un siège (Forme) | curseur | 0.2 → 1 m | 0.5 | Expert |
| Hauteur du dossier (Forme) | curseur | 0.2 → 1 m | 0.5 | Expert |
| Écart entre rangées (Forme) | curseur | 0.4 → 2 m | 0.9 | Expert |
| Volant (Détails) | interrupteur | — | true | Expert |
| Tableau de bord (Détails) | interrupteur | — | true | Expert |
| Position (Position) | curseur | 0 → 1 | 0.3 | Facile |

### 🌀 Hélice — `vehicule.propeller`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* ✈️ Avion (2 pales) · 🌀 3 pales · 🛩️ 6 pales · 🌬️ Ventilateur

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Nombre de pales (Forme) | curseur | 2 → 10 | 3 | Facile |
| Diamètre (Forme) | curseur | 0.2 → 5 m | 1.5 | Facile |
| Largeur des pales (Forme) | curseur | 0.02 → 0.5 m | 0.14 | Facile |
| Épaisseur (Forme) | curseur | 0.004 → 0.1 m | 0.018 | Expert |
| Pas (inclinaison des pales) (Forme) | curseur | -60 → 60 ° | 25 | Expert |
| Affinement vers le bout (Forme) | curseur | 0 → 1 | 0.6 | Expert |
| Diamètre du moyeu (Détails) | curseur | 0.02 → 0.6 m | 0.16 | Expert |
| Longueur du cône (Détails) | curseur | 0 → 1 m | 0.25 | Expert |
| Rotation (Détails) | curseur | 0 → 360 ° | 0 | Expert |
| Position avant / arrière (Position) | curseur | -6 → 6 m | 0.05 | Expert |
| Hauteur (Position) | curseur | 0 → 4 m | 0.6 | Facile |
| Décalage latéral (Position) | curseur | -4 → 4 m | 0 | Expert |

### ⛓️ Chenilles — `vehicule.tracks`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Longueur (Forme) | curseur | 0.5 → 12 m | 3 | Facile |
| Hauteur (Forme) | curseur | 0.2 → 3 m | 0.9 | Facile |
| Largeur de la chenille (Forme) | curseur | 0.1 → 1.5 m | 0.5 | Facile |
| Nombre de patins (Forme) | curseur | 8 → 120 | 40 | Expert |
| Hauteur des patins (Forme) | curseur | 0.005 → 0.2 m | 0.04 | Expert |
| Galets (Détails) | curseur | 0 → 12 | 5 | Expert |
| Rayon du pignon / de la roue (Détails) | curseur | 0.05 → 1.5 m | 0.3 | Expert |
| Distance au centre (Position) | curseur | 0 → 4 m | 0.9 | Facile |
| Position avant / arrière (Position) | curseur | -6 → 6 m | 0 | Expert |

### 🛻 Benne — `vehicule.bed`

*S'adapte à :* `vehicule.chassis`

*Animation :* Hayon

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Longueur (Forme) | curseur | 0.3 → 6 m | 1.6 | Facile |
| Largeur (Forme) | curseur | 0.3 → 3 m | 1.7 | Facile |
| Hauteur des bords (Forme) | curseur | 0.05 → 1.5 m | 0.4 | Facile |
| Épaisseur des parois (Forme) | curseur | 0.01 → 0.2 m | 0.05 | Expert |
| Hayon ouvert (Forme) | curseur | 0 → 1 | 0 | Facile |
| Nervures du plancher (Détails) | interrupteur | — | true | Expert |
| Bâche fermée (Détails) | interrupteur | — | false | Expert |
| Arceau (Détails) | interrupteur | — | false | Expert |
| Décalage avant / arrière (Position) | curseur | -3 → 3 m | 0 | Expert |

### 📦 Caisson de camion — `vehicule.cargo`

*S'adapte à :* `vehicule.chassis`

*Variantes prêtes à l'emploi :* 📦 Fourgon · 🛢️ Citerne · 🪵 Plateau · 🏗️ Benne

*Animation :* Basculer

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Caisson, Citerne, Plateau, Benne basculante | caisson | Facile |
| Longueur (Forme) | curseur | 0.5 → 14 m | 5 | Facile |
| Largeur (Forme) | curseur | 0.5 → 3.5 m | 2.4 | Facile |
| Hauteur (Forme) | curseur | 0.1 → 5 m | 2.4 | Facile |
| Arrondi (Forme) | curseur | 0 → 1 m | 0.08 | Expert |
| Nervures (Détails) | curseur | 0 → 20 | 6 | Expert |
| Cerclages (Détails) | curseur | 0 → 12 | 4 | Expert |
| Porte arrière (Détails) | interrupteur | — | true | Expert |
| Bascule (Forme) | curseur | 0 → 1 | 0 | Facile |
| Décalage avant / arrière (Position) | curseur | -4 → 4 m | 0 | Expert |

### 🔗 Attelage — `vehicule.hitch`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Longueur (Forme) | curseur | 0.05 → 1.5 m | 0.3 | Facile |
| Taille de la boule (Forme) | curseur | 0.01 → 0.1 m | 0.025 | Expert |
| Hauteur (Position) | curseur | 0.1 → 2 m | 0.45 | Facile |

### 🏗️ Grue / bras articulé — `vehicule.crane`

*S'adapte à :* `vehicule.chassis`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Hauteur du mât (Forme) | curseur | 0.1 → 3 m | 0.6 | Facile |
| Longueur du bras 1 (Forme) | curseur | 0.5 → 12 m | 3 | Facile |
| Longueur du bras 2 (Forme) | curseur | 0 → 10 m | 2.4 | Facile |
| Épaisseur (Forme) | curseur | 0.05 → 0.8 m | 0.22 | Expert |
| Angle du bras 1 (Forme) | curseur | 0 → 90 ° | 50 | Facile |
| Angle du bras 2 (Forme) | curseur | -170 → 90 ° | -30 | Expert |
| Rotation de la grue (Forme) | curseur | -180 → 180 ° | 0 | Expert |
| Crochet et câble (Détails) | interrupteur | — | true | Expert |
| Position sur le châssis (Position) | curseur | 0 → 1.2 | 0.6 | Facile |

## 🏠 Module Maison

### 🪟 Porte / fenêtre — `house.opening`

*S'adapte à :* `house.volume`, `house.roof`

*Variantes prêtes à l'emploi :* 🪟 Fenêtre · ⭕ Fenêtre ronde · 🏛️ Fenêtre arrondie · 🚪 Porte d’entrée · 🚪 Porte double · 🏞️ Baie vitrée · 🚘 Porte de garage · 🔆 Velux

*Animation :* Ouverture

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Fenêtre, Porte, Baie vitrée, Garage, Velux (toit) | fenetre | Facile |
| Forme (Forme) | choix | Rectangle, Arche, Cintrée, Ronde, Ovale, Triangle, Trapèze, Hexagone | rect | Facile |
| Largeur (Forme) | curseur | 0.2 → 6 m | 1.1 | Facile |
| Hauteur (Forme) | curseur | 0.2 → 5 m | 1.3 | Facile |
| Nombre (Forme) | curseur | 1 → 8 | 1 | Facile |
| Écart entre deux (Forme) | curseur | 0 → 4 m | 0.6 | Expert |
| Mur (Position sur le mur) | choix | Façade, Arrière, Gauche, Droite | devant | Facile |
| Quel pan de mur ? (Position sur le mur) | curseur | 0 → 4 | 0 | Expert |
| Étage (Position sur le mur) | curseur | -1 → 12 | 0 | Facile |
| Hauteur du bas (Position sur le mur) | curseur | 0 → 4 m | 0.9 | Facile |
| Position le long du mur (Position sur le mur) | curseur | -12 → 12 m | 0 | Facile |
| Pan de toit (velux) (Position sur le mur) | curseur | 0 → 3 | 0 | Expert |
| Versant (velux) (Position sur le mur) | choix | Versant A, Versant B | a | Facile |
| Hauteur sur le versant (velux) (Position sur le mur) | curseur | 0.05 → 0.95 | 0.5 | Expert |
| Épaisseur du cadre (Cadre et détails) | curseur | 0.01 → 0.3 m | 0.06 | Facile |
| Petits-bois verticaux (Cadre et détails) | curseur | 0 → 8 | 1 | Expert |
| Petits-bois horizontaux (Cadre et détails) | curseur | 0 → 8 | 1 | Expert |
| Style (Cadre et détails) | choix | Pleine, Vitrée, Double, Sectionnelle, Enroulable, Battante | pleine | Facile |
| Appui de fenêtre (Cadre et détails) | interrupteur | — | true | Expert |
| Linteau (Cadre et détails) | interrupteur | — | false | Expert |
| Volets (Cadre et détails) | interrupteur | — | false | Expert |
| Seuil / marche (Cadre et détails) | interrupteur | — | true | Expert |
| Poignée (Cadre et détails) | interrupteur | — | true | Expert |
| Ouverture (Ouverture) | curseur | 0 → 1 | 0 | Facile |

### 🏠 Volume / bloc — `house.volume`

*Variantes prêtes à l'emploi :* 🏠 Maison simple · 🅻 Maison en L · 🅤 Maison en U · 🅃 Maison en T · ✚ En croix · 🛑 Octogonale · 🏰 Tour ronde · 🚘 Garage (bloc) · 🏢 Immeuble · 🌆 Gratte-ciel

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme du plan (Forme et taille) | choix | Rectangle, En L, En U, En T, En croix, Octogone, Tour ronde | rect | Facile |
| Largeur (Forme et taille) | curseur | 2 → 40 m | 10 | Facile |
| Profondeur (Forme et taille) | curseur | 2 → 40 m | 8 | Facile |
| Nombre d’étages (Forme et taille) | curseur | 1 → 20 | 2 | Facile |
| Hauteur sous plafond + dalle (Forme et taille) | curseur | 2 → 5 m | 2.7 | Expert |
| Épaisseur des murs (Forme et taille) | curseur | 0.05 → 1 m | 0.3 | Expert |
| Largeur des ailes (Forme et taille) | curseur | 2 → 15 m | 4.5 | Expert |
| Corniches entre les étages (Détails de façade) | interrupteur | — | true | Expert |
| Soubassement (Détails de façade) | interrupteur | — | true | Expert |
| Dalle de toiture (Détails de façade) | interrupteur | — | true | Expert |
| Sous-sol (Sous-sol et toit-terrasse) | interrupteur | — | false | Facile |
| Hauteur du sous-sol (Sous-sol et toit-terrasse) | curseur | 1.5 → 5 m | 2.5 | Expert |
| Rooftop (muret en haut) (Sous-sol et toit-terrasse) | interrupteur | — | false | Facile |
| Hauteur du muret (Sous-sol et toit-terrasse) | curseur | 0.3 → 2 m | 1 | Expert |

### 🏠 Toit — `house.roof`

*S'adapte à :* `house.volume`

*Variantes prêtes à l'emploi :* 🏠 Deux pans · 🏡 Quatre pans · 🏛️ Mansarde · ⬜ Toit plat · 🌇 Toit-terrasse · 📐 Monopente · 🦋 Papillon · 🔺 Pyramide · ⚙️ Dents de scie · 🕌 Dôme

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type de toit (Forme du toit) | choix | Deux pans, Quatre pans, Pyramide, Mansarde, Plat, Terrasse, Monopente, Papillon, Dents de scie, Dôme | deux-pans | Facile |
| Pente (Forme du toit) | curseur | 3 → 75 ° | 35 | Facile |
| Pente du bas (mansarde) (Forme du toit) | curseur | 40 → 85 ° | 70 | Expert |
| Pente du haut (mansarde) (Forme du toit) | curseur | 5 → 60 ° | 25 | Expert |
| Hauteur de la cassure (Forme du toit) | curseur | 0.2 → 0.9 | 0.55 | Expert |
| Débord du toit (Forme du toit) | curseur | 0 → 2 m | 0.4 | Facile |
| Épaisseur (Forme du toit) | curseur | 0.04 → 0.8 m | 0.2 | Expert |
| Sens du faîtage (Forme du toit) | choix | Automatique, Le long de la façade, Vers l’avant | auto | Facile |
| Nombre de dents (Détails) | curseur | 1 → 14 | 4 | Expert |
| Hauteur du dôme (Forme du toit) | curseur | 0.3 → 12 m | 2.5 | Facile |
| Hauteur du garde-corps (Détails) | curseur | 0.3 → 2 m | 1 | Expert |
| Garde-corps (Détails) | choix | Muret, Barreaux, Verre, Barre simple | barre | Facile |
| Largeur (si libre) (Détails) | curseur | 1 → 30 m | 10 | Expert |
| Profondeur (si libre) (Détails) | curseur | 1 → 30 m | 8 | Expert |
| Gouttière (Détails) | interrupteur | — | false | Expert |

### 🏙️ Balcon — `house.balcony`

*S'adapte à :* `house.volume`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Mur (Position) | choix | Façade, Arrière, Gauche, Droite | devant | Facile |
| Quel pan de mur ? (Position) | curseur | 0 → 4 | 0 | Expert |
| Position le long du mur (Position) | curseur | -12 → 12 m | 0 | Facile |
| Étage (Position) | curseur | 1 → 12 | 1 | Facile |
| Largeur (Forme) | curseur | 0.6 → 12 m | 3 | Facile |
| Profondeur (Forme) | curseur | 0.3 → 5 m | 1.2 | Facile |
| Épaisseur de la dalle (Forme) | curseur | 0.04 → 0.6 m | 0.15 | Expert |
| Hauteur du garde-corps (Forme) | curseur | 0.2 → 2 m | 1 | Expert |
| Garde-corps (Détails) | choix | Aucun, Barreaux, Plein, Verre, Barre simple | barreaux | Facile |
| Soutien (Détails) | choix | Aucun, Consoles, Poteaux | consoles | Facile |
| Auvent (Détails) | interrupteur | — | false | Expert |

### 🪜 Escalier / perron — `house.stairs`

*S'adapte à :* `house.volume`

*Variantes prêtes à l'emploi :* 🪜 Droit · ↪️ Quart tournant · 🌀 Colimaçon · ⛩️ Perron

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Mur (Position) | choix | Façade, Arrière, Gauche, Droite | devant | Facile |
| Quel pan de mur ? (Position) | curseur | 0 → 4 | 0 | Expert |
| Position le long du mur (Position) | curseur | -12 → 12 m | 0 | Facile |
| Type (Forme) | choix | Droit, Quart tournant, Colimaçon, Perron | droit | Facile |
| Nombre de marches (Forme) | curseur | 1 → 40 | 10 | Facile |
| Hauteur d’une marche (Forme) | curseur | 0.05 → 0.4 m | 0.17 | Facile |
| Profondeur d’une marche (Forme) | curseur | 0.1 → 0.6 m | 0.28 | Expert |
| Largeur (Forme) | curseur | 0.4 → 6 m | 1.2 | Facile |
| Sens du virage (Forme) | curseur | -1 → 1 | 1 | Expert |
| Hauteur du départ (Position) | curseur | -3 → 12 m | 0 | Expert |
| Rampe (Détails) | interrupteur | — | true | Expert |

### 🏭 Cheminée — `house.chimney`

*S'adapte à :* `house.volume`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Largeur (Forme) | curseur | 0.2 → 3 m | 0.6 | Facile |
| Profondeur (Forme) | curseur | 0.2 → 3 m | 0.6 | Expert |
| Hauteur au-dessus du toit (Forme) | curseur | 0.3 → 8 m | 1.8 | Facile |
| Sommet (Forme) | choix | Plat, Mitre, Chapeau, Boisseaux | mitre | Facile |
| Nombre de boisseaux (Détails) | curseur | 1 → 6 | 2 | Expert |
| Position gauche / droite (Position) | curseur | -20 → 20 m | 3 | Facile |
| Position avant / arrière (Position) | curseur | -20 → 20 m | 0 | Facile |
| Bandeaux de briques (Détails) | interrupteur | — | true | Expert |

### ☀️ Panneaux solaires — `house.solar`

*S'adapte à :* `house.roof`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Rangées (Forme) | curseur | 1 → 12 | 2 | Facile |
| Colonnes (Forme) | curseur | 1 → 20 | 4 | Facile |
| Largeur d’un panneau (Forme) | curseur | 0.3 → 3 m | 1 | Expert |
| Hauteur d’un panneau (Forme) | curseur | 0.3 → 3 m | 1.65 | Expert |
| Espace entre panneaux (Forme) | curseur | 0 → 0.3 m | 0.03 | Expert |
| Cellules par panneau (Détails) | curseur | 0 → 8 | 3 | Expert |
| Pan de toit (Position) | curseur | 0 → 3 | 0 | Facile |
| Versant (Position) | choix | Versant A, Versant B | a | Facile |
| Hauteur sur le versant (Position) | curseur | 0.05 → 0.95 | 0.5 | Expert |
| Décalage le long du faîtage (Position) | curseur | -12 → 12 m | 0 | Expert |
| Inclinaison (toit plat) (Position) | curseur | 0 → 70 ° | 30 | Expert |

### 🏊 Piscine — `house.pool`

*Variantes prêtes à l'emploi :* 🏊 Rectangulaire · 🫘 Haricot · ⭕ Ronde · 🅻 En L

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Forme (Forme) | choix | Rectangle, Haricot, Ronde, En L | rect | Facile |
| Longueur (Forme) | curseur | 2 → 30 m | 8 | Facile |
| Largeur (Forme) | curseur | 2 → 20 m | 4 | Facile |
| Profondeur apparente (Forme) | curseur | 0.1 → 2 m | 0.4 | Expert |
| Largeur de la margelle (Forme) | curseur | 0.05 → 1.5 m | 0.35 | Facile |
| Épaisseur de la margelle (Détails) | curseur | 0.02 → 0.4 m | 0.08 | Expert |
| Échelles (Détails) | curseur | 0 → 4 | 1 | Expert |
| Marches d’angle (Détails) | interrupteur | — | true | Expert |
| Plage autour (Détails) | interrupteur | — | true | Expert |
| Largeur de la plage (Détails) | curseur | 0.2 → 4 m | 1.2 | Expert |

### 🚧 Clôture / mur — `house.fence`

*Variantes prêtes à l'emploi :* 🪵 Lattes bois · ▥ Barreaux · 🕸️ Grillage · 🧱 Muret · 🏰 Palissade

*Animation :* Portail

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Disposition (Forme) | choix | Une ligne, Tout autour, En L | rectangle | Facile |
| Longueur (Forme) | curseur | 1 → 60 m | 20 | Facile |
| Profondeur (Forme) | curseur | 1 → 60 m | 16 | Facile |
| Hauteur (Forme) | curseur | 0.2 → 4 m | 1.1 | Facile |
| Style (Forme) | choix | Lattes, Barreaux, Grillage, Muret, Palissade | lattes | Facile |
| Écart entre poteaux (Détails) | curseur | 0.5 → 6 m | 2 | Expert |
| Largeur des lattes (Détails) | curseur | 0.02 → 0.4 m | 0.09 | Expert |
| Portail / portillon (Détails) | interrupteur | — | true | Facile |
| Largeur du portail (Détails) | curseur | 0.6 → 6 m | 1.2 | Expert |
| Portail ouvert (Détails) | curseur | 0 → 1 | 0 | Expert |

### 🌳 Arbre — `house.tree`

*Variantes prêtes à l'emploi :* 🌳 Feuillu · 🌲 Sapin · 🌴 Palmier · 🟢 Arbre boule · 🌿 Peuplier

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Espèce (Forme) | choix | Feuillu, Sapin, Palmier, Boule, Peuplier | feuillu | Facile |
| Hauteur du tronc (Forme) | curseur | 0.3 → 10 m | 2.2 | Facile |
| Épaisseur du tronc (Forme) | curseur | 0.03 → 1 m | 0.18 | Expert |
| Largeur de la couronne (Forme) | curseur | 0.3 → 8 m | 1.8 | Facile |
| Hauteur totale (sapin, peuplier) (Forme) | curseur | 1 → 25 m | 5 | Expert |
| Étages (sapin) (Détails) | curseur | 2 → 10 | 4 | Expert |
| Boules de feuillage (Détails) | curseur | 1 → 20 | 7 | Expert |
| Palmes (Détails) | curseur | 3 → 20 | 9 | Expert |

### 🌿 Haie / buisson — `house.bush`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Haie, Buisson, Massif de fleurs | haie | Facile |
| Longueur (Forme) | curseur | 0.3 → 30 m | 4 | Facile |
| Largeur (Forme) | curseur | 0.1 → 5 m | 0.7 | Expert |
| Hauteur (Forme) | curseur | 0.1 → 4 m | 1.1 | Facile |
| Arrondi (Forme) | curseur | 0.01 → 1 m | 0.25 | Expert |
| Nombre de fleurs / boules (Détails) | curseur | 3 → 80 | 18 | Expert |

### 🟩 Terrain / jardin — `house.ground`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Largeur (Forme) | curseur | 4 → 120 m | 30 | Facile |
| Profondeur (Forme) | curseur | 4 → 120 m | 24 | Facile |
| Épaisseur (Forme) | curseur | 0.05 → 2 m | 0.3 | Expert |
| Bordure (Forme) | curseur | 0 → 0.6 m | 0.15 | Expert |
| Allée (Détails) | interrupteur | — | true | Facile |
| Largeur de l’allée (Détails) | curseur | 0.4 → 6 m | 1.2 | Expert |
| Style d’allée (Détails) | choix | Continue, Pas japonais, Pavée | dalles | Facile |
| Position de l’allée (Détails) | curseur | -15 → 15 m | 0 | Expert |
| Début de l’allée (depuis la maison) (Détails) | curseur | 0 → 40 m | 8 | Expert |
| Allée de garage (Détails) | interrupteur | — | false | Expert |

### 🪵 Terrasse — `house.terrace`

*S'adapte à :* `house.volume`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Mur (Position) | choix | Façade, Arrière, Gauche, Droite | devant | Facile |
| Quel pan de mur ? (Position) | curseur | 0 → 4 | 0 | Expert |
| Position le long du mur (Position) | curseur | -12 → 12 m | 0 | Facile |
| Largeur (Forme) | curseur | 1 → 20 m | 5 | Facile |
| Profondeur (Forme) | curseur | 0.5 → 12 m | 3 | Facile |
| Épaisseur (Forme) | curseur | 0.03 → 1 m | 0.12 | Expert |
| Hauteur au-dessus du sol (Forme) | curseur | 0 → 1.5 m | 0.2 | Expert |
| Largeur des lames (Détails) | curseur | 0.05 → 0.4 m | 0.24 | Expert |
| Garde-corps (Détails) | interrupteur | — | false | Expert |
| Marches (Détails) | interrupteur | — | true | Expert |

### ⛱️ Pergola / abri — `house.pergola`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Pergola (lattes), Abri voiture, Auvent plein | pergola | Facile |
| Largeur (Forme) | curseur | 1 → 15 m | 4 | Facile |
| Profondeur (Forme) | curseur | 1 → 15 m | 3 | Facile |
| Hauteur (Forme) | curseur | 1.5 → 6 m | 2.6 | Facile |
| Section des poteaux (Forme) | curseur | 0.04 → 0.5 m | 0.12 | Expert |
| Nombre de lattes (Détails) | curseur | 2 → 40 | 6 | Expert |
| Pente du toit (Détails) | curseur | 0 → 30 ° | 5 | Expert |

### 💡 Lampadaire / boîte aux lettres — `house.lamp`

| Réglage | Type | Plage du curseur | Défaut | Mode |
|---|---|---|---|---|
| Type (Forme) | choix | Lampadaire, Borne basse, Boîte aux lettres | lampadaire | Facile |
| Hauteur (Forme) | curseur | 0.3 → 10 m | 3.2 | Facile |
| Taille de la lampe (Forme) | curseur | 0.05 → 1.5 m | 0.35 | Expert |
