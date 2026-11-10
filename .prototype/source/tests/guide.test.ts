import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getGuideStep,emptySignals,type GuideContext} from '../guidance/model.ts';
import {initialGuideExpanded,nextGuideExpanded} from '../guidance/presentation.ts';
import {musicianQuickReplies,musicianVenueReplyAfterMessage,nextMusicianStageAfterMessage} from '../guidance/musicianFlow.ts';
const base:GuideContext={role:'musician',phase:'browse',pathname:'/discoverVenues',dateLabel:'Fri, Nov 6',applicantVisited:false,signals:emptySignals};
const step=(patch:Partial<GuideContext>)=>getGuideStep({...base,...patch});
test('opened venue dates lead through Dashboard before applicant review',()=>{
 for(const phase of ['open','applied'] as const){
  assert.deepEqual(step({role:'venue',phase,pathname:'/calendar'}).action,{kind:'navigate',label:'Go to Dashboard →',path:'/listingsTabRouter'});
  assert.equal(step({role:'venue',phase,pathname:'/listingsTabRouter'}).action?.kind,'navigate');
  assert.match(step({role:'venue',phase,pathname:'/listingsTabRouter'}).body,/Booking Pipeline/);
 }
});

test('musician instructions follow navigation and only complete after application',()=>{
 assert.equal(step({}).step,1);
 assert.equal(step({pathname:'/venue/demo-venue-lamplighter'}).step,2);
 assert.equal(step({pathname:'/venue/ApplyNightSheet'}).step,3);
 assert.equal(step({pathname:'/venue/ApplyNightSheet'}).complete,undefined);
 assert.equal(step({phase:'applied',pathname:'/venue/ApplyNightSheet'}).complete,undefined);
 assert.match(step({phase:'applied',pathname:'/calendar'}).body,/nothing submitted/);
 assert.match(step({phase:'applied',pathname:'/venue/ApplyNightSheet'}).body,/directly to the venue reply/);
});
test('free exploration offers a way back without marking steps complete',()=>{
 const hint=step({pathname:'/profile'});
 assert.deepEqual(hint.action,{kind:'navigate',label:'Go to Discover',path:'/discoverVenues'});
 assert.equal(hint.complete,undefined);
 assert.equal(step({role:'venue',pathname:'/messages'}).action?.kind,'navigate');
});
test('calendar guidance follows the actual modal and selected time',()=>{
 const context={role:'venue' as const,pathname:'/calendar'};
 assert.match(step(context).body,/Fri, Nov 6/);
 assert.match(step({...context,signals:{...emptySignals,availability:true}}).body,/Open Date for Music/);
 assert.equal(step({...context,signals:{...emptySignals,timePicker:true}}).step,2);
 assert.match(step({...context,signals:{...emptySignals,timePicker:true,timeChosen:true}}).title,/Confirm/);
 // A background Confirm label alone cannot advance a closed calendar sheet.
 assert.equal(step({...context,signals:{...emptySignals,timeChosen:true}}).step,1);
});
test('never directs a visitor to an applicant before the sample arrives',()=>{
 const waiting=step({role:'venue',phase:'open',pathname:'/pipeline'});
 assert.match(waiting.body,/will appear/);
 assert.doesNotMatch(waiting.body,/Tap.*Copper/);
 assert.match(step({role:'venue',phase:'applied',pathname:'/pipeline'}).body,/The Copper Hollow/);
});
test('profile visit leads to accepting while skipping the visit still works',()=>{
 const context={role:'venue' as const,phase:'applied' as const,pathname:'/pipeline'};
 assert.equal(step(context).step,3);
 assert.equal(step({...context,applicantVisited:true}).step,4);
 assert.match(step({...context,signals:{...emptySignals,acceptCompose:true}}).body,/Send message/);
 assert.match(step({...context,signals:{...emptySignals,acceptSent:true}}).body,/Open conversation/);
 assert.equal(step({...context,phase:'accepted'}).complete,true);
});
test('fresh role reset has no completed-state residue',()=>{
 assert.equal(step({role:'venue',phase:'browse',pathname:'/calendar'}).step,1);
 assert.equal(step({role:'venue',phase:'browse',pathname:'/calendar'}).complete,undefined);
});

test('released date sheet teaches the current open-date action',()=>{
 const hint=step({role:'venue',pathname:'/calendar',signals:{...emptySignals,dateSetup:true}});
 assert.equal(hint.step,2);
 assert.match(hint.body,/Open this date/);
 assert.doesNotMatch(hint.body,/Evening|Confirm/);
});

test('guide stays out of the product until the visitor opens it',()=>{
 assert.equal(initialGuideExpanded,false);
 assert.equal(nextGuideExpanded(false,'visitor_opened'),true);
 assert.equal(nextGuideExpanded(true,'step_changed'),false);
});

test('guide actions and minimize control return to the compact pill',()=>{
 assert.equal(nextGuideExpanded(true,'guide_action'),false);
 assert.equal(nextGuideExpanded(true,'visitor_minimized'),false);
});

test('musician conversation requires two nonblank messages before terms',()=>{
 assert.equal(nextMusicianStageAfterMessage(2,'   '),2);
 assert.equal(nextMusicianStageAfterMessage(2,'9 to 11 works for us.'),3);
 assert.equal(nextMusicianStageAfterMessage(3,'$300 after the set works.'),4);
 assert.equal(nextMusicianStageAfterMessage(4,'Thanks!'),4);
});

test('each required musician message receives the tutorial reply',()=>{
 assert.match(musicianVenueReplyAfterMessage(2)??'',/\$300/);
 assert.match(musicianVenueReplyAfterMessage(3)??'',/booking terms/i);
 assert.equal(musicianVenueReplyAfterMessage(4),null);
});

test('musician messaging restarts as its own three-step section',()=>{
 const inbox=step({phase:'in-contact',pathname:'/messages'});
 assert.equal(inbox.total,3);
 assert.equal(inbox.step,1);
 assert.match(inbox.title,/reply/i);
 const firstReply=step({phase:'in-contact',pathname:'/chat/demo'});
 assert.equal(firstReply.step,1);
 assert.equal(firstReply.section,'Messages');
 assert.match(firstReply.title,/first reply/i);
 const secondReply=step({phase:'time-agreed',pathname:'/chat/demo'});
 assert.equal(secondReply.step,2);
 assert.equal(secondReply.section,'Messages');
 assert.match(secondReply.title,/second reply/i);
 const terms=step({phase:'offer',pathname:'/chat/demo'});
 assert.equal(terms.step,3);
 assert.equal(terms.section,'Messages');
 assert.match(terms.title,/view booking terms/i);
 const complete=step({phase:'offer',pathname:'/chat/demo',signals:{...emptySignals,bookingTerms:true}});
 assert.equal(complete.complete,true);
 assert.equal(complete.step,3);
 assert.equal(complete.section,'Messages');
});

test('musician messaging offers one-tap replies without removing custom typing',()=>{
 assert.deepEqual(musicianQuickReplies(2),[
  '9 to 11 works for us.',
  'Yes, that set time works.',
 ]);
 assert.deepEqual(musicianQuickReplies(3),[
  '$300 after the set works.',
  'Sounds good — send the terms.',
 ]);
 assert.deepEqual(musicianQuickReplies(4),[]);
});
