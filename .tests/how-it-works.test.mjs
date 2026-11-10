import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

async function setup() {
  const url = new URL('../assets/how-it-works.mjs', import.meta.url);
  assert.ok(existsSync(url), 'How-it-works enhancement must exist');
  const {initHowItWorks} = await import(url);
  const titles = ['Find Each Other','Work Out the Details','Keep It Together'];
  const steps = ['find','connect','organize'].map((id,index) => Object.assign(new EventTarget(), {dataset:{step:id},open:index===0,querySelector:()=>({textContent:titles[index]})}));
  const frames = steps.map(step => ({dataset:{scene:step.dataset.step},hidden:step!==steps[0]}));
  const markers = steps.map((_,index) => Object.assign(new EventTarget(), {
    dataset:{howSelect:String(index)}, attributes:{},
    setAttribute(name,value) { this.attributes[name]=value; },
    removeAttribute(name) { delete this.attributes[name]; }
  }));
  const controls = {hidden:true};
  const previous = new EventTarget();
  const next = new EventTarget();
  const count = {textContent:''};
  const status = {textContent:''};
  const nodes = {'[data-how-controls]':controls,'[data-how-previous]':previous,'[data-how-next]':next,'[data-how-count]':count,'[data-how-status]':status};
  initHowItWorks({querySelectorAll: selector => ({details:steps,'[data-scene]':frames,'[data-how-select]':markers})[selector],querySelector:selector=>nodes[selector]});
  return {steps,frames,markers,controls,previous,next,count,status,
    advance() { next.dispatchEvent(new Event('click')); },
    back() { previous.dispatchEvent(new Event('click')); },
    open(index) { steps[index].open=true; steps[index].dispatchEvent(new Event('toggle')); }};
}
test('selecting a step reveals its photograph and closes the previous explanation', async () => {
  const x = await setup(); x.open(1);
  assert.deepEqual(x.steps.map(s=>s.open),[false,true,false]);
  assert.deepEqual(x.frames.map(s=>s.hidden),[true,false,true]);
});
test('rapid selections and delayed close events cannot restore an old photograph', async () => {
  const x = await setup(); x.open(1); x.open(2);
  x.steps[1].dispatchEvent(new Event('toggle'));
  assert.deepEqual(x.steps.map(s=>s.open),[false,false,true]);
  assert.deepEqual(x.frames.map(s=>s.hidden),[true,true,false]);
  x.open(0);
  assert.deepEqual(x.frames.map(s=>s.hidden),[false,true,true]);
});
test('closing a step leaves a photograph visible and does not move focus', async () => {
  const x = await setup(); x.steps[0].open=false; x.steps[0].dispatchEvent(new Event('toggle'));
  assert.equal(x.frames.filter(f=>!f.hidden).length,1);
  assert.deepEqual(x.steps.map(s=>s.open),[false,false,false]);
});

test('next and back select the matching explanation and photo while updating progress', async () => {
  const x = await setup();
  assert.equal(x.controls.hidden,false);
  assert.equal(x.count.textContent,'01 / 03');
  x.advance();
  assert.deepEqual(x.steps.map(s=>s.open),[false,true,false]);
  assert.deepEqual(x.frames.map(s=>s.hidden),[true,false,true]);
  assert.equal(x.count.textContent,'02 / 03');
  assert.equal(x.status.textContent,'Step 2 of 3: Work Out the Details');
  x.back();
  assert.deepEqual(x.steps.map(s=>s.open),[true,false,false]);
  assert.equal(x.count.textContent,'01 / 03');
});

test('next wraps after the final step and rapid inputs never reveal stale frames', async () => {
  const x = await setup(); x.advance(); x.advance();
  assert.equal(x.next.textContent,'Restart');
  x.advance();
  assert.equal(x.next.textContent,'Next Step');
  x.steps[1].dispatchEvent(new Event('toggle'));
  assert.deepEqual(x.steps.map(s=>s.open),[true,false,false]);
  assert.deepEqual(x.frames.map(s=>s.hidden),[false,true,true]);
  x.back();
  assert.deepEqual(x.steps.map(s=>s.open),[false,false,true]);
});

test('direct step selection synchronizes the new controls before the next action', async () => {
  const x = await setup(); x.open(2);
  assert.equal(x.count.textContent,'03 / 03');
  x.back();
  assert.deepEqual(x.steps.map(s=>s.open),[false,true,false]);
  assert.equal(x.count.textContent,'02 / 03');
});

test('photo markers select a step and keep accessible selection synchronized through rapid navigation', async () => {
  const x = await setup();
  x.markers[2].dispatchEvent(new Event('click'));
  assert.deepEqual(x.steps.map(s=>s.open),[false,false,true]);
  assert.deepEqual(x.frames.map(f=>f.hidden),[true,true,false]);
  assert.deepEqual(x.markers.map(m=>m.attributes['aria-current']),[undefined,undefined,'step']);
  assert.equal(x.status.textContent,'Step 3 of 3: Keep It Together');
  x.markers[0].dispatchEvent(new Event('click'));
  x.advance();
  x.steps[2].dispatchEvent(new Event('toggle'));
  assert.deepEqual(x.markers.map(m=>m.attributes['aria-current']),[undefined,'step',undefined]);
  assert.equal(x.count.textContent,'02 / 03');
  assert.equal(x.frames.filter(f=>!f.hidden).length,1);
});
