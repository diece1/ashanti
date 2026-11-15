/* FORÊT DES ANCÊTRES — menu (écrans, options, sauvegardes, pause, mort, victoire)
 * Autonome : construit son propre DOM dans #fdm-root, ne touche à rien d'autre dans la page.
 * API : FDAMenu.init(config) · FDAMenu.show(écran, données) · FDAMenu.hide() · FDAMenu.back()
 *       FDAMenu.opts (options courantes) · FDAMenu.isOpen()
 * Écrans : main, slots, options, list, help, pause, death, victory
 */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = p => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
  const ICON = {
    play: svg('<path d="M7 4.5v15l12-7.5z"/>'), plus: svg('<path d="M12 5v14M5 12h14"/>'),
    folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    skull: svg('<path d="M12 3a8 8 0 0 0-8 8c0 2.6 1.3 4.2 3 5.2V20h10v-3.8c1.7-1 3-2.6 3-5.2a8 8 0 0 0-8-8z"/><circle cx="9" cy="11.5" r="1.4"/><circle cx="15" cy="11.5" r="1.4"/><path d="M10 20v-2M14 20v-2"/>'),
    book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13"/><path d="M9 8h6"/>'),
    scroll: svg('<path d="M7 4h11a2 2 0 0 1 2 2v1H9v11a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M9 7v11a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4M12 17h.01"/>'),
    home: svg('<path d="M4 11l8-7 8 7M6 10v10h12V10"/>'), redo: svg('<path d="M20 6v5h-5M4 18v-5h5"/><path d="M5.5 9A8 8 0 0 1 20 11M18.5 15A8 8 0 0 1 4 13"/>'),
    altar: svg('<path d="M12 3c2.5 3 4 4.5 4 7a4 4 0 0 1-8 0c0-2.5 1.5-4 4-7zM6 21h12M8 21v-3h8v3"/>')
  };
  const DEF = {
    title: 'Forêt des Ancêtres', subtitle: 'Les Âmes Perdues', version: '', fx: true,
    hasSave: () => false,                 // () => bool : y a-t-il une partie à continuer ?
    continueInfo: () => '',               // () => 'Zone 2 · 1 h 12' (sous-titre du bouton Continuer)
    slots: () => [null, null, null],      // () => [ {zone, temps(s), hp, max, ames, boss:[bool,bool,bool]} | null ×3 ]
    getList: () => [],                    // (kind: 'bestiary'|'memories'|'bossmode') => [{id,title,text,img,locked}]
    onAction: () => { }, onOption: () => { }, onSound: () => { }, onShow: () => { }, onHide: () => { },
    help: [['← →  /  Q D', 'Se déplacer'], ['Espace  /  W', 'Sauter'], ['J  /  Z', 'Attaquer (maintenir : attaque puissante)'], ['K  /  X', 'Esquiver'], ['H', 'Se soigner (maintenir)'], ['Échap', 'Pause']]
  };
  const OPT_DEF = { music: 70, sfx: 80, shake: true, particles: true, subs: true, lefty: false, touch: 100 };
  let cfg, root, stack = [], opts = Object.assign({}, OPT_DEF), pendingSlot = null, raf = 0, fxState = null;

  function loadOpts() { try { Object.assign(opts, JSON.parse(localStorage.getItem('fda.options') || '{}')); } catch (e) { } }
  function saveOpts() { try { localStorage.setItem('fda.options', JSON.stringify(opts)); } catch (e) { } }
  const fmtT = s => { s = Math.max(0, s | 0); const h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0; return h ? h + ' h ' + String(m).padStart(2, '0') : m + ' min'; };
  const btn = (act, label, o) => { o = o || {}; return '<button class="fdm-btn ' + (o.cls || '') + '" data-act="' + act + '"' + (o.dis ? ' disabled' : '') + '>' +
    (o.icon ? '<span class="fdm-ico">' + ICON[o.icon] + '</span>' : '') + '<span class="fdm-t"><span>' + esc(label) + '</span>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span></button>'; };
  const title = () => '<header class="fdm-title"><h1>' + esc(cfg.title) + '</h1><p>' + esc(cfg.subtitle) + '</p><div class="fdm-orn"><i></i><b></b><i></i></div></header>';

  /* ───── rendu des écrans ───── */
  const R = {
    main() {
      const has = cfg.hasSave();
      return title() + '<nav class="fdm-list">' +
        btn('continue', 'Continuer', { cls: 'fdm-main', icon: 'play', dis: !has, sub: has ? cfg.continueInfo() : 'Aucune sauvegarde' }) +
        btn('go:slots:new', 'Nouvelle partie', { icon: 'plus' }) + btn('go:slots:load', 'Charger', { icon: 'folder', dis: !cfg.slots().some(Boolean) }) + '</nav>' +
        '<nav class="fdm-list fdm-two">' + btn('list:bossmode', 'Mode boss', { icon: 'skull' }) + btn('list:bestiary', 'Bestiaire', { icon: 'book' }) +
        btn('list:memories', 'Mémoires', { icon: 'scroll' }) + btn('go:options', 'Options', { icon: 'gear' }) + '</nav>' +
        '<nav class="fdm-list">' + btn('go:help', 'Aide', { cls: 'fdm-back', icon: 'help' }) + '</nav>' + (cfg.version ? '<div class="fdm-ver">' + esc(cfg.version) + '</div>' : '');
    },
    slots(d) {
      const mode = d.mode, sl = cfg.slots();
      const cards = [0, 1, 2].map(i => { const s = sl[i], dis = mode === 'load' && !s;
        if (!s) return '<button class="fdm-slot" data-act="slot:' + i + '"' + (dis ? ' disabled' : '') + '><span class="fdm-n">EMPLACEMENT ' + (i + 1) + '</span><span class="fdm-empty">Vide</span></button>';
        const hearts = Array.from({ length: s.max || 5 }, (_, k) => '<i class="' + (k < s.hp ? '' : 'fdm-lost') + '"></i>').join('');
        const bos = (s.boss || [false, false, false]).map(b => '<i class="' + (b ? 'fdm-won' : '') + '"></i>').join('');
        return '<button class="fdm-slot" data-act="slot:' + i + '"><span class="fdm-n">EMPLACEMENT ' + (i + 1) + '</span><span class="fdm-z">' + esc(s.zone) + '</span>' +
          '<span class="fdm-hearts">' + hearts + '</span><span class="fdm-stat">Âmes <b>' + (s.ames | 0) + '</b></span><span class="fdm-stat">Temps <b>' + fmtT(s.temps) + '</b></span>' +
          '<span class="fdm-stat">Boss <span class="fdm-bosses">' + bos + '</span></span></button>'; }).join('');
      return '<div class="fdm-panel"><h2>' + (mode === 'new' ? 'Nouvelle partie' : 'Charger') + '</h2><p class="fdm-lead">' + (mode === 'new' ? 'Choisis un emplacement.' : 'Reprends une aventure.') + '</p><div class="fdm-slots">' + cards + '</div><div class="fdm-foot">' + btn('back', 'Retour', { cls: 'fdm-back' }) + '</div></div>';
    },
    options() {
      const rg = (k, l, sub) => '<div class="fdm-opt"><label for="fdm-o-' + k + '">' + l + (sub ? '<small>' + sub + '</small>' : '') + '</label><input id="fdm-o-' + k + '" type="range" min="0" max="100" value="' + opts[k] + '" data-opt="' + k + '"></div>';
      const sw = (k, l, sub) => '<div class="fdm-opt"><label>' + l + (sub ? '<small>' + sub + '</small>' : '') + '</label><button class="fdm-sw" role="switch" aria-checked="' + !!opts[k] + '" data-sw="' + k + '" aria-label="' + esc(l) + '"></button></div>';
      return '<div class="fdm-panel"><h2>Options</h2><div class="fdm-grp">Son</div>' + rg('music', 'Musique') + rg('sfx', 'Effets sonores') +
        '<div class="fdm-grp">Affichage</div>' + sw('shake', 'Secousse d\'écran', 'Coups, impacts de boss') + sw('particles', 'Particules', 'Désactiver sur un téléphone lent') +
        '<div class="fdm-grp">Jeu</div>' + sw('subs', 'Sous-titres') + '<div class="fdm-grp">Commandes tactiles</div>' + sw('lefty', 'Mode gaucher', 'Inverse les deux côtés') + rg('touch', 'Taille des boutons') +
        '<div class="fdm-foot">' + btn('back', 'Retour', { cls: 'fdm-back' }) + '</div></div>';
    },
    list(d) {
      const items = cfg.getList(d.kind) || [];
      const body = items.length ? items.map(it => '<button class="fdm-item ' + (it.locked ? 'fdm-locked' : '') + '" data-act="item:' + d.kind + ':' + esc(it.id) + '"' + (it.locked ? ' disabled' : '') + '>' +
        (it.img ? '<img src="' + esc(it.img) + '" alt="">' : '') + '<span><h3>' + esc(it.locked ? '???' : it.title) + '</h3><p>' + esc(it.locked ? 'Pas encore découvert.' : it.text) + '</p></span></button>').join('') : '<div class="fdm-none">Rien à afficher pour l\'instant.</div>';
      const T = { bossmode: 'Mode boss', bestiary: 'Bestiaire', memories: 'Mémoires' }[d.kind] || 'Liste';
      return '<div class="fdm-panel"><h2>' + T + '</h2><div class="fdm-items">' + body + '</div><div class="fdm-foot">' + btn('back', 'Retour', { cls: 'fdm-back' }) + '</div></div>';
    },
    help() {
      return '<div class="fdm-panel"><h2>Aide</h2><div class="fdm-keys">' + cfg.help.map(r => '<span><kbd>' + esc(r[0]) + '</kbd></span><span>' + esc(r[1]) + '</span>').join('') +
        '</div><div class="fdm-foot">' + btn('back', 'Retour', { cls: 'fdm-back' }) + '</div></div>';
    },
    pause() {
      return '<header class="fdm-title"><h1 style="font-size:calc(var(--u)*5)">Pause</h1><div class="fdm-orn"><i></i><b></b><i></i></div></header><nav class="fdm-list">' +
        btn('resume', 'Reprendre', { cls: 'fdm-main', icon: 'play' }) + btn('go:options', 'Options', { icon: 'gear' }) + btn('altar', 'Retour à l\'autel', { icon: 'altar' }) +
        btn('go:help', 'Aide', { icon: 'help' }) + btn('quit', 'Menu principal', { icon: 'home', cls: 'fdm-danger' }) + '</nav>';
    },
    death(d) {
      return '<div class="fdm-death" style="display:contents"><h2 class="fdm-big">Tu es tombé</h2><p class="fdm-msg">' + esc(d.msg || 'Les ancêtres gardent ton âme. Reviens la chercher.') + '</p>' +
        (d.ames ? '<div class="fdm-echo">Écho d\'âme · ' + (d.ames | 0) + ' âmes à récupérer</div>' : '') + '<nav class="fdm-list">' + btn('respawn', 'Retourner à l\'autel', { cls: 'fdm-main', icon: 'altar' }) + btn('quit', 'Menu principal', { icon: 'home', cls: 'fdm-back' }) + '</nav></div>';
    },
    victory(d) {
      const rw = (d.rewards || []).map(r => '<div class="fdm-rw">' + (r.img ? '<img src="' + esc(r.img) + '" alt="">' : '') + '<span>' + esc(r.nom || r.title) + '</span></div>').join('');
      const st = (d.stats || []).map(s => '<div><b>' + esc(s[1]) + '</b>' + esc(s[0]) + '</div>').join('');
      return '<div class="fdm-victory" style="display:contents"><h2 class="fdm-big">' + esc(d.title || 'Boss vaincu') + '</h2>' + (d.boss ? '<p class="fdm-msg">' + esc(d.boss) + '</p>' : '') +
        '<div class="fdm-rewards">' + rw + '</div><div class="fdm-sbar">' + st + '</div><nav class="fdm-list">' + btn('continue-game', 'Continuer l\'aventure', { cls: 'fdm-main', icon: 'play' }) + '</nav></div>';
    }
  };

  /* ───── navigation ───── */
  function render(name, data) {
    const s = $('.fdm-screen[data-s="' + name + '"]', root); if (!s) return;
    s.innerHTML = R[name](data || {}); root.setAttribute('data-screen', name); root._data = data || {};
    $$('input[type=range]', s).forEach(i => i.style.setProperty('--v', i.value + '%'));
    focusFirst();
  }
  function focusFirst() { const b = $$('.fdm-screen[data-s="' + root.getAttribute('data-screen') + '"] button:not([disabled])', root)[0]; if (b && !('ontouchstart' in window)) b.focus({ preventScroll: true }); }
  function show(name, data) {
    if (!root) throw new Error('FDAMenu.init() n\'a pas été appelé');
    const top = stack[stack.length - 1]; if (!top || top.name !== name || name === 'list') stack.push({ name, data: data || {} });
    root.hidden = false; void root.offsetWidth; root.classList.add('fdm-on'); render(name, data); startFx(); cfg.onShow(name, data);
  }
  function back() {
    if (stack.length > 1) { stack.pop(); const t = stack[stack.length - 1]; render(t.name, t.data); cfg.onSound('back'); }
    else if (stack[0] && stack[0].name === 'pause') act('resume');
  }
  function hide() { stack = []; root.classList.remove('fdm-on'); stopFx(); cfg.onHide(); setTimeout(() => { if (!root.classList.contains('fdm-on')) root.hidden = true; }, 380); }
  const isOpen = () => !!root && root.classList.contains('fdm-on');

  function act(a, el) {
    cfg.onSound('click'); const p = a.split(':');
    if (p[0] === 'back') return back();
    if (p[0] === 'go') return show(p[1], { mode: p[2] });
    if (p[0] === 'list') return show('list', { kind: p[1] });
    if (p[0] === 'slot') return slot(+p[1]);
    if (p[0] === 'item') return cfg.onAction(p[1] === 'bossmode' ? 'boss' : 'item', { kind: p[1], id: p.slice(2).join(':') }, hide);
    if (a === 'continue' || a === 'resume' || a === 'continue-game') { hide(); return cfg.onAction(a, {}); }
    if (a === 'quit') { hide(); return cfg.onAction('quit', {}); }
    cfg.onAction(a, root._data || {}, hide);   // respawn, altar… (le jeu décide ; 3e argument = fonction hide)
    if (a === 'respawn' || a === 'altar') hide();
  }
  function slot(i) {
    const d = root._data, used = !!cfg.slots()[i];
    if (d.mode === 'load') { if (used) { hide(); cfg.onAction('load', { slot: i }); } return; }
    if (used) { pendingSlot = i; return $('.fdm-modal', root).classList.add('fdm-on'), ($('.fdm-modal [data-cf="no"]', root).focus()); }
    hide(); cfg.onAction('new', { slot: i });
  }

  /* ───── effets : forêt, brume, lucioles (canvas) ───── */
  function startFx() {
    if (!cfg.fx || raf || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('.fdm-fx', root), x = c.getContext('2d'); let W = 0, H = 0, T0 = performance.now();
    const trees = [], fl = [];
    function size() { const r = devicePixelRatio > 1.5 ? 1.5 : devicePixelRatio || 1; W = c.width = Math.ceil(innerWidth * r * .75); H = c.height = Math.ceil(innerHeight * r * .75); trees.length = 0;
      for (let l = 0; l < 3; l++) for (let i = 0, n = 7 + l * 3; i < n; i++) trees.push({ l, x: (i + Math.random() * .8) / n * W, w: (7 + l * 5 + Math.random() * 9) * W / 960, top: Math.random() * H * .2 }); }
    size(); addEventListener('resize', size);
    for (let i = 0; i < 38; i++) fl.push({ x: Math.random(), y: .3 + Math.random() * .65, p: Math.random() * 6.3, s: .3 + Math.random(), r: .8 + Math.random() * 1.2 });
    fxState = { size };
    (function loop(now) {
      raf = requestAnimationFrame(loop); const t = (now - T0) / 1000;
      x.clearRect(0, 0, W, H);
      const m = x.createRadialGradient(W * .5, H * .85, 0, W * .5, H * .85, W * .6); m.addColorStop(0, 'rgba(60,160,120,.20)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, W, H);
      for (let l = 0; l < 3; l++) { x.fillStyle = ['rgba(8,24,17,.55)', 'rgba(5,16,11,.78)', 'rgba(2,8,5,.95)'][l];
        trees.forEach(tr => { if (tr.l !== l) return; const sw = Math.sin(t * .4 + tr.x) * (2 + l * 2);
          x.beginPath(); x.moveTo(tr.x - tr.w / 2, H); x.lineTo(tr.x - tr.w * .28 + sw * .2, tr.top); x.lineTo(tr.x + tr.w * .28 + sw * .2, tr.top); x.lineTo(tr.x + tr.w / 2, H); x.fill();
          x.beginPath(); x.ellipse(tr.x + sw, tr.top + 4, tr.w * (3.2 + l * .8), tr.w * (1.1 + l * .3), 0, 0, 6.3); x.fill(); }); }
      for (let k = 0; k < 2; k++) { const g = x.createLinearGradient(0, H * (.62 + k * .12), 0, H); g.addColorStop(0, 'rgba(120,200,170,0)'); g.addColorStop(1, 'rgba(120,200,170,' + (.08 - k * .03) + ')'); x.fillStyle = g; x.fillRect(0, H * (.62 + k * .12), W, H); }
      if (opts.particles) fl.forEach(f => { f.x += Math.sin(t * f.s + f.p) * .0004 + .00008 * f.s; f.y -= .00012 * f.s; if (f.y < .1) { f.y = 1; } if (f.x > 1) f.x = 0;
        const a = .35 + .65 * Math.abs(Math.sin(t * f.s * 1.3 + f.p)), px = f.x * W, py = f.y * H, g = x.createRadialGradient(px, py, 0, px, py, f.r * 5);
        g.addColorStop(0, 'rgba(255,220,120,' + a + ')'); g.addColorStop(.25, 'rgba(255,170,60,' + a * .45 + ')'); g.addColorStop(1, 'rgba(255,150,40,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, f.r * 5, 0, 6.3); x.fill(); });
    })(performance.now());
  }
  function stopFx() { cancelAnimationFrame(raf); raf = 0; }

  /* ───── init ───── */
  function init(c) {
    cfg = Object.assign({}, DEF, c || {}); loadOpts();
    root = document.getElementById('fdm-root');
    if (!root) { root = document.createElement('div'); root.id = 'fdm-root'; document.body.appendChild(root); }
    root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', cfg.title);
    root.innerHTML = '<canvas class="fdm-fx" aria-hidden="true"></canvas><div class="fdm-vig"></div><div class="fdm-grain"></div>' +
      ['main', 'slots', 'options', 'list', 'help', 'pause', 'death', 'victory'].map(n => '<section class="fdm-screen" data-s="' + n + '"></section>').join('') +
      '<div class="fdm-modal"><div class="fdm-panel"><h2>Écraser ?</h2><p>Cet emplacement contient déjà une partie. Elle sera remplacée.</p><div class="fdm-foot"><button class="fdm-btn" data-cf="no">Annuler</button><button class="fdm-btn fdm-danger" data-cf="yes">Écraser</button></div></div></div>' +
      '<div class="fdm-rot">Tourne ton téléphone<span>Le jeu se joue en mode paysage.</span></div>';
    root.addEventListener('click', e => {
      const cf = e.target.closest('[data-cf]'); if (cf) { $('.fdm-modal', root).classList.remove('fdm-on'); if (cf.dataset.cf === 'yes') { const i = pendingSlot; hide(); cfg.onAction('new', { slot: i, overwrite: true }); } return; }
      const sw = e.target.closest('[data-sw]'); if (sw) { const k = sw.dataset.sw; opts[k] = !opts[k]; sw.setAttribute('aria-checked', !!opts[k]); saveOpts(); cfg.onOption(k, opts[k]); cfg.onSound('click'); return; }
      const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b);
    });
    root.addEventListener('input', e => { const i = e.target.closest('[data-opt]'); if (!i) return; i.style.setProperty('--v', i.value + '%'); opts[i.dataset.opt] = +i.value; saveOpts(); cfg.onOption(i.dataset.opt, +i.value); });
    root.addEventListener('mouseover', e => { const b = e.target.closest('.fdm-btn,.fdm-slot,.fdm-item'); if (b && !b.disabled && b !== root._h) { root._h = b; cfg.onSound('hover'); } });
    // clavier : flèches / Entrée / Échap
    addEventListener('keydown', e => {
      if (!isOpen()) return; const k = e.key;
      if (k === 'Escape' || k === 'Backspace') { if ($('.fdm-modal.fdm-on', root)) { $('.fdm-modal', root).classList.remove('fdm-on'); } else back(); e.preventDefault(); e.stopPropagation(); return; }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(k)) {
        const sc = $('.fdm-screen[data-s="' + root.getAttribute('data-screen') + '"]', root), q = $('.fdm-modal.fdm-on', root) || sc;
        const bs = $$('button:not([disabled])', q); if (!bs.length) return; let i = bs.indexOf(document.activeElement); const d = (k === 'ArrowDown' || k === 'ArrowRight') ? 1 : -1;
        i = i < 0 ? 0 : (i + d + bs.length) % bs.length; bs[i].focus(); e.preventDefault(); e.stopPropagation();
      }
    }, true);
    return api;
  }
  const api = { init, show, hide, back, isOpen, get opts() { return opts; }, ICON };
  window.FDAMenu = api;
})();
