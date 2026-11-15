#!/usr/bin/env python3
"""Découpe les planches de boss (Akuma, Nguéma, Mokélé) en sprites PNG transparents.
- 'body' : détourage GrabCut guidé par la couleur du fond de la case (les planches n'ont pas de fond transparent)
- 'fx'   : effets lumineux -> alpha = luminosité (à dessiner en 'lighter'/normal sur fond sombre)
- 'bg'   : arènes / portraits conservés tels quels (JPG)
Usage : python3 tools/slice_bosses.py [boss ...]"""
import os, sys, json
import numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = {
 'akuma': dict(anim=[
    ('idle', [22,398,114,505]), ('marche', [118,398,215,505]), ('course', [222,398,348,505]), ('saut', [348,392,462,505]),
    ('attaque_epee', [412,384,598,505]), ('combo', [572,384,708,505]), ('frappe_lourde', [704,384,882,505]), ('degats', [880,392,968,505]),
    ('mort1', [962,392,1058,505]), ('mort2', [1058,448,1178,508])],
  forms=[('forme1', [8,728,222,948]), ('forme2', [246,724,478,948]), ('forme3', [502,700,775,945])],
  portrait=('portrait', [95,0,650,372]), erase=[[30,30,335,205]],
  fx=[('lame_du_roi', [12,575,190,665]), ('onde_ancestrale', [186,588,315,655]), ('colonnes_feu', [316,548,522,668]), ('ecrasement_royal', [524,552,702,668]),
      ('invocation_ombres', [706,588,918,668]), ('jugement_ancestral', [916,558,1178,672]), ('aura_ancienne', [795,745,915,828]), ('symboles_lumineux', [920,745,1070,828]),
      ('fissures_sol', [1075,745,1225,828]), ('flammes_royales', [795,858,915,968]), ('zone_maudite', [920,858,1070,968]), ('explosion_finale', [1075,858,1225,970])],
  arena=('arene_trone', [1195,408,1525,678]),
  icons=[('coeur_roi', [1278,742,1342,812]), ('pouvoir_ancestral', [1272,805,1332,868]), ('revelation', [1277,872,1332,932])]),
 'nguema': dict(anim=[
    ('idle', [8,452,106,538]), ('marche', [100,448,198,538]), ('course', [198,448,302,538]), ('saut', [300,428,388,538]),
    ('bond', [384,428,502,538]), ('ruee', [494,436,628,538]), ('griffes', [618,428,718,538]), ('rugissement', [708,412,838,538])],
  forms=[('forme1', [8,656,208,842]), ('forme2', [232,646,480,842]), ('forme3', [502,606,782,842])],
  erase=[[20,15,335,250]],
  portrait=('portrait', [125,8,705,352]),
  fx=[('disparition_obscure', [848,412,952,548]), ('onde_des_ames', [944,412,1052,548]), ('double_griffes', [1048,412,1162,548]),
      ('traces_sombres', [805,640,925,748]), ('piliers_ombres', [925,640,1062,752]), ('cercle_ames', [1064,648,1222,748]),
      ('charge_obscure', [805,795,945,888]), ('explosion_spirituelle', [945,772,1078,888]), ('zone_maudite', [1082,768,1218,888])],
  arena=('arene_vallee', [1175,395,1528,628]),
  icons=[('essence_ames', [1262,688,1342,772]), ('amelioration_puissance', [1262,775,1342,852]), ('fragment_narratif', [1262,846,1342,912])]),
 'mokele': dict(anim=[
    ('p1_idle', [14,318,118,422]), ('p1_marche', [122,318,216,422]), ('p1_course', [214,318,332,422]), ('p1_saut', [334,318,438,422]), ('p1_attaque1', [438,308,592,422]),
    ('p1_attaque2', [562,322,728,422]), ('p1_attaque3', [728,312,866,422]), ('p1_degats', [864,316,978,422]), ('p1_mort', [974,372,1138,424]),
    ('p2_idle', [14,498,118,602]), ('p2_marche', [122,502,216,602]), ('p2_course', [214,498,332,602]), ('p2_saut', [334,498,438,602]), ('p2_attaque1', [438,488,592,602]),
    ('p2_attaque2', [562,498,728,602]), ('p2_attaque3', [728,488,866,602]), ('p2_degats', [864,492,978,602]), ('p2_mort', [974,548,1138,604])],
  forms=[('forme1', [8,688,262,938]), ('forme2', [292,678,548,938])],
  portrait=('portrait', [265,0,615,292]),
  fx=[('racines_surgissantes', [570,692,732,798]), ('onde_tellurique', [734,698,946,792]), ('balayage_racines', [948,688,1132,798]),
      ('epines_sol', [570,828,732,962]), ('regeneration', [738,832,942,962]), ('explosion_racinaire', [944,832,1138,962])],
  arena=('arene_sanctuaire', [1150,306,1528,652]),
  icons=[('fragment_racine', [1200,718,1262,778]), ('amelioration_resistance', [1200,782,1262,852]), ('fragment_narratif', [1200,858,1262,918])]),
}

