# Découpe les 2 planches en PNG transparents. Usage : python outils/decouper.py
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage
ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, '..', 'assets', 'decors')
os.makedirs(SORTIE, exist_ok=True)
cat = []
for n in (1, 2):
    im = Image.open(os.path.join(ICI, f'planche{n}.png')).convert('RGBA')
    a = np.array(im)
    transp = (a[..., 3] < 20).mean() > 0.1   # planche déjà transparente ?
    fond = (a[..., 3] < 20) if transp else (a[..., :3].min(axis=2) > 232)
    objets = ndimage.binary_dilation(~fond, iterations=4)
    lab, _ = ndimage.label(objets)
    boites = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if w >= 24 and h >= 24:
            boites.append((i, sl, w, h))
    boites.sort(key=lambda b: (b[1][0].start + b[1][0].stop) / 2)
    lignes, cur = [], []
    for b in boites:
        cy = (b[1][0].start + b[1][0].stop) / 2
        if cur and abs(cy - np.mean([(c[1][0].start + c[1][0].stop) / 2 for c in cur])) > 95:
            lignes.append(cur); cur = []
        cur.append(b)
    lignes.append(cur)
    for r, ligne in enumerate(lignes, 1):
        ligne.sort(key=lambda b: b[1][1].start)
        for c, (i, sl, w, h) in enumerate(ligne, 1):
            crop = a[sl].copy()
            masque = ndimage.binary_dilation(lab[sl] == i, iterations=2)
            if transp:
                crop[..., 3] = np.where(masque, crop[..., 3], 0)
            else:
                blanc = crop[..., :3].min(axis=2) > 232
                crop[..., 3] = np.where(blanc | ~masque, 0, 255).astype(np.uint8)
            nom = f'p{n}_r{r}_c{c}'
            Image.fromarray(crop).save(os.path.join(SORTIE, nom + '.png'))
            cat.append({'id': nom, 'w': int(w), 'h': int(h)})
json.dump(cat, open(os.path.join(SORTIE, 'catalogue.json'), 'w'), indent=1)
print(len(cat), 'éléments')
