import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const moduleUrl = new URL('../assets/signup-wizard.mjs', import.meta.url);
const wizard = existsSync(moduleUrl) ? await import(moduleUrl) : {};

test('three-step signup requires a supported role and a trimmed location', () => {
  assert.equal(typeof wizard.createSignupState, 'function');
  const flow = wizard.createSignupState();
  assert.deepEqual(flow.snapshot(), {role:null, location:'', step:1, subscribed:false});
  assert.equal(flow.selectRole('promoter').ok, false);
  assert.equal(flow.selectRole('band').ok, true);
  assert.equal(flow.snapshot().step, 2);
  assert.equal(flow.continueWithLocation('   ').ok, false);
  assert.equal(flow.continueWithLocation('  Pittsburgh, PA  ').ok, true);
  assert.deepEqual(flow.details(), {role:'band', location:'Pittsburgh, PA'});
  assert.equal(flow.snapshot().step, 3);
});

test('location is limited to 100 characters and back preserves entered values', () => {
  const flow = wizard.createSignupState({role:'venue'});
  assert.equal(flow.snapshot().role, 'venue');
  assert.equal(flow.continueWithLocation('x'.repeat(101)).ok, false);
  flow.continueWithLocation('Morgantown, WV'); flow.back(); flow.back();
  assert.deepEqual(flow.snapshot(), {role:'venue', location:'Morgantown, WV', step:1, subscribed:false});
});

test('subscriber completion is idempotent and restart is not exposed', () => {
  const flow = wizard.createSignupState();
  flow.selectRole('musician'); flow.continueWithLocation('Pittsburgh, PA');
  assert.equal(flow.markSubscribed(), true);
  assert.equal(flow.markSubscribed(), false);
  assert.equal(flow.snapshot().subscribed, true);
});

test('role labels map to the exact Kit tags', () => {
  assert.deepEqual(wizard.ROLE_TAGS, {
    venue:'Early Access – Venue', musician:'Early Access – Musician', band:'Early Access – Band'
  });
});

test('guided mode only activates for a complete required Kit schema', () => {
  const tags = Object.values(wizard.ROLE_TAGS);
  assert.equal(wizard.isExpandedKitSchema({locationRequired:true, roleRequired:true, roleTags:tags}), true);
  assert.equal(wizard.isExpandedKitSchema({locationRequired:false, roleRequired:true, roleTags:tags}), false);
  assert.equal(wizard.isExpandedKitSchema({locationRequired:true, roleRequired:false, roleTags:tags}), false);
  assert.equal(wizard.isExpandedKitSchema({locationRequired:true, roleRequired:true, roleTags:tags.slice(0,2)}), false);
});
