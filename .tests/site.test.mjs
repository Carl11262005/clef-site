import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = ['/', '/venues/', '/musicians/'];
const readPage = route => {
  const path = join(root, route, 'index.html');
  assert.ok(existsSync(path), 'Direct route must exist: ' + route);
  return readFileSync(path, 'utf8');
};
for (const route of routes) {
  test(route + ' provides real navigation, signup and resolved local destinations without rendering JS', () => {
    const html = readPage(route);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
    assert.ok(ids.includes('signup'));
    for (const id of ['earlyAccess','googleSignup','kitSignup','signupStatus','signupConsent','signupFallback']) {
      assert.ok(ids.includes(id), 'Signup controller requires #' + id);
    }
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]);
    for (const dest of ['/','/venues/','/musicians/','#signup']) assert.ok(links.includes(dest), 'Missing link: ' + dest);
    for (const href of links.filter(h => h.startsWith('/') || h.startsWith('#'))) {
      assert.notEqual(href, '#', 'No dead placeholder links');
      const url = new URL(href, 'https://clefapp.net' + route);
      if (url.pathname.startsWith('/assets/')) {
        assert.ok(existsSync(join(root,url.pathname)), 'Full-size screenshot must exist: '+href);
        continue;
      }
      const destination = readPage(url.pathname);
      if (url.hash) assert.ok(destination.includes('id="' + url.hash.slice(1) + '"'), 'Missing anchor ' + href);
    }
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m=>m[1]);
    for (const asset of assets) {
      const pathname = new URL(asset, 'https://clefapp.net').pathname;
      assert.ok(existsSync(join(root,pathname)), 'Missing asset: '+asset);
    }
    assert.equal((html.match(/data-uid="c338b66b93"/g)||[]).length, 1, 'Exactly one real Kit embed');
    assert.ok(html.includes('href="https://clefapp.net' + route + '"'), 'Canonical must match direct route');
  });
}
test('legacy homepage anchors remain usable', () => {
  const html = readPage('/');
  for (const id of ['hero','problem','solution','features']) assert.ok(html.includes('id="'+id+'"'));
});

test('homepage carries the four conversion hooks in one scroll story', () => {
  const html = readPage('/');
  assert.equal((html.match(/data-story-scene/g)||[]).length, 4);
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  for (const hook of [
    'Book live music— or play it?',
    'An open date. A place to start.',
    'Let your music make the introduction.',
    'Same show. Same page.'
  ]) assert.ok(text.includes(hook), 'Missing hook: '+hook);
});

test('each page contains the backward-compatible three-step signup shell', () => {
  for (const route of routes) {
    const html = readPage(route);
    assert.ok(html.includes('data-signup-wizard'));
    assert.ok(html.includes('City + State/Region'));
    for (const role of ['venue','musician','band']) assert.ok(html.includes(`data-signup-role="${role}"`));
  }
});

test('mobile navigation closes after selection and Escape restores trigger focus', async () => {
  const path = join(root,'assets/navigation.mjs');
  assert.ok(existsSync(path), 'Navigation enhancement must exist');
  const {initMenu} = await import('../assets/navigation.mjs');
  const handlers = {};
  let focused = false;
  const menu = {open:true, querySelector:()=>({focus(){focused=true;}}), addEventListener:(type,fn)=>handlers[type]=fn};
  initMenu(menu);
  handlers.click({target:{closest:()=>({})}});
  assert.equal(menu.open,false);
  menu.open=true;
  let prevented=false;
  handlers.keydown({key:'Escape',preventDefault(){prevented=true;}});
  assert.equal(menu.open,false);
  assert.equal(focused,true);
  assert.equal(prevented,true);
  menu.open=true;
  handlers.keydown({key:'Tab'});
  assert.equal(menu.open,true, 'ordinary keyboard navigation must not close the disclosure');
});
