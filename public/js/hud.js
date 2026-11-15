/* Module HUD — Forêt des Ancêtres. À charger APRÈS le script principal. Panneaux HTML par-dessus le canvas (héros, âmes, objectif, compétences). */
(()=>{
if(!document.querySelector('link[href$="hud.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/hud.css';document.head.append(l)}
const d=document.createElement('div');d.id='lm-hud';
d.innerHTML=`<div class="lm-hero"><div class="lm-port"><img src="assets/hud/portrait.png" alt=""><b id="lm-z">1</b></div>
<div class="lm-info"><div class="lm-name">Loïc<span>Zone <i id="lm-zn">1</i></span></div>
<div class="lm-bar hp"><u id="lm-hp"></u><em id="lm-hpt"></em></div><div class="lm-bar mp"><u id="lm-mp"></u><em id="lm-mpt"></em></div></div></div>
<div class="lm-souls"><span class="lm-fl"></span><b id="lm-so">0</b><small>ÂMES</small></div>
<div class="lm-obj"><h4>OBJECTIF PRINCIPAL</h4><p id="lm-ob"></p></div>
<div class="lm-skills">${[['X','⚔'],['C','◉'],['V','✦'],['Maj','⇥'],['F','❋']].map((s,i)=>`<div class="lm-sk" id="lm-s${i}"><span>${s[1]}</span><b>${s[0]}</b></div>`).join('')}</div>`;
document.body.append(d);
const $=id=>document.getElementById(id),cache={},set=(id,v,f)=>{if(cache[id]!==v){cache[id]=v;f($(id),v)}};
const fit=()=>{const r=cv.getBoundingClientRect(),s=r.width/VW;d.style.cssText+=`;left:${r.left}px;top:${r.top}px;transform:scale(${s})`};
addEventListener('resize',fit);
function update(){
  const on=state==='play'||state==='dead';d.style.display=on?'block':'none';if(!on)return;fit();
  set('lm-hp',Math.round(P.hp/P.max*100),(e,v)=>e.style.width=v+'%');set('lm-hpt',P.hp+'/'+P.max,(e,v)=>e.textContent=Math.max(0,P.hp)+'/'+P.max);
  const g=Math.floor(gauge);set('lm-mp',g,(e,v)=>e.style.width=v+'%');set('lm-mpt',g,(e,v)=>e.textContent=v+' / 100');
  set('lm-so',souls,(e,v)=>e.textContent=v);set('lm-z',zi+1,(e,v)=>e.textContent=v);set('lm-zn',zi+1,(e,v)=>e.textContent=v);
  set('lm-ob',zi+'|'+bossDead,(e)=>e.textContent=BZ[zi]?(bossDead?'Franchis la porte de lumière':'Vaincre le gardien de la zone'):'Traverse '+Z[zi].n.split('— ')[1]);
  const cd=[P.cd/24,P.ocd/18,gauge>=100?0:1,P.rcd/45,wing>0?1-wing/480:0];
  cd.forEach((v,i)=>{const e=$('lm-s'+i),c=Math.round(Math.max(0,Math.min(1,v))*100);set('lm-s'+i,c+(i===2?'r':'')+(i===4&&wing>0?'w':''),()=>{e.style.setProperty('--cd',c);e.classList.toggle('rdy',c===0&&(i!==4||wing>0||gauge>=25));e.classList.toggle('on',i===4&&wing>0)})});
  $('lm-s2').classList.toggle('rdy',gauge>=100)}
const _hud=window.hud;window.hud=function(){_hud();update()};
})();