def bgcolor(img):
    h, w = img.shape[:2]; b = np.concatenate([img[:3].reshape(-1, 3), img[-3:].reshape(-1, 3), img[:, :3].reshape(-1, 3), img[:, -3:].reshape(-1, 3)])
    return np.median(b, axis=0)

# règles de fond par planche : pixels « clairement du décor » (bleu nuit, violet sombre, vert sombre)
def rule_akuma(c):
    r, g, b = [c[..., i].astype(np.int32) for i in range(3)]; mx = c.max(axis=2).astype(np.int32); mn = c.min(axis=2).astype(np.int32)
    return ((b - np.maximum(r, g)) > 16) & ((mx - mn) * 100 > 38 * np.maximum(mx, 1)) & (mx < 190)
def rule_nguema(c):
    r, g, b = [c[..., i].astype(np.int32) for i in range(3)]; mx = c.max(axis=2).astype(np.int32)
    violet = (b > r + 12) & (b > g + 30)                       # violet-bleu et lavande (sol, brume)
    magenta = ((r - g) > 30) & ((b - g) > 30) & (mx < 130) & (r < 130)   # fond magenta sombre
    return violet | magenta
def rule_mokele(c):
    r, g, b = [c[..., i].astype(np.int32) for i in range(3)]; mx = c.max(axis=2).astype(np.int32)
    return (g >= r - 4) & (g > b) & (mx < 85)
ICON_FX = {'essence_ames'}
RULES = {'akuma': rule_akuma, 'nguema': rule_nguema, 'mokele': rule_mokele}

def cut_body(rgb, boss='akuma', up=3, erase=()):
    """GrabCut guidé par la couleur de fond + règle de teinte du décor. rgb: HxWx3 uint8 -> RGBA (taille d'origine)."""
    h, w = rgb.shape[:2]; big = cv2.resize(rgb, (w * up, h * up), interpolation=cv2.INTER_CUBIC); H, W = big.shape[:2]
    bg = bgcolor(big).astype(np.float32); lab = cv2.cvtColor(big, cv2.COLOR_RGB2LAB).astype(np.float32); bl = cv2.cvtColor(np.uint8([[bg]]), cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32)
    dist = cv2.GaussianBlur(np.linalg.norm(lab - bl, axis=2), (0, 0), 1.5)
    rule = RULES[boss](cv2.GaussianBlur(big, (0, 0), 1.2)); rule = cv2.erode(rule.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    ers = np.zeros((H, W), bool)
    for (ex0, ey0, ex1, ey1) in erase: ers[max(0, ey0) * up:max(0, ey1) * up, max(0, ex0) * up:max(0, ex1) * up] = True      # textes de la planche
    m = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
    m[dist > 22] = cv2.GC_PR_FGD; m[dist > 60] = cv2.GC_FGD; m[dist < 9] = cv2.GC_BGD; m[rule] = cv2.GC_BGD
    # les pixels chauds/lumineux restent du sprite même si la règle les a pris
    warm = (big[..., 0].astype(int) - big[..., 2].astype(int) > 30) & (big.max(axis=2) > 120); m[warm & (m == cv2.GC_BGD)] = cv2.GC_PR_FGD
    yy, xx = np.mgrid[0:H, 0:W]; core = (((xx - .5 * W) / (.17 * W)) ** 2 + ((yy - .58 * H) / (.27 * H)) ** 2) < 1     # cœur du corps = sprite
    m[core & ~rule] = cv2.GC_FGD; m[ers] = cv2.GC_BGD
    if not ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).any(): m[H // 4:3 * H // 4, W // 4:3 * W // 4] = cv2.GC_PR_FGD
    bw = 5 * up; m[:bw] = m[-bw:] = cv2.GC_BGD; m[:, :bw] = m[:, -bw:] = cv2.GC_BGD
    cv2.grabCut(cv2.cvtColor(big, cv2.COLOR_RGB2BGR), m, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
    fg = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n > 1:
        keep = np.zeros_like(fg); big_area = st[1:, cv2.CC_STAT_AREA].max()
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] >= max(40 * up * up, 0.05 * big_area): keep[lbl == i] = 1
        fg = keep
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)); cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(fg); cv2.drawContours(filled, cnts, -1, 1, -1); fg = cv2.erode(filled, np.ones((3, 3), np.uint8))
    fg[rule | ers] = 0                                           # le décor visible entre les jambes reste transparent
    a = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 1.6 * up / 2); a = np.clip((a - .25) / .5, 0, 1)
    return cv2.resize(np.dstack([big, (a * 255).astype(np.uint8)]), (w, h), interpolation=cv2.INTER_AREA)

