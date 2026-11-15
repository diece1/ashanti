#!/usr/bin/env python3
"""Fusionne les manifestes des 3 boss dans boss-data.js (global FB_ASSETS) — chargé par <script>, donc compatible file://."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = {b: json.load(open(f'{ROOT}/assets/boss/{b}/manifest.json')) for b in ('akuma', 'nguema', 'mokele')}
loic = {'hd_debout': dict(file='assets/demo/loic_hd_debout.png', ax=0, ay=0), 'attaque_puissante': dict(file='assets/demo/loic_attaque_puissante.png'), 'esquive': dict(file='assets/demo/loic_esquive.png'), 'touche': dict(file='assets/demo/loic_touche.png'), 'descente': dict(file='assets/demo/loic_descente.png')}
open(f'{ROOT}/src/boss-data.js', 'w').write('/* généré par tools/build_boss_data.py — ne pas éditer */\nwindow.FB_ASSETS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('boss-data.js', {b: len(v) for b, v in data.items()})
