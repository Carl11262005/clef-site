import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const moduleUrl = new URL('../assets/section-motion.mjs', import.meta.url);
const motion = existsSync(moduleUrl) ? await import(moduleUrl) : {};

function fixture({reduced = false, storage = new Map(), storageBlocked = false} = {}) {
  const makeTarget = (key, top) => {
    const classes = new Set();
    const events = {};
    let entrances = 0;
    return {
      dataset: {sectionMotion: key},
      getBoundingClientRect: () => ({top, bottom: top + 160}),
      classList: {add(name) {classes.add(name); entrances++;}, remove: name => classes.delete(name), contains: name => classes.has(name)},
      addEventListener: (name, handler) => {events[name] = handler;},
      finish() {events.animationend?.({target: this});},
      closest() {return this;},
      get entrances() {return entrances;}
    };
  };
  const visible = makeTarget('visible', 100);
  const later = makeTarget('later', 900);
  const rootEvents = {};
  const root = {querySelectorAll: () => [visible, later], addEventListener: (name, handler) => {rootEvents[name] = handler;}};
  let callback;
  let preferenceChanged;
  const preference = {matches: reduced, addEventListener: (_, handler) => {preferenceChanged = handler;}};
  const view = {
    innerHeight: 700,
    location: {pathname: '/'},
    matchMedia: () => preference,
    get sessionStorage() {
      if (storageBlocked) throw new Error('Storage blocked');
      return {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)};
    },
    IntersectionObserver: class {
      constructor(handler) {callback = handler;}
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  };
  const init = () => {
    assert.equal(typeof motion.initSectionMotion, 'function', 'Section-motion enhancement must exist');
    motion.initSectionMotion(root, view);
  };
  return {root, view, visible, later, init,
    enter(target = later) {callback?.([{target, isIntersecting: true}]);},
    setReduced(value) {preference.matches = value; preferenceChanged?.();},
    focus(target = later) {rootEvents.focusin?.({target});}
  };
}

test('a below-fold section settles in once, without replaying on scroll-back', () => {
  const f = fixture(); f.init(); f.enter();
  assert.equal(f.later.classList.contains('section-arrive'), true);
  f.later.finish(); f.enter();
  assert.equal(f.later.classList.contains('section-arrive'), false);
  assert.equal(f.later.entrances, 1);
});

test('content initially visible never waits for an entrance animation', () => {
  const f = fixture(); f.init(); f.enter(f.visible);
  assert.equal(f.visible.entrances, 0);
});

test('reduced motion skips entrances and cancels an active entrance when enabled', () => {
  const f = fixture({reduced: true}); f.init(); f.enter();
  assert.equal(f.later.entrances, 0);
  f.setReduced(false); f.enter();
  assert.equal(f.later.classList.contains('section-arrive'), true);
  f.setReduced(true);
  assert.equal(f.later.classList.contains('section-arrive'), false);
});

test('keyboard focus makes the target immediate and prevents a later entrance', () => {
  const f = fixture(); f.init(); f.focus(); f.enter();
  assert.equal(f.later.entrances, 0);
});

test('an already seen chapter does not replay after navigating back to its page', () => {
  const storage = new Map();
  const first = fixture({storage}); first.init(); first.enter();
  const next = fixture({storage}); next.init(); next.enter();
  assert.equal(next.later.entrances, 0);
});

test('blocked session storage does not break the visible-content enhancement', () => {
  const f = fixture({storageBlocked: true}); f.init(); f.enter();
  assert.equal(f.later.classList.contains('section-arrive'), true);
});

test('older browsers without intersection observation keep content untouched', () => {
  const f = fixture(); f.view.IntersectionObserver = undefined; f.init();
  assert.equal(f.later.entrances, 0);
});