def cut_card(rgb):
    """Forme/transformation : l'illustration est peinte avec son décor de flammes -> carte au bord fondu (super-ellipse)."""
    h, w = rgb.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]; dx = np.abs((xx - w / 2) / (w / 2)); dy = np.abs((yy - h / 2) / (h / 2)); d = (dx ** 3 + dy ** 3) ** (1 / 3)
    a = np.clip((1.0 - d) / 0.22, 0, 1); a = a * a * (3 - 2 * a); return np.dstack([rgb, (a * 255).astype(np.uint8)])

def cut_fx(rgb, gain=1.25, floor=22):
    """alpha = luminosité (au-dessus du fond), couleur dé-prémultipliée : se dessine en 'lighter' ou normal."""
    f = rgb.astype(np.float32); bg = bgcolor(rgb).astype(np.float32); d = np.clip(f - bg * 0.9, 0, 255); mx = d.max(axis=2)
    a = np.clip((mx - floor) / (200 - floor) * gain, 0, 1); col = np.where(a[..., None] > 0.02, np.clip(f / np.maximum(a[..., None], .15), 0, 255), 0)
    col = np.minimum(col, 255); h, w = a.shape; fade = np.ones((h, w), np.float32)
    e = 4; fade[:e] *= np.linspace(0, 1, e)[:, None]; fade[-e:] *= np.linspace(1, 0, e)[:, None]; fade[:, :e] *= np.linspace(0, 1, e)[None]; fade[:, -e:] *= np.linspace(1, 0, e)[None]
    return np.dstack([col, a * fade * 255]).astype(np.uint8)

def trim(rgba, pad=3):
    ys, xs = np.where(rgba[..., 3] > 14)
    if len(xs) == 0: return rgba, (0, 0)
    x0, x1, y0, y1 = max(0, xs.min() - pad), min(rgba.shape[1], xs.max() + 1 + pad), max(0, ys.min() - pad), min(rgba.shape[0], ys.max() + 1 + pad)
    return rgba[y0:y1, x0:x1], (x0, y0)

def upscale(rgba, k):
    """agrandit (Lanczos) + léger accent des contours : les sprites d'origine sont petits (~100 px)."""
    if k == 1: return rgba
    im = Image.fromarray(rgba).resize((rgba.shape[1] * k, rgba.shape[0] * k), Image.LANCZOS)
    from PIL import ImageFilter
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.4, percent=70, threshold=2)); a = im.getchannel('A'); rgb.putalpha(a); return np.asarray(rgb)

def anchor(rgba):
    a = rgba[..., 3] > 120; ys, xs = np.where(a)
    if len(xs) == 0: return rgba.shape[1] / 2, rgba.shape[0]
    low = ys > np.percentile(ys, 70); return float(np.median(xs[low])), float(ys.max())

def run(boss):
    sheet = np.asarray(Image.open(f'{ROOT}/assets/source/{boss}.png').convert('RGB')); out = f'{ROOT}/assets/boss/{boss}'; os.makedirs(out, exist_ok=True); man = {}
    def put(name, rgba, kind, up, extra=None):
        rgba, _ = trim(rgba); rgba = upscale(rgba, up); ax, ay = anchor(rgba)
        Image.fromarray(rgba).save(f'{out}/{name}.png', optimize=True)
        man[name] = dict(file=f'assets/boss/{boss}/{name}.png', w=int(rgba.shape[1]), h=int(rgba.shape[0]), ax=round(ax, 1), ay=round(ay, 1), kind=kind, up=up, **(extra or {}))
    cfg = R[boss]
    for name, (x0, y0, x1, y1) in cfg['anim']: put(name, cut_body(sheet[y0:y1, x0:x1], boss), 'body', 2)
    for name, (x0, y0, x1, y1) in cfg['forms']: put(name, cut_card(sheet[y0:y1, x0:x1]), 'card', 1)
    n, (x0, y0, x1, y1) = cfg['portrait']; er = [(a - x0, b - y0, c - x0, d - y0) for a, b, c, d in cfg.get('erase', [])]; put(n, cut_body(sheet[y0:y1, x0:x1], boss, erase=er), 'body', 1)
    for name, (x0, y0, x1, y1) in cfg['fx']: put(name, cut_fx(sheet[y0:y1, x0:x1]), 'fx', 2)
    for name, (x0, y0, x1, y1) in cfg['icons']: put(name, cut_fx(sheet[y0:y1, x0:x1], gain=1.6, floor=30) if name in ICON_FX else cut_body(sheet[y0:y1, x0:x1], boss), 'icon', 2)
    n, (x0, y0, x1, y1) = cfg['arena']; Image.fromarray(sheet[y0:y1, x0:x1]).save(f'{out}/{n}.jpg', quality=92); man[n] = dict(file=f'assets/boss/{boss}/{n}.jpg', w=x1 - x0, h=y1 - y0, kind='arena')
    json.dump(man, open(f'{out}/manifest.json', 'w'), indent=1); print(boss, len(man), 'éléments')
    return man

if __name__ == '__main__':
    allm = {b: run(b) for b in (sys.argv[1:] or R)}
