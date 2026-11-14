# Guide des modules du jeu

Ce guide décrit le fonctionnement actuel de [`index.html`](./index.html). Le jeu est volontairement monolithique : le HTML, le CSS, le JavaScript, les images et la musique intégrés sont dans ce fichier. Il n'y a pas de classes ou de fichiers séparés pour les ennemis, les objets ou les dialogues ; les données sont principalement des objets JavaScript, des tableaux et des fonctions.

Les exemples ci-dessous montrent où et comment étendre le code. Ils ne sont pas appliqués au jeu.

## Repères généraux

- Le monde est dessiné sur un canvas de `960 × 544` pixels.
- `T = 32` est la taille d'une tuile ; `H = 17` est le nombre de rangées de la carte.
- `Z` contient les données des zones, `ET` les modèles d'ennemis, `E` les ennemis présents dans la partie.
- `build(z)` construit la carte et initialise les entités ; `play()` met à jour le jeu ; `world()` dessine le monde.
- Les données visuelles et audio sont déjà intégrées sous forme de chaînes Base64 dans le HTML. Il vaut mieux ne pas les éditer manuellement.

## 1. Ennemi

Les modèles sont dans `ET`. Chaque modèle est identifié par son indice dans ce tableau. `spawn(type, x, y)` crée ensuite une instance dans `E`, avec sa position, ses points de vie, sa vitesse, son état d'animation et ses compteurs. `play()` gère le comportement ; `drawE()` ou, pour certains modèles, `drawSpr()` gère l'affichage.

Champs courants :

| Champ | Rôle |
|---|---|
| `n`, `w`, `h` | Nom et dimensions de collision |
| `hp`, `sp`, `c` | Vie de base, vitesse et couleur |
| `soul` | Récompense en âmes libérée à la mort |
| `rng`, `fly`, `heal`, `tp` | Capacités reconnues par la logique de `play()` |
| `drain`, `web`, `boom`, `dive`, `swarm`, `regen` | Variantes de comportement déjà prises en charge |
| `boss` | Modifie le traitement générique d'un ennemi boss |
| `bx` | Envoie vers le système de boss spécialisé |

Exemple : ajouter un ennemi tireur qui lance des projectiles paralysants. À placer après l'initialisation de `ET` et `EAN`, avant l'appel à `newGame()` :

```js
const tisseuse = ET.length;
ET.push({
  n: 'Tisseuse',
  w: 34, h: 22,
  hp: 3, sp: 1,
  c: '#ff4be0',
  soul: 16,
  rng: 1, web: 1
});
EAN[tisseuse] = { sc: 0.8, sx: 1.2 };
Z[5].pool.push(tisseuse);
```

`EAN` donne l'échelle de rendu des ennemis dessinés par `drawE`. `Z[5].pool` est la liste des types que `build(5)` peut faire apparaître ; répéter un indice dans `pool` augmente sa probabilité d'apparition. Les capacités sont des indicateurs, pas un système extensible automatiquement : un nouveau champ n'a d'effet que si le code de mise à jour ou de rendu le lit.

## 2. Boss

Il existe deux formes de boss :

1. Un boss générique est un modèle `ET` ordinaire avec `boss: 1`.
2. Un boss spécialisé a aussi une clé `bx`. Il est relié à une arène par `BZ` et utilise `BD`, `AK`, `bossStep()` et `drawBoss()`.

Exemple complet d'un boss générique, ajouté comme ennemi rare de la zone 5 :

```js
const gardien = ET.length;
ET.push({
  n: 'Gardien du marais',
  w: 70, h: 78,
  hp: 34, sp: 0.5,
  c: '#b58cff', soul: 60,
  boss: 1
});
EAN[gardien] = { sc: 2.5, sx: 1.1 };
Z[4].pool.push(gardien);
```

Il utilise les attaques et le rendu génériques des modèles avec `boss: 1`. Comme il n'est pas associé à `BZ`, il ne déclenche pas d'arène dédiée ni de verrouillage de sortie.

Exemple existant de boss spécialisé : Nguéma. Son modèle est ajouté à `ET`, tandis que ses paramètres d'arène et de phases sont dans `BD` :

