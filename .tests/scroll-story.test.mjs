import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const moduleUrl = new URL('../assets/scroll-story.mjs', import.meta.url);
const motion = existsSync(moduleUrl) ? await import(moduleUrl) : {};

function fixture({reduced = false, desktop = true} = {}) {
  const scenes = Array.from({length: 4}, () => {
    const control={attrs:{},getAttribute(name){return this.attrs[name]??null;},setAttribute(name,value){this.attrs[name]=String(value);},removeAttribute(name){delete this.attrs[name];}};
    return {style: {setProperty(name,value){this[name]=value;},removeProperty(name){delete this[name];}}, attrs:{}, control, querySelectorAll(){return [control];}, setAttribute(name,value){this.attrs[name]=String(value);}, removeAttribute(name) { delete this.attrs[name]; if (name === 'style') this.style = {}; }};
  });
  const story = {
    dataset: {}, offsetHeight: 2500,
    getBoundingClientRect: () => ({top: -500, bottom: 2000}),
    querySelectorAll: selector => selector === '[data-story-scene]' ? scenes : [],
  };
  const preference = new EventTarget(); preference.matches = reduced;
  let scrollHandler; let resizeHandler; let observed;
  const view = {
    innerHeight: 1000,
    matchMedia: query => query.includes('prefers-reduced-motion') ? preference : {matches:desktop},
    requestAnimationFrame(callback) { callback(); return 0; },
    cancelAnimationFrame() {},
    addEventListener(type, callback) { if (type === 'scroll') scrollHandler = callback; if (type === 'resize') resizeHandler = callback; },
    removeEventListener() {},
    IntersectionObserver: class { constructor(callback) { observed = callback; } observe() {} disconnect() {} },
  };
  const root = {querySelectorAll: selector => selector === '[data-scroll-story]' ? [story] : []};
  return {root, view, story, scenes,
    init() { assert.equal(typeof motion.initScrollStory, 'function'); return motion.initScrollStory(root, view); },
    visible(value = true) { observed?.([{target: story, isIntersecting: value}]); },
    scroll() { scrollHandler?.(); }, resize() { resizeHandler?.(); },
  };
}

test('native scroll progress layers four scenes without moving readable children independently', () => {
  const x = fixture(); x.init(); x.visible(); x.scroll();
  assert.equal(x.story.dataset.storyEnhanced, 'true');
  assert.match(x.scenes[0].style.transform, /scale\(0\.97/);
  assert.match(x.scenes[1].style.transform, /translate3d\(0, 0\.000%/);
  assert.match(x.scenes[2].style.transform, /translate3d\(0, 100\.000%/);
  assert.equal(x.scenes[3].style.opacity, '');
  assert.equal(x.scenes[0].style['--story-dim'], '0.100');
  assert.equal(x.scenes[0].attrs['aria-hidden'], undefined, 'story copy remains available to assistive technology');
  assert.equal(x.scenes[0].control.attrs.tabindex, '-1');
  assert.equal(x.scenes[1].control.attrs.tabindex, undefined);
});

test('scrolling backward deterministically restores earlier scene positions', () => {
  const x = fixture(); x.init(); x.visible(); x.scroll();
  x.story.getBoundingClientRect = () => ({top: 0, bottom: 2500}); x.scroll();
  assert.match(x.scenes[0].style.transform, /scale\(1\.00000\)/);
  assert.match(x.scenes[1].style.transform, /translate3d\(0, 100\.000%/);
});

test('reduced motion leaves every scene readable in ordinary document flow', () => {
  const x = fixture({reduced: true}); x.init();
  assert.equal(x.story.dataset.storyEnhanced, undefined);
  for (const scene of x.scenes) {
    assert.equal(scene.style.transform, '');
    assert.equal(scene.style.opacity, '');
    assert.equal(scene.style.willChange, '');
    assert.equal(scene.attrs['aria-hidden'], undefined);
    assert.equal(scene.control.attrs.tabindex, undefined);
  }
});

test('offscreen stories release compositor hints and teardown removes enhancement', () => {
  const x = fixture(); const destroy = x.init(); x.visible();
  assert.equal(x.scenes[0].style.willChange, 'transform');
  x.visible(false);
  assert.equal(x.scenes[0].style.willChange, '');
  destroy();
  assert.equal(x.story.dataset.storyEnhanced, undefined);
});

test('mobile and short screens stay in natural document flow', () => {
  const x = fixture({desktop:false}); x.init();
  assert.equal(x.story.dataset.storyEnhanced,undefined);
  for (const scene of x.scenes) assert.equal(scene.style.transform,'');
});
