import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../assets/venue-demo-state.mjs';
const now=()=>new Date(2026,9,9);
function start(){
  assert.equal(typeof api.createGuidedDemoState,'function','guided state must exist');
  assert.equal(typeof api.reduceGuidedDemoState,'function','guided reducer must exist');
  assert.equal(typeof api.getDemoGuidance,'function','screen-level guidance must exist');
  return api.createGuidedDemoState(now());
}
const act=(s,type,extra={})=>api.reduceGuidedDemoState(s,{type,...extra});
function toChat(){
  let s=start();
  for(const type of ['START','OPEN_CALENDAR','SELECT_DAY','OPEN_DATE_SHEET','SELECT_NIGHT',
    'CONFIRM_DATE','OPEN_PIPELINE','OPEN_ARTIST','ACCEPT_ARTIST','OPEN_MESSAGE'])
    s=act(s,type,type==='SELECT_DAY'?{dateKey:s.dateKey}:{});
  assert.equal(s.screen,'chat');return s;
}
test('guided demo cannot act before Start or skip ahead after starting',()=>{
  let s=start();
  assert.equal(s.started,false);
  for(const type of ['NEXT','OPEN_CALENDAR','ACCEPT_ARTIST','SEND_TERMS'])assert.equal(act(s,type),s);
  s=act(s,'START');assert.equal(s.started,true);
  for(const action of [{type:'NEXT'},{type:'GOTO_CHAPTER',index:3},{type:'TAB_MESSAGES'},
    {type:'TAB_PROFILE'},{type:'OPEN_ARTIST'},{type:'SEND_TERMS'}])
    assert.equal(api.reduceGuidedDemoState(s,action),s,'Out-of-order '+action.type);
  assert.equal(s.screen,'dashboard');
});
test('every guided action changes its instruction and only the expected action is allowed',()=>{
  let s=act(start(),'START');
  const journey=[
    ['OPEN_CALENDAR','calendar',2],['SELECT_DAY','day-sheet',3],
    ['OPEN_DATE_SHEET','time-sheet',4],['SELECT_NIGHT','time-sheet',5],
    ['CONFIRM_DATE','dashboard',6],['OPEN_PIPELINE','pipeline',7],
    ['OPEN_ARTIST','artist',8],['ACCEPT_ARTIST','artist',9],
    ['OPEN_MESSAGE','chat',10],['SEND_MESSAGE','chat',11],
    ['OPEN_TERMS','terms',12],
    ['NEXT_TERMS','terms',13],['NEXT_TERMS','terms',14],['NEXT_TERMS','terms',15],
    ['NEXT_TERMS','terms',16],['NEXT_TERMS','terms',17],['NEXT_TERMS','terms',18],
    ['SEND_TERMS','awaiting',19],['SIMULATE_ACCEPTANCE','confirmed',20],
  ];
  for(const [type,screen,number] of journey){
    assert.equal(api.getDemoGuidance(s).action,type);
    const oldInstruction=api.getDemoGuidance(s).instruction;
    s=act(s,type,type==='SELECT_DAY'?{dateKey:s.dateKey}:{});
    assert.equal(s.screen,screen);assert.equal(api.getDemoGuidance(s).number,number);
    assert.notEqual(api.getDemoGuidance(s).instruction,oldInstruction);
  }
  assert.deepEqual(s.done,{openDate:true,reviewArtist:true,message:true,sendTerms:true,confirmed:true});
  assert.equal(api.getDemoGuidance(s).action,null);
});
test('Night selection is a real required step before availability can be confirmed',()=>{
  let s=act(start(),'START');
  for(const type of ['OPEN_CALENDAR','SELECT_DAY','OPEN_DATE_SHEET'])s=act(s,type,{dateKey:s.dateKey});
  assert.equal(s.nightSelected,false);
  assert.equal(act(s,'CONFIRM_DATE'),s);
  s=act(s,'SELECT_NIGHT');s=act(s,'CONFIRM_DATE');
  assert.equal(s.done.openDate,true);
  assert.equal(act(s,'CONFIRM_DATE'),s);
});
test('guided message errors stay on the same instruction and cannot unlock booking terms',()=>{
  let s=toChat();
  s=act(s,'SET_DRAFT',{value:' '});s=act(s,'SEND_MESSAGE');
  assert.ok(s.error);assert.equal(api.getDemoGuidance(s).number,10);
  assert.equal(act(s,'OPEN_TERMS'),s);
  s=act(s,'SET_DRAFT',{value:'x'.repeat(501)});s=act(s,'SEND_MESSAGE');
  assert.ok(s.error);assert.equal(s.done.message,false);
  s=act(s,'SET_DRAFT',{value:'  <img src=x onerror=alert(1)>  '});s=act(s,'SEND_MESSAGE');
  assert.equal(s.outgoingMessage,'<img src=x onerror=alert(1)>');
  assert.equal(api.getDemoGuidance(s).action,'OPEN_TERMS');
  assert.equal(act(s,'SEND_MESSAGE'),s);
});
test('Back preserves completed actions and returns to a useful parent without detours',()=>{
  let s=toChat();s=act(s,'SEND_MESSAGE');s=act(s,'OPEN_TERMS');
  for(let step=1;step<7;step++)s=act(s,'NEXT_TERMS');
  s=act(s,'SEND_TERMS');
  const done={...s.done},message=s.outgoingMessage;
  s=act(s,'BACK');assert.equal(s.screen,'chat');
  s=act(s,'OPEN_TERMS');assert.equal(s.screen,'awaiting');
  s=act(s,'SIMULATE_ACCEPTANCE');
  s=act(s,'BACK');assert.equal(s.screen,'chat');
  s=act(s,'BACK');assert.equal(s.screen,'artist');
  assert.equal(api.getDemoGuidance(s).action,'OPEN_MESSAGE');
  s=act(s,'BACK');assert.equal(s.screen,'pipeline');
  assert.equal(s.pipelineFilter,'confirmed');
  assert.deepEqual(s.done,{...done,confirmed:true});assert.equal(s.outgoingMessage,message);
});
test('rapid stale actions cannot duplicate messages, post dates or confirm unsent terms',()=>{
  let s=toChat();s=act(s,'SEND_MESSAGE');const sent=s;
  for(const type of ['SEND_MESSAGE','CONFIRM_DATE','ACCEPT_ARTIST','SIMULATE_ACCEPTANCE'])assert.equal(act(s,type),s);
  s=act(s,'OPEN_TERMS');
  for(let step=1;step<7;step++)s=act(s,'NEXT_TERMS');
  s=act(s,'SEND_TERMS');
  assert.equal(s.done.confirmed,false);assert.equal(act(s,'SEND_TERMS'),s);
  s=act(s,'SIMULATE_ACCEPTANCE');assert.equal(act(s,'SIMULATE_ACCEPTANCE'),s);
  assert.equal(s.outgoingMessage,sent.outgoingMessage);
});
test('guided Restart clears progress and requires a new deliberate Start',()=>{
  let s=toChat();s=act(s,'SEND_MESSAGE');
  s=api.reduceGuidedDemoState(s,{type:'RESTART',now:new Date(2026,11,31)});
  assert.equal(s.dateKey,'2027-01-01');assert.equal(s.screen,'dashboard');assert.equal(s.started,false);
  assert.equal(s.nightSelected,false);assert.equal(s.outgoingMessage,null);
  assert.ok(Object.values(s.done).every(value=>value===false));
});
test('posted dashboard exposes the sample applicant through the Booking Pipeline',()=>{
  let s=act(start(),'START');
  for(const type of ['OPEN_CALENDAR','SELECT_DAY','OPEN_DATE_SHEET','SELECT_NIGHT','CONFIRM_DATE'])s=act(s,type,{dateKey:s.dateKey});
  assert.equal(s.screen,'dashboard');
  assert.equal(api.deriveDemoContext(s).applicantPresent,true);
  assert.equal(api.deriveDemoContext(s).stage,'interested');
  assert.equal(api.getDemoGuidance(s).target,'open-pipeline');
  assert.match(api.getDemoGuidance(s).instruction,/Booking Pipeline/);
  s=act(s,'OPEN_PIPELINE');assert.equal(s.screen,'pipeline');
  s=act(s,'BACK');assert.equal(s.screen,'dashboard');
  assert.equal(api.getDemoGuidance(s).target,'open-pipeline');
});
test('chat confirmation opens terms without pretending the booking is already confirmed',()=>{
  let s=toChat();
  s=act(s,'SEND_MESSAGE');
  assert.equal(api.getDemoGuidance(s).target,'open-terms');
  assert.match(api.getDemoGuidance(s).instruction,/Confirm Booking/);
  s=act(s,'OPEN_TERMS');
  assert.equal(s.screen,'terms');
  assert.equal(s.done.confirmed,false);
});
test('returning to the dashboard after confirmation does not call a booked act merely interested',()=>{
  let s=toChat();s=act(s,'SEND_MESSAGE');s=act(s,'OPEN_TERMS');
  for(let step=1;step<7;step++)s=act(s,'NEXT_TERMS');
  s=act(s,'SEND_TERMS');s=act(s,'SIMULATE_ACCEPTANCE');
  for(let step=0;step<4;step++)s=act(s,'BACK');
  assert.equal(s.screen,'dashboard');
  assert.equal(api.deriveDemoContext(s).stage,'confirmed');
  assert.doesNotMatch(api.getDemoGuidance(s).instruction,/interested/i);
});
