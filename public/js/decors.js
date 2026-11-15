/* Module DÉCORS — Forêt des Ancêtres. À charger APRÈS le script principal.
   Ajoute : décors de fond, plateformes (à traverser par le haut), échelles et cordes (grimpables). F2 = hitboxes. */
(()=>{
const BASE='assets/decors/',IM={},img=id=>IM[id]||(IM[id]=Object.assign(new Image(),{src:BASE+id+'.png'}));
const DEC=window.DEC={far:[],near:[],plats:[],cl:[],fog:[],debug:false};
const SY={p1_r4_c1:.2,p1_r4_c2:.17,p1_r4_c3:.2,p1_r1_c4:.14,p1_r1_c5:.16,p1_r2_c6:.44,p2_r2_c1:.3,p2_r2_c2:.3,p2_r2_c7:.4,p1_r4_c4:.1,p1_r4_c5:.1};
const TW={p1_r4_c4:[2.5,3.5],p1_r4_c5:[2.5,3.5],p1_r2_c6:[9,12],p2_r2_c7:[4,5],p2_r2_c1:[6,9],p2_r2_c2:[6,9]};
const LAD=['p1_r3_c6','p1_r3_c7','p1_r3_c8'],ROP=['p1_r3_c1','p1_r3_c2','p1_r3_c3','p1_r3_c4','p1_r3_c5'];
/* un kit par zone : far = grands décors, near = petits décors au sol, plat = plateformes, fh = hauteur des grands décors */
const KIT=[
 {far:['p2_r5_c2','p2_r5_c3'],near:['p2_r6_c1','p2_r5_c5','p2_r6_c2','p2_r3_c2'],plat:['p1_r4_c1','p1_r4_c2','p1_r4_c3','p1_r1_c5'],fh:[190,260]},
 {far:['p2_r5_c1','p2_r5_c3'],near:['p2_r6_c3','p2_r3_c3','p2_r6_c2'],plat:['p2_r2_c1','p2_r2_c2','p1_r4_c4','p1_r4_c2'],fh:[150,220]},
 {far:['p2_r4_c1','p2_r4_c2'],near:['p2_r4_c3','p2_r4_c7','p2_r6_c2'],plat:['p1_r1_c4','p1_r1_c5','p1_r2_c6'],fh:[200,280],fog:1},
 {far:['p2_r5_c3','p2_r5_c2'],near:['p2_r3_c1','p2_r3_c3','p2_r6_c3','p2_r3_c5','p2_r3_c6'],plat:['p2_r2_c7','p1_r4_c3','p2_r2_c1'],fh:[170,240]},
 {far:['p2_r5_c1','p2_r5_c2'],near:['p2_r5_c6','p2_r6_c2','p2_r3_c2'],plat:['p1_r4_c5','p1_r1_c5','p1_r4_c2'],fh:[170,250]},
 {far:['p2_r5_c1'],near:['p2_r5_c6','p2_r6_c2','p1_r4_c6'],plat:['p1_r1_c5','p1_r4_c5','p1_r4_c3'],fh:[150,210]}];
function make(z){
  DEC.far=[];DEC.near=[];DEC.plats=[];DEC.cl=[];DEC.fog=[];
  const k=KIT[Math.min(z,KIT.length-1)],g=15*T;let s=z*7919+101;
  const R=()=>(s=s*16807%2147483647)/2147483647,pk=a=>a[Math.floor(R()*a.length)],ra=(a,b)=>a+R()*(b-a);
  const keep=x=>[3,8,30,50,100,150,200,W-3].some(f=>Math.abs(f-x)<4)||(BZ[z]&&x>W-38);
  for(let x=4;x<W-4;x+=4+R()*8)DEC.far.push({id:pk(k.far),x:x*T,h:ra(k.fh[0],k.fh[1]),a:ra(.4,.65)});
  for(let x=3;x<W-3;x+=3+R()*6)if(!keep(x))DEC.near.push({id:pk(k.near),x:x*T,h:ra(30,70)});
  if(k.fog)for(let x=0;x<W;x+=10)DEC.fog.push({x:x*T+R()*200,y:g-60-R()*70,h:ra(70,120)});
  const free=(x0,n,r)=>{for(let row=r-2;row<=r+2;row++)for(let c=x0-1;c<=x0+n+1;c++)if(row>=0&&row<H&&(c<0||c>=W||M[row][c]!==' '))return false;return true};
  for(let tx=16;tx<W-16;tx+=11+R()*10){
    if(keep(tx))continue;const id=pk(k.plat),tw=TW[id]||[5,8],t=ra(tw[0],tw[1]),r=pk([12,11,12,10]),x0=Math.floor(tx),n=Math.ceil(t);
    if(!free(x0,n,r))continue;
    DEC.plats.push({id,x:x0*T,y:r*T,w:t*T,sy:SY[id]??.17});
    let ok=true;for(let row=r;row<15;row++)if(M[row][x0+1]!==' ')ok=false;
    if(!ok)continue;
    if(R()<.55)DEC.cl.push({k:'l',id:pk(LAD),x:x0*T+T*.9,y0:r*T,y1:g,hw:16});
    else DEC.cl.push({k:'r',id:pk(ROP),x:x0*T+t*T-T*.9,y0:r*T,y1:Math.min(g-8,r*T+150),hw:12})
  }
  if(!DEC.plats.length){
    for(let tx=16;tx<W-16;tx++){
      if(keep(tx))continue;
      const x0=Math.floor(tx);
      let placed=false;
      for(const id of k.plat){
        const tw=TW[id]||[5,8],t=tw[0],n=Math.ceil(t);
        for(const r of [11,12,10]){
          if(!free(x0,n,r))continue;
          DEC.plats.push({id,x:x0*T,y:r*T,w:t*T,sy:SY[id]??.17});
          let clear=true;
          for(let row=r;row<15;row++)if(M[row][x0+1]!==' ')clear=false;
          if(clear)DEC.cl.push({k:'l',id:pk(LAD),x:x0*T+T*.9,y0:r*T,y1:g,hw:16});
          placed=true;
          break;
        }
        if(placed)break;
      }
      if(placed)break;
    }
  }
}
const vis=(x,w)=>x+w>cam-40&&x<cam+VW+40;
function spr(id,x,yb,h,a){const m=img(id);if(!m.complete||!m.naturalWidth)return;const sc=h/m.naturalHeight,w=m.naturalWidth*sc;if(!vis(x,w))return;ctx.globalAlpha=a;ctx.drawImage(m,x,yb-h,w,h)}
function back(){const g=15*T;
  for(const f of DEC.far)spr(f.id,f.x,g+6,f.h,f.a);
  for(const p of DEC.plats){const m=img(p.id);if(!m.complete||!m.naturalWidth||!vis(p.x,p.w))continue;const h=m.naturalHeight*p.w/m.naturalWidth;ctx.globalAlpha=1;ctx.drawImage(m,p.x,p.y-p.sy*h,p.w,h)}
  for(const c of DEC.cl){const m=img(c.id);if(!m.complete||!m.naturalWidth||!vis(c.x-30,60))continue;const h=c.y1-c.y0,w=Math.min(60,m.naturalWidth*h/m.naturalHeight);ctx.globalAlpha=1;ctx.drawImage(m,c.x-w/2,c.y0,w,h)}
  ctx.globalAlpha=1}
function front(){const g=15*T;
  for(const n of DEC.near)spr(n.id,n.x,g+8,n.h,1);
  for(const f of DEC.fog){const x=f.x+Math.sin(fr*.004+f.x)*40;spr('p2_r4_c6',x,f.y+f.h,f.h,.3)}
  ctx.globalAlpha=1;
  if(DEC.debug){ctx.lineWidth=2;ctx.strokeStyle='#ff0';for(const p of DEC.plats)ctx.strokeRect(p.x+p.w*.06,p.y,p.w*.88,4);ctx.strokeStyle='#0ff';for(const c of DEC.cl)ctx.strokeRect(c.x-c.hw,c.y0,c.hw*2,c.y1-c.y0)}}
const _build=window.build;window.build=function(z){_build(z);make(z)};
const _world=window.world;window.world=function(){back();_world();front()};
/* collisions : plateformes à traverser par le haut */
const _moveY=window.moveY;window.moveY=function(o,dy){const pb=o.y+o.h;_moveY(o,dy);
  if(dy>=0&&!o.ground&&!(o===P&&window.CLIMB&&CLIMB.on))for(const p of DEC.plats)
    if(o.x+o.w>p.x+p.w*.06&&o.x<p.x+p.w*.94&&pb<=p.y+3&&o.y+o.h>=p.y){o.y=p.y-o.h;o.vy=0;o.ground=true;o.mp=null;return}};
addEventListener('keydown',e=>{if(e.code==='F2')DEC.debug=!DEC.debug});
})();
