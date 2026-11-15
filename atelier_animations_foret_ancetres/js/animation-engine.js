/* Le moteur est piloté par la boucle RAF du jeu. */
(function(){
const NS=window.ForetAtelier=window.ForetAtelier||{};
const S=NS.settings={speed:1,particles:1,fx:true,quality:1,fps:60};
const cache=new Map(),tasks=new Set(),watchers=new Set();
const script=document.currentScript;
if(!script)throw new Error('Le moteur ForetAtelier doit être chargé depuis un script.');
NS.assetBase=new URL('../',script.src).href;
NS.loadImage=src=>{
 const url=new URL(src,NS.assetBase).href;
 if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('Image introuvable : '+url));
  image.src=url;
 }));
 return cache.get(url)
};
class Sprite{
 constructor(manifest,image){Object.assign(this,manifest);this.img=image;this.t=0;this.playing=true}
 get frame(){return Math.floor(this.t/1000*this.fps)%this.frames}
 step(dt){if(this.playing)this.t+=dt*S.speed}
 restart(){this.t=0;this.playing=true}
 draw(ctx,x,y,h,frame){const k=h/this.fh;ctx.drawImage(this.img,(frame==null?this.frame:frame)*this.fw,0,this.fw,this.fh,x,y,this.fw*k,h)}
 drawFit(ctx,width,height){const k=Math.min(width/this.fw,height/this.fh)*.94,w=this.fw*k,h=this.fh*k;ctx.drawImage(this.img,this.frame*this.fw,0,this.fw,this.fh,(width-w)/2,(height-h)/2,w,h)}
}
NS.Sprite=Sprite;
NS.makeSprite=async name=>{
 const manifest=NS.manifest&&NS.manifest[name];
 if(!manifest)throw new Error('Animation inconnue : '+name);
 return new Sprite(manifest,await NS.loadImage(manifest.src))
};
NS.initEngine=function(){NS.engineActive=true;return NS};
NS.destroyEngine=function(){
 NS.engineActive=false;tasks.clear();
 for(const observer of watchers)observer.disconnect();
 watchers.clear()
};
NS.add=task=>{
 if(!task||typeof task.tick!=='function')throw new TypeError('Une tâche ForetAtelier doit fournir tick(dt).');
 tasks.add(task);
 return ()=>NS.remove(task)
};
NS.remove=task=>tasks.delete(task);
NS.step=dt=>{
 if(!NS.engineActive)return;
 for(const task of tasks)if(task.visible!==false)task.tick(dt)
};
NS.watch=(element,task)=>{
 if(typeof IntersectionObserver==='undefined'){task.visible=true;return ()=>{}}
 task.visible=false;
 const observer=new IntersectionObserver(entries=>{task.visible=entries[0].isIntersecting});
 observer.observe(element);watchers.add(observer);
 return ()=>{observer.disconnect();watchers.delete(observer)}
};
NS.rand=(min,max)=>min+Math.random()*(max-min);
})();