```js
ET.push({
  n: 'Nguéma', w: 74, h: 44,
  hp: 1, sp: 1.6,
  c: '#ff3b52', soul: 90,
  boss: 1, bx: 'ngu'
});

BD.ngu = {
  n: 'Nguéma',
  sub: 'Le Dévoreur des Âmes',
  c: '#ff3b52', c2: '#b24bff',
  hp: 55,
  thr: [0.65, 0.3],
  ph: [
    'Phase 1 — La Chasse',
    'Phase 2 — Prédateur éveillé',
    'Phase 3 — Dévoreur des âmes'
  ],
  win: 'Nguéma se dissout. Essence des âmes : pouvoir ancestral chargé, +50 âmes.'
};

BZ[4] = 'ngu'; // L'indice 4 correspond à la zone 5.
```

Pour créer un nouveau boss spécialisé, il faut aussi lui attribuer un indice dans `BXI`, ajouter ses attaques dans `AK` et faire en sorte que `pick()` les sélectionne. `drawBoss()` dessine explicitement les formes Mokélé, Nguéma ou Akuma : un nouveau boss demande donc une branche de dessin. Il faut également lui fournir ses images d'arène et d'introduction (`BAR` et `BIMG`) et ajouter sa récompense dans `bossReward()`. `build()` installe l'arène à partir de `BZ[z]`.

## 3. Personnage joueur

Le joueur est l'objet global `P`, recréé dans `build()`. Il n'existe pas de registre de personnages jouables : ses mouvements et compétences sont codés directement dans `play()`, et son animation est choisie par `heroFrame()` avant d'être dessinée dans `world()`.

Exemple correspondant à son état initial actuel :

```js
P = {
  x: 2 * T, y: 15 * T - 30, w: 18, h: 30,
  vx: 0, vy: 0, face: 1,
  hp: P ? P.hp : 5, max: 5 + BMAX,
  wa: 0, mp: null, splash: 0, ground: false,
  coy: 0, buf: 0, jumps: 0,
  atk: 0, cd: 0, want: 0, swing: 0,
  inv: 0, stun: 0, roll: 0, rcd: 0, ocd: 0,
  lo: -99, thr: 0, thq: false, land: 0, sp: 0, hv: false
};
```

`x`, `y`, `w`, `h` définissent la boîte du joueur ; `hp` et `max` sa vie ; les autres champs enregistrent notamment vitesse, saut, attaque, invulnérabilité, esquive et pouvoir. `P ? P.hp : 5` conserve la vie lors d'une reconstruction de zone. Pour ajouter un personnage jouable, il faudrait rendre cette initialisation paramétrable et adapter les contrôles, compétences et sprites ; changer uniquement son nom ne crée pas un nouveau personnage.

## 4. Zone

`Z[z]` décrit le nom, les couleurs de fond, la palette de décor, les ennemis autorisés, leur quantité, la fréquence des trous et les textes des pierres. Exemple complet actuel, la première zone :

```js
{
  n: 'Zone 1 — La forêt sacrée',
  sky: ['#06130f', '#0f2a1e'],
  tr: ['#081a13', '#0b2218', '#0e2b1e'],
  gr: ['#07161a', '#2aa89b'],
  ac: '#6fe3c1',
  pool: [0, 0, 0],
  cnt: 7,
  gap: 0.3,
  st: [
    'On dit que chaque arbre garde la voix d’un ancêtre. Écoute : la forêt n’a jamais cessé de parler.',
    'Les esprits égarés ne sont pas méchants : ils ont perdu leur chemin. Libère leurs âmes.'
  ]
}
```

Pour ajouter une zone, ajouter une entrée à `Z` **et** une palette à `PAL` au même indice. Il faut aussi ajouter une largeur à la liste `W` dans `build()`, une liste de types de plateformes dans `setPieces()` et une liste d'obstacles dans `obstacles()`. `pool` contient des indices de `ET`, pas des noms. `st` alimente les textes affichés près des pierres. Si la zone a un boss ou un décor particulier, mettre à jour `BZ` et les conditions propres à un numéro de zone dans les fonctions de décor et de rendu.

## 5. Sprite

Le jeu combine plusieurs techniques :

- Les images principales du joueur (`AT`), ses ailes (`WG`) et ses animations de course (`HW`) sont des images intégrées au HTML. `FR` associe un nom d'animation à une découpe `[x, y, largeur, hauteur, ancrageX, ancrageY]` dans `AT`. `heroFrame()` choisit l'animation selon l'état de `P`.
- Les ennemis sont dessinés avec Canvas par `drawE()` ; `EAN` règle leur échelle. Certaines images d'ennemis intégrées peuvent être utilisées via `NE` et `NF`.
- Les sprites de terrain et de décor sont fabriqués sur des canvas hors écran par des fonctions `spr...()` et mémorisés dans `ZG.sp` par `prepZone()`.

