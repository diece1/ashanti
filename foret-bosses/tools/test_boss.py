#!/usr/bin/env python3
"""Test fonctionnel Playwright : charge la démo en http, vérifie chaque boss (anims, attaques, spéciaux, phases, mort) et produit des captures."""
import sys, os, threading, http.server, socketserver, functools, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/fbtest'; os.makedirs(OUT, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = []
def check(c, m):
    print(('OK  ' if c else 'FAIL'), m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1500, 'height': 900})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    for boss in ('akuma', 'nguema', 'mokele'):
        pg.goto(f'http://127.0.0.1:{port}/index.html?boss={boss}'); pg.wait_for_function('window.boss && window.boss.def')
        pg.evaluate('boss.autoAI=false;document.getElementById("ai").click()')
        pg.wait_for_timeout(500)
        d = pg.evaluate('({n:boss.def.nom,a:boss.def.attaques.length,s:boss.def.speciaux.length,ph:boss.def.phases.length})')
        miss = pg.evaluate('Object.entries(boss.sp).filter(([k,v])=>!v.img).map(x=>x[0])')
        check(not miss, f'{boss}: toutes les images chargées {miss}')
        pg.screenshot(path=f'{OUT}/{boss}_idle.png')
        # attaques
        for i in range(d['a']):
            pg.evaluate(f'boss.cur=null;boss.attack({i})'); hits = pg.evaluate('(()=>{window._h=0;boss.on("hit",()=>window._h++);return 0})()')
            pg.wait_for_timeout(450); pg.screenshot(path=f'{OUT}/{boss}_atk{i+1}.png'); pg.wait_for_timeout(1300)
            check(pg.evaluate('window._h')>=1, f'{boss}: attaque {i+1} émet « hit »'); pg.evaluate('boss.off && 0; boss.ev.hit=[]')
        # spéciaux
        sp = pg.evaluate('boss.def.speciaux.map(s=>s.id)')
        for s in sp:
            pg.evaluate(f'boss.cur=null;boss.cd={{}};boss.special("{s}",true)'); pg.wait_for_timeout(950)
            n = pg.evaluate('boss.fx.length'); pg.screenshot(path=f'{OUT}/{boss}_sp_{s}.png'); pg.wait_for_timeout(1900)
            check(n >= 1, f'{boss}: spécial {s} produit un effet')
        # mouvements
        for m in ('walk(-1)', 'walk(-1,true)', 'jump()', 'roar()'):
            pg.evaluate(f'boss.cur=null;boss.stop();boss.{m}'); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/{boss}_{m.split("(")[0]}.png'); pg.wait_for_timeout(1500)
            pg.evaluate('boss.cur=null;boss.stop()')
        # phases par PV
        pg.evaluate('boss.revive();window._ph=[];boss.on("phase",e=>window._ph.push(e.index))')
        for th in [p_ for p_ in pg.evaluate('boss.def.phases.map(p=>p.de)') if p_ < 1]:
            pg.evaluate(f'boss.setHp(boss.maxHp*{th-.01})'); pg.wait_for_timeout(1400); pg.screenshot(path=f'{OUT}/{boss}_phase_{th}.png'); pg.wait_for_timeout(1700)
        check(pg.evaluate('window._ph').__len__() == d['ph'] - 1, f'{boss}: {d["ph"]-1} changements de phase {pg.evaluate("window._ph")}')
        # mort
        pg.evaluate('boss.cur=null;boss.setHp(0)'); pg.wait_for_timeout(1000); pg.screenshot(path=f'{OUT}/{boss}_death1.png'); pg.wait_for_timeout(1800)
        check(pg.evaluate('!boss.alive && boss.dissolve>=1'), f'{boss}: mort + dissolution'); pg.screenshot(path=f'{OUT}/{boss}_death2.png')
        pg.evaluate('boss.revive()'); check(pg.evaluate('boss.alive&&boss.hp===boss.maxHp'), f'{boss}: revive')
        # IA
        pg.evaluate('document.getElementById("ai").click()'); pg.wait_for_timeout(6000)
        check(pg.evaluate('Math.abs(boss.x-900)>5 || boss.state!=="idle"'), f'{boss}: IA active'); pg.screenshot(path=f'{OUT}/{boss}_ai.png')
    check(not errs, f'aucune erreur console {errs[:3]}')
    b.close()
srv.shutdown()
print('\nRÉSULTAT:', 'ÉCHEC ' + str(len(fails)) if fails else 'TOUT PASSE'); sys.exit(1 if fails else 0)
