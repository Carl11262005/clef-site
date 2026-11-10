export function initPrototype(root){
 if(root.dataset.initialized)return;
 root.dataset.initialized='true';
 const frame=root.querySelector('iframe');
 const cover=root.querySelector('[data-prototype-cover]');
 const status=root.querySelector('[data-prototype-status]');
 const restart=root.querySelector('[data-prototype-restart]');
 const utilities=root.querySelector('.prototype-utilities');
 const help=root.querySelector('[data-prototype-help]');
 const roles=[...root.querySelectorAll('[data-prototype-role]')];
 let role=root.dataset.prototypeRole;
 let started=false,timer;
 const url=()=>`/prototype/demo/?role=${role}`;
 const sync=()=>{
  frame.title=`CLEF ${role==='venue'?'venue':role==='band'?'band':'musician'} interactive demo — sample data`;
  roles.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.prototypeRole===role)));
 };
 const start=()=>{
  clearTimeout(timer);
  started=true;
  utilities.hidden=false;
  restart.hidden=false;
  help.textContent='Restart Demo takes you back to the beginning.';
  cover.hidden=true;
  frame.hidden=false;
  status.hidden=false;
  status.textContent='Opening CLEF…';
  frame.src=url();
  timer=setTimeout(()=>{
   status.hidden=true;
   help.textContent='Taking longer than expected? Tap Restart Demo to try again.';
  },25000);
 };
 frame.addEventListener('load',()=>{
  if(!started)return;
  clearTimeout(timer);
  status.hidden=true;
  frame.focus({preventScroll:true});
 });
 root.querySelector('[data-prototype-start]').addEventListener('click',start);
 restart.addEventListener('click',()=>{
  start();
  frame.focus({preventScroll:true});
 });
 for(const button of roles)button.addEventListener('click',()=>{
  if(role===button.dataset.prototypeRole)return;
  role=button.dataset.prototypeRole;
  sync();
  if(started)start();
 });
 sync();
 root.querySelector('[data-prototype-controls]').hidden=false;
 const personas=root.querySelector('.prototype-personas');
 if(personas)personas.hidden=false;
 root.querySelector('[data-prototype-nojs]').hidden=true;
}
if(typeof document!=='undefined')document.querySelectorAll('[data-prototype]').forEach(initPrototype);
