/* Module MOUVEMENTS — Forêt des Ancêtres. À charger APRÈS decors.js.
   + Grimper (↑/↓ sur échelle ou corde, Espace = sauter)  + Coup plongeant (en l'air : ↓ + X)  + Plané (après le double saut, maintenir Espace) */
(()=>{
const C=window.CLIMB={on:null},_play=window.play;
function impact(){const x=P.x+9,y=P.y+P.h;
  for(const e of E){if(e.dead)continue;const dx=e.x+e.w/2-x;
    if(Math.abs(dx)<90&&Math.abs(e.y+e.h-y)<60){dmg(e,2);if(!ET[e.t].boss){e.kb=12;e.vx=Math.sign(dx||1)*6;e.vy=-4}}}
  EF.push({k:'shock',x,y,both:1,r:90,l:28,c:'#9ff5e0'});shake=Math.max(shake,14);dust(x,y,16,duCol(),1.7);snd('land')}
window.play=function(pad){
  if(state!=='play'||freeze>0||P.sp>0)return _play(pad);
  const upH=down('KeyW','ArrowUp')||pad.dy<0,dnH=down('KeyS','ArrowDown')||pad.dy>0,cx=P.x+P.w/2,Zs=(window.DEC&&DEC.cl)||[];
  const dirH=(down('KeyD','ArrowRight')?1:0)-(down('KeyA','ArrowLeft')?1:0)||pad.dir;
  const inZ=z=>Math.abs(cx-z.x)<=z.hw&&P.y+P.h>z.y0-2&&P.y<z.y1;
  /* grimper */
  if(!C.on&&wing<=0&&P.roll<=0&&P.stun<=0&&(upH||dnH)){
    const z=Zs.find(z=>inZ(z)&&(upH?P.y+P.h<=z.y1+2:P.ground&&Math.abs(P.y+P.h-z.y0)<6));
    if(z){C.on=z;P.vx=P.vy=0;P.x=z.x-P.w/2;if(dnH&&P.ground)P.y+=8;pr.roll=false}}
  let dy=0;
  if(C.on){dy=((dnH?1:0)-(upH?1:0))*2.4;
    if(pr.jump&&!upH){C.on=null;P.vy=-9.5;P.vx=dirH*3.4;P.jumps=1;P.buf=0;pr.jump=false}
    else{pr.jump=pr.roll=false;P.buf=0}}
  /* coup plongeant */
  if(!C.on&&!P.ground&&wing<=0&&P.roll<=0&&pr.atk&&dnH&&!P.dive){P.dive=1;P.vy=13;pr.atk=pr.roll=false;P.want=0;P.inv=Math.max(P.inv,8);snd('roll')}
  const y0=P.y;_play(pad);
  if(C.on&&P.stun>0)C.on=null;
  if(C.on){const z=C.on;P.vx=P.vy=0;P.x=z.x-P.w/2;P.y=y0+dy;P.ground=false;P.jumps=1;
    if(P.y+P.h>=z.y1){P.y=z.y1-P.h;C.on=null}
    else if(P.y+P.h<=z.y0){P.y=z.y0-P.h;C.on=null;P.ground=true}}
  if(P.dive){if(P.ground||C.on){if(P.ground)impact();P.dive=0}else{P.vy=Math.max(P.vy,13);if(fr%2===0)burst(P.x+9,P.y+P.h,'#9ff5e0',2)}}
  /* plané */
  else if(!P.ground&&!C.on&&wing<=0&&P.jumps>=2&&(down('Space','ArrowUp','KeyW')||pad.held)&&P.vy>2.4){P.vy=2.4;if(fr%6===0)burst(P.x+9,P.y+P.h,'#5fe2ff',1)}
};
})();
