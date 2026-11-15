# Prompt à coller dans GitHub Copilot Chat (mode Agent)

Avant de commencer : fais un commit (`git add .` puis `git commit -m "Avant atelier"`). Copie le dossier `atelier_animations_foret_ancetres` à côté de `index.html`, dans le projet.

```
Tu travailles sur mon jeu « Forêt des Ancêtres – Les âmes de Loïc » (HTML/CSS/JS, Canvas 2D), empaqueté avec Tauri v2. Le fichier principal est index.html à la racine du projet.
Le dossier atelier_animations_foret_ancetres/ contient des modules prêts à fusionner : js/animation-engine.js, js/menu-scene.js, js/manifest.js, les spritesheets dans assets/, et integration/ASSET_MANIFEST.md.

ÉTAPE 1 – ANALYSE (ne modifie encore rien)
1. Lis index.html en entier : états du jeu (title, play, pause, opts…), boucle principale, menuItems(), activate(), newGame(), openOpts(), checkForUpdates(), sauvegardes, clavier/souris, dessin du héros, du feu et de l'eau.
2. Lis les modules de l'atelier et ASSET_MANIFEST.md.
3. Liste les fonctions et variables du jeu qui existent déjà, et les risques de conflit de noms (les modules n'utilisent que window.ForetAtelier).
4. Donne-moi un plan en points d'intégration AVANT de coder, et attends mon accord.

ÉTAPE 2 – INTÉGRATION (après mon accord)
5. Charge les modules depuis le jeu sans les recopier en double : ajoute seulement les <script> nécessaires, en gardant les chemins relatifs.
6. Menu principal : utilise ForetAtelier.initMenu(stage, canvas) pour la cascade, la brume, les lucioles, les papillons et les reflets, avec menu_foret_16x9.png en fond. Garde mes boutons actuels : Commencer l'aventure, Paramètres, Voir les mises à jour, TEST : choisir un niveau. Chaque bouton doit appeler la même fonction qu'avant.
7. Héros : branche les spritesheets existantes (repos, course, saut, dégainage, recharge, vol, forme éveillée) sur les états correspondants du jeu. Les ailes bleues ne doivent apparaître que dans les formes vol et éveillée.
8. Feu et cascade : utilise env_campfire.png et env_waterfall_small.png là où le jeu dessine déjà du feu ou de l'eau, sans déplacer ni modifier les cartes.
9. Boule d'énergie : fx_energy_ball.png, indépendante du héros après le lancer.
10. Si une animation n'a pas d'image (marche, roulade, nage, escalade, mort…), garde le dessin actuel du jeu. N'invente aucune image.
11. Utilise une seule boucle requestAnimationFrame : branche-toi sur celle du jeu, n'en crée pas une deuxième.
12. Prévois init() et destroy() pour chaque module, activables séparément.

INTERDICTIONS ABSOLUES
- Ne remplace pas index.html en entier.
- Ne supprime ni chapitres, ni missions, ni dialogues, ni mécaniques de jeu.
- Ne touche ni aux sauvegardes, ni aux commandes clavier/souris, ni aux cartes.
- Ne casse aucun menu, y compris « Voir les mises à jour » (système Tauri updater).
- Ne crée aucune fonction en doublon : si une fonction existe, adapte-la au lieu d'en ajouter une autre.
- Ne modifie pas src-tauri/ sauf si les images ne sont pas trouvées (chemin frontendDist) ; dans ce cas, demande-moi d'abord.
- Ne touche jamais aux clés de signature ni à tauri.conf.json (updater).

ÉTAPE 3 – TESTS ET RAPPORT
13. Lance le jeu (npx tauri dev) et vérifie : menu, chaque bouton, nouvelle partie, pause, paramètres, sauvegarde et chargement, console sans erreur, images trouvées.
14. Corrige les erreurs que tu as introduites.
15. Termine par un rapport : fichiers modifiés, fonctions ajoutées, fonctions adaptées, animations branchées, animations non branchées faute d'images.
```

## Si Copilot se trompe
Utilise **Undo** dans le panneau Copilot, ou `git restore index.html` pour revenir au dernier commit.
