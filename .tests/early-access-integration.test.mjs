import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium} = createRequire(import.meta.url)('playwright');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = name => readFileSync(new URL('../assets/' + name, import.meta.url), 'utf8');
const roles = {venue: ['101', 'Venue / Booking Manager'], musician: ['102', 'Musician'], band: ['103', 'Band']};

// Synthetic Kit responses and Google identities only. No live subscriptions.
async function setup(browser, {expanded = true, friendlyLabels = true, pagePath = '/'} = {}) {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const metadata = expanded ? `<div class="formkit-field"><input name="fields[city_state_region]" placeholder="City + State/Region" required></div><div data-group="dropdown" group="field"><select data-element="tags-select" name="tags[]" required><option value="">I’m joining as…</option>${Object.entries(roles).map(([key, [id, label]]) => `<option value="${id}">${friendlyLabels ? label : 'Early Access – ' + key[0].toUpperCase() + key.slice(1)}</option>`).join('')}</select></div>` : '';
  const form = `<form data-uid="c338b66b93" class="formkit-form"><div class="formkit-alert-error"></div>${metadata}<input class="formkit-input" name="email_address" type="email" required><button class="formkit-submit" type="submit">Join the early-access list</button></form>`;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === pagePath) return route.fulfill({contentType: 'text/html', body: pagePath === '/' ? html : readFileSync(new URL('..' + pagePath + 'index.html', import.meta.url), 'utf8')});
    if (url.hostname === 'fixture.test' && url.pathname.startsWith('/assets/') && !/\.(png|jpg|mp4|svg)$/.test(url.pathname)) {
      return route.fulfill({contentType: url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript', body: source(url.pathname.split('/').pop())});
    }
    if (url.hostname === 'clef.kit.com') return route.fulfill({contentType: 'text/javascript', body: `
      document.getElementById('kitSignup').insertAdjacentHTML('beforeend', ${JSON.stringify(form)});
      window.fixture = {submissions: [], authCalls: 0, outcome: 'success'};
      document.querySelector('#kitSignup form').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        window.fixture.submissions.push([...new FormData(form)]);
        if (window.fixture.outcome === 'pending') return;
        if (window.fixture.outcome === 'error') {
          form.querySelector('.formkit-alert-error').innerHTML = '<li>Try again.</li>';
        } else {
          form.querySelector('.formkit-alert-error').replaceChildren();
          form.insertAdjacentHTML('beforeend', '<p class="formkit-alert-success">You’re on the list.</p>');
        }
      });`});
    if (url.pathname.endsWith('/firebase-app.js')) return route.fulfill({contentType: 'text/javascript', body: 'export const initializeApp = () => ({});'});
    if (url.pathname.endsWith('/firebase-auth.js')) return route.fulfill({contentType: 'text/javascript', body: `
      export const inMemoryPersistence = {}, browserPopupRedirectResolver = {};
      export const initializeAuth = () => ({});
      export class GoogleAuthProvider { setCustomParameters() {} }
      export async function signInWithPopup() {
        window.fixture.authCalls++;
        if (window.fixture.cancelGoogle) throw {code: 'auth/popup-closed-by-user'};
        return {user: {email: 'artist@example.test', emailVerified: true, providerData: [{providerId: 'google.com'}]}};
      }`});
    return route.abort();
  });
  await page.goto('https://fixture.test' + pagePath);
  await page.waitForFunction(() => window.fixture && !document.querySelector('#googleSignup').disabled);
  return page;
}

async function choose(page, role) {
  await page.locator(`[data-signup-role="${role}"]`).click();
  await page.locator('[data-signup-location]').fill('  Pittsburgh, PA  ');
  await page.locator('[data-signup-continue]').click();
}

test('email and Google carry each selected role and location into Kit using friendly native labels', async () => {
  const browser = await chromium.launch();
  try {
    for (const role of Object.keys(roles)) for (const method of ['email', 'google']) {
      const page = await setup(browser);
      assert.equal(await page.locator('.signup-wizard').isVisible(), true);
      await choose(page, role);
      if (method === 'email') {
        await page.locator('input[type="email"]').fill('artist@example.test');
        await page.locator('#kitSignup [type="submit"]').click();
      } else await page.locator('#googleSignup').click();
      await page.waitForFunction(() => window.fixture.submissions.length === 1);
      const submitted = Object.fromEntries(await page.evaluate(() => window.fixture.submissions[0]));
      assert.deepEqual(submitted, {'fields[city_state_region]': 'Pittsburgh, PA', 'tags[]': roles[role][0], email_address: 'artist@example.test'});
      assert.equal(await page.locator('.formkit-alert-success').isVisible(), true);
      await page.close();
    }
  } finally { await browser.close(); }
});

