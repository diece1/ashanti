# Menu Forêt des Ancêtres — intégration

Deux façons de l'intégrer (le jeu étant un seul `index.html`, la 2e est la plus simple) :

**A. Fichiers séparés** : copier `foret-menu.css` et `foret-menu.js` à côté de `index.html`, puis dans `<head>` :
`<link rel="stylesheet" href="foret-menu.css">` et, avant ton script de jeu : `<script src="foret-menu.js"></script>`.

**B. Tout dans index.html** : copier le contenu de `foret-menu.paste.html` (un bloc `<style>` + un bloc `<script>`) juste avant ton propre `<script>` de jeu.

Tout est préfixé (`#fdm-root`, `.fdm-*`, `window.FDAMenu`) : aucune collision avec les variables du jeu (`P`, `E`, `S`, `T`, `H`…). Le menu crée lui-même son DOM.

## Brancher le menu au jeu
```js
FDAMenu.init({
  title: 'Forêt des Ancêtres', subtitle: 'Les Âmes Perdues', version: 'v0.1',
  hasSave: () => /* true s'il y a une sauvegarde */,
  continueInfo: () => 'Zone 2 · 1 h 12',
  slots: () => [ {zone:'Zone 2 — …', temps:4320, hp:3, max:5, ames:240, boss:[true,false,false]}, null, null ],
  getList: kind => /* 'bestiary' | 'memories' | 'bossmode' → [{id,title,text,img,locked}] */ [],
  onAction: (action, data, hide) => {
    switch (action) {
      case 'continue':  /* charger la dernière sauvegarde et lancer le jeu */ break;
      case 'new':       /* data.slot = 0..2 : nouvelle partie dans cet emplacement */ break;
      case 'load':      /* data.slot : charger cet emplacement */ break;
      case 'boss':      /* data.id = 'mokele'|'nguema'|'akuma' : combat d'entraînement */ break;
      case 'resume':    /* reprendre le jeu (pause levée) */ break;
      case 'respawn':   /* après la mort : réapparaître à l'autel */ break;
      case 'altar':     /* depuis la pause : retour à l'autel */ break;
      case 'continue-game': /* après la victoire sur un boss */ break;
      case 'quit':      /* retour à l'écran titre */ break;
    }
  },
  onOption: (clé, valeur) => { /* 'music','sfx' (0-100) · 'shake','particles','subs','lefty' (bool) · 'touch' (50-100) */ },
  onSound: type => { /* 'hover' | 'click' | 'back' : joue tes sons */ },
  onShow: () => { /* mettre le jeu en pause */ }, onHide: () => { /* relancer le jeu si besoin */ }
});
```
## Afficher les écrans
| Appel | Quand |
|---|---|
| `FDAMenu.show('main')` | au lancement |
| `FDAMenu.show('pause')` | touche Échap / bouton pause en jeu |
| `FDAMenu.show('death', {ames: 240, msg: '…'})` | quand `P.hp <= 0` (affiche l'Écho d'âme) |
| `FDAMenu.show('victory', {title, boss, rewards:[{nom, img}], stats:[['Temps','2:14'],['Tentatives','3']]})` | après `bossReward()` |
| `FDAMenu.hide()` / `FDAMenu.back()` / `FDAMenu.isOpen()` | contrôle |

Les options sont enregistrées dans `localStorage` (`fda.options`) ; lis-les avec `FDAMenu.opts` (ex. `FDAMenu.opts.shake` pour activer la secousse d'écran).
Pendant que le menu est ouvert il capte Échap, flèches et Entrée : teste `if (FDAMenu.isOpen()) return;` au début de ton `play()` pour mettre le jeu en pause.

## Personnaliser le style
Couleurs et polices en haut de `foret-menu.css` (variables `--fdm-gold`, `--fdm-ember`, `--fdm-teal`, `--fdm-font`…). Tailles : tout dépend de `--u` (suit la plus petite dimension de l'écran), donc le menu s'adapte au téléphone en paysage. En portrait, une invite demande de tourner l'appareil.
