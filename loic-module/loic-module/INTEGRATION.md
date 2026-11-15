# Module Décors + Mouvements + HUD — Forêt des Ancêtres

## Contenu
```
loic-module/
├── css/hud.css            style du HUD (verre sombre, halo turquoise)
├── js/decors.js           décors, plateformes, échelles, cordes (F2 = hitboxes)
├── js/mouvements.js       grimper, coup plongeant, plané
├── js/hud.js              HUD : héros, âmes, objectif, compétences
├── assets/decors/*.png    64 éléments découpés (fond transparent) + catalogue.json
├── assets/hud/portrait.png
└── outils/                planches d'origine + decouper.py (pour redécouper)
```

## Nouveaux mouvements
| Mouvement | Commande |
|---|---|
| Grimper échelle / corde | ↑ ou ↓ près d'une échelle ou d'une corde (manette : croix haut/bas) |
| Lâcher / sauter de l'échelle | Espace |
| Coup plongeant (onde de choc, 2 dégâts) | en l'air : ↓ + X |
| Plané (chute lente) | après le double saut, maintenir Espace |

## Intégration (à la main)
1. Copie les dossiers `css`, `js` et `assets` à côté du fichier HTML du jeu.
2. Dans le HTML, juste avant `</body>`, **après** le `<script>` principal :
```html
<link rel="stylesheet" href="css/hud.css">
<script src="js/decors.js"></script>
<script src="js/mouvements.js"></script>
<script src="js/hud.js"></script>
```
3. Lance le jeu. Appuie sur **F2** pour voir les hitboxes (jaune = plateformes, cyan = zones à grimper).

Ces fichiers ne modifient pas le code du jeu : ils se branchent dessus (`build`, `world`, `moveY`, `play`, `hud`). Pour tout retirer, enlève les 4 lignes.

## Intégration avec Copilot (prompt à coller)
> Intègre le module "loic-module" dans mon jeu sans modifier son gameplay. Copie css/, js/ et assets/ à côté du HTML principal (dans le dossier servi par Tauri, `frontendDist`). Ajoute avant </body>, après le script principal : le lien css/hud.css puis les scripts js/decors.js, js/mouvements.js, js/hud.js dans cet ordre. Lance `npm run tauri dev`, vérifie dans la console qu'il n'y a pas d'erreur, que les décors apparaissent, que je peux monter sur les plateformes, grimper aux échelles (↑/↓), faire le coup plongeant (↓ + X en l'air) et planer. Corrige toi-même les erreurs, sans toucher au reste du jeu.

## Réglages rapides (dans js/decors.js)
- `KIT` : quels décors et plateformes pour chaque zone (une ligne par zone).
- `TW` : largeur des plateformes (en tuiles). `SY` : hauteur de la surface de marche (fraction de l'image).
- Densité : les pas `4+R()*8`, `3+R()*6`, `11+R()*10` dans `make()`.

## Limites connues
- Les plateformes ajoutées sont « à traverser par le haut » (on saute à travers, on atterrit dessus).
- Les décors sont générés à chaque niveau avec une graine fixe : même placement à chaque partie.
- La minimap, le boss et la barre de potions restent ceux du jeu d'origine.
