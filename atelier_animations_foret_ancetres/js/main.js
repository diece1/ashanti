(function(){
const NS=window.ForetAtelier,M=NS.manifest,S=NS.settings,$=(s,r=document)=>r.querySelector(s);
const el=(t,a={},h='')=>{const e=document.createElement(t);Object.assign(e,a);if(h)e.innerHTML=h;return e};
let demoActive=false,demoFrame=0,demoLast=0;
NS.initDemo=function(){
 if(demoActive)return;
 NS.initEngine();demoActive=true;demoLast=performance.now();
 const frame=now=>{if(!demoActive)return;NS.step(Math.min(100,now-demoLast));demoLast=now;demoFrame=requestAnimationFrame(frame)};
 demoFrame=requestAnimationFrame(frame)
};
NS.destroyDemo=function(){demoActive=false;cancelAnimationFrame(demoFrame);NS.destroyMenu();NS.destroyEngine()};
NS.initDemo();
/* ---------- Menu ---------- */
const stage=$('#stage'),toast=$('#toast'),msgs={start:'Démo : lancera newGame() du jeu.',opts:'Démo : ouvrira openOpts(\'title\').',maj:'Démo : appellera checkForUpdates() déjà présent dans le jeu.',test:'Démo : ouvrira le sélecteur de niveau de test.'};
let tt;document.querySelectorAll('.menu .btn').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.menu .btn').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');toast.textContent=msgs[b.dataset.k];toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),2600)}));
NS.initMenu(stage,$('#fx'));
/* ---------- Cartes de sprites ---------- */
async function carte(host,name,large){
 const m=M[name],c=el('div',{className:'carte'+(large?' large':'')}),cv=el('canvas');cv.width=m.fw;cv.height=m.fh;
 const info=el('div',{className:'meta'}),bar=el('div',{className:'bar'}),pl=el('button',{className:'ctl',textContent:'Pause'}),rs=el('button',{className:'ctl',textContent:'Redémarrer'});
 bar.append(pl,rs);c.append(el('h3',{},m.label),cv,info,bar,el('p',{className:'note',textContent:m.note}));host.append(c);
 try{
  const sp=await NS.makeSprite(name),x=cv.getContext('2d');
  const t={tick(dt){sp.step(dt);x.clearRect(0,0,cv.width,cv.height);sp.drawFit(x,cv.width,cv.height);info.textContent=`${m.frames} frames · ${(m.fps*S.speed).toFixed(1)} img/s · frame ${sp.frame+1}`}};
  pl.onclick=()=>{sp.playing=!sp.playing;pl.textContent=sp.playing?'Pause':'Lecture'};rs.onclick=()=>{sp.restart();pl.textContent='Pause'};
  NS.add(t);NS.watch(cv,t);
 }catch(e){c.append(el('p',{className:'note',textContent:'Erreur : '+e.message}))}
}
const lot=(id,names,large)=>names.forEach(n=>carte($(id),n,large));
lot('#g-hero',['hero_idle_face','hero_idle_face_b','hero_idle_profil','hero_run','hero_run_stance','hero_jump','hero_sword_draw','hero_energy_charge','hero_flight_wings','hero_awakened_idle']);
lot('#g-env',['env_campfire','env_waterfall_small'],true);lot('#g-env',['bg_waterfall_scene','bg_menu_animated']);
/* ---------- Effets : lancer d'une boule d'énergie ---------- */
(async()=>{
 const cv=$('#fxdemo'),x=cv.getContext('2d'),ch=await NS.makeSprite('hero_energy_charge'),ball=await NS.makeSprite('fx_energy_ball');
 let b=null,boom=null,rings=[],T=0;const H=cv.height,k=H*.3/ball.fh;
 $('#launch').onclick=()=>{b={x:230,y:H*.5};boom=null};
 const t={tick(dt){
  T+=dt*S.speed;ch.step(dt);x.clearRect(0,0,cv.width,H);ch.draw(x,10,H*.06,H*.88);
  if(b){b.x+=dt*.5*S.speed;const f=Math.floor(T/1000*ball.fps*1.5)%5;
   x.globalAlpha=.22;for(let i=1;i<=4;i++)ball.draw(x,b.x-i*28,b.y-ball.fh*k/2,ball.fh*k,f);x.globalAlpha=1;
   ball.draw(x,b.x,b.y-ball.fh*k/2,ball.fh*k,f);
   if(b.x>cv.width-170){boom={x:b.x,y:b.y,t:0};rings.push({x:b.x+60,y:b.y,r:10,a:1});b=null}}
  if(boom){boom.t+=dt*S.speed;const f=5+Math.floor(boom.t/130);if(f<=7)ball.draw(x,boom.x,boom.y-ball.fh*k/2,ball.fh*k,f);else boom=null}
  for(const r of rings){r.r+=dt*.25*S.speed;r.a-=dt*.0016*S.speed;if(r.a>0){x.strokeStyle=`rgba(120,220,255,${r.a})`;x.lineWidth=5;x.beginPath();x.arc(r.x,r.y,r.r,0,6.3);x.stroke()}}
  rings=rings.filter(r=>r.a>0)}};
 NS.add(t);NS.watch(cv,t);
})().catch(e=>$('#fxdemo').after(el('p',{className:'note',textContent:'Erreur : '+e.message})));
/* ---------- Configuration ---------- */
const bind=(id,fn)=>{const i=$(id);i.addEventListener('input',()=>fn(i))};
bind('#c-fps',i=>S.fps=+i.value);bind('#c-speed',i=>{S.speed=+i.value;$('#v-speed').textContent=i.value+'×'});bind('#c-part',i=>{S.particles=+i.value;$('#v-part').textContent=i.value+'×'});
bind('#c-fx',i=>S.fx=i.checked);bind('#c-q',i=>{S.quality=+i.value;window.dispatchEvent(new Event('resize'))});
$('#c-size').addEventListener('input',e=>document.querySelectorAll('.grille').forEach(g=>g.style.gridTemplateColumns=`repeat(auto-fill,minmax(${e.target.value}px,1fr))`));
$('#play-all').onclick=()=>{S.speed=S.speed?0:1;$('#play-all').textContent=S.speed?'Arrêter les animations':'Relancer les animations'};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#snip').textContent);$('#copy').textContent='Copié'}catch(e){$('#copy').textContent='Copie impossible : sélectionne le texte à la main'}};
})();
