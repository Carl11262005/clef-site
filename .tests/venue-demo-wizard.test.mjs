import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../assets/venue-demo-state.mjs';
const {createGuidedDemoState,reduceGuidedDemoState,getDemoGuidance}=api;

const act=(state,type,extra={})=>reduceGuidedDemoState(state,{type,...extra});
function termsStart(){
  let s=act(createGuidedDemoState(new Date(2026,9,9)),'START');
  for(const type of ['OPEN_CALENDAR','SELECT_DAY','OPEN_DATE_SHEET','SELECT_NIGHT',
    'CONFIRM_DATE','OPEN_PIPELINE','OPEN_ARTIST','ACCEPT_ARTIST','OPEN_MESSAGE',
    'SEND_MESSAGE','OPEN_TERMS'])s=act(s,type,type==='SELECT_DAY'?{dateKey:s.dateKey}:{});
  assert.equal(s.screen,'terms');return s;
}

test('the guided terms flow visits all seven app steps before anything is sent',()=>{
  let s=termsStart();
  assert.equal(s.wizardStep,1);
  assert.equal(act(s,'SEND_TERMS'),s);
  for(let step=1;step<7;step++){
    assert.equal(getDemoGuidance(s).action,'NEXT_TERMS');
    s=act(s,'NEXT_TERMS');
    assert.equal(s.wizardStep,step+1);
    assert.equal(s.done.sendTerms,false);
  }
  assert.equal(getDemoGuidance(s).action,'SEND_TERMS');
  s=act(s,'SEND_TERMS');
  assert.equal(s.screen,'awaiting');
  assert.equal(s.done.sendTerms,true);
  assert.equal(s.done.confirmed,false);
  assert.equal(act(s,'SEND_TERMS'),s);
});

test('terms changes update the review and confirmed record without creating duplicate sends',()=>{
  let s=termsStart();
  s=act(s,'SET_TERM',{field:'payStructure',value:'door'});
  s=act(s,'NEXT_TERMS');
  s=act(s,'SET_TERM',{field:'doorPercentage',value:'35'});
  for(let step=2;step<7;step++)s=act(s,'NEXT_TERMS');
  assert.equal(s.wizardStep,7);
  assert.match(api.summarizeDemoTerms(s.terms).pay,/35%/);
  s=act(s,'SEND_TERMS');
  const sent=s;
  s=act(s,'SIMULATE_ACCEPTANCE');
  assert.equal(s.screen,'confirmed');
  assert.deepEqual(s.terms,sent.terms);
  assert.equal(act(s,'SIMULATE_ACCEPTANCE'),s);
});

test('invalid amounts and matching set times hold the visitor on their current terms step',()=>{
  let s=termsStart();
  s=act(s,'NEXT_TERMS');
  s=act(s,'SET_TERM',{field:'flatAmount',value:'0'});
  assert.equal(act(s,'NEXT_TERMS').wizardStep,2);
  s=act(s,'SET_TERM',{field:'flatAmount',value:'300'});
  for(let step=2;step<6;step++)s=act(s,'NEXT_TERMS');
  assert.equal(s.wizardStep,6);
  s=act(s,'SET_TERM',{field:'setEnd',value:s.terms.setStart});
  assert.equal(act(s,'NEXT_TERMS').wizardStep,6);
  s=act(s,'SET_TERM',{field:'setEnd',value:'23:00'});
  assert.equal(act(s,'NEXT_TERMS').wizardStep,7);
});

test('Back moves through terms without losing edits; Restart restores the sample values',()=>{
  let s=termsStart();
  s=act(s,'NEXT_TERMS');
  s=act(s,'SET_TERM',{field:'flatAmount',value:'425'});
  s=act(s,'NEXT_TERMS');
  s=act(s,'BACK');
  assert.equal(s.wizardStep,2);
  assert.equal(s.terms.flatAmount,'425');
  s=act(s,'RESTART',{now:new Date(2026,9,9)});
  assert.equal(s.started,false);
  assert.equal(s.terms.flatAmount,'300');
});

test('terms edits cannot reach unrelated fields or bypass the seven-step flow',()=>{
  let s=termsStart();
  assert.equal(act(s,'SET_TERM',{field:'setStart',value:'22:00'}),s);
  assert.equal(act(s,'SET_TERM',{field:'payStructure',value:'unknown'}),s);
  assert.equal(act(s,'NEXT_TERMS',{step:7}).wizardStep,2);
});

test('review Edit returns to the selected app step and preserves prior choices',()=>{
  let s=termsStart();
  for(let step=1;step<7;step++)s=act(s,'NEXT_TERMS');
  assert.equal(s.wizardStep,7);
  s=act(s,'EDIT_TERM',{step:2});
  assert.equal(s.wizardStep,2);
  assert.equal(s.terms.flatAmount,'300');
  s=act(s,'SET_TERM',{field:'flatAmount',value:'425'});
  for(let step=2;step<7;step++)s=act(s,'NEXT_TERMS');
  assert.equal(api.summarizeDemoTerms(s.terms).amount,'$425 flat payout');
  assert.equal(act(s,'EDIT_TERM',{step:8}),s);
});
