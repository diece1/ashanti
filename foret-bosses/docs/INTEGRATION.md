# Guide d'intégration

## 1. Copier
Copie le dossier `foret-bosses/` à côté de ton `index.html`. Les chemins sont relatifs : `window.FB_BASE` doit pointer vers ce dossier (avec « / » final).

## 2. Charger
Voir README. Pour précharger pendant un écran de chargement : `await ForetBosses.load('akuma')`.

## 3. Créer / remplacer un boss
`ForetBosses.create(id, options)` → `Boss`. `id` ∈ `akuma | nguema | mokele`.
Options : `x`, `y` (**ligne de sol**), `facing` (1 droite / -1 gauche), `scale`, `hp`, `damage` (multiplicateur), `ai` (true = IA intégrée), `target` (`{x}` du joueur, pour l'IA), `sounds`.
Pour remplacer l'ancien boss : supprime son objet/ses sprites, crée celui-ci, appelle `update(dt)` et `draw(ctx)` à sa place dans ta boucle (même contexte 2D, coordonnées monde en pixels, y vers le bas).

## 4. API du Boss
Commandes : `walk(dir, run)`, `stop()`, `jump()`, `attack(i)`, `special(id)`, `roar()`, `damage(n,{dir})`, `heal(n)`, `setHp(v)`, `setPhase(i)`, `revive()`.
Lecture : `hp`, `maxHp`, `hpRatio`, `phase`, `alive`, `hitbox()`, `attackBox(portee)`, `def` (stats, phases, attaques, spéciaux, arène, récompenses), `image(nom)` (icônes, portrait…).
Événements (`boss.on(nom, fn)`) :
- `hit` → `{damage, box, attack|special}` : applique `damage` au joueur si `box` le touche.
- `hurt`, `heal`, `state`, `special`, `shake` (intensité), `card` (début de transformation), `phase` → `{index,name,forme}`, `death` → `{rewards}`.
Si tu pilotes toi-même le boss : `ai:false` et appelle `attack/special/walk`.

## 5. Dégâts des boss
`def.degats` donne [min,max] ; chaque attaque/pouvoir applique un coefficient. Équilibre via l'option `damage` (multiplicateur) et `hp`.

## 6. Cinématique de transformation
Franchir un seuil de PV déclenche : boss invulnérable 2,6 s, carte de forme plein écran, tremblement. Dessine-la avec `boss.drawCard(ctx, W, H)` après ta scène. Désactiver : `boss.setPhase(i, true)` (silencieux).

## 7. Arène, HUD, musique
- Fond : `await ForetBosses.arena(id)` → `Image` (jpg 16:9 à dessiner en cover).
- Barre de vie : `ForetBosses.hud(boss, conteneurRelatif)` puis `hud.update()` chaque frame (style `boss.css`).
- Musique : `ForetBosses.music.play()` (après un geste utilisateur), `.stop(fadeSec)`, `.setVolume(v)`. Le volume monte avec les phases (`boss.setPhase` l'ajuste automatiquement). Elle boucle.

## 8. Ajouter/modifier
Pouvoirs, vitesses, portées, durées : tableau `DEFS` en haut de `src/boss.js`. Redécouper les planches : `python3 tools/slice_bosses.py` puis `python3 tools/build_boss_data.py`.

## Tests
`python3 tools/test_boss.py` (Playwright) : charge la démo et vérifie images, 3 attaques, tous les pouvoirs, phases, mort, IA, absence d'erreurs.
