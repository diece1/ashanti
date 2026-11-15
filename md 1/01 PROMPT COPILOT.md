# Prompt à coller dans Copilot (mode Agent)

Pièces jointes à ajouter avec le bouton « + » (menu : Files… / Files & Folders…) :
- `index.html` (le jeu)  → Files…
- `GUIDE_MODULES.md`, `02_SPEC_COMBAT_MORT_SAUVEGARDE.md`, `03_INTEGRATION_BOSS_SPRITES.md`  → Files…
- le dossier `foret-bosses/assets/boss/` (+ `assets/audio/pulse_of_the_ancestors_2.mp3`) copié dans le dossier du jeu  → Files & Folders…

---

Tu es un développeur JavaScript senior. Mon jeu est un fichier unique `index.html` (canvas 960×544, tuile T=32, logique en images à 60 fps), documenté dans `GUIDE_MODULES.md`. Travaille dans ce fichier, sans le réécrire entièrement, sans nouvelle bibliothèque, commentaires en français.

Objectif : implémenter ce que décrivent `02_SPEC_COMBAT_MORT_SAUVEGARDE.md` et `03_INTEGRATION_BOSS_SPRITES.md`.

Méthode obligatoire :
1. ANALYSE d'abord, sans rien modifier : retrouve dans `index.html` les fonctions et variables citées dans le guide (`play()`, `hurt()`, `kill()`, `gain()`, `build()`, `world()`, `bossStep()`, `drawBoss()`, `bossReward()`, `P`, `E`, `S`, `CR`, `BD`, `AK`, `BZ`, `say()`). Dis-moi : (a) ce qui existe déjà pour la mort, le game over et la sauvegarde ; (b) comment la jauge d'âmes est stockée ; (c) où est la boucle de jeu. Résume en 10 lignes maximum puis continue.
2. Applique les changements par ÉTAPES séparées et testables, dans cet ordre, en t'arrêtant après chacune pour me lister ce qui est modifié :
   - Étape 1 : sauvegarde (`SAVE`, trois emplacements, `localStorage` dans `try/catch`).
   - Étape 2 : mort + Écho d'âme.
   - Étape 3 : autels ancestraux (soin, `pot`, sauvegarde, point de réapparition).
   - Étape 4 : combat rapide et fluide (jauge, soin, esquive, attaque puissante, rebond, recul, invulnérabilité).
   - Étape 5 : sprites des boss (remplacer seulement le dessin, garder `BD`, `AK`, `bossStep()`).
   - Étape 6 : menu Continuer / Nouvelle partie.
3. Ne supprime aucune fonctionnalité existante sans me la lister avant. Ne touche pas aux chaînes Base64 intégrées.
4. À la fin : liste des fonctions ajoutées/modifiées, 8 tests manuels à faire dans le navigateur, et les points où tu as dû faire une hypothèse.

Si une information manque (ex. nom d'une variable), cherche-la dans le code avant de demander.
