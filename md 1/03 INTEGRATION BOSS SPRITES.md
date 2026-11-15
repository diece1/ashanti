# Intégration des sprites de boss (Akuma, Nguéma, Mokélé)

Ne remplacer QUE le dessin. La logique (`BD`, `AK`, `bossStep()`, phases, récompenses) reste celle du jeu.
Sprites : `assets/boss/<id>/<nom>.png`, regardent vers la DROITE (miroir si le boss regarde à gauche). Fichier `assets/boss/<id>/manifest.json` : `{nom: {file, w, h, ax, ay, kind}}` où (ax, ay) = point d'ancrage au sol (pieds, centre).

## Correspondance des états
| Boss | Sprites (`nom`) |
|---|---|
| Akuma (`akuma`) | idle, marche, course, saut, attaque_epee, combo, frappe_lourde, degats, mort1, mort2 |
| Nguéma (`nguema`) | idle, marche, course, saut, bond, ruee, griffes, rugissement (pas de « dégâts » ni « mort » : clignotement blanc + dissolution à coder) |
| Mokélé (`mokele`) | `p1_` et `p2_` + idle, marche, course, saut, attaque1, attaque2, attaque3, degats, mort (phase 2 à 50 % : préfixe `p2_`) |

Autres images : `forme1..3` (cartes de transformation, fond illustré), `portrait`, FX (`lame_du_roi`, `onde_ancestrale`, `colonnes_feu`, `ecrasement_royal`, `invocation_ombres`, `jugement_ancestral`, `aura_ancienne`, `symboles_lumineux`, `fissures_sol`, `flammes_royales`, `zone_maudite`, `explosion_finale` ; `disparition_obscure`, `onde_des_ames`, `double_griffes`, `traces_sombres`, `piliers_ombres`, `cercle_ames`, `charge_obscure`, `explosion_spirituelle` ; `racines_surgissantes`, `onde_tellurique`, `balayage_racines`, `epines_sol`, `regeneration`, `explosion_racinaire`) à dessiner avec `globalCompositeOperation = 'lighter'`, icônes de récompense, arène (`arene_*.jpg`). Musique de combat : `assets/audio/pulse_of_the_ancestors_2.mp3`.

## Échelle (important)
Le joueur fait 30 px de haut ; le canvas est 960×544. Hauteur d'affichage cible : Akuma ~150 px, Nguéma ~100 px, Mokélé ~160 px, mesurée sur le sprite `idle`. Facteur = hauteurCible / sprite.idle.h.

## Code de départ (à adapter)
```js
const BSP = {};                       // BSP[id][nom] = {img, w, h, ax, ay}
async function loadBossSprites(id){
  const man = await (await fetch('assets/boss/'+id+'/manifest.json')).json();
  BSP[id] = {};
  await Promise.all(Object.keys(man).map(n => new Promise(r => {
    const i = new Image(); i.onload = r; i.onerror = r; i.src = man[n].file;   // file est relatif au dossier du jeu
    BSP[id][n] = Object.assign({img:i}, man[n]);
  })));
}
function drawBossSprite(id, nom, x, groundY, face, hCible, alpha){
  const s = BSP[id][nom] || BSP[id].idle, k = hCible / (BSP[id].idle || BSP[id].p1_idle).h;
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.translate(x - cam, groundY); ctx.scale(face * k, k);   // face = 1 (droite) ou -1
  ctx.drawImage(s.img, -s.ax, -s.ay); ctx.restore();
}
```
Si le jeu doit fonctionner en double-clic (file://), `fetch` du manifest est bloqué : charger à la place `foret-bosses/src/boss-data.js` (définit `window.FB_ASSETS` = tous les manifests) et lire `FB_ASSETS[id]`.

Animation sans autres poses : respiration (échelle ±1 %), rebond à la marche, fente vers l'avant à l'attaque (en pixels, sur ~20 images), flash blanc quand touché, tremblement à l'impact, dissolution à la mort.