test('legacy email-only Kit form remains usable until metadata fields are published', async () => {
  const browser = await chromium.launch();
  try {
    const page = await setup(browser, {expanded: false});
    assert.equal(await page.locator('.signup-wizard').isVisible(), false);
    await page.locator('#googleSignup').click();
    await page.waitForFunction(() => window.fixture.submissions.length === 1);
    assert.deepEqual(await page.evaluate(() => window.fixture.submissions[0]), [['email_address', 'artist@example.test']]);
  } finally { await browser.close(); }
});

test('Google cancellation and Kit errors retain the chosen details and allow a real retry', async () => {
  const browser = await chromium.launch();
  try {
    const page = await setup(browser, {friendlyLabels: false});
    await choose(page, 'band');
    await page.evaluate(() => {window.fixture.cancelGoogle = true;});
    await page.locator('#googleSignup').click();
    await page.waitForFunction(() => document.querySelector('#signupStatus').textContent.includes('cancelled'));
    assert.equal(await page.evaluate(() => window.fixture.submissions.length), 0);
    await page.evaluate(() => {window.fixture.cancelGoogle = false; window.fixture.outcome = 'error';});
    await page.locator('#googleSignup').click();
    await page.waitForFunction(() => document.querySelector('#signupStatus').textContent === 'Try again.');
    assert.equal(await page.locator('.formkit-alert-success').count(), 0);
    await page.evaluate(() => {window.fixture.outcome = 'success';});
    await page.locator('#googleSignup').click();
    await page.waitForFunction(() => window.fixture.submissions.length === 2);
    assert.equal(Object.fromEntries(await page.evaluate(() => window.fixture.submissions[1]))['tags[]'], roles.band[0]);
  } finally { await browser.close(); }
});

test('preview signup keeps progress and chosen details visible through edits, then finishes cleanly', async () => {
  const browser = await chromium.launch();
  try {
    for (const pagePath of ['/', '/venues/', '/musicians/']) {
      const page = await setup(browser, {pagePath});
      await choose(page, 'musician');
      assert.equal(await page.locator('[data-signup-progress]').isVisible(), true);
      assert.equal(await page.locator('[data-signup-progress]').innerText(), 'Step 3 of 3');
      assert.match(await page.locator('[data-signup-summary]').innerText(), /Musician[\s\S]*Pittsburgh, PA/);
      await page.locator('[data-signup-edit]').click();
      await page.locator('[data-signup-role="band"]').click();
      assert.equal(await page.locator('[data-signup-location]').inputValue(), 'Pittsburgh, PA');
      await page.locator('[data-signup-location]').fill('Morgantown, WV');
      await page.locator('[data-signup-step="2"] [data-signup-back]').click();
      await page.locator('[data-signup-role="band"]').click();
      assert.equal(await page.locator('[data-signup-location]').inputValue(), 'Morgantown, WV', 'Back preserves an unfinished city edit');
      await page.locator('[data-signup-continue]').click();
      assert.match(await page.locator('[data-signup-summary]').innerText(), /Band[\s\S]*Morgantown, WV/);
      await page.locator('input[type="email"]').fill('artist@example.test');
      await page.locator('#kitSignup [type="submit"]').click();
      await page.waitForFunction(() => document.querySelector('#earlyAccess').dataset.signupComplete === 'true');
      assert.equal(await page.locator('.signup-back-final').isVisible(), false);
      assert.equal(await page.locator('[data-signup-header]').isVisible(), false);
      assert.equal(await page.locator('[data-signup-summary]').isVisible(), false);
      await page.close();
    }
  } finally { await browser.close(); }
});

test('pending signup locks editing and prevents duplicate email submissions', async () => {
  const browser = await chromium.launch();
  try {
    const page = await setup(browser);
    await choose(page, 'venue');
    await page.evaluate(() => {window.fixture.outcome = 'pending';});
    await page.locator('input[type="email"]').fill('venue@example.test');
    await page.locator('#kitSignup [type="submit"]').click();
    await page.evaluate(() => document.querySelector('#kitSignup form').requestSubmit());
    assert.equal(await page.evaluate(() => window.fixture.submissions.length), 1);
    assert.equal(await page.locator('[data-signup-edit]').isDisabled(), true);
    assert.equal(await page.locator('.signup-back-final').isDisabled(), true);
  } finally { await browser.close(); }
});
