import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

// Browser media playback and visibility are platform boundaries. Exercise the
// real controller with deterministic events; actual decoding is checked in-browser.
async function setup({reduced = false, saveData = false, reject = false, pending = false, playlist = false} = {}) {
  const moduleURL = new URL('../assets/performance-video.mjs', import.meta.url);
  assert.ok(existsSync(moduleURL), 'Performance playback controller must exist');
  const {initPerformanceVideo} = await import(moduleURL);
  const video = new EventTarget();
  Object.assign(video, {dataset: {src: '/assets/band-performance.mp4'}, paused: true, src: '', plays: 0,
    play() {
      this.plays++;
      if (reject) return Promise.reject(new Error('Autoplay blocked'));
      if (pending) return new Promise(resolve => { this.finishPlay = () => { this.paused = false; this.dispatchEvent(new Event('playing')); resolve(); }; });
      this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve();
    },
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  });
  video.poster = '/assets/band-performance-poster.jpg';
  if (playlist) Object.assign(video.dataset, {
    nextSrc: '/assets/band-performance-2.mp4', nextPoster: '/assets/band-performance-2-poster.jpg'
  });
  const poster = {src: video.poster};
  const button = new EventTarget();
  Object.assign(button, {hidden: true, textContent: '', attributes:{}, setAttribute(name,value) {this.attributes[name]=value;}});
  const panel = {dataset: {}, querySelector(selector) { return selector === 'video' ? video : poster; }};
  const doc = new EventTarget(); doc.hidden = false;
  doc.querySelector = () => button;
  const motion = new EventTarget(); motion.matches = reduced;
  let observe;
  class IntersectionObserver { constructor(fn) { observe = fn; } observe() {} }
  initPerformanceVideo(panel, {doc, win: {matchMedia: () => motion, IntersectionObserver, navigator: {connection: {saveData}}}});
  return {video, poster, button, panel, motion, doc,
    end() { video.paused = true; video.dispatchEvent(new Event('ended')); },
    visible(value) { observe([{isIntersecting:value, intersectionRatio:value ? 1 : 0}]); },
    click() { button.dispatchEvent(new Event('click')); },
    settle: () => new Promise(resolve => setImmediate(resolve))};
}

