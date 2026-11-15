/* FORÊT DES ANCÊTRES — module Boss (Akuma · Nguéma · Mokélé)
 * Aucune dépendance. Nécessite src/boss-data.js (FB_ASSETS) chargé avant.
 * API globale : window.ForetBosses
 *   ForetBosses.load(id, {base})           -> Promise<Defn>  (précharge les images)
 *   ForetBosses.create(id, opts)           -> Boss
 *   ForetBosses.music                      -> gestionnaire musique de combat
 *   ForetBosses.DEFS                       -> données (stats, phases, attaques, arènes, récompenses)
 * Les sprites sont tournés vers la DROITE. facing = 1 (droite) / -1 (gauche, miroir automatique).
 */
(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t, ease = t => t * t * (3 - 2 * t);

  /* ───────────── DONNÉES DES BOSS ───────────── */
  const DEFS = {
    akuma: {
      id: 'akuma', nom: 'Akuma', titre: 'Le Roi Ancestral', arene: 'arene_trone', areneNom: 'Le Trône des Ancêtres',
      pv: 2500, degats: [50, 80], vitesse: 'Moyenne', resistance: 'Très élevée', hauteur: 380, vitesseMarche: 90, vitesseCourse: 230,
      phases: [
        { nom: 'Le Roi Endormi', de: 1.0, forme: 'forme1', tint: null },
        { nom: 'Le Roi Corrompu', de: 0.70, forme: 'forme2', tint: 'rgba(255,60,20,.10)', speed: 1.15 },
        { nom: 'Le Jugement', de: 0.35, forme: 'forme3', tint: 'rgba(255,200,60,.14)', speed: 1.3 }],
      anims: { idle: 'idle', marche: 'marche', course: 'course', saut: 'saut', hurt: 'degats', mort: ['mort1', 'mort2'],
        attaque1: 'attaque_epee', attaque2: 'combo', attaque3: 'frappe_lourde', roar: 'frappe_lourde' },
      attaques: [
        { id: 'attaque1', nom: 'Coup d\'épée', pose: 'attaque_epee', portee: 190, degats: .6, dur: .7, hit: .45, lunge: 70 },
        { id: 'attaque2', nom: 'Combo', pose: 'combo', portee: 220, degats: .8, dur: .95, hit: .5, lunge: 90, hits: 2 },
        { id: 'attaque3', nom: 'Frappe lourde', pose: 'frappe_lourde', portee: 210, degats: 1.0, dur: 1.2, hit: .65, lunge: 40, shake: 10 }],
      speciaux: [
        { id: 'lame_du_roi', nom: 'Lame du Roi', fx: 'lame_du_roi', mode: 'projectile', pose: 'attaque_epee', degats: .9, cd: 5, vitesse: 700, taille: 260, phase: 0 },
        { id: 'onde_ancestrale', nom: 'Onde ancestrale', fx: 'onde_ancestrale', mode: 'projectile', pose: 'frappe_lourde', degats: 1, cd: 7, vitesse: 520, taille: 330, phase: 0 },
        { id: 'colonnes_feu', nom: 'Colonnes de feu', fx: 'colonnes_feu', mode: 'sol', pose: 'frappe_lourde', degats: 1.1, cd: 9, taille: 300, count: 3, phase: 1 },
        { id: 'ecrasement_royal', nom: 'Écrasement royal', fx: 'ecrasement_royal', mode: 'sol', pose: 'frappe_lourde', degats: 1.3, cd: 11, taille: 420, shake: 18, phase: 1 },
        { id: 'invocation_ombres', nom: 'Invocation d\'ombres', fx: 'invocation_ombres', mode: 'sol', pose: 'idle', degats: .8, cd: 13, taille: 380, count: 2, phase: 1 },
        { id: 'jugement_ancestral', nom: 'Jugement ancestral', fx: 'jugement_ancestral', mode: 'aura', pose: 'frappe_lourde', degats: 1.5, cd: 16, taille: 600, phase: 2 },
        { id: 'explosion_finale', nom: 'Explosion finale', fx: 'explosion_finale', mode: 'aura', pose: 'frappe_lourde', degats: 2, cd: 22, taille: 760, shake: 26, phase: 2 }],
      ambiance: ['aura_ancienne', 'symboles_lumineux', 'fissures_sol', 'flammes_royales', 'zone_maudite'],
      recompenses: [{ nom: 'Cœur du Roi Ancestral', icone: 'coeur_roi' }, { nom: 'Pouvoir Ancestral', icone: 'pouvoir_ancestral' }, { nom: 'Révélation Narrative', icone: 'revelation' }]
    },
    nguema: {
      id: 'nguema', nom: 'Nguéma', titre: 'Le Dévoreur des Âmes', arene: 'arene_vallee', areneNom: 'La Vallée des Âmes Perdues',
      pv: 1200, degats: [30, 60], vitesse: 'Très rapide', resistance: 'Moyenne', hauteur: 250, vitesseMarche: 150, vitesseCourse: 420,
      phases: [
        { nom: 'La Chasse', de: 1.0, forme: 'forme1', tint: null },
        { nom: 'Prédateur Éveillé', de: 0.65, forme: 'forme2', tint: 'rgba(200,40,255,.10)', speed: 1.15 },
        { nom: 'Dévoreur des Âmes', de: 0.30, forme: 'forme3', tint: 'rgba(255,40,120,.14)', speed: 1.3 }],
      // pas de sprite « dégâts »/« mort » dans la planche : flash + dissolution procéduraux
      anims: { idle: 'idle', marche: 'marche', course: 'course', saut: 'saut', hurt: 'idle', mort: ['griffes'],
        attaque1: 'griffes', attaque2: 'bond', attaque3: 'ruee', roar: 'rugissement' },
      attaques: [
        { id: 'attaque1', nom: 'Griffes', pose: 'griffes', portee: 150, degats: .6, dur: .45, hit: .4, lunge: 60 },
        { id: 'attaque2', nom: 'Bond', pose: 'bond', portee: 300, degats: .9, dur: .8, hit: .55, lunge: 260, arc: 120 },
        { id: 'attaque3', nom: 'Ruée', pose: 'ruee', portee: 380, degats: 1, dur: .9, hit: .5, lunge: 360 }],
      speciaux: [
        { id: 'double_griffes', nom: 'Double griffes', fx: 'double_griffes', mode: 'projectile', pose: 'griffes', degats: .8, cd: 4, vitesse: 800, taille: 200, phase: 0 },
        { id: 'onde_des_ames', nom: 'Onde des âmes', fx: 'onde_des_ames', mode: 'projectile', pose: 'rugissement', degats: .9, cd: 6, vitesse: 560, taille: 280, phase: 0 },
        { id: 'charge_obscure', nom: 'Charge obscure', fx: 'charge_obscure', mode: 'charge', pose: 'ruee', degats: 1.1, cd: 8, taille: 260, phase: 1 },
        { id: 'piliers_ombres', nom: 'Piliers d\'ombres', fx: 'piliers_ombres', mode: 'sol', pose: 'rugissement', degats: 1, cd: 10, taille: 300, count: 3, phase: 1 },
        { id: 'disparition_obscure', nom: 'Disparition obscure', fx: 'disparition_obscure', mode: 'teleport', pose: 'idle', degats: 0, cd: 9, taille: 260, phase: 1 },
        { id: 'cercle_ames', nom: 'Cercle d\'âmes', fx: 'cercle_ames', mode: 'aura', pose: 'rugissement', degats: 1.2, cd: 14, taille: 520, phase: 2 },
        { id: 'explosion_spirituelle', nom: 'Explosion spirituelle', fx: 'explosion_spirituelle', mode: 'aura', pose: 'rugissement', degats: 1.6, cd: 20, taille: 640, shake: 20, phase: 2 }],
      ambiance: ['traces_sombres', 'zone_maudite'],
      recompenses: [{ nom: 'Essence des Âmes', icone: 'essence_ames' }, { nom: 'Amélioration de Puissance', icone: 'amelioration_puissance' }, { nom: 'Fragment Narratif', icone: 'fragment_narratif' }]
    },
    mokele: {
      id: 'mokele', nom: 'Mokélé', titre: 'Le Gardien des Racines', arene: 'arene_sanctuaire', areneNom: 'Le Sanctuaire des Racines',
      pv: 1000, degats: [25, 35], vitesse: 'Lente', resistance: 'Élevée', hauteur: 400, vitesseMarche: 60, vitesseCourse: 160,
      phases: [
        { nom: 'Gardien', de: 1.0, forme: 'forme1', tint: null, set: 'p1_' },
        { nom: 'Gardien Enragé', de: 0.50, forme: 'forme2', tint: 'rgba(120,255,80,.10)', set: 'p2_', speed: 1.25 }],
      anims: { idle: 'idle', marche: 'marche', course: 'course', saut: 'saut', hurt: 'degats', mort: ['mort'],
        attaque1: 'attaque1', attaque2: 'attaque2', attaque3: 'attaque3', roar: 'attaque3', prefixed: true },
      attaques: [
        { id: 'attaque1', nom: 'Coup de poing', pose: 'attaque1', portee: 230, degats: .7, dur: .9, hit: .55, lunge: 40 },
        { id: 'attaque2', nom: 'Balayage', pose: 'attaque2', portee: 260, degats: .8, dur: 1.0, hit: .55, lunge: 30 },
        { id: 'attaque3', nom: 'Frappe du sol', pose: 'attaque3', portee: 240, degats: 1.0, dur: 1.2, hit: .65, lunge: 20, shake: 12 }],
      speciaux: [
        { id: 'racines_surgissantes', nom: 'Racines surgissantes', fx: 'racines_surgissantes', mode: 'sol', pose: 'attaque3', degats: 1, cd: 6, taille: 300, count: 3, phase: 0 },
        { id: 'onde_tellurique', nom: 'Onde tellurique', fx: 'onde_tellurique', mode: 'projectile', pose: 'attaque3', degats: .9, cd: 7, vitesse: 420, taille: 300, phase: 0 },
        { id: 'balayage_racines', nom: 'Balayage de racines', fx: 'balayage_racines', mode: 'projectile', pose: 'attaque2', degats: .9, cd: 8, vitesse: 520, taille: 340, phase: 0 },
        { id: 'epines_sol', nom: 'Épines du sol', fx: 'epines_sol', mode: 'sol', pose: 'attaque3', degats: 1, cd: 9, taille: 280, count: 4, phase: 1 },
        { id: 'regeneration', nom: 'Régénération', fx: 'regeneration', mode: 'heal', pose: 'idle', degats: 0, cd: 25, taille: 380, soin: .08, phase: 1 },
        { id: 'explosion_racinaire', nom: 'Explosion racinaire', fx: 'explosion_racinaire', mode: 'aura', pose: 'attaque3', degats: 1.5, cd: 18, taille: 620, shake: 20, phase: 1 }],
      ambiance: [],
      recompenses: [{ nom: 'Fragment de Racine Ancestrale', icone: 'fragment_racine' }, { nom: 'Amélioration de Résistance', icone: 'amelioration_resistance' }, { nom: 'Fragment Narratif', icone: 'fragment_narratif' }]
    }
  };

  /* ───────────── CHARGEMENT ───────────── */
  const cache = {};
  function loadImg(src) {
    return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { console.warn('[ForetBosses] image manquante', src); res(null); }; i.src = src; });
  }
  /** Charge toutes les images d'un boss. base = dossier contenant « assets/ » (par défaut le dossier de la page). */
  function load(id, opts) {
    opts = opts || {}; const base = opts.base == null ? (window.FB_BASE || '') : opts.base;
    const key = id + '|' + base; if (cache[key]) return cache[key];
    const man = (window.FB_ASSETS || {})[id]; if (!man) return Promise.reject(new Error('Boss inconnu : ' + id));
    const names = Object.keys(man);
    cache[key] = Promise.all(names.map(n => loadImg(base + man[n].file))).then(imgs => {
      const sp = {}; names.forEach((n, i) => { sp[n] = Object.assign({ img: imgs[i] }, man[n]); });
      return { id, def: DEFS[id], sp };
    });
    return cache[key];
  }

  /* ───────────── MUSIQUE DE COMBAT ───────────── */
  const music = {
    el: null, vol: 0.7, base: .7, target: 0, cur: 0, raf: 0, src: 'assets/audio/pulse_of_the_ancestors_2.mp3',
    _init() { if (this.el) return; this.el = new Audio(this.src); this.el.loop = true; this.el.preload = 'auto'; this.el.volume = 0; },
    /** À appeler depuis un geste utilisateur (clic) la première fois. */
    play(opts) {
      opts = opts || {}; if (opts.src) this.src = opts.src; this._init();
      if (opts.volume != null) this.base = opts.volume;
      this.target = this.base * this.intensity; const p = this.el.play(); if (p && p.catch) p.catch(() => { }); this._tick(); return p;
    },
    intensity: .75,
    /** phase 0..n : monte progressivement l'intensité (volume) */
    setPhase(i, n) { this.intensity = n > 1 ? .72 + .28 * (i / (n - 1)) : 1; if (this.el && !this.el.paused) this.target = this.base * this.intensity; },
    stop(fade) { this.target = 0; this._stopAfter = true; this._fade = fade == null ? 1.2 : fade; this._tick(); },
    pause() { this.el && this.el.pause(); }, resume() { this.el && this.el.play().catch(() => { }); },
    setVolume(v) { this.base = v; if (!this._stopAfter) this.target = v * this.intensity; },
    _tick() {
      if (this.raf) return; const step = () => {
        const d = this.target - this.cur; this.cur += clamp(d, -.02, .02); if (this.el) this.el.volume = clamp(this.cur, 0, 1);
        if (Math.abs(d) < .005) { this.cur = this.target; this.el && (this.el.volume = clamp(this.cur, 0, 1)); if (this.target === 0 && this._stopAfter && this.el) { this.el.pause(); this._stopAfter = false; } this.raf = 0; return; }
        this.raf = requestAnimationFrame(step);
      }; this.raf = requestAnimationFrame(step);
    }
  };

  /* ───────────── BOSS ───────────── */
  class Boss {
    constructor(data, o) {
      this.data = data; this.def = data.def; this.sp = data.sp; o = o || {};
      this.x = o.x || 0; this.y = o.y || 0;               // y = ligne de sol
      this.facing = o.facing || -1; this.scaleMul = o.scale || 1;
      this.maxHp = o.hp || this.def.pv; this.hp = this.maxHp;
      this.phase = 0; this.state = 'idle'; this.t = 0; this.stateT = 0;
      this.vx = 0; this.z = 0; this.alive = true; this.invuln = false;
      this.flash = 0; this.shake = 0; this.alpha = 1; this.dissolve = 0; this.tintPulse = 0;
      this.fx = []; this.cd = {}; this.ev = {}; this.cur = null; this.queue = [];
      this.autoAI = o.ai !== false; this.target = o.target || null; this.thinkT = 1.2;
      this.card = null; this.sounds = o.sounds || {};
      this.musicOn = o.music !== false; this.speedMul = 1; this.hit = {};
      this.dmgMul = o.damage == null ? 1 : o.damage;
      this._applyPhaseSet();
    }
    /* événements : hit, phase, state, death, special, hurt, heal, shake, card */
    on(n, f) { (this.ev[n] = this.ev[n] || []).push(f); return this; }
    off(n, f) { this.ev[n] = (this.ev[n] || []).filter(x => x !== f); return this; }
    emit(n, p) { (this.ev[n] || []).forEach(f => { try { f(p, this); } catch (e) { console.error(e); } }); }
    get P() { return this.def.phases[this.phase]; }
    get hpRatio() { return this.hp / this.maxHp; }
    _key(k) { const a = this.def.anims; return (a.prefixed ? (this.P.set || 'p1_') : '') + k; }
    _spr(k) { return this.sp[this._key(k)] || this.sp[k] || null; }
    _applyPhaseSet() { this.speedMul = this.P.speed || 1; }
    /** rectangle de collision (monde) */
    hitbox() { const s = this._spr('idle'); const sc = this._sc(), w = (s ? s.w : 150) * sc * .6, h = (s ? s.h : 200) * sc * .9; return { x: this.x - w / 2, y: this.y - h - this.z, w, h }; }
    _sc() { const s = this.sp[this._key('idle')] || this.sp.idle; return s ? this.def.hauteur / s.h * this.scaleMul : this.scaleMul; }
    /** zone d'attaque devant le boss pour l'attaque en cours */
    attackBox(portee) { const hb = this.hitbox(); const w = portee || 200; return { x: this.facing > 0 ? hb.x + hb.w / 2 : hb.x + hb.w / 2 - w, y: hb.y, w, h: hb.h }; }

    /* ---- commandes ---- */
    face(dir) { if (dir) this.facing = dir > 0 ? 1 : -1; }
    setState(s) { if (this.state !== s) { this.state = s; this.stateT = 0; this.emit('state', s); } }
    walk(dir, run) { if (!this.alive || this._busy()) return; this.face(dir); this.vx = dir * (run ? this.def.vitesseCourse : this.def.vitesseMarche) * this.speedMul; this.setState(run ? 'course' : 'marche'); }
    stop() { if (this.state === 'marche' || this.state === 'course') { this.vx = 0; this.setState('idle'); } }
    jump(force) { if (!this.alive || this._busy()) return; this.cur = { type: 'jump', t: 0, dur: .9, h: force || 170, x0: this.x, dx: this.facing * 160 }; this.setState('saut'); }
    _busy() { return !!this.cur && this.cur.type !== 'jump' || this.state === 'mort'; }
    attack(n) {
      if (!this.alive || this.cur) return false; const a = this.def.attaques[(n == null ? 0 : n)] || this.def.attaques.find(x => x.id === n); if (!a) return false;
      this.vx = 0; this.cur = Object.assign({ type: 'atk', t: 0, fired: 0, x0: this.x, def: a, dur: a.dur / this.speedMul }, {}); this.setState('attaque'); return true;
    }
    /** lance un pouvoir spécial (id ou index) — ignore le temps de recharge si force=true */
    special(idOrIdx, force) {
      if (!this.alive || this.cur) return false;
      const sp = typeof idOrIdx === 'number' ? this.def.speciaux[idOrIdx] : this.def.speciaux.find(s => s.id === idOrIdx); if (!sp) return false;
      if (!force && (this.cd[sp.id] || 0) > 0) return false;
      this.vx = 0; this.cd[sp.id] = sp.cd; this.cur = { type: 'spe', t: 0, def: sp, fired: 0, x0: this.x, dur: (sp.mode === 'aura' ? 1.4 : 1.0) / this.speedMul };
      this.setState('special'); this.emit('special', sp); this._sfx('special'); return true;
    }
    roar() { if (!this.alive || this.cur) return; this.cur = { type: 'roar', t: 0, dur: 1.3 }; this.setState('roar'); this._sfx('roar'); }
    /** inflige des dégâts au boss */
    damage(n, opts) {
      if (!this.alive || this.invuln) return 0; opts = opts || {};
      const red = this.def.resistance === 'Très élevée' ? .85 : this.def.resistance === 'Élevée' ? .9 : 1;
      n = Math.max(1, Math.round(n * red)); this.hp = Math.max(0, this.hp - n); this.flash = .22; this.emit('hurt', { amount: n, hp: this.hp });
      this._sfx('hurt');
      if (!this.cur && opts.stagger !== false && this.state !== 'roar') { this.cur = { type: 'hurt', t: 0, dur: .32, kb: (opts.dir || -this.facing) * 40, x0: this.x }; this.setState('hurt'); }
      this._checkPhase(); if (this.hp <= 0) this._die(); return n;
    }
    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); this.emit('heal', { amount: n, hp: this.hp }); }
    setHp(v) { this.hp = clamp(v, 0, this.maxHp); this._checkPhase(true); if (this.hp <= 0 && this.alive) this._die(); }
    /** force le passage à une phase (0..n-1) avec ou sans cinématique */
    setPhase(i, silent) {
      i = clamp(i, 0, this.def.phases.length - 1); if (i === this.phase) return; this.phase = i; this._applyPhaseSet(); music.setPhase(i, this.def.phases.length);
      this.emit('phase', { index: i, name: this.P.nom, forme: this.P.forme });
      if (!silent) { this.cur = null; this.invuln = true; this.cur = { type: 'transform', t: 0, dur: 2.6 }; this.setState('transform'); this.card = { img: (this.sp[this.P.forme] || {}).img, t: 0, dur: 2.6, name: this.P.nom }; this.emit('card', this.card); this._sfx('transform'); }
    }
    _checkPhase(silent) {
      let want = 0; this.def.phases.forEach((p, i) => { if (this.hpRatio <= p.de + 1e-6 && i > 0) want = i; });
      if (this.hp > 0 && want > this.phase) this.setPhase(want, silent);
    }
    _die() { this.alive = false; this.vx = 0; this.cur = { type: 'death', t: 0, dur: 2.2 }; this.setState('mort'); this.fx = this.fx.filter(f => f.keep); this.emit('death', { rewards: this.def.recompenses }); this._sfx('death'); }
    revive() { this.alive = true; this.hp = this.maxHp; this.phase = 0; this._applyPhaseSet(); this.cur = null; this.alpha = 1; this.dissolve = 0; this.state = 'idle'; this.cd = {}; this.fx = []; this.card = null; this.invuln = false; }
    _sfx(n) { const s = this.sounds[n]; if (!s) return; try { if (typeof s === 'function') s(this); else { const a = new Audio(s); a.volume = .8; a.play().catch(() => { }); } } catch (e) { } }

    /* ---- boucle ---- */
    update(dt) {
      dt = Math.min(dt, .05); this.t += dt; this.stateT += dt; this.flash = Math.max(0, this.flash - dt); this.shake = Math.max(0, this.shake - dt * 30);
      Object.keys(this.cd).forEach(k => { if (this.cd[k] > 0) this.cd[k] -= dt; });
      const c = this.cur;
      if (c) {
        c.t += dt; const k = clamp(c.t / c.dur, 0, 1);
        if (c.type === 'atk') {
          const a = c.def, ph = k, hitK = a.hit / a.dur * (a.dur / (a.dur));
          const reach = ph < a.hit / a.dur ? ease(ph / (a.hit / a.dur)) : 1 - ease((ph - a.hit / a.dur) / (1 - a.hit / a.dur)) * .6;
          this.x = c.x0 + this.facing * a.lunge * (ph < a.hit / a.dur ? reach : 1) * (ph < .95 ? 1 : 0.0 + (1 - ease((ph - .95) / .05)));
          this.z = a.arc ? Math.sin(clamp(ph / (a.hit / a.dur * 1.6), 0, 1) * Math.PI) * a.arc : 0;
          const nh = a.hits || 1;
          for (let i = c.fired; i < nh; i++) { const th = (a.hit / a.dur) * (nh === 1 ? 1 : (.55 + .45 * i / (nh - 1))); if (ph >= th) { c.fired = i + 1; this._hit(a, i); } }
        } else if (c.type === 'spe') {
          const s = c.def, trig = s.mode === 'aura' ? .55 : .5;
          if (!c.fired && k >= trig) { c.fired = 1; this._fireSpecial(s); }
          if (s.mode === 'charge') { const run = clamp((k - .3) / .5, 0, 1); this.x = c.x0 + this.facing * 520 * ease(run); }
        } else if (c.type === 'jump') { this.z = Math.sin(k * Math.PI) * c.h; this.x = c.x0 + c.dx * k; }
        else if (c.type === 'hurt') { this.x = c.x0 + c.kb * ease(k); }
        else if (c.type === 'roar') { if (!c.fired && k > .3) { c.fired = 1; this.shake = 12; this.emit('shake', 12); } }
        else if (c.type === 'transform') {
          if (this.card) { this.card.t = c.t; }
          if (k > .35 && !c.fired) { c.fired = 1; this.shake = 14; this.emit('shake', 14); this.tintPulse = 1; }
          this.tintPulse = Math.max(0, this.tintPulse - dt * .8);
        } else if (c.type === 'death') { this.dissolve = k; this.alpha = 1; }
        if (c.t >= c.dur) {
          if (c.type === 'death') { this.cur = { type: 'dead', t: 0, dur: 1e9 }; this.dissolve = 1; }
          else if (c.type === 'transform') { this.cur = null; this.invuln = false; this.card = null; this.hp = Math.max(this.hp, 1); this.setState('idle'); }
          else { this.cur = null; this.z = 0; this.setState('idle'); }
        }
      } else {
        this.x += this.vx * dt;
        if (this.alive && this.autoAI && this.target) this._think(dt);
      }
      // effets
      for (const f of this.fx) { f.t += dt; if (f.vx) f.x += f.vx * dt; if (f.hitT != null && f.t >= f.hitT && !f.did) { f.did = 1; this.emit('hit', { damage: Math.round(f.dmg), special: f.id, box: f.box ? f.box(f) : null, fx: f }); } }
      this.fx = this.fx.filter(f => f.t < f.dur && Math.abs(f.x - this.x) < 4000);
    }
    _dmg(mult) { const [a, b] = this.def.degats; return Math.round((a + Math.random() * (b - a)) * mult * this.dmgMul); }
    _hit(a, i) {
      this.emit('hit', { damage: this._dmg(a.degats), attack: a.id, hitIndex: i, box: this.attackBox(a.portee) });
      if (a.shake) { this.shake = a.shake; this.emit('shake', a.shake); } this._sfx('attack');
    }
    _fireSpecial(s) {
      const f = this.facing, sz = s.taille, img = this.sp[s.fx];
      if (s.shake) { this.shake = s.shake; this.emit('shake', s.shake); }
      const base = { id: s.id, img, sz, dmg: this._dmg(s.degats), t: 0, mode: s.mode, dir: f };
      const bx = (e) => ({ x: e.x - e.sz * .35, y: this.y - e.sz * .8, w: e.sz * .7, h: e.sz * .8 });
      if (s.mode === 'projectile') this.fx.push(Object.assign(base, { x: this.x + f * 120, y: this.y, vx: f * s.vitesse, dur: 1.8, hitT: 0, box: bx, repeat: true }));
      else if (s.mode === 'sol') { const n = s.count || 1; for (let i = 0; i < n; i++) this.fx.push(Object.assign({}, base, { x: this.x + f * (180 + i * (sz * .75)), y: this.y, dur: 1.1, hitT: .25 + i * .12, delay: i * .12, box: bx })); }
      else if (s.mode === 'aura') this.fx.push(Object.assign(base, { x: this.x, y: this.y - this.hitbox().h * .45, dur: 1.4, hitT: .3, aura: true, box: e => ({ x: e.x - e.sz * .5, y: e.y - e.sz * .5, w: e.sz, h: e.sz }) }));
      else if (s.mode === 'charge') this.fx.push(Object.assign(base, { x: this.x, y: this.y, dur: .9, hitT: .1, follow: true, box: () => this.attackBox(260) }));
      else if (s.mode === 'heal') { this.fx.push(Object.assign(base, { x: this.x, y: this.y - 100, dur: 1.6, follow: true, aura: true })); const n = Math.round(this.maxHp * (s.soin || .05)); this.heal(n); }
      else if (s.mode === 'teleport') { this.fx.push(Object.assign({}, base, { x: this.x, y: this.y - 60, dur: 1.0, aura: true })); const tx = this.target ? this.target.x - this.facing * 140 : this.x - f * 300; this.fx.push(Object.assign({}, base, { x: tx, y: this.y - 60, dur: 1.0, aura: true, delay: .3 })); this.x = tx; }
      this.fx.forEach(e => { if (e.hitT === 0) e.hitT = .02; });
    }
    _think(dt) {
      this.thinkT -= dt; if (this.thinkT > 0) { const dx0 = this.target.x - this.x; this.face(dx0); this.stop(); return; }
      const dx = this.target.x - this.x, ad = Math.abs(dx); this.face(dx);
      const spe = this.def.speciaux.filter(s => s.phase <= this.phase && (this.cd[s.id] || 0) <= 0 && !(s.mode === 'heal' && this.hpRatio > .7));
      const r = Math.random();
      if (spe.length && r < .35 && ad > 160) { this.special(spe[(Math.random() * spe.length) | 0].id); this.thinkT = .8 + Math.random() * .8; return; }
      const atk = this.def.attaques[(Math.random() * this.def.attaques.length) | 0];
      if (ad <= atk.portee * .85) { this.attack(atk.id); this.thinkT = .5 + Math.random() * .7 / this.speedMul; }
      else { this.walk(Math.sign(dx), ad > 520); this.thinkT = .25; }
    }

    /* ---- rendu ---- */
    _pose() {
      const c = this.cur, st = this.state, d = this.def;
      if (st === 'attaque' && c) return d.attaques.find(a => a.id === c.def.id) ? c.def.pose : 'idle';
      if (st === 'special' && c) return c.def.pose || 'idle';
      if (st === 'roar') return d.anims.roar; if (st === 'transform') return 'idle'; if (st === 'saut') return d.anims.saut;
      if (st === 'marche') return d.anims.marche; if (st === 'course') return d.anims.course;
      if (st === 'hurt') return d.anims.hurt;
      if (st === 'mort') { const m = d.anims.mort, k = c ? c.t / c.dur : 1; return m[Math.min(m.length - 1, (k * m.length) | 0)]; }
      return d.anims.idle;
    }
    /** dessine le boss + ses effets. ctx = contexte 2D ; le monde est supposé en pixels, y vers le bas. */
    draw(ctx) {
      const pose = this._pose(), s = this._spr(pose) || this._spr('idle'); if (!s || !s.img) return;
      const sc0 = this._sc(), t = this.t, st = this.state, c = this.cur;
      let sx = 1, sy = 1, rot = 0, ox = 0, oy = 0;
      const bob = Math.sin(t * 2.2 * this.speedMul);
      if (st === 'idle') { sy = 1 + bob * .012; sx = 1 - bob * .008; }
      else if (st === 'marche') { const w = Math.sin(t * 7 * this.speedMul); oy = -Math.abs(w) * 6; rot = w * .02 * this.facing; sy = 1 + w * .012; }
      else if (st === 'course') { const w = Math.sin(t * 12 * this.speedMul); oy = -Math.abs(w) * 10; rot = .08 * this.facing + w * .015; }
      else if (st === 'attaque' && c) { const a = c.def, k = c.t / c.dur, hk = a.hit / a.dur; if (k < hk * .6) { rot = -.08 * this.facing * ease(k / (hk * .6)); sx = 1 - .04 * k; } else if (k < hk + .1) { rot = .1 * this.facing; sx = 1.06; } else { rot = .1 * this.facing * (1 - ease((k - hk) / (1 - hk))); } }
      else if (st === 'special' && c) { const k = c.t / c.dur; sy = 1 + Math.sin(k * Math.PI) * .06; sx = 1 - Math.sin(k * Math.PI) * .03; }
      else if (st === 'roar' && c) { const k = c.t / c.dur; const p = Math.sin(clamp(k * 1.6, 0, 1) * Math.PI); sx = 1 + p * .08; sy = 1 + p * .08; rot = -p * .05 * this.facing; }
      else if (st === 'hurt' && c) { const k = c.t / c.dur; rot = -.12 * this.facing * Math.sin(k * Math.PI); ox = Math.sin(c.t * 60) * 3; }
      else if (st === 'saut' && c) { const k = c.t / c.dur; sy = 1 + (k < .2 || k > .85 ? -.06 : .05); sx = 1 - (sy - 1) * .7; }
      else if (st === 'transform' && c) { const k = c.t / c.dur; sx = sy = 1 + Math.sin(k * Math.PI) * .12; ox = Math.sin(c.t * 50) * 3 * Math.sin(k * Math.PI); }
      else if (st === 'mort' && c) { const k = c.t / c.dur; rot = (this.def.id === 'akuma' ? .12 : .05) * this.facing * ease(k); oy = ease(k) * 10; }
      const sh = this.shake ? (Math.random() - .5) * this.shake * .5 : 0;
      const px = this.x + ox + sh, py = this.y - this.z + oy;

      // ombre au sol
      ctx.save(); ctx.globalAlpha = .35 * (this.alpha) * (1 - this.dissolve) * clamp(1 - this.z / 400, .3, 1);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x, this.y + 4, s.w * sc0 * .38 * (1 - this.z / 600), 14 * sc0 * .6, 0, 0, TAU); ctx.fill(); ctx.restore();

      // effets derrière (auras)
      this._drawFx(ctx, true);

      ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(sx * this.facing, sy);
      const dw = s.w * sc0 * (s.up ? 1 : 1), dh = s.h * sc0, dx = -s.ax * sc0, dy = -s.ay * sc0;
      const dis = this.dissolve;
      if (dis > 0 && this.def.id !== 'mokele' || (dis > 0 && this.def.id === 'mokele')) { /* dissolution : bandes qui s'estompent de haut en bas + montée */
        const strips = 28, sw = s.w / strips;
        for (let i = 0; i < strips; i++) {
          const seed = (Math.sin(i * 12.9898) * 43758.5453) % 1, rnd = Math.abs(seed);
          const k = clamp((dis - rnd * .45) / .55, 0, 1); if (k >= 1) continue;
          ctx.globalAlpha = (1 - k) * this.alpha; ctx.drawImage(s.img, i * sw, 0, sw + 1, s.h, dx + i * sw * sc0, dy - k * 60 * sc0 * .3 * (this.def.id === 'nguema' ? 1.5 : .4), sw * sc0 + 1, dh);
        }
      } else { ctx.globalAlpha = this.alpha; ctx.drawImage(s.img, dx, dy, dw, dh); }
      // flash blanc / teinte de phase
      if (this.flash > 0 || this.P.tint || this.tintPulse > 0) this._overlay(ctx, s, dx, dy, dw, dh);
      ctx.restore();

      this._drawFx(ctx, false);
    }
    _overlay(ctx, s, dx, dy, dw, dh) {
      if (!this._oc) { this._oc = document.createElement('canvas'); this._ox = this._oc.getContext('2d'); }
      const oc = this._oc, o = this._ox; oc.width = Math.ceil(dw); oc.height = Math.ceil(dh);
      o.clearRect(0, 0, oc.width, oc.height); o.globalCompositeOperation = 'source-over'; o.drawImage(s.img, 0, 0, dw, dh);
      o.globalCompositeOperation = 'source-in';
      let a = 0; o.fillStyle = '#fff';
      if (this.flash > 0) { o.globalAlpha = clamp(this.flash / .22, 0, 1) * .85; o.fillRect(0, 0, oc.width, oc.height); }
      if (this.P.tint) { o.globalAlpha = 1; o.fillStyle = this.P.tint; o.fillRect(0, 0, oc.width, oc.height); }
      if (this.tintPulse > 0) { o.globalAlpha = this.tintPulse * .6; o.fillStyle = '#fff'; o.fillRect(0, 0, oc.width, oc.height); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - this.dissolve); ctx.drawImage(oc, dx, dy, dw, dh); ctx.restore();
    }
    _drawFx(ctx, behind) {
      for (const f of this.fx) {
        if (!!f.aura !== behind || !f.img || !f.img.img) continue; if (f.delay && f.t < f.delay) continue;
        const t = f.t - (f.delay || 0), k = clamp(t / (f.dur - (f.delay || 0)), 0, 1), im = f.img.img;
        const a = Math.sin(Math.min(1, k * 1.15) * Math.PI) ** .6;
        const asp = f.img.w / f.img.h; let h = f.sz, w = h * asp;
        let x = f.follow ? (f.mode === 'charge' ? this.x : this.x) : f.x, y = f.y;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a, 0, 1);
        if (f.mode === 'sol') { const g = ease(clamp(k * 3, 0, 1)); h *= .4 + .6 * g; w = h * asp; }
        if (f.mode === 'aura') { const g = .6 + .5 * ease(k); h *= g; w *= g; }
        ctx.translate(x, y); ctx.scale(f.dir || 1, 1);
        const ay = f.mode === 'aura' ? .5 : 1;
        ctx.drawImage(im, -w / 2, -h * ay, w, h); ctx.restore();
      }
    }
    /** dessine la carte de transformation plein cadre (à appeler après la scène, en coordonnées écran) */
    drawCard(ctx, W, H) {
      const c = this.card; if (!c || !c.img || !c.img.img) return; const k = clamp(c.t / c.dur, 0, 1), a = Math.sin(k * Math.PI) ** .5;
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1) * .95; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
      const im = c.img.img, asp = im.width / im.height, h = H * .62, w = h * asp, z = 1 + k * .06;
      ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.globalAlpha = clamp(a, 0, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = '#f5d78a'; ctx.textAlign = 'center'; ctx.font = '700 38px Cinzel, "Trebuchet MS", serif'; ctx.fillText(c.name.toUpperCase(), W / 2, H / 2 + h / 2 + 56); ctx.restore();
    }
    /** icône / image du dictionnaire */
    image(name) { return (this.sp[name] || {}).img || null; }
  }

  /* ───────────── API ───────────── */
  window.ForetBosses = {
    DEFS, music, load, Boss,
    ids: Object.keys(DEFS),
    /** create('akuma', {x, y, facing, scale, hp, ai, target:{x}, music, sounds:{hurt,attack,special,roar,death,transform}, base}) -> Promise<Boss> */
    create(id, opts) { return load(id, opts).then(d => new Boss(d, opts)); },
    createSync(data, opts) { return new Boss(data, opts); },
    /** image d'arène (fond) */
    arena(id, opts) { return load(id, opts).then(d => d.sp[d.def.arene] && d.sp[d.def.arene].img); },
    /** barre de vie HTML prête à l'emploi : renvoie {el, update()} */
    hud(boss, parent) {
      const el = document.createElement('div'); el.className = 'fb-hud';
      el.innerHTML = '<div class="fb-name"></div><div class="fb-bar"><div class="fb-hp"></div><div class="fb-ghost"></div></div><div class="fb-phase"></div>';
      (parent || document.body).appendChild(el);
      const q = s => el.querySelector(s); q('.fb-name').textContent = boss.def.nom.toUpperCase() + ' — ' + boss.def.titre;
      let ghost = 1;
      return { el, update() { const r = boss.hpRatio; q('.fb-hp').style.width = (r * 100) + '%'; ghost = Math.max(r, ghost - .006); q('.fb-ghost').style.width = (ghost * 100) + '%'; q('.fb-phase').textContent = boss.P.nom; el.classList.toggle('fb-dead', !boss.alive); }, destroy() { el.remove(); } };
    }
  };
})();
