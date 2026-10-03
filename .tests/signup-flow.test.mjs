import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const moduleUrl = new URL('../assets/signup-flow.mjs', import.meta.url);
const { createGoogleSignup } = existsSync(moduleUrl) ? await import(moduleUrl) : {};
const verifiedUser = { email: 'listener@example.com', emailVerified: true, providerData: [{ providerId: 'google.com' }] };

test('Google signup sends only the verified Google email and waits for Kit success', async () => {
  assert.equal(typeof createGoogleSignup, 'function');
  let finishKit; const sent = []; const messages = []; const busy = [];
  const run = createGoogleSignup({
    authenticate: async () => verifiedUser,
    subscribe: email => { sent.push(email); return new Promise(resolve => { finishKit = resolve; }); },
    notify: message => messages.push(message), setBusy: value => busy.push(value),
  });
  const pending = run(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(sent, ['listener@example.com']);
  assert.equal(busy.at(-1), true);
  assert.ok(!messages.some(m => m.includes('You’re on')));
  finishKit(); await pending;
  assert.match(messages.at(-1), /You’re on/);
  assert.equal(busy.at(-1), false);
  await run(); assert.equal(sent.length, 1);
});

test('repeated clicks during authentication do not start duplicate sign-ins', async () => {
  assert.equal(typeof createGoogleSignup, 'function');
  let finishAuth; let signIns = 0; let subscriptions = 0;
  const run = createGoogleSignup({ authenticate: () => { signIns++; return new Promise(r => { finishAuth = r; }); }, subscribe: async () => { subscriptions++; }, notify() {}, setBusy() {} });
  const pending = run(); await run(); await run();
  assert.equal(signIns, 1); finishAuth(verifiedUser); await pending;
  assert.equal(subscriptions, 1);
});

test('unverified or non-Google identities cannot be subscribed through Google flow', async () => {
  assert.equal(typeof createGoogleSignup, 'function');
  for (const user of [{...verifiedUser,emailVerified:false}, {...verifiedUser,email:null}, {...verifiedUser,providerData:[{providerId:'password'}]}]) {
    let subscribed = false; const messages = [];
    const run = createGoogleSignup({ authenticate: async () => user, subscribe: async () => { subscribed = true; }, notify: m => messages.push(m), setBusy() {} });
    await run(); assert.equal(subscribed, false); assert.match(messages.at(-1), /verified Google email/);
  }
});

test('cancelled or blocked Google popup leaves email signup available and supports retry', async () => {
  assert.equal(typeof createGoogleSignup, 'function');
  for (const code of ['auth/popup-closed-by-user','auth/popup-blocked','auth/unauthorized-domain']) {
    let attempts = 0; let subscriptions = 0; const messages = []; const busy = [];
    const run = createGoogleSignup({ authenticate: async () => { if (!attempts++) throw {code}; return verifiedUser; }, subscribe: async () => { subscriptions++; }, notify: m => messages.push(m), setBusy: b => busy.push(b) });
    await run(); assert.equal(subscriptions, 0); assert.equal(busy.at(-1), false); assert.match(messages.at(-1), /email/i);
    await run(); assert.equal(subscriptions, 1);
  }
});

test('Kit errors never report successful signup and can be retried', async () => {
  assert.equal(typeof createGoogleSignup, 'function');
  let attempts = 0; const messages = [];
  const run = createGoogleSignup({ authenticate: async () => verifiedUser, subscribe: async () => { if (!attempts++) throw new Error('Signup service is unavailable. Please try email signup.'); }, notify: m => messages.push(m), setBusy() {} });
  await run(); assert.ok(!messages.some(m => m.includes('You’re on')));
  assert.match(messages.at(-1), /unavailable/); await run(); assert.match(messages.at(-1), /You’re on/);
});