Exemple complet d'un petit sprite procédural à enregistrer dans `prepZone()` puis à dessiner :

```js
function sprGem(p) {
  const c = mkc(24, 30);
  const x = C2(c);
  x.fillStyle = p.rune;
  poly(x, [[12, 0], [23, 14], [12, 29], [1, 14]]);
  x.fill();
  return c;
}

// Dans prepZone(z), après la création de `const s = ZGn.sp` :
s.gem = sprGem(p);

// Dans la fonction de dessin appropriée, en coordonnées monde :
ctx.drawImage(ZG.sp.gem, x - cam, y);
```

Pour une nouvelle pose du joueur, il faut en plus fournir une image dans l'atlas, ajouter sa découpe dans `FR` et faire retourner cette clé par `heroFrame()`.

## 6. Collision

Les collisions de terrain utilisent la grille `M`, de tuiles `T × T`. `SOL(c)` considère `#`, `o` et `k` comme solides. `moveX()` et `moveY()` déplacent les entités en résolvant les collisions avec ces cases ; `moveY()` gère aussi les plateformes à sens unique (`=` et `B`) et les pentes (`/` et `\`). `overlap(a, b)` est le test rectangulaire utilisé entre deux objets munis de `x`, `y`, `w`, `h`.

Exemple de collision de danger, sur le modèle de l'épine utilisée par `obstacles()` :

```js
const x = 20 * T;
const sol = 15 * T;
OB.push({
  k: 'thorn',
  x: x + 8, y: sol - 37, w: 48, h: 38,
  spr: 'thorn',
  haz: { x: x + 6, y: sol - 26, w: 52, h: 26 }
});
```

`terrainStep()` teste `overlap(P, o.haz)` pendant la partie et appelle `hurt()` au contact. Il faut ajouter ce type d'obstacle après la remise à zéro de `OB` dans `dress()` (ou l'intégrer à `obstacles()`), sinon la construction du niveau l'effacera. `spr` doit correspondre à un sprite de `ZG.sp` pour que l'obstacle soit également dessiné.

## 7. Objet ramassable

Il n'y a pas de classe générique d'objet. Deux collections servent déjà aux objets ramassables :

- `CR` contient les cristaux placés dans `build()`. Un cristal a des coordonnées monde `{x, y}` ; le joueur le ramasse à moins de 26 pixels, gagne 10 points de jauge et le cristal est retiré.
- `S` contient les âmes libérées par `kill()` ou les caisses. Une âme a `{x, y, vx, vy, t, v}` ; elle attend `t` frames, rejoint ensuite le joueur et appelle `gain(v)` au contact.

Exemple : ajouter un cristal dans `build(z)`, après `CR = []` :

```js
CR.push({ x: 24 * T, y: 10 * T - 16 });
```

Le rendu et le ramassage sont déjà traités par `world()` et `play()`. Pour un nouvel objet d'un autre type (clé, coffre, potion sur la carte), créer sa collection, son rendu et sa détection de collision dans ces mêmes chemins ; `pot` est actuellement un compteur d'inventaire, pas un objet placé dans le monde.

## 8. Dialogue et textes

Le dialogue simple est un message temporaire : `say(texte, durée)` renseigne `toast`, dont la durée est comptée en frames (300 par défaut, pas en millisecondes).

```js
say('Les racines s’ouvrent devant toi.', 240);
```

Les deux textes `Z[z].st` sont associés aux pierres de la zone. `build()` les copie dans `STONES`, puis l'interaction affiche `say(STONES[on].t, 420)`. Exemple pour une nouvelle zone :

```js
st: [
  'La rivière se souvient de ton nom.',
  'Le passage est scellé : cherche les cristaux.'
]
```

Le jeu n'a pas de système de conversations avec des personnages. La séquence `STORY` est différente : elle affiche six découpes de l'image intégrée `CM` et avance avec Entrée, Espace ou le bouton de validation. Pour ajouter du texte interactif, utiliser `say()` ; pour une nouvelle scène illustrée, il faut aussi fournir l'image et mettre à jour `STORY` et la logique de `drawStory()`.
