import React,{useEffect,useRef} from 'react';
import EarlyAccessLink from './EarlyAccessLink';

export default function CompletionCelebration({venue,onExplore,onReset}:{venue:boolean;onExplore:()=>void;onReset:()=>void}) {
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
 const milestones=venue?['Opened a night','Connected','Sent terms']:['Found a venue','Connected','Agreed terms'];
 return <section className="demo-congratulations celebration" role="dialog" aria-labelledby="celebration-title">
  <div className="celebration-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,background:['#ff6f00','#ffb260','#111111','#d9c9b8'][i%4],width:i%3===0?7:5,height:i%3===0?7:15,borderRadius:i%3===0?'50%':'2px',animationDelay:`${(i%6)*.09}s`, '--drift':`${i%2===0?1:-1}00px`} as React.CSSProperties}/>)}</div>
  <div className="celebration-content">
   <div className="celebration-eyebrow"><span/> DEMO COMPLETE <b>100%</b></div>
   <div className="celebration-emblem" aria-hidden="true"><span className="celebration-orbit"/><div className="demo-success-mark"><svg viewBox="0 0 48 48" fill="none"><path d="m12 25 8 8 17-19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></div><span className="celebration-star">✦</span><span className="celebration-star small">✦</span></div>
   <h2 id="celebration-title" ref={heading} tabIndex={-1}>You made<br/><em>it happen.</em></h2>
   <p className="celebration-message">{venue?'An open night. A local artist. Terms sent.':'A local venue. A conversation. Your next stage.'}<br/>That’s the CLEF experience.</p>
   <ol className="celebration-milestones">{milestones.map(label=><li key={label}><span aria-hidden="true">✓</span>{label}</li>)}</ol>
   <div className="celebration-actions"><EarlyAccessLink primary/><button className="completion-explore" onClick={onExplore}>Keep exploring <span aria-hidden="true">→</span></button></div>
   <small className="early-access-note">Early access opens in a new tab. Your demo stays here.</small>
   <button className="completion-switch" onClick={onReset}>{venue?'Try the musician side':'Try the venue side'}</button>
   <p className="celebration-disclaimer">Sample demo only. Nothing was sent or reserved.</p>
  </div>
 </section>;
}
