export type GuideRole = 'musician' | 'venue';
export type GuidePhase = 'browse' | 'applied' | 'in-contact' | 'time-agreed' | 'offer' | 'booked' | 'open' | 'accepted';
export type GuideSignals = {
 venueSelected: boolean;
 dateSetup: boolean;
 availability: boolean;
 timePicker: boolean;
 timeChosen: boolean;
 acceptCompose: boolean;
 acceptSent: boolean;
 bookingTerms: boolean;
};
export const emptySignals: GuideSignals = {venueSelected:false,dateSetup:false,availability:false,timePicker:false,timeChosen:false,acceptCompose:false,acceptSent:false,bookingTerms:false};
export type GuideAction =
 | {kind:'navigate'; label:string; path:'/discoverVenues'|'/calendar'|'/pipeline'|'/messages'|'/listingsTabRouter'}
 | {kind:'scroll'; label:string; text:string}
 | {kind:'back'; label:string};
export type GuideStep = {step:number;total:number;title:string;body:string;section?:string;complete?:boolean;action?:GuideAction};
export type GuideContext = {role:GuideRole;phase:GuidePhase;pathname:string;dateLabel:string;applicantVisited:boolean;signals:GuideSignals};

// Instructions follow the real screen and demo milestones, never a timer or
// a manually advanced checklist. Detours are welcome and never reset progress.
export function getGuideStep({role,phase,pathname,dateLabel,applicantVisited,signals:s}:GuideContext):GuideStep {
 if(role==='musician'){
  if(phase==='booked'||s.bookingTerms)return {step:3,total:3,section:'Messages',complete:true,title:'You reached the booking terms',body:'This is the real review step in CLEF, using sample terms. Nothing was submitted or booked.'};
  if(phase==='offer')return pathname.startsWith('/chat/')
   ?{step:3,total:3,section:'Messages',title:'View booking terms',body:'The venue sent the sample offer. Tap View terms in the chat header or the orange terms banner.'}
   :{step:3,total:3,section:'Messages',title:'Open the venue conversation',body:'Tap the conversation for the night you applied to, then choose View terms.',action:{kind:'navigate',label:'Go to Messages',path:'/messages'}};
  if(phase==='time-agreed')return pathname.startsWith('/chat/')
   ?{step:2,total:3,section:'Messages',title:'Send your second reply',body:'Tap a quick reply to agree on the $300 pay, or type your own. The venue will then send sample booking terms.'}
   :{step:2,total:3,section:'Messages',title:'Return to the venue reply',body:'Open the conversation for your applied night and send the second message.',action:{kind:'navigate',label:'Go to Messages',path:'/messages'}};
  if(phase==='in-contact')return pathname.startsWith('/chat/')
   ?{step:1,total:3,section:'Messages',title:'Send your first reply',body:'Tap a quick reply to confirm the 9–11 set time, or type your own. The venue will reply with the sample pay.'}
   :{step:1,total:3,section:'Messages',title:'Open the venue reply',body:'Tap the conversation for the night you just applied to. The venue is asking about set time.'};
  if(phase==='applied')return {step:1,total:3,section:'Messages',title:'Opening the venue conversation',body:'Demo application — nothing submitted. CLEF is taking you directly to the venue reply.'};
  if(pathname.includes('ApplyNightSheet'))return {step:3,total:3,title:'Send your demo application',body:'Your sample profile is ready. Tap Send application at the bottom — no typing or personal details needed.'};
  if(pathname.startsWith('/musician/'))return {step:3,total:3,title:'Preview your sample profile',body:'This is what the venue would see. Go back when you’re ready to send the demo application.',action:{kind:'back',label:'Back to application'}};
  if(pathname.startsWith('/venue/'))return {step:2,total:3,title:'Choose an open night',body:`Scroll to Open nights and tap ${dateLabel} to apply.`,action:{kind:'scroll',label:'Show open nights ↓',text:'Open nights'}};
  if(pathname.startsWith('/discoverVenues'))return s.venueSelected
   ?{step:1,total:3,title:'Take a look inside the venue',body:'Tap View full profile on The Lamplighter Room’s preview below.'}
   :{step:1,total:3,title:'Find a place to play',body:'Tap The Lamplighter Room on the map, or choose Cards.'};
  return {step:1,total:3,title:'Explore at your own pace',body:'When you’re ready, head to Discover and open The Lamplighter Room to try applying for a gig.',action:{kind:'navigate',label:'Go to Discover',path:'/discoverVenues'}};
 }
 if(phase==='accepted')return {step:4,total:4,complete:true,title:'You’ve started a conversation.',body:'The act is now In Contact. Tap Message to explore the sample chat, or try the musician side. No real changes were made.'};
 if(s.acceptSent)return {step:4,total:4,title:'Continue in messages',body:'Tap Open conversation to message the musician you just accepted. Send two replies, then review booking terms.'};
 if(s.acceptCompose)return {step:4,total:4,title:'Welcome the musician',body:'Use the filled-in starter or edit it in the message box, then tap Send message. This message stays inside the demo.'};
 if(phase==='open'||phase==='applied'){
  if(pathname.startsWith('/musician/'))return {step:3,total:4,title:'Get to know the applicant',body:'Explore the musician’s profile. Then go back to the pipeline to start a conversation.',action:{kind:'back',label:'Back to applicants'}};
  if(pathname==='/pipeline'&&phase==='open')return {step:3,total:4,title:'Your demo date is open',body:'A sample application will appear here in a moment. Then you can review the musician.'};
  if(pathname==='/pipeline')return applicantVisited
   ?{step:4,total:4,title:'Start the conversation',body:'Tap Accept on The Copper Hollow’s application. You’ll preview a welcome message before continuing.'}
   :{step:3,total:4,title:'Review the sample applicant',body:'Tap The Copper Hollow to see their profile. You can also tap Accept when you’re ready to talk.'};
  if(pathname==='/calendar'&&!s.availability&&!s.dateSetup)return {step:3,total:4,title:'Go to your Dashboard',body:'Your date is open. Tap Dashboard below, then open Booking Pipeline to review the sample applicant.',action:{kind:'navigate',label:'Go to Dashboard →',path:'/listingsTabRouter'}};
  if(s.availability)return {step:3,total:4,title:'Your demo date is open',body:'Tap Go to Booking Pipeline in the menu below to review the sample application.'};
  return {step:3,total:4,title:'Now review an application',body:'Your demo date is open. A sample musician applies next. Open Booking Pipeline to take a look.',action:{kind:'navigate',label:'Review applicant →',path:'/pipeline'}};
 }
 if(pathname==='/calendar'){
  if(s.dateSetup)return {step:2,total:4,title:'Open your demo night',body:'The sample set runs from 7–10 PM. Keep these times or adjust them, then tap Open this date below. No real date is posted.'};
  if(s.timePicker)return s.timeChosen
   ?{step:2,total:4,title:'Confirm your open date',body:'Tap Confirm at the bottom. This opens one demo night; you don’t need to choose Repeat.'}
   :{step:2,total:4,title:'Choose when the music starts',body:'Tap Evening (5–9 PM). You can choose another time if you prefer; then tap Confirm.'};
  if(s.availability)return {step:1,total:4,title:'Open this date for music',body:'Tap Open Date for Music in the menu below. You’ll choose a time next.'};
  return {step:1,total:4,title:'Choose a night for live music',body:`Tap ${dateLabel} on the calendar. We’ll guide you through opening that night.`,action:{kind:'scroll',label:'Show the calendar ↓',text:'__demo-calendar-day__'}};
 }
 return {step:1,total:4,title:'Explore at your own pace',body:'When you’re ready, head to Calendar to open a demo date for live music.',action:{kind:'navigate',label:'Go to Calendar',path:'/calendar'}};
}
