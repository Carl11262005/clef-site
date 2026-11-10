import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const moduleURL = new URL('../assets/venue-demo-state.mjs', import.meta.url);
async function api() {
  assert.ok(existsSync(moduleURL), 'venue demo state module must exist');
  return import(moduleURL);
}
const now = () => new Date(2026, 9, 9, 23, 59);
test('Friday keys remain local at month and year boundaries', async () => {
  const {nextFridayKey} = await api();
  for (const [input, expected] of [
    [now(), '2026-10-16'], [new Date(2026,11,31,23,59), '2027-01-01'],
    [new Date(2027,0,1), '2027-01-08'], [new Date(2026,9,8), '2026-10-09'],
    [new Date(2028,1,29), '2028-03-03'],
  ]) assert.equal(nextFridayKey(input), expected);
});
test('chapter jumps seed prerequisites without completing user actions', async () => {
  const {createDemoState, reduceDemoState, deriveDemoContext} = await api();
  const first = createDemoState(now());
  const jumped = reduceDemoState(first, {type:'GOTO_CHAPTER',index:3});
  assert.equal(deriveDemoContext(jumped).inContact, true);
  assert.equal(deriveDemoContext(jumped).bookingStatus, 'draft');
  assert.deepEqual(jumped.done, {openDate:false,reviewArtist:false,message:false,sendTerms:false,confirmed:false});
  const returned = reduceDemoState(jumped, {type:'GOTO_CHAPTER',index:0});
  assert.equal(deriveDemoContext(returned).posted, false);
  assert.equal(first.chapter, 0);
});
test('invalid chapter, filter and action payloads leave state untouched', async () => {
  const {createDemoState, reduceDemoState} = await api();
  const s = createDemoState(now());
  for (const index of [-1,4,NaN,'2',null]) assert.equal(reduceDemoState(s,{type:'GOTO_CHAPTER',index}),s);
  for (const action of [{type:'unknown'}, {type:'SET_DRAFT',value:42},
    {type:'SELECT_DAY',dateKey:'2026-10-09'}, {type:'PIPELINE_FILTER',stage:'bogus'},
    {type:'SIMULATE_ACCEPTANCE'}, {type:'CONFIRM_DATE'}, {type:'BACK'}]) {
    assert.equal(reduceDemoState(s,action),s);
  }
});
test('open-date flow is explicit and cannot post twice', async () => {
  const {createDemoState, reduceDemoState} = await api();
  let s = createDemoState(now());
  for (const action of [{type:'OPEN_CALENDAR'},{type:'SELECT_DAY',dateKey:'2026-10-16'},
    {type:'OPEN_DATE_SHEET'},{type:'SELECT_NIGHT'},{type:'CONFIRM_DATE'}]) s=reduceDemoState(s,action);
  assert.equal(s.screen,'dashboard');
  assert.equal(s.done.openDate,true);
  assert.equal(reduceDemoState(s,{type:'CONFIRM_DATE'}),s);
  assert.equal(reduceDemoState({...s,done:{...s.done,openDate:false},screen:'time-sheet',nightSelected:false},
    {type:'CONFIRM_DATE'}).done.openDate,false);
});
test('reopening existing availability returns to the posted result without a no-op Confirm', async () => {
  const {createDemoState,reduceDemoState}=await api();
  let s=reduceDemoState(createDemoState(now()),{type:'OPEN_DATE_SHEET'});
  s=reduceDemoState(s,{type:'CONFIRM_DATE'});
  const done={...s.done};
  for(const action of [{type:'TAB_CALENDAR'},{type:'SELECT_DAY',dateKey:s.dateKey},{type:'OPEN_DATE_SHEET'}])s=reduceDemoState(s,action);
  assert.equal(s.screen,'night-posted');
  assert.deepEqual(s.done,done);
});
test('artist acceptance is In Contact, never booking confirmation', async () => {
  const {createDemoState, reduceDemoState, deriveDemoContext} = await api();
  let s=createDemoState(now());
  s=reduceDemoState(s,{type:'OPEN_ARTIST'});
  s=reduceDemoState(s,{type:'ACCEPT_ARTIST'});
  assert.equal(deriveDemoContext(s).stage,'in-contact');
  assert.equal(s.done.confirmed,false);
  assert.equal(reduceDemoState(s,{type:'ACCEPT_ARTIST'}),s);
  assert.equal(reduceDemoState(s,{type:'SIMULATE_ACCEPTANCE'}),s);
});
test('terms stay pending until the explicitly simulated acceptance', async () => {
  const {createDemoState, reduceDemoState, deriveDemoContext} = await api();
  let s=reduceDemoState(createDemoState(now()),{type:'OPEN_TERMS'});
  for(let step=1;step<7;step++)s=reduceDemoState(s,{type:'NEXT_TERMS'});
  s=reduceDemoState(s,{type:'SEND_TERMS'});
  assert.equal(s.screen,'awaiting');
  assert.equal(deriveDemoContext(s).bookingStatus,'awaiting-musician');
  assert.equal(reduceDemoState(s,{type:'SEND_TERMS'}),s);
  s=reduceDemoState(s,{type:'SIMULATE_ACCEPTANCE'});
  assert.equal(s.screen,'confirmed');
  assert.equal(deriveDemoContext(s).bookingStatus,'confirmed');
  assert.equal(reduceDemoState(s,{type:'SIMULATE_ACCEPTANCE'}),s);
  s=reduceDemoState(s,{type:'TAB_CALENDAR'});
  assert.equal(deriveDemoContext(s).stage,'confirmed');
  s=reduceDemoState(s,{type:'SELECT_DAY',dateKey:'2026-10-16'});
  assert.equal(s.screen,'confirmed');
});
test('empty and overlength messages retain editable draft with inline error', async () => {
  const {createDemoState,reduceDemoState}=await api();
  let s=createDemoState(now());
  for (const value of ['   ','x'.repeat(501)]) {
    s=reduceDemoState(s,{type:'SET_DRAFT',value});
    s=reduceDemoState(s,{type:'SEND_MESSAGE'});
    assert.ok(s.error); assert.equal(s.draft,value);
    assert.equal(s.outgoingMessage,null); assert.equal(s.done.message,false);
  }
});
test('message sends trim once and preserve hostile text as data', async () => {
  const {createDemoState,reduceDemoState}=await api();
  let s=createDemoState(now());
  s=reduceDemoState(s,{type:'SET_DRAFT',value:'  <img src=x onerror=alert(1)> Soundcheck?  '});
  s=reduceDemoState(s,{type:'SEND_MESSAGE'});
  assert.equal(s.outgoingMessage,'<img src=x onerror=alert(1)> Soundcheck?');
  assert.equal(s.done.message,true);
  assert.equal(reduceDemoState(s,{type:'SEND_MESSAGE'}),s);
});
test('500 trimmed characters are accepted without silently truncating text', async () => {
  const {createDemoState,reduceDemoState}=await api();
  let s=createDemoState(now());
  s=reduceDemoState(s,{type:'SET_DRAFT',value:'  '+ 'x'.repeat(500)+'  '});
  s=reduceDemoState(s,{type:'SEND_MESSAGE'});
  assert.equal(s.outgoingMessage.length,500); assert.equal(s.error,'');
});
test('back, next and both profiles preserve data and return to their parent', async () => {
  const {createDemoState,reduceDemoState}=await api();
  let s=createDemoState(now());
  s=reduceDemoState(s,{type:'GOTO_CHAPTER',index:3});
  assert.equal(reduceDemoState(s,{type:'NEXT'}),s);
  s=reduceDemoState(s,{type:'BACK'});
  assert.equal(s.chapter,2);
  s=reduceDemoState(s,{type:'TAB_PROFILE'});
  s=reduceDemoState(s,{type:'TAB_PROFILE'});
  assert.equal(s.screen,'venue-profile');
  s=reduceDemoState(s,{type:'RETURN'});
  assert.equal(s.screen,'chat'); assert.equal(s.chapter,2);
  s=reduceDemoState(s,{type:'OPEN_ARTIST'});
  s=reduceDemoState(s,{type:'RETURN'});
  assert.equal(s.screen,'pipeline');
});
test('reducers preserve frozen input and restart clears progress with a new Friday', async () => {
  const {createDemoState,reduceDemoState}=await api();
  const first=createDemoState(now());
  Object.freeze(first.done);Object.freeze(first);
  const next=reduceDemoState(first,{type:'GOTO_CHAPTER',index:3});
  let ready=next;
  for(let step=1;step<7;step++)ready=reduceDemoState(ready,{type:'NEXT_TERMS'});
  let completed=reduceDemoState(ready,{type:'SEND_TERMS'});
  completed=reduceDemoState(completed,{type:'SIMULATE_ACCEPTANCE'});
  const restarted=reduceDemoState(completed,{type:'RESTART',now:new Date(2026,11,31)});
  assert.equal(restarted.dateKey,'2027-01-01');
  assert.equal(restarted.screen,'dashboard');
  assert.deepEqual(restarted.done,{openDate:false,reviewArtist:false,message:false,sendTerms:false,confirmed:false});
  assert.equal(restarted.outgoingMessage,null);
  assert.equal(completed.done.confirmed,true);
  assert.equal(first.chapter,0);
});
