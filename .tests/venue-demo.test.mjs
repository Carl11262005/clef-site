import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const renderURL=new URL('../assets/venue-demo.mjs',import.meta.url);
test('renderer imports safely outside a browser and has an isolated interface', async()=>{
  assert.ok(existsSync(renderURL),'venue demo renderer must exist');
  assert.ok(existsSync(new URL('../assets/venue-demo.css',import.meta.url)));
  const api=await import(renderURL);
  assert.equal(typeof api.renderVenueDemo,'function');
  const source=readFileSync(renderURL,'utf8');
  assert.ok(!/Clef-App|firebase|localStorage|sessionStorage/.test(source));
  assert.ok(!/\b(?:fetch|eval)\s*\(|\b(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/.test(source));
});
test('disabled and malformed actions cannot enter the state machine',async()=>{
  const {decodeDemoAction}=await import('../assets/venue-demo.mjs');
  assert.equal(typeof decodeDemoAction,'function');
  assert.equal(decodeDemoAction({disabled:true,dataset:{demoAction:'next'}}),null);
  assert.equal(decodeDemoAction({dataset:{demoAction:'unknown'}}),null);
  for(const chapter of ['-1','4','nope','','2.0','02'])assert.equal(decodeDemoAction({dataset:{demoAction:'chapter',chapter}}),null);
  assert.deepEqual(decodeDemoAction({dataset:{demoAction:'chapter',chapter:'2'}}),{type:'GOTO_CHAPTER',index:2});
  assert.deepEqual(decodeDemoAction({dataset:{demoAction:'select-day',dateKey:'2026-10-16'}}),{type:'SELECT_DAY',dateKey:'2026-10-16'});
  assert.equal(decodeDemoAction({dataset:{demoAction:'select-day',dateKey:'broken'}}),null);
  assert.deepEqual(decodeDemoAction({dataset:{demoAction:'filter-stage',stage:'confirmed'}}),{type:'PIPELINE_FILTER',stage:'confirmed'});
  assert.equal(decodeDemoAction({dataset:{demoAction:'filter-stage',stage:'paid'}}),null);
  assert.deepEqual(decodeDemoAction({dataset:{demoAction:'set-term',field:'payStructure',value:'door'}}),
    {type:'SET_TERM',field:'payStructure',value:'door'});
  assert.equal(decodeDemoAction({dataset:{demoAction:'set-term',field:'unknown',value:'door'}}),null);
});
test('every visible action decodes to its intended local transition',async()=>{
  const {decodeDemoAction}=await import('../assets/venue-demo.mjs');
  assert.equal(typeof decodeDemoAction,'function');
  for(const [key,type] of [
    ['previous','BACK'],['next','NEXT'],['restart','RESTART'],
    ['open-calendar','OPEN_CALENDAR'],['open-date','OPEN_DATE_SHEET'],['select-night','SELECT_NIGHT'],
    ['confirm-date','CONFIRM_DATE'],['open-pipeline','OPEN_PIPELINE'],['open-artist','OPEN_ARTIST'],
    ['accept-artist','ACCEPT_ARTIST'],['open-message','OPEN_MESSAGE'],['open-terms','OPEN_TERMS'],
    ['next-terms','NEXT_TERMS'],['send-terms','SEND_TERMS'],['simulate-acceptance','SIMULATE_ACCEPTANCE'],['return','RETURN'],
    ['tab-dashboard','TAB_DASHBOARD'],['tab-calendar','TAB_CALENDAR'],['tab-messages','TAB_MESSAGES'],['tab-profile','TAB_PROFILE'],
  ])assert.deepEqual(decodeDemoAction({dataset:{demoAction:key}}),{type});
});
test('venue route no longer mounts the archived simulator',()=>{
  const read=path=>readFileSync(new URL(path,import.meta.url),'utf8'),venue=read('../venues/index.html');
  for(const marker of ['data-venue-demo','href="#venue-demo"','venue-demo.css','venue-demo.mjs'])assert.ok(!venue.includes(marker),marker);
  assert.ok(venue.includes('href="#benefits"'));
  assert.equal((venue.match(/data-uid="c338b66b93"/g)||[]).length,1);
  for(const path of ['../index.html','../musicians/index.html'])assert.ok(!read(path).includes('venue-demo.mjs'));
});
