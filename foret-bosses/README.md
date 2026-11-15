# FORÊT DES ANCÊTRES — Pack Boss (Akuma · Nguéma · Mokélé)

Dossier HTML/CSS/JS prêt à brancher sur ton jeu pour **remplacer les boss existants**. Aucune dépendance, aucun build.

```
index.html            démo autonome (ouvrir via un petit serveur http, ou directement)
src/boss.js           module ForetBosses (sprites, états, phases, effets, musique, HUD)
src/boss.css          style de la barre de vie (+ démo)
src/boss-data.js      inventaire des images (généré)
assets/boss/<boss>/   sprites découpés (PNG transparents), FX, icônes, cartes de forme, arène (jpg), manifest.json
assets/audio/pulse_of_the_ancestors_2.mp3   musique de combat
assets/source/        planches originales
tools/                scripts de découpe (slice_bosses.py), de génération (build_boss_data.py), test (test_boss.py)
docs/INTEGRATION.md   guide d'intégration
```

## Intégration en 5 lignes
```html
<link rel="stylesheet" href="foret-bosses/src/boss.css">
<script>window.FB_BASE='foret-bosses/';</script>
<script src="foret-bosses/src/boss-data.js"></script>
<script src="foret-bosses/src/boss.js"></script>
```
```js
const boss = await ForetBosses.create('akuma', {x:900, y:groundY, facing:-1, target:player});
boss.on('hit', e => { if (overlap(e.box, player.hitbox)) player.hurt(e.damage); });
boss.on('death', e => giveRewards(e.rewards));
// dans ta boucle de jeu :
boss.update(dt);  boss.draw(ctx);  boss.drawCard(ctx, W, H);
// quand le joueur touche le boss :
boss.damage(playerDamage);
ForetBosses.music.play();   // depuis un clic/touche
```
Détails, événements et remplacement d'un boss existant : `docs/INTEGRATION.md`.

## Contenu
| Boss | PV | Dégâts | Vitesse | Phases |
|---|---|---|---|---|
| Akuma | 2500+ | 50–80 | Moyenne | Le Roi Endormi (100→70 %) · Le Roi Corrompu (70→35 %) · Le Jugement (35→0 %) |
| Nguéma | 1200+ | 30–60 | Très rapide | La Chasse (100→65) · Prédateur Éveillé (65→30) · Dévoreur des Âmes (30→0) |
| Mokélé | 1000+ | 25–35 | Lente | Gardien (100→50) · Gardien Enragé (50→0, jeu de sprites p2) |

Chaque boss : animations (idle, marche, course, saut, attaques, dégâts, mort), pouvoirs spéciaux avec leurs FX (mode additif), cartes de transformation, portrait, icônes de récompense, arène.

## Limites (honnêtes)
- Les planches ne contiennent **qu'une pose par mouvement** (et ~100 px de haut) : les sprites sont agrandis ×2 puis affinés, donc un peu doux. Le module crée le mouvement en procédural (respiration, rebond, fente, flash, tremblement, dissolution).
- Nguéma n'a ni sprite « dégâts » ni « mort » : flash blanc + dissolution procéduraux. Akuma a dégâts + 2 poses de mort ; Mokélé a des jeux complets p1/p2.
- Les **formes** (transformations) sont des cartes illustrées avec leur fond flammé, pas des découpes.
- Quelques résidus de fond/petits fragments isolés restent sur certains sprites (ligne verte au sol sous quelques Mokélé, petit morceau d'épée détaché sur Akuma « saut »). Les sons d'impact/rugissement ne sont pas fournis : branchables via `sounds:{hurt,attack,special,roar,death,transform}`.
- Ton fichier de jeu n'ayant pas été fourni, l'intégration passe par une API (`update/draw/damage/événements`) à relier à ton code.
