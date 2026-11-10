import {useVenueJourney,venueQuickReplies} from './musicianFlow';
import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {demoShowDateKey} from '@/components/demo/demoFixtures';
import {appTextElements} from './ui';
import type {GuideSignals} from './model';

// One floating hint follows the actual next control. It never captures input.
export default function VenueTapCue({phase,pathname,signals,applicantVisited}:{phase:string;pathname:string;signals:GuideSignals;applicantVisited:boolean}) {
 const journey=useVenueJourney();
 const cue=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let marked:HTMLElement|null=null;
  let frame=0;
  const place=()=>{
   frame=0;
   const hint=cue.current;
   if(!hint)return;
   if(!marked?.isConnected||document.querySelector('.conference-splash')){hint.hidden=true;return;}
   for(let node:HTMLElement|null=marked;node;node=node.parentElement){
    if(Number(getComputedStyle(node).opacity)<0.1){hint.hidden=true;return;}
   }
   const rect=marked.getBoundingClientRect();
   const bottom=document.querySelector('.conference-chrome')?.getBoundingClientRect().top??window.innerHeight;
   const x=rect.left+rect.width/2;
   // Never pin an offscreen target's hint to an unrelated edge of the screen.
   const hit=document.elementFromPoint(x,rect.top+Math.min(rect.height/2,10));
   if(!rect.width||rect.top<38||rect.bottom>bottom||x<30||x>window.innerWidth-30||!hit||!marked.contains(hit)){
    hint.hidden=true;return;
   }
   hint.style.left=`${x}px`;
   hint.style.top=`${rect.top-34}px`;
   hint.hidden=false;
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(place);};
  const resize=new ResizeObserver(schedule);
  const update=()=>{
   const text=signals.acceptSent?(appTextElements().some(el=>el.textContent?.trim()==='Open conversation')?'Open conversation':'Continue'):signals.acceptCompose?'Send message'
    :pathname.startsWith('/chat/')?(journey.messages<2?venueQuickReplies(journey.messages)[0]:'Confirm Booking')
    :phase==='accepted'?'Message'
    :pathname==='/pipeline'?(applicantVisited?'Accept':'The Copper Hollow')
    :signals.dateSetup?'Open this date'
    :signals.timePicker?(signals.timeChosen?'Confirm':'Evening (5–9 PM)')
    :signals.availability?(phase==='open'||phase==='applied'?'Go to Booking Pipeline':'Open Date for Music')
    :phase==='open'||phase==='applied'?(pathname==='/calendar'?'Dashboard':'Booking Pipeline'):null;
   const wizardAction=appTextElements().find(el=>['Send to musician','Continue'].includes(el.textContent?.trim()??'') && el.closest('[aria-modal="true"]'));
   const dashboardTab=text==='Dashboard'?Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).find(el=>el.textContent?.trim()==='Dashboard'&&el.getClientRects().length)??null:null;
   const appTarget=wizardAction??dashboardTab??(text?appTextElements().find(el=>el.textContent?.trim().toLowerCase()===text.toLowerCase())??null
    :pathname==='/calendar'?Array.from(document.querySelectorAll<HTMLElement>(`[data-testid^="calendar-day-${demoShowDateKey()}"]`)).find(el=>el.getClientRects().length&&!el.closest('[data-state="inactive"]'))??null:null);
   const label=journey.termsSent?null:appTarget;
   const target=label?.closest<HTMLElement>('[role="tab"], button, [role="button"], [tabindex="0"], [data-testid^="calendar-day-"]')??label?.parentElement??null;
   if(target!==marked){
    resize.disconnect();
    marked?.removeAttribute('data-venue-cue-anchor');
    marked=target;
    if(marked&&marked.getAttribute('role')!=='tab'&&!marked.dataset.testid?.startsWith('calendar-day-'))marked.setAttribute('data-venue-cue-anchor','');
    if(marked)resize.observe(marked);
   }
   schedule();
  };
  const observer=new MutationObserver(records=>{if(records.every(record=>record.target instanceof Element&&record.target.closest('.venue-floating-cue')))return;update();});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-hidden','data-state','style']});
  document.addEventListener('scroll',schedule,true);
  window.addEventListener('resize',schedule);
  update();
  return()=>{observer.disconnect();resize.disconnect();marked?.removeAttribute('data-venue-cue-anchor');cancelAnimationFrame(frame);document.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);};
 },[phase,pathname,signals,applicantVisited,journey]);
 return createPortal(<div ref={cue} hidden className="venue-floating-cue" aria-hidden="true"><span className="venue-floating-cue-label">Tap me<span>↓</span></span></div>,document.body);
}
