import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('playwright')); } catch { /* Browser checks require optional Playwright. */ }
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

async function openPage(browser, htmlPath, {width = 1280, reducedMotion = false, hasTouch = false} = {}) {
  const page = await browser.newPage({viewport: {width, height: 800}, hasTouch, reducedMotion: reducedMotion ? 'reduce' : 'no-preference'});
  const html = read(htmlPath).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<link\b[^>]*>/g, '');
  await page.setContent(html.replace('</head>', `<style>${read('../assets/website.css')}</style></head>`));
  const controller = new URL('../assets/parallax.mjs', import.meta.url);
  if (existsSync(controller)) await page.addScriptTag({type: 'module', content: read('../assets/parallax.mjs')});
  return page;
}

test('desktop parallax is limited to the opening performance media', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await openPage(browser, '../index.html');
    assert.equal(await page.locator('[data-parallax="hero"] :is(img, video)').count(), 2);
    assert.equal(await page.locator('[data-parallax="photo"] img').count(), 0);
    assert.equal(await page.locator('h1[data-parallax], h2[data-parallax], p[data-parallax], a[data-parallax]').count(), 0,
      'readable content must not drift with scroll');
    assert.notEqual(await page.locator('.performance-image').evaluate(node => node.style.translate), '',
      'the visible hero image receives a scroll-linked offset');
    assert.equal(await page.locator('.company-photo img').evaluate(node => node.style.translate), '',
      'company copy remains calm while the CSS cinematic reveal handles its image');
  } finally { await browser.close(); }
});

test('parallax stays off on mobile and in reduced-motion mode', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    for (const options of [{width: 375, hasTouch: true}, {width: 560, hasTouch: true}, {width: 1280, reducedMotion: true}]) {
      const page = await openPage(browser, '../index.html', options);
      assert.equal(await page.locator('.performance-image').evaluate(node => node.style.translate), '');
      assert.equal(await page.locator('.story-photo img').first().evaluate(node => node.style.translate), '');
      await page.close();
    }
  } finally { await browser.close(); }
});

test('a narrow desktop preview with a mouse still shows parallax', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await openPage(browser, '../venues/index.html', {width: 560});
    await page.locator('.editorial-photo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    assert.notEqual(await page.locator('.editorial-photo img').evaluate(node => node.style.translate), '');
  } finally { await browser.close(); }
});

test('audience pages use one quiet photographic parallax moment', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    for (const route of ['../venues/index.html', '../musicians/index.html']) {
      const page = await openPage(browser, route);
      assert.equal(await page.locator('.editorial-photo[data-parallax="photo"]').count(), 1);
      await page.locator('.editorial-photo').scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      assert.notEqual(await page.locator('.editorial-photo img').evaluate(node => node.style.translate), '');
      await page.close();
    }
  } finally { await browser.close(); }
});
