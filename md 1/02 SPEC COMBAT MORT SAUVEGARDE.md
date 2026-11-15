# Spécification — combat, mort, autels, sauvegarde

Valeurs en images (frames) à 60 par seconde. Ce sont des points de départ à régler en jouant. Les noms de variables viennent de GUIDE_MODULES.md ; vérifier leur existence dans le code avant d'écrire.

## 1. Combat rapide et fluide (style Hollow Knight)
Principe : frapper remplit la jauge d'âmes ; la jauge se convertit en soin ou en pouvoir ancestral ; être touché coûte un cœur et ouvre une courte invulnérabilité.

| Mécanique | Règle | Champs `P` |
|---|---|---|
| Attaque de base | 1 dégât, rechargement 18 images, chaîne de 3 coups (le 3e repousse l'ennemi) | `atk`, `cd`, `want`, `swing` |
| Attaque puissante | Maintenir 30 images, 2 dégâts, casse les gardes | `atk`, `cd` |
| Attaque vers le bas | En l'air, toucher un ennemi ou une épine donne un rebond (nouveau saut) | `vy`, `jumps` |
| Esquive | 14 images d'invulnérabilité, rechargement 40, au sol et en l'air | `roll`, `rcd`, `inv` |
| Jauge d'âmes | +10 par coup au but (comme un cristal), maximum 100 | jauge existante |
| Soin | Maintenir 45 images, coûte 30, rend 1 cœur, interrompu si touché | `hp`, `max` |
| Pouvoir ancestral | Coûte 30, projectile | `thr`, `thq` |
| Dégâts subis | 1 cœur (2 pour un coup lourd de boss), 90 images d'invulnérabilité, recul | `inv`, `stun` |

Ennemis : action annoncée 30–40 images avant de toucher, recul quand on les frappe, 2 à 4 PV pour les ennemis ordinaires.
Boss : pas de sursaut quand on les frappe ; +10 de jauge par coup au but ; rythme attaque, pause de 40 images, attaque ; 3 à 5 attaques lisibles par phase ; combat de 90 à 150 s. PV à ajuster dans `BD` (Nguéma : 55).

## 2. Mort et Écho d'âme
- Mort quand `P.hp <= 0` ou chute dans un trou.
- Écho à la dernière position sûre au sol, avec 100 % des âmes. Un seul écho à la fois.
- Réapparition à l'autel, vie au maximum (`5 + BMAX`), jauge vide, `pot` rechargé.
- Toucher l'écho rend les âmes ; mourir avant de le reprendre efface l'ancien écho (option : ne perdre que 50 %).
- Boss : l'écho est placé à l'entrée de l'arène, jamais dedans.
- Message `say()` à la mort et à la récupération. Le `P = {... hp: P ? P.hp : 5 ...}` de `build()` conserve la vie : la remettre au maximum à la réapparition.

## 3. Autels ancestraux
Objet interactif (comme les pierres `STONES`). Interaction : soin complet, `pot` rechargé, ennemis normaux réapparaissent, sauvegarde, point de réapparition. Un autel de départ par zone et un juste avant l'arène du boss.

## 4. Sauvegarde
Trois emplacements dans `localStorage`, `try/catch` à chaque accès (le stockage peut être bloqué). Sauvegarde auto : à chaque autel, fin de zone, victoire sur un boss.

```json
{ "version": 1, "zone": 0, "autel": 0, "ames": 0, "hp": 5, "max": 5, "pot": 0,
  "boss": ["ngu"], "ameliorations": {"puissance":0,"resistance":0,"pouvoir":false},
  "echo": {"zone":0,"x":0,"y":0,"ames":0}, "fragments": [], "temps": 0 }
```
Chargement : `build(zone)` puis placer le joueur sur l'autel. Menu : Continuer / Nouvelle partie.

## 5. Boss : progression et retry
Ordre conseillé : Mokélé, Nguéma (zone 5, `BZ[4]`), Akuma (final). Retry : retour à l'autel d'avant l'arène, PV du boss remis à zéro, intro sautée dès la 2e tentative, arène verrouillée pendant le combat, `bossReward()` puis sauvegarde à la victoire.
