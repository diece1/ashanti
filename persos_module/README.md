# Module Personnages — Forêt des Ancêtres

Freddy · Willem · Wata Wata · Elfried · Kana Ramses — sprites détourés, animations et pouvoirs.

## Contenu
```
persos_module/
├─ persos.html            démo (sélection + prévisualisation, touches ← → Maj Espace X)
├─ css/persos.css         styles de la sélection de personnage
├─ js/persos.js           données + classe Persos.Sprite (aucune dépendance)
└─ assets/
   ├─ freddy.png  willem.png  wata_wata.png  elfried.png   (atlas, 15 frames chacun, fond transparent)
   ├─ kana_ramses.png                                      (atlas, 60 frames, animations propres)
   └─ portraits/*.png     portraits avec bandeau du nom
```

## Les 15 frames de chaque atlas
| Animation | Frames | Notes |
|---|---|---|
| idle  | 0, 1        | respiration |
| walk  | 2, 3, 4     | cycle 2-3-4-3 |
| run   | 5, 6        | |
| jump  | 7, 8        | montée, apogée |
| power | 9, 10, 11   | préparation, **effet du pouvoir**, retombée (alias `attack`) |
| hurt  | 12          | touché |
| ko    | 13          | à genoux / à terre |
| dead  | 14          | allongé |

## Kana Ramses (animations propres, `p.anims`)
| Animation | Frames |
|---|---|
| idle | 0–7 |
| walk | 8–15 |
| run | 16–24 |
| jump / land | 25–30 / 31–33 |
| attack (combo poings + coup de pied) | 34–39 |
| **power** (entaille rouge, onde, pose lumineuse) | 40–42 |
| hurt / ko / dead | 43–45 / 46–51 / 52–59 |

## Pouvoirs (noms proposés, modifiables dans `js/persos.js`)
- **Freddy** — Lame écarlate (arc rouge)
- **Willem** — Vague azur (vague bleue)
- **Wata Wata** — Tourbillon sylvestre (tourbillon vert)
- **Elfried** — Croissant d’âmes (orbes puis croissant violet)
- **Kana Ramses** — Frappe cramoisie (entaille rouge puis onde d’énergie)

## API
```js
await Persos.load('persos_module/');          // précharge atlas + portraits
const s = new Persos.Sprite('freddy');        // 'freddy' | 'willem' | 'wata_wata' | 'elfried'
s.play('power');                              // lance une animation
s.auto({dead, hurt, power, attack, onGround, vx, run});// choisit l'animation selon l'état du joueur
s.update(dt);                                 // dt en SECONDES
s.draw(ctx, piedsX, piedsY, face);            // face = 1 droite, -1 gauche ; (x,y) = pieds
s.done                                        // true quand une animation non bouclée est finie
Persos.TARGET_H = 64                          // hauteur au repos en px de jeu (dans persos.js)
Persos.list / Persos.get(id)                  // nom, couleur, stats, pouvoir, portrait
```

## Prompt à donner à Copilot (dans le fichier principal)
> Intègre le module `persos_module` dans mon jeu sans casser l'existant. 1) Charge `css/persos.css` et `js/persos.js`. 2) Ajoute un écran de sélection (classe `.persos-select` / `.perso-card`, voir `persos.html`) avec Loïc + les 4 personnages, et garde le choix dans une variable `heroId`. 3) Dans la fonction qui dessine le joueur, si `heroId !== 'loic'`, utilise `Persos.Sprite` : `sprite.auto({dead:P.dead, hurt:P.inv>0, power:P.attacking, onGround:P.onGround, vx:P.vx, run:P.rolling})`, `sprite.update(dt)` puis `sprite.draw(ctx, P.x+P.w/2-cam, P.y+P.h, P.face)`. 4) Branche le pouvoir sur la touche/capacité existante : joue `sprite.play('power')` et applique les dégâts à l'instant de la frame 10. 5) Garde les hitboxes du jeu actuelles, ne les déduis pas de la taille de l'image. 6) Ne modifie pas la boucle principale ni les capacités de Loïc.
