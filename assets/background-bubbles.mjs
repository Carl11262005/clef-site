// Only decorative pseudo-elements move. Content, scrolling, and hit targets do not.
export function initBackgroundBubbles(doc, view) {
 if(!doc?.querySelectorAll||!view?.IntersectionObserver||!view.matchMedia)return ()=>{};
 const hosts=[...doc.querySelectorAll('.story-scene,.audience-hero,.audience-scene,.app-showcase,.company-section,.company-layout,.signup-section,.about-mission,.founder-section,.founder-bubble,.prototype-section')];
 const layers=[];
 const preference=view.matchMedia('(prefers-reduced-motion: reduce)');
 const control=doc.querySelector('[data-video-toggle]');
 const visible=new Set();
 const sync=()=>{
  const allowed=!preference.matches&&!doc.hidden&&control?.getAttribute('aria-pressed')!=='false';
  for(const host of hosts)host.style.setProperty('--bubble-play-state',allowed&&visible.has(host)?'running':'paused');
 };
 hosts.forEach((host,index)=>{
  // Add two small companions to each section, rather than covering the page
  // with another full-screen layer. The video hero is deliberately excluded.
  if(!host.matches('.company-layout,.founder-bubble')){
   const layer=doc.createElement('div');
   layer.className='background-bubbles';
   layer.setAttribute('aria-hidden','true');
   for(let i=0;i<2;i++){
    const bubble=doc.createElement('span');
    bubble.className='background-bubble';
    layer.appendChild(bubble);
   }
   host.prepend(layer);
   layers.push(layer);
  }
  host.dataset.bubbleReady='true';
  host.style.setProperty('--bubble-duration',`${14+(index%3)*2}s`);
  host.style.setProperty('--bubble-delay',`${-4-(index%4)*3}s`);
 });
 const observer=new view.IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}
  sync();
 },{threshold:0});
 hosts.forEach(host=>observer.observe(host));
 const controlsObserver=control&&view.MutationObserver?new view.MutationObserver(sync):null;
 controlsObserver?.observe(control,{attributes:true,attributeFilter:['aria-pressed']});
 preference.addEventListener?.('change',sync);
 doc.addEventListener('visibilitychange',sync);
 sync();
 return ()=>{
  observer.disconnect();controlsObserver?.disconnect();
  preference.removeEventListener?.('change',sync);
  doc.removeEventListener('visibilitychange',sync);
  layers.forEach(layer=>layer.remove());
  for(const host of hosts){
   delete host.dataset.bubbleReady;
   for(const name of ['--bubble-play-state','--bubble-duration','--bubble-delay'])host.style.removeProperty(name);
  }
 };
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initBackgroundBubbles(document,window);
