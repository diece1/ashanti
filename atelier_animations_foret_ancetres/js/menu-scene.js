/* Effets procéduraux du menu : posés par-dessus l'illustration (cascade, brume, lucioles, papillons, reflets). */
(function(){
const NS=window.ForetAtelier,S=NS.settings,R=NS.rand;
let menu=null;
NS.initMenu=function(stage,cv){
 if(menu)NS.destroyMenu();
 if(!stage||!cv)throw new TypeError('La scène du menu nécessite son conteneur et son canvas.');
 const c=cv.getContext('2d');let W=1,H=1;
 const size=()=>{const d=Math.min(window.devicePixelRatio||1,2)*S.quality;W=cv.width=Math.max(1,stage.clientWidth*d);H=cv.height=Math.max(1,stage.clientHeight*d)};
 const resizeObserver=new ResizeObserver(size);resizeObserver.observe(stage);size();
 const ff=Array.from({length:90},()=>({x:Math.random(),y:R(.12,.85),p:R(0,6.3),s:R(.01,.04),r:R(1.2,2.8)}));
 const bf=Array.from({length:6},(_,i)=>({x:Math.random(),y:R(.22,.62),p:i*1.7,v:R(.008,.02)}));
 const mist=Array.from({length:7},(_,i)=>({x:i/7,y:.62+(i%3)*.08,r:R(.16,.26),v:R(.004,.012)}));
 const gl=Array.from({length:40},()=>({x:R(.27,.8),y:R(.8,.97),p:R(0,6.3),w:R(.008,.025)}));
 let T=0;
 const task={tick(dt){
  T+=dt/1000*S.speed;c.clearRect(0,0,W,H);if(!S.fx)return;
  c.globalCompositeOperation='lighter';
  /* brume qui dérive */
  for(const m of mist){const x=((m.x+T*m.v)%1.3-.15)*W,y=m.y*H,r=m.r*W,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(150,200,255,.12)');g.addColorStop(1,'rgba(150,200,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
  /* cascade : filets lumineux qui descendent */
  for(let k=0;k<16;k++){const x=(.637+k*.0048)*W,y=(.18+((T*.4+k*.37)%1)*.56)*H,g=c.createLinearGradient(0,y,0,y+.1*H);g.addColorStop(0,'rgba(200,240,255,0)');g.addColorStop(.5,'rgba(220,250,255,.28)');g.addColorStop(1,'rgba(200,240,255,0)');c.fillStyle=g;c.fillRect(x,y,.0032*W,.1*H)}
  /* éclaboussures au pied de la cascade */
  for(let k=0;k<3;k++){const q=(T*.9+k/3)%1,r=(.02+q*.05)*W;c.strokeStyle=`rgba(210,245,255,${.35*(1-q)})`;c.lineWidth=2*S.quality;c.beginPath();c.ellipse(.675*W,.775*H,r,r*.28,0,0,6.3);c.stroke()}
  /* reflets du bassin */
  for(const g of gl){const a=Math.max(0,Math.sin(T*1.6+g.p))*.5;c.fillStyle=`rgba(220,245,255,${a})`;c.fillRect(g.x*W,g.y*H,g.w*W,1.5*S.quality)}
  /* lucioles */
  const n=Math.round(ff.length*S.particles*(S.quality<1?.5:1));
  for(let i=0;i<n;i++){const f=ff[i],x=(f.x+Math.sin(T*f.s*8+f.p)*.02)*W,y=(f.y+Math.cos(T*f.s*6+f.p)*.025)*H,a=.35+.65*Math.max(0,Math.sin(T*1.3+f.p));c.fillStyle=`rgba(255,235,140,${a})`;c.shadowColor='#ffe07a';c.shadowBlur=8*S.quality;c.beginPath();c.arc(x,y,f.r*S.quality,0,6.3);c.fill()}
  /* papillons bleus (vol procédural) */
  for(let i=0;i<Math.round(bf.length*Math.min(S.particles,1.5));i++){const b=bf[i%bf.length],x=((b.x+T*b.v)%1.1-.05)*W,y=(b.y+Math.sin(T*.8+b.p)*.05)*H,w=Math.abs(Math.cos(T*9+b.p))*9*S.quality;c.fillStyle='rgba(120,230,255,.85)';c.shadowColor='#5fd8ff';c.shadowBlur=12*S.quality;c.beginPath();c.ellipse(x-w*.5,y,w,6*S.quality,-.5,0,6.3);c.ellipse(x+w*.5,y,w,6*S.quality,.5,0,6.3);c.fill()}
  c.shadowBlur=0;c.globalCompositeOperation='source-over';
 }};
 const removeTask=NS.add(task),unwatch=NS.watch(stage,task);
 menu={task,destroy(){removeTask();unwatch();resizeObserver.disconnect();c.clearRect(0,0,W,H);menu=null;NS.menuActive=false}};
 NS.menuActive=true;
 return menu;
};
NS.destroyMenu=function(){if(menu)menu.destroy();NS.menuActive=false};
})();
