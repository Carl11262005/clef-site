import React, {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {router} from 'expo-router';
import {DemoStage,MusicianDemoStage} from '@/components/demo/demoStore';
import {demoShowDateLabel,demoShowDateKey} from '@/components/demo/demoFixtures';
import {getGuideStep,emptySignals,type GuideRole,type GuideAction} from './model';
import {initialGuideExpanded,nextGuideExpanded} from './presentation';
import {appTextElements,readGuideSignals} from './ui';
import type {DemoPersona} from '../app';
import {useVenueJourney,venueTermsGuidance} from './musicianFlow';
import VenueTapCue from './VenueTapCue';
import EarlyAccessLink from './EarlyAccessLink';
import CompletionCelebration from './CompletionCelebration';

export default function ConferenceGuide({role,persona,stage,pathname,onReset}:{role:GuideRole;persona:DemoPersona;stage:number;pathname:string;onReset:()=>void}){
 const venueJourney=useVenueJourney();
 const [expanded,setExpanded]=useState(initialGuideExpanded);
 const [signals,setSignals]=useState(emptySignals);
 const [modal,setModal]=useState<HTMLElement|null>(null);
 const [applicantVisited,setApplicantVisited]=useState(false);
 useEffect(()=>{if(role==='venue'&&pathname.startsWith('/musician/'))setApplicantVisited(true);},[pathname,role]);
 useEffect(()=>{
  let queued=false,alive=true;
  const read=()=>{queued=false;if(!alive)return;const next=readGuideSignals();setModal(Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]')).filter(element=>element.getClientRects().length>0).at(-1)??null);setSignals(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);};
  const observer=new MutationObserver(records=>{
   if(queued||records.every(record=>record.target instanceof Element&&record.target.closest('.conference-chrome')))return;
   queued=true;queueMicrotask(read);
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-hidden','data-state']});
  read();
  return()=>{alive=false;observer.disconnect();};
 },[]);
 const phase=role==='musician'
  ?stage>=MusicianDemoStage.Booked?'booked':stage>=MusicianDemoStage.OfferReceived?'offer':stage>=MusicianDemoStage.TimeAgreed?'time-agreed':stage>=MusicianDemoStage.InContact?'in-contact':stage>=MusicianDemoStage.Applied?'applied':'browse'
  :stage>=DemoStage.Accepted||pathname.startsWith('/chat/')?'accepted':stage>=DemoStage.Applied?'applied':stage>=DemoStage.NightOpen?'open':'browse';
 const originalGuide=getGuideStep({role,phase,pathname,dateLabel:demoShowDateLabel(),applicantVisited,signals});
 const guide=role==='venue'&&phase==='accepted'?{...originalGuide,complete:venueJourney.termsSent,title:venueJourney.termsSent?'Demo booking terms sent':pathname.startsWith('/chat/')?(venueJourney.messages===0?'Send your first message':venueJourney.messages===1?'Send your second message':venueTermsGuidance[venueJourney.wizardStep][0]):'Open the artist conversation',body:venueJourney.termsSent?'You completed the venue journey. Sample terms only — nothing was sent to a real musician.':pathname.startsWith('/chat/')?(venueJourney.messages<2?'Tap the suggested reply, or type your own below. Exchange set time and pay details before sending terms.':venueTermsGuidance[venueJourney.wizardStep][1]):'Tap Message on The Copper Hollow’s application to continue with two replies and booking terms.',action:undefined}:role==='musician'&&phase==='offer'?{...originalGuide,complete:false,title:'Confirm your demo gig',body:'Open View terms, review the sample agreement, then tap Accept & confirm. This completes the demo; no real reservation is made.'}:role==='venue'?{...originalGuide,...(signals.acceptCompose||signals.acceptSent||phase==='accepted'
  ?{section:'Start a conversation',step:signals.acceptCompose?1:signals.acceptSent?2:3,total:3}
  :phase==='open'||phase==='applied'
   ?{section:'Review applicants',step:applicantVisited?2:1,total:2}
   :{section:'Open a date',total:2})}:originalGuide;
 const roleLabel=persona==='band'?'Band':role==='musician'?'Musician':'Venue';
 const confirmed=role==='musician'?phase==='booked':venueJourney.termsSent;
 const steps=role==='musician'?['Venue','Apply','Chat','Confirm']:['Open date','Review','Chat','Terms'];
 const current=role==='musician'?(confirmed?4:phase==='offer'?3:phase==='time-agreed'?2.7:phase==='in-contact'?2:pathname.includes('ApplyNightSheet')?1.5:pathname.startsWith('/venue/')?1:0)
  :venueJourney.termsSent?4:phase==='accepted'?(2+venueJourney.messages/2+(venueJourney.wizardStep?venueJourney.wizardStep/8:0)):signals.acceptSent?1.9:signals.acceptCompose?1.8:phase==='applied'?1.5:phase==='open'?1:0;
 const [furthest,setFurthest]=useState(0);
 const progress=Math.max(current,furthest);
 useEffect(()=>{setFurthest(value=>Math.max(value,current));},[current]);
 const percent=Math.round(progress/steps.length*100);
 const [celebrationDismissed,setCelebrationDismissed]=useState(false);
 const [exploring,setExploring]=useState(false);
 const keepExploring=()=>{
  setCelebrationDismissed(true);
  setExpanded(false);
  setExploring(true);
  router.replace('/(tabs)/listingsTabRouter');
 };
 useEffect(()=>{setExpanded(current=>nextGuideExpanded(current,'step_changed'));},[guide.step,guide.title]);
 useEffect(()=>{
  // Full instructions expand over the dock only on request. They must not
  // compress the app or change the native screens' internal spacing.
  const dock=document.querySelector<HTMLElement>(exploring?'.exploration-controls':'.journey-tracker');
  if(!dock)return;
  const measure=()=>document.documentElement.style.setProperty('--guide-space',`${Math.ceil(dock.getBoundingClientRect().height)}px`);
  const observer=new ResizeObserver(measure);observer.observe(dock);measure();
  return()=>observer.disconnect();
 },[expanded,exploring]);
 useEffect(()=>()=>{document.documentElement.style.removeProperty('--guide-space');},[]);
 const runAction=(action:GuideAction)=>{
  setExpanded(current=>nextGuideExpanded(current,'guide_action'));
  if(action.kind==='navigate'){router.push(action.path);return;}
  if(action.kind==='back'){if(router.canGoBack())router.back();return;}
  const target=action.text==='__demo-calendar-day__'
   ?document.querySelector<HTMLElement>(`[data-testid^="calendar-day-${demoShowDateKey()}"]`)
   :appTextElements().find(element=>element.textContent?.trim().toLowerCase()===action.text.toLowerCase());
  target?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 };
 if(exploring)return <div className="exploration-controls"><span>Sample demo</span><EarlyAccessLink/><button onClick={onReset}>Restart / switch role</button></div>;
 return <>{role==='venue'&&<VenueTapCue phase={phase} pathname={pathname} signals={signals} applicantVisited={applicantVisited}/ >}{confirmed&&!celebrationDismissed&&<CompletionCelebration venue={role==='venue'} onExplore={keepExploring} onReset={onReset}/>}{expanded&&modal&&createPortal(<div className="conference-guide-announcement" role="status" aria-live="polite">{guide.title} {guide.body}</div>,modal)}{expanded?<section className="conference-guide" aria-label={`${roleLabel} demo guide`}>
  <div className="guide-topline"><span className="guide-kicker">Your CLEF journey</span><span className="guide-count">{percent}% complete</span></div>
  <div id="conference-guide-content">
   <div className="guide-copy" aria-live="polite" aria-atomic="true"><h2>{guide.title}</h2><p>{guide.body}</p></div>
   {guide.action&&<button type="button" className="guide-action" onClick={()=>runAction(guide.action!)}>{guide.action.label}</button>}
   {guide.complete&&<div className="guide-complete-actions"><button type="button" className="guide-action" onClick={keepExploring}>Keep exploring</button><button type="button" className="guide-action" onClick={onReset}>Try the other side</button><a className="guide-contact" href="mailto:carlton@clefapp.net">Connect with CLEF</a></div>}
   <div className="guide-progress" aria-hidden="true">{Array.from({length:guide.total},(_,index)=><span key={index} className={index<guide.step?(guide.complete?'done':'current'):''}/>)}</div>
   <div className="guide-footer"><button type="button" onClick={onReset}>Switch role</button><button type="button" aria-expanded="true" aria-controls="conference-guide-content" onClick={()=>setExpanded(current=>nextGuideExpanded(current,'visitor_minimized'))}>Minimize</button></div>
  </div>
 </section>:<section className="journey-tracker" aria-label={`${roleLabel} demo progress`}><button className="journey-next" aria-expanded="false" onClick={()=>setExpanded(true)}><span>{role==='musician'&&phase==='offer'?'Review terms, then confirm':guide.title}<span aria-hidden="true"> ↗</span></span><strong>{percent}%</strong></button><div className="journey-rail" role="progressbar" aria-label="Demo progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div><ol>{steps.map((label,index)=><li key={label} aria-current={Math.floor(progress)===index?'step':undefined} className={progress>=index+1?'finished':''}>{progress>=index+1?'✓ ':''}{label}</li>)}</ol></section>}</>;
}