test('band media stays unloaded until visible, then plays silently and exposes pause', async () => {
  const x = await setup();
  assert.equal(x.video.src, '');
  x.visible(true); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance.mp4');
  assert.equal(x.video.muted, true);
  assert.equal(x.video.paused, false);
  assert.equal(x.button.textContent, 'Background Motion: On');
  assert.equal(x.panel.dataset.playing, 'true');
});
test('manual pause persists across scrolling away and back', async () => {
  const x = await setup(); x.visible(true); await x.settle(); x.click();
  x.visible(false); x.visible(true); await x.settle();
  assert.equal(x.video.paused, true);
  assert.equal(x.button.textContent, 'Background Motion: Off');
  x.click(); await x.settle(); assert.equal(x.video.paused, false);
});
test('offscreen and hidden documents pause video without losing automatic resume', async () => {
  const x = await setup(); x.visible(true); await x.settle();
  x.visible(false); assert.equal(x.video.paused, true);
  x.visible(true); await x.settle(); assert.equal(x.video.paused, false);
  x.doc.hidden = true; x.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(x.video.paused, true);
  x.doc.hidden = false; x.doc.dispatchEvent(new Event('visibilitychange')); await x.settle(); assert.equal(x.video.paused, false);
});
for (const preference of ['reduced', 'saveData']) {
  test(preference + ' defaults to a still without downloading video, but allows deliberate playback', async () => {
    const x = await setup({[preference]:true}); x.visible(true); await x.settle();
    assert.equal(x.video.src, ''); assert.equal(x.video.paused, true);
    x.click(); await x.settle(); assert.equal(x.video.paused, false);
  });
}
test('changing reduced-motion preference stops playback and returns to the poster', async () => {
  const x = await setup(); x.visible(true); await x.settle();
  x.motion.matches = true; x.motion.dispatchEvent(new Event('change'));
  assert.equal(x.video.paused, true); assert.equal(x.panel.dataset.playing, 'false');
});
test('autoplay rejection keeps the poster and lets visitors try the play control', async () => {
  const x = await setup({reject:true}); x.visible(true); await x.settle();
  assert.equal(x.panel.dataset.playing, 'false'); assert.equal(x.button.hidden, false);
  assert.equal(x.button.textContent, 'Background Motion: Off');
  x.click(); await x.settle(); assert.equal(x.video.plays, 2);
});
test('loading failure returns to a clean still, without a broken play control', async () => {
  const x = await setup(); x.visible(true); await x.settle();
  x.video.dispatchEvent(new Event('error'));
  assert.equal(x.panel.dataset.playing, 'false'); assert.equal(x.video.paused, true);
  assert.equal(x.button.hidden, true);
  x.visible(false); x.visible(true); await x.settle(); assert.equal(x.video.plays, 1);
});
test('a late play resolution cannot restart offscreen video', async () => {
  const x = await setup({pending:true}); x.visible(true); x.visible(false);
  x.video.finishPlay(); await x.settle();
  assert.equal(x.video.paused, true); assert.equal(x.panel.dataset.playing, 'false');
});
test('another video takes priority, then band playback resumes unless manually paused', async () => {
  const x = await setup(); x.visible(true); await x.settle();
  const player = {tagName:'VIDEO'};
  const send = type => {
    const event = new Event(type);
    Object.defineProperty(event, 'target', {value:player});
    x.doc.dispatchEvent(event);
  };
  send('play'); assert.equal(x.video.paused, true);
  send('pause'); await x.settle(); assert.equal(x.video.paused, false);
  x.click(); send('play'); send('ended'); await x.settle();
  assert.equal(x.video.paused, true, 'finishing a demo must not undo a visitor pause');
});
test('footer setting can disable motion while the background is already offscreen', async () => {
  const x = await setup(); x.visible(true); await x.settle(); x.visible(false);
  assert.equal(x.button.attributes['aria-pressed'], 'true');
  x.click(); x.visible(true); await x.settle();
  assert.equal(x.video.paused, true);
  assert.equal(x.button.attributes['aria-pressed'], 'false');
  x.visible(false); x.click();
  assert.equal(x.video.paused, true, 'enabling motion below the fold must not start hidden media');
  x.visible(true); await x.settle(); assert.equal(x.video.paused, false);
});

test('finished clips play in sequence and return to the first clip with matching stills', async () => {
  const x = await setup({playlist:true}); x.visible(true); await x.settle();
  x.end(); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance-2.mp4');
  assert.equal(x.video.poster, '/assets/band-performance-2-poster.jpg');
  assert.equal(x.poster.src, x.video.poster);
  assert.equal(x.video.paused, false);
  x.end(); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance.mp4');
  assert.equal(x.poster.src, '/assets/band-performance-poster.jpg');
  assert.equal(x.video.paused, false);
});

test('an offscreen ending defers the next download until the background is visible', async () => {
  const x = await setup({playlist:true}); x.visible(true); await x.settle();
  x.visible(false); x.end(); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance.mp4');
  assert.equal(x.video.paused, true);
  x.visible(true); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance-2.mp4');
  assert.equal(x.video.paused, false);
});

test('reduced motion prevents a finished clip from starting the next one', async () => {
  const x = await setup({playlist:true}); x.visible(true); await x.settle();
  x.motion.matches = true; x.motion.dispatchEvent(new Event('change')); x.end(); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance.mp4');
  assert.equal(x.video.paused, true);
  x.click(); await x.settle();
  assert.equal(x.video.src, '/assets/band-performance-2.mp4');
});

test('a second-clip failure retains its matching fallback image and stops playback', async () => {
  const x = await setup({playlist:true}); x.visible(true); await x.settle();
  x.end(); await x.settle(); x.video.dispatchEvent(new Event('error'));
  assert.equal(x.poster.src, '/assets/band-performance-2-poster.jpg');
  assert.equal(x.panel.dataset.playing, 'false');
  assert.equal(x.video.paused, true);
  assert.equal(x.button.hidden, true);
});
